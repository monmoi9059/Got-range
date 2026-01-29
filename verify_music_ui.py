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
        page.click("text=ORDI 💻")

        # Wait for game UI
        page.wait_for_selector("#ui")

        # Verify Arrows exist next to mute button
        # The mute button is #btn-mute. The arrows are siblings.
        # We wrapped them in a flex container.

        # Locate the container by finding the parent of #btn-mute
        mute_btn = page.locator("#btn-mute")
        container = mute_btn.locator("..")

        # Verify layout
        # We expect 3 children: [Left Arrow] [Mute] [Right Arrow]
        children = container.locator("> div")
        count = children.count()
        print(f"Found {count} buttons in the audio controls container.")

        if count != 3:
            print("Error: Expected 3 buttons (Prev, Mute, Next)")
            return

        # Click Next Track (Right Arrow)
        # It's the 3rd child (index 2) or the one with text "▶"
        next_btn = container.locator("text=▶")
        next_btn.click()

        # Check for Notification "🎵 Rock Arena"
        # Notification ID is #notification
        # It takes a moment to appear (animation)
        notification = page.locator("#notification")
        notification.wait_for(state="visible")

        text = page.locator("#notifText").inner_text()
        print(f"Notification Text: {text}")

        if "Rock Arena" in text:
            print("SUCCESS: Track changed to Rock Arena")
        else:
            print("FAILURE: Notification text did not match expected track name")

        # Take screenshot
        page.screenshot(path="music_ui_verification.png")
        print("Screenshot saved to music_ui_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_music_ui()
