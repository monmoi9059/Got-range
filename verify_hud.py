import os
from playwright.sync_api import sync_playwright

def verify_hud(page):
    # Load the page
    page.goto(f"file://{os.getcwd()}/gotrange.html")

    # Click 'ORDI' to start
    page.click("button:has-text('ORDI')")

    # Wait for game to initialize (IDLE state)
    page.wait_for_timeout(1000)

    # By default it's CLASSIC mode.
    # Take a screenshot of Classic for reference
    page.screenshot(path="verification_classic.png")

    # Click MODE button to switch to CONTEST
    # The button text is "MODE: CLASSIQUE" inside a span inside .broadcast-btn
    page.click("text=MODE: CLASSIQUE")

    # Wait for transition/render
    page.wait_for_timeout(1000)

    # Take screenshot of Contest HUD
    page.screenshot(path="verification_contest.png")

    # Click MODE button to switch to TIME ATTACK
    page.click("text=MODE: CONCOURS")

    # Wait for transition/render
    page.wait_for_timeout(1000)

    # Take screenshot of Time Attack HUD
    page.screenshot(path="verification_time_attack.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})
        try:
            verify_hud(page)
        finally:
            browser.close()
