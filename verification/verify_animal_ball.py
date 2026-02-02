from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/gotrange.html")

        # Select Rat Skin
        page.evaluate("window.playerData.currentSkin = 'rat_classic'")
        page.evaluate("window.playerData.platformChosen = true")
        page.evaluate("window.saveData()")
        page.evaluate("window.startGame()")

        # Wait for game loop
        time.sleep(1)

        # Force Jump (Start)
        page.evaluate("window.startJump()")

        # Wait a few frames for arms to go up
        time.sleep(0.1)

        # Take screenshot
        page.screenshot(path="verification/animal_jump_ball.png")

        browser.close()

if __name__ == "__main__":
    run()
