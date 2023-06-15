const DemoPage = require("./demoPage");
const demoPage = new DemoPage();
const {
  dynamicRetry,
  pollRetry,
  errorHandlingRetry,
  retryWithExponentialBackoff,
  retryWithRandomizedInterval,
} = require("./retryUtil");

describe("Testing different retry patters", () => {
  it("Testing the dynamic retry pattern", async () => {
    await demoPage.navigateToDemoPageTextBoxes();
    await browser.pause(1000);
    await dynamicRetry(async () => {
      await demoPage.fillFullName("John Doe");
      await demoPage.fillEmail("test@gmail.com");
      await demoPage.fillCurrentAddress("test address");
      await demoPage.clickFakeButton();
    }, 3);
  });

  it("Testing the poll retry pattern", async () => {
    await demoPage.navigateToDemoPageTextBoxes();
    await browser.pause(1000);
    await pollRetry(
      async () => {
        await demoPage.fillFullName("John Doe");
        await demoPage.fillEmail("test@gmail.com");
        await demoPage.fillCurrentAddress("test address");
        await demoPage.clickFakeButton();
      },
      20000,
      5000
    );
  });

  it("Testing the error handling retry pattern", async () => {
    await demoPage.navigateToDemoPageTextBoxes();
    await browser.pause(1000);
    await errorHandlingRetry(async () => {
      await demoPage.fillFullName("John Doe");
      await demoPage.fillEmail("test@gmail.com");
      await demoPage.fillCurrentAddress("test address");
      await demoPage.clickFakeButton();
    });
  });

  it("Testing the retry with exponential backoff pattern", async () => {
    await demoPage.navigateToDemoPageTextBoxes();
    await browser.pause(1000);
    await retryWithExponentialBackoff(
      async () => {
        await demoPage.fillFullName("John Doe");
        await demoPage.fillEmail("test@gmail.com");
        await demoPage.fillCurrentAddress("test address");
        await demoPage.clickFakeButton();
      },
      4,
      1000
    );
  });

  it("Testing the retry with a randomized interval pattern", async () => {
    await demoPage.navigateToDemoPageTextBoxes();
    await browser.pause(1000);
    await retryWithRandomizedInterval(
      async () => {
        await demoPage.fillFullName("John Doe");
        await demoPage.fillEmail("test@gmail.com");
        await demoPage.fillCurrentAddress("test address");
        await demoPage.clickFakeButton();
      },
      3,
      1000,
      3000
    );
  });
});
