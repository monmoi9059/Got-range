const fs = require('fs');
const path = require('path');

const htmlFile = 'gotrange.html';
const cssDir = 'css';
const jsDir = 'js';

// Order matters!
const jsFiles = [
    'geometry.js',
    'data.js',
    'input.js',
    'renderer.js',
    'main.js',
    'audio.js',
    'game.js'
];

try {
    let html = fs.readFileSync(htmlFile, 'utf8');

    // 1. INLINE CSS
    // Matches <link rel="stylesheet" href="...">
    html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (match, href) => {
        const cssPath = path.join(__dirname, href);
        if (fs.existsSync(cssPath)) {
            console.log(`Inlining CSS: ${href}`);
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            return `<style>\n${cssContent}\n</style>`;
        }
        return match;
    });

    // 2. INLINE JS (Force Injection into Block)
    let combinedJs = '';

    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, jsDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`Reading JS: ${file}`);
            const content = fs.readFileSync(filePath, 'utf8');
            combinedJs += `\n// --- START ${file} ---\n${content}\n// --- END ${file} ---\n`;
        } else {
            console.warn(`Warning: ${file} not found.`);
        }
    });

    const jsBlockStart = '<!-- INJECT_JS_START -->';
    const jsBlockEnd = '<!-- INJECT_JS_END -->';

    const startIdx = html.indexOf(jsBlockStart);
    const endIdx = html.indexOf(jsBlockEnd);

    if (startIdx !== -1 && endIdx !== -1) {
        console.log('Injecting Combined JS into HTML...');
        const before = html.substring(0, startIdx + jsBlockStart.length);
        const after = html.substring(endIdx);
        html = before + '\n<script>\n' + combinedJs + '\n</script>\n' + after;
    } else {
        console.warn('Could not find INJECT_JS markers in HTML. JS injection skipped or failed.');
        // Fallback: Try replacing individual script tags if markers aren't there (legacy support)
         html = html.replace(/<script src="([^"]+)"><\/script>/g, (match, src) => {
            const jsPath = path.join(__dirname, src);
            if (fs.existsSync(jsPath)) {
                console.log(`Inlining JS (Legacy): ${src}`);
                const jsContent = fs.readFileSync(jsPath, 'utf8');
                return `<script>\n${jsContent}\n</script>`;
            }
            return match;
        });
    }

    fs.writeFileSync(htmlFile, html, 'utf8');
    console.log('Build complete: gotrange.html is now monolithic.');

} catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
}
