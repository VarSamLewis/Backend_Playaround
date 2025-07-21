const express = require('express');
const bodyParser = require('body-parser'); //
const Redis = require('ioredis'); // Redis is my caching layer
const paymentsRouter = require('./routes/rest_api');

const app = express(); // This builds the express app?
app.use(bodyParser.json()) 

// connect to Redis
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
});

// webhook endpoint
app.post('/webhook', async (req, res) => {
    const payload = req.body;
    const customerID = payload?.data?.object?.customer || 'unknown';

    // Simple Redis key format
    const key = `customer:${customerID}:payment:${Date.now()}`;
    const value = JSON.stringify(payload);
    console.log('Writing to Redis:', key);
    try {
        await redis.set(key, JSON.stringify(payload), 'EX', 900); // expires in 15 mins
        console.log('Redis set:', key);
    } catch (err) {
        console.error('Redis error:', err);
    }

    res.sendStatus(200);
    console.log('Customer ID:', customerID);

});

//  API endpoint to retrieve customer + paymetn payloads
app.get('/customer/:id', async (req, res) => {
    const keys = await redis.keys(`customer:${req.params.id}:*`);
    const payloads = await Promise.all(keys.map(k => redis.get(k)));
    res.json(payloads.map(p => JSON.parse(p)));
});

app.use('/api', paymentsRouter);

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.listen(3000, '0.0.0.0', () => {
    console.log('Node API is running on port 3000');
})