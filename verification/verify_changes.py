from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Wait for game to load
        page.wait_for_timeout(2000)

        # Choose Platform (Desktop)
        page.evaluate("choosePlatform('desktop')")
        page.wait_for_timeout(1000)

        # Open Stats Menu via JS
        page.evaluate("openStats()")

        # Wait for UI
        page.wait_for_timeout(1000)

        # Check if button exists
        btn = page.locator("#btnResetCatSize")
        if btn.is_visible():
            print("SUCCESS: Reset Cat Size button is visible.")
        else:
            print("FAILURE: Reset Cat Size button is NOT visible.")

        # Take screenshot
        page.screenshot(path="verification/stats_menu.png")

        browser.close()

if __name__ == "__main__":
    run()
