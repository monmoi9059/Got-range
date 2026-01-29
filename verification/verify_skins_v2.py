from playwright.sync_api import sync_playwright
import time
import os

def check_skins():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Function to equip skin and take screenshot
        def snapshot_skin(skin_id, filename):
            # Inject JS to equip skin and start game
            page.evaluate(f"""
                playerData.unlockedSkins.push('{skin_id}');
                playerData.currentSkin = '{skin_id}';
                saveData();
                startJump(); // Jump to show back view
            """)

            # Wait for render
            time.sleep(0.5)

            # Take screenshot of the canvas
            page.locator("#gameCanvas").screenshot(path=filename)
            print(f"Saved {filename}")

            # Reset state for next
            page.evaluate("retryShot()")
            time.sleep(0.2)

        snapshot_skin('fake_link', 'verification/link_skin_v2.png')
        snapshot_skin('fake_kratos', 'verification/kratos_skin_v2.png')

        browser.close()

if __name__ == "__main__":
    if not os.path.exists('verification'):
        os.makedirs('verification')
    check_skins()
