from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Load the HTML file directly
        page.goto("file://" + os.path.abspath("taco_app/www/index.html"))

        # Wait for canvas
        page.wait_for_selector("canvas")

        # Try to click one of the platform buttons to start game
        try:
            page.evaluate("window.choosePlatform('pc')")
        except:
            print("Could not click platform button, maybe already started")

        # Wait for game loop to run and spawn entities
        # Wait longer to ensure a boat spawns if random
        time.sleep(5)

        page.screenshot(path="verification/boat_size.png")
        browser.close()

if __name__ == "__main__":
    run()
