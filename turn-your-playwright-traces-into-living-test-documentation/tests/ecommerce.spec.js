import { test, expect } from "@playwright/test";

// Use baseURL from config or default
test.use({ baseURL: "your_page_url" });

test.describe("TechStore E-Commerce", () => {
  test("user login flow", async ({ page }) => {
    test.info().annotations.push({
      type: "description",
      description:
        "User logs in with valid credentials and sees personalized greeting.",
    });

    await page.goto("/index.html");

    // Fill login form
    await page.fill("#login-email", "demo@test.com");
    await page.fill("#login-password", "password123");
    await page.click('button:has-text("Sign In")');

    // Wait for navigation and verify logged in
    await page.waitForSelector('.user-menu:has-text("Demo User")');
    await expect(page.locator(".user-menu")).toContainText("Demo User");
  });

  test("browse and filter products", async ({ page }) => {
    test.info().annotations.push({
      type: "description",
      description: "User browses product catalog and filters by category.",
    });

    await page.goto("/index.html");

    // Navigate to products
    await page.click("text=Products");
    await page.waitForSelector(".product-card");

    // Verify all products shown
    await expect(page.locator(".product-card")).toHaveCount(8);

    // Filter by audio category
    await page.selectOption("#category-filter", "audio");
    await expect(page.locator(".product-card")).toHaveCount(3);

    // Clear filter
    await page.selectOption("#category-filter", "");
    await expect(page.locator(".product-card")).toHaveCount(8);
  });

  test("add items to cart", async ({ page }) => {
    test.info().annotations.push({
      type: "description",
      description: "User adds multiple products to shopping cart.",
    });

    await page.goto("/index.html");

    // Go to products
    await page.click("text=Products");
    await page.waitForSelector(".product-card");

    // Add first product
    await page
      .locator(".product-card")
      .first()
      .locator("text=Add to Cart")
      .click();
    await expect(page.locator("#cart-count")).toHaveText("1");

    // Add second product
    await page
      .locator(".product-card")
      .nth(1)
      .locator("text=Add to Cart")
      .click();
    await expect(page.locator("#cart-count")).toHaveText("2");

    // Go to cart and verify
    await page.click(".cart-icon");
    await page.waitForSelector(".cart-item");
    await expect(page.locator(".cart-item")).toHaveCount(2);
  });

  test("update cart quantity", async ({ page }) => {
    test.info().annotations.push({
      type: "description",
      description: "User updates product quantity in the shopping cart.",
    });

    await page.goto("/index.html");

    // Go to products and add item
    await page.click("text=Products");
    await page.waitForSelector(".product-card");
    await page
      .locator(".product-card")
      .first()
      .locator("text=Add to Cart")
      .click();

    // Go to cart
    await page.click(".cart-icon");
    await page.waitForSelector(".cart-item");

    // Increase quantity
    await page.click('.quantity-control button:has-text("+")');
    await expect(page.locator(".quantity-control span")).toHaveText("2");
    await expect(page.locator("#cart-count")).toHaveText("2");

    // Decrease quantity
    await page.click('.quantity-control button:has-text("−")');
    await expect(page.locator(".quantity-control span")).toHaveText("1");
  });

  test("complete checkout", async ({ page }) => {
    test.info().annotations.push({
      type: "description",
      description:
        "User completes full checkout flow from login to order confirmation.",
    });

    await page.goto("/index.html");

    // Login
    await page.fill("#login-email", "demo@test.com");
    await page.fill("#login-password", "password123");
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector(".product-card");

    // Add product to cart
    await page
      .locator(".product-card")
      .first()
      .locator("text=Add to Cart")
      .click();
    await expect(page.locator("#cart-count")).toHaveText("1");

    // Go to cart - wait for cart page to be visible
    await page.click(".cart-icon");
    await page.waitForSelector("#page-cart.active", { timeout: 5000 });

    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForSelector("#ship-firstname", { timeout: 5000 });

    // Fill shipping info
    await page.fill("#ship-firstname", "John");
    await page.fill("#ship-lastname", "Doe");
    await page.fill("#ship-address", "123 Main Street");
    await page.fill("#ship-city", "San Francisco");
    await page.fill("#ship-zip", "94102");

    // Fill payment info
    await page.fill("#card-number", "4242424242424242");
    await page.fill("#card-expiry", "12/25");
    await page.fill("#card-cvv", "123");

    // Place order
    await page.click('button:has-text("Place Order")');

    // Verify success
    await page.waitForSelector(".success-icon", { timeout: 5000 });
    await expect(page.locator(".success-container h1")).toHaveText(
      "Order Confirmed!"
    );
  });
});
