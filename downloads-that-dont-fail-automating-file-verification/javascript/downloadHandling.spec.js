// @ts-check
const { test } = require("@playwright/test");

test("Handle and wait for download completion", async ({ page }) => {
  // Navigate to the page
  await page.goto("https://www.test.com");

  // Start listening for the download event
  const downloadPromise = page.waitForEvent("download");

  // Trigger the download by clicking the button
  await page.click("#download-button");

  // Wait for the download to complete
  const download = await downloadPromise;

  // Save the file to the specified directory
  const filePath = "/path/to/downloads/" + download.suggestedFilename();
  await download.saveAs(filePath);

  console.log(`File downloaded successfully: ${filePath}`);
});
