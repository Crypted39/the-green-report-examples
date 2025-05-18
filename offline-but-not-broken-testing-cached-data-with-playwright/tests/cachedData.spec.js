import { test, expect } from "@playwright/test";

test("Shows cached data when offline", async ({ page, context }) => {
  // Start with a clean context and go online
  await context.setOffline(false);
  await page.goto("your-page-url"); // Start a local server

  // Wait for network data to be displayed
  await expect(page.locator("#data")).toHaveText("Hello from the network!");

  // Reload once to ensure Service Worker has cached it
  await page.reload();
  await expect(page.locator("#data")).toHaveText("Hello from the network!");

  // Now simulate offline mode
  await context.setOffline(true);

  // Reload page in offline mode
  await page.reload();

  // Expect the cached data to still be shown
  await expect(page.locator("#data")).toHaveText("Hello from the network!");
});

test("Does not load data on first visit if /data.json fails", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept only the /data.json call and make it fail
  await page.route("**/data.json", (route) => route.abort());

  await page.goto("your-page-url");

  // Expect fallback message
  await expect(page.locator("#data")).toHaveText("Failed to load data");

  await context.close();
});
