from playwright.sync_api import Page, expect, sync_playwright

def test_challenges_ui(page: Page):
  page.goto("file:///app/gotrange.html")
  page.wait_for_timeout(1000)

  # Wait for startup to complete by pressing Enter
  page.keyboard.press("Enter")
  page.wait_for_timeout(500)

  # Open challenges UI via script
  page.evaluate("window.openChallenges()")
  page.wait_for_timeout(500)

  expect(page.locator("#challengesUI")).to_be_visible()

  page.screenshot(path="/app/verification/verification.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_challenges_ui(page)
    finally:
      browser.close()
