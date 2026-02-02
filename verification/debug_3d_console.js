const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  const filePath = 'file://' + path.resolve('gotrange.html');
  console.log(`Navigating to ${filePath}`);
  await page.goto(filePath);

  // Wait for game to init
  await page.waitForTimeout(2000);

  // Check THREE global
  const threeExists = await page.evaluate(() => typeof window.THREE !== 'undefined');
  console.log('THREE.js Loaded:', threeExists);

  // Click "ORDI" to start
  await page.click('button.startup-btn'); // Clicks first one (Desktop)
  await page.waitForTimeout(1000);

  // Simulate Toggling Graphics to 3D
  // Default is LOW.
  // Toggle 1: HIGH
  // Toggle 2: 3D

  console.log('Toggling Graphics to HIGH...');
  await page.evaluate(() => window.toggleGraphics());
  await page.waitForTimeout(500);

  console.log('Toggling Graphics to 3D...');
  await page.evaluate(() => window.toggleGraphics());
  await page.waitForTimeout(1000);

  // Check state
  const debugState = await page.evaluate(() => {
      return {
          use3D: window.use3D,
          initialized: window.ThreeScene && window.ThreeScene.initialized,
          rendererExists: !!(window.ThreeScene && window.ThreeScene.renderer),
          canvas3dDisplay: document.getElementById('canvas3d').style.display,
          graphicsMode: window.playerData.graphics
      };
  });

  console.log('Debug State:', debugState);

  // Screenshot
  await page.screenshot({ path: 'verification/debug_3d.png' });

  await browser.close();
})();
