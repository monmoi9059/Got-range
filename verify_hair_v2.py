from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for canvas
        page.wait_for_selector("#gameCanvas")

        # Start game
        try:
            page.click("text=ORDI 💻", timeout=5000)
        except:
            print("Could not click start")

        page.wait_for_timeout(1000)

        # Set graphics to HIGH for best hair rendering
        page.evaluate("playerData.graphics = 'HIGH';")

        skins_to_test = [
            ('human_wall', 'Wall_Short_Fade'),
            ('human_curry', 'Curry_Short_Curly'),
            ('human_harden', 'Harden_Mohawk'),
            ('human_lebron', 'LeBron_Headband'),
            ('human_klaw', 'Kawhi_Cornrows'),
            ('human_drj', 'DrJ_Afro'),
            ('human_bird', 'Bird_Straight')
        ]

        for skin_id, name in skins_to_test:
            print(f"Capturing {name}...")
            page.evaluate(f"playerData.currentSkin = '{skin_id}';")
            # Force idle state to reset animation
            page.evaluate("state = 'IDLE'; player3D.z = 0;")
            page.wait_for_timeout(500)
            page.screenshot(path=f"verification_{name}.png")

        browser.close()

if __name__ == "__main__":
    run()
