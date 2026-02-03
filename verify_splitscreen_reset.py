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

        # Force P2 Game Over (simulating misses)
        print("Forcing P2 Game Over...")
        page.evaluate("""
            () => {
                window.loadContext(window.game2);
                window.consecutiveMisses = 10;
                window.handleMiss(window.ball);
                window.saveContext(window.game2);
            }
        """)

        # Wait for GAMEOVER state
        print("Waiting for GAMEOVER...")
        for i in range(50):
            s = page.evaluate("window.game2.state")
            if s == "GAMEOVER":
                print(f"P2 Reached GAMEOVER at tick {i}")
                break
            time.sleep(0.1)

        # Check if nextAction is set
        na = page.evaluate("!!window.game2.nextAction")
        print(f"NextAction present? {na}")

        # Wait a bit to simulate user reaction time (and potentially let resetTimer expire)
        print("Waiting 2 seconds...")
        time.sleep(2)

        # Now try to reset via Enter
        print("Pressing Enter to reset...")
        page.keyboard.press("Enter")
        time.sleep(0.1)
        page.keyboard.up("Enter")

        # Check state
        time.sleep(0.5)
        state = page.evaluate("window.game2.state")
        print(f"P2 State after reset: {state}")

        if state == "IDLE":
            print("SUCCESS: P2 Reset to IDLE.")
        else:
            print("FAILURE: P2 Stuck in", state)

        # Test P1 Game Over and Mouse Click Reset
        print("Forcing P1 Game Over...")
        page.evaluate("""
            () => {
                window.loadContext(window.game1);
                window.consecutiveMisses = 10;
                window.handleMiss(window.ball);
                window.saveContext(window.game1);
            }
        """)
        time.sleep(0.5)

        print("Clicking Mouse to reset P1...")
        # Click center of P1 screen
        page.mouse.click(266, 300)
        time.sleep(0.5)

        state_p1 = page.evaluate("window.game1.state")
        print(f"P1 State after click: {state_p1}")

        if state_p1 == "IDLE":
             print("SUCCESS: P1 Reset to IDLE.")
        else:
             print("FAILURE: P1 Stuck in", state_p1)

        browser.close()

if __name__ == "__main__":
    run()
