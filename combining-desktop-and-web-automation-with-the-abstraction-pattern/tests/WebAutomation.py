from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from typing import Optional, Tuple

from UIAutomationInterface import UIAutomationInterface


class WebAutomation(UIAutomationInterface):
    """Web automation implementation using Selenium WebDriver."""

    def __init__(self, browser: str = 'chrome', headless: bool = False):
        """Initialize WebDriver."""
        if browser.lower() == 'chrome':
            options = webdriver.ChromeOptions()
            if headless:
                options.add_argument('--headless')
            self.driver = webdriver.Chrome(options=options)
        elif browser.lower() == 'firefox':
            options = webdriver.FirefoxOptions()
            if headless:
                options.add_argument('--headless')
            self.driver = webdriver.Firefox(options=options)
        else:
            raise ValueError(f"Unsupported browser: {browser}")

        self.wait = WebDriverWait(self.driver, 10)

    def _parse_element_identifier(self, element_identifier: str) -> Tuple[str, str]:
        """Parse element identifier into locator strategy and value."""
        if element_identifier.startswith('id:'):
            return By.ID, element_identifier[3:]
        elif element_identifier.startswith('class:'):
            return By.CLASS_NAME, element_identifier[6:]
        elif element_identifier.startswith('xpath:'):
            return By.XPATH, element_identifier[6:]
        elif element_identifier.startswith('css:'):
            return By.CSS_SELECTOR, element_identifier[4:]
        elif element_identifier.startswith('name:'):
            return By.NAME, element_identifier[5:]
        elif element_identifier.startswith('text:'):
            # Find by visible text
            text = element_identifier[5:]
            return By.XPATH, f"//*[text()='{text}']"
        else:
            # Default to ID if no prefix specified
            return By.ID, element_identifier

    def click(self, element_identifier: str) -> bool:
        """Click on a web element."""
        try:
            by, value = self._parse_element_identifier(element_identifier)
            element = self.wait.until(EC.element_to_be_clickable((by, value)))
            element.click()
            return True
        except TimeoutException:
            print(f"Element not clickable: {element_identifier}")
            return False
        except Exception as e:
            print(f"Click failed: {e}")
            return False

    def type_text(self, element_identifier: str, text: str) -> bool:
        """Type text into a web element."""
        try:
            by, value = self._parse_element_identifier(element_identifier)
            element = self.wait.until(EC.presence_of_element_located((by, value)))
            element.clear()  # Clear existing text
            element.send_keys(text)
            return True
        except TimeoutException:
            print(f"Element not found: {element_identifier}")
            return False
        except Exception as e:
            print(f"Type text failed: {e}")
            return False

    def find_element(self, element_identifier: str) -> Optional[object]:
        """Find and return a web element."""
        try:
            by, value = self._parse_element_identifier(element_identifier)
            return self.driver.find_element(by, value)
        except NoSuchElementException:
            return None
        except Exception as e:
            print(f"Find element failed: {e}")
            return None

    def get_text(self, element_identifier: str) -> str:
        """Get text content from a web element."""
        try:
            by, value = self._parse_element_identifier(element_identifier)
            element = self.driver.find_element(by, value)
            return element.text
        except NoSuchElementException:
            return ""
        except Exception as e:
            print(f"Get text failed: {e}")
            return ""

    def wait_for_element(self, element_identifier: str, timeout: int = 10) -> bool:
        """Wait for a web element to appear."""
        try:
            by, value = self._parse_element_identifier(element_identifier)
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return True
        except TimeoutException:
            return False

    def take_screenshot(self, filename: str) -> bool:
        """Take a screenshot of the web page."""
        try:
            self.driver.save_screenshot(filename)
            return True
        except Exception as e:
            print(f"Screenshot failed: {e}")
            return False

    def navigate_to(self, url: str) -> bool:
        """Navigate to a URL (web-specific method)."""
        try:
            self.driver.get(url)
            return True
        except Exception as e:
            print(f"Navigation failed: {e}")
            return False

    def close(self) -> None:
        """Close the browser and quit WebDriver."""
        if self.driver:
            self.driver.quit()
