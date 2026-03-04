const fs = require('fs');

// Simple mockup of the data
const CLOTHING_DB = [];
for (let i = 0; i < 1000; i++) {
  CLOTHING_DB.push({ id: `clothing_${i}`, type: 'test', color: 'red' });
}

const g_clothingCache = new Map();
const ITERATIONS = 100000;

function benchFind() {
  const start = process.hrtime.bigint();
  let count = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const idToFind = `clothing_${Math.floor(Math.random() * 1000)}`;
    const clothing = CLOTHING_DB.find(c => c.id === idToFind);
    if (clothing) count++;
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000; // ms
}

function benchMap() {
  const start = process.hrtime.bigint();
  let count = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const idToFind = `clothing_${Math.floor(Math.random() * 1000)}`;
    let clothing = g_clothingCache.get(idToFind);
    if (!clothing) {
      clothing = CLOTHING_DB.find(c => c.id === idToFind);
      if (clothing) g_clothingCache.set(idToFind, clothing);
    }
    if (clothing) count++;
  }
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000; // ms
}

// Warmup
benchFind();
benchMap();

console.log(`Array.find: ${benchFind().toFixed(2)} ms`);
console.log(`Map.get:    ${benchMap().toFixed(2)} ms`);
