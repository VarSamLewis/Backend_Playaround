const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pgPool = new Pool({
    host: process.env.PG_HOST || 'postgres',
    user: 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: 'backenddb',
    port: 5432,
});

// Babies 1st REST API 
router.get('/customers/:id/payments', async (req, res) => {
    const customerId = req.params.id;
    const {
        min_amount,
        created_after,
        created_before,
        sort = 'created_at',
        order = 'desc',
        limit = 25
    } = req.query;

    let query = `
        SELECT key, payload, created_at
        FROM payment_payloads
        WHERE payload->'data'->'object'->>'customer' = $1
    `;

    const params = [customerId];
    let paramIdx = 2;

    // Dynamic filters
    if (min_amount) {
        query += ` AND (payload->'data'->'object'->>'amount')::int >= $${paramIdx++}`;
        params.push(min_amount);
    }

    if (created_after) {
        query += ` AND created_at >= $${paramIdx++}`;
        params.push(created_after);
    }

    if (created_before) {
        query += ` AND created_at <= $${paramIdx++}`;
        params.push(created_before);
    }

    // Ordering and limit
    query += ` ORDER BY ${sort} ${order === 'asc' ? 'ASC' : 'DESC'} LIMIT $${paramIdx}`;
    params.push(limit);

    try {
        const { rows } = await pgPool.query(query, params);

        const payments = rows.map(row => ({
            key: row.key,
            amount: row.payload.data.object.amount || null,
            created_at: row.created_at,
        }));

        res.json({ customer: customerId, filters: req.query, payments });
    } catch (err) {
        console.error('Postgres query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
