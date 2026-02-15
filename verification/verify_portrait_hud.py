import os
from playwright.sync_api import sync_playwright

def verify_portrait_hud():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # iPhone 13 viewport (390x844)
        page = browser.new_page(viewport={"width": 390, "height": 844})

        # Load local file
        path = os.path.abspath("gotrange.html")
        page.goto(f"file://{path}")

        # Click on "MOBILE" to start game
        try:
            page.wait_for_selector("#startup-ui")
            mobile_btn = page.get_by_role("button", name="MOBILE")
            if mobile_btn.count() > 0:
                mobile_btn.click()
            else:
                page.locator(".startup-btn", has_text="MOBILE").click()
        except:
            print("Startup UI skipped or failed")

        # Wait for game to load/render
        page.wait_for_timeout(2000)

        # FORCE HIDE ALL MODALS AND RESET STATE
        page.evaluate("""
            const modals = document.querySelectorAll('.modal');
            modals.forEach(m => m.style.display = 'none');
            window.state = 'IDLE';
        """)
        page.wait_for_timeout(500)

        # Open Leaderboard
        page.locator(".controls-menu-toggle").click()
        page.wait_for_timeout(500)

        # Click Leaderboard button more specifically
        page.locator("#controls-items .broadcast-btn", has_text="CLASSEMENT").click()
        page.wait_for_timeout(1000)

        # Take screenshot of Leaderboard
        os.makedirs("verification", exist_ok=True)
        screenshot_path = "verification/portrait_leaderboard.png"
        page.screenshot(path=screenshot_path)
        print("Leaderboard screenshot saved")

        browser.close()

if __name__ == "__main__":
    verify_portrait_hud()
