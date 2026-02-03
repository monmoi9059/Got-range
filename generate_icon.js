const { chromium } = require('playwright');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="40" r="30" fill="#FF8C00"/><path d="M50 10 A 30 30 0 0 1 50 70 M20 40 A 30 30 0 0 1 80 40" stroke="#8B4500" stroke-width="3" fill="none"/><path d="M10 50 Q 50 100 90 50" fill="#FFD700" stroke="#DAA520" stroke-width="4"/><path d="M15 50 Q 25 40 35 50 T 55 50 T 75 50 T 85 50" stroke="#32CD32" stroke-width="4" fill="none"/></svg>`;

const outputPath = path.join(__dirname, 'taco_app/assets/icon_source.png');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set viewport to 1024x1024 to ensure good resolution
    await page.setViewportSize({ width: 1024, height: 1024 });

    // Load SVG into the page, scaling it to fill the viewport
    const htmlContent = `
    <html>
    <body style="margin: 0; padding: 0; background: transparent;">
        <div style="width: 1024px; height: 1024px;">
            ${svgContent.replace('<svg', '<svg width="1024" height="1024"')}
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);

    // Screenshot the div
    const element = await page.$('div');
    await element.screenshot({ path: outputPath, omitBackground: true });

    await browser.close();
    console.log(`Icon generated at: ${outputPath}`);
})();
