import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Deliberately zero. A retry would hide the race we are trying to show.
  retries: 0,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'off',
  },

  projects: [
    // Same 24 tests, same app. The only difference is whether the four
    // mutating specs declare a lock.
    {
      name: 'naive',
      testIgnore: '**/locked/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'locked',
      testIgnore: '**/naive/**',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'node server/app.js',
    url: `${baseURL}/health`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
