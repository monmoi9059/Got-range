from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Load file
        path = os.path.abspath("gotrange.html")
        page.goto(f"file://{path}")

        # Select Desktop
        page.click("button:has-text('ORDI')")

        # Enable High Graphics & Equip Lebron
        page.evaluate("window.playerData.graphics = 'HIGH'; window.playerData.unlockedSkins.push('human_lebron'); window.playerData.currentSkin = 'human_lebron'; window.saveData(); window.updateUI(); window.invalidateBackgroundCache();")

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/lebron_high.png")

        # Equip Hulk
        page.evaluate("window.playerData.unlockedSkins.push('human_hulk'); window.playerData.currentSkin = 'human_hulk'; window.saveData(); window.updateUI();")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/hulk_high.png")

        browser.close()

if __name__ == "__main__":
    run()
