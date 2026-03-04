from playwright.sync_api import sync_playwright

def test_challenges():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("file:///app/gotrange.html")

        page.wait_for_timeout(2000)
        page.locator("button:has-text('ORDI')").click()
        page.wait_for_timeout(1000)

        # Press 'C' to open challenges
        page.keyboard.press("c")
        page.wait_for_timeout(1000)

        page.screenshot(path="/app/verification/challenges_daily.png")

        # Click HEBDOMADAIRE (Weekly tab)
        page.locator("button#btnChalWeekly").click()
        page.wait_for_timeout(1000)

        page.screenshot(path="/app/verification/challenges_weekly.png")

        browser.close()

if __name__ == "__main__":
    test_challenges()
