import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open the file directly
        page.goto(f"file://{os.path.abspath('gotrange.html')}")

        # Handle startup
        page.get_by_role("button", name="ORDI 💻").click()

        # Unlock skins via Stats menu
        page.locator("#controls").get_by_text("STATS [S]").click()
        page.get_by_role("button", name="DÉBLOQUER TOUS LES SKINS").click()
        # Need to click confirm
        page.get_by_role("button", name="SÛR ? (CLIQUEZ ENCORE)").click()
        page.get_by_role("button", name="FERMER").click()

        # Open Shop
        page.locator("#controls").get_by_text("BOUTIQUE [P]").click()

        # Navigate to Humans (Animal Index 14: Rat=0... Human=14)
        # Or just click Next Animal until we see HUMAN (or specific human names)
        # Easier to inject JS to set the indices directly for speed

        # Set to AI (The Answer)
        page.evaluate("""
            window.viewingAnimalIndex = 14;
            window.viewingSkinIndex = 11; // AI is index 11 in the human list
            window.updateShopUI();
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/ai_small.png")
        print("Captured AI")

        # Set to Shaq (Diesel)
        page.evaluate("""
            window.viewingAnimalIndex = 14;
            window.viewingSkinIndex = 10; // Shaq is index 10
            window.updateShopUI();
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/shaq_huge.png")
        print("Captured Shaq")

        # Set to MJ (GOAT) - Normal baseline
        page.evaluate("""
            window.viewingAnimalIndex = 14;
            window.viewingSkinIndex = 8; // MJ is index 8
            window.updateShopUI();
        """)
        page.wait_for_timeout(500)
        page.screenshot(path="verification/mj_normal.png")
        print("Captured MJ")

        browser.close()

if __name__ == "__main__":
    run()
