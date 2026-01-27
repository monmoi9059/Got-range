const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const html = fs.readFileSync('gotrange.html', 'utf8');

// Regex to find the base64 SVG in the link rel="icon"
const regex = /<link rel="icon"[^>]*href="data:image\/svg\+xml;base64,([^"]+)"/;
const match = html.match(regex);

if (!match) {
    console.error("Could not find SVG icon in HTML");
    process.exit(1);
}

const base64Svg = match[1];
const svgBuffer = Buffer.from(base64Svg, 'base64');

console.log("SVG extracted. Converting to PNG...");

const outputDir = 'taco_app/res';
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, 'icon.png'))
    .then(info => {
        console.log("Icon saved to taco_app/res/icon.png");
        console.log(info);
    })
    .catch(err => {
        console.error("Error converting icon:", err);
        process.exit(1);
    });
