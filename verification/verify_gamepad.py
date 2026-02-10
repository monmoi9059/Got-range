from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # Check if GamepadController is defined
        is_defined = page.evaluate("typeof GamepadController !== 'undefined'")
        print(f"GamepadController defined: {is_defined}")

        # Check if GamepadController has moveFocus method
        has_method = page.evaluate("typeof GamepadController.moveFocus === 'function'")
        print(f"GamepadController.moveFocus defined: {has_method}")

        # Check tabindex on music buttons
        music_btn_tabindex = page.locator("#btn-mute").get_attribute("tabindex")
        print(f"Music button tabindex: {music_btn_tabindex}")

        # Screenshot
        page.screenshot(path="verification/game_screen.png")

        browser.close()

if __name__ == "__main__":
    run()
