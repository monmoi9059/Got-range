from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        # Capture console
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        cwd = os.getcwd()
        page.goto(f'file://{cwd}/gotrange.html')
        page.click('text=ORDI 💻')

        # 1. Modify data
        page.evaluate('playerData.tacos = 9999;')
        page.evaluate('saveData();')

        # 2. Trigger Reset
        page.click('text=STATS [S]')
        time.sleep(0.5)
        page.click('id=btnReset') # "SÛR ?"
        time.sleep(0.5)
        page.click('id=btnReset') # Action
        time.sleep(1)

        # 3. Verify
        tacos = page.evaluate('playerData.tacos')
        print(f"Tacos after reset: {tacos}")

        browser.close()

if __name__ == '__main__':
    run()
