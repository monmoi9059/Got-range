from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        file_path = os.path.abspath('gotrange.html')
        page.goto(f'file://{file_path}')

        # Start Game (Click ORDI)
        try:
            page.locator('text=ORDI').click(timeout=5000)
        except:
            print('Could not click ORDI, maybe already started?')

        page.wait_for_timeout(1000)

        # Inject code to force 500 makes to see the Giant Cat
        page.evaluate('window.playerData.lifetimeStats.makes = 500;')

        # Take pre-shot screenshot (Cat sitting)
        page.screenshot(path='verification/cat_idle.png')

        # Simulate Shot
        page.keyboard.press(' ') # Jump
        page.wait_for_timeout(350) # Hold for perfect timing (approx)
        page.keyboard.press(' ') # Release (might trigger shoot if hold logic used)
        # Actually logic is: Press to start jump (PRE_JUMP -> JUMPING), Release to shoot.
        # Wait, startJump is triggered on keydown. releaseShot on keyup.
        # So:
        page.keyboard.down(' ')
        page.wait_for_timeout(350) # Hold
        page.keyboard.up(' ')    # Release

        # Wait for ball flight (approx 1-2s) and eating (approx 2s after score)
        # We want to catch the eating animation
        page.wait_for_timeout(1500)

        page.screenshot(path='verification/cat_eating.png')
        browser.close()

if __name__ == '__main__':
    run()
