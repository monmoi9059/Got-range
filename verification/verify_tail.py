import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        cwd = os.getcwd()
        file_path = f"file://{cwd}/gotrange.html"

        await page.goto(file_path)
        await page.wait_for_timeout(2000)

        # Click "JOUER" button if present, or just try to open shop
        try:
            play_btn = page.locator("#startup-ui button").first
            if await play_btn.count() > 0:
                await play_btn.click()
                await page.wait_for_timeout(1000)
        except:
            pass

        # Force open shop
        await page.evaluate("openShop()")
        await page.wait_for_timeout(1000)

        # Click "MATOS" (Equipment/Cat) tab
        await page.get_by_role("button", name="MATOS").click()
        await page.wait_for_timeout(500)

        # We need to navigate to 'cat_cream' (Vanille).
        # It's at index 9.
        # Current index is likely 0 (Classique).
        # Click next 9 times.

        next_btn = page.locator("button[onclick*='changeCatSkin(1)']")

        for i in range(9):
            await next_btn.click()
            await page.wait_for_timeout(100)

        cat_name = await page.locator("#catName").text_content()
        print(f"Current Cat: {cat_name}")

        if "Vanille" in cat_name:
            print("Successfully navigated to Vanille (Begging stance).")
        else:
            print(f"Failed to navigate. Expected Vanille, got {cat_name}")

        # Take screenshot to verify tail (visual check for me)
        await page.screenshot(path="verification/cat_begging_tail.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
