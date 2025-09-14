const { test, expect, chromium } = require("@playwright/test");

const URL = ""; // adjust to your server

test("Automation is detected", async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL);
  await page.click("text=Run Detection");
  const result = await page.textContent("#output");
  console.log("Result (detected):", result);
  expect(result).toContain("Automation detected");
  await browser.close();
});

test("Automation is not detected (stealth)", async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Add stealth-like overrides
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", {
      get: () => [{ name: "FakePlugin" }],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  const page = await context.newPage();
  await page.goto(URL);
  await page.click("text=Run Detection");
  const result = await page.textContent("#output");
  console.log("Result (stealth):", result);
  expect(result).toContain("No automation detected");
  await browser.close();
});
