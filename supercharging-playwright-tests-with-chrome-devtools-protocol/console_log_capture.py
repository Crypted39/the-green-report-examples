from playwright.sync_api import sync_playwright


def test_capture_console_logs():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Create a CDP session
        client = context.new_cdp_session(page)

        # Enable the Log domain to listen for console messages
        client.send("Log.enable")

        # Define a callback for new log entries
        def handle_log_entry(params):
            level = params["entry"]["level"]
            text = params["entry"]["text"]
            print(f"Console: {level.upper()} - {text}")

        # Register the callback
        client.on("Log.entryAdded", handle_log_entry)

        # Trigger some console log messages from the page context
        page.goto("https://example.com")
        page.evaluate("console.log('Test log message')")
        page.evaluate("console.warn('This is a warning log!')")
        page.evaluate("console.error('This is an error log!')")

        # Allow a moment for async log events to be captured
        page.wait_for_timeout(1000)

        # Clean up
        browser.close()


# Run the test
if __name__ == "__main__":
    test_capture_console_logs()
