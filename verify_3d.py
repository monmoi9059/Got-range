from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})

        # Load the game
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for game to load
        page.wait_for_selector('canvas')
        time.sleep(1)

        # Start game
        page.evaluate("choosePlatform('desktop')")
        time.sleep(1)

        # Inject setup: HIGH Graphics
        page.evaluate("""
            game1.playerData.graphics = 'HIGH';
            game1.playerData.currentSkin = 'rat_wizard';
            decors = [];
            player3D.x = 533;
            player3D.y = 300;
            player3D.z = 0;
            invalidateBackgroundCache();
        """)
        time.sleep(2)
        page.screenshot(path="screenshot_high.png")
        print("High graphics screenshot saved.")

        # Inject setup: LOW Graphics
        page.evaluate("""
            game1.playerData.graphics = 'LOW';
            invalidateBackgroundCache();
        """)
        time.sleep(2)
        page.screenshot(path="screenshot_low.png")
        print("Low graphics screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run()
