const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve('gotrange.html');
  await page.goto(fileUrl);

  // Wait for game loop
  await page.waitForTimeout(3000);

  // Take multiple screenshots to ensure no boats appear
  for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `verification/no_boats_seq_${i}.png` });
      console.log(`Saved seq_${i}`);
  }

  await browser.close();
})();
