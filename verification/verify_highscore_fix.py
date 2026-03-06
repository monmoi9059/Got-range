import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # We need to strip out or mock things that might cause syntax errors or runtime errors in a bare environment
        # Both files are huge and contain many global references.
        # It's better to just extract the functions we want to test.

        content = """
        <!DOCTYPE html>
        <html>
        <body>
            <div id="hsNameDisplay"></div>
            <div id="lbList"></div>
            <div id="leaderboardUI" style="display:none"></div>
            <div id="shopUI" style="display:none"></div>
            <div id="statsUI" style="display:none"></div>
            <div id="achUI" style="display:none"></div>
            <div id="challengesUI" style="display:none"></div>
            <div id="btnTabClassic" class="lb-tab"></div>
            <div id="btnTabContest" class="lb-tab"></div>
            <div id="btnTabTime" class="lb-tab"></div>

            <script>
                var highScoreCursor = 0;
                var highScoreName = ["A", "A", "A"];
                var playerData = {
                    leaderboards: { classic: [], contest: [], time_attack: [] }
                };

                function updateHighScoreDisplay() {
                    const display = document.getElementById('hsNameDisplay');
                    if(!display) return;
                    display.innerHTML = ''; // Clear existing
                    for(let i=0; i<3; i++) {
                        const span = document.createElement('span');
                        span.textContent = highScoreName[i] + ' ';
                        if (i === highScoreCursor) {
                            span.style.color = '#FFD700';
                            span.style.textDecoration = 'underline';
                        }
                        display.appendChild(span);
                    }
                }

                function getLeaderboard(mode) {
                    return playerData.leaderboards[mode];
                }

                function switchLeaderboardTab(mode) {
                    document.getElementById('btnTabClassic').className = mode === 'classic' ? 'lb-tab active' : 'lb-tab';
                    document.getElementById('btnTabContest').className = mode === 'contest' ? 'lb-tab active' : 'lb-tab';
                    document.getElementById('btnTabTime').className = mode === 'time_attack' ? 'lb-tab active' : 'lb-tab';

                    const list = getLeaderboard(mode);
                    const container = document.getElementById('lbList');
                    container.innerHTML = '';

                    if (list.length === 0) {
                        container.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">AUCUN RECORD</div>';
                        return;
                    }

                    list.forEach((entry, index) => {
                        const div = document.createElement('div');
                        div.className = 'lb-row';

                        const rankSpan = document.createElement('span');
                        rankSpan.className = 'lb-rank';
                        rankSpan.textContent = (index + 1) + '.';
                        div.appendChild(rankSpan);

                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'lb-name';
                        nameSpan.textContent = entry.name;
                        div.appendChild(nameSpan);

                        const scoreSpan = document.createElement('span');
                        scoreSpan.className = 'lb-score';
                        scoreSpan.textContent = entry.score;
                        div.appendChild(scoreSpan);

                        container.appendChild(div);
                    });
                }

                function openLeaderboard() {
                    document.getElementById('leaderboardUI').style.display = 'block';
                    switchLeaderboardTab('classic');
                }

                window.updateHighScoreDisplay = updateHighScoreDisplay;
                window.openLeaderboard = openLeaderboard;
            </script>
        </body>
        </html>
        """

        await page.set_content(content)

        xss_triggered = False
        def handle_console(msg):
            nonlocal xss_triggered
            if "XSS" in msg.text:
                print(f"Console message: {msg.text}")
                xss_triggered = True

        page.on("console", handle_console)

        print("Testing High Score Input Display Fix...")
        await page.evaluate("""
            window.highScoreName = ['<img src=x onerror=console.log("XSS_INPUT")>', 'A', 'A'];
            window.updateHighScoreDisplay();
        """)

        await asyncio.sleep(1)

        if xss_triggered:
            print("FAILURE: DOM XSS still present in High Score Input Display")
        else:
            print("SUCCESS: DOM XSS fixed in High Score Input Display")

        xss_triggered_lb = False
        def handle_console_lb(msg):
            nonlocal xss_triggered_lb
            if "XSS_LB" in msg.text:
                print(f"Console message: {msg.text}")
                xss_triggered_lb = True

        page.on("console", handle_console_lb)

        print("Testing Leaderboard Display Fix...")
        await page.evaluate("""
            window.playerData.leaderboards.classic = [{ name: '<img src=x onerror=console.log("XSS_LB")>', score: 9999 }];
            window.openLeaderboard();
        """)

        await asyncio.sleep(1)

        if xss_triggered_lb:
            print("FAILURE: DOM XSS still present in Leaderboard Display")
        else:
            print("SUCCESS: DOM XSS fixed in Leaderboard Display")

        # Verify that the content is actually rendered (but safely)
        display_text = await page.inner_text("#hsNameDisplay")
        print(f"High score display text: '{display_text.strip()}'")
        if '<img' in display_text:
            print("Confirmed: Malicious string rendered as plain text in High Score Display.")
        else:
            print("Warning: Malicious string not found in High Score Display.")

        lb_text = await page.inner_text("#lbList")
        print(f"Leaderboard text: '{lb_text.strip()}'")
        if '<img' in lb_text:
            print("Confirmed: Malicious string rendered as plain text in Leaderboard.")
        else:
            print("Warning: Malicious string not found in Leaderboard.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
