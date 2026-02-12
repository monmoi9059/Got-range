from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Inject cheats
        page.evaluate("window.unlockAllSkins()") # Sets resetStage=2
        page.evaluate("window.unlockAllSkins()") # Actually unlocks
        page.evaluate("playerData.tacos = 100000")

        # Start Game (Click ORDI)
        page.click("text=ORDI")

        # Wait for game to settle
        page.wait_for_timeout(1000)

        # Open Shop
        page.click("text=BOUTIQUE")

        # Wait for Shop UI
        page.wait_for_selector("#shopUI")
        page.wait_for_timeout(500)

        # Take Screenshot of Initial Shop (Hair Color/Length should be visible)
        page.screenshot(path="verification/shop_initial.png")

        # Change Hair Color (Slider)
        page.fill("#sldCustomHairColor", "5") # Green?
        page.evaluate("updateCustomHairColor()")

        # Change Hair Length
        page.fill("#sldCustomHairSize", "1.5")
        page.evaluate("updateCustomHairSize()")

        # Change Shoes (Click Next until a shoe is selected)
        # We need to find the shoe navigator. It's under "CHAUSSURES"
        # We can simulate calling changeShoes(1)
        page.evaluate("changeShoes(1)") # Sneakers White
        page.evaluate("changeShoes(1)") # Sneakers Black
        page.evaluate("changeShoes(1)") # Sneakers Red

        # Equip Shoes
        page.click("#btnEquipShoe")

        page.wait_for_timeout(500)

        # Take Screenshot with Changes
        page.screenshot(path="verification/shop_modified.png")

        browser.close()

if __name__ == "__main__":
    run()
