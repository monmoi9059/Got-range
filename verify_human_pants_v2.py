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
            // Force Human with Jeans and Bulky Shoes
            playerData.currentSkin = 'human_custom';
            playerData.currentPants = 'pants_jeans';
            playerData.currentShoes = 'shoe_jordan4_cement'; // Bulky shoe

            // Set a stance that separates legs
            // g_animState might need reset or we rely on default standing

            // Override camera to zoom in on feet
            RenderEngine.Camera.zoom = 2000;
            RenderEngine.Camera.y = 500; // Look lower

            // Force redraw
            // The loop runs automatically
        """)

        # Wait for canvas to draw
        page.wait_for_timeout(2000)

        # Screenshot
        page.screenshot(path="human_pants_check_v2.png")
        browser.close()

if __name__ == "__main__":
    run()
