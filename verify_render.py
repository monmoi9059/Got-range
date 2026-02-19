
import os
from playwright.sync_api import sync_playwright

def verify_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        url = f"file://{os.path.abspath('gotrange.html')}"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for canvas to be present
        page.wait_for_selector("#gameCanvas")

        # Wait a bit for game to initialize and render frames
        page.wait_for_timeout(2000)

        # Take screenshot
        os.makedirs("verification", exist_ok=True)
        screenshot_path = "verification/render_verify.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_render()
