const fs = require('fs');

// Create mock data arrays (100 items each to simulate worst-case lookup)
const mockDB = [];
for (let i = 0; i < 100; i++) {
    mockDB.push({ id: `item_${i}`, value: i });
}

// 1. Array.find() benchmark
console.time('Array.find()');
for (let i = 0; i < 100000; i++) {
    const item = mockDB.find(x => x.id === 'item_99');
}
console.timeEnd('Array.find()');

// 2. Map cache benchmark (First miss, then hit)
const cache = new Map();
console.time('Map Cache');
for (let i = 0; i < 100000; i++) {
    let item = cache.get('item_99');
    if (!item) {
        // First lookup using standard for-loop to populate cache instead of find()
        for (let j = 0; j < mockDB.length; j++) {
            if (mockDB[j].id === 'item_99') {
                item = mockDB[j];
                break;
            }
        }
        cache.set('item_99', item);
    }
}
console.timeEnd('Map Cache');

// 3. For loop benchmark (No cache, replacing Array.find())
console.time('For Loop (No Cache)');
for (let i = 0; i < 100000; i++) {
    let item = null;
    for (let j = 0; j < mockDB.length; j++) {
        if (mockDB[j].id === 'item_99') {
            item = mockDB[j];
            break;
        }
    }
}
console.timeEnd('For Loop (No Cache)');
