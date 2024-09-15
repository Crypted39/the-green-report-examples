const { test } = require("@playwright/test");

test("Download by clicking a button", async ({ page }) => {
  await page.goto("https://www.test.com");

  // Wait for download event and trigger download by clicking the button
  const downloadPromise = page.waitForEvent("download");
  await page.click("#download-button");
  const download = await downloadPromise;

  await download.saveAs("/path/to/downloads/" + download.suggestedFilename());
});
