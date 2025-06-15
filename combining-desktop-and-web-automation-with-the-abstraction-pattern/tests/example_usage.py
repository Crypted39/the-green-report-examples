import json
from typing import Dict, Any

import UIAutomationInterface
from DesktopAutomation import DesktopAutomation
from WebAutomation import WebAutomation


class AutomationConfig:
    """Configuration manager for cross-platform automation."""

    def __init__(self, config_file: str = 'automation_config.json'):
        self.config_file = config_file
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from JSON file."""
        default_config = {
            "platform": "web",  # or "desktop"
            "web": {
                "browser": "chrome",
                "headless": False,
                "implicit_wait": 10
            },
            "desktop": {
                "screenshot_on_failure": True,
                "pause_between_actions": 0.5
            },
            "elements": {
                "login_button": {
                    "web": "id:login-btn",
                    "desktop": "login_button.png"
                },
                "username_field": {
                    "web": "id:username",
                    "desktop": "username_field.png"
                },
                "password_field": {
                    "web": "id:password",
                    "desktop": "password_field.png"
                }
            }
        }

        try:
            with open(self.config_file, 'r') as f:
                loaded_config = json.load(f)
                # Merge with defaults
                default_config.update(loaded_config)
                return default_config
        except FileNotFoundError:
            # Create default config file
            with open(self.config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config

    def get_element_identifier(self, element_name: str) -> str:
        """Get platform-specific element identifier."""
        platform = self.config.get('platform', 'web')
        elements = self.config.get('elements', {})

        if element_name in elements and platform in elements[element_name]:
            return elements[element_name][platform]
        else:
            raise ValueError(f"Element '{element_name}' not configured for platform '{platform}'")

    def get_platform_config(self) -> Dict[str, Any]:
        """Get configuration for current platform."""
        platform = self.config.get('platform', 'web')
        return self.config.get(platform, {})


# Factory Pattern Implementation
class AutomationFactory:
    """Factory class to create appropriate automation instances."""

    @staticmethod
    def create_automation(config: AutomationConfig) -> UIAutomationInterface:
        """Create automation instance based on configuration."""
        platform = config.config.get('platform', 'web')

        if platform.lower() == 'web':
            platform_config = config.get_platform_config()
            return WebAutomation(
                browser=platform_config.get('browser', 'chrome'),
                headless=platform_config.get('headless', False)
            )
        elif platform.lower() == 'desktop':
            return DesktopAutomation()
        else:
            raise ValueError(f"Unsupported platform: {platform}")


# Test Script That Works With Both Platforms
class CrossPlatformTestSuite:
    """Test suite that works across web and desktop platforms."""

    def __init__(self, config_file: str = 'automation_config.json'):
        self.config = AutomationConfig(config_file)
        self.automation = AutomationFactory.create_automation(self.config)
        self.test_results = []

    def setup(self):
        """Setup method - can be customized per platform."""
        platform = self.config.config.get('platform')
        if platform == 'web':
            # Navigate to application URL
            web_config = self.config.get_platform_config()
            app_url = web_config.get('app_url', 'http://localhost:3000')
            if hasattr(self.automation, 'navigate_to'):
                self.automation.navigate_to(app_url)

    def test_login_workflow(self, username: str, password: str) -> bool:
        """Test login workflow - works on both web and desktop."""
        try:
            print("Starting login test...")

            # Wait for login form to be available
            username_field = self.config.get_element_identifier('username_field')
            if not self.automation.wait_for_element(username_field, timeout=10):
                print("Username field not found")
                return False

            # Enter username
            print("Entering username...")
            if not self.automation.type_text(username_field, username):
                print("Failed to enter username")
                return False

            # Enter password
            password_field = self.config.get_element_identifier('password_field')
            print("Entering password...")
            if not self.automation.type_text(password_field, password):
                print("Failed to enter password")
                return False

            # Click login button
            login_button = self.config.get_element_identifier('login_button')
            print("Clicking login button...")
            if not self.automation.click(login_button):
                print("Failed to click login button")
                return False

            # Wait for successful login (this would need to be configured)
            # For demo purposes, we'll just wait a moment
            import time
            time.sleep(2)

            print("Login test completed successfully")
            return True

        except Exception as e:
            print(f"Login test failed: {e}")
            self.automation.take_screenshot(f"login_failure_{int(time.time())}.png")
            return False

    def test_form_submission(self, form_data: Dict[str, str]) -> bool:
        """Test form submission - adaptable to different platforms."""
        try:
            print("Starting form submission test...")

            for field_name, field_value in form_data.items():
                try:
                    element_id = self.config.get_element_identifier(field_name)
                    if not self.automation.type_text(element_id, field_value):
                        print(f"Failed to fill field: {field_name}")
                        return False
                except ValueError:
                    print(f"Field '{field_name}' not configured, skipping...")
                    continue

            # Submit form
            submit_button = self.config.get_element_identifier('submit_button')
            if not self.automation.click(submit_button):
                print("Failed to submit form")
                return False

            print("Form submission test completed successfully")
            return True

        except Exception as e:
            print(f"Form submission test failed: {e}")
            return False

    def run_test_suite(self):
        """Run complete test suite."""
        print(f"Running tests on platform: {self.config.config.get('platform')}")

        self.setup()

        # Test login
        login_result = self.test_login_workflow("username", "password")
        self.test_results.append(("Login Test", login_result))

        if login_result:
            # Test form submission (only if login succeeded)
            form_data = {
                "first_name_field": "John",
                "last_name_field": "Doe",
                "email_field": "john.doe@example.com"
            }
            form_result = self.test_form_submission(form_data)
            self.test_results.append(("Form Submission Test", form_result))

        self.teardown()
        self.report_results()

    def teardown(self):
        """Cleanup after tests."""
        self.automation.close()

    def report_results(self):
        """Report test results."""
        print("\n" + "=" * 50)
        print("TEST RESULTS")
        print("=" * 50)

        passed = 0
        total = len(self.test_results)

        for test_name, result in self.test_results:
            status = "PASS" if result else "FAIL"
            print(f"{test_name}: {status}")
            if result:
                passed += 1

        print(f"\nSummary: {passed}/{total} tests passed")
        print("=" * 50)


# Diagnostic Script for Desktop Automation
def diagnose_desktop_automation():
    """Diagnostic script to help troubleshoot image recognition issues."""
    import os
    import pyautogui

    print("=== Desktop Automation Diagnostics ===")
    print(f"Current working directory: {os.getcwd()}")
    print(f"PyAutoGUI version: {pyautogui.__version__}")
    print(f"Screen size: {pyautogui.size()}")

    # Check if image files exist
    image_files = ['username_field.png', 'password_field.png', 'login_button.png']
    print("\n--- Image File Check ---")
    for img_file in image_files:
        exists = os.path.exists(img_file)
        print(f"{img_file}: {'EXISTS' if exists else 'NOT FOUND'}")
        if exists:
            # Try to locate the image
            try:
                location = pyautogui.locateOnScreen(img_file, confidence=0.8)
                if location:
                    print(f"  -> Found on screen at: {location}")
                else:
                    print(f"  -> File exists but not found on screen")
            except Exception as e:
                print(f"  -> Error locating: {e}")

    # Take a screenshot for manual comparison
    print("\n--- Taking current screenshot for comparison ---")
    screenshot = pyautogui.screenshot()
    screenshot_path = 'current_screen_debug.png'
    screenshot.save(screenshot_path)
    print(f"Current screen saved as: {screenshot_path}")
    print("Compare this with your reference images to check for differences")

    # Test with different confidence levels
    print("\n--- Testing different confidence levels ---")
    for img_file in image_files:
        if os.path.exists(img_file):
            print(f"Testing {img_file}:")
            for confidence in [0.9, 0.8, 0.7, 0.6, 0.5]:
                try:
                    location = pyautogui.locateOnScreen(img_file, confidence=confidence)
                    if location:
                        print(f"  Confidence {confidence}: FOUND at {location}")
                        break
                    else:
                        print(f"  Confidence {confidence}: Not found")
                except Exception as e:
                    print(f"  Confidence {confidence}: Error - {e}")


# Example usage
if __name__ == "__main__":
    # Run diagnostics first
    # diagnose_desktop_automation()

    # Create test suite
    test_suite = CrossPlatformTestSuite('automation_config.json')

    # Run tests
    test_suite.run_test_suite()
