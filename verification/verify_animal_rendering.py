from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Load the file directly
    page.goto(f"file://{os.getcwd()}/gotrange.html")

    # Wait for startup UI
    try:
        page.wait_for_selector('#startup-ui', state='visible', timeout=5000)
    except:
        print("Startup UI not found or timed out")

    # Click "ORDI"
    page.click("button:has-text('ORDI')")

    # Wait for game container
    page.wait_for_selector('#game-container', state='visible')

    # Open Shop
    page.click("div.broadcast-btn:has-text('BOUTIQUE')")
    page.wait_for_selector('#shopUI', state='visible')

    # Take screenshot of default (Rat)
    page.screenshot(path="verification/animal_rat.png")

    # Change to Cat (Next animal)
    page.click("button[onclick='changeAnimal(1)']")
    time.sleep(0.5)
    page.screenshot(path="verification/animal_cat.png")

    # Change to Dog
    page.click("button[onclick='changeAnimal(1)']")
    time.sleep(0.5)
    page.screenshot(path="verification/animal_dog.png")

    # Change to Bear
    page.click("button[onclick='changeAnimal(1)']")
    time.sleep(0.5)
    page.screenshot(path="verification/animal_bear.png")

    # Change to Rabbit
    page.click("button[onclick='changeAnimal(1)']")
    time.sleep(0.5)
    page.screenshot(path="verification/animal_rabbit.png")

    # Skip to Tiger (many clicks)
    # Animals: rat, cat, dog, bear, rabbit, moose, fox, wolf, lion, tiger
    # current: rabbit (index 4)
    # tiger is index 9. Need 5 more clicks.
    for _ in range(5):
        page.click("button[onclick='changeAnimal(1)']")
        time.sleep(0.1)

    time.sleep(0.5)
    page.screenshot(path="verification/animal_tiger.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
