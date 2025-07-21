package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"
    "time"

    "github.com/go-redis/redis/v8"
    "github.com/jackc/pgx/v5"
)

var (
    rdb     *redis.Client
    pgConn  *pgx.Conn
    ctx     = context.Background()
)

func main() {
    // redis
    rdb = redis.NewClient(&redis.Options{
        Addr: os.Getenv("REDIS_HOST") + ":6379",
    })
    // Postgres
    var err error
    pgConn, err = pgx.Connect(ctx, fmt.Sprintf("postgres://postgres:postgres@%s:5432/backenddb", os.Getenv("POSTGRES_HOST")))
    if err != nil {
        log.Fatalf("Postgres error: %v", err)
    }
    defer pgConn.Close(ctx)

    for {
        processRedisBatch()
        time.Sleep(10 * time.Second)
    }
}

func processRedisBatch() {

    time.Sleep(5 * time.Second) // Delay to aid debugging

    keys, err := rdb.Keys(ctx, "customer:*:payment:*").Result()
    if err != nil {
        log.Printf("Error fetching keys: %v", err)
        return
    }

    for _, k := range keys {
        val, err := rdb.Get(ctx, k).Result()
        if err != nil {
            log.Printf("Error getting value for key %s: %v", k, err)
            continue
        }
        
        var payload map[string]interface{}
        if err := json.Unmarshal([]byte(val), &payload); err != nil {
            log.Printf("Error unmarshalling JSON for key %s: %v", k, err)
            continue
        }
        // Example: write JSON payload string to Postgres
        _, err = pgConn.Exec(ctx, "INSERT INTO payment_payloads (key, payload) VALUES ($1, $2)", k, val)
        if err != nil {
            log.Println("Postgres insert error:", err)
            continue
        }

        // Optionally delete after saving
        _ = rdb.Del(ctx, k).Err()
    }
}