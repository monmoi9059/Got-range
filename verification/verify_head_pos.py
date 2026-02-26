from playwright.sync_api import sync_playwright
import os

def verify_human_head_position():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        file_path = f"file://{os.path.abspath('gotrange.html')}"
        page.goto(file_path)

        # Wait for the game to load (canvas element)
        page.wait_for_selector("#gameCanvas")

        # Inject script to set up a human character and render a frame
        # We need to ensure we are in a state where the player is drawn
        page.evaluate("""
            () => {
                // Ensure game is initialized or at least variables are accessible
                // Force a human character skin
                if (typeof playerData !== 'undefined') {
                    playerData.currentSkin = 'human_default'; // Assuming a default human skin exists
                    // Or just ensure currentAnimal is human by modifying the render logic variable if exposed,
                    // but better to set state that leads to it.
                    // Let's try to set the global skin variable if possible.

                    // Trigger a redraw or wait for loop.
                    // We can force a specific state to ensure player is visible.
                    window.state = 'SHOOTING';
                    window.player3D.x = 400; // Centered
                    window.player3D.y = 400;
                    window.player3D.z = 0;

                    // We need to make sure the game loop runs at least once to pick up the skin change
                    // The game loop usually runs on requestAnimationFrame.
                }
            }
        """)

        # Wait a bit for the game loop to render
        page.wait_for_timeout(1000)

        # Take a screenshot
        screenshot_path = os.path.abspath("verification/human_head_verify.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_human_head_position()
