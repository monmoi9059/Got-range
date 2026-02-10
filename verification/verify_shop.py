import os
from playwright.sync_api import sync_playwright

def verify_shop():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"ERROR: {exc}"))

        filepath = os.path.abspath("gotrange.html")
        page.goto(f"file://{filepath}")

        # Click desktop choice if startup screen appears
        try:
            if page.locator("#startup-ui").is_visible():
                print("Clicking ORDI...")
                page.click("text=ORDI", timeout=2000)
        except:
            pass

        # Wait for idle state
        page.wait_for_timeout(1000)

        print("Opening Shop...")
        # Try direct click first
        try:
            page.click("text=BOUTIQUE [P]", timeout=2000)
        except:
            print("Click failed, trying evaluate...")
            page.evaluate("window.openShop(true)")

        # Wait for modal
        try:
            page.wait_for_selector("#shopUI", state="visible", timeout=5000)
            print("Shop UI Visible")
        except:
            print("Shop UI NOT Visible - saving debug screenshot")
            page.screenshot(path="verification/debug_fail.png")
            return

        # Verify Hairstyle section
        hair_header = page.locator("h3", has_text="COIFFURE")
        if hair_header.is_visible():
            print("Hairstyle Header Found")
        else:
            print("Hairstyle Header NOT Found")

        # Verify Position (Right side)
        box = page.locator("#shopUI").bounding_box()
        viewport = page.viewport_size
        print(f"Shop Box: {box}")
        print(f"Viewport: {viewport}")

        if box['x'] > viewport['width'] / 2:
            print("Shop is on the right side.")
        else:
            print("Shop is NOT on the right side (Center or Left).")

        # Cycle hairstyles
        print("Cycling hairstyles...")
        next_btn = page.locator("div.skin-nav", has=page.locator("#hairName")).locator("button").nth(1)
        next_btn.click()
        page.wait_for_timeout(500)

        # Equip current
        print("Equipping...")
        page.click("#btnEquipHair")
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path="verification/shop_verification.png")
        print("Screenshot saved to verification/shop_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_shop()
