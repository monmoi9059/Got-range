
import os
from playwright.sync_api import sync_playwright

def verify_back():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        url = f"file://{os.path.abspath('gotrange.html')}"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for game
        page.wait_for_selector("#gameCanvas")
        page.wait_for_timeout(1000)

        # Inject settings to show shirtless human back
        page.evaluate("""() => {
            // Force HIGH graphics
            playerData.graphics = 'HIGH';

            // Force Human Skin
            playerData.currentSkin = 'human_custom';

            // Modify human_custom to be shirtless
            const skin = SKINS_DB.find(s => s.id === 'human_custom');
            if (skin) {
                skin.jerseyColor = null; // Remove jersey color so it uses skinTone
                skin.jerseyType = 'none'; // Explicitly none
                skin.skinTone = '#8d5524'; // Ensure skin tone
            }

            // Ensure we are in a state where we see the back (IDLE/READY)
            // Just ensuring update happens
        }""")

        # Wait a bit for render
        page.wait_for_timeout(1000)

        # Take screenshot
        screenshot_path = "verification/back_verify.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_back()
