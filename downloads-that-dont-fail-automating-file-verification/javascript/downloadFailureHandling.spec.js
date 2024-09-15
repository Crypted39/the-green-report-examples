const fs = require("fs");
const { test } = require("@playwright/test");

test("Download failure handling", async ({ page }) => {
  await page.goto("https://www.test.com");

  async function waitForDownload(downloadPath, timeout = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (fs.existsSync(downloadPath)) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
  }

  const downloadPath = "/path/to/downloads/";

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Sample File").click();
  const download = await downloadPromise;

  await download.saveAs(downloadPath + download.suggestedFilename());

  // Wait for the download to complete
  const downloadCompleted = await waitForDownload(
    downloadPath + "sample-file.txt"
  );
  if (downloadCompleted) {
    console.log("Download succeeded");
  } else {
    throw new Error("Download failed or timed out");
  }
});
