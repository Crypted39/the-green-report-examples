from playwright.sync_api import sync_playwright


def slow_network_simulation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Set headless=True if you don't need to see the browser
        context = browser.new_context()
        page = context.new_page()

        # Create a CDP session
        client = context.new_cdp_session(page)

        # Enable network domain so we can use network-related commands
        client.send("Network.enable")

        # Emulate network conditions
        client.send("Network.emulateNetworkConditions", {
            "offline": False,
            "latency": 200,  # Add 200ms latency to each request
            "downloadThroughput": 50000,  # Limit download to ~50 KB/s
            "uploadThroughput": 20000  # Limit upload to ~20 KB/s
        })

        # Navigate to a sample page and observe network slowness
        page.goto("https://example.com")

        # Keep the page open for a while so the user can observe behavior
        page.wait_for_timeout(5000)  # Wait 5 seconds

        # Clean up
        browser.close()


if __name__ == "__main__":
    slow_network_simulation()
