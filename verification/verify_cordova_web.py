import os
from playwright.sync_api import sync_playwright

def verify_cordova_web():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get absolute path to the file
        cwd = os.getcwd()
        file_path = f"file://{cwd}/taco_app/www/index.html"

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Wait for canvas to be present
        page.wait_for_selector("canvas", state="visible")

        # Wait a bit for the game to render (it has a startup animation or loop)
        page.wait_for_timeout(2000)

        # Take a screenshot
        screenshot_path = "verification/cordova_web_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_cordova_web()
