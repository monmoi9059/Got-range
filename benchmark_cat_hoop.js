const perf = require('perf_hooks').performance;

// Mock data to simulate the game's decors array
const decors = [];

// Add 1000 dummy decors
for (let i = 0; i < 1000; i++) {
    decors.push({ zoneType: 'tree', x: i, y: i });
}

// Add the cat_hoop decor near the end (worst case scenario for find)
decors.push({ zoneType: 'cat_hoop', x: 100, y: 100 });

// Add more dummy decors
for (let i = 0; i < 500; i++) {
    decors.push({ zoneType: 'rock', x: i, y: i });
}

const iterations = 1000000; // 1 million frames

// Baseline: original code (repeated find)
console.log('--- Baseline (Original Code) ---');
const t0 = perf.now();
for (let i = 0; i < iterations; i++) {
    if (typeof decors !== 'undefined') {
        const cat = decors.find(d => d.zoneType === 'cat_hoop');
        if (cat) {
            // Simulated usage
            const x = cat.x;
        }
    }
}
const t1 = perf.now();
const baselineTime = t1 - t0;
console.log(`Original Code Time: ${baselineTime.toFixed(2)} ms`);

// Optimized: caching the reference
console.log('\n--- Optimized Code (Cached Reference) ---');
let g_cachedCatDecor = null;
let g_lastDecorsRef = null;

const t2 = perf.now();
for (let i = 0; i < iterations; i++) {
    if (typeof decors !== 'undefined') {
        // Only do the lookup if the decors array reference changes or we don't have it
        if (g_lastDecorsRef !== decors || !g_cachedCatDecor) {
            g_cachedCatDecor = decors.find(d => d.zoneType === 'cat_hoop');
            g_lastDecorsRef = decors;
        }

        if (g_cachedCatDecor) {
            // Simulated usage
            const x = g_cachedCatDecor.x;
        }
    }
}
const t3 = perf.now();
const optimizedTime = t3 - t2;
console.log(`Optimized Code Time: ${optimizedTime.toFixed(2)} ms`);

// Results
const improvement = ((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2);
console.log(`\nPerformance Improvement: ${improvement}% faster (${(baselineTime / optimizedTime).toFixed(2)}x speedup)`);
