import pyautogui
import time

from typing import Optional, Tuple

from UIAutomationInterface import UIAutomationInterface


class DesktopAutomation(UIAutomationInterface):
    """Desktop automation implementation using PyAutoGUI."""

    def __init__(self):
        # Configure PyAutoGUI settings
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.5
        self.screenshot_counter = 0

    def click(self, element_identifier: str) -> bool:
        """
        Click on desktop element. Identifier can be:
        - Image filename: 'button.png'
        - Coordinates: '100,200'
        - Text to find and click: 'text:Submit'
        """
        try:
            if element_identifier.startswith('text:'):
                # Find text on screen and click it
                text = element_identifier[5:]  # Remove 'text:' prefix
                location = pyautogui.locateOnScreen(f'text_{text}.png')
                if location:
                    pyautogui.click(pyautogui.center(location))
                    return True
                return False
            elif ',' in element_identifier:
                # Coordinates format: x,y
                x, y = map(int, element_identifier.split(','))
                pyautogui.click(x, y)
                return True
            else:
                # Image file
                location = pyautogui.locateOnScreen(element_identifier)
                if location:
                    pyautogui.click(pyautogui.center(location))
                    return True
                return False
        except Exception as e:
            print(f"Click failed: {e}")
            return False

    def type_text(self, element_identifier: str, text: str) -> bool:
        """Type text. First click on the element, then type."""
        if self.click(element_identifier):
            time.sleep(0.5)  # Wait for element to be focused
            pyautogui.typewrite(text)
            return True
        return False

    def find_element(self, element_identifier: str) -> Optional[Tuple[int, int, int, int]]:
        """Find element and return its bounding box coordinates."""
        try:
            if element_identifier.startswith('text:'):
                text = element_identifier[5:]
                return pyautogui.locateOnScreen(f'text_{text}.png')
            else:
                return pyautogui.locateOnScreen(element_identifier)
        except Exception:
            return None

    def get_text(self, element_identifier: str) -> str:
        """Get text from screen region. This is challenging with PyAutoGUI."""
        # Note: Getting text from desktop apps requires OCR
        # This is a simplified implementation
        print("Warning: Text extraction from desktop requires OCR implementation")
        return ""

    def wait_for_element(self, element_identifier: str, timeout: int = 10) -> bool:
        """Wait for element to appear on screen."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.find_element(element_identifier):
                return True
            time.sleep(0.5)
        return False

    def take_screenshot(self, filename: str) -> bool:
        """Take a screenshot of the entire screen."""
        try:
            screenshot = pyautogui.screenshot()
            screenshot.save(filename)
            return True
        except Exception as e:
            print(f"Screenshot failed: {e}")
            return False

    def close(self) -> None:
        """No cleanup needed for PyAutoGUI."""
        pass
