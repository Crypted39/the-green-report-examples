import { test, expect } from "@playwright/test";

test("Select text and verify action menu", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await page.waitForSelector("#demo-text");

  // 2. Find the paragraph and get its text content
  const paragraphText = await page.locator("#demo-text").innerText();

  // 3. Find the position of the date we want to select
  const dateText = "March 15, 2025";
  const datePosition = paragraphText.indexOf(dateText);
  expect(datePosition).toBeGreaterThan(-1); // Verify the date exists in the text

  // 4. Execute JavaScript to select the specific text
  await page.evaluate((dateText) => {
    // Find all text nodes in the document
    const textNodes = [];
    function getTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          getTextNodes(node.childNodes[i]);
        }
      }
    }
    getTextNodes(document.body);

    // Find the text node containing our date
    let targetNode = null;
    let targetOffset = -1;

    for (const node of textNodes) {
      const index = node.textContent.indexOf(dateText);
      if (index >= 0) {
        targetNode = node;
        targetOffset = index;
        break;
      }
    }

    if (targetNode) {
      // Create a new selection
      const range = document.createRange();
      range.setStart(targetNode, targetOffset);
      range.setEnd(targetNode, targetOffset + dateText.length);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      // Dispatch a mouseup event to trigger the selection handler
      const mouseupEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.dispatchEvent(mouseupEvent);
    }
  }, dateText);

  // 5. Wait for the action menu to appear
  await page.waitForSelector('#action-menu[style*="display: block"]', {
    timeout: 5000,
  });

  // 6. Verify the action menu contains the expected button
  const actionButton = page.locator("#action-menu button");
  await expect(actionButton).toBeVisible();
  await expect(actionButton).toHaveText("Add to Calendar");
});
