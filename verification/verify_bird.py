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

        # Inject state for Larry Bird
        page.evaluate('''() => {
            playerData.currentSkin = 'human_bird';
            playerData.graphics = 'HIGH';
            playerData.meterEnabled = false;
            toggleGraphics();
            toggleGraphics();
        }''')

        # Wait for render loop
        time.sleep(2)

        # Take screenshot
        page.screenshot(path='verification/bird_jersey.png')

        # Also try Wall for wizards stripes
        page.evaluate("playerData.currentSkin = 'human_wall';")
        time.sleep(1)
        page.screenshot(path='verification/wall_jersey_v2.png')

        # Also try MJ for Bulls stripes
        page.evaluate("playerData.currentSkin = 'human_mj';")
        time.sleep(1)
        page.screenshot(path='verification/mj_jersey_v2.png')

        browser.close()

if __name__ == '__main__':
    run()
