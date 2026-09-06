import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('change billing email', { lock: 'user-settings' }, async ({ page }) => {
  await exerciseSharedRecord(page, 'billing-spec', 'email');
});
