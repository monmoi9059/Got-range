from playwright.sync_api import sync_playwright
import os

def test_shop(page):
    # Navigate
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/gotrange.html")

    # Wait for startup
    page.wait_for_timeout(1000)

    # Choose Platform
    page.evaluate("window.choosePlatform('mobile')")
    page.wait_for_timeout(500)

    # Open Shop
    page.evaluate("window.openShop()")
    page.wait_for_timeout(500)

    # Switch to Skins
    page.evaluate("window.switchShopTab('skins')")
    page.wait_for_timeout(500)

    # Switch to CAT (Index 2)
    # ANIMALS = ['human', 'rat', 'cat'...]
    page.evaluate("window.viewingAnimalIndex = 2; window.updateShopUI();")
    page.wait_for_timeout(500)

    # Switch to new skin (e.g. Yoga)
    page.evaluate("window.viewingSkinIndex = 2; window.viewingVariantIndex = 0; window.updateShopUI();")
    page.wait_for_timeout(500)

    page.screenshot(path="verification/shop_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_shop(page)
        finally:
            browser.close()
