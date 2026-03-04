const arraySize = 20; // Simulated typical array size for SCALE_OBJECTS / SHOES_DB
const mockData = [];
for (let i = 0; i < arraySize; i++) {
    mockData.push({ id: `id_${i}`, limit: i * 10 });
}

console.log("Array size:", arraySize);

console.time('Array.find()');
for (let i = 0; i < 100000; i++) {
    const item = mockData.find(x => x.limit > 150);
}
console.timeEnd('Array.find()');

console.time('Standard For Loop');
for (let i = 0; i < 100000; i++) {
    let item = null;
    for (let j = 0; j < mockData.length; j++) {
        if (mockData[j].limit > 150) {
            item = mockData[j];
            break;
        }
    }
}
console.timeEnd('Standard For Loop');
