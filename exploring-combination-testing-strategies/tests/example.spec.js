const { test, expect } = require("@playwright/test");
const { TestPage } = require("../pages/test-page");
import generateCombinations from "../helpers/helper";

test("verify all checkbox combinations", async ({ page }) => {
  const testPage = new TestPage(page);
  await testPage.goto();
  const checkboxLabels = await testPage.getAllCheckboxLabels();
  const allCombinations = generateCombinations(checkboxLabels);

  for (const combination of allCombinations) {
    for (const label of combination) {
      await testPage.checkByLabel(label);
    }

    await testPage.clickShowOptionsButton();

    const outputText = await testPage.getOutputText();
    const expectedText = new RegExp(
      `The following options are selected: ${combination.join(", ") || "None"}`
    );
    expect(outputText).toMatch(expectedText);

    await testPage.clearCheckboxes();
  }
});
