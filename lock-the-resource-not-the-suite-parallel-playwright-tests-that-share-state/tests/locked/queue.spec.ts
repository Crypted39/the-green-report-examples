import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

// Touches the report queue only. Nothing to do with account settings,
// so it is free to run alongside the 'user-settings' tests.
test('enqueue a report run', { lock: 'report-queue' }, async ({ page }) => {
  await exerciseSharedRecord(page, 'queue-spec', 'plan', { resource: 'queue', rounds: 2 });
});
