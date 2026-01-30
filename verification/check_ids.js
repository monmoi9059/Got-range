
const fs = require('fs');
const content = fs.readFileSync('gotrange.html', 'utf8');

// Extract SKINS_DB using regex
const match = content.match(/var SKINS_DB = \[\s*([\s\S]*?)\];/);
if (!match) {
    console.error("Could not find SKINS_DB");
    process.exit(1);
}

const dbString = "[" + match[1] + "]";
// Eval is dangerous but fine for this controlled env
const skins = eval(dbString);

const ids = new Set();
const duplicates = [];

skins.forEach(skin => {
    if (ids.has(skin.id)) {
        duplicates.push(skin.id);
    }
    ids.add(skin.id);
});

if (duplicates.length > 0) {
    console.error("Duplicate IDs found:", duplicates);
    process.exit(1);
}

console.log(`Verified ${skins.length} unique skins.`);
