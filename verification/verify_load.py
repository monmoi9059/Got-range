from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console errors
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Load file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Wait for canvas
        try:
            page.wait_for_selector("#gameCanvas", timeout=5000)
            print("Canvas found.")
            # Take screenshot
            page.screenshot(path="verification/load_screen.png")
            print("Screenshot taken.")
        except Exception as e:
            print(f"Error waiting for canvas: {e}")

        browser.close()

if __name__ == "__main__":
    run()
