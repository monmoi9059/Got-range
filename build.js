const fs = require('fs');
const path = require('path');

const devFile = 'dev.html';
const outFile = 'gotrange.html';

try {
    console.log(`Building ${outFile} from ${devFile}...`);
    let html = fs.readFileSync(devFile, 'utf8');

    // 1. Inline CSS
    // Matches <link rel="stylesheet" href="...">
    html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (match, href) => {
        console.log(`Inlining CSS: ${href}`);
        const cssPath = path.join(__dirname, href);
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            return `<style>\n${cssContent}\n</style>`;
        } else {
            console.warn(`Warning: CSS file not found: ${href}`);
            return match;
        }
    });

    // 2. Inline JS
    // Matches <script src="..."></script>
    html = html.replace(/<script src="([^"]+)"><\/script>/g, (match, src) => {
        console.log(`Inlining JS: ${src}`);
        const jsPath = path.join(__dirname, src);
        if (fs.existsSync(jsPath)) {
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            // Wrap in comments for structure if desired, or just raw
            return `<script>\n// --- START ${path.basename(src)} ---\n${jsContent}\n// --- END ${path.basename(src)} ---\n</script>`;
        } else {
            console.warn(`Warning: JS file not found: ${src}`);
            return match;
        }
    });

    fs.writeFileSync(outFile, html, 'utf8');
    console.log(`Successfully created ${outFile}`);

} catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
}
