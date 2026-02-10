
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the game (gotrange.html)
        page.goto("http://localhost:8000/gotrange.html")

        # Wait for game to initialize (canvas)
        page.wait_for_selector("#gameCanvas")

        # Give it a moment to run init scripts
        time.sleep(2)

        # Force the skin to Allen Iverson (human_ai) which uses cornrows
        page.evaluate("playerData.currentSkin = 'human_ai';")

        # Wait for the change to be rendered
        time.sleep(1)

        # Take a screenshot
        page.screenshot(path="verification/cornrows_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
