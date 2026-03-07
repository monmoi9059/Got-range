const ITERS = 100000;
const KEYS = 150;

function benchOriginal() {
    var ShadowCache = {
        entries: {},
        keys: [],
        MAX_ENTRIES: 128,
        get: function(key) {
            var entry = this.entries[key];
            if (entry) {
                // Move to end of keys for LRU-ish behavior
                var idx = this.keys.indexOf(key);
                if (idx > -1) {
                    this.keys.splice(idx, 1);
                    this.keys.push(key);
                }
                return entry;
            }
            return null;
        },
        set: function(key, canvas) {
            if (this.entries[key]) return;
            if (this.keys.length >= this.MAX_ENTRIES) {
                var oldKey = this.keys.shift();
                delete this.entries[oldKey];
            }
            this.entries[key] = canvas;
            this.keys.push(key);
        }
    };
    const START = Date.now();
    for (let i = 0; i < ITERS; i++) {
        const key = `key_${i % KEYS}`;
        if (!ShadowCache.get(key)) {
            ShadowCache.set(key, { data: i });
        }
    }
    const END = Date.now();
    return END - START;
}

function benchMap() {
    var ShadowCache = {
        cache: new Map(),
        MAX_ENTRIES: 128,
        get: function(key) {
            var entry = this.cache.get(key);
            if (entry !== undefined) {
                // Move to end for LRU behavior by deleting and reinserting
                this.cache.delete(key);
                this.cache.set(key, entry);
                return entry;
            }
            return null;
        },
        set: function(key, canvas) {
            if (this.cache.has(key)) return;
            if (this.cache.size >= this.MAX_ENTRIES) {
                // map.keys().next().value gets the first (oldest) key
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }
            this.cache.set(key, canvas);
        }
    };
    const START = Date.now();
    for (let i = 0; i < ITERS; i++) {
        const key = `key_${i % KEYS}`;
        if (!ShadowCache.get(key)) {
            ShadowCache.set(key, { data: i });
        }
    }
    const END = Date.now();
    return END - START;
}

const resOriginal = benchOriginal();
const resMap = benchMap();
console.log(`Original: ${resOriginal}ms`);
console.log(`Map: ${resMap}ms`);
