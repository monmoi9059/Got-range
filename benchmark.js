const fs = require('fs');

// We execute data.js in the global scope
const dataContent = fs.readFileSync('js/data.js', 'utf8');
eval(dataContent);

// By evaluating dataContent, var DAILY_CHALLENGES and var WEEKLY_CHALLENGES are created.

let playerData = {
    dailyChallenges: [],
    weeklyChallenges: []
};

// Fill some simulated player data
for (let i = 0; i < 5; i++) {
    playerData.dailyChallenges.push({ id: DAILY_CHALLENGES[i].id, progress: 0, claimed: false });
    playerData.weeklyChallenges.push({ id: WEEKLY_CHALLENGES[i].id, progress: 0, claimed: false });
}

// Emulate original updateChallenge
function originalUpdateChallenge(userC, type, amount, db) {
    if(userC.claimed) return;
    const def = db.find(d => d.id === userC.id);
    if(!def) return;
    if(def.type === type) {
        userC.progress += amount;
    }
}

function processAllChallengesOriginal(type, amount) {
    if(playerData.dailyChallenges) playerData.dailyChallenges.forEach(c => originalUpdateChallenge(c, type, amount, DAILY_CHALLENGES));
    if(playerData.weeklyChallenges) playerData.weeklyChallenges.forEach(c => originalUpdateChallenge(c, type, amount, WEEKLY_CHALLENGES));
}

// Emulate optimized updateChallenge
const dailyChallengesMap = new Map();
DAILY_CHALLENGES.forEach(c => dailyChallengesMap.set(c.id, c));

const weeklyChallengesMap = new Map();
WEEKLY_CHALLENGES.forEach(c => weeklyChallengesMap.set(c.id, c));

function optimizedUpdateChallenge(userC, type, amount, dbMap) {
    if(userC.claimed) return;
    const def = dbMap.get(userC.id);
    if(!def) return;
    if(def.type === type) {
        userC.progress += amount;
    }
}

function processAllChallengesOptimized(type, amount) {
    if(playerData.dailyChallenges) playerData.dailyChallenges.forEach(c => optimizedUpdateChallenge(c, type, amount, dailyChallengesMap));
    if(playerData.weeklyChallenges) playerData.weeklyChallenges.forEach(c => optimizedUpdateChallenge(c, type, amount, weeklyChallengesMap));
}

// Benchmarking
const ITERATIONS = 1000000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    processAllChallengesOriginal('makes', 1);
}
let originalTime = performance.now() - start;
console.log(`Original: ${originalTime.toFixed(2)}ms`);

// Reset progress just in case
for (let i = 0; i < 5; i++) {
    playerData.dailyChallenges[i].progress = 0;
    playerData.weeklyChallenges[i].progress = 0;
}

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    processAllChallengesOptimized('makes', 1);
}
let optimizedTime = performance.now() - start;
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);

const speedup = originalTime / optimizedTime;
console.log(`Speedup: ${speedup.toFixed(2)}x`);
