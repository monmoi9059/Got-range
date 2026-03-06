const fs = require('fs');

eval(fs.readFileSync('js/data.js', 'utf8'));

// Set up data for benchmark
let mockPlayerData = { unlockedSkins: [] };
for (let i = 0; i < 50; i++) {
    mockPlayerData.unlockedSkins.push(SKINS_DB[i % SKINS_DB.length].id);
}

// Function before optimization
function checkOriginal() {
    const animalsOwned = new Set();
    mockPlayerData.unlockedSkins.forEach(skinId => { const s = SKINS_DB.find(x => x.id === skinId); if(s) animalsOwned.add(s.animal); });
    return animalsOwned.size;
}

const SKINS_DB_MAP = new Map(SKINS_DB.map(s => [s.id, s]));

// Function after optimization
function checkOptimized() {
    const animalsOwned = new Set();
    mockPlayerData.unlockedSkins.forEach(skinId => { const s = SKINS_DB_MAP.get(skinId); if(s) animalsOwned.add(s.animal); });
    return animalsOwned.size;
}

const iters = 10000;

console.log("Benchmarking SKINS_DB.find vs SKINS_DB_MAP.get");
console.log("Iterations:", iters);

console.time("Original");
for(let i=0; i<iters; i++) {
    checkOriginal();
}
console.timeEnd("Original");

console.time("Optimized");
for(let i=0; i<iters; i++) {
    checkOptimized();
}
console.timeEnd("Optimized");
