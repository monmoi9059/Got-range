from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1066, 'height': 600})
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            page.goto(f"file://{os.getcwd()}/gotrange.html")

            # Check if choosePlatform exists
            exists = page.evaluate("typeof choosePlatform !== 'undefined'")
            print(f"choosePlatform exists: {exists}")

            if exists:
                page.evaluate("choosePlatform('desktop')")
                page.wait_for_timeout(1000)
                page.evaluate("toggleSplitscreen()")
                page.wait_for_timeout(1000)
                page.screenshot(path="verification/splitscreen.png")
            else:
                 print("Script failed to load.")
                 page.screenshot(path="verification/error.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
