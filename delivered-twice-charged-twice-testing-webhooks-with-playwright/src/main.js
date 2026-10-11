import { createReceiver } from './receiver.js';
import { createStore } from './store.js';

const port = process.env.PORT ?? 4000;
const secret = process.env.WEBHOOK_SECRET ?? 'whsec_local_dev_only';

createReceiver({ secret, store: createStore() }).listen(port, () => {
  console.log(`Webhook receiver listening on http://localhost:${port}/webhooks/billing`);
});
