const { test } = require("@playwright/test");
const { ApiLogPage } = require("./api-log-page");

async function logFailedRequests(failedRequests, step) {
  if (failedRequests.length === 0) {
    console.log(`\nNo failed network requests for: ${step}`);
    return;
  }

  console.log(`\nFailed network requests for: ${step}`);
  await Promise.all(
    failedRequests.map(async (request, index) => {
      const response = await request.response();
      console.log(`\nRequest #${index + 1}`);
      console.log(`URL: ${request.url()}`);
      console.log(`Method: ${request.method()}`);
      console.log(`Status: ${response ? response.status() : "No response"}`);
      if (response) {
        console.log(`Response status text: ${response.statusText()}`);
      }
    })
  );
}

test.describe("API Response Verification", () => {
  test.afterEach(async ({ page }) => {
    await logFailedRequests(failedRequests, `${test.info().title}`);
    failedRequests = [];
  });

  let failedRequests = [];

  function setupRequestTracking(page) {
    failedRequests = [];

    page.on("requestfailed", (request) => {
      failedRequests.push(request);
    });

    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400 && status < 600) {
        failedRequests.push(response.request());
      }
    });
  }

  test("verify first two API responses", async ({ page }) => {
    const successMessage = "Data from API";
    const apiLogPage = new ApiLogPage(page);

    setupRequestTracking(page);

    await apiLogPage.goto();
    await apiLogPage.setResponseCodes({
      firstResponseCode: "404",
      secondResponseCode: "500",
      thirdResponseCode: "200",
    });

    await apiLogPage.fetchFirstAndSecondApi();

    await apiLogPage.verifyFirstTwoApiResponses(successMessage, successMessage);
  });

  test("verify third API response", async ({ page }) => {
    const successMessage = "Data from API";
    const apiLogPage = new ApiLogPage(page);
    setupRequestTracking(page);
    await apiLogPage.goto();
    await apiLogPage.setResponseCodes({
      firstResponseCode: "200",
      secondResponseCode: "200",
      thirdResponseCode: "200",
    });
    await apiLogPage.fetchThirdApi();

    await apiLogPage.verifyFirstAndSecondResponsesAreNotDisplayed();
    await apiLogPage.verifyThirdApiResponse(successMessage);
  });
});
