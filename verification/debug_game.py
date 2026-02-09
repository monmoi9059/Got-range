from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.on('console', lambda msg: print(f"CONSOLE [{msg.type}]: {msg.text}"))
        def log_error(exc):
            print(f"PAGE ERROR: {exc}")
            if hasattr(exc, 'stack'):
                print(f"STACK: {exc.stack}")
        page.on('pageerror', log_error)

        path = os.path.abspath('gotrange.html')
        print(f"Loading {path}...")
        page.goto(f'file://{path}')

        try:
            page.wait_for_timeout(3000)
        except Exception as e:
            print(f"Wait failed: {e}")

        page.screenshot(path='verification/debug_screenshot.png')
        browser.close()

if __name__ == '__main__':
    run()
