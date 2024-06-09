async function switchLanguage(page, languageCode) {
  await page.click("#languages");
  await page.selectOption("#languages", languageCode);
}

module.exports = switchLanguage;
