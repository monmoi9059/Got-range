from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_zoom(page):
    print("Navigating to dev.html...")
    # Get absolute path to dev.html
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
    # Trigger openShop via JS since button might be hidden/overlayed
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

    # Verify Zoom Buttons Exist
    zoom_in = page.get_by_text("ZOOM +")
    zoom_out = page.get_by_text("ZOOM -")

    if zoom_in.count() > 0 and zoom_out.count() > 0:
        print("Zoom buttons found.")
    else:
        print("ERROR: Zoom buttons not found!")
        return

    # Take initial screenshot
    page.screenshot(path="verification/hair_zoom_initial.png")

    # Click Zoom In 3 times
    print("Zooming in...")
    zoom_in.click()
    page.wait_for_timeout(200)
    zoom_in.click()
    page.wait_for_timeout(200)
    zoom_in.click()
    page.wait_for_timeout(500)

    # Take zoomed screenshot
    page.screenshot(path="verification/hair_zoom_in.png")

    # Verify Zoom Display text
    zoom_text = page.locator("#hairZoomDisplay").inner_text()
    print(f"Zoom Display: {zoom_text}")

    # Zoom out
    print("Zooming out...")
    zoom_out.click()
    zoom_out.click()
    zoom_out.click()
    zoom_out.click() # One extra to go below 100%? (min is 1.0)
    page.wait_for_timeout(500)

    page.screenshot(path="verification/hair_zoom_out.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to standard desktop
        page.set_viewport_size({"width": 1280, "height": 720})

        try:
            verify_hair_zoom(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
