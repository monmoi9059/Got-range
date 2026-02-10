import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Load local file
        page.goto(f"file://{os.getcwd()}/gotrange.html")
        page.wait_for_timeout(2000) # Wait for canvas render
        page.screenshot(path="verification_background.png")
        browser.close()

if __name__ == "__main__":
    run()
