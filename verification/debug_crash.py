import sys
from playwright.sync_api import sync_playwright

def debug():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Capture console logs and errors
        page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
        page.on('pageerror', lambda exc: print(f'PAGE ERROR: {exc}'))

        try:
            page.goto('http://localhost:8080/taco_app/www/index.html')

            # Wait for startup UI
            page.wait_for_selector('#startup-ui', state='visible', timeout=5000)
            print('Startup UI visible')

            # Click 'ORDI' to start
            page.click('text=ORDI 💻')
            print('Clicked ORDI')

            # Wait for IDLE state
            page.wait_for_timeout(2000)

            # Open Shop [P]
            page.keyboard.press('p')
            page.wait_for_selector('#shopUI', state='visible')
            print('Shop opened')

            # Click Right Arrow for Animal 3 times (Rat -> Cat -> Dog -> Bear)
            # The selector .skin-nav:nth-child(2) button:nth-child(3) targets the animal selector's right arrow
            for i in range(3):
                page.click('.skin-nav:nth-child(2) button:nth-child(3)')
                page.wait_for_timeout(500)
                print(f'Clicked animal next {i+1}')

            # Close Shop
            page.click('#shopUI .btn-close')
            print('Shop closed')

            # Wait a bit to see if render loop crashes
            page.wait_for_timeout(2000)

            page.screenshot(path='verification/debug_state.png')
            print('Screenshot taken')

        except Exception as e:
            print(f'TEST SCRIPT EXCEPTION: {e}')

        browser.close()

if __name__ == '__main__':
    debug()
