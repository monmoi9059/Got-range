from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load file
        path = os.path.abspath("gotrange.html")
        page.goto(f"file://{path}")

        # Startup
        page.click("text=ORDI 💻")
        time.sleep(1) # Wait for anim

        # Screenshot 2D
        page.screenshot(path="verification/screen_2d.png")
        print("Captured 2D screenshot")

        # Switch to 3D
        page.click("text=STATS [S]")
        time.sleep(0.5)

        # Toggle Graphics until 3D
        # Initially LOW (or HIGH depending on logic).
        # toggleGraphics: LOW -> HIGH -> 3D -> LOW
        # Default might be LOW?
        # Check btn text.

        # First Click
        page.click("#btnToggleGraphics")
        time.sleep(0.2)
        btn_text = page.inner_text("#btnToggleGraphics")
        print(f"Graphics button: {btn_text}")

        if "3D" not in btn_text:
            # Second Click
            page.click("#btnToggleGraphics")
            time.sleep(0.2)
            btn_text = page.inner_text("#btnToggleGraphics")
            print(f"Graphics button: {btn_text}")

        # Close Stats
        page.click("text=FERMER")
        time.sleep(1)

        # Screenshot 3D
        page.screenshot(path="verification/screen_3d.png")
        print("Captured 3D screenshot")

        browser.close()

if __name__ == "__main__":
    run()
