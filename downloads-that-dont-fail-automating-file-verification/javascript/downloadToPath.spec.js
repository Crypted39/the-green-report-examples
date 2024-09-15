// @ts-check
const { test } = require("@playwright/test");

test("Download file to specified path", async ({ page }) => {
  await page.goto("https://www.test.com");

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Sample File").click();
  const download = await downloadPromise;

  await download.saveAs("/path/to/downloads/" + download.suggestedFilename());
});
