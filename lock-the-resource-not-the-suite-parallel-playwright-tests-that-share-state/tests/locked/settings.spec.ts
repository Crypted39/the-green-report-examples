import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('update user settings', { lock: 'user-settings' }, async ({ page }) => {
  await exerciseSharedRecord(page, 'settings-spec', 'displayName');
});
