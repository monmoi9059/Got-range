
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true, // Visible for debugging if needed, but logs are enough
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('DEBUG_ARM')) {
        console.log(msg.text());
    }
  });

  await page.goto('http://localhost:8000/gotrange.html');

  // Force LeBron skin
  await page.evaluate(() => {
    window.playerData.currentSkin = 'human_lebron';
    window.playerData.platformChosen = true;
    window.saveData();
    window.startGame(); // Force redraw loop
  });

  // Wait a bit for the loop to run and log
  await page.waitForTimeout(2000);

  // Take a screenshot just in case
  await page.screenshot({ path: 'lebron_arm_debug.png' });

  await browser.close();
})();
