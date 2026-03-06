
import os
import json
import time
import subprocess
import socket
from playwright.sync_api import sync_playwright

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def test_get_bounds_in_browser():
    port = find_free_port()
    # Start a simple server
    server_process = subprocess.Popen(["python3", "-m", "http.server", str(port)])
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # BLOCK GOOGLE FONTS to prevent hangs in sandbox
            page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
            page.route("**/fonts.gstatic.com/**", lambda route: route.abort())

            url = f"http://localhost:{port}/gotrange.html"
            print(f"Loading {url}")

            try:
                # Use wait_until="commit" so we don't wait for fonts/images
                page.goto(url, wait_until="commit", timeout=15000)
                print("Page committed")
            except Exception as e:
                print(f"Note: goto had issues: {e}")

            # Polling for RenderEngine.getBounds
            found = False
            for i in range(20):
                if page.evaluate("typeof RenderEngine !== 'undefined' && typeof RenderEngine.getBounds === 'function'"):
                    found = True
                    break
                print(f"Waiting for RenderEngine... ({i})")
                time.sleep(1)

            if not found:
                print("Error: RenderEngine.getBounds not found")
                browser.close()
                return False

            print("RenderEngine.getBounds found!")

            # Test cases
            test_cases = [
                {
                    "name": "Multiple Points (Positive)",
                    "points": [{"x": 0, "y": 0}, {"x": 10, "y": 10}, {"x": 5, "y": 5}],
                    "expected": {"minX": 0, "minY": 0, "maxX": 10, "maxY": 10}
                }
            ]

            failed = False
            for case in test_cases:
                points_json = json.dumps(case['points'])
                result = page.evaluate(f"RenderEngine.getBounds({points_json})")
                if result != case['expected']:
                    print(f"FAIL: {case['name']}. Expected {case['expected']}, got {result}")
                    failed = True
                else:
                    print(f"PASS: {case['name']}")

            # Take a screenshot using relative path
            screenshot_dir = os.path.join(os.path.dirname(__file__), "screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)
            screenshot_path = os.path.join(screenshot_dir, "get_bounds_verified.png")
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            browser.close()
            return not failed
    finally:
        server_process.terminate()

if __name__ == "__main__":
    success = test_get_bounds_in_browser()
    if not success:
        exit(1)
    print("All browser-based tests passed!")
