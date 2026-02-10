from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        file_path = os.path.abspath('gotrange.html')
        page.goto(f"file://{file_path}")

        # Click ORDI
        page.wait_for_selector("#startup-ui")
        page.get_by_text("ORDI 💻").click()

        page.wait_for_selector("#controls", state="visible")

        # Force IDLE and Tacos in ALL contexts
        page.evaluate("""
            state = 'IDLE';
            game1.state = 'IDLE';
            if(typeof game2 !== 'undefined') game2.state = 'IDLE';
            playerData.tacos = 50000;
            saveData();
            updateUI();
        """)

        # Try JS click
        print("Attempting to open shop...")
        page.evaluate("openShop()")

        # Check display manually
        display = page.evaluate("document.getElementById('shopUI').style.display")
        print(f"Shop Display: '{display}'")

        # Wait for Shop UI
        page.wait_for_selector("#shopUI", state="visible")
        print("Shop Opened")

        # Hat Section
        page.wait_for_selector("text=CHAPEAUX")

        hat_name_loc = page.locator("#hatName")
        print(f"Initial Hat: {hat_name_loc.inner_text()}")

        next_btn = page.locator("#hatName + button")
        next_btn.click()
        page.wait_for_timeout(200)
        print(f"Hat 1: {hat_name_loc.inner_text()}")

        # Buy/Equip
        equip_btn = page.locator("#btnEquipHat")
        btn_text = equip_btn.inner_text()
        print(f"Button Text: {btn_text}")

        if "ACHETER" in btn_text.upper():
            equip_btn.click()
            print("Bought Hat")
            page.wait_for_timeout(200)

        btn_text = equip_btn.inner_text()
        if "ÉQUIPER" in btn_text.upper():
            equip_btn.click()
            print("Equipped Hat")
            page.wait_for_timeout(200)

        # Close Shop
        page.locator("#shopUI .btn-close").click()
        page.wait_for_selector("#shopUI", state="hidden")

        # Wait for rendering
        page.wait_for_timeout(2000)

        page.screenshot(path="verification/hat_verification.png")
        print("Screenshot saved to verification/hat_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
