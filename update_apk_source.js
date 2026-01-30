const fs = require('fs');
const path = require('path');

const sourceFile = 'gotrange.html';
const targetFile = 'taco_app/www/index.html';

const cordovaScript = '<script src="cordova.js"></script>';
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

try {
    let content = fs.readFileSync(sourceFile, 'utf8');

    // Inject cordova.js in head
    if (content.includes('</head>')) {
        content = content.replace('</head>', `    ${cordovaScript}\n</head>`);
    } else {
        console.warn('Warning: </head> tag not found, appending cordova.js to body start');
        content = content.replace('<body>', `<body>\n    ${cordovaScript}`);
    }

    // Inject deviceready listener before body end
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${devicereadyScript}\n</body>`);
    } else {
        console.warn('Warning: </body> tag not found, appending deviceready script to end');
        content += devicereadyScript;
    }

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`Successfully updated ${targetFile} from ${sourceFile}`);
} catch (err) {
    console.error('Error updating APK source:', err);
    process.exit(1);
}
