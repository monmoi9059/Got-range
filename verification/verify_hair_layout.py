from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_creator_layout(page):
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

    # Verify Modal Styles
    print("Verifying Modal Styles...")
    modal = page.locator("#hairCreatorUI")

    # Check width/height logic via JS evaluation since get_attribute('style') is a string
    style = modal.evaluate("el => el.style.cssText")
    print(f"Modal Style: {style}")

    if "width: 700px" in style and "height: 800px" in style and "overflow: auto" in style:
        print("PASS: Modal dimensions and overflow are correct.")
    else:
        print("FAIL: Modal styles do not match expected fixed dimensions.")

    # Screenshot
    page.screenshot(path="verification/hair_creator_layout.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport small to force scroll
        page.set_viewport_size({"width": 800, "height": 600})

        try:
            verify_hair_creator_layout(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
