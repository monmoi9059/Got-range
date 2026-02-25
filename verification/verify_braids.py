
import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load the app (using the one we built)
        url = "file://" + os.path.abspath("taco_app/www/index.html")
        print(f"Loading {url}")
        await page.goto(url)

        # Wait for canvas
        await page.wait_for_selector("#gameCanvas")

        # Helper to set hairstyle and take screenshot
        async def verify_hair(hair_id):
            print(f"Verifying {hair_id}...")
            # Inject JS to set hairstyle and force redraw
            await page.evaluate(f"""
                window.playerData.currentSkin = 'human_custom';
                window.playerData.customHairstyle = '{hair_id}';
                window.playerData.customHairColorIndex = 0; // Black
                window.playerData.customSkinSettings = {{ height: 1.0, width: 1.0, skinToneIndex: 4 }};
                window.state = 'IDLE';
                window.player3D.z = 0;
                window.player3D.vz = 0;
                // Force redraw
                if(window.invalidateBackgroundCache) window.invalidateBackgroundCache();
            """)

            # Wait a bit for frame
            await page.wait_for_timeout(500)

            # Take screenshot of the player area (center of screen)
            # Canvas size 1066x600. Player at ~433, 300?
            # Actually player x is around 433 in code.
            # Let's just take a crop.
            await page.screenshot(path=f"verification/hair_{hair_id}.png", clip={"x": 350, "y": 150, "width": 200, "height": 300})
            print(f"Saved verification/hair_{hair_id}.png")

        # Verify cornrows
        await verify_hair('cornrows_straight')
        await verify_hair('cornrows_braids')
        await verify_hair('braids_box')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
