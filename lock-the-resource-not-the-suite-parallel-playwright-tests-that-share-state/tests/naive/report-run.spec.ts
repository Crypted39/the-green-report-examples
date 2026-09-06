import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

// Touches both shared resources: reads the account, then queues a job.
test('export account report', async ({ page }) => {
  await exerciseSharedRecord(page, 'report-spec', 'plan', { rounds: 2 });
  await exerciseSharedRecord(page, 'report-spec', 'email', { resource: 'queue', rounds: 2 });
});
