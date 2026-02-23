from playwright.sync_api import sync_playwright, expect
import time

def verify_splitscreen_hud():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the game
        # Assuming the server is running on port 8080 or file access
        # Since I cannot start a server easily here without blocking, I'll try file access.
        # But file access might have CORS issues with modules if used.
        # The game seems to use a single HTML file with injected JS/CSS, so file:// might work.
        page.goto("file:///app/gotrange.html")

        # Wait for game to load (canvas)
        page.wait_for_selector("#gameCanvas")

        # Click "ORDI" button to start
        page.click("button:has-text('ORDI')")

        # Wait for controls to appear
        page.wait_for_selector("#controls")

        # Open Menu
        page.click(".controls-menu-toggle")

        # Wait for menu items
        page.wait_for_selector("#controls-items.open")

        # Click "2 PLAYERS"
        # The text might be inside a span inside a div
        page.click("span:has-text('2 PLAYERS')")

        # Wait a bit for transition
        time.sleep(1)

        # Take screenshot
        page.screenshot(path="verification/splitscreen_hud.png")

        print("Screenshot taken: verification/splitscreen_hud.png")
        browser.close()

if __name__ == "__main__":
    verify_splitscreen_hud()
