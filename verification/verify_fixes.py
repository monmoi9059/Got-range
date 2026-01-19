
import os
from playwright.sync_api import sync_playwright

def verify_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the game
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Click ORDI to start
        page.get_by_text("ORDI 💻").click()

        # Wait for game loop to start
        page.wait_for_timeout(1000)

        # Helper to set skin and take screenshot
        def capture_skin(skin_id, filename):
            print(f"Capturing {skin_id}...")
            page.evaluate(f"""
                window.playerData.tacos = 999999;
                window.playerData.unlockedSkins.push('{skin_id}');
                window.playerData.currentSkin = '{skin_id}';
                window.saveData();
                window.updateUI();
                // Force a redraw if needed, though the loop runs constantly
            """)
            page.wait_for_timeout(500) # Wait for render
            page.screenshot(path=f"verification/{filename}")
            print(f"Saved to verification/{filename}")

        # Capture specific characters
        capture_skin('fake_zeus', 'zeus_curly.png')
        capture_skin('fake_mario', 'mario_overalls.png')
        capture_skin('hybrid_minotaur', 'minotaur.png')
        capture_skin('hybrid_gorgon', 'gorgon.png')
        capture_skin('hybrid_anubis', 'anubis.png')

        browser.close()

if __name__ == "__main__":
    verify_fixes()
