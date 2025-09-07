import { test, expect, Page } from "@playwright/test";
import { setupApiCallTracking } from "../utils/api-duplicate-detector";

// Initialize the tracker
const tracker = setupApiCallTracking();

test.describe("API Duplicate Detection Test Suite", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }, testInfo) => {
    page = testPage;

    // Start tracking API calls for this test
    await tracker.startTracking(page, testInfo);

    // Navigate to the test website
    // Replace this URL with wherever you host the HTML file
    await page.goto("http://127.0.0.1:5500/index.html");
    // Or if served via HTTP: await page.goto('http://localhost:3000');

    // Wait for the page to be fully loaded
    await expect(page.locator(".container")).toBeVisible();
  });

  test.afterEach(async () => {
    // Stop tracking after each test
    tracker.stopTracking();
  });

  test.afterAll(async () => {
    // Report any duplicates found across all tests
    await tracker.reportDuplicates();
  });

  test("Tab 1 - Single API calls (no duplicates expected)", async ({
    page,
  }) => {
    // Load users data
    await page.click('[data-testid="load-users-btn"]');

    // Expect one of the real API values
    await expect(page.locator('[data-testid="tab1-content"]')).toContainText(
      "Leanne Graham"
    );
    await expect(page.locator('[data-testid="tab1-content"]')).toContainText(
      "Ervin Howell"
    );
  });

  test("Tab 2 - One duplicate API call (should be detected)", async () => {
    // Navigate to Tab 2
    await page.click('[data-testid="tab2-button"]');
    await expect(page.locator("#tab2")).toHaveClass(/active/);

    // Load profile data (first call)
    await page.click('[data-testid="load-profile-btn"]');
    await expect(page.locator('[data-testid="tab2-content"]')).toContainText(
      "Current User"
    );

    // Refresh profile data (duplicate call to /profile)
    await page.click('[data-testid="refresh-profile-btn"]');
    await expect(page.locator('[data-testid="tab2-content"]')).toContainText(
      "Admin"
    );

    // Load notifications (unique call)
    await page.click('[data-testid="load-notifications-btn"]');
    await expect(page.locator('[data-testid="tab2-content"]')).toContainText(
      "New message received"
    );

    // Verify the API log shows the calls
    await expect(page.locator('[data-testid="tab2-log"]')).toContainText(
      "Success: /profile"
    );
    await expect(page.locator('[data-testid="tab2-log"]')).toContainText(
      "Success: /notifications"
    );

    // This test should trigger our duplicate detection for /profile endpoint
    // The duplicate will be reported at the end in test.afterAll()
  });

  test("Tab 3 - Multiple duplicate API calls (should detect multiple)", async () => {
    // Navigate to Tab 3
    await page.click('[data-testid="tab3-button"]');
    await expect(page.locator("#tab3")).toHaveClass(/active/);

    // Load analytics data (1st call)
    await page.click('[data-testid="load-analytics-btn"]');
    await expect(page.locator('[data-testid="tab3-content"]')).toContainText(
      "visitors"
    );

    // Refresh analytics data (2nd call - duplicate)
    await page.click('[data-testid="refresh-analytics-btn"]');
    await expect(page.locator('[data-testid="tab3-content"]')).toContainText(
      "pageViews"
    );

    // Reload analytics data (3rd call - duplicate)
    await page.click('[data-testid="reload-analytics-btn"]');
    await expect(page.locator('[data-testid="tab3-content"]')).toContainText(
      "bounceRate"
    );

    // Load reports data (1st call)
    await page.click('[data-testid="load-reports-btn"]');
    await expect(page.locator('[data-testid="tab3-content"]')).toContainText(
      "Monthly Report"
    );

    // Refresh reports data (2nd call - duplicate)
    await page.click('[data-testid="refresh-reports-btn"]');
    await expect(page.locator('[data-testid="tab3-content"]')).toContainText(
      "Weekly Summary"
    );

    // Verify the API log shows all the calls
    await expect(page.locator('[data-testid="tab3-log"]')).toContainText(
      "Success: /analytics"
    );
    await expect(page.locator('[data-testid="tab3-log"]')).toContainText(
      "Success: /reports"
    );

    // This test should trigger our duplicate detection:
    // - /analytics called 3 times
    // - /reports called 2 times
  });

  test("Tab switching functionality works correctly", async () => {
    // Test tab switching without API calls to ensure it works
    await page.click('[data-testid="tab2-button"]');
    await expect(page.locator("#tab2")).toHaveClass(/active/);
    await expect(page.locator("#tab1")).not.toHaveClass(/active/);

    await page.click('[data-testid="tab3-button"]');
    await expect(page.locator("#tab3")).toHaveClass(/active/);
    await expect(page.locator("#tab2")).not.toHaveClass(/active/);

    await page.click('[data-testid="tab1-button"]');
    await expect(page.locator("#tab1")).toHaveClass(/active/);
    await expect(page.locator("#tab3")).not.toHaveClass(/active/);
  });
});
