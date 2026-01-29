const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'gotrange.html');
const destPath = path.join(__dirname, 'taco_app/www/index.html');

console.log(`Reading from ${sourcePath}...`);
let content = fs.readFileSync(sourcePath, 'utf8');

// Inject cordova.js
if (!content.includes('<script src="cordova.js"></script>')) {
    console.log('Injecting cordova.js script tag...');
    content = content.replace('<head>', '<head>\n    <script src="cordova.js"></script>');
} else {
    console.log('cordova.js script tag already present.');
}

// Inject deviceready listener
const devicereadyScript = `
<script>
document.addEventListener('deviceready', function() {
    if (window.playerData && !window.playerData.platformChosen) {
        console.log("Cordova detected: Auto-selecting mobile.");
        window.choosePlatform('mobile');
    }
}, false);
</script>
`;

if (!content.includes('Cordova detected: Auto-selecting mobile')) {
    console.log('Injecting deviceready listener...');
    content = content.replace('</body>', `${devicereadyScript}\n</body>`);
} else {
    console.log('deviceready listener already present.');
}

console.log(`Writing to ${destPath}...`);
fs.writeFileSync(destPath, content);
console.log('Updated taco_app/www/index.html successfully.');
