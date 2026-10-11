import { test as base, expect } from '@playwright/test';
import { createReceiver } from '../src/receiver.js';
import { createStore } from '../src/store.js';
import { sign } from '../src/signature.js';

export const SECRET = 'whsec_test_secret';

export const test = base.extend({
  // A fresh receiver and store per test, on a random free port, so tests
  // can run in parallel without sharing state.
  receiver: async ({}, use) => {
    const store = createStore({ delayMs: 20 }); // widens the window for concurrent duplicates
    const server = createReceiver({ secret: SECRET, store });
    await new Promise((resolve) => server.listen(0, resolve));

    await use({
      url: `http://localhost:${server.address().port}/webhooks/billing`,
      store,
    });

    await new Promise((resolve) => server.close(resolve));
  },

  // Plays the role of the webhook sender: serializes the event, signs it, and
  // POSTs it with Playwright's `request` fixture. Options let a test break
  // one part of the request at a time.
  deliver: async ({ request, receiver }, use) => {
    await use((event, options = {}) => {
      const {
        secret = SECRET,
        timestamp = Math.floor(Date.now() / 1000),
        body = JSON.stringify(event),
        signedBody = body, // what the signature was computed over
      } = options;

      return request.post(receiver.url, {
        headers: {
          'content-type': 'application/json',
          'x-webhook-timestamp': String(timestamp),
          'x-webhook-signature': sign(secret, timestamp, signedBody),
        },
        data: body,
      });
    });
  },
});

export { expect };

export function buildEvent({ id, type, subscriptionId = 'sub_1', status, version }) {
  return { id, type, data: { subscriptionId, status, version } };
}
