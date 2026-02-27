from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_creator_height(page):
    print("Navigating to dev.html...")
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/dev.html")

    # Wait for game to initialize
    print("Waiting for game load...")
    page.wait_for_timeout(2000)

    # Bypass Startup Screen
    print("Clicking 'ORDI'...")
    try:
        page.get_by_text("ORDI 💻").click()
    except:
        print("Startup screen might not be present or already passed.")
    page.wait_for_timeout(1000)

    # Open Shop
    print("Opening Shop...")
    page.evaluate("window.openShop()")
    page.wait_for_timeout(1000)

    # Switch to Style tab
    print("Switching to Style Tab...")
    page.evaluate("switchShopTab('style')")
    page.wait_for_timeout(500)

    # Open Hair Creator
    print("Opening Hair Creator...")
    page.evaluate("window.openHairCreator()")
    page.wait_for_timeout(1000)

    # Verify Canvas Container Height & Flex Shrink
    print("Verifying Canvas Container Styles...")
    # The canvas is inside a div with relative position. We need to find that parent div.
    # The canvas ID is hairEditorCanvas.
    canvas_container = page.locator("#hairEditorCanvas").locator("..")

    # Evaluate styles
    styles = canvas_container.evaluate("""el => {
        const computed = window.getComputedStyle(el);
        return {
            height: computed.height,
            width: computed.width,
            flexShrink: computed.flexShrink
        };
    }""")

    print(f"Container Styles: {styles}")

    if styles['height'] == '500px' and styles['width'] == '500px':
        print("PASS: Canvas container dimensions are 500x500.")
    else:
        print("FAIL: Canvas container dimensions incorrect.")

    if styles['flexShrink'] == '0':
        print("PASS: flex-shrink is 0.")
    else:
        print("FAIL: flex-shrink is NOT 0.")

    # Screenshot
    page.screenshot(path="verification/hair_creator_height_fix.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to something that would cause shrinking if flex-shrink wasn't 0
        # e.g. short height
        page.set_viewport_size({"width": 1024, "height": 600})

        try:
            verify_hair_creator_height(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
