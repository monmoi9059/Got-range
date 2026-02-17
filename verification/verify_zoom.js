const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Load the game
  const filePath = 'file://' + path.resolve('gotrange.html');
  console.log(`Loading ${filePath}...`);

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto(filePath);

  // Wait for game to load
  await page.waitForTimeout(1000);

  // Open Stats
  console.log('Opening Stats...');
  // Assuming 'S' key opens stats or use evaluate
  await page.keyboard.press('s');
  await page.waitForSelector('#statsUI', { state: 'visible' });

  // Check for Slider
  console.log('Checking for Zoom Slider...');
  const slider = await page.$('#cameraZoomSlider');
  if (slider) {
      console.log('PASS: Zoom Slider found.');
  } else {
      console.error('FAIL: Zoom Slider not found.');
      process.exit(1);
  }

  // Check Initial Value
  let zoomVal = await page.evaluate(() => window.playerData.cameraZoomScale);
  console.log(`Initial Zoom Scale: ${zoomVal}`);

  // Change Slider
  console.log('Changing slider value...');
  await page.fill('#cameraZoomSlider', '1.5');
  await page.evaluate(() => {
      const s = document.getElementById('cameraZoomSlider');
      s.dispatchEvent(new Event('input'));
  });

  await page.waitForTimeout(500);

  // Verify Data Update
  const newZoomVal = await page.evaluate(() => window.playerData.cameraZoomScale);
  console.log(`New Zoom Scale: ${newZoomVal}`);

  if (newZoomVal === 1.5) {
      console.log('PASS: Data updated successfully.');
  } else {
      console.error('FAIL: Data did not update.');
      process.exit(1);
  }

  // Take screenshot
  await page.screenshot({ path: 'verification/zoom_slider.png' });
  console.log('Screenshot saved to verification/zoom_slider.png');

  await browser.close();
})();
