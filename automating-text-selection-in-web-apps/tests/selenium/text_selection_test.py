from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Initialize the driver
driver = webdriver.Chrome()
driver.get("http://localhost:3000")

# Wait for the paragraph to be loaded
wait = WebDriverWait(driver, 10)
paragraph = wait.until(EC.presence_of_element_located((By.ID, "demo-text")))

# Get paragraph text and find the position of the date
paragraph_text = paragraph.text
date_text = "March 15, 2025"
if date_text not in paragraph_text:
    raise Exception(f"'{date_text}' not found in the paragraph text")

# Execute JavaScript to select the specific text and trigger the action menu
driver.execute_script("""
    // Find all text nodes in the document
    const textNodes = [];
    function getTextNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                getTextNodes(node.childNodes[i]);
            }
        }
    }
    getTextNodes(document.body);

    // Find the text node containing our date
    const dateText = arguments[0];
    let targetNode = null;
    let targetOffset = -1;

    for (const node of textNodes) {
        const index = node.textContent.indexOf(dateText);
        if (index >= 0) {
            targetNode = node;
            targetOffset = index;
            break;
        }
    }

    if (targetNode) {
        // Create a new selection
        const range = document.createRange();
        range.setStart(targetNode, targetOffset);
        range.setEnd(targetNode, targetOffset + dateText.length);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Dispatch a mouseup event to trigger the selection handler
        const mouseupEvent = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.dispatchEvent(mouseupEvent);

        return true;
    }
    return false;
""", date_text)

# Wait a moment for the action menu to appear
time.sleep(0.5)

# Verify the action menu is visible
action_menu = wait.until(EC.visibility_of_element_located((By.ID, "action-menu")))
assert action_menu.is_displayed(), "Action menu is not displayed after text selection"

# Optional: Verify the action button text
action_button = action_menu.find_element(By.TAG_NAME, "button")
assert action_button.text == "Add to Calendar", f"Expected 'Add to Calendar' button, got '{action_button.text}'"

print("Text selection and action menu verification successful!")

# Close the browser
driver.quit()
