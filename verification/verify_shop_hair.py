from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load local file
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/gotrange.html")

    # Force open shop
    page.evaluate("window.openShop(true)")
    page.wait_for_selector("#shopUI", state="visible")

    # Force set skin to LeBron (human_lebron) to verify toggle button appears
    page.evaluate("window.playerData.currentSkin = 'human_lebron'; window.viewingSkinIndex = window.SKINS_DB.findIndex(s => s.id === 'human_lebron'); window.viewingAnimalIndex = window.ANIMALS.indexOf('human'); window.updateShopUI();")

    # Wait for update
    page.wait_for_timeout(500)

    # Check for toggle button
    btn = page.locator("#btnToggleVariant")
    if btn.is_visible():
        print("Toggle button found!")
        btn.click()
        page.wait_for_timeout(500) # Wait for update
        page.screenshot(path="verification/shop_hair_toggle.png")
    else:
        print("Toggle button NOT found!")
        page.screenshot(path="verification/shop_hair_fail.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
