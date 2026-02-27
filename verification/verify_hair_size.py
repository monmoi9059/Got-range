from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_creator_size(page):
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

    # Verify Canvas Size
    print("Verifying Canvas Size...")
    canvas = page.locator("#hairEditorCanvas")
    width = canvas.get_attribute("width")
    height = canvas.get_attribute("height")

    print(f"Canvas Dimensions: {width}x{height}")

    if width == "500" and height == "500":
        print("PASS: Canvas size is 500x500.")
    else:
        print(f"FAIL: Canvas size is {width}x{height}, expected 500x500.")

    # Verify Zoom Out Limit
    print("Testing Minimum Zoom...")
    zoom_out = page.get_by_text("ZOOM -")
    zoom_out.click()
    zoom_out.click()
    zoom_out.click()
    zoom_out.click()
    zoom_out.click()
    zoom_out.click() # Ensure we hit min
    page.wait_for_timeout(500)

    zoom_text = page.locator("#hairZoomDisplay").inner_text()
    print(f"Min Zoom Display: {zoom_text}")

    if "50%" in zoom_text:
        print("PASS: Zoom reached 50%.")
    else:
        print(f"FAIL: Zoom did not reach 50% (got {zoom_text}).")

    # Screenshot
    page.screenshot(path="verification/hair_creator_large.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to desktop
        page.set_viewport_size({"width": 1280, "height": 720})

        try:
            verify_hair_creator_size(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
