import { test } from "@playwright/test";
import playwright from "playwright";
import { playAudit } from "playwright-lighthouse";

test("Run Lighthouse audit on thegreenreport.blog", async ({ page }) => {
  const targetURL = "https://www.thegreenreport.blog";
  const port = 9222; // Replace with your desired port if needed

  // Launch Chromium with explicit port configuration
  const browser = await playwright.chromium.launch({
    args: [`--remote-debugging-port=${port}`],
  });

  page = await browser.newPage();
  await page.goto(targetURL);

  await playAudit({
    page: page,
    port: port,
    thresholds: {
      performance: 75,
      accessibility: 85,
      "best-practices": 85,
      seo: 83,
    },
  });

  await browser.close();
});
