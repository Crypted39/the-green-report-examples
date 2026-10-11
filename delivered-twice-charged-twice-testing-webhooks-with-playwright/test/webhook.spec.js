import { test, expect, buildEvent } from './fixtures.js';

const created = buildEvent({ id: 'evt_1', type: 'subscription.created', status: 'active', version: 1 });
const updated = buildEvent({ id: 'evt_2', type: 'subscription.updated', status: 'past_due', version: 2 });

test.describe('signature verification', () => {
  test('accepts a correctly signed event', async ({ deliver, receiver }) => {
    const res = await deliver(created);

    expect(res.status()).toBe(200);
    expect(receiver.store.subscriptions.get('sub_1')).toEqual({ status: 'active', version: 1 });
  });

  test('rejects a body that was tampered with after signing', async ({ deliver, receiver }) => {
    const tampered = JSON.stringify({ ...created, data: { ...created.data, status: 'canceled' } });

    const res = await deliver(created, { body: tampered, signedBody: JSON.stringify(created) });

    expect(res.status()).toBe(401);
    expect(receiver.store.subscriptions.size).toBe(0);
  });

  test('rejects an event signed with the wrong secret', async ({ deliver, receiver }) => {
    const res = await deliver(created, { secret: 'whsec_attacker' });

    expect(res.status()).toBe(401);
    expect(receiver.store.subscriptions.size).toBe(0);
  });

  test('rejects a validly signed event with a stale timestamp (replay)', async ({ deliver, receiver }) => {
    const tenMinutesAgo = Math.floor(Date.now() / 1000) - 600;

    const res = await deliver(created, { timestamp: tenMinutesAgo });

    expect(res.status()).toBe(401);
    expect(receiver.store.subscriptions.size).toBe(0);
  });
});

test.describe('idempotency', () => {
  test('a redelivered event is acknowledged but applied once', async ({ deliver, receiver }) => {
    const first = await deliver(created);
    const second = await deliver(created);

    expect(await first.json()).toEqual({ status: 'processed' });
    expect(second.status()).toBe(200);
    expect(await second.json()).toEqual({ status: 'duplicate' });
    expect(receiver.store.emailsSent).toHaveLength(1);
  });

  test('simultaneous deliveries of the same event are applied once', async ({ deliver, receiver }) => {
    const responses = await Promise.all(Array.from({ length: 5 }, () => deliver(created)));
    const bodies = await Promise.all(responses.map((r) => r.json()));

    expect(responses.every((r) => r.status() === 200)).toBe(true);
    expect(bodies.filter((b) => b.status === 'processed')).toHaveLength(1);
    expect(receiver.store.emailsSent).toHaveLength(1);
  });
});

test.describe('ordering', () => {
  test('an older event arriving late does not overwrite newer state', async ({ deliver, receiver }) => {
    await deliver(updated); // v2 arrives first
    await deliver(created); // v1 arrives late

    expect(receiver.store.subscriptions.get('sub_1')).toEqual({ status: 'past_due', version: 2 });
  });
});

test.describe('failure and retry', () => {
  test('a failed delivery returns 5xx, and the retry is applied exactly once', async ({ deliver, receiver }) => {
    receiver.store.failNext(1);

    const first = await deliver(created);
    expect(first.status()).toBe(500);
    expect(receiver.store.emailsSent).toHaveLength(0);

    const retry = await deliver(created);
    expect(retry.status()).toBe(200);
    expect(await retry.json()).toEqual({ status: 'processed' });

    const afterRetry = await deliver(created);
    expect(await afterRetry.json()).toEqual({ status: 'duplicate' });
    expect(receiver.store.emailsSent).toHaveLength(1);
  });
});
