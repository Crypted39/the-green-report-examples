// @ts-check
const { test, expect } = require("@playwright/test");

test("drag and drop test", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/index.html");

  // Locate the items
  const sourceItem = page.getByText("Item 3", { exact: true });
  const targetItem = page.getByText("Item 1", { exact: true });

  // Drag and drop action
  await sourceItem.hover();

  const sourceBox = await sourceItem.boundingBox();
  if (sourceBox) {
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
  } else {
    console.warn("Source item not found. Skipping drag action.");
  }

  const targetBox = await targetItem.boundingBox();
  if (targetBox) {
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    await page.mouse.move(targetX, targetY);
    await page.mouse.up();
  } else {
    console.warn("Target item not found. Skipping drop action.");
  }

  // Verify the order after drag and drop
  const items = await page.$$eval(".list-item", (items) =>
    items.map((item) => item.textContent)
  );
  expect(items).toEqual(["Item 3", "Item 1", "Item 2", "Item 4", "Item 5"]);

  // Persist items state
  await page.getByRole("checkbox").click();

  // Verify the order after page refresh
  await page.reload();
  const itemsAfterRefresh = await page.$$eval(".list-item", (items) =>
    items.map((item) => item.textContent)
  );
  expect(itemsAfterRefresh).toEqual([
    "Item 3",
    "Item 1",
    "Item 2",
    "Item 4",
    "Item 5",
  ]);
});
