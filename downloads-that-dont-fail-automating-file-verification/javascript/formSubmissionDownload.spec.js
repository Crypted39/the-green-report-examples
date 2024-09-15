const { test } = require("@playwright/test");

test("Download triggered by form submission", async ({ page }) => {
  await page.goto("https://www.test.com");

  // Fill out the form fields
  await page.fill('input[name="first-name"]', "John");
  await page.fill('input[name="last-name"]', "Doe");

  // Wait for download event and submit the form
  const downloadPromise = page.waitForEvent("download");
  await page.click('button[type="submit"]'); // Simulate form submission
  const download = await downloadPromise;

  await download.saveAs("/path/to/downloads/" + download.suggestedFilename());
});
