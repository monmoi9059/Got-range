from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        # Load the page
        page.goto("http://localhost:8000/gotrange.html")
        page.wait_for_selector("#gameCanvas")
        time.sleep(1) # Wait for init

        # Bypass Startup
        print("Bypassing startup...")
        page.evaluate("""
            window.playerData.platformChosen = true;
            window.startGame();
        """)
        time.sleep(1)

        # Open Stats Menu
        print("Opening Stats...")
        page.evaluate("window.openStats()")
        time.sleep(1)

        # Check reset stage initial
        reset_stage = page.evaluate("resetStage")
        print(f"Initial resetStage: {reset_stage}")

        # Check if button is visible
        is_visible = page.is_visible("#btnReset")
        print(f"Button visible: {is_visible}")

        # Click Reset Button (First Click)
        print("Clicking reset button 1st time...")
        page.click("#btnReset")
        time.sleep(0.5)

        # Check reset stage
        reset_stage = page.evaluate("resetStage")
        print(f"resetStage after 1st click: {reset_stage}")

        btn_text = page.evaluate("document.getElementById('btnReset').innerText")
        print(f"Button text: {btn_text}")

        if reset_stage != 1:
            print("FAIL: resetStage did not update to 1")
        else:
            print("SUCCESS: resetStage updated to 1")

        # Click Reset Button (Second Click)
        print("Clicking reset button 2nd time...")
        # Hook into reload
        page.evaluate("window.location.reload = function() { console.log('RELOAD_CALLED'); }")

        page.click("#btnReset")
        time.sleep(1)

        # Check logic execution (Check logs for RELOAD_CALLED)
        # Also check if playerData was reset (e.g. tacos = 0)
        tacos = page.evaluate("window.playerData.tacos")
        print(f"Tacos after reset attempt: {tacos}")

        # resetStage might be 0 now
        reset_stage = page.evaluate("resetStage")
        print(f"resetStage after 2nd click: {reset_stage}")

        browser.close()

if __name__ == "__main__":
    run()
