import { test, expect, type Page, type Locator } from "@playwright/test";
import * as path from "path";

// ─────────────────────────────────────────────────────────────
//  Config
//
//  To test a broken state, pass the BREAK env var:
//
//    BREAK=cart-button-to-div npx playwright test
//    BREAK=cart-button-to-div,nav-link-to-text npx playwright test
//
//  This mirrors opening index.html?break=cart-button-to-div
//  in a browser — the page applies the mutation on load.
//  Claude MCP can also be pointed at the same URL directly.
// ─────────────────────────────────────────────────────────────
const BASE_URL = `file://${path.resolve(__dirname, "../resources/index.html")}`;
const BREAKS = process.env.BREAK ?? "";
const PAGE_URL = BREAKS ? `${BASE_URL}?break=${BREAKS}` : BASE_URL;

// ─────────────────────────────────────────────────────────────
//  Page Object
//
//  Locators are intentionally loose — they use IDs and data
//  attributes rather than tag names. This mirrors how most
//  real-world test suites are written, and means a <button>
//  silently replaced by a <div> will still be found.
//
//  The tests will keep passing. That is the point.
//  Claude via Playwright MCP is what catches the semantic gap.
// ─────────────────────────────────────────────────────────────
class ShopLabPage {
  readonly page: Page;

  readonly navProducts: Locator;
  readonly navDeals: Locator;
  readonly cartButton: Locator;
  readonly cartCount: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly heroCta: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly filterButton: Locator;
  readonly emailInput: Locator;
  readonly subscribeBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Loose: id only — survives <a> → <span> mutation
    this.navProducts = page.locator("#nav-products");
    this.navDeals = page.locator("#nav-deals");

    // Loose: id only — survives <button> → <div> mutation
    this.cartButton = page.locator("#cart-btn");
    this.cartCount = page.locator("#cart-count");

    // Loose: id only — survives type="search" → type="text" mutation
    this.searchInput = page.locator("#search-input");
    this.searchButton = page.locator("#search-btn");

    // Loose: id only — survives <button> → <div> mutation
    this.heroCta = page.locator("#hero-cta");

    this.productGrid = page.locator("#product-grid");
    this.productCards = page.locator('[data-testid^="product-card-"]');
    this.filterButton = page.locator("#filter-btn");

    // Loose: id only — note: email-name-change mutation also shifts the id
    // to "mail-input" so this locator will break for that specific mutation,
    // which is intentional — even loose locators have limits when ids move.
    this.emailInput = page.locator("#email-input");
    this.subscribeBtn = page.locator("#subscribe-btn");
  }

  async goto() {
    await this.page.goto(PAGE_URL);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /** Loose: data-product attribute — survives <button> → <div> mutation */
  addToCartBtn(cardIndex: number): Locator {
    return this.page.locator(
      `[data-testid="product-card-${cardIndex}"] [data-product="${cardIndex}"]`,
    );
  }

  /** Loose: id only — survives <h3> → <div> mutation */
  productName(cardIndex: number): Locator {
    return this.page.locator(`#product-name-${cardIndex}`);
  }

  /** Loose: id only — survives <strong> → <span> mutation */
  productPrice(cardIndex: number): Locator {
    return this.page.locator(`#price-${cardIndex}`);
  }
}

// ─────────────────────────────────────────────────────────────
//  Test suite
//
//  These tests validate behaviour only — clicks work, values
//  update, content is visible. They say nothing about whether
//  the DOM is semantically correct. That is Claude's job.
// ─────────────────────────────────────────────────────────────
test.describe("ShopLab — Navigation", () => {
  test("nav links are visible", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();
    await expect(shop.navProducts).toBeVisible();
    await expect(shop.navDeals).toBeVisible();
  });

  test("cart button is visible and clickable", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    // Passes even after cart-button-to-div mutation.
    // Playwright click() fires a synthetic mouse event on any element.
    // It cannot tell you whether the element is keyboard accessible.
    await expect(shop.cartButton).toBeVisible();
    await shop.cartButton.click();
  });
});

test.describe("ShopLab — Search", () => {
  test("user can type into search and submit", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    // Passes even after search-type-change mutation (type="search" → type="text").
    // fill() works on any input regardless of its type attribute.
    await shop.searchInput.fill("keyboard");
    await expect(shop.searchInput).toHaveValue("keyboard");
    await shop.searchButton.click();
    await expect(shop.productGrid).toBeVisible();
  });
});

test.describe("ShopLab — Hero", () => {
  test("hero CTA is visible and clickable", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    // Passes even after hero-cta-to-div mutation.
    // The element exists and click() dispatches fine on a <div>.
    await expect(shop.heroCta).toBeVisible();
    await shop.heroCta.click();
  });
});

test.describe("ShopLab — Product Grid", () => {
  test("renders exactly 6 product cards", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();
    await expect(shop.productCards).toHaveCount(6);
  });

  test("product names are visible", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    // Passes after product-heading-to-div mutation.
    // The text still renders — just in a <div> instead of an <h3>.
    for (let i = 1; i <= 6; i++) {
      await expect(shop.productName(i)).toBeVisible();
    }
  });

  test("product prices are visible and formatted correctly", async ({
    page,
  }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    // Passes after price-strong-to-span mutation.
    // The price text renders fine in a <span>. The semantic loss is invisible here.
    for (let i = 1; i <= 6; i++) {
      const priceEl = shop.productPrice(i);
      await expect(priceEl).toBeVisible();
      const text = await priceEl.textContent();
      expect(text).toMatch(/^\$\d+/);
    }
  });

  test("add-to-cart increments the cart counter", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    await expect(shop.cartCount).toHaveText("0");

    // NOTE: this WILL fail after add-btn-to-div mutation because the click
    // handler is attached to the original <button> and does not transfer to
    // the replacement <div>. One of the few cases a loose locator still
    // surfaces a real behavioural failure — worth calling out in the blog post.
    await shop.addToCartBtn(1).click();
    await expect(shop.cartCount).toHaveText("1");

    await shop.addToCartBtn(3).click();
    await shop.addToCartBtn(5).click();
    await expect(shop.cartCount).toHaveText("3");
  });

  test("filter button is visible", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();
    await expect(shop.filterButton).toBeVisible();
  });
});

test.describe("ShopLab — Newsletter", () => {
  test("email input accepts a valid email address", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    await shop.emailInput.fill("qa-engineer@example.com");
    await expect(shop.emailInput).toHaveValue("qa-engineer@example.com");
    await shop.subscribeBtn.click();
  });
});

test.describe("ShopLab — Full user journey", () => {
  test("search → browse → add items → check cart", async ({ page }) => {
    const shop = new ShopLabPage(page);
    await shop.goto();

    await shop.searchInput.fill("audio");
    await shop.searchButton.click();

    await expect(shop.productGrid).toBeVisible();
    await expect(shop.productCards).toHaveCount(6);

    await shop.addToCartBtn(1).click();
    await shop.addToCartBtn(2).click();
    await shop.addToCartBtn(4).click();

    await expect(shop.cartCount).toHaveText("3");

    await shop.cartButton.click();

    await shop.emailInput.fill("test@shoplab.io");
    await shop.subscribeBtn.click();
  });
});
