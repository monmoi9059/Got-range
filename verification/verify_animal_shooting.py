import os
from playwright.sync_api import sync_playwright

def verify_animal_shooting():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        url = f"file://{os.getcwd()}/gotrange.html"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for game to initialize
        page.wait_for_function("() => typeof window.state !== 'undefined'")

        # Force Bear Skin and Jump State
        page.evaluate("""() => {
            // Set Skin to Bear
            playerData.currentSkin = 'bear_classic';

            // Force a frame update to ensure skin is cached/loaded in renderer
            // We can just call draw(1.0) but better to let loop run a bit.

            // Set State to JUMPING
            state = 'JUMPING';
            player3D.vz = 8.0; // Initial velocity

            // Force Animation Target to Set Point (approx) to ensure guide hand logic is active
            // The logic in renderer checks state === 'JUMPING' and isTwoHandedStyle.
            // Bear is two-handed.

            // We need to make sure 'update' loop doesn't instantly revert state or gravity kills jump.
            // We can disable gravity temporarily or just snap a moment.

            // Let's set a specific moment in the jump
            player3D.z = 50;
            player3D.vz = 2.0;

            // Force update to set g_animState
            updatePlayerAnimation(1.0);
        }""")

        # Wait a bit for the canvas to render
        page.wait_for_timeout(200)

        # Screenshot
        screenshot_path = f"{os.getcwd()}/verification/animal_shooting_test.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_animal_shooting()
