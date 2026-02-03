from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1066, "height": 600})

        # Load local file
        url = "file://" + os.path.abspath("gotrange.html")
        print(f"Loading {url}")
        page.goto(url)

        # Wait for load
        time.sleep(1)

        # Click "ORDI" if startup screen appears
        try:
            btn = page.locator("button.startup-btn").first
            if btn.is_visible():
                print("Clicking startup button")
                btn.click()
                time.sleep(1)
        except Exception as e:
            print(f"Startup button error: {e}")

        # Take screenshot of Classic
        page.screenshot(path="verification/mode_classic.png")
        print("Classic screenshot taken")

        # Click MODE button -> Contest
        print("Switching to Contest")
        page.locator(".broadcast-btn", has_text="MODE").click()
        time.sleep(1)
        page.screenshot(path="verification/mode_contest.png")
        print("Contest screenshot taken")

        # Click MODE button -> Time Attack
        print("Switching to Time Attack")
        page.locator(".broadcast-btn", has_text="MODE").click()
        time.sleep(1)
        page.screenshot(path="verification/mode_timeattack.png")
        print("Time Attack screenshot taken")

        browser.close()

if __name__ == "__main__":
    run()
