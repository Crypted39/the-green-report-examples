document.addEventListener("DOMContentLoaded", function () {
  const contentElement = document.getElementById("main-content");
  const dateElement = document.getElementById("date");
  const numberElement = document.getElementById("number");
  const languageSelect = document.getElementById("languages");

  const translations = {
    en: {
      paragraph:
        "So feel been kept be at gate. Be september it extensive oh concluded of certainty. In read most gate at body held it ever no. Talking justice welcome message inquiry in started of am me. Led own hearted highest visited lasting sir through compass his. Guest tiled he quick by so these trees am. It announcing alteration at surrounded comparison.",
      date: "31/12/2024",
      number: "1,234.56",
    },
    de: {
      paragraph:
        "So fühle ich mich am Tor gehalten. Es ist September, es ist umfangreich, oh, es ist sicher. Beim Lesen der meisten Tore am Körper hielt es nie. Ich rede über Gerechtigkeit, willkommene Nachricht, Anfrage, nicht gut. Ich führte mein eigenes Herz, besuchte den höchsten, dauerhaften Herrn durch seinen Kompass. Er hat schnell gekachelt, auch nicht gut dieser Bäume. Es kündigt eine Änderung im umgebenden Vergleich an.",
      date: "31.12.2024",
      number: "1.234,56",
    },
    es: {
      paragraph:
        "Así que siéntete mantenido en la puerta. Sea septiembre extenso oh concluido de certeza. En la lectura, la mayoría de las puertas del cuerpo siempre lo mantuvieron como no. Hablando de justicia, mensaje de bienvenida, consulta que comencé conmigo. Lideró al señor más alto de su corazón y lo visitó a través de su brújula. El invitado pasó rápido para que estos árboles sean. Anuncia alteración en comparación rodeada.",
      date: "31/12/2024",
      number: "1.234,56",
    },
  };

  function translateContent(targetLang) {
    const translation = translations[targetLang]?.paragraph;
    const dateTranslation = translations[targetLang]?.date;
    const numberTranslation = translations[targetLang]?.number;
    if (translation) {
      contentElement.textContent = translation;
      dateElement.textContent = dateTranslation;
      numberElement.textContent = numberTranslation;
    } else {
      console.warn(`Translation unavailable for language: ${targetLang}`);
    }
  }

  languageSelect.addEventListener("change", (event) => {
    const targetLang = event.target.value;
    translateContent(targetLang);
  });

  translateContent(languageSelect.value);
});
