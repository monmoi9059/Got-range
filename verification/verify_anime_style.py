from playwright.sync_api import sync_playwright
import os
import time

def verify_anime_style():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        cwd = os.getcwd()
        filepath = f"file://{cwd}/gotrange.html"
        print(f"Loading {filepath}")
        page.goto(filepath)

        # 1. Startup Screen
        page.screenshot(path="verification/step1_startup.png")
        print("Captured startup screen")

        # 2. Click ORDI
        page.click("text=ORDI 💻")

        # 3. Wait for game loop to render a few frames
        # We can't easily hook into requestAnimationFrame in sync playwright without evaluating JS
        # But a simple sleep might work if the browser is running the loop
        time.sleep(2)

        # 4. Capture Gameplay (Idle)
        page.screenshot(path="verification/step2_gameplay.png")
        print("Captured gameplay screen")

        # 5. Trigger Jump (Space)
        page.keyboard.press("Space")
        time.sleep(0.5) # Mid-jump
        page.screenshot(path="verification/step3_jump.png")
        print("Captured jump screen")

        browser.close()

if __name__ == "__main__":
    verify_anime_style()
