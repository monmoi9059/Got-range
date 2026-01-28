const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'gotrange.html');
const destPath = path.join(__dirname, 'taco_app/www/index.html');

let content = fs.readFileSync(srcPath, 'utf8');

// Inject cordova.js in head
content = content.replace('</head>', '    <script src="cordova.js"></script>\n</head>');

// Inject deviceready handler before body end
const patch = `
<script>
document.addEventListener('deviceready', function() {
    if (window.playerData && !window.playerData.platformChosen) {
        console.log("Cordova detected: Auto-selecting mobile.");
        window.choosePlatform('mobile');
    }
}, false);
</script>
`;

content = content.replace('</body>', patch + '</body>');

fs.writeFileSync(destPath, content, 'utf8');
console.log('Migrated gotrange.html to taco_app/www/index.html with injections.');
