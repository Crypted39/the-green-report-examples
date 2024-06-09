const i18next = require("i18next");

async function validateText(page, selector, translationKey, languageCode) {
  const element = await page.$(selector);
  const text = await element.textContent();
  const expectedText = i18next.t(translationKey, { lng: languageCode });
  if (text !== expectedText) {
    throw new Error(
      `Text mismatch: expected "${expectedText}", found "${text}" in ${languageCode}`
    );
  }
}

module.exports = validateText;
