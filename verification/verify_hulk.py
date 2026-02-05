from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        cwd = os.getcwd()
        page.goto(f'file://{cwd}/gotrange.html')
        page.click('text=ORDI 💻')

        # Inject state for Hulk
        page.evaluate('''() => {
            playerData.currentSkin = 'human_hulk';
            playerData.graphics = 'HIGH';
            playerData.meterEnabled = false;
            toggleGraphics();
            toggleGraphics();
        }''')

        time.sleep(2)
        page.screenshot(path='verification/hulk_chest.png')

        browser.close()

if __name__ == '__main__':
    run()
