const { expect } = require("@playwright/test");

exports.TestPage = class TestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.showOptionsButton = page.locator("id=showOptionsBtn");
    this.optionsOutput = page.locator("id=selectedOptions");
  }

  async goto() {
    //enter your url
    await this.page.goto("http://127.0.0.1:5500/resources/index.html");
  }

  async getAllCheckboxLabels() {
    const checkboxes = await this.page.$$(".checkboxLabel");
    const labels = await Promise.all(
      checkboxes.map((checkbox) =>
        checkbox.evaluate((el) => el.textContent.trim())
      )
    );
    return labels;
  }

  async getCheckboxes() {
    const checkboxes = await this.page.$$(
      '#optionsContainer input[type="checkbox"]'
    );
    return checkboxes;
  }

  async checkByLabel(label) {
    const checkbox = this.page.locator(
      `//label[text()='${label}']/preceding-sibling::input[@type='checkbox'][1]`
    );
    await checkbox.check();
  }

  async clickShowOptionsButton() {
    await this.page.locator("id=showOptionsBtn").click();
  }

  async getOutputText() {
    return await this.page.locator("id=selectedOptions").textContent();
  }

  async clearCheckboxes() {
    const checkboxes = await this.getCheckboxes();
    for (const checkbox of checkboxes) {
      await checkbox.uncheck();
    }
  }
};
