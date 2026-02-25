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

        # Take screenshot of Default Hair
        page.screenshot(path="verification/hair_default.png")
        print("Captured default hair.")

        # Execute JS to equip 'dreads' and take screenshot
        page.evaluate("""() => {
            if (typeof playerData !== 'undefined') {
                playerData.customHairstyle = 'dreads';
                // Force re-init (normally handled in update loop, but let's be sure)
                if (typeof player3D !== 'undefined' && player3D.hairSystem) {
                    player3D.hairSystem.init('dreads', player3D.x, player3D.y, player3D.z + 180, '#000000');
                }
            }
        }""")

        # Wait for update
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/hair_dreads.png")
        print("Captured dreads hair.")

        browser.close()

if __name__ == "__main__":
    run()
