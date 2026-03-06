const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', error => {
      console.error(`Page error: ${error}`);
      process.exit(1);
  });

  page.on('console', msg => {
      if (msg.type() === 'error') {
          console.error(`Console error: ${msg.text()}`);
      }
  });

  await page.goto('http://localhost:8000/dev.html', { waitUntil: 'networkidle' });

  // Wait a few seconds to let game logic initialize
  await page.waitForTimeout(3000);

  // Trigger game start or rendering path if needed
  await page.evaluate(() => {
     if (typeof resetGame === 'function') {
         resetGame();
     }
  });

  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'render_test.png' });
  console.log("No console errors detected. Rendering appears successful.");

  await browser.close();
})();
