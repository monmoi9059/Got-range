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

        # 1. Modify data
        page.evaluate('playerData.tacos = 9999;')
        page.evaluate('playerData.unlockedSkins.push("test_skin");')
        page.evaluate('saveData();')

        # Verify modification
        tacos = page.evaluate('playerData.tacos')
        print(f"Tacos before reset: {tacos}")
        if tacos != 9999:
            print("Failed to set tacos")
            return

        # 2. Trigger Reset
        # Open stats
        page.click('text=STATS [S]')
        time.sleep(0.5)
        # Click Reset twice
        page.click('id=btnReset')
        time.sleep(0.5)
        page.click('id=btnReset')
        time.sleep(1)

        # 3. Verify Reset
        tacos_after = page.evaluate('playerData.tacos')
        print(f"Tacos after reset: {tacos_after}")

        if tacos_after == 0:
            print("Reset Successful")
        else:
            print("Reset Failed")

        browser.close()

if __name__ == '__main__':
    run()
