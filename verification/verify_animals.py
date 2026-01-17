from playwright.sync_api import sync_playwright
import os
import time

def verify_animals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 800, 'height': 600})
        page = context.new_page()

        page.goto(f"file://{os.getcwd()}/gotrange.html")
        try: page.click("text=ORDI 💻", timeout=2000)
        except: pass

        # Unlock and set massive tacos
        page.evaluate("""
            window.playerData.tacos = 10000000;
            window.saveData();
            window.updateUI();
            window.unlockAllSkins();
            window.unlockAllSkins();
        """)

        page.click("text=BOUTIQUE [P]")
        time.sleep(0.5)

        new_animals = ['FOX', 'WOLF', 'LION', 'TIGER', 'PIG', 'COW', 'MONKEY', 'PENGUIN']
        animal_next_btn = "#shopUI .skin-viewer .skin-nav:nth-child(2) button:last-child"
        skin_next_btn = "#shopUI .skin-viewer .skin-nav:nth-child(3) button:last-child"
        equip_btn = "#btnEquipSkin"
        close_btn = "#shopUI .btn-close"

        for animal in new_animals:
            # 1. Find Animal
            print(f"Selecting {animal}...")
            found = False
            for _ in range(20):
                if page.inner_text("#animalName").strip() == animal:
                    found = True
                    break
                page.click(animal_next_btn)
                time.sleep(0.1)

            if not found: continue

            # 2. Equip Base Skin (First one)
            # Ensure we are on first skin?
            # actually we might be on random skin if we looped.
            # let's just cycle to a specific skin or just use current.
            # The script cycles skins forward.

            # Let's just capture the current visible skin (Classic usually first)
            page.click(equip_btn)
            time.sleep(0.1)

            # 3. Close Shop to see player
            page.click(close_btn)
            time.sleep(0.5) # Wait for fade/render

            # 4. Screenshot
            page.screenshot(path=f"verification/render_{animal.lower()}_base.png")
            print(f"Rendered {animal} Base")

            # 5. Re-open Shop
            page.click("text=BOUTIQUE [P]")
            time.sleep(0.5)

            # 6. Select a variant (Next skin)
            page.click(skin_next_btn)
            time.sleep(0.1)
            skin_name = page.inner_text("#skinName").strip().replace(' ', '_')

            page.click(equip_btn)
            time.sleep(0.1)

            page.click(close_btn)
            time.sleep(0.5)

            page.screenshot(path=f"verification/render_{animal.lower()}_{skin_name}.png")
            print(f"Rendered {animal} {skin_name}")

            # Open shop for next iteration
            page.click("text=BOUTIQUE [P]")
            time.sleep(0.5)

        browser.close()

if __name__ == "__main__":
    verify_animals()
