
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/gotrange.html")

        page.wait_for_selector("#gameCanvas")
        time.sleep(2)

        # Set skin to Harden for big beard verification
        page.evaluate("playerData.currentSkin = 'human_harden';")
        time.sleep(1)

        page.screenshot(path="verification/beard_verification.png")
        browser.close()

if __name__ == "__main__":
    run()
