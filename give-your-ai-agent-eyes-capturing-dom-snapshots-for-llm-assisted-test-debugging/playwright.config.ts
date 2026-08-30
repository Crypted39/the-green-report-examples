import { defineConfig } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  webServer: {
    command: 'node demo-site/server.js',
    url: BASE_URL,
    // Never silently attach to a server this project did not start. If something
    // else owns the port, fail immediately instead of testing the wrong site.
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  use: {
    baseURL: BASE_URL,
  },
});
