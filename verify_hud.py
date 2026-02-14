import os
from playwright.sync_api import sync_playwright

def verify_hud(page):
    # Capture console messages
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

    # Load the page
    page.goto(f"file://{os.getcwd()}/gotrange.html")

    # Click 'ORDI' to start
    if page.is_visible("button:has-text('ORDI')"):
        page.click("button:has-text('ORDI')")

    # Wait for game to initialize (IDLE state)
    page.wait_for_timeout(1000)

    # Open Menu if hidden
    if page.is_visible(".controls-menu-toggle"):
        page.click(".controls-menu-toggle")
        page.wait_for_timeout(500)

    # By default it's CLASSIC mode.
    # Take a screenshot of Classic for reference
    page.screenshot(path="verification_classic.png")

    # Click MODE button to switch to CONTEST
    # The button text is "MODE: CLASSIQUE" inside a span inside .broadcast-btn
    if page.is_visible("text=MODE: CLASSIQUE"):
        page.click("text=MODE: CLASSIQUE")
    else:
        print("ERROR: Mode button not visible (Classic)")
        return

    # Wait for transition/render
    page.wait_for_timeout(1000)

    # Take screenshot of Contest HUD
    page.screenshot(path="verification_contest.png")

    # Re-open menu because toggleMode closes it
    if page.is_visible(".controls-menu-toggle"):
        page.click(".controls-menu-toggle")
        page.wait_for_timeout(500)

    # Click MODE button to switch to TIME ATTACK
    if page.is_visible("text=MODE: CONCOURS"):
        page.click("text=MODE: CONCOURS")
    else:
        print("ERROR: Mode button not visible (Contest)")
        return

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
