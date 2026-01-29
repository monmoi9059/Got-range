from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Wait for startup UI
        page.wait_for_selector("text=CHOISIS TA PLATEFORME")

        # Click Desktop
        page.click("text=ORDI 💻")

        # Wait for Game UI
        page.wait_for_selector("#ui")

        # Toggle Mode to TIME ATTACK
        # First click -> CONCOURS
        page.click("#controls .ui-btn:has-text('MODE:')")
        # Second click -> TIME ATTACK
        page.click("#controls .ui-btn:has-text('MODE:')")

        # Check if HUD changed
        mode_text = page.inner_text("#modeBtnText")
        print(f"Mode Text: {mode_text}")
        if "TIME ATTACK" not in mode_text:
            print("Failed to switch to Time Attack")

        # Start game (Space) or check if it started automatically?
        # Time Attack starts when selected? No, resetGame calls startTimeAttack.
        # startTimeAttack sets state='IDLE'.
        # Timer should be 60.

        time_val = page.inner_text("#contestTime")
        print(f"Timer: {time_val}")

        # Simulate Shooting (Rapid Fire)
        # Press Space
        page.keyboard.press("Space")
        page.wait_for_timeout(200) # Jump
        page.keyboard.press("Space") # Shoot

        page.wait_for_timeout(500) # Wait for shot

        # Shoot again immediately
        page.keyboard.press("Space")
        page.wait_for_timeout(200)
        page.keyboard.press("Space")

        page.wait_for_timeout(1000) # Let physics run

        # Take screenshot
        page.screenshot(path="verification/time_attack.png")
        print("Screenshot saved to verification/time_attack.png")

        browser.close()

if __name__ == "__main__":
    run()
