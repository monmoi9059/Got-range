from playwright.sync_api import sync_playwright
import os
import time

def verify_3d_render():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        print("Page loaded")

        # Wait for game container
        page.wait_for_selector("#game-container")

        # Click Toggle Graphics button until it hits 3D
        # Initial state is LOW.
        # Click 1 -> HIGH
        # Click 2 -> 3D

        # We can also just call toggleGraphics() via JS
        print("Toggling to 3D mode via JS...")
        page.evaluate("playerData.graphics = 'HIGH'; toggleGraphics();")
        # toggleGraphics toggles from current. If set to HIGH, next toggle is 3D.

        # Wait for canvas3d to be visible
        page.wait_for_selector("#canvas3d", state="visible")
        print("Canvas3D is visible")

        # Wait a bit for rendering
        time.sleep(2)

        # Take screenshot
        output_path = "verification/render_3d.png"
        page.screenshot(path=output_path)
        print(f"Screenshot saved to {output_path}")

        browser.close()

if __name__ == "__main__":
    verify_3d_render()
