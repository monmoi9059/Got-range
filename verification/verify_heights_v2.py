import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.path.abspath('gotrange.html')}")

        # Start
        page.get_by_role("button", name="ORDI 💻").click()

        # Unlock all
        page.locator("#controls").get_by_text("STATS [S]").click()
        page.get_by_role("button", name="DÉBLOQUER TOUS LES SKINS").click()
        page.get_by_role("button", name="SÛR ? (CLIQUEZ ENCORE)").click()
        page.get_by_role("button", name="FERMER").click()

        # Helper to set skin and screenshot
        def capture_skin(animal_idx, skin_idx, filename):
            page.evaluate(f"""
                window.playerData.unlockedSkins.push('temp_unlock');
                window.viewingAnimalIndex = {animal_idx};
                window.viewingSkinIndex = {skin_idx};
                window.buyOrEquipSkin();
                window.closeShop();
            """)
            page.wait_for_timeout(1000) # Wait for fade/render
            page.screenshot(path=f"verification/{filename}")
            print(f"Captured {filename}")

        # AI (Small)
        # Animal 14 (Human), Skin 11 (AI)
        capture_skin(14, 11, "ai_court.png")

        # Shaq (Huge)
        # Animal 14, Skin 10 (Shaq)
        capture_skin(14, 10, "shaq_court.png")

        # MJ (Normal)
        # Animal 14, Skin 8 (MJ)
        capture_skin(14, 8, "mj_court.png")

        browser.close()

if __name__ == "__main__":
    run()
