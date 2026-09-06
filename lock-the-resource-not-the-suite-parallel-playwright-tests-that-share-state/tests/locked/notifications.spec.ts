import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('toggle notification preferences', { lock: 'user-settings' }, async ({ page }) => {
  await exerciseSharedRecord(page, 'notifications-spec', 'notifications');
});
