from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        # Load local file
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/gotrange.html')

        # Click Startup
        page.click('text=ORDI 💻')

        # Inject state for MJ
        page.evaluate('''() => {
            playerData.currentSkin = 'human_mj';
            playerData.graphics = 'HIGH';
            playerData.meterEnabled = false; // cleaner view
            // Move camera close to see jersey back?
            // player starts at x=433, y=300.
            // Camera follows.
            // Just force a draw.
            toggleGraphics(); // Trigger cache invalidation
            toggleGraphics();
        }''')

        # Wait for render loop
        time.sleep(2)

        # Take screenshot
        page.screenshot(path='verification/mj_jersey.png')

        # Also try Wall for wizards stripes
        page.evaluate("playerData.currentSkin = 'human_wall';")
        time.sleep(1)
        page.screenshot(path='verification/wall_jersey.png')

        browser.close()

if __name__ == '__main__':
    run()
