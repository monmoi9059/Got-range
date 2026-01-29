from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the file directly
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")

        # Wait for game to init (canvas)
        page.wait_for_selector("#gameCanvas")

        # Force set the skin to Mario and ensure we are in a state where we can see him
        # We'll set state to IDLE and currentSkin to 'fake_mario'
        # Also need to make sure we are not in STARTUP
        page.evaluate('''() => {
            state = 'IDLE';
            document.getElementById('startup-ui').style.display = 'none';
            document.getElementById('scorebug-container').style.display = 'flex';
            document.getElementById('controls').style.display = 'flex';

            playerData.currentSkin = 'fake_mario';
            playerData.mobileControls = false;
            player3D.x = 433; player3D.y = 300; player3D.z = 0;

            // Force a draw immediately
            draw();
        }''')

        # Wait a bit for potential RAF
        page.wait_for_timeout(1000)

        # Take screenshot of the canvas area where player is standing
        page.screenshot(path="verification/mario_check.png")

        # Now switch to Luigi
        page.evaluate('''() => {
            playerData.currentSkin = 'fake_luigi';
            draw();
        }''')
        page.wait_for_timeout(500)
        page.screenshot(path="verification/luigi_check.png")

        browser.close()

if __name__ == "__main__":
    run()
