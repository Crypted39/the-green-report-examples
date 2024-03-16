const { test, expect } = require("@playwright/test");

test("DOM manipulation", async ({ page }) => {
  await page.goto("enter-your-url");

  const banner = page.locator("#hidden-content");
  await expect(banner).not.toBeVisible();
  await page.screenshot({ path: "no_banner.png", fullPage: true });

  // Execute the function within the page context
  await page.evaluate(() => {
    const element = document.getElementById("hidden-content");
    element.classList.add("custom-class");
  });

  // Now assert if the expected behavior (banner display) occurs
  await expect(banner).toBeVisible();
  await page.screenshot({ path: "with_banner.png", fullPage: true });
});

test("API manipulation", async ({ page }) => {
  await page.goto("enter-your-url");

  const tvShowName = page.locator("#show-name");
  await page.locator("#get-tv-shows-button").click();
  await tvShowName.waitFor("visible");
  expect(await tvShowName.textContent()).not.toEqual("No data available.");
  await page.screenshot({ path: "api_success.png", fullPage: true });

  // Intercept requests to the API endpoint
  await page.route("https://api.tvmaze.com/shows/39", async (route) => {
    // Fetch the original response
    const response = await route.fetch();

    // Parse the response body
    const data = await response.json();

    // Modify the name property
    data.name = null;

    // Fulfill the request with the modified response
    await route.fulfill({
      body: JSON.stringify(data),
      headers: response.headers(), // Copy original headers
    });
  });

  await page.goto("enter-your-url");

  await page.locator("#get-tv-shows-button").click();
  await tvShowName.waitFor("visible");
  expect(await tvShowName.textContent()).toEqual("No data available.");
  await page.screenshot({ path: "api_fail.png", fullPage: true });
});
