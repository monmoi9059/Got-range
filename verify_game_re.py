from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Using /app/ as the current directory seems to be /app based on `pwd`
        page.goto("file:///app/gotrange.html")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/game_re_render.png")
        browser.close()

if __name__ == "__main__":
    run()
