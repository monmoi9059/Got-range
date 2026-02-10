from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        file_path = os.path.abspath("gotrange.html")
        page.goto(f"file://{file_path}")

        # 1. Check if VirtualCursor is defined
        is_defined = page.evaluate("typeof VirtualCursor !== 'undefined'")
        print(f"VirtualCursor defined: {is_defined}")

        # 2. Check if cursor element is created (VirtualCursor.init is called in update loop, so trigger an update)
        # We simulate a gamepad controller update call manually to trigger init
        page.evaluate("GamepadController.update()")

        cursor_exists = page.evaluate("!!document.getElementById('gamepad-cursor')")
        print(f"Cursor element exists: {cursor_exists}")

        # 3. Simulate Left Stick Movement
        # We can directly call VirtualCursor.updatePosition(1, 0)
        page.evaluate("VirtualCursor.updatePosition(1, 0)")
        cursor_display = page.evaluate("document.getElementById('gamepad-cursor').style.display")
        print(f"Cursor display after move: {cursor_display}")

        cursor_left_1 = page.evaluate("parseFloat(document.getElementById('gamepad-cursor').style.left)")
        print(f"Cursor X position 1: {cursor_left_1}")

        page.evaluate("VirtualCursor.updatePosition(1, 0)")
        cursor_left_2 = page.evaluate("parseFloat(document.getElementById('gamepad-cursor').style.left)")
        print(f"Cursor X position 2: {cursor_left_2}")

        if cursor_left_2 > cursor_left_1:
            print("Cursor moved successfully.")
        else:
            print("Cursor did not move.")

        # Screenshot
        page.screenshot(path="verification/virtual_cursor.png")

        browser.close()

if __name__ == "__main__":
    run()
