const { test, expect } = require("@playwright/test");

test.describe("Animation Testing Examples", () => {
  test.beforeEach(async ({ page }) => {
    // Replace this with your actual file path or server URL
    await page.goto("");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("Test CSS fade-in animation trigger and completion", async ({
    page,
  }) => {
    const animatedElement = page.locator(".fade-in-element");

    // Verify element starts with opacity 0
    await expect(animatedElement).toHaveCSS("opacity", "0");

    // Trigger the animation
    await page.click("#trigger-animation");

    // Verify animation class was added immediately
    await expect(animatedElement).toHaveClass(/animate-fade-in/);

    // Wait for animation to complete - check for opacity close to 1
    await page.waitForFunction(
      () => {
        const element = document.querySelector(".fade-in-element");
        const opacity = parseFloat(window.getComputedStyle(element).opacity);
        return opacity > 0.99;
      },
      { timeout: 5000 }
    );

    // Test reset functionality
    await page.click("#reset-fade");
    await expect(animatedElement).not.toHaveClass(/animate-fade-in/);

    // Wait for fade-out animation to complete
    await page.waitForFunction(
      () => {
        const element = document.querySelector(".fade-in-element");
        const opacity = parseFloat(window.getComputedStyle(element).opacity);
        return opacity < 0.01;
      },
      { timeout: 3000 }
    );
  });

  test("Test loading spinner animation", async ({ page }) => {
    const spinner = page.locator(".loading-spinner");
    const successMessage = page.locator(".success-message");
    const submitButton = page.locator("#submit-btn");

    // Verify initial states
    await expect(spinner).not.toHaveClass(/spinning/);
    await expect(successMessage).toHaveCSS("display", "none");

    // Start loading
    await submitButton.click();

    // Verify spinner appears and is animating
    await expect(spinner).toHaveClass(/spinning/);

    // Verify success message is still hidden during loading
    await expect(successMessage).toHaveCSS("display", "none");

    // Wait for loading to complete (should take ~3 seconds)
    await expect(spinner).not.toHaveClass(/spinning/, { timeout: 4000 });
    await expect(successMessage).toHaveCSS("display", "block", {
      timeout: 4000,
    });
  });

  test("Test slide panel animation", async ({ page }) => {
    const slidePanel = page.locator(".slide-panel");
    const toggleButton = page.locator("#toggle-panel");

    // Verify initial state (panel should be translated off-screen to -400px)
    await expect(slidePanel).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, -400, 0)"
    );

    // Trigger slide in
    await toggleButton.click();

    // Wait for animation to complete - panel should slide in to 0px
    await expect(slidePanel).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
      { timeout: 2000 }
    );
    await expect(slidePanel).toHaveClass(/slide-in/);

    // Toggle back
    await toggleButton.click();

    // Panel should slide out
    await expect(slidePanel).not.toHaveClass(/slide-in/);
    await expect(slidePanel).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, -400, 0)",
      { timeout: 2000 }
    );
  });

  test("Test modal animation with backdrop", async ({ page }) => {
    const modal = page.locator(".modal");
    const modalBackdrop = page.locator(".modal-backdrop");
    const openModalBtn = page.locator("#open-modal");
    const closeModalBtn = page.locator("#close-modal");

    // Verify initial states
    await expect(modal).toBeHidden();
    await expect(modalBackdrop).toBeHidden();

    // Open modal
    await openModalBtn.click();

    // Wait for modal and backdrop to appear
    await expect(modal).toBeVisible();
    await expect(modalBackdrop).toBeVisible();

    // Wait for fade-in animations to complete
    await expect(modal).toHaveCSS("opacity", "1", { timeout: 1000 });
    await expect(modalBackdrop).toHaveCSS("opacity", "0.5", { timeout: 1000 });

    // Verify classes are added
    await expect(modal).toHaveClass(/show/);
    await expect(modalBackdrop).toHaveClass(/show/);

    // Close modal
    await closeModalBtn.click();

    // Wait for fade-out
    await expect(modal).toHaveCSS("opacity", "0", { timeout: 1000 });
    await expect(modal).toBeHidden();
    await expect(modalBackdrop).toBeHidden();
  });

  test("Test animated box transformation", async ({ page }) => {
    const animatedBox = page.locator(".animated-box");
    const animateBtn = page.locator("#animate-box");
    const resetBtn = page.locator("#reset-box");

    // Verify initial state
    await expect(animatedBox).not.toHaveClass(/animating/);

    // Record start time
    const startTime = Date.now();

    // Trigger animation
    await animateBtn.click();

    // Verify animation class is added
    await expect(animatedBox).toHaveClass(/animating/);

    // Wait for animation to complete using a more reliable method
    await page.waitForTimeout(600); // Wait for transition to complete (500ms + buffer)

    // Verify animation took reasonable time (around 500ms as defined in CSS)
    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThan(400);
    expect(duration).toBeLessThan(1500);

    // Reset animation
    await resetBtn.click();
    await expect(animatedBox).not.toHaveClass(/animating/);
  });

  test("Test hover animation effects", async ({ page }) => {
    const hoverElement = page.locator(".hover-effect");

    // Get initial background color
    const initialBg = await hoverElement.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Hover over element
    await hoverElement.hover();

    // Wait a moment for transition
    await page.waitForTimeout(400);

    // Verify color changed
    const hoverBg = await hoverElement.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    expect(hoverBg).not.toBe(initialBg);

    // Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);

    // Verify it returns to original color
    const finalBg = await hoverElement.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    expect(finalBg).toBe(initialBg);
  });

  test("Test respectful animation with reduced motion", async ({ page }) => {
    // Set prefers-reduced-motion to reduce
    await page.emulateMedia({ reducedMotion: "reduce" });

    const respectfulElement = page.locator(".respectful-animation");
    const triggerBtn = page.locator("#trigger-respectful-animation");
    const resetBtn = page.locator("#reset-respectful");

    // Get initial background color
    const initialBg = await respectfulElement.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Trigger animation
    await triggerBtn.click();

    // With reduced motion, element should change color instead of moving
    await page.waitForTimeout(100);

    const newBg = await respectfulElement.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Background should change (reduced motion fallback)
    expect(newBg).not.toBe(initialBg);

    // Reset
    await resetBtn.click();
  });

  test("Test respectful animation with normal motion", async ({ page }) => {
    // Ensure normal motion preferences
    await page.emulateMedia({ reducedMotion: "no-preference" });

    const respectfulElement = page.locator(".respectful-animation");
    const triggerBtn = page.locator("#trigger-respectful-animation");
    const resetBtn = page.locator("#reset-respectful");

    // Get initial transform
    const initialTransform = await respectfulElement.evaluate(
      (el) => window.getComputedStyle(el).transform
    );

    // Trigger animation
    await triggerBtn.click();

    // Element should have the animate class
    await expect(respectfulElement).toHaveClass(/animate/);

    // Wait for animation to complete
    await page.waitForTimeout(1100);

    // Verify element has moved (transform should have changed)
    const finalTransform = await respectfulElement.evaluate(
      (el) => window.getComputedStyle(el).transform
    );

    expect(finalTransform).not.toBe(initialTransform);
    expect(finalTransform).toContain("200"); // Should contain translateX(200px)

    // Reset
    await resetBtn.click();
    await expect(respectfulElement).not.toHaveClass(/animate/);
  });

  test("Test complex animation sequence", async ({ page }) => {
    const complexElement = page.locator(".complex-animation");
    const startBtn = page.locator("#start-complex-animation");
    const resetBtn = page.locator("#reset-complex");

    // Start complex animation
    await startBtn.click();

    // Verify animation class is added
    await expect(complexElement).toHaveClass(/start-complex/);

    // Wait for animation to complete (3 seconds)
    await page.waitForTimeout(3200);

    // Animation should still have the class but be back to original position
    await expect(complexElement).toHaveClass(/start-complex/);

    // Reset
    await resetBtn.click();
    await expect(complexElement).not.toHaveClass(/start-complex/);
  });

  test("Test animation results display", async ({ page }) => {
    const resultElement = page.locator(".animated-result");
    const triggerBtn = page.locator("#trigger-animation");

    // Initially hidden
    await expect(resultElement).toBeHidden();

    // Trigger any animation
    await triggerBtn.click();

    // Result should appear after a short delay
    await expect(resultElement).toBeVisible({ timeout: 1000 });
  });

  test("Performance test - multiple animations", async ({ page }) => {
    const startTime = Date.now();

    // Trigger multiple animations simultaneously
    await Promise.all([
      page.click("#trigger-animation"),
      page.click("#animate-box"),
      page.click("#trigger-respectful-animation"),
    ]);

    // Wait for all to complete
    await Promise.all([
      expect(page.locator(".fade-in-element")).toHaveClass(/animate-fade-in/),
      expect(page.locator(".animated-box")).toHaveClass(/animating/),
      expect(page.locator(".respectful-animation")).toHaveClass(/animate/),
    ]);

    const duration = Date.now() - startTime;

    // Should complete reasonably quickly
    expect(duration).toBeLessThan(3000);
  });

  test("Test modal backdrop click to close", async ({ page }) => {
    const modal = page.locator(".modal");
    const modalBackdrop = page.locator(".modal-backdrop");
    const closeBtn = page.locator("#close-modal");

    // Open modal
    await page.click("#open-modal");
    await expect(modal).toBeVisible();
    await expect(modalBackdrop).toBeVisible();

    // Wait for modal to fully appear with proper opacity
    await expect(modal).toHaveCSS("opacity", "1", { timeout: 1000 });

    // Close modal
    await closeBtn.click();

    // Wait for modal classes to be removed first
    await expect(modal).not.toHaveClass(/show/, { timeout: 2000 });
    await expect(modalBackdrop).not.toHaveClass(/show/, { timeout: 2000 });

    // Then check if modal becomes hidden
    await expect(modal).not.toBeVisible({ timeout: 2000 });
    await expect(modalBackdrop).not.toBeVisible({ timeout: 2000 });
  });

  // Test with animations disabled for faster execution
  test("Functional test with disabled animations", async ({ page }) => {
    // Inject CSS to disable all animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-delay: -1ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // Test functionality without waiting for animations
    await page.click("#trigger-animation");
    await expect(page.locator(".fade-in-element")).toHaveClass(
      /animate-fade-in/
    );

    await page.click("#submit-btn");
    await expect(page.locator(".loading-spinner")).toHaveClass(/spinning/);

    await page.click("#toggle-panel");
    await expect(page.locator(".slide-panel")).toHaveClass(/slide-in/);
  });
});
