from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Load Game
    page.goto("http://localhost:8080/gotrange.html")
    time.sleep(2)

    # 2. Start Game (Click to dismiss startup screen)
    # Click center of screen
    page.mouse.click(500, 300)
    time.sleep(2)

    # 3. Check for SHOP button
    if page.locator("#btnShop").is_visible():
        print("Shop button visible, clicking...")
        page.click('#btnShop')
    else:
        print("Shop button NOT visible. Trying to force state...")
        # Force state via JS if needed, but clicking should work.
        # Maybe need another click?
        page.mouse.click(500, 300)
        time.sleep(1)
        if page.locator("#btnShop").is_visible():
             page.click('#btnShop')
        else:
             print("Still no shop button.")
             page.screenshot(path="debug_startup.png")
             return

    time.sleep(1)

    # 3. Switch to Equipment (MATOS)
    page.get_by_text("MATOS").click()
    time.sleep(1)

    # 4. Verify controls exist
    if page.locator("#selCatStance").is_visible():
        print("Stance selector found!")
    else:
        print("Stance selector NOT found!")

    if page.locator("#chkCatSizeLock").is_visible():
        print("Size lock checkbox found!")
    else:
        print("Size lock checkbox NOT found!")

    # 5. Take screenshot
    page.screenshot(path="verification_shop.png")
    print("Screenshot saved to verification_shop.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
