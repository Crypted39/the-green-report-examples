import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('toggle notification preferences', async ({ page }) => {
  await exerciseSharedRecord(page, 'notifications-spec', 'notifications');
});
