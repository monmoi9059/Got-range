from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        url = f"file://{os.getcwd()}/gotrange.html"
        print(f"Loading {url}")
        page.goto(url)

        # Wait for Startup UI
        print("Waiting for Startup UI...")
        page.wait_for_selector("#startup-ui")

        # Click "ORDI"
        print("Clicking ORDI...")
        page.click("text=ORDI")

        # Wait for Game Container and Canvas
        print("Waiting for Game Canvas...")
        page.wait_for_selector("#gameCanvas")

        # Wait a bit for render
        page.wait_for_timeout(2000)

        # Take Screenshot
        screenshot_path = f"{os.getcwd()}/verification/back_view_3.png"
        os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
