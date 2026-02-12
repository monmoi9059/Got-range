
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

        # Give it a moment to stabilize
        page.wait_for_timeout(1000)

        print("Game Loaded.")

        # Open Shop
        page.evaluate("window.openShop()")
        page.wait_for_timeout(500)

        print("Shop Opened.")

        # Verify Shoes Section Exists
        shoe_name_el = page.locator("#shoeName")
        if not shoe_name_el.is_visible():
            print("ERROR: Shoe Name element not visible.")
            browser.close()
            sys.exit(1)

        initial_shoe = shoe_name_el.inner_text()
        print(f"Initial Shoe: {initial_shoe}")

        # Navigate to "BASKETS ROUGES" (Index 3)
        # Assuming we start at Index 0 ("AUCUNE") or 1 ("BASKETS BLANCHES")?
        # Let's just click 'next' until we find it.
        found = False
        next_btn = page.locator("button[onclick='changeShoes(1)']")

        for i in range(10):
            current = shoe_name_el.inner_text()
            if "ROUGES" in current:
                found = True
                break
            next_btn.click()
            page.wait_for_timeout(200)

        if not found:
            print("ERROR: Could not find 'BASKETS ROUGES'.")
            browser.close()
            sys.exit(1)

        print(f"Selected Shoe: {shoe_name_el.inner_text()}")

        # Equip it
        # Check if button is "Equip" or "Buy"
        btn = page.locator("#btnEquipShoe")
        if btn.is_visible():
            txt = btn.inner_text()
            if "ACHETER" in txt.upper():
                # Cheat some tacos
                page.evaluate("playerData.tacos += 1000; window.updateShopUI();")
                page.wait_for_timeout(100)
                # Need to re-fetch button handle maybe?
                btn.click()
                print("Bought Shoe.")
            else:
                btn.click()
                print("Equipped Shoe.")

        # Verify it says "EQUIPPED" (or button hidden)
        page.wait_for_timeout(500)
        status = page.locator("#shoeStatus").inner_text()
        # "ÉQUIPÉ" might be uppercase
        if "ÉQUIPÉ" not in status.upper() and "EQUIPÉ" not in status.upper():
             print(f"WARNING: Status is '{status}', expected EQUIPPED.")

        print("Shoe Equipped.")

        # Close Shop
        page.evaluate("window.closeShop()")
        page.wait_for_timeout(1000)
        print("Shop Closed.")

        # Re-Open Shop
        page.evaluate("window.openShop()")
        page.wait_for_timeout(500)
        print("Shop Re-Opened.")

        # Check displayed shoe
        final_shoe = shoe_name_el.inner_text()
        print(f"Final Displayed Shoe: {final_shoe}")

        if "ROUGES" in final_shoe:
            print("SUCCESS: Shop remembered the equipped shoe!")
        else:
            print(f"FAILURE: Expected 'ROUGES', got '{final_shoe}'.")
            browser.close()
            sys.exit(1)

        browser.close()

if __name__ == "__main__":
    run()
