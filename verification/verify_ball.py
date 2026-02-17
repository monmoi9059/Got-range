import os
from playwright.sync_api import sync_playwright

def verify_ball():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        path = os.path.abspath('gotrange.html')
        page.goto(f'file://{path}')

        # Click 'ORDI' (based on text content)
        # The button has text 'ORDI 💻'
        # Let's use a selector that targets the onclick attribute or class
        page.click('.startup-btn:first-child') # Assuming 'ORDI' is the first button

        page.wait_for_selector('#gameCanvas')
        page.wait_for_timeout(2000) # Wait for startup animation if any

        page.screenshot(path='verification/verification.png')
        browser.close()

if __name__ == '__main__':
    verify_ball()
