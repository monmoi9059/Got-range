from playwright.sync_api import sync_playwright
import os

def capture_animal_skins():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})

        # Load local file
        file_path = f"file://{os.getcwd()}/gotrange.html"
        page.goto(file_path)

        # Wait for game to init
        page.wait_for_timeout(2000)

        # Click "ORDI" to start
        page.click('button:has-text("ORDI 💻")')
        page.wait_for_timeout(1000)

        # Define animals to check
        animals = [
            {'skin': 'chicken_classic', 'name': 'Chicken'},
            {'skin': 'frog_classic', 'name': 'Frog'},
            {'skin': 'turtle_classic', 'name': 'Turtle'},
            {'skin': 'elephant_classic', 'name': 'Elephant'},
            {'skin': 'dino_rex', 'name': 'T-Rex'},
            {'skin': 'zebra_classic', 'name': 'Zebra'},
            {'skin': 'giraffe_classic', 'name': 'Giraffe'},
            {'skin': 'dino_purple', 'name': 'Barney'}
        ]

        # Inject script to force equip skins
        for animal in animals:
            skin_id = animal['skin']
            name = animal['name']
            print(f"Capturing {name} ({skin_id})...")

            page.evaluate(f"""
                playerData.unlockedSkins.push('{skin_id}');
                playerData.currentSkin = '{skin_id}';
                const s = SKINS_DB.find(x => x.id === '{skin_id}');
                // Reset position to center for clean shot
                player3D.x = 533; player3D.y = 300; player3D.z = 0;
                // Force update
                saveData();
            """)
            page.wait_for_timeout(500)
            page.screenshot(path=f"verification/animal_{name.lower()}.png")

        browser.close()

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    capture_animal_skins()
