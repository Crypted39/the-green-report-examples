import { expect } from "@playwright/test";

exports.ApiLogPage = class ApiLogPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("http://localhost:3000/");
  }

  async fetchFirstAndSecondApi() {
    await this.page.locator("#button-1").click();
  }

  async fetchThirdApi() {
    await this.page.locator("#button-2").click();
  }

  async setResponseCodes({
    firstResponseCode,
    secondResponseCode,
    thirdResponseCode,
  }) {
    await this.page
      .locator("#api-error-code-1")
      .selectOption(firstResponseCode);
    await this.page
      .locator("#api-error-code-2")
      .selectOption(secondResponseCode);
    await this.page
      .locator("#api-error-code-3")
      .selectOption(thirdResponseCode);

    await this.page.locator("#apply-error-code").click();
  }

  async verifyFirstTwoApiResponses(firstApiResponse, secondApiResponse) {
    await this.page.locator("#firstApiResponse").waitFor();
    expect(await this.page.locator("#firstApiResponse")).toContainText(
      firstApiResponse
    );
    await this.page.locator("#secondApiResponse").waitFor();
    expect(await this.page.locator("#secondApiResponse")).toContainText(
      secondApiResponse
    );
  }

  async verifyThirdApiResponse(thirdApiResponse) {
    await this.page.locator("#thirdApiResponse").waitFor();
    expect(await this.page.locator("#thirdApiResponse")).toContainText(
      thirdApiResponse
    );
  }

  async verifyFirstAndSecondResponsesAreNotDisplayed() {
    expect(await this.page.locator("#firstApiResponse")).not.toBeVisible();
    expect(await this.page.locator("#secondApiResponse")).not.toBeVisible();
  }
};
