from playwright.sync_api import sync_playwright
import os

def verify_shop(page):
    # 1. Load the game
    cwd = os.getcwd()
    file_path = f"file://{cwd}/gotrange.html"
    print(f"Loading: {file_path}")
    page.goto(file_path)

    # 2. Pass Startup Screen
    page.click("text=ORDI 💻")

    # 3. Open Shop
    page.click("text=BOUTIQUE [P]")

    # 4. Wait for Shop UI
    shop_ui = page.locator("#shopUI")
    shop_ui.wait_for(state="visible")

    # 5. Navigate to a modified style (e.g., Curry is index 1)
    # The right arrow for style is the 4th button in .skin-nav (Animal L/R, Skin L/R, Style L/R)
    # Actually, let's look at selectors.
    # <div class="skin-nav"><button ... onclick="changeShootingStyle(-1)">...</button> ... <button ... onclick="changeShootingStyle(1)">...</button></div>
    # It's the 3rd .skin-nav div.

    # Let's find the button by onclick attribute or text > inside the specific container
    # The style navigation is the last one.

    # Click Right Arrow for style once to get to "Chef Curry"
    # We can use the onclick attribute to be precise
    page.click("button[onclick='changeShootingStyle(1)']")

    # 6. Take Screenshot of the Shop UI
    page.screenshot(path="verification/verification_shop.png")

    # 7. Verify text content for Curry
    style_name = page.locator("#styleName").inner_text()
    style_desc = page.locator("#styleDesc").inner_text()
    style_status = page.locator("#styleStatus").inner_text()

    print(f"Style: {style_name}")
    print(f"Desc: {style_desc}")
    print(f"Status: {style_status}")

    # Check if cost is 0 (it might say "Possédé" if I already own it in default data,
    # but default data only has 'classic'. So it should say "Coût: 0 Tacos" or "Possédé" if 0 cost implies auto-unlock?
    # Logic: if(isUnlocked)... else if(tacos >= cost)... status=`Coût: ${style.cost} Tacos`.
    # So it should say "Coût: 0 Tacos" and button "Acheter".

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_shop(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
