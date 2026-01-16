import os
import sys
from playwright.sync_api import sync_playwright

def verify_tacocat():
    file_path = os.path.abspath("gotrange.html")
    file_url = f"file://{file_path}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(file_url)

        # 1. Verify Decors Array content
        decors = page.evaluate("window.decors")
        tacocats = [d for d in decors if d['zoneType'] == 'tacocat']

        print(f"Total decors: {len(decors)}")
        print(f"Taco Cats found: {len(tacocats)}")

        court_zones_count = page.evaluate("COURT_ZONES.length")

        if len(tacocats) != court_zones_count:
            print(f"ERROR: Expected {court_zones_count} taco cats, found {len(tacocats)}")
            sys.exit(1)
        else:
            print("SUCCESS: Correct number of Taco Cats generated (one per zone).")

        # 2. Visual Verification
        # Find the nearest taco cat to capture
        nearest_cat = min(tacocats, key=lambda d: d['dist'])
        print(f"Nearest Taco Cat at distance: {nearest_cat['dist']} (x: {nearest_cat['x']}, y: {nearest_cat['y']})")

        # Teleport player to look at it
        # We need to set distanceLevel roughly to match, but we can just move player3D
        # Actually, drawBackground uses player3D to calculate projection.
        # We want the cat to be in front of the camera.
        # Player is at (300, 300). Camera is behind player.
        # Let's move player close to the cat.

        cat_x = nearest_cat['x']
        cat_y = nearest_cat['y']

        # Teleport player slightly behind the cat
        page.evaluate(f"""
            window.player3D.x = {cat_x} + 100;
            window.player3D.y = {cat_y} - 100;
            window.player3D.z = 0;
            // Force redraw/update
            window.state = 'IDLE';
        """)

        # Allow a frame to render
        page.wait_for_timeout(500)

        page.screenshot(path="verification_tacocat.png")
        print("Screenshot saved to verification_tacocat.png")

        browser.close()

if __name__ == "__main__":
    verify_tacocat()
