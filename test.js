const { readFileSync } = require('fs');
const { runInNewContext } = require('vm');

const src = readFileSync('js/renderer.js', 'utf8');

const match = src.match(/var ShadowCache = (\{[\s\S]*?MAX_ENTRIES: \d+,[\s\S]*?\});/);
if (!match) {
    console.error("Could not find ShadowCache");
    process.exit(1);
}

const cacheCode = match[1];
const sandbox = {};
runInNewContext(`var ShadowCache = ${cacheCode};`, sandbox);

const cache = sandbox.ShadowCache;

// Basic assertions to ensure our LRU cache replacement hasn't broken the logic
if (cache.get('foo') !== null) throw new Error("Expected null for non-existent key");

cache.set('foo', 'bar');
if (cache.get('foo') !== 'bar') throw new Error("Expected to retrieve 'bar' for key 'foo'");

// Should only keep 128 elements
for (let i = 0; i < 200; i++) {
    cache.set(`key_${i}`, `val_${i}`);
}

// 'foo' should have been evicted
if (cache.get('foo') !== null) throw new Error("Expected 'foo' to be evicted");

if (cache.cache.size !== 128) throw new Error(`Expected cache size to be 128, got ${cache.cache.size}`);

console.log("All tests passed");
