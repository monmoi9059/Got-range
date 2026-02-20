from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # 0. Handle Startup
        print("Waiting for startup UI...")
        try:
            page.wait_for_selector("#startup-ui", state="visible", timeout=5000)
            print("Startup UI found. Clicking Desktop...")
            page.click("text=ORDI 💻")
            # Wait for controls to appear
            page.wait_for_selector("#controls", state="visible", timeout=5000)
            print("Controls visible.")
        except Exception as e:
            print(f"Startup UI skipped or error: {e}")

        # Open Menu
        print("Opening Menu...")
        page.click("text=MENU ☰")
        page.wait_for_selector("#controls-items", state="visible") # Wait for expansion

        # 1. Check Reset Button in Stats
        print("Opening Stats...")
        page.click("text=STATS [S]")
        page.wait_for_selector("#statsUI", state="visible")
        page.screenshot(path="verification/stats_ui.png")
        # Verify button exists
        reset_btn = page.query_selector("#btnResetCatSize")
        if reset_btn:
            print("Reset Cat Size button found.")
        else:
            print("Reset Cat Size button NOT found.")

        page.click("#statsUI .modal-close-btn") # Close stats
        page.wait_for_selector("#statsUI", state="hidden")

        # Re-open Menu (closing modal might close menu depending on logic)
        # closeAllMenus calls closeControlsMenu(), so yes.
        print("Re-opening Menu...")
        page.click("text=MENU ☰")
        page.wait_for_selector("#controls-items", state="visible")

        # 2. Check Shop UI
        print("Opening Shop...")
        page.click("text=BOUTIQUE [P]")
        page.wait_for_selector("#shopUI", state="visible")
        print("Switching to Equipment...")
        page.click("text=MATOS") # Switch to Equipment tab

        # Wait for tab transition
        page.wait_for_timeout(500)
        page.screenshot(path="verification/shop_ui.png")

        # Verify Cat Accessories Section
        acc_header = page.query_selector("text=ACCESSOIRES CHAT")
        if acc_header:
            print("Cat Accessories header found.")
        else:
            print("Cat Accessories header NOT found.")

        # 3. Check Cat Render (Legs)
        # Close shop
        page.click("#shopUI .modal-close-btn")
        page.wait_for_selector("#shopUI", state="hidden")

        # Wait a bit for render loop to settle
        print("Waiting for render...")
        page.wait_for_timeout(2000)

        # Take screenshot of the game canvas
        page.screenshot(path="verification/game_render.png")

        browser.close()

if __name__ == "__main__":
    run()
