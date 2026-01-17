
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        cwd = os.getcwd()
        url = f"file://{cwd}/gotrange.html"
        page.goto(url)

        # Select platform to start game
        page.click("text=ORDI 💻")

        # Wait a bit for render
        page.wait_for_timeout(1000)

        # Screenshot
        page.screenshot(path="verification/verification_render.png")
        browser.close()

if __name__ == "__main__":
    run()
