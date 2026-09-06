import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

// Touches both shared resources, so it declares both locks. It waits for
// each one, and holds both for its whole duration - which is exactly why
// you want the smallest lock set a test can honestly get away with.
test('export account report', { lock: ['user-settings', 'report-queue'] }, async ({ page }) => {
  await exerciseSharedRecord(page, 'report-spec', 'plan', { rounds: 2 });
  await exerciseSharedRecord(page, 'report-spec', 'email', { resource: 'queue', rounds: 2 });
});
