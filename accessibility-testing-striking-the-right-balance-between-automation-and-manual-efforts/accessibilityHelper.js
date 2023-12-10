import assert from "assert";

// Function to ensure ARIA attributes are present and correct
async function verifyARIAAttributes() {
  const elements = await browser.execute(() => {
    const elements = document.querySelectorAll("[role]");
    return Array.from(elements);
  });
  elements.forEach((element) => {
    const roleAttribute = element.getAttribute("role");
    assert.ok(
      roleAttribute && roleAttribute.trim() !== "",
      `Missing or empty ARIA role on element: ${element}`
    );
  });
}

// Function to verify the presence of alt text in images
async function verifyAltText() {
  const images = await browser.execute(() => {
    const images = document.querySelectorAll("img");
    return Array.from(images).map((image) => ({
      alt: image.getAttribute("alt") || "",
      src: image.getAttribute("src") || "",
    }));
  });
  images.forEach((image, index) => {
    assert.ok(
      image.alt.trim() !== "",
      `Missing or empty alt text on image ${index + 1}: ${image.src}`
    );
  });
}

// Function to verify the sufficient contrast ratio in text elements
async function verifyContrastRatios() {
  const textElements = await browser.execute(() => {
    const textElements = document.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, a"
    );
    return Array.from(textElements).map((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      };
    });
  });

  textElements.forEach(({ color, backgroundColor }, index) => {
    const contrastRatio = this.getContrastRatio(color, backgroundColor);
    assert.ok(
      contrastRatio >= 4.5,
      `Insufficient contrast ratio in text element ${index + 1}`
    );
  });
}

async function getContrastRatio(color1, color2) {
  // Convert hexadecimal color codes to RGB
  const rgb1 = this.hexToRgb(color1);
  const rgb2 = this.hexToRgb(color2);
  console.log(rgb1);
  // Calculate luminance using the relative luminance formula
  const luminance1 = this.calculateRelativeLuminance(rgb1);
  const luminance2 = this.calculateRelativeLuminance(rgb2);

  // Ensure the brighter color is in the numerator
  const brighterLuminance = Math.max(luminance1, luminance2);
  const darkerLuminance = Math.min(luminance1, luminance2);

  // Calculate the contrast ratio
  const contrastRatio = (brighterLuminance + 0.05) / (darkerLuminance + 0.05);

  return contrastRatio;
}

// Helper function to convert hexadecimal color code to RGB
async function hexToRgb(hex) {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, "");

  // Parse the hex value into RGB components
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}

// Helper function to calculate relative luminance
async function calculateRelativeLuminance(rgb) {
  // Normalize RGB values to be in the range [0, 1]
  const normalizedRgb = Object.values(rgb).map((value) => value / 255);

  // Apply gamma correction
  const gammaCorrectedRgb = normalizedRgb.map((value) =>
    value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  );

  // Calculate relative luminance using the linear RGB components
  const relativeLuminance =
    0.2126 * gammaCorrectedRgb[0] +
    0.7152 * gammaCorrectedRgb[1] +
    0.0722 * gammaCorrectedRgb[2];

  return relativeLuminance;
}

// Function to ensure all form fields have associated labels
async function verifyFormLabels() {
  const formFields = await browser.execute(() => {
    const fields = document.querySelectorAll("input, select, textarea");
    return Array.from(fields).map((field) => {
      return {
        id: field.id,
        type: field.tagName.toLowerCase(),
      };
    });
  });

  for (const field of formFields) {
    const associatedLabel = await browser.execute((fieldId) => {
      const label = document.querySelector(`label[for="${fieldId}"]`);
      return label ? label.innerText : null;
    }, field.id);

    if (!associatedLabel) {
      console.error(
        `Form field lacks associated label: ${field.type} with ID ${field.id}`
      );
    }
  }
}

// Function to verify keyboard navigation
async function verifyKeyboardNavigation() {
  const interactiveElements = await browser.execute(() => {
    const elements = document.querySelectorAll(
      "a, button, input, select, textarea"
    );
    return Array.from(elements).map((element) => {
      return {
        tagName: element.tagName.toLowerCase(),
        id: element.id,
        tabindex: element.getAttribute("tabindex"),
      };
    });
  });

  for (const element of interactiveElements) {
    await browser.execute((elementId) => {
      const interactiveElement = document.getElementById(elementId);
      if (interactiveElement) {
        interactiveElement.addEventListener("focus", () => {
          assert.strictEqual(
            document.activeElement,
            interactiveElement,
            `Element with id '${elementId}' is not focusable.`
          );
          const tabindex = interactiveElement.getAttribute("tabindex");
          assert.ok(
            tabindex !== null && !isNaN(Number(tabindex)),
            `Element with id '${elementId}' does not have a valid tabindex.`
          );
          // Additional checks for keyboard navigation if needed
        });
      }
    }, element.id);
    // Additional WebDriverIO assertions or checks if needed
  }
}

// Function to verify meaningful labels for ARIA landmarks
async function verifyARIALandmarkLabels() {
  const landmarks = await browser.execute(() => {
    const landmarks = document.querySelectorAll(
      '[role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]'
    );
    return Array.from(landmarks).map((landmark) =>
      landmark.getAttribute("aria-label")
    );
  });
  landmarks.forEach((label, index) => {
    if (!label) {
      console.error(
        `ARIA landmark ${index + 1} does not have a meaningful label.`
      );
    }
  });
}

// Function to verify valid ARIA roles for dynamic content
async function verifyValidARIARolesForDynamicContent() {
  const dynamicContent = await browser.execute(() => {
    const elements = document.querySelectorAll(".dynamic-content");
    return Array.from(elements).map((element) => element.getAttribute("role"));
  });
  dynamicContent.forEach((role, index) => {
    if (!role) {
      console.error(
        `Dynamic content ${index + 1} does not have a valid ARIA role.`
      );
    }
  });
}

export {
  verifyARIAAttributes,
  verifyAltText,
  verifyContrastRatios,
  verifyFormLabels,
  verifyKeyboardNavigation,
  verifyARIALandmarkLabels,
  verifyValidARIARolesForDynamicContent,
};
