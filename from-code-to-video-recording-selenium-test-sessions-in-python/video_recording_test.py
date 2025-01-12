from selenium import webdriver
import pyscreenrec
import time
from datetime import datetime
import threading


def scroll_page(driver):
    """
    Scrolls to the bottom of the page, waits, and scrolls back to the top.
    """
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(3)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(3)


def get_browser_coordinates(driver):
    """
    Get the coordinates and dimensions of the browser viewport.
    """
    window_rect = driver.get_window_rect()

    # Get the actual viewport dimensions
    viewport_height = driver.execute_script('return window.innerHeight')
    viewport_width = driver.execute_script('return window.innerWidth')

    # Adjust coordinates to capture only the viewport
    return {
        'left': window_rect['x'],
        'top': window_rect['y'] + (window_rect['height'] - viewport_height),
        'width': viewport_width,
        'height': viewport_height
    }


def record_test(driver, test_actions, max_duration=60, output_filename=None):
    """
    Record a browser test session using pyscreenrec.

    Args:
        driver: Selenium WebDriver instance
        test_actions: Function containing the test steps to perform
        max_duration: Maximum recording duration in seconds
        output_filename: Output video file name
    """
    if output_filename is None:
        output_filename = f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

    # Get browser coordinates
    coordinates = get_browser_coordinates(driver)

    # Initialize recorder
    recorder = pyscreenrec.ScreenRecorder()

    # Create an event to signal test completion
    test_complete = threading.Event()

    def run_test():
        try:
            test_actions()
        finally:
            test_complete.set()

    # Start the recording
    recorder.start_recording(
        output_filename,
        30,  # FPS
        {
            "mon": 1,  # Primary monitor
            "left": coordinates['left'],
            "top": coordinates['top'],
            "width": coordinates['width'],
            "height": coordinates['height']
        }
    )

    # Start test actions in a separate thread
    test_thread = threading.Thread(target=run_test)
    test_thread.start()

    try:
        # Wait for either test completion or max duration
        test_complete.wait(timeout=max_duration)

        if test_complete.is_set():
            print("Test completed successfully")
        else:
            print("Maximum duration reached")

    finally:
        # Ensure recording is stopped
        print("Stopping recording...")
        recorder.stop_recording()
        test_thread.join(timeout=1)
        print(f"Recording saved to: {output_filename}")


def video_recording_test():
    """
    Example usage of the recording functionality.
    """
    url = "https://www.thegreenreport.blog/"

    # Set up browser
    options = webdriver.ChromeOptions()
    options.add_argument('--window-size=1280,720')
    driver = webdriver.Chrome(options=options)

    try:
        # Load the page
        driver.get(url)
        time.sleep(2)  # Let the page load

        # Define test actions
        def test_actions():
            scroll_page(driver)
            # Add more test actions here if needed

        # Start recording and run test
        record_test(
            driver=driver,
            test_actions=test_actions,
            max_duration=30,
            output_filename="recording_test.mp4"
        )

    finally:
        driver.quit()


if __name__ == "__main__":
    video_recording_test()
