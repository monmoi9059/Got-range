from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Open the local HTML file directly
        file_path = os.path.abspath('gotrange.html')
        page.goto(f'file://{file_path}')

        # Wait for canvas to be ready (game loop started)
        page.wait_for_timeout(2000)

        # Simulate a shot (Keydown space)
        page.keyboard.press(' ')
        page.wait_for_timeout(100)
        page.keyboard.press(' ') # Release

        # Wait for shot to score (approx 2s)
        page.wait_for_timeout(3000)

        # Take screenshot of the hoop area (center)
        # Hoop is at ~733, 150. Crop to that area.
        page.screenshot(path='verification/cat_hoop.png')
        browser.close()

if __name__ == '__main__':
    run()
