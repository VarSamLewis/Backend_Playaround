# Backend_Playaround

This is my first attempt at building a backend of an app, it's supposed to mimic a payment system from Stripe. I decided to do everything in Docker so that I could play around with Node.js and Go without installations. That was a mistake. Debugging was an experience I never want to repeat. 

---

## Stack Overview

| Service      | Role                                 | Language   |
|-------------|--------------------------------------|------------|
| Node.js API | Receives webhooks, caches in Redis   | Node.js    |
| Go Worker   | Polls Redis, pushes to Postgres      | Go         |
| Redis       | Caching layer for transient payloads | Redis      |
| PostgreSQL  | Persistent storage for webhook data  | Postgres   |

---

## Project Status

### What’s Working
- `Node.js API` accepts incoming `POST /webhook` payloads and stores them in Redis with expiry.
- `GET /customer/:id` retrieves stored customer data from Redis.
- Docker Compose orchestrates all services on a shared internal network.
- Redis and Postgres are accessible across services.
- Table `payment_payloads` successfully created in Postgres.
- Go Worker compiles using Go 1.23+, and runs in Docker, inserting payloads into Postgres.

### Redis Payload Format

Each payload expires after 15 minutes.

---

##  Go Worker

- Polls Redis periodically for payment keys
- Unmarshals JSON payloads
- Inserts into Postgres (`payment_payloads`)
- Optionally deletes Redis keys after successful writes

---

## Useful Commands



Build and start the Node API container	
```bash
docker-compose up --build -d node-api
```
Start all services (Redis, Postgres, etc.)	
```bash
docker-compose up --build -d
```

Restart a specific service
```bash
docker-compose restart node-api
```

Stop all services	
```bash
docker-compose down
```

View running containers	
```bash
docker ps
```

View container logs live	
```bash
docker logs backend_playaround-node-api-1 -f
```

Check logs once	
```bash
docker logs backend_playaround-node-api-1
```

Rebuild and restart everything	
```bash
docker-compose up --build -d
```

View Postgres error output
```bash
docker logs backend_playaround-postgres-1
```

Call the payments endpoint	
```bash
curl http://localhost:3000/api/customers/cus_test123/payments
```

View the swagger docs: http://localhost:3000/api-docs
