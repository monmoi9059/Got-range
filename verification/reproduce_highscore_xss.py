import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Load the dev.html file with a custom content that mocks the game
        # This is more reliable than loading the whole game which might have complex initialization

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
                // Mock global variables and functions from game.js and main.js
                var highScoreCursor = 0;
                var highScoreName = ["A", "A", "A"];
                var playerData = {
                    leaderboards: { classic: [], contest: [], time_attack: [] }
                };
                var isSplitscreen = False;
                var state = 'IDLE';

                function updateHighScoreDisplay() {
                    const display = document.getElementById('hsNameDisplay');
                    if(!display) return;
                    let html = '';
                    for(let i=0; i<3; i++) {
                        if (i === highScoreCursor) html += `<span style="color:#FFD700; text-decoration:underline;">${highScoreName[i]}</span> `;
                        else html += `${highScoreName[i]} `;
                    }
                    display.innerHTML = html.trim();
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
                        div.innerHTML = `<span class="lb-rank">${index + 1}.</span><span class="lb-name">${entry.name}</span><span class="lb-score">${entry.score}</span>`;
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

        print("Testing High Score Input Display XSS...")
        await page.evaluate("""
            window.highScoreName = ['<img src=x onerror=console.log("XSS_INPUT")>', 'A', 'A'];
            window.updateHighScoreDisplay();
        """)

        await asyncio.sleep(1)

        if xss_triggered:
            print("VULNERABILITY REPRODUCED: DOM XSS in High Score Input Display")
        else:
            print("Vulnerability not reproduced in High Score Input Display")

        xss_triggered_lb = False
        def handle_console_lb(msg):
            nonlocal xss_triggered_lb
            if "XSS_LB" in msg.text:
                print(f"Console message: {msg.text}")
                xss_triggered_lb = True

        page.on("console", handle_console_lb)

        print("Testing Leaderboard Display XSS...")
        await page.evaluate("""
            window.playerData.leaderboards.classic = [{ name: '<img src=x onerror=console.log("XSS_LB")>', score: 9999 }];
            window.openLeaderboard();
        """)

        await asyncio.sleep(1)

        if xss_triggered_lb:
            print("VULNERABILITY REPRODUCED: DOM XSS in Leaderboard Display")
        else:
            print("Vulnerability not reproduced in Leaderboard Display")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
