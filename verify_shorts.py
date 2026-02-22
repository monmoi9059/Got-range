
import os
import time
from playwright.sync_api import sync_playwright

def verify_clothing_fps():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = f"file://{os.path.abspath('gotrange.html')}"
        print(f"Navigating to {url}")
        page.goto(url)
        page.wait_for_selector("#gameCanvas")

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

        window.playerData.currentSkin = 'bear_classic';
        window.playerData.currentPants = 'pants_none';
        window.playerData.currentClothing = 'clothes_none';
        """
        page.evaluate(setup_script)

        print("Measuring Baseline (Bear)...")
        baseline_fps = page.evaluate("window.measureFPS()")
        print(f"Baseline FPS: {baseline_fps}")

        print("Equipping Long Pants...")
        page.evaluate("window.playerData.currentPants = 'pants_blue_jeans';")
        long_fps = page.evaluate("window.measureFPS()")
        print(f"Long Pants FPS: {long_fps}")

        print("Equipping Shorts...")
        page.evaluate("window.playerData.currentPants = 'pants_shorts_denim';")
        shorts_fps = page.evaluate("window.measureFPS()")
        print(f"Shorts FPS: {shorts_fps}")

        browser.close()

if __name__ == "__main__":
    verify_clothing_fps()
