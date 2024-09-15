// @ts-check
const { test } = require("@playwright/test");

test("Download by clicking a link", async ({ page }) => {
  await page.goto("https://www.test.com");

  // Wait for download event and trigger download by clicking the link
  const downloadPromise = page.waitForEvent("download");
  await page.click(`text="Click to Download"`);
  const download = await downloadPromise;

  await download.saveAs("/path/to/downloads/" + download.suggestedFilename());
});
