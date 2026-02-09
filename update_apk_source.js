const fs = require('fs');
const path = require('path');

const sourceFile = 'gotrange.html';
const targetDir = 'taco_app/www';
const targetFile = path.join(targetDir, 'index.html');

// Logic to check for Capacitor native environment
const capScript = `
<script>
window.addEventListener('load', function() {
    // Check if running in Capacitor Native
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        console.log("Capacitor detected: Auto-selecting mobile.");
        if (window.playerData && !window.playerData.platformChosen) {
             window.choosePlatform('mobile');
        }
    }
});
</script>
`;

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    // 1. Update Index HTML
    let content = fs.readFileSync(sourceFile, 'utf8');

    if (content.includes('</body>')) {
        content = content.replace('</body>', `${capScript}\n</body>`);
    } else {
        console.warn('Warning: </body> tag not found, appending script to end');
        content += capScript;
    }

    if (!fs.existsSync(targetDir)){
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`Successfully updated ${targetFile} from ${sourceFile}`);

    // 2. Copy CSS
    if (fs.existsSync('css')) {
        copyDir('css', path.join(targetDir, 'css'));
        console.log('Copied css/');
    }

    // 3. Copy JS
    if (fs.existsSync('js')) {
        copyDir('js', path.join(targetDir, 'js'));
        console.log('Copied js/');
    }

} catch (err) {
    console.error('Error updating APK source:', err);
    process.exit(1);
}
