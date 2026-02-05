
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the game file directly
  await page.goto('file://' + process.cwd() + '/gotrange.html');

  // Inject logic to set skin to Rat and render
  await page.evaluate(() => {
    // Force skin
    playerData.currentSkin = 'rat_classic';
    // Force update to apply skin properties
    // (The game loop does this, but we want to be sure for the screenshot)

    // Position player for good view
    player3D.x = 433; player3D.y = 300; player3D.z = 0;

    // Force draw
    draw();
  });

  // Wait a bit for any async loads (textures?) - though simpler here
  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: 'verification/skin_rat_check.png' });

  // Now check Giraffe
  await page.evaluate(() => {
    playerData.currentSkin = 'giraffe_classic';
    draw();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/skin_giraffe_check.png' });

  await browser.close();
})();
