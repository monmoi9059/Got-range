from playwright.sync_api import sync_playwright
import os

def verify_ground_shot(page):
    # 1. Load the game
    cwd = os.getcwd()
    file_path = f"file://{cwd}/gotrange.html"
    print(f"Loading: {file_path}")
    page.goto(file_path)

    # 2. Pass Startup Screen
    page.click("text=ORDI 💻")

    # 3. Equip "La Quille" (Bowling) which is a grounded style
    page.click("text=BOUTIQUE [P]")
    shop_ui = page.locator("#shopUI")
    shop_ui.wait_for(state="visible")

    style_name_loc = page.locator("#styleName")

    def equip_style(target_name):
        print(f"Equipping {target_name}...")
        for _ in range(20): # Max attempts
            current = style_name_loc.inner_text()
            if current.upper() == target_name.upper():
                break
            page.click("button[onclick='changeShootingStyle(1)']")

        # Click Equip if visible
        if page.is_visible("#btnEquipStyle"):
             page.click("#btnEquipStyle")
        page.wait_for_timeout(200) # Wait for equip logic

    equip_style("La Quille")

    # Close Shop
    page.click("#shopUI .btn-close")
    page.wait_for_timeout(500)

    # 4. Perform Ground Shot
    print("Initiating Ground Shot...")
    # Press space to start
    page.keyboard.down("Space")

    # Wait for meter to fill partially (simulate aiming)
    # Timer starts at 0. Approx 18 ticks is peak (green).
    # 1 tick = 1 frame? update runs at 60fps? Loop relies on requestAnimationFrame.
    # We should wait approx 300ms (18 * 16ms)
    page.wait_for_timeout(300)

    # Take screenshot of the meter
    page.screenshot(path="verification/verification_ground_meter.png")

    # Release space
    page.keyboard.up("Space")
    print("Released Shot.")

    # Wait for feedback
    page.wait_for_timeout(500)

    # Check if we got "MARCHÉ!" (Travel) - We hope NOT to see it if logic works
    # Or check if ball is active

    ball_active = page.evaluate("window.ball.active")
    print(f"Ball Active: {ball_active}")

    # If ball is active, it means we shot successfully instead of faulting
    if not ball_active:
        print("Ball not active! Check if Game Over or Resetting.")
        state = page.evaluate("window.state")
        print(f"Game State: {state}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ground_shot(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
