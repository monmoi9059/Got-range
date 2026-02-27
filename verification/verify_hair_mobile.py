from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_ui_and_mobile_hide(page):
    print("Navigating to dev.html...")
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/dev.html")

    # Wait for game to initialize
    print("Waiting for game load...")
    page.wait_for_timeout(2000)

    # Bypass Startup Screen - Select Mobile to enable touch controls
    print("Clicking 'MOBILE 📱' to enable touch controls...")
    try:
        page.get_by_text("MOBILE 📱").click()
    except:
        print("Startup screen might not be present or already passed.")
    page.wait_for_timeout(1000)

    # Verify Shoot Button is visible (since we selected Mobile)
    print("Verifying Shoot Button is visible initially...")
    shoot_btn = page.locator("#mobileShootBtn")
    if shoot_btn.is_visible():
        print("PASS: Shoot button visible in game.")
    else:
        print("FAIL: Shoot button NOT visible in game (should be for mobile).")

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

    # Verify Zoom Buttons Exist
    zoom_in = page.get_by_text("ZOOM +")
    zoom_out = page.get_by_text("ZOOM -")

    if zoom_in.count() > 0 and zoom_out.count() > 0:
        print("PASS: Zoom buttons found.")
    else:
        print("FAIL: Zoom buttons not found!")

    # Verify Shoot Button is HIDDEN
    print("Verifying Shoot Button is HIDDEN in Hair Creator...")
    if not shoot_btn.is_visible():
        print("PASS: Shoot button hidden in Hair Creator.")
    else:
        print("FAIL: Shoot button STILL VISIBLE in Hair Creator!")

    # Take screenshot of Hair Creator
    page.screenshot(path="verification/hair_creator_mobile_hidden.png")

    # Close Hair Creator
    print("Closing Hair Creator...")
    page.evaluate("window.closeHairCreator()")
    page.wait_for_timeout(1000)

    # Close Shop
    print("Closing Shop...")
    page.evaluate("window.closeShop()")
    page.wait_for_timeout(1000)

    # Verify Shoot Button is RESTORED
    print("Verifying Shoot Button is RESTORED after closing...")
    if shoot_btn.is_visible():
        print("PASS: Shoot button restored.")
    else:
        print("FAIL: Shoot button NOT restored!")

    # Zoom functionality test (Optional, but good to re-verify)
    # ... (Already tested in previous script, skipping for brevity unless needed)


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to mobile-ish
        page.set_viewport_size({"width": 375, "height": 667})

        try:
            verify_hair_ui_and_mobile_hide(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
