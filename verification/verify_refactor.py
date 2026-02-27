from playwright.sync_api import sync_playwright
import time
import os

def verify_game_loads(page):
    cwd = os.getcwd()
    file_url = f"file://{cwd}/gotrange.html"
    print(f"Navigating to {file_url}")

    page.goto(file_url)

    # Handle Startup
    try:
        if page.is_visible("#startup-ui"):
            print("Clicking ORDI...")
            page.click("button:has-text('ORDI')")
    except:
        pass

    page.wait_for_selector("#scorebug-container", state="visible")

    # Open Menu
    menu_btn = page.locator(".controls-menu-toggle")
    if menu_btn.is_visible():
        print("Opening Menu...")
        menu_btn.click()
        time.sleep(0.5)

    # Click Shop
    shop_btn = page.locator("#controls-items .broadcast-btn", has_text="BOUTIQUE")
    if shop_btn.is_visible():
        print("Opening Shop...")
        shop_btn.click()
        page.wait_for_selector("#shopUI", state="visible")
        time.sleep(1)
        page.screenshot(path="verification/game_shop.png")
        print("Shop screenshot saved.")
    else:
        print("Shop button not visible even after menu toggle.")
        page.screenshot(path="verification/debug_menu.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1066, "height": 600})
        try:
            verify_game_loads(page)
        except Exception as e:
            print(f"Failed: {e}")
        finally:
            browser.close()
