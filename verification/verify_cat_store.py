from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the game
        path = os.path.abspath("gotrange.html")
        page.goto(f"file://{path}")

        # Click "ORDI" to choose platform
        page.get_by_role("button", name="ORDI 💻").click()

        # Click "MENU"
        page.locator(".controls-menu-toggle").click()

        # Click "BOUTIQUE"
        page.get_by_role("button", name="BOUTIQUE").click()

        # Click "MATOS" tab (Equipment)
        page.get_by_role("button", name="MATOS").click()

        # Verify "CHAT DU PANIER" is visible
        # It's an h3 element
        cat_header = page.get_by_role("heading", name="CHAT DU PANIER")
        if cat_header.is_visible():
            print("SUCCESS: 'CHAT DU PANIER' header found.")
        else:
            print("FAILURE: 'CHAT DU PANIER' header not found.")

        # Take screenshot
        page.screenshot(path="verification/cat_store.png")
        print("Screenshot saved to verification/cat_store.png")

        browser.close()

if __name__ == "__main__":
    run()
