from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the page (assuming server is running on 8000)
        page.goto("http://localhost:8000/gotrange.html")

        # Wait for game to load
        page.wait_for_timeout(2000)

        # Inject script to force specific render state
        page.evaluate("""
            window.playerData.currentSkin = 'human_custom'; // Valid ID

            // Force Pants on Human
            const skin = SKINS_DB.find(s => s.id === 'human_custom');
            if (skin) {
                skin.legType = 'pants';
                skin.pantsColor = '#000080';
                skin.shoesColor = '#FFFFFF';
            }

            // Force Posture: Running/Jumping to show knee bend
            window.state = 'JUMPING';
            window.currentVz = 5; // Mid jump
            window.player3D.y = 400; // Closer to camera

            // Force Redraw
            requestAnimationFrame(() => {});
        """)

        page.wait_for_timeout(500)
        page.screenshot(path="verification/verification_human_split_pants.png")
        print("Captured human pants screenshot")

        # Test Animal with Pants (Rat Lumberjack uses pants by default)
        page.evaluate("""
            window.currentAnimal = 'rat';
            window.playerData.currentSkin = 'rat_lumberjack';
            // Ensure properties
            const ratSkin = SKINS_DB.find(s => s.id === 'rat_lumberjack');
            // rat_lumberjack has legType: 'pants' already

            // Force Update
            window.player3D.y = 400;
        """)

        page.wait_for_timeout(500)
        page.screenshot(path="verification/verification_animal_split_pants.png")
        print("Captured animal pants screenshot")

        browser.close()

if __name__ == "__main__":
    run()
