const { test, expect } = require("@playwright/test");

test("Verify non-scrollability of sections using behavioral testing", async ({
  page,
}) => {
  await page.goto("your-page-url"); // Replace with your actual URL

  // Selector to target the element you want to test
  const elementHandle = await page.waitForSelector(".scrollable-div");

  // Get initial scroll position
  const initialScrollPosition = await elementHandle.evaluate((element) => {
    return element.scrollTop;
  });

  // Attempt to scroll down within the element
  await page.evaluate((element) => {
    element.scrollTo(0, element.scrollHeight); // Attempt to scroll to bottom
  }, elementHandle);

  // Get scroll position after attempted scroll
  const finalScrollPosition = await elementHandle.evaluate((element) => {
    return element.scrollTop;
  });

  // Assert that the scroll position has not changed (indicates non-scrollability)
  expect(finalScrollPosition).toBe(initialScrollPosition);
});
