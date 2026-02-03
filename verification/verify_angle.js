
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Load the game
  const absolutePath = path.resolve('gotrange.html');
  await page.goto(`file://${absolutePath}`);

  // Wait for game to load
  await page.waitForTimeout(1000);

  // Select Classic Mode (default)
  // Click STARTUP buttons if present
  const startup = await page.$('#startup-ui');
  if (await startup.isVisible()) {
      await page.click('button:has-text("ORDI")');
  }

  await page.waitForTimeout(500);

  // Set Level to 10 via console to exaggerate the drift
  await page.evaluate(() => {
      window.distanceLevel = 10;
      window.player3D.x = 433 - 15 * 10; // 283
      window.player3D.y = 300 + 15 * 10; // 450
      window.invalidateBackgroundCache();
  });

  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: 'verification/hoop_angle_level10.png' });

  // Set Level back to 1
  await page.evaluate(() => {
      window.distanceLevel = 1;
      window.player3D.x = 433;
      window.player3D.y = 300;
      window.invalidateBackgroundCache();
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/hoop_angle_level1.png' });

  await browser.close();
})();
