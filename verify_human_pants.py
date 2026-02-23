from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Inject script to setup the player state
        page.evaluate("""
            // Force Human with Jeans
            playerData.currentSkin = 'human_custom';
            playerData.currentPants = 'pants_jeans';
            playerData.currentShoes = 'shoe_sneakers_white';

            // Override camera to zoom in on legs
            // RenderEngine.Camera.zoom = 1500;
            // RenderEngine.Camera.y = 300;
        """)

        # Wait for canvas to draw
        page.wait_for_timeout(2000)

        # Screenshot
        page.screenshot(path="human_pants_check.png")
        browser.close()

if __name__ == "__main__":
    run()
