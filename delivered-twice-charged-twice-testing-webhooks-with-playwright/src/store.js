const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The "business" side of the receiver: subscription state plus one visible
// side effect (a welcome email). The email is what a duplicate delivery
// would send twice, so tests can assert on it.
export function createStore({ delayMs = 0 } = {}) {
  const subscriptions = new Map(); // id -> { status, version }
  const emailsSent = [];
  let failuresLeft = 0;

  return {
    subscriptions,
    emailsSent,

    // Make the next N calls to apply() fail, to simulate a database outage.
    failNext(count = 1) {
      failuresLeft = count;
    },

    async apply(event) {
      await sleep(delayMs); // widens the window for concurrent duplicates

      if (failuresLeft > 0) {
        failuresLeft--;
        throw new Error('database unavailable');
      }

      const { subscriptionId, status, version } = event.data;
      const current = subscriptions.get(subscriptionId);

      // Only move state forward. A late-arriving older event must not
      // overwrite a newer one.
      if (!current || version > current.version) {
        subscriptions.set(subscriptionId, { status, version });
      }

      if (event.type === 'subscription.created') {
        emailsSent.push(subscriptionId);
      }
    },
  };
}
