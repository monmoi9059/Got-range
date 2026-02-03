
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        # Load the game
        abs_path = os.path.abspath('gotrange.html')
        page.goto(f"file://{abs_path}")

        # Wait for load
        page.wait_for_timeout(1000)

        # Start game if needed
        startup = page.query_selector('#startup-ui')
        if startup and startup.is_visible():
            page.click('button:has-text("ORDI")')

        page.wait_for_timeout(500)

        # Simulate Level 10
        page.evaluate("""
            window.distanceLevel = 10;
            // Player path logic: x -= 15 * 9; y += 15 * 9; (since starts at level 1)
            // Start: 433, 300.
            // Level 10 means 9 jumps.
            window.player3D.x = 433 - (15 * 9);
            window.player3D.y = 300 + (15 * 9);
            window.player3D.z = 0;
            window.invalidateBackgroundCache();
        """)

        page.wait_for_timeout(500)
        page.screenshot(path='verification/hoop_angle_level10.png')

        # Level 1
        page.evaluate("""
            window.distanceLevel = 1;
            window.player3D.x = 433;
            window.player3D.y = 300;
            window.invalidateBackgroundCache();
        """)

        page.wait_for_timeout(500)
        page.screenshot(path='verification/hoop_angle_level1.png')

        browser.close()

if __name__ == "__main__":
    run()
