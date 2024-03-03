const { test, expect } = require("@playwright/test");

test("Verify non-scrollability of sections using non-behavioral testing", async ({
  page,
}) => {
  await page.goto(
    "your-page-url" // Replace with your actual URL
  );

  // Selector to target the element
  const elementHandle = await page.waitForSelector(".scrollable-div");

  // Check for overflow using a temporary style change:
  const forceScroll = await elementHandle.evaluate((element) => {
    element.style.overflowY = "scroll"; // Temporarily force scroll
    const isScrollable = element.scrollHeight > element.clientHeight;
    element.style.overflowY = "hidden"; // Restore original style
    return isScrollable;
  });
  expect(forceScroll).toBe(false);

  // Check for nested scrollable elements:
  const potentialScrollableElements = await elementHandle.$$("*"); // Select all children
  for (const element of potentialScrollableElements) {
    const isScrollable = await element.evaluate((element) => {
      return element.scrollHeight > element.clientHeight;
    });
    expect(isScrollable).toBe(false);
  }
});
