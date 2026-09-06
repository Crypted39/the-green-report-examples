import { test } from '@playwright/test';
import { exerciseSharedRecord } from '../helpers/settings';

test('rename user', async ({ page }) => {
  await exerciseSharedRecord(page, 'profile-spec', 'displayName');
});
