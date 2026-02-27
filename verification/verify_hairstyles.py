import time
from playwright.sync_api import sync_playwright
import os

def verify_hairstyle_rendering():
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1066x600 is the logical resolution of the game
        page = browser.new_page(viewport={"width": 1066, "height": 600})

        # Load the game page (ensure absolute path is correct)
        # Current working directory is /app
        page.goto("file:///app/gotrange.html")

        # Wait for canvas to be present
        try:
            page.wait_for_selector("#gameCanvas", timeout=5000)
        except:
            print("Canvas not found! Check if the page loaded correctly.")
            browser.close()
            return

        # Wait for game initialization
        time.sleep(2)

        # Inject JavaScript to equip a specific hairstyle and force a render update
        # We'll test 'afro' and 'spiky' to verify 2.5D shading

        print("Testing Afro...")
        # 1. Equip Afro and take screenshot
        page.evaluate("""
            if(window.playerData) {
                window.playerData.currentHairstyle = 'hair_afro';
                window.playerData.hairColor = '#4B3621'; // Dark Brown
            }
        """)
        time.sleep(0.5)
        page.screenshot(path="/home/jules/verification/afro_render.png")
        print("Captured afro_render.png")

        print("Testing Spiky...")
        # 2. Equip Spiky and take screenshot
        page.evaluate("""
            if(window.playerData) {
                window.playerData.currentHairstyle = 'hair_spiky';
                window.playerData.hairColor = '#FFD700'; // Blonde
            }
        """)
        time.sleep(0.5)
        page.screenshot(path="/home/jules/verification/spiky_render.png")
        print("Captured spiky_render.png")

        print("Testing Mohawk...")
        # 3. Equip Mohawk and take screenshot
        page.evaluate("""
            if(window.playerData) {
                window.playerData.currentHairstyle = 'hair_mohawk';
                window.playerData.hairColor = '#FF0000'; // Red
            }
        """)
        time.sleep(0.5)
        page.screenshot(path="/home/jules/verification/mohawk_render.png")
        print("Captured mohawk_render.png")

        print("Testing Long Flow...")
        # 4. Equip Long Flow and take screenshot
        page.evaluate("""
            if(window.playerData) {
                window.playerData.currentHairstyle = 'hair_long_flow';
                window.playerData.hairColor = '#000000'; // Black
            }
        """)
        time.sleep(0.5)
        page.screenshot(path="/home/jules/verification/long_render.png")
        print("Captured long_render.png")

        # 5. Check if seededRandom works (no crash)
        print("Testing Buzz Cut (seededRandom usage)...")
        page.evaluate("""
            if(window.playerData) {
                window.playerData.currentHairstyle = 'hair_buzz_cut';
                window.playerData.hairColor = '#000000';
            }
        """)
        time.sleep(0.5)
        page.screenshot(path="/home/jules/verification/buzz_render.png")
        print("Captured buzz_render.png")


        browser.close()

if __name__ == "__main__":
    verify_hairstyle_rendering()
