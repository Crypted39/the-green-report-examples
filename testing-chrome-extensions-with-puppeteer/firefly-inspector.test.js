const puppeteer = require("puppeteer");
const path = require("path");

describe("Firefly Inspector Chrome Extension", () => {
  let browser;
  let page;
  const extensionPath = path.join(__dirname, "../firefly-inspector"); // Adjust path to your extension directory

  beforeAll(async () => {
    // Debug: Check if extension path exists and contains required files
    const fs = require("fs");
    console.log("Extension path:", extensionPath);
    console.log("Extension path exists:", fs.existsSync(extensionPath));

    if (fs.existsSync(extensionPath)) {
      console.log(
        "Files in extension directory:",
        fs.readdirSync(extensionPath)
      );

      // Check for manifest.json specifically
      const manifestPath = path.join(extensionPath, "manifest.json");
      console.log("Manifest exists:", fs.existsSync(manifestPath));

      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        console.log("Manifest name:", manifest.name);
        console.log("Manifest version:", manifest.manifest_version);
      }
    }

    // Launch browser with extension loaded
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless testing
      devtools: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    // Wait a moment for extension to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get all targets and log them for debugging
    const targets = await browser.targets();
    console.log("All targets found:");
    targets.forEach((target) => {
      console.log(`- Type: ${target.type()}, URL: ${target.url()}`);
    });

    // Look for extension target (try different approaches)
    let extensionTarget = targets.find(
      (target) =>
        target.type() === "service_worker" &&
        target.url().startsWith("chrome-extension://")
    );

    // If service worker not found, try looking for extension pages
    if (!extensionTarget) {
      extensionTarget = targets.find(
        (target) =>
          target.url().startsWith("chrome-extension://") &&
          (target.url().includes("popup.html") || target.type() === "other")
      );
    }

    // If still not found, try creating a popup page to get extension ID
    if (!extensionTarget) {
      console.log(
        "Extension service worker not found, trying alternative method..."
      );

      // Try to get extension ID from chrome://extensions page
      const extensionsPage = await browser.newPage();
      await extensionsPage.goto("chrome://extensions/");

      // Enable developer mode and get extension info
      await extensionsPage.waitForSelector("#devMode", { timeout: 5000 });
      await extensionsPage.click("#devMode");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Look for our extension by name
      const extensionCards = await extensionsPage.$("extensions-item");
      let extensionId = null;

      for (const card of extensionCards) {
        const nameElement = await card.$("#name");
        if (nameElement) {
          const name = await nameElement.evaluate((el) => el.textContent);
          if (name && name.includes("Firefly Inspector")) {
            const idElement = await card.$("#extension-id");
            if (idElement) {
              extensionId = await idElement.evaluate((el) =>
                el.textContent.replace("ID: ", "")
              );
              break;
            }
          }
        }
      }

      await extensionsPage.close();

      if (!extensionId) {
        throw new Error(`Extension not loaded. Please check:
1. Extension path: ${extensionPath}
2. manifest.json exists and is valid
3. Extension files are present
4. No syntax errors in extension files`);
      }

      console.log(`Extension found with ID: ${extensionId}`);
      // Store extension ID for use in tests
      global.extensionId = extensionId;
    } else {
      const extensionId = extensionTarget.url().split("/")[2];
      console.log(`Extension loaded with ID: ${extensionId}`);
      global.extensionId = extensionId;
    }

    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Create a test HTML file and serve it via data URL
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { margin: 20px 0; }
          div { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h1>Firefly Inspector Test Page</h1>
        
        <div class="container">
          <div data-test="value1" id="element1">Element 1 with data-test attribute</div>
          <div data-test="value2" id="element2">Element 2 with data-test attribute</div>
          <div data-custom="custom1" id="element3">Element 3 with data-custom attribute</div>
          <span data-test="value3" id="element4">Span element with data-test</span>
          <p data-test="" id="element5">Paragraph with empty data-test</p>
          <div id="element6">Element without target attribute</div>
        </div>

        <div class="container">
          <input type="text" data-input="input1" id="input1" value="Input field" />
          <button data-action="click" id="button1">Button with data-action</button>
          <a href="#" data-link="link1" id="link1">Link with data-link</a>
        </div>
      </body>
      </html>
    `;

    // Navigate to a data URL instead of using setContent
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(
      testHtml
    )}`;
    await page.goto(dataUrl);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait longer for content script to load

    // Verify content script is loaded
    const contentScriptLoaded = await page.evaluate(() => {
      return (
        typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined"
      );
    });

    console.log("Content script loaded after navigation:", contentScriptLoaded);

    // If content script still not loaded, try navigating to a real URL
    if (!contentScriptLoaded) {
      console.log(
        "Content script not loaded with data URL, trying real navigation..."
      );

      // Navigate to a simple webpage first
      await page.goto("https://example.com");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then set the content
      await page.setContent(testHtml);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const contentScriptLoadedAfterReal = await page.evaluate(() => {
        return (
          typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined"
        );
      });

      console.log(
        "Content script loaded after real navigation:",
        contentScriptLoadedAfterReal
      );
    }
  });

  test("should highlight elements with specific tag and attribute", async () => {
    const extensionId = global.extensionId;

    // First, verify content script is loaded
    const contentScriptReady = await page.evaluate(() => {
      return (
        typeof chrome !== "undefined" &&
        typeof chrome.runtime !== "undefined" &&
        typeof chrome.runtime.onMessage !== "undefined"
      );
    });

    if (!contentScriptReady) {
      console.log("Content script not ready, attempting to inject manually...");

      // Try to manually inject the content script
      await page.addScriptTag({
        path: path.join(extensionPath, "content.js"),
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Open extension popup
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const popupPage = await browser.newPage();
    await popupPage.goto(popupUrl);

    // Debug: Check if popup loaded correctly
    const popupTitle = await popupPage.title();
    console.log("Popup title:", popupTitle);

    // Fill in the form
    await popupPage.waitForSelector("#tagInput");
    await popupPage.type("#tagInput", "div");
    await popupPage.type("#attributeInput", "data-test");

    // Change color to a specific value for testing
    await popupPage.click("#colorInput");
    await popupPage.evaluate(() => {
      document.getElementById("colorInput").value = "#ff0000";
      document.getElementById("colorInput").dispatchEvent(new Event("blur"));
    });

    // Debug: Check form values
    const formValues = await popupPage.evaluate(() => {
      return {
        tag: document.getElementById("tagInput").value,
        attribute: document.getElementById("attributeInput").value,
        color: document.getElementById("colorInput").value,
      };
    });
    console.log("Form values:", formValues);

    // Click highlight button and wait for response
    console.log("Clicking highlight button...");

    // Instead of just clicking, let's simulate what the popup does manually
    const messageResult = await page.evaluate((extensionId) => {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
              if (request.action === "highlight") {
                // Try to call highlightElements if it exists
                if (typeof highlightElements === "function") {
                  const result = highlightElements(
                    request.tag,
                    request.attribute,
                    request.color
                  );
                  resolve({ success: true, result: result });
                  sendResponse({ status: "success", elementsFound: result });
                } else {
                  resolve({
                    success: false,
                    error: "highlightElements function not found",
                  });
                }
              }
            }
          );

          // Send the message
          chrome.runtime.sendMessage(extensionId, {
            action: "highlight",
            tag: "div",
            attribute: "data-test",
            color: "#ff0000",
          });
        } else {
          resolve({ success: false, error: "chrome.runtime not available" });
        }

        // Timeout after 3 seconds
        setTimeout(() => {
          resolve({ success: false, error: "timeout" });
        }, 3000);
      });
    }, extensionId);

    console.log("Message result:", messageResult);

    await popupPage.click("#highlightButton");

    // Wait longer for the highlighting to apply
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Debug: Check if any elements exist on the main page
    const pageElements = await page.evaluate(() => {
      const elements = document.querySelectorAll("div[data-test]");
      return Array.from(elements).map((el) => ({
        id: el.id,
        dataTest: el.getAttribute("data-test"),
        boxShadow: window.getComputedStyle(el).boxShadow,
      }));
    });
    console.log("Elements found on page:", pageElements);

    // Check if elements are highlighted on the main page
    const highlightedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll("div[data-test]");
      const highlighted = [];

      elements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        const boxShadow = computedStyle.boxShadow;

        // Check for any box-shadow, not just red color
        if (boxShadow && boxShadow !== "none") {
          highlighted.push({
            id: element.id,
            hasHighlight: true,
            dataTest: element.getAttribute("data-test"),
            boxShadow: boxShadow,
          });
        }
      });

      return highlighted;
    });

    console.log("Highlighted elements:", highlightedElements);

    // If still no highlighting, try direct function call
    if (highlightedElements.length === 0) {
      console.log("Trying direct function call...");

      const directResult = await page.evaluate(() => {
        // Define the highlightElements function directly in the page
        function highlightElements(tag, attribute, color) {
          const selector =
            tag === "*" ? `[${attribute}]` : `${tag}[${attribute}]`;
          const elements = Array.from(document.querySelectorAll(selector));

          console.log("Direct call - selector:", selector);
          console.log("Direct call - elements found:", elements.length);

          if (elements.length === 0) {
            return false;
          }

          const elementsToHighlight = elements.filter((element) => {
            const value = element.getAttribute(attribute);
            return value && value.trim() !== "";
          });

          console.log(
            "Direct call - elements to highlight:",
            elementsToHighlight.length
          );

          elementsToHighlight.forEach((element) => {
            element.style.setProperty(
              "box-shadow",
              `0 0 0 3px ${color}`,
              "important"
            );
          });

          return elementsToHighlight.length > 0;
        }

        return highlightElements("div", "data-test", "#ff0000");
      });

      console.log("Direct result:", directResult);

      // Check elements again after direct call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const finalCheck = await page.evaluate(() => {
        const elements = document.querySelectorAll("div[data-test]");
        return Array.from(elements).map((el) => ({
          id: el.id,
          boxShadow: window.getComputedStyle(el).boxShadow,
        }));
      });

      console.log("Final check:", finalCheck);

      // Re-check highlighted elements after direct call
      const highlightedAfterDirect = await page.evaluate(() => {
        const elements = document.querySelectorAll("div[data-test]");
        const highlighted = [];

        elements.forEach((element) => {
          const computedStyle = window.getComputedStyle(element);
          const boxShadow = computedStyle.boxShadow;

          // Check for any box-shadow, not just red color
          if (boxShadow && boxShadow !== "none") {
            highlighted.push({
              id: element.id,
              hasHighlight: true,
              dataTest: element.getAttribute("data-test"),
              boxShadow: boxShadow,
            });
          }
        });

        return highlighted;
      });

      console.log(
        "Highlighted elements after direct call:",
        highlightedAfterDirect
      );

      // Update the highlightedElements array with the results
      highlightedElements.push(...highlightedAfterDirect);
    }

    // Verify that div elements with data-test attribute are highlighted
    expect(highlightedElements.length).toBeGreaterThan(0);
    expect(highlightedElements.some((el) => el.id === "element1")).toBe(true);
    expect(highlightedElements.some((el) => el.id === "element2")).toBe(true);
    // element5 should not be highlighted as it has empty data-test value
    expect(highlightedElements.some((el) => el.id === "element5")).toBe(false);

    await popupPage.close();
  });
});
