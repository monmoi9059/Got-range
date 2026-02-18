from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the page
        page.goto("file://" + os.path.abspath("gotrange.html"))

        # Click Startup Button (Desktop)
        page.click("button.startup-btn:has-text('ORDI')")
        page.wait_for_timeout(1000)

        # Open Shop [P]
        page.keyboard.press("P")
        page.wait_for_timeout(500)

        # Switch to Style Tab
        page.click("button:has-text('STYLE')")
        page.wait_for_timeout(500)

        # Force Equip Jacket
        page.evaluate('window.playerData.currentClothing = "jacket_leather"')
        page.evaluate('window.playerData.currentShoes = "shoe_yeezy_foam"')
        page.evaluate('window.saveData()')
        page.evaluate('window.updateShopUI()')
        page.evaluate('window.updateUI()')
        page.wait_for_timeout(1000) # Wait for render

        page.screenshot(path="verification/jacket_leather.png")
        print("Captured jacket_leather.png")

        # Force Equip Vest
        page.evaluate('window.playerData.currentClothing = "vest_puffer_red"')
        page.evaluate('window.saveData()')
        page.evaluate('window.updateShopUI()')
        page.evaluate('window.updateUI()')
        page.wait_for_timeout(1000)

        page.screenshot(path="verification/vest_puffer.png")
        print("Captured vest_puffer.png")

        # Force Equip Robe
        page.evaluate('window.playerData.currentClothing = "robe_wizard_blue"')
        page.evaluate('window.saveData()')
        page.evaluate('window.updateShopUI()')
        page.evaluate('window.updateUI()')
        page.wait_for_timeout(1000)

        page.screenshot(path="verification/robe_wizard.png")
        print("Captured robe_wizard.png")

        browser.close()

if __name__ == "__main__":
    run()
