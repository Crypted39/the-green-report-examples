# Webhook testing example

A small billing-webhook receiver and the tests that prove it behaves correctly. It is the companion code for The Green Report article on testing webhooks.

The receiver has no runtime dependencies. The tests use Playwright's `request` fixture (API testing only, so no browsers to download). Needs Node 20+.

```
npm install
npm test      # run the suite
npm start     # run the receiver on http://localhost:4000/webhooks/billing
```

## What the receiver does

`POST /webhooks/billing` accepts events like:

```json
{ "id": "evt_1", "type": "subscription.created", "data": { "subscriptionId": "sub_1", "status": "active", "version": 1 } }
```

Each request must carry two headers:

- `x-webhook-timestamp`: Unix time in seconds
- `x-webhook-signature`: `sha256=` + HMAC-SHA256 of `"<timestamp>.<raw body>"`

The receiver then runs four checks in order:

| Step | Check | Failure response |
|------|-------|------------------|
| 1 | Signature matches the raw body | `401` |
| 2 | Timestamp within 5 minutes | `401` |
| 3 | Event ID not seen before | `200` `{"status":"duplicate"}` |
| 4 | Processing succeeds | `500` (sender should retry) |

`subscription.created` also triggers a "welcome email" (recorded in `store.emailsSent`), which gives the tests a side effect to count.

## What the tests cover

| Area | Test |
|------|------|
| Signature | valid event accepted |
| Signature | tampered body rejected |
| Signature | wrong secret rejected |
| Signature | stale timestamp (replay) rejected |
| Idempotency | sequential redelivery applied once |
| Idempotency | 5 simultaneous deliveries applied once |
| Ordering | late `v1` does not overwrite `v2` |
| Retry | 500 on failure, retry succeeds, side effect happens once |

## Layout

```
src/signature.js   sign() and isValidSignature()
src/store.js       in-memory subscriptions, welcome-email log, failure injection
src/receiver.js    the HTTP handler with the four checks
src/main.js        starts the receiver
test/fixtures.js   `receiver` fixture (fresh server + store per test) and
                   `deliver` fixture (signs and POSTs via the request fixture)
test/webhook.spec.js
playwright.config.js
```

## Known simplifications

- State is in memory. A real receiver would use a unique constraint on event ID in the database, so idempotency survives restarts and works across several instances.
- A duplicate that arrives while the first delivery is still processing gets `200 duplicate`. If that first delivery then fails, the sender retries it. This is fine because the first request's `500` triggers the retry.
