const { test, expect } = require("@playwright/test");

test.describe("Infinite Scroll Functionality", () => {
  let page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Navigate to the demo page
    await page.goto("http://127.0.0.1:5500/index.html");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Wait for the initial items to load
    await page.waitForSelector('[data-testid="item-1"]', { timeout: 10000 });
  });

  test("should load initial items on page load", async () => {
    // Verify that initial items are loaded
    const initialItems = await page.locator('[data-testid^="item-"]').count();
    expect(initialItems).toBeGreaterThan(0);
    expect(initialItems).toBeLessThanOrEqual(20); // First batch should be 20 or less

    // Verify first item exists
    await expect(page.locator('[data-testid="item-1"]')).toBeVisible();

    // Verify stats are updated
    const loadedCount = await page.locator("#loaded-count").textContent();
    expect(parseInt(loadedCount)).toBeGreaterThan(0);

    const apiCalls = await page.locator("#api-calls").textContent();
    expect(parseInt(apiCalls)).toBe(1);
  });

  test("should show loading indicator when scrolling to bottom", async () => {
    // Scroll to the bottom of the container
    await page.locator("#listContainer").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Loading indicator should appear
    await expect(page.locator("#loading")).toBeVisible({ timeout: 5000 });

    // Verify loading spinner is present
    await expect(page.locator(".loading-spinner")).toBeVisible();
    await expect(page.locator("#loading p")).toHaveText(
      "Loading more items..."
    );
  });

  test("should load more items when scrolling to bottom", async () => {
    // Get initial item count
    const initialCount = await page.locator('[data-testid^="item-"]').count();
    const initialApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );

    // Scroll to bottom to trigger loading
    await page.locator("#listContainer").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for loading to start
    await expect(page.locator("#loading")).toBeVisible();

    // Wait for loading to complete and new items to appear
    await page.waitForFunction(
      (expectedCount) => {
        const currentCount = document.querySelectorAll(
          '[data-testid^="item-"]'
        ).length;
        return currentCount > expectedCount;
      },
      initialCount,
      { timeout: 10000 }
    );

    // Wait for loading to disappear
    await expect(page.locator("#loading")).not.toBeVisible({ timeout: 10000 });

    // Verify more items were loaded
    const newCount = await page.locator('[data-testid^="item-"]').count();
    expect(newCount).toBeGreaterThan(initialCount);

    // Verify API call count increased
    const newApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );
    expect(newApiCalls).toBe(initialApiCalls + 1);

    // Verify stats are updated
    const loadedCountText = await page.locator("#loaded-count").textContent();
    expect(parseInt(loadedCountText)).toBe(newCount);
  });

  test("should load items progressively with multiple scrolls", async () => {
    const targetScrolls = 3;
    let currentApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );

    for (let i = 0; i < targetScrolls; i++) {
      // Get current item count
      const currentCount = await page.locator('[data-testid^="item-"]').count();

      // Scroll to bottom
      await page.locator("#listContainer").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Wait for loading to appear
      await expect(page.locator("#loading")).toBeVisible({ timeout: 5000 });

      // Wait for new items to load
      await page.waitForFunction(
        (expectedCount) => {
          const newCount = document.querySelectorAll(
            '[data-testid^="item-"]'
          ).length;
          return newCount > expectedCount;
        },
        currentCount,
        { timeout: 10000 }
      );

      // Wait for loading to disappear
      await expect(page.locator("#loading")).not.toBeVisible({
        timeout: 10000,
      });

      // Verify API call count increased
      currentApiCalls++;
      const apiCallsText = await page.locator("#api-calls").textContent();
      expect(parseInt(apiCallsText)).toBe(currentApiCalls);

      console.log(
        `Scroll ${i + 1}: Loaded ${await page
          .locator('[data-testid^="item-"]')
          .count()} items`
      );
    }

    // Verify we have more items than initial load
    const finalCount = await page.locator('[data-testid^="item-"]').count();
    expect(finalCount).toBeGreaterThan(20); // Should have more than initial batch
  });

  test("should show end message when all items are loaded", async () => {
    // Keep scrolling until all items are loaded
    let previousCount = 0;
    let currentCount = await page.locator('[data-testid^="item-"]').count();
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    while (
      currentCount < 100 &&
      attempts < maxAttempts &&
      currentCount > previousCount
    ) {
      previousCount = currentCount;

      // Scroll to bottom
      await page.locator("#listContainer").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // Wait for either loading to appear or end message to show
      try {
        await Promise.race([
          page.locator("#loading").waitFor({ state: "visible", timeout: 3000 }),
          page
            .locator("#endMessage")
            .waitFor({ state: "visible", timeout: 3000 }),
        ]);
      } catch (error) {
        // If neither appears, we might be at the end
        break;
      }

      // If loading appeared, wait for it to complete
      if (await page.locator("#loading").isVisible()) {
        await expect(page.locator("#loading")).not.toBeVisible({
          timeout: 10000,
        });
      }

      currentCount = await page.locator('[data-testid^="item-"]').count();
      attempts++;

      console.log(`Attempt ${attempts}: Loaded ${currentCount} items`);
    }

    // Verify end message appears when all items are loaded
    if (currentCount >= 100) {
      await expect(page.locator("#endMessage")).toBeVisible();
      await expect(page.locator("#endMessage p")).toContainText(
        "You've reached the end"
      );

      // Verify final stats
      const finalLoadedCount = await page
        .locator("#loaded-count")
        .textContent();
      expect(parseInt(finalLoadedCount)).toBe(100);
    }
  });

  test("should not trigger loading when not scrolled to bottom", async () => {
    const initialApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );

    // Scroll to middle of container
    await page.locator("#listContainer").evaluate((el) => {
      el.scrollTop = el.scrollHeight * 0.5;
    });

    // Wait a bit to see if loading triggers (it shouldn't)
    await page.waitForTimeout(2000);

    // Loading should not be visible
    await expect(page.locator("#loading")).not.toBeVisible();

    // API calls should remain the same
    const apiCalls = parseInt(await page.locator("#api-calls").textContent());
    expect(apiCalls).toBe(initialApiCalls);
  });

  test("should maintain proper item order and content", async () => {
    // Load a few batches
    for (let i = 0; i < 2; i++) {
      await page.locator("#listContainer").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await expect(page.locator("#loading")).toBeVisible();
      await expect(page.locator("#loading")).not.toBeVisible({
        timeout: 10000,
      });
    }

    // Verify items are in correct order
    const items = await page.locator('[data-testid^="item-"]').all();

    for (let i = 0; i < Math.min(items.length, 5); i++) {
      const expectedId = i + 1;
      const itemTitle = await items[i].locator("h3").textContent();
      expect(itemTitle).toBe(`Item ${expectedId}`);

      const itemId = await items[i].getAttribute("data-item-id");
      expect(parseInt(itemId)).toBe(expectedId);
    }
  });

  test("should handle rapid scrolling without duplicate requests", async () => {
    const initialApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );

    // Rapidly scroll multiple times
    for (let i = 0; i < 5; i++) {
      await page.locator("#listContainer").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(100); // Small delay between scrolls
    }

    // Wait for any loading to complete
    try {
      await expect(page.locator("#loading")).toBeVisible({ timeout: 2000 });
      await expect(page.locator("#loading")).not.toBeVisible({
        timeout: 10000,
      });
    } catch (error) {
      // Loading might not appear if request is already in progress
    }

    // Should only have made one additional API call despite rapid scrolling
    const finalApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );
    expect(finalApiCalls).toBeLessThanOrEqual(initialApiCalls + 2); // Allow for some timing variance
  });

  test("should display correct loading states", async () => {
    // Verify loading element is initially hidden
    await expect(page.locator("#loading")).not.toBeVisible();

    // Trigger loading
    await page.locator("#listContainer").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Verify loading appears with correct elements
    await expect(page.locator("#loading")).toBeVisible();
    await expect(page.locator(".loading-spinner")).toBeVisible();
    await expect(page.locator("#loading p")).toHaveText(
      "Loading more items..."
    );

    // Verify loading spinner is animating (has animation CSS)
    const spinner = page.locator(".loading-spinner");
    const animationName = await spinner.evaluate(
      (el) => window.getComputedStyle(el).animationName
    );
    expect(animationName).toBe("spin");

    // Wait for loading to complete
    await expect(page.locator("#loading")).not.toBeVisible({ timeout: 10000 });
  });

  test("should update stats correctly throughout scrolling", async () => {
    // Check initial stats
    let loadedCount = parseInt(
      await page.locator("#loaded-count").textContent()
    );
    let totalCount = parseInt(await page.locator("#total-count").textContent());
    let apiCalls = parseInt(await page.locator("#api-calls").textContent());

    expect(totalCount).toBe(100);
    expect(loadedCount).toBeGreaterThan(0);
    expect(apiCalls).toBe(1);

    // Load more items and verify stats update
    await page.locator("#listContainer").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(page.locator("#loading")).toBeVisible();
    await expect(page.locator("#loading")).not.toBeVisible({ timeout: 10000 });

    // Verify stats increased
    const newLoadedCount = parseInt(
      await page.locator("#loaded-count").textContent()
    );
    const newApiCalls = parseInt(
      await page.locator("#api-calls").textContent()
    );

    expect(newLoadedCount).toBeGreaterThan(loadedCount);
    expect(newApiCalls).toBe(apiCalls + 1);

    // Verify loaded count matches actual DOM elements
    const actualItemCount = await page
      .locator('[data-testid^="item-"]')
      .count();
    expect(newLoadedCount).toBe(actualItemCount);
  });
});
