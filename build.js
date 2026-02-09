const fs = require('fs');
const path = require('path');

const htmlFile = 'gotrange.html';
const cssDir = 'css';
const jsDir = 'js';

try {
    let html = fs.readFileSync(htmlFile, 'utf8');

    // Inline CSS
    html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (match, href) => {
        const cssPath = path.join(__dirname, href);
        if (fs.existsSync(cssPath)) {
            console.log(`Inlining CSS: ${href}`);
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            return `<style>\n${cssContent}\n</style>`;
        }
        return match;
    });

    // Inline JS
    html = html.replace(/<script src="([^"]+)"><\/script>/g, (match, src) => {
        const jsPath = path.join(__dirname, src);
        if (fs.existsSync(jsPath)) {
            console.log(`Inlining JS: ${src}`);
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            return `<script>\n${jsContent}\n</script>`;
        }
        return match;
    });

    // Optimize: Merge adjacent script tags?
    // The browser handles multiple script tags fine, keeping them separate might be safer for now to avoid syntax errors if missing semicolons at EOF.

    fs.writeFileSync(htmlFile, html, 'utf8');
    console.log('Build complete: gotrange.html is now monolithic.');

} catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
}
