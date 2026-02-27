from playwright.sync_api import sync_playwright

def verify_hair_creator():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Loading page...")
        page.goto("file:///app/gotrange.html")

        # Wait for game to load
        page.wait_for_selector("#gameCanvas", timeout=10000)

        print("Selecting PC platform...")
        page.click("button:has-text('ORDI')")

        print("Opening Shop...")
        # Menu toggle
        page.click(".controls-menu-toggle")
        # Shop button
        page.click("div[role='button']:has-text('BOUTIQUE')")

        print("Switching to Style Tab...")
        page.click("button:has-text('STYLE')")

        print("Opening Hair Creator...")
        page.click("button:has-text('CRÉER COIFFURE')")

        print("Taking screenshot of Hair Creator...")
        page.screenshot(path="verification/hair_creator.png")

        print("Success!")
        browser.close()

if __name__ == "__main__":
    verify_hair_creator()
