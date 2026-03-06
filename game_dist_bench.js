const { performance } = require('perf_hooks');

const HOOP_POS = { x: 0, y: 1000, z: 100 };
const player3D = { x: 0, y: 0 };
const ITERATIONS = 10000000;

function benchOriginal() {
    let totalScore = 0;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const crossX = i % 100;
        const crossY = i % 100;
        const hoopDX = crossX - HOOP_POS.x;
        const hoopDY = crossY - HOOP_POS.y;
        const distToHoopCenter = Math.sqrt(hoopDX * hoopDX + hoopDY * hoopDY);
        if (distToHoopCenter < 25) { totalScore += 1; }

        const bDX = crossX - player3D.x;
        const bDY = crossY - player3D.y;

        const pDX = HOOP_POS.x - player3D.x;
        const pDY = HOOP_POS.y - player3D.y;
        const distToHoop = Math.sqrt(pDX * pDX + pDY * pDY);

        const currentDist = Math.sqrt(bDX * bDX + bDY * bDY);
        if (currentDist > distToHoop + 5000) { totalScore += 1; }
    }
    const end = performance.now();
    console.log(`Original: ${end - start} ms`);
    return totalScore;
}

function benchOptimized() {
    let totalScore = 0;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const crossX = i % 100;
        const crossY = i % 100;
        const hoopDX = crossX - HOOP_POS.x;
        const hoopDY = crossY - HOOP_POS.y;
        const distToHoopCenterSq = hoopDX * hoopDX + hoopDY * hoopDY;
        if (distToHoopCenterSq < 625) { totalScore += 1; } // 25 * 25

        const bDX = crossX - player3D.x;
        const bDY = crossY - player3D.y;

        const pDX = HOOP_POS.x - player3D.x;
        const pDY = HOOP_POS.y - player3D.y;
        const distToHoop = Math.sqrt(pDX * pDX + pDY * pDY);
        const distToHoopPlus5000Sq = (distToHoop + 5000) * (distToHoop + 5000);

        const currentDistSq = bDX * bDX + bDY * bDY;
        if (currentDistSq > distToHoopPlus5000Sq) { totalScore += 1; }
    }
    const end = performance.now();
    console.log(`Optimized: ${end - start} ms`);
    return totalScore;
}

benchOriginal();
benchOptimized();
