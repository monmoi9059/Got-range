from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for canvas
        page.wait_for_selector("#gameCanvas")

        # Start game
        try:
            page.click("text=ORDI 💻", timeout=5000)
        except:
            print("Could not click start")

        page.wait_for_timeout(1000)

        # 1. Verify Curly (Simple) - John Wall
        print("Capturing Simple Curly...")
        page.evaluate("playerData.currentSkin = 'human_wall';")
        page.evaluate("playerData.graphics = 'HIGH';")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification_curly_simple.png")

        # 2. Verify Straight (Simple) - Larry Bird
        print("Capturing Simple Straight...")
        page.evaluate("playerData.currentSkin = 'human_bird';")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification_straight_simple.png")

        browser.close()

if __name__ == "__main__":
    run()
