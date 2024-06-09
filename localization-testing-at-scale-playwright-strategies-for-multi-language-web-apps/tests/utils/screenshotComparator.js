const { expect } = require("@playwright/test");

async function compareScreenshot(page, maxDiffPixels = 10) {
  await expect(page).toHaveScreenshot({ maxDiffPixels });
}

module.exports = compareScreenshot;
