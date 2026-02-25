from playwright.sync_api import sync_playwright
import os

def test_render(page):
    # Get absolute path to the HTML file
    cwd = os.getcwd()
    filepath = f"file://{cwd}/gotrange.html"

    print(f"Navigating to: {filepath}")
    page.goto(filepath)

    # Wait for canvas
    page.wait_for_selector("canvas")

    # Wait a bit for the render loop to draw something
    page.wait_for_timeout(2000)

    # Take screenshot
    output_path = "verification/render_verify.png"
    page.screenshot(path=output_path)
    print(f"Screenshot saved to {output_path}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_render(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
