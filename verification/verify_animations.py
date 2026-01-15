import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")
        page.wait_for_timeout(1000)

        # Helper to equip a style and shoot
        def equip_and_shoot(style_index, name):
            print(f"Testing style: {name}")
            # Open Shop
            page.click("text=BOUTIQUE [P]")
            page.wait_for_timeout(500)

            # Select Style
            # Reset style index first? It's hard to know state.
            # Let's just assume we are at 0 (Classic) or track it.
            # Actually, simpler: just set state directly in console for verification
            page.evaluate(f"playerData.currentStyle = '{style_index}'; saveData();")
            page.evaluate("closeShop();")
            page.wait_for_timeout(500)

            # Start Jump (Hold Space)
            page.keyboard.down("Space")
            page.wait_for_timeout(300) # Wait for animation to settle mid-air

            # Screenshot
            page.screenshot(path=f"verification/shoot_{name}.png")

            # Release Shot
            page.keyboard.up("Space")
            page.wait_for_timeout(1000) # Wait for ball to land

        # Styles to test
        styles = [
            ("classic", "Classic"),
            ("curry", "Curry"),
            ("granny", "Granny"),
            ("statue", "Statue"),
            ("fade", "Fadeaway")
        ]

        for s_id, s_name in styles:
            equip_and_shoot(s_id, s_name)

        browser.close()

if __name__ == "__main__":
    run()
