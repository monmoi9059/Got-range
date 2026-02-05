from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Load the HTML file directly
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Wait for game to initialize (it has a startup UI)
        page.wait_for_selector("#startup-ui")

        # Click "ORDI" to start game
        page.click("text=ORDI 💻")

        # Wait for game to be in IDLE state (HUD visible)
        page.wait_for_selector("#scorebug-container")

        # Ensure we are in High Graphics mode (default is High? Toggle if not?)
        # Let's check the button text
        btn_graphics = page.locator("#btnToggleGraphics")
        # If the button says "QUALITÉ: HAUTE", it means current is High?
        # Or does it mean "Click to switch to High"?
        # openStats() calls: btnGraph.innerText = (playerData.graphics === 'HIGH') ? "QUALITÉ: HAUTE" : "QUALITÉ: BASSE";
        # So "QUALITÉ: HAUTE" means current is High.

        # Open Stats to check graphics setting
        page.click("text=STATS [S]")
        page.wait_for_selector("#statsUI", state="visible")

        # Take a screenshot of the stats menu to verify graphics setting
        page.screenshot(path="verification/stats_menu.png")

        # Close stats
        page.click("text=FERMER")

        # Wait a bit for game loop to render frames
        page.wait_for_timeout(1000)

        # Take screenshot of the game view (Cour Arrière - Grass)
        page.screenshot(path="verification/game_view_high.png")

        browser.close()

if __name__ == "__main__":
    run()
