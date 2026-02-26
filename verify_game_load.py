from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8080/gotrange.html")
        time.sleep(2) # Wait for load
        page.screenshot(path="verification_screenshot.png")
        print("Screenshot taken")
        browser.close()

if __name__ == "__main__":
    run()
