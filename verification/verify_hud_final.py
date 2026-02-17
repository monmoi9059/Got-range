
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use an emulated mobile device (Pixel 5)
        context = browser.new_context(
            viewport={'width': 393, 'height': 851},
            device_scale_factor=2.75,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        # Load the generated HTML
        url = 'file://' + os.path.abspath('gotrange.html')
        print(f'Loading {url}...')

        page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
        page.goto(url)

        # Click Mobile button to start game
        page.get_by_role('button', name='MOBILE').click()

        # Wait for game initialization
        page.wait_for_timeout(2000)

        # Take screenshot of portrait mode HUD
        screenshot_path = 'verification/hud_final_portrait.png'
        page.screenshot(path=screenshot_path)
        print(f'Screenshot saved to {screenshot_path}')

        browser.close()

if __name__ == '__main__':
    run()
