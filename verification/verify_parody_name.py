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

        # Inject state for Parody Character (Mario)
        page.evaluate('''() => {
            playerData.currentSkin = 'fake_mario';
            playerData.graphics = 'HIGH';
            playerData.meterEnabled = false;
            toggleGraphics();
            toggleGraphics();
        }''')

        time.sleep(2)
        page.screenshot(path='verification/parody_no_name.png')

        # Check Long Name Scaling (Antetokounmpo - I used 'FREAK' but let's force a long one to test scaling)
        page.evaluate('''() => {
            // Force a long jersey name temporarily
            var skin = SKINS_DB.find(x => x.id === 'human_giannis');
            if(skin) skin.jerseyName = 'ANTETOKOUNMPO';
            playerData.currentSkin = 'human_giannis';
            playerData.graphics = 'HIGH';
        }''')

        time.sleep(1)
        page.screenshot(path='verification/long_name_scaling.png')

        browser.close()

if __name__ == '__main__':
    run()
