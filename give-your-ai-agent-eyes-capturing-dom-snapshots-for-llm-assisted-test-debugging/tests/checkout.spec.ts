import { test, expect } from './fixtures';

test('user can submit an order', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Submit Order' }).click();

  await expect(page.getByText('Order confirmed')).toBeVisible();
});

// This test targets the ?bug=1 version of the demo site, where the submit
// button's accessible name silently changes to "Place Order". It fails on
// purpose so you can see the fixture in tests/fixtures.ts capture a
// screenshot + ARIA snapshot into the failures/ folder automatically.
test('user can submit an order (bug simulation)', async ({ page }) => {
  await page.goto('/?bug=1');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Submit Order' }).click();

  await expect(page.getByText('Order confirmed')).toBeVisible();
});
