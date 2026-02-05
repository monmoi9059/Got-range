from playwright.sync_api import sync_playwright
import time
import os

def check_shoulders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Setup: Force Hulk Skin and Start Game
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        page.evaluate("""
            console.log("Initial State:", state);
            playerData.platformChosen = true;
            playerData.mobileControls = false;

            // Explicitly force state
            state = 'IDLE';
            saveContext(game1);

            // Ensure UI is ready
            startGame();

            playerData.currentSkin = 'human_hulk';
            playerData.graphics = 'HIGH';
            saveData();
            saveContext(game1);

            console.log("State after setup:", state);
            console.log("Game1 State:", game1.state);
        """)

        # Wait for render loop
        time.sleep(2)

        # Screenshot Hulk
        page.screenshot(path="verification/shoulder_hulk.png")
        print("Captured Hulk screenshot")

        # Setup: Force Standard Human (Lebron)
        page.evaluate("""
            playerData.currentSkin = 'human_lebron';
            saveData();
            saveContext(game1);
        """)

        time.sleep(1)

        # Screenshot Standard
        page.screenshot(path="verification/shoulder_standard.png")
        print("Captured Standard screenshot")

        # Setup: Force Bare Back (Kratos)
        page.evaluate("""
            playerData.currentSkin = 'fake_kratos';
            saveData();
            saveContext(game1);
        """)
        time.sleep(1)
        page.screenshot(path="verification/shoulder_kratos.png")
        print("Captured Kratos screenshot")

        browser.close()

if __name__ == "__main__":
    check_shoulders()
