from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})

        # Load the game
        page.goto(f"file://{os.getcwd()}/gotrange.html")
        page.wait_for_selector('canvas')
        time.sleep(1)
        page.evaluate("choosePlatform('desktop')")
        time.sleep(1)

        # Setup common environment
        page.evaluate("game1.playerData.graphics = 'HIGH'; invalidateBackgroundCache();")

        skins_to_test = [
            {'id': 'rat_rapper', 'name': 'backpack'},
            {'id': 'rat_wizard', 'name': 'wizard_cape_staff'},
            {'id': 'cat_classic', 'name': 'cat_tail'},
            {'id': 'rat_lumberjack', 'name': 'axe'}
        ]

        for item in skins_to_test:
            skin_id = item['id']
            name = item['name']
            print(f"Testing skin: {skin_id} ({name})")

            page.evaluate(f"""
                game1.playerData.currentSkin = '{skin_id}';
                game1.player3D.x = 533;
                game1.player3D.y = 300;
                game1.player3D.z = 0;
            """)
            time.sleep(1)
            page.screenshot(path=f"verify_{name}.png")
            print(f"Saved verify_{name}.png")

        browser.close()

if __name__ == "__main__":
    run()
