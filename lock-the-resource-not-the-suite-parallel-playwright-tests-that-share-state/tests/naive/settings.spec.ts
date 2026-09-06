import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('update user settings', async ({ page }) => {
  await exerciseSharedRecord(page, 'settings-spec', 'displayName');
});
