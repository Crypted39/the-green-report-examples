import { defineConfig } from '@playwright/test';

// API-only suite: no browsers are launched, so no `playwright install` needed.
export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  reporter: 'list',
});
