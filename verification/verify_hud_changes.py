import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})

        # Load local HTML file
        page.goto(f"file://{os.path.abspath('gotrange.html')}")

        # Wait for game to initialize (skip startup if needed, but startup-ui is usually hidden by logic or click)
        # Actually, checkStartup() shows startup-ui if platformChosen is false.
        # We need to simulate platform choice.

        try:
            page.wait_for_selector('#startup-ui', state='visible', timeout=2000)
            print("Startup UI visible, clicking 'ORDI'...")
            page.click("button.startup-btn:has-text('ORDI')")
        except:
            print("Startup UI not visible or timed out, assuming game started.")

        # Wait for controls to be visible
        page.wait_for_selector('#controls')

        # 1. Verify HUD Menu Expansion
        print("Clicking MENU toggle...")
        # Force the menu toggle click
        page.click('.controls-menu-toggle')
        page.wait_for_timeout(500) # Wait for animation
        page.screenshot(path='verification/1_hud_menu_expanded.png')
        print("Captured 1_hud_menu_expanded.png")

        # 2. Open Shop
        print("Opening Shop...")
        page.click("text=BOUTIQUE") # Or locator for specific button in the expanded list
        page.wait_for_selector('#shopUI', state='visible')
        page.wait_for_timeout(500)
        page.screenshot(path='verification/2_shop_upgrades_tab.png')
        print("Captured 2_shop_upgrades_tab.png")

        # 3. Switch to Character Tab
        print("Switching to Character Tab...")
        page.click("button.shop-tab-btn:has-text('PERSO')")
        page.wait_for_timeout(300)
        page.screenshot(path='verification/3_shop_character_tab.png')
        print("Captured 3_shop_character_tab.png")

        # 4. Switch to Style Tab
        print("Switching to Style Tab...")
        page.click("button.shop-tab-btn:has-text('STYLE')")
        page.wait_for_timeout(300)
        page.screenshot(path='verification/4_shop_style_tab.png')
        print("Captured 4_shop_style_tab.png")

        # 5. Switch to Gear Tab
        print("Switching to Gear Tab...")
        page.click("button.shop-tab-btn:has-text('MATOS')")
        page.wait_for_timeout(300)
        page.screenshot(path='verification/5_shop_gear_tab.png')
        print("Captured 5_shop_gear_tab.png")

        browser.close()

if __name__ == "__main__":
    run()
