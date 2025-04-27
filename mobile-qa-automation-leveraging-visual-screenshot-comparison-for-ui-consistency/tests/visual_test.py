import os
import time
from PIL import Image, ImageChops
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy


def capture_screen(driver, screen_name):
    """Capture screenshot and save to disk"""
    screenshot_dir = os.path.join(os.getcwd(), 'screenshots')
    os.makedirs(screenshot_dir, exist_ok=True)

    file_path = os.path.join(screenshot_dir, f"{screen_name}.png")
    driver.save_screenshot(file_path)
    return file_path


def compare_images(baseline_path, current_path, diff_path):
    """Compare two images and highlight differences"""
    if not os.path.exists(baseline_path):
        print(f"No baseline found at {baseline_path}. Creating new baseline.")
        return False

    baseline_img = Image.open(baseline_path).convert('RGB')
    current_img = Image.open(current_path).convert('RGB')

    # Check if images are the same size
    if baseline_img.size != current_img.size:
        print("Images have different dimensions. Resizing for comparison.")
        current_img = current_img.resize(baseline_img.size)

    # Calculate differences
    diff = ImageChops.difference(baseline_img, current_img)

    # If images are identical, diff will be completely black
    if diff.getbbox() is None:
        return True

    # Enhance difference visualization
    diff = diff.convert('RGB')
    for x in range(diff.width):
        for y in range(diff.height):
            r, g, b = diff.getpixel((x, y))
            if r != 0 or g != 0 or b != 0:  # If there's any difference
                diff.putpixel((x, y), (255, 0, 0))  # Highlight in red

    diff.save(diff_path)
    return False


def test_ui_consistency():
    # Set up Appium driver
    options = UiAutomator2Options()
    options.platform_name = 'Android'
    options.device_name = 'Samsung Galaxy S21 API 31'
    options.app = 'path-to-your-apk-file'
    options.automation_name = 'UiAutomator2'

    driver = webdriver.Remote('http://localhost:4723/wd/hub', options=options)

    try:
        # Navigate to the screen you want to test
        driver.find_element(AppiumBy.XPATH, '//android.widget.TextView[@text="Info"]').click()
        time.sleep(1)  # Allow animations to complete

        # Capture current screenshot
        current_screenshot = capture_screen(driver, 'login_screen_current')

        # Define paths
        baseline_path = os.path.join(os.getcwd(), 'screenshots', 'login_screen_baseline.png')
        diff_path = os.path.join(os.getcwd(), 'screenshots', 'login_screen_diff.png')

        # Compare with baseline
        are_identical = compare_images(baseline_path, current_screenshot, diff_path)

        if not are_identical and os.path.exists(baseline_path):
            print("Visual difference detected! Check the diff image for details.")
            return False
        elif not os.path.exists(baseline_path):
            # Copy current as baseline for future tests
            import shutil
            shutil.copy(current_screenshot, baseline_path)
            print("Created new baseline image.")
        else:
            print("No visual differences detected.")

        return True

    finally:
        driver.quit()


if __name__ == "__main__":
    test_ui_consistency()
