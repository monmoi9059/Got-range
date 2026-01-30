from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1066, "height": 600})

        filepath = os.path.abspath("gotrange.html")
        page.goto(f"file://{filepath}")

        page.click("text=ORDI 💻")
        page.wait_for_selector("#controls")
        page.click("text=BOUTIQUE [P]")
        page.wait_for_selector("#shopUI", state="visible")

        # Take a screenshot of the Shop to verify "BALLONS" section and general layout
        page.screenshot(path="verification/shop_balls_new.png")

        # Scroll down to see new content? The modal might overflow.
        # Let's scroll the modal container
        page.eval_on_selector("#shopUI", "el => el.scrollTop = el.scrollHeight")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/shop_balls_scrolled_new.png")

        browser.close()

if __name__ == "__main__":
    run()
