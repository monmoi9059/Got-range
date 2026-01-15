from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Absolute path to file
        cwd = os.getcwd()
        file_path = f"file://{cwd}/gotrange.html"

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Open Shop
        print("Opening Shop...")
        page.locator("text=BOUTIQUE [P]").click()

        # Wait for Shop UI
        shop_ui = page.locator("#shopUI")
        shop_ui.wait_for(state="visible")

        # Check for Shot Style section
        print("Checking for Shot Style UI...")
        if not page.get_by_text("STYLE DE TIR").is_visible():
            print("Error: 'STYLE DE TIR' not visible")
            browser.close()
            return

        # Check default value
        style_label = page.locator("#shotStyleName")
        print(f"Current Style: {style_label.inner_text()}")
        if style_label.inner_text() != "STANDARD":
             print("Error: Default style is not STANDARD")

        # Click Next Style
        # Finding the button in the 3rd skin-nav
        # Or locate relative to the header
        print("Switching style...")
        # Locating the button: find the parent div of the label, then find the '>' button
        # Parent of #shotStyleName is the skin-nav div
        # We want the button with text '>' inside that div
        page.locator("#shotStyleName").locator("..").get_by_text(">").click()

        # Check value
        print(f"New Style: {style_label.inner_text()}")
        desc = page.locator("#shotStyleDesc").inner_text()
        print(f"Description: {desc}")

        if style_label.inner_text() != "MJ LEGEND":
             print("Error: Failed to switch to MJ LEGEND")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/shop_shot_style.png")

        browser.close()

if __name__ == "__main__":
    run()
