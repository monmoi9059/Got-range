from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        # Open file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Click ORDI
        try:
            page.click("text=ORDI 💻", timeout=5000)
        except:
            print("Startup UI might be skipped or different")

        # Wait for game
        page.wait_for_selector("#game-container")

        # Open Shop
        page.click("text=BOUTIQUE [P]")
        page.wait_for_selector("#shopUI", state="visible")

        # Ensure we are on the first animal (Rat)
        # Assuming default start is Rat.

        # Take screenshot of default (Rat)
        page.screenshot(path="verification_rat.png")
        print("Captured Rat")

        # Cycle through animals
        animals = [
            "cat", "dog", "bear", "rabbit", "moose", "fox", "wolf",
            "lion", "tiger", "pig", "cow", "monkey", "penguin",
            "chicken", "frog", "turtle", "elephant", "dino", "zebra", "giraffe", "human"
        ]

        for name in animals:
            page.click("button[onclick='changeAnimal(1)']")
            page.wait_for_timeout(200) # Wait for render
            page.screenshot(path=f"verification_{name}.png")
            print(f"Captured {name}")

        browser.close()

if __name__ == "__main__":
    run()
