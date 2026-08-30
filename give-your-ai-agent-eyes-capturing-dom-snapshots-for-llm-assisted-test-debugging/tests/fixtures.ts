import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const FAILURES_DIR = 'failures';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page); // the test body runs here

    if (testInfo.status !== testInfo.expectedStatus) {
      fs.mkdirSync(FAILURES_DIR, { recursive: true });
      const name = testInfo.title.replace(/\s+/g, '_');

      // Screenshot at the moment of failure
      await page.screenshot({
        path: path.join(FAILURES_DIR, `${name}.png`),
        fullPage: true,
      });

      // Compact, semantic DOM snapshot, not raw HTML
      const snapshot = await page.locator('body').ariaSnapshot();
      fs.writeFileSync(path.join(FAILURES_DIR, `${name}.yaml`), snapshot);
    }
  },
});

export { expect };
