from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")
        page.wait_for_timeout(1000)

        # Start Desktop
        page.click("button:text('ORDI 💻')")

        # Open Shop
        page.keyboard.press("p")
        page.wait_for_timeout(500)
        page.click("button:text('STYLE')")
        page.click("button:text('CRÉER COIFFURE')")
        page.wait_for_timeout(1000)

        # Draw something (Click in center)
        # Canvas is 300x300. Center 150,150.
        # Canvas bounds?
        box = page.locator("#hairEditorCanvas").bounding_box()
        if box:
            cx = box['x'] + box['width'] / 2
            cy = box['y'] + box['height'] / 2
            page.mouse.click(cx, cy) # Dot in center
            page.mouse.click(cx + 20, cy + 20) # Another dot

        # Save
        page.click("button:text('SAUVEGARDER')")
        page.wait_for_timeout(500)

        # Creator should be closed. Open it again.
        page.click("button:text('CRÉER COIFFURE')")
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/hair_saved_reloaded.png")

        browser.close()

if __name__ == "__main__":
    run()
