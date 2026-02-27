from playwright.sync_api import sync_playwright
import os

def debug_startup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"ERROR: {err}"))

        url = f"file://{os.getcwd()}/gotrange.html"
        print(f"Loading {url}...")

        try:
            page.goto(url)
            # Wait a bit to catch initialization errors
            page.wait_for_timeout(2000)

            # Check if canvas exists
            canvas = page.query_selector("#gameCanvas")
            if canvas:
                print("SUCCESS: Canvas element found.")
            else:
                print("FAILURE: Canvas element not found.")

        except Exception as e:
            print(f"EXCEPTION during load: {e}")

        browser.close()

if __name__ == "__main__":
    debug_startup()
