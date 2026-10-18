# Concurrent users load test example

A single k6 script that turns a traffic estimate into a realistic peak-hour load test. It is the companion code for The Green Report article "Registered Is Not Concurrent: How to Pick Concurrent Users for a Load Test".

Needs [k6](https://k6.io/docs/get-started/installation/) 1.2+ and an application to test that answers `GET /api/items`.

```
k6 run -e BASE_URL=https://staging.example.com peak-hour.js
k6 run -e BASE_URL=https://staging.example.com -e LOAD_FACTOR=1.5 peak-hour.js
```

Only run it against an environment you own or have permission to load test.

## Where the numbers come from

The example funnel from the article:

| Step | Value |
|------|-------|
| Registered users | 50,000 |
| Daily active users | 15,000 (30%) |
| Sessions per day | 15,000 (1 each) |
| Peak-hour share | 12%, so 1,800 sessions |
| Session duration | 6 minutes |

Little's Law then gives the concurrent users: 0.5 sessions per second × 360 seconds = **180 concurrent users**. A session of 30 requests over 360 seconds means one request every 12 seconds, which is the think time, and 180 users at that pace produce about 15 requests per second.

## What the script does

- `constant-arrival-rate` is an open model. It starts 30 new sessions per minute no matter how the application responds, and each iteration is one complete user session.
- Each session sends 30 requests with a random pause of 8 to 16 seconds between them (12 seconds on average).
- `LOAD_FACTOR` scales the arrival rate and the VU pool, so the same script runs at 1x, 1.5x or 2x (180, 270 or 360 concurrent users).
- `preAllocatedVUs` is set a little above the 180 calculated users so k6 does not create users mid-run, and `maxVUs` is the ceiling.
- `duration` is 20 minutes. One session lasts about 6 minutes, so the run needs to be much longer than that to spend time at the plateau.

## Thresholds

| Metric | Limit |
|--------|-------|
| `http_req_failed` | under 1% |
| `http_req_duration` | p(95) under 500 ms |
| `dropped_iterations` | 0 (k6 started every session on schedule) |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `http://localhost:3000` | Application under test |
| `LOAD_FACTOR` | `1` | Multiplier applied to the peak-hour load |
