from playwright.sync_api import sync_playwright
import time
import os

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine URL (local file)
        cwd = os.getcwd()
        url = f"file://{cwd}/gotrange.html"

        print(f"Navigating to {url}")
        page.goto(url)

        print("Clicking 'ORDI'...")
        page.click("text=ORDI")
        time.sleep(1)

        print("Clicking '2 PLAYERS'...")
        page.click("text=2 PLAYERS")
        time.sleep(1)

        # Open Shop (BOUTIQUE)
        print("Opening Shop...")
        page.click("text=BOUTIQUE")
        time.sleep(1)

        # Switch to Player 2
        print("Switching to Player 2...")
        page.click("#shopPlayerToggle button")
        time.sleep(0.5)

        # Give Money to Player 2
        print("Injecting funds...")
        page.evaluate("game2.playerData.tacos = 5000; updateShopUI();")
        time.sleep(0.5)

        # Change Skin for Player 2
        print("Changing P2 Skin...")
        page.click("button[onclick='changeSkin(1)']")
        time.sleep(0.5)

        # Equip Skin (Buy/Equip)
        print("Equipping P2 Skin...")
        page.click("#btnEquipSkin")
        time.sleep(0.5)

        # Also change shooting style
        print("Changing P2 Style...")
        page.click("button[onclick='changeShootingStyle(1)']")
        time.sleep(0.5)
        page.click("#btnEquipStyle")

        # Capture Shop State
        page.screenshot(path="verification/shop_state.png")
        print("Shop screenshot taken.")

        # Close Shop
        print("Closing Shop...")
        page.click("#shopUI .btn-close")
        time.sleep(1)

        # Verify P1 and P2 are different visually
        page.screenshot(path="verification/final_gameplay.png")
        print("Final gameplay screenshot taken.")

        browser.close()

if __name__ == "__main__":
    run_test()
