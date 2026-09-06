import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('change billing email', async ({ page }) => {
  await exerciseSharedRecord(page, 'billing-spec', 'email');
});
