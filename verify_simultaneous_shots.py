from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1066, "height": 600})

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        print("Navigating...")
        page.goto("http://localhost:8000/gotrange.html")

        try:
            page.locator("text=ORDI 💻").click(timeout=2000)
            print("Clicked ORDI.")
        except:
            print("ORDI button not found.")

        time.sleep(1)

        # Enable Splitscreen
        print("Enabling Splitscreen...")
        page.evaluate("window.toggleSplitscreen()")
        time.sleep(0.5)

        # Test Simultaneous Input
        print("--- P1 Press Space (Hold) ---")
        page.keyboard.down("Space")
        time.sleep(0.1)

        s1 = page.evaluate("window.game1.state")
        print(f"P1 State: {s1}")

        print("--- P2 Press Enter (Hold) while P1 is holding ---")
        page.keyboard.down("Enter")
        time.sleep(0.1)

        s2 = page.evaluate("window.game2.state")
        print(f"P2 State: {s2}")

        if s2 == "IDLE":
            print("FAILURE: P2 failed to jump while P1 was holding.")
        else:
            print("SUCCESS: P2 jumped.")

        print("--- Releasing Keys ---")
        page.keyboard.up("Space")
        page.keyboard.up("Enter")

        time.sleep(1)

        # Check active balls
        b1 = page.evaluate("window.game1.activeBalls.length")
        b2 = page.evaluate("window.game2.activeBalls.length")
        print(f"P1 Balls: {b1}, P2 Balls: {b2}")

        if b1 > 0 and b2 > 0:
             print("SUCCESS: Both players shot.")
        else:
             print("FAILURE: Shots did not register for both.")

        browser.close()

if __name__ == "__main__":
    run()
