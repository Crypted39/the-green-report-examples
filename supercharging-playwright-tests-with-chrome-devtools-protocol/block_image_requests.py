from playwright.sync_api import sync_playwright


def test_block_images():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Use CDP to intercept and block image requests
        client = context.new_cdp_session(page)
        client.send("Network.enable")

        client.send("Network.setBlockedURLs", {
            "urls": ["*.png", "*.jpg", "*.jpeg", "*.gif"]
        })

        # Go to a page with images
        page.goto("https://www.example.com/")

        # Add some test assertions here
        assert "Free Stock Photos" in page.inner_text("body")

        browser.close()


if __name__ == "__main__":
    test_block_images()
