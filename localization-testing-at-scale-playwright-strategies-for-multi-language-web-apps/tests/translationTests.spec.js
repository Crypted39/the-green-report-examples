// @ts-check
const { test, expect } = require("@playwright/test");
import switchLanguage from "../utils/languageSwitcher";
import validateText from "../utils/textValidator";
import i18next from "i18next";
import compareScreenshot from "../utils/screenshotComparator";

const dateFormats = {
  en: /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  de: /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
  es: /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
};

const numberFormats = {
  en: /^\d{1,3}(,\d{3})*(\.\d{2})?$/, // 1,234.56
  de: /^\d{1,3}(\.\d{3})*(,\d{2})?$/, // 1.234,56
  es: /^\d{1,3}(\.\d{3})*(,\d{2})?$/, // 1.234,56
};

test.beforeAll(async () => {
  await i18next.init(
    {
      lng: "en",
      resources: {
        de: {
          translation: {
            content:
              "So fühle ich mich am Tor gehalten. Es ist September, es ist umfangreich, oh, es ist sicher. Beim Lesen der meisten Tore am Körper hielt es nie. Ich rede über Gerechtigkeit, willkommene Nachricht, Anfrage, ich bin es. Ich führte mein eigenes Herz, besuchte den höchsten, dauerhaften Herrn durch seinen Kompass. Er hat schnell gekachelt, also bin ich dieser Bäume. Es kündigt eine Änderung im umgebenden Vergleich an.",
          },
        },
        es: {
          translation: {
            content:
              "Así que siéntete mantenido en la puerta. Sea septiembre extenso oh concluido de certeza. En la lectura, la mayoría de las puertas del cuerpo siempre lo mantuvieron como no. Hablando de justicia, mensaje de bienvenida, consulta que comencé conmigo. Lideró al señor más alto de su corazón y lo visitó a través de su brújula. El invitado pasó rápido para que estos árboles sean. Anuncia alteración en comparación rodeada.",
          },
        },
        en: {
          translation: {
            content:
              "So feel been kept be at gate. Be september it extensive oh concluded of certainty. In read most gate at body held it ever no. Talking justice welcome message inquiry in started of am me. Led own hearted highest visited lasting sir through compass his. Guest tiled he quick by so these trees am. It announcing alteration at surrounded comparison.",
          },
        },
      },
    },
    (err, t) => {
      if (err) {
        console.error("Error initializing i18next:", err);
      } else {
        console.log("i18next initialized successfully");
      }
    }
  );
});

const languages = ["en", "es", "de"]; // Add more languages as needed

// wrong translation has been added for German (de)
languages.forEach((language) => {
  test(`Validate translations for ${language}`, async ({ page }) => {
    await page.goto("http://127.0.0.1:5500/index.html");
    await switchLanguage(page, language);
    await validateText(page, "#main-content", "content", language);
  });
});

Object.keys(dateFormats).forEach((language) => {
  test(`Verify date format for ${language}`, async ({ page }) => {
    await page.goto("http://127.0.0.1:5500/index.html");
    await switchLanguage(page, language);
    const dateText = await page.textContent("#date");
    expect(dateText).toMatch(dateFormats[language]);
  });
});

Object.keys(numberFormats).forEach((language) => {
  test(`Verify number format for ${language}`, async ({ page }) => {
    await page.goto("http://127.0.0.1:5500/index.html");
    await switchLanguage(page, language);
    const numberText = await page.textContent("#number");
    expect(numberText).toMatch(numberFormats[language]);
  });
});

// wrong translation has been added for German (de)
languages.forEach((language) => {
  test(`Ensure UI consistency for ${language}`, async ({ page }) => {
    await page.goto("http://127.0.0.1:5500/index.html");
    await switchLanguage(page, language);
    await compareScreenshot(page);
  });
});
