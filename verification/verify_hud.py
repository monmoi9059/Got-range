from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({'width': 1280, 'height': 720})
        page.goto(f'file://{os.getcwd()}/gotrange.html')
        page.evaluate("window.choosePlatform('desktop')")
        page.wait_for_timeout(2000)
        page.screenshot(path='verification/hud_remaster.png')
        browser.close()

if __name__ == '__main__':
    run()
