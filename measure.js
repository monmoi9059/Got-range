const { readFileSync } = require('fs');
const { runInNewContext } = require('vm');

const src = readFileSync('js/renderer.js', 'utf8');

// Extract ShadowCache
const match = src.match(/var ShadowCache = (\{[\s\S]*?MAX_ENTRIES: \d+,[\s\S]*?\});/);
if (!match) {
    console.error("Could not find ShadowCache");
    process.exit(1);
}

const cacheCode = match[1];
const sandbox = {};
runInNewContext(`var ShadowCache = ${cacheCode};`, sandbox);

const cache = sandbox.ShadowCache;

console.log("Benchmarking original ShadowCache...");

const START = Date.now();
const ITERS = 100000;

for (let i = 0; i < ITERS; i++) {
    const key = `key_${i % 150}`;
    if (!cache.get(key)) {
        cache.set(key, { data: i });
    }
}

const END = Date.now();
console.log(`Time taken: ${END - START}ms`);
