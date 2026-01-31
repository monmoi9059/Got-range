const fs = require('fs');
const path = require('path');

const sourceFile = 'gotrange.html';
const targetFile = 'taco_app/www/index.html';

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
    let content = fs.readFileSync(sourceFile, 'utf8');

    // Inject script before body end
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${capScript}\n</body>`);
    } else {
        console.warn('Warning: </body> tag not found, appending script to end');
        content += capScript;
    }

    // Ensure directory exists
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`Successfully updated ${targetFile} from ${sourceFile}`);
} catch (err) {
    console.error('Error updating APK source:', err);
    process.exit(1);
}
