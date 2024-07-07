import puppeteer from "puppeteer";

async function checkLocatorEquivalence(url, locators) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const elementHandles = {};

  for (let locator of locators) {
    const elementHandle = await page.$$(`xpath/.${locator.value}`);
    if (elementHandle.length > 0) {
      const element = elementHandle[0];
      const elementId = await page.evaluate((el) => el.outerHTML, element);

      if (!elementHandles[elementId]) {
        elementHandles[elementId] = [];
      }
      elementHandles[elementId].push(locator);
    }
  }

  const result = Object.values(elementHandles).filter(
    (group) => group.length > 1
  );

  await browser.close();
  return result;
}

export { checkLocatorEquivalence };
