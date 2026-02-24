from playwright.sync_api import sync_playwright
import os

def test_game_load():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Wait for the canvas to be present (Correct ID: gameCanvas)
        page.wait_for_selector("#gameCanvas", timeout=5000)

        # Check if the new hairstyles are in the data array variable 'HAIRSTYLES'
        # We need to evaluate JS in the page context
        result = page.evaluate("() => { return HAIRSTYLES.find(h => h.id === 'spiky_messy') }")

        print(f"Hairstyle check result: {result}")

        if result and result['id'] == 'spiky_messy':
            print("SUCCESS: spiky_messy found in HAIRSTYLES")
        else:
            print("FAILURE: spiky_messy not found")
            exit(1)

        # Take a screenshot of the initial load
        page.screenshot(path="verification/game_load.png")
        print("Screenshot saved to verification/game_load.png")

        browser.close()

if __name__ == "__main__":
    test_game_load()
