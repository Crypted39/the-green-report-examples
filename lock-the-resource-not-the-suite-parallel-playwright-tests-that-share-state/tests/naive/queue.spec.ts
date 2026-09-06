import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

// Touches the report queue only. Nothing to do with account settings.
test('enqueue a report run', async ({ page }) => {
  await exerciseSharedRecord(page, 'queue-spec', 'plan', { resource: 'queue', rounds: 2 });
});
