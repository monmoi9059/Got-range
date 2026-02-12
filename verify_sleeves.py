from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Load local HTML file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for game to initialize
        page.wait_for_selector("#game-container")

        # Inject cheat to unlock everything and set specific state
        page.evaluate("""
            window.unlockAllSkins();
            window.playerData.currentSkin = 'human_custom';
            window.playerData.currentClothing = 'track_red';
            window.currentStreak = 10; // For fire effect
            window.saveData();
            window.startGame();
        """)

        # Wait for render loop
        time.sleep(2)

        # Screenshot
        page.screenshot(path="verification_sleeves.png")
        print("Screenshot saved to verification_sleeves.png")

        browser.close()

if __name__ == "__main__":
    run()
