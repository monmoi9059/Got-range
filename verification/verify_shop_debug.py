from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"ERROR: {exc}"))

        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Start
        page.click("text=ORDI")
        page.wait_for_timeout(1000)

        # Open Shop
        page.evaluate("openShop()")
        page.wait_for_timeout(500)

        # Check SHOES_DB length
        count = page.evaluate("SHOES_DB.length")
        print(f"SHOES_DB length: {count}")

        # Scroll to Top (Hair)
        page.evaluate("document.querySelector('.modal').scrollTop = 0")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/shop_top.png")

        # Change Hair (should be visible now)
        page.fill("#sldCustomHairColor", "5")
        page.evaluate("updateCustomHairColor()")

        # Scroll to Middle (Shoes)
        # Element #btnEquipHat is above Shoes. Let's scroll it into view.
        page.evaluate("document.getElementById('btnEquipHat').scrollIntoView()")
        page.wait_for_timeout(500)

        # Change Shoes
        page.evaluate("changeShoes(1)") # 1
        page.wait_for_timeout(100)
        page.evaluate("changeShoes(1)") # 2
        page.wait_for_timeout(100)
        page.evaluate("changeShoes(1)") # 3 (Red)
        page.wait_for_timeout(100)

        # Check current shoe name
        name = page.evaluate("document.getElementById('shoeName').innerText")
        print(f"Shoe Name: {name}")

        page.screenshot(path="verification/shop_shoes.png")

        browser.close()

if __name__ == "__main__":
    run()
