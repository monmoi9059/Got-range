from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Click Desktop Platform
        page.click("text=ORDI 💻")

        # Wait for game to initialize
        page.wait_for_timeout(1000)

        # Press Space to Jump and Release
        page.keyboard.down("Space")
        page.wait_for_timeout(300)
        page.keyboard.up("Space")

        # Ball should be flying now.
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path="verification/ball_shot.png")

        browser.close()

if __name__ == "__main__":
    run()
