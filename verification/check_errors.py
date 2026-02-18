from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Monitor console errors
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(str(exc)))

        # Load the HTML file directly (adjust path as needed)
        page.goto("file:///app/gotrange.html")

        # Wait for game loop to start (simulated by checking canvas or a global variable)
        try:
            page.wait_for_function("window.game1 && window.game1.state", timeout=5000)
            print("Game initialized successfully.")
        except Exception as e:
            print("Game initialization failed or timed out.")

        if errors:
            print("Errors detected:")
            for err in errors:
                print(f"- {err}")
        else:
            print("No console errors detected.")

        browser.close()

if __name__ == "__main__":
    run()
