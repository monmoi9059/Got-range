const { performance } = require('perf_hooks');

const ITERATIONS = 10000000;

function benchOriginal() {
    let totalScore = 0;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const hoopDX = i % 100 - 50;
        const hoopDY = i % 100 - 50;
        const distToHoopCenter = Math.sqrt(hoopDX * hoopDX + hoopDY * hoopDY);
        if (distToHoopCenter < 25) { totalScore += 1; }
    }
    const end = performance.now();
    console.log(`Original (hoop): ${end - start} ms`);
    return totalScore;
}

function benchOptimized() {
    let totalScore = 0;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const hoopDX = i % 100 - 50;
        const hoopDY = i % 100 - 50;
        const distToHoopCenterSq = hoopDX * hoopDX + hoopDY * hoopDY;
        if (distToHoopCenterSq < 625) { totalScore += 1; } // 25 * 25
    }
    const end = performance.now();
    console.log(`Optimized (hoop): ${end - start} ms`);
    return totalScore;
}

benchOriginal();
benchOptimized();
