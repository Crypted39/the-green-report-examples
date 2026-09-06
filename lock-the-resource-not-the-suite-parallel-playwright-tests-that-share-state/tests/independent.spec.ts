import { test, expect } from '@playwright/test';

// The other 20 tests. They touch nothing shared, and they are the ones
// that pay the bill when the suite gets serialized to protect the four
// tests that do.
for (let id = 1; id <= 20; id++) {
  test(`widget ${id} renders its rows`, async ({ page }) => {
    await page.goto(`/widget/${id}`);
    await expect(page.locator('#widget-title')).toHaveText(`Widget ${id}`);
    await expect(page.locator('#widget-items li')).toHaveCount(3);
    await expect(page.locator('#widget-items li').first()).toHaveText(`row-${id}-a`);
  });
}
