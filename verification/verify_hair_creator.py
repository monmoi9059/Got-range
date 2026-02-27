from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Wait for load
        page.wait_for_timeout(1000)

        # Click "Desktop" platform to start
        page.click("button:text('ORDI 💻')")

        # Open Shop
        page.keyboard.press("p")
        page.wait_for_timeout(500)

        # Switch to Style Tab
        page.click("button:text('STYLE')")

        # Click "Create Hairstyle"
        page.click("button:text('CRÉER COIFFURE')")
        page.wait_for_timeout(1000)

        # Take Screenshot
        page.screenshot(path="verification/hair_creator.png")

        browser.close()

if __name__ == "__main__":
    run()
