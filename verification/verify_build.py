from playwright.sync_api import sync_playwright
import time
import os

def verify_files_load(page, filename):
    cwd = os.getcwd()
    file_url = f"file://{cwd}/{filename}"
    print(f"Navigating to {file_url}")

    page.goto(file_url)

    # Check for basic game elements
    # Note: If Startup UI is present, gameCanvas might be hidden or covered, but it exists in DOM.
    try:
        page.wait_for_selector("#scorebug-container", state="attached", timeout=5000)
        print(f"SUCCESS: {filename} loaded UI structure.")

        # Take a screenshot
        page.screenshot(path=f"verification/verify_{filename.split('.')[0]}.png")
    except Exception as e:
        print(f"FAILURE: {filename} did not load UI. {e}")
        page.screenshot(path=f"verification/fail_{filename.split('.')[0]}.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1066, "height": 600})

        print("--- Verifying dev.html (Modules) ---")
        verify_files_load(page, "dev.html")

        print("\n--- Verifying gotrange.html (Bundled) ---")
        verify_files_load(page, "gotrange.html")

        browser.close()
