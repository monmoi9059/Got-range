from playwright.sync_api import sync_playwright
import time
import os

def verify_hair_creator(page):
    cwd = os.getcwd()
    file_url = f"file://{cwd}/gotrange.html"
    print(f"Navigating to {file_url}")

    page.goto(file_url)

    # Handle Startup
    try:
        if page.is_visible("#startup-ui"):
            page.click("button:has-text('ORDI')")
    except:
        pass

    page.wait_for_selector("#scorebug-container", state="visible")

    # Open Menu -> Shop -> Style
    menu_btn = page.locator(".controls-menu-toggle")
    if menu_btn.is_visible():
        menu_btn.click()
        time.sleep(0.5)

    page.click("text=BOUTIQUE")
    page.wait_for_selector("#shopUI", state="visible")

    # Click Style Tab
    page.click("text=STYLE")
    time.sleep(0.5)

    # Click Create Hair
    # Check if button exists and is visible
    create_btn = page.locator("#btnCreateHair")
    if create_btn.is_visible():
        print("Create Hair button found.")
        create_btn.click()

        # Wait for Hair Creator UI
        try:
            page.wait_for_selector("#hairCreatorUI", state="visible", timeout=3000)
            print("Hair Creator UI opened successfully.")
            page.screenshot(path="verification/hair_creator.png")
        except:
            print("Failed to open Hair Creator UI.")
            page.screenshot(path="verification/hair_creator_fail.png")
            raise Exception("Hair Creator UI did not appear")
    else:
        print("Create Hair button not visible.")
        page.screenshot(path="verification/shop_style_fail.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1066, "height": 600})
        try:
            verify_hair_creator(page)
        except Exception as e:
            print(f"Failed: {e}")
        finally:
            browser.close()
