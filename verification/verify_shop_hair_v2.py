from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load local file
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/gotrange.html")

    # Force open shop
    page.evaluate("window.openShop(true)")
    page.wait_for_selector("#shopUI", state="visible")

    # Correctly setup state for LeBron
    page.evaluate("""
        const targetId = 'human_lebron';
        const s = window.SKINS_DB.find(x => x.id === targetId);
        window.viewingAnimalIndex = window.ANIMALS.indexOf(s.animal);
        const humans = window.SKINS_DB.filter(x => x.animal === s.animal);
        window.viewingSkinIndex = humans.findIndex(x => x.id === targetId);
        window.updateShopUI();
    """)

    # Wait for update
    page.wait_for_timeout(500)

    # Check for toggle button
    btn = page.locator("#btnToggleVariant")
    if btn.is_visible():
        print("Toggle button found!")
        # Click it
        btn.click()
        page.wait_for_timeout(500)
        # Check text change
        txt = btn.inner_text()
        print(f"Button Text: {txt}")
        page.screenshot(path="verification/shop_hair_success.png")
    else:
        print("Toggle button NOT found!")
        # Debug info
        debug = page.evaluate("""
            const currentAnimal = window.ANIMALS[window.viewingAnimalIndex];
            const animalSkins = window.SKINS_DB.filter(s => s.animal === currentAnimal);
            const skin = animalSkins[window.viewingSkinIndex];
            JSON.stringify({animal: currentAnimal, skinId: skin ? skin.id : 'null', hasHair2: skin ? !!skin.hairStyle2 : false})
        """)
        print(f"Debug: {debug}")
        page.screenshot(path="verification/shop_hair_fail.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
