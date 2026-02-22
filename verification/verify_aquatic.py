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

        # Click Start if needed (Start button might overlay)
        # Based on game.js, STARTUP state shows startup-ui.
        # We can simulate click or just wait if logic starts automatically?
        # game.js: checkStartup() -> if !platformChosen -> state='STARTUP'.
        # We need to click "MOBILE" or "PC" to start.

        # Try to click one of the platform buttons
        try:
            # Assuming buttons exist based on previous knowledge or guess.
            # In game.js: window.choosePlatform('pc')
            # Let's try to execute JS directly to bypass UI
            page.evaluate("window.choosePlatform('pc')")
        except:
            print("Could not click platform button, maybe already started")

        # Wait for game loop to run and spawn entities
        # AquaticSystem spawns every ~3s. Pre-populated 3.
        time.sleep(5)

        page.screenshot(path="verification/aquatic_life.png")
        browser.close()

if __name__ == "__main__":
    run()
