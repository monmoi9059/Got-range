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

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
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

    // 2. Copy JS Folder
    console.log('Copying JS folder...');
    copyFolderSync('js', path.join(targetDir, 'js'));

    // 3. Copy CSS Folder
    console.log('Copying CSS folder...');
    copyFolderSync('css', path.join(targetDir, 'css'));

    console.log('APK source update complete.');

} catch (err) {
    console.error('Error updating APK source:', err);
    process.exit(1);
}
