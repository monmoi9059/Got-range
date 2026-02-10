import os
from playwright.sync_api import sync_playwright

def verify_music_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Click "ORDI" to start game (dismiss startup UI)
        try:
            page.click("text=ORDI 💻", timeout=5000)
        except:
            # Try finding by selector if text fails
            if page.locator("#btn-computer").count() > 0:
                page.click("#btn-computer")
            pass

        # Wait for game UI
        try:
            page.wait_for_selector("#game-container", timeout=5000)
        except:
            print("Timeout waiting for #game-container")
            return

        # Verify track list order has changed
        # The new js/audio.js replaced the old tracks list completely.
        # Track 0: Seven Nation Taco
        # Track 1: Sirius Taco
        # ...

        # Click Next Track once. If default is 0 (Seven Nation Taco), next is 1 (Sirius Taco).
        # Wait, let's check what the default track is. usually 0.

        next_btn = page.locator("text=▶")
        if next_btn.count() == 0:
            print("Error: Next button not found")
            return

        # Click once to go to Track 1: Sirius Taco
        next_btn.click()
        page.wait_for_timeout(500)

        # Check for Notification "🎵 Sirius Taco"
        notification = page.locator("#notification")
        try:
            notification.wait_for(state="visible", timeout=3000)
            text = page.locator("#notifText").inner_text()
            print(f"Notification Text: {text}")

            if "Sirius Taco" in text:
                print("SUCCESS: Track changed to Sirius Taco")
            else:
                print("FAILURE: Notification text did not match expected track name")
        except:
            print("Notification did not appear")

        # Take screenshot
        page.screenshot(path="music_ui_verification.png")
        print("Screenshot saved to music_ui_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_music_ui()
