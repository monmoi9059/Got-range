const { readFileSync } = require('fs');

const src = readFileSync('js/renderer.js', 'utf8');
const match = src.match(/var ShadowCache = (\{[\s\S]*?MAX_ENTRIES: \d+,[\s\S]*?set: function[\s\S]*?\}\s*\});/);
if (match) {
    console.log(match[1]);
} else {
    console.log("Could not find entire ShadowCache");
}
