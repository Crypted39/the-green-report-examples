// @ts-check
import { defineConfig } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "./test-results/results.json" }],
  ],
  use: {
    trace: "on",
    screenshot: "on",
    video: "off", // keep traces lightweight
  },

  // Output traces to a predictable location
  outputDir: "./test-results",

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
