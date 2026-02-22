
import os
import time
from playwright.sync_api import sync_playwright

def verify_clothing_fps():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        url = f"file://{os.path.abspath('gotrange.html')}"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for canvas
        page.wait_for_selector("#gameCanvas")

        # Inject script to measure FPS and toggle clothing
        setup_script = """
        window.fpsHistory = [];
        window.measureFPS = () => {
            let last = performance.now();
            let frames = 0;
            return new Promise(resolve => {
                const loop = () => {
                    const now = performance.now();
                    frames++;
                    if (now - last >= 1000) {
                        resolve(frames);
                    } else {
                        requestAnimationFrame(loop);
                    }
                };
                requestAnimationFrame(loop);
            });
        };

        // Force Animal Character (Bear)
        window.playerData.currentSkin = 'bear_classic';
        window.playerData.currentPants = 'pants_none';
        window.playerData.currentClothing = 'clothes_none';
        """
        page.evaluate(setup_script)

        print("Measuring Baseline (Bear, No Clothes)...")
        baseline_fps = page.evaluate("window.measureFPS()")
        print(f"Baseline FPS: {baseline_fps}")

        # Equip Pants
        print("Equipping Pants...")
        page.evaluate("window.playerData.currentPants = 'pants_blue_jeans';")
        pants_fps = page.evaluate("window.measureFPS()")
        print(f"Pants FPS: {pants_fps}")

        # Equip Shirt
        print("Equipping Shirt...")
        page.evaluate("window.playerData.currentPants = 'pants_none';")
        page.evaluate("window.playerData.currentClothing = 'hoodie_red';")
        shirt_fps = page.evaluate("window.measureFPS()")
        print(f"Shirt FPS: {shirt_fps}")

        # Take screenshot of shirt to see "weird" look
        page.screenshot(path="verification/shirt_weirdness.png")
        print("Screenshot saved to verification/shirt_weirdness.png")

        browser.close()

if __name__ == "__main__":
    verify_clothing_fps()
