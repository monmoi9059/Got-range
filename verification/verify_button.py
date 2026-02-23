import sys
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the game
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for game to be ready
        page.wait_for_selector("#game-container", state="visible")

        # Force hide startup UI
        page.evaluate("document.getElementById('startup-ui').style.display = 'none';")
        page.evaluate("if(typeof startGame === 'function') startGame();")

        # Open Shop
        page.evaluate("window.openShop()")
        page.wait_for_timeout(500)

        # Switch to Character Tab
        page.click("button[onclick=\"switchShopTab('character')\"]")
        page.wait_for_timeout(500)

        # Screenshot the shop UI
        # Locate the skin-viewer section or the whole modal
        shop = page.locator("#shopUI")
        shop.screenshot(path="verification/shop_button.png")
        print("Screenshot taken.")
        browser.close()

if __name__ == "__main__":
    run()
