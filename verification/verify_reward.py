import os
from playwright.sync_api import sync_playwright

def verify_cat_reward():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/gotrange.html")
        page.get_by_text("ORDI 💻").click()
        page.wait_for_timeout(1000)

        # Setup Test State
        result = page.evaluate("""() => {
            // Stub checkDailyProgress
            window.__lastChallengeUpdate = null;
            window.checkDailyProgress = function(type, amount) {
                window.__lastChallengeUpdate = {
                    type,
                    amount,
                    tacos: (typeof game1 !== 'undefined' ? game1.playerData.tacos : playerData.tacos),
                    time: Date.now()
                };
            };

            // Reset Data
            if (typeof game1 !== 'undefined') {
                game1.playerData.tacos = 0;
                game1.playerData.stats.income = 1;
                game1.playerData.difficulty = 1.0;

                // FORCE SYNC TACOS
                // Clear existing
                game1.tacosOnGround = [];
                // Add new
                game1.tacosOnGround.push({
                    x: 700, y: 200, rotation: 0, scale: 1, beingEaten: true
                });

                // Update Cat
                if (!game1.catState) game1.catState = g_catState;
                game1.catState.x = 700;
                game1.catState.y = 200;
                game1.catState.state = 'EATING';
                game1.catState.eatTimer = 10;
                game1.catState.targetTacoIndex = 0; // Index 0
            }

            // Sync Global just in case (though loadContext overwrites it)
            playerData.tacos = 0;
            g_catState.x = 700;
            g_catState.y = 200;

            return { msg: "Setup Complete" };
        }""")

        print(f"Setup: {result}")

        # Wait for update loop
        page.wait_for_timeout(1000)

        # Check Result
        verification = page.evaluate("""() => {
            const textParticle = particles.find(p => p.type === 'text');
            return {
                tacos: (typeof game1 !== 'undefined' ? game1.playerData.tacos : playerData.tacos),
                hasTextParticle: !!textParticle,
                particleText: textParticle ? textParticle.text : null,
                lastUpdate: window.__lastChallengeUpdate
            };
        }""")

        print(f"Verification: {verification}")

        if verification['tacos'] == 10 and verification['hasTextParticle']:
            print("SUCCESS: Reward given correctly.")
        else:
            print("FAILURE: Conditions not met.")

        page.screenshot(path="verification/cat_reward_debug_3.png")
        browser.close()

if __name__ == "__main__":
    verify_cat_reward()
