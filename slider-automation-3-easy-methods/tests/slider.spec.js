const { test, expect } = require("@playwright/test");

test("Drag-and-Drop Actions", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/index.html"); // Update this path to your actual file/website

  const slider = await page.$("#priceRangeSlider");

  const boundingBox = await slider.boundingBox();
  const startX = boundingBox.x;
  const sliderWidth = boundingBox.width;

  const minPosition = startX;
  const midPosition = startX + sliderWidth / 2;
  const maxPosition = startX + sliderWidth;

  await page.mouse.move(startX, boundingBox.y + boundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(minPosition, boundingBox.y + boundingBox.height / 2);
  await page.mouse.up();
  expect(page.locator("#sliderValue")).toHaveText("10");

  await page.mouse.move(startX, boundingBox.y + boundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(midPosition, boundingBox.y + boundingBox.height / 2);
  await page.mouse.up();
  expect(page.locator("#sliderValue")).toHaveText("155");

  await page.mouse.move(startX, boundingBox.y + boundingBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(maxPosition, boundingBox.y + boundingBox.height / 2);
  await page.mouse.up();
  expect(page.locator("#sliderValue")).toHaveText("300");
});

test("Keyboard-Based Interactions", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/index.html"); // Update this path to your actual file/website

  const slider = await page.$("#priceRangeSlider");
  await slider.focus();

  async function setSliderValue(targetValue) {
    let currentValue = await page.evaluate((el) => el.value, slider);

    while (parseInt(currentValue, 10) < targetValue) {
      await slider.press("ArrowRight");
      currentValue = await page.evaluate((el) => el.value, slider);
    }

    while (parseInt(currentValue, 10) > targetValue) {
      await slider.press("ArrowLeft");
      currentValue = await page.evaluate((el) => el.value, slider);
    }
  }

  await setSliderValue(10);
  await expect(page.locator("#sliderValue")).toHaveText("10");
  await setSliderValue(50);
  await expect(page.locator("#sliderValue")).toHaveText("50");
  await setSliderValue(150);
  await expect(page.locator("#sliderValue")).toHaveText("150");
  await setSliderValue(300);
  await expect(page.locator("#sliderValue")).toHaveText("300");
});

test("Direct Value Injection", async ({ page }) => {
  await page.goto("http://127.0.0.1:5500/index.html"); // Update this path to your actual file/website

  async function setSliderValueDirectly(targetValue) {
    await page.evaluate((targetValue) => {
      const slider = document.getElementById("priceRangeSlider");
      slider.value = targetValue;
      slider.dispatchEvent(new Event("input"));
    }, targetValue);
  }

  // Set slider to 10, 50, 150, and 300 as examples
  await setSliderValueDirectly(10);
  await expect(page.locator("#sliderValue")).toHaveText("10");

  await setSliderValueDirectly(50);
  await expect(page.locator("#sliderValue")).toHaveText("50");

  await setSliderValueDirectly(150);
  await expect(page.locator("#sliderValue")).toHaveText("150");

  await setSliderValueDirectly(300);
  await expect(page.locator("#sliderValue")).toHaveText("300");
});
