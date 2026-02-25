from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the built HTML
        file_path = os.path.abspath("taco_app/www/index.html")
        page.goto(f"file://{file_path}")

        # Wait for game to initialize
        page.wait_for_timeout(2000)

        # 1. Check Long Flow (Dynamic)
        page.evaluate("""() => {
            if (typeof playerData !== 'undefined') {
                playerData.customHairstyle = 'long_flow';
                // Force re-init
                if (typeof player3D !== 'undefined' && player3D.hairSystem) {
                    player3D.hairSystem.init('long_flow', player3D.x, player3D.y, player3D.z + 180, '#4B3621'); // Brown
                }
            }
        }""")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/hair_long_flow.png")
        print("Captured long_flow.")

        # 2. Check Fade Box (Premium Static)
        page.evaluate("""() => {
            if (typeof playerData !== 'undefined') {
                playerData.customHairstyle = 'fade_box';
                // Force re-init (though this one is static, we want to ensure physics doesn't override it improperly or it renders correctly)
                // Physics init for fade_box isn't defined in my update, so it should be empty strands and fall through to static.
                 if (typeof player3D !== 'undefined' && player3D.hairSystem) {
                    player3D.hairSystem.init('fade_box', player3D.x, player3D.y, player3D.z + 180, '#000000');
                }
            }
        }""")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/hair_fade_box.png")
        print("Captured fade_box.")

        browser.close()

if __name__ == "__main__":
    run()
