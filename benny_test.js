const b = require('benny');

const ITERS = 1000;
const KEYS = 150;

function createOriginal() {
    return {
        entries: {},
        keys: [],
        MAX_ENTRIES: 128,
        get: function(key) {
            var entry = this.entries[key];
            if (entry) {
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
}

function createMap() {
    return {
        cache: new Map(),
        MAX_ENTRIES: 128,
        get: function(key) {
            if (this.cache.has(key)) {
                var entry = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, entry);
                return entry;
            }
            return null;
        },
        set: function(key, canvas) {
            if (this.cache.has(key)) return;
            if (this.cache.size >= this.MAX_ENTRIES) {
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }
            this.cache.set(key, canvas);
        }
    };
}

b.suite(
  'ShadowCache LRU implementation',

  b.add('Original (Array + Object)', () => {
    const cache = createOriginal();
    for (let i = 0; i < ITERS; i++) {
        const key = `key_${i % KEYS}`;
        if (!cache.get(key)) {
            cache.set(key, { data: i });
        }
    }
  }),

  b.add('Map LRU', () => {
    const cache = createMap();
    for (let i = 0; i < ITERS; i++) {
        const key = `key_${i % KEYS}`;
        if (!cache.get(key)) {
            cache.set(key, { data: i });
        }
    }
  }),

  b.cycle(),
  b.complete()
);
