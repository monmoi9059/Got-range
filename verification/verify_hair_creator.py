from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        page.goto(f"file://{os.getcwd()}/gotrange.html")

        # Wait for game to initialize (canvas element presence)
        page.wait_for_selector("#gameCanvas")

        # Wait a bit for potential rendering
        page.wait_for_timeout(2000)

        # Open Shop
        page.keyboard.press("s")
        page.wait_for_timeout(1000)

        # Open Hair Creator (Assume button exists or global function)
        # We can execute JS to trigger it directly to be safe
        page.evaluate("window.openHairCreator()")
        page.wait_for_timeout(1000)

        # Draw something in hair creator
        # Click on canvas center
        canvas = page.locator("#hairEditorCanvas")
        box = canvas.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.mouse.down()
            page.mouse.move(box["x"] + box["width"] / 2 + 50, box["y"] + box["height"] / 2 + 50)
            page.mouse.up()

        page.wait_for_timeout(500)

        # Take Screenshot of the Hair Creator UI
        page.screenshot(path="verification/hair_creator_test.png")

        print("Screenshot saved to verification/hair_creator_test.png")

        browser.close()

if __name__ == "__main__":
    run()
