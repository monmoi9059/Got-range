from playwright.sync_api import sync_playwright
import os

def test_game_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = f"file://{os.path.abspath('gotrange.html')}"
        print(f"Navigating to: {file_path}")
        page.goto(file_path)

        # Check title
        title = page.title()
        print(f"Page Title: {title}")
        assert "Taco Basket Ball" in title, f"Title mismatch: {title}"

        # Take a screenshot
        os.makedirs("verification", exist_ok=True)
        screenshot_path = "verification/game_load.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    test_game_loads()
