// @ts-check
const { test, expect } = require("@playwright/test");

test("Authenticate user", async ({ page, context }) => {
  await page.goto("http://testing_website.com");

  // Wait for the second window to open
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    page.locator("#authButton").click(), // Ensure the button click is awaited
  ]);

  // Wait for the input field in the popup to appear
  const usernameField = popup.locator("#username");
  await usernameField.waitFor();

  // Fill in the username in the popup
  const username = "TestUser";
  await usernameField.fill(username);

  // Click the "Submit" button in the popup
  const submitButton = popup.locator("#submit");
  await submitButton.click();

  // Verify the message on the main page
  const authStatus = await page.locator("#auth-status").textContent();
  console.log(`Auth status: ${authStatus}`);
  expect(authStatus).toBe(`User ${username} successfully authenticated.`);
});
