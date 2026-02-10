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

        # Click Next Track (Right Arrow) multiple times to reach "Seven Nation Taco"
        # Track 0: Street King
        # Track 1: Trap Lord
        # Track 2: Arena Legend
        # Track 3: Seven Nation Taco

        next_btn = page.locator("text=▶")
        if next_btn.count() == 0:
            print("Error: Next button not found")
            return

        for i in range(3):
            next_btn.click()
            # Wait a bit between clicks to ensure state update if needed, though usually instant
            page.wait_for_timeout(200)

        # Check for Notification "🎵 Seven Nation Taco"
        # Notification ID is #notification
        # It takes a moment to appear (animation)
        notification = page.locator("#notification")
        notification.wait_for(state="visible")

        text = page.locator("#notifText").inner_text()
        print(f"Notification Text: {text}")

        if "Seven Nation Taco" in text:
            print("SUCCESS: Track changed to Seven Nation Taco")
        else:
            print("FAILURE: Notification text did not match expected track name")

        # Take screenshot
        page.screenshot(path="music_ui_verification.png")
        print("Screenshot saved to music_ui_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_music_ui()
