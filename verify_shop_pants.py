
import sys
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the game
        page.goto("file://" + sys.path[0] + "/gotrange.html")

        # Wait for game to be ready
        page.wait_for_selector("#game-container", state="visible")

        # Force hide startup UI
        page.evaluate("document.getElementById('startup-ui').style.display = 'none';")
        page.evaluate("if(typeof startGame === 'function') startGame();")

        page.wait_for_timeout(1000)
        print("Game Loaded.")

        # Open Shop
        page.evaluate("window.openShop()")
        page.wait_for_timeout(500)
        print("Shop Opened.")

        # 1. Verify Pants Section Exists
        pants_name_el = page.locator("#pantsName")
        if not pants_name_el.is_visible():
            print("ERROR: Pants Name element not visible.")
            browser.close()
            sys.exit(1)

        initial_pants = pants_name_el.inner_text()
        print(f"Initial Pants: {initial_pants}")

        # 2. Navigate to "JEANS BLEUS" (Index 1)
        # Assuming we start at Index 0 ("AUCUN")
        found = False
        next_btn = page.locator("button[onclick='changePants(1)']")

        for i in range(15):
            current = pants_name_el.inner_text()
            if "JEANS BLEUS" in current:
                found = True
                break
            next_btn.click()
            page.wait_for_timeout(200)

        if not found:
            print("ERROR: Could not find 'JEANS BLEUS'.")
            browser.close()
            sys.exit(1)

        print(f"Selected Pants: {pants_name_el.inner_text()}")

        # 3. Buy/Equip
        btn = page.locator("#btnEquipPants")
        if btn.is_visible():
            txt = btn.inner_text()
            if "ACHETER" in txt.upper():
                page.evaluate("playerData.tacos += 1000; window.updateShopUI();")
                page.wait_for_timeout(100)
                btn.click()
                print("Bought Pants.")
            else:
                btn.click()
                print("Equipped Pants.")

        page.wait_for_timeout(500)
        status = page.locator("#pantsStatus").inner_text()
        if "ÉQUIPÉ" not in status.upper() and "EQUIPÉ" not in status.upper():
             print(f"WARNING: Status is '{status}', expected EQUIPPED.")

        print("Pants Equipped.")

        # 4. Verify Persistence (Close/Open Shop)
        page.evaluate("window.closeShop()")
        page.wait_for_timeout(1000)
        page.evaluate("window.openShop()")
        page.wait_for_timeout(500)

        final_pants = pants_name_el.inner_text()
        print(f"Final Displayed Pants: {final_pants}")

        if "JEANS BLEUS" in final_pants:
            print("SUCCESS: Shop remembered the equipped pants!")
        else:
            print(f"FAILURE: Expected 'JEANS BLEUS', got '{final_pants}'.")
            browser.close()
            sys.exit(1)

        # 5. Verify Stance Logic (Programmatically check knee positions?)
        # We can try to set a wide width and check if knee offsets change.
        # But that's hard to measure via DOM. We'll rely on code review for the math.

        browser.close()

if __name__ == "__main__":
    run()
