import { createServer } from 'node:http';
import { isValidSignature } from './signature.js';

const MAX_BODY_BYTES = 1024 * 1024;

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function reply(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export function createReceiver({
  secret,
  store,
  toleranceSeconds = 300,
  now = () => Date.now(),
}) {
  // Event IDs that are processed or currently being processed.
  const claimed = new Set();

  return createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhooks/billing') {
      return reply(res, 404, { error: 'not found' });
    }

    let rawBody;
    try {
      rawBody = await readRawBody(req);
    } catch {
      return reply(res, 413, { error: 'payload too large' });
    }

    // 1. Authenticity: verify the signature against the RAW body, before parsing.
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];
    if (!timestamp || !signature) {
      return reply(res, 401, { error: 'missing signature headers' });
    }
    if (!isValidSignature(secret, timestamp, rawBody, signature)) {
      return reply(res, 401, { error: 'invalid signature' });
    }

    // 2. Freshness: a valid signature on an old request is still a replay.
    const ageSeconds = Math.abs(now() / 1000 - Number(timestamp));
    if (!(ageSeconds <= toleranceSeconds)) {
      return reply(res, 401, { error: 'timestamp outside tolerance' });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return reply(res, 400, { error: 'malformed JSON' });
    }

    // 3. Idempotency: claim the event ID synchronously, before any await,
    // so two concurrent deliveries cannot both get past this line.
    if (claimed.has(event.id)) {
      return reply(res, 200, { status: 'duplicate' });
    }
    claimed.add(event.id);

    // 4. Process. On failure, release the claim and return 5xx so the
    // sender retries instead of treating the event as delivered.
    try {
      await store.apply(event);
    } catch {
      claimed.delete(event.id);
      return reply(res, 500, { error: 'processing failed' });
    }

    return reply(res, 200, { status: 'processed' });
  });
}
