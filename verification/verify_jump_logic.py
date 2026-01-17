from playwright.sync_api import sync_playwright
import os

def verify_jump_heights(page):
    # 1. Load the game
    cwd = os.getcwd()
    file_path = f"file://{cwd}/gotrange.html"
    print(f"Loading: {file_path}")
    page.goto(file_path)

    # 2. Pass Startup Screen
    page.click("text=ORDI 💻")

    # 3. Open Shop
    page.click("text=BOUTIQUE [P]")
    shop_ui = page.locator("#shopUI")
    shop_ui.wait_for(state="visible")

    # 4. Helper to equip style by name
    style_name_loc = page.locator("#styleName")

    def equip_style(target_name):
        print(f"Equipping {target_name}...")
        for _ in range(20): # Max attempts
            current = style_name_loc.inner_text()
            if current.upper() == target_name.upper():
                break
            page.click("button[onclick='changeShootingStyle(1)']")

        # Click Equip if visible (might be "Possédé" -> "Équiper")
        if page.is_visible("#btnEquipStyle"):
             page.click("#btnEquipStyle")
        page.wait_for_timeout(200) # Wait for equip logic

    equip_style("La Quille") # Bowling

    # Close Shop (Specific selector)
    page.click("#shopUI .btn-close")
    page.wait_for_timeout(500)

    # 5. Perform Jump (Bowling = 0 or very low)
    page.keyboard.press("Space")
    # We need to capture VZ *immediately* after the update loop runs or checking the state.
    # Actually, we can check `window.player3D.vz` which is set in `startJump`.
    # Depending on when the loop runs, it might decrease by gravity.
    # But checking it right after press should show a low value.

    # Let's poll it for a few frames
    max_vz = 0
    for _ in range(10):
        vz = page.evaluate("window.player3D.vz")
        if vz > max_vz: max_vz = vz
        page.wait_for_timeout(16)

    print(f"Bowling Max VZ detected: {max_vz}")

    # 6. Equip "Le Yeet" (High jump)
    page.click("text=BOUTIQUE [P]")
    shop_ui.wait_for(state="visible")
    equip_style("Le Yeet")
    page.click("#shopUI .btn-close")
    page.wait_for_timeout(500)

    # Trigger Jump
    page.keyboard.press("Space")

    max_vz_yeet = 0
    for _ in range(10):
        vz = page.evaluate("window.player3D.vz")
        if vz > max_vz_yeet: max_vz_yeet = vz
        page.wait_for_timeout(16)

    print(f"Yeet Max VZ detected: {max_vz_yeet}")

    # 7. Take screenshot of the "Yeet" jump apex
    page.wait_for_timeout(200)
    page.screenshot(path="verification/verification_jump_yeet.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_jump_heights(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
