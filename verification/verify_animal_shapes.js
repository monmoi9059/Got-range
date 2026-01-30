
const { chromium } = require('playwright');
const fs = require('fs');

const ANIMALS_TO_CHECK = [
    'rat_classic',
    'cat_classic',
    'dog_classic',
    'bear_classic',
    'monkey_classic',
    'penguin_classic',
    'elephant_classic',
    'giraffe_classic',
    'dino_rex',
    'cow_classic'
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set viewport to a good size
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('http://localhost:8000/gotrange.html');

  // Initialize game to skip startup
  await page.evaluate(() => {
    // Unlock everything
    if (!window.playerData.unlockedSkins) window.playerData.unlockedSkins = [];
    window.SKINS_DB.forEach(s => {
        if (!window.playerData.unlockedSkins.includes(s.id)) {
            window.playerData.unlockedSkins.push(s.id);
        }
    });

    window.playerData.platformChosen = true;
    window.playerData.graphics = 'HIGH'; // Use high for better detail
    window.saveData();
    window.startGame();
  });

  // Wait for game to initialize
  await page.waitForTimeout(1000);

  for (const skinId of ANIMALS_TO_CHECK) {
      console.log(`Checking skin: ${skinId}`);

      await page.evaluate((id) => {
          window.playerData.currentSkin = id;
          window.saveData();
          // Force UI update if needed, but game loop reads currentSkin every frame usually
          // But shop UI update might be needed if we were in shop, but we are in IDLE.
          // However, we want to ensure the loop picks it up.
      }, skinId);

      // Wait for a few frames
      await page.waitForTimeout(500);

      // Take screenshot
      await page.screenshot({ path: `verification/screenshots/${skinId}.png` });
  }

  await browser.close();
})();
