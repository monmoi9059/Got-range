from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Wait for canvas to be present
        page.wait_for_selector("#gameCanvas")

        # Wait a second for the loop to run and clouds to move slightly
        page.wait_for_timeout(2000)

        # Take screenshot of the game container
        page.locator("#game-container").screenshot(path="verification/scenery_screenshot.png")

        browser.close()

if __name__ == "__main__":
    run()
