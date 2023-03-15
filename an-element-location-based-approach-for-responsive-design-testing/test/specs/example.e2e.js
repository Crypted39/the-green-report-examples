const Homepage = require("../pageobjects/homepage");

describe("Responsive Layout Verification", () => {
  it("Verify responsive layout for 1920x1080 resolution", async () => {
    await Homepage.navigateToHomepage();
    await browser.pause(3000);
    await Homepage.verifyFullSizeHomepageLayout();
  });

  it("Verify responsive layout for 1500px breakpoint", async () => {
    await Homepage.verifyFirstBreakPointHomepageLayout();
  });

  it("Verify responsive layout for 1024px breakpoint", async () => {
    await Homepage.verifySecondBreakPointHomepageLayout();
  });

  it("Verify responsive layout for 768px breakpoint", async () => {
    await Homepage.verifyThirdBreakPointHomepageLayout();
  });

  it("Fail validation test with screenshot", async () => {
    await Homepage.screenshotVerification();
  });
});
