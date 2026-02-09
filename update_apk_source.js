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

} catch (err) {
    console.error('Error updating APK source:', err);
    process.exit(1);
}
