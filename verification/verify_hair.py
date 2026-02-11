import os
from playwright.sync_api import sync_playwright

def verify_hair():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        filepath = os.path.abspath("gotrange.html")
        page.goto(f"file://{filepath}")

        # Wait for game to initialize (check for canvas or UI)
        try:
            page.wait_for_selector("#game-container", timeout=5000)
            print("Game container found.")

            # Inject script to force a specific hairstyle and skin for visual verification
            # Force human_custom and short hair
            page.evaluate("""() => {
                if (typeof playerData !== 'undefined') {
                    playerData.currentSkin = 'human_custom';
                    playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };
                    // Force a re-render or just wait for next frame
                    // We can check if drawHairstyle is being called without error by waiting
                }
                if (typeof window.startGame === 'function') {
                    window.startGame();
                }
            }""")

            # Wait a bit for render
            page.wait_for_timeout(2000)

            # Take screenshot
            page.screenshot(path="verification/hair_test.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")

        browser.close()

if __name__ == "__main__":
    verify_hair()
