import { createHmac, timingSafeEqual } from 'node:crypto';

// The signed string is "<timestamp>.<raw body>". Including the timestamp
// is what lets the receiver reject replayed deliveries.
export function sign(secret, timestamp, rawBody) {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `sha256=${digest}`;
}

export function isValidSignature(secret, timestamp, rawBody, received) {
  const expected = Buffer.from(sign(secret, timestamp, rawBody));
  const actual = Buffer.from(received ?? '');
  // timingSafeEqual throws on length mismatch, so check that first.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
