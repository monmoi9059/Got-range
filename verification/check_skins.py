from playwright.sync_api import sync_playwright
import time
import json

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        page.goto("http://localhost:8000/gotrange.html")
        page.wait_for_selector("#gameCanvas")
        time.sleep(2)

        print("Bypassing Startup...")
        page.evaluate("""
            window.playerData.platformChosen = true;
            window.game1.state = 'IDLE';
            window.state = 'IDLE';
            document.getElementById('startup-ui').style.display = 'none';
            document.getElementById('scorebug-container').style.display = 'flex';
            document.getElementById('controls').style.display = 'flex';
        """)
        time.sleep(1)

        print("Checking Standard Human state...")
        page.evaluate("""
            window.playerData.currentSkin = 'human_mj';
            window.game1.playerData.currentSkin = 'human_mj';
        """)
        time.sleep(0.5)

        state = page.evaluate("""
            () => {
                const p3d = window.player3D;
                let proj = "Error";
                try { proj = window.project(p3d.x, p3d.y, p3d.z); } catch(e) { proj = e.toString(); }

                const gRenderListCount = window.g_renderList ? window.g_renderList.length : 0;
                const cam = window.g_camCache;
                return {
                    player3D: p3d,
                    projection: proj,
                    renderListCount: gRenderListCount,
                    camera: cam
                };
            }
        """)
        print(f"DEBUG STATE: {json.dumps(state, indent=2)}")

        page.screenshot(path="verification/skin_human_std.png")

        # 2. Extended Neck
        print("Checking Human with Neck...")
        page.evaluate("""
             window.SKINS_DB.push({
                id: 'human_longneck', animal: 'human', name: 'Test',
                neckLength: 20, skinTone: '#dcb98a'
            });
            window.playerData.currentSkin = 'human_longneck';
            window.game1.playerData.currentSkin = 'human_longneck';
        """)
        time.sleep(0.5)
        page.screenshot(path="verification/skin_human_neck.png")

        browser.close()

if __name__ == "__main__":
    run()
