from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto("file://" + os.path.abspath("gotrange.html"))

        # Wait for game to initialize (canvas to be present)
        page.wait_for_selector("#gameCanvas", timeout=10000)

        # Wait a bit for the render loop to draw a few frames
        time.sleep(2)

        # Take a screenshot
        screenshot_path = "verification/cel_shading.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
