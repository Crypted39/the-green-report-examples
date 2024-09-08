// @ts-check
const { test } = require("@playwright/test");
const assert = require("assert");

test("Logical focus order verification", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/index.html#");
  // Array to keep track of focused elements
  const focusOrder = [];

  // Expected focus order based on the HTML page structure
  const expectedFocusOrder = [
    { tagName: "A", text: "First Link" },
    { tagName: "BUTTON", text: "First Button" },
    { tagName: "INPUT", text: "" }, // Input fields will have empty text
    { tagName: "A", text: "Second Link" },
    { tagName: "BUTTON", text: "Second Button" },
    { tagName: "INPUT", text: "" },
    { tagName: "TEXTAREA", text: "" },
    { tagName: "SELECT", text: "Option 1\nOption 2" },
    { tagName: "A", text: "Third Link" },
  ];

  // Listen for focus events and log the focused element's tag and text
  await page.exposeFunction("logFocus", (element) => {
    focusOrder.push(element);
  });

  // Inject a script into the page to track focusable elements
  await page.evaluate(() => {
    document.addEventListener(
      "focusin",
      (event) => {
        const { tagName, innerText } = event.target;
        // Send the element details to the logFocus function
        window.logFocus({ tagName, text: innerText.trim() });
      },
      true
    );
  });

  // Simulate pressing the Tab key multiple times (adjust based on the page complexity)
  for (let i = 0; i < expectedFocusOrder.length; i++) {
    await page.keyboard.press("Tab");
  }

  // Print the focus order for manual review (optional)
  console.log("Focus Order:", focusOrder);

  // Assert that the focus order matches the expected sequence
  assert.deepStrictEqual(
    focusOrder,
    expectedFocusOrder,
    "Focus order does not match the expected logical order."
  );
});

test("Visible focus indicator verification", async ({ page }) => {
  // Define focusable elements selector
  const focusableSelectors = ["a", "button", "input", "textarea", "select"];

  // Function to check if an element has a visible focus indicator
  async function checkFocusIndicator(element) {
    // Focus the element
    await element.focus();

    // Extract relevant CSS properties to check for visible focus indicators
    const styles = await element.evaluate((el) => {
      const computedStyles = window.getComputedStyle(el);
      return {
        outlineWidth: computedStyles.outlineWidth,
        outlineStyle: computedStyles.outlineStyle,
        outlineColor: computedStyles.outlineColor,
        borderWidth: computedStyles.borderWidth,
        borderStyle: computedStyles.borderStyle,
        borderColor: computedStyles.borderColor,
        boxShadow: computedStyles.boxShadow,
      };
    });

    // Check if focus styles are applied (outline or border must be visible)
    const isOutlineVisible =
      styles.outlineStyle !== "none" &&
      parseFloat(styles.outlineWidth) > 0 &&
      styles.outlineColor !== "transparent" &&
      !styles.outlineColor.includes("rgba(0, 0, 0, 0)"); // Check for fully transparent outline

    // Check if the border is visible and has a non-transparent color
    const isBorderVisible =
      styles.borderStyle !== "none" &&
      parseFloat(styles.borderWidth) > 0 &&
      styles.borderColor !== "transparent" &&
      !styles.borderColor.includes("rgba(0, 0, 0, 0)"); // Check for fully transparent border

    // Check if box-shadow is present (often used for focus indication)
    const isBoxShadowVisible = styles.boxShadow !== "none";

    // Assert that a visible focus indicator is present
    const hasVisibleFocus =
      isOutlineVisible || isBorderVisible || isBoxShadowVisible;

    // Assert that focus indicator is visible
    assert(
      hasVisibleFocus,
      `Element ${await element.evaluate(
        (el) => el.tagName
      )} does not have a visible focus indicator.`
    );

    console.log(
      `Focus visible on element: ${await element.evaluate((el) => el.tagName)}`
    );
  }

  // Loop through all focusable elements and check for visible focus indicator
  for (const selector of focusableSelectors) {
    const elements = await page.$$(selector); // Get all elements matching the selector
    for (const element of elements) {
      await checkFocusIndicator(element);
    }
  }
});
