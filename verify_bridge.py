from playwright.sync_api import sync_playwright
import os

def verify_bridge_drawing():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})

        # Load the HTML file directly
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Wait for canvas to be ready (ensure game loop has started)
        page.wait_for_timeout(2000)

        # Take a screenshot
        screenshot_path = "verify_screenshots/bridge_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_bridge_drawing()
