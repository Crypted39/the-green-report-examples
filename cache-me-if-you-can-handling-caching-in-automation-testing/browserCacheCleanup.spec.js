const { test, chromium } = require("@playwright/test");

async function clearBrowserCache(context) {
  // Clear all browser caches
  await context.clearCookies();

  // Get all pages in the context
  const pages = context.pages();

  for (const page of pages) {
    // Navigate to Chrome's clear browsing data page
    await page.goto("about:blank");

    // Clear various storage types
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();

      // Clear IndexedDB
      const deleteRequest = window.indexedDB.deleteDatabase("YourDatabaseName");
      deleteRequest.onerror = () => console.error("Error deleting IndexedDB");
    });

    // Clear service workers
    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
    });
  }
}

test("Clearing browser cache", async ({}) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await clearBrowserCache(context);
  const page = await context.newPage();
  await page.goto("https://test-site.com");
  await browser.close();
});
