
import asyncio
from playwright.async_api import async_playwright
import os

SKINS_TO_VERIFY = [
    'human_wemby',
    'human_barkley',
    'human_reggie',
    'human_dirk',
    'human_hedgehog',
    'human_gorgon'
]

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the game
        # Assuming the file is served or accessible via file protocol.
        # Since we are in the repo root, absolute path is best.
        cwd = os.getcwd()
        filepath = f"file://{cwd}/gotrange.html"
        await page.goto(filepath)

        # Wait for game to load
        await page.wait_for_timeout(1000)

        # Click the "ORDI" button to start
        ordi_btn = page.locator("button:has-text('ORDI 💻')")
        if await ordi_btn.count() > 0:
            await ordi_btn.click()
            await page.wait_for_timeout(1000)

        # Ensure verification directory exists
        if not os.path.exists('verification'):
            os.makedirs('verification')

        for skin_id in SKINS_TO_VERIFY:
            print(f"Verifying {skin_id}...")

            # Inject state: set skin and force IDLE state
            await page.evaluate(f"""
                window.playerData.currentSkin = '{skin_id}';
                window.state = 'IDLE';
                // Force player position to default to ensure visibility
                window.player3D = {{ x: 433, y: 300, z: 0, vz: 0 }};
                // Force shop closed
                document.getElementById('shopUI').style.display = 'none';
                // Force update UI logic if needed, but the draw loop runs every frame
            """)

            # Wait a bit for the render loop to pick up the change
            await page.wait_for_timeout(500)

            # Screenshot
            await page.screenshot(path=f'verification/adjust_{skin_id}.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
