const fs = require('fs');

const COURT_ZONES = [
    { limit: 50, name: "COUR ARRIÈRE", type: 'grass', ground1: '#228B22', ground2: '#32CD32', sky1: '#87CEEB', sky2: '#FFF' },
    { limit: 100, name: "PARC DE LA PAIX", type: 'tree', ground1: '#8B4513', ground2: '#D2691E', sky1: '#87CEEB', sky2: '#E0FFFF' },
    { limit: 200, name: "VIEUX-LÉVIS", type: 'castle', ground1: '#8B0000', ground2: '#A52A2A', sky1: '#4682B4', sky2: '#87CEEB' },
    { limit: 350, name: "TERRAIN DE RUE", type: 'castle', ground1: '#696969', ground2: '#808080', sky1: '#4682B4', sky2: '#87CEEB' },
    { limit: 500, name: "FORÊT BORÉALE", type: 'tree', ground1: '#006400', ground2: '#2F4F4F', sky1: '#2E8B57', sky2: '#8FBC8F' },
    { limit: 750, name: "LA PATINOIRE", type: 'mountain', ground1: '#E0FFFF', ground2: '#FFFFFF', sky1: '#87CEEB', sky2: '#F0F8FF' },
    { limit: 1000, name: "FLEUVE ST-LAURENT", type: 'water', ground1: '#00008B', ground2: '#1E90FF', sky1: '#191970', sky2: '#4169E1' },
    { limit: 1500, name: "MONT-SAINTE-ANNE", type: 'mountain', ground1: '#F0FFFF', ground2: '#E0FFFF', sky1: '#87CEEB', sky2: '#00BFFF' },
    { limit: 2500, name: "HAUTE ATMOSPHÈRE", type: 'space', ground1: '#483D8B', ground2: '#6A5ACD', sky1: '#000080', sky2: '#000000' },
    { limit: 4000, name: "BASE LUNAIRE", type: 'space', ground1: '#808080', ground2: '#A9A9A9', sky1: '#000000', sky2: '#191970' },
    { limit: 6000, name: "MARS", type: 'space', ground1: '#8B4513', ground2: '#CD853F', sky1: '#FF4500', sky2: '#000000' },
    { limit: 8000, name: "LE NETHER", type: 'space', ground1: '#8B0000', ground2: '#2F0000', sky1: '#330000', sky2: '#000000' },
    { limit: 12000, name: "CITÉ ENGLOUTIE", type: 'water', ground1: '#000080', ground2: '#008B8B', sky1: '#0000CD', sky2: '#00008B' },
    { limit: 18000, name: "VOLCAN EN ÉRUPTION", type: 'mountain', ground1: '#800000', ground2: '#B22222', sky1: '#FF4500', sky2: '#8B0000' },
    { limit: 9999999, name: "DIMENSION TACO", type: 'grass', ground1: '#FF00FF', ground2: '#00FFFF', sky1: '#FFFF00', sky2: '#FF0000' }
];

const HOOP_POS = { x: 733, y: 150, z: 130 };
const PIXELS_PER_FOOT = 4.2426;
const MIN_HOUSE_DIST_SQ = 600 * 600;

function runBaseline() {
    let decors = [];
    let placedHouses = [];

    for(let i=0; i<4000; i++) {
        const dist = Math.random() * 120000;
        const pathX = 733 - (dist * 0.7);
        const pathY = 150 + (dist * 0.7);
        const scatter = (Math.random() - 0.5) * 1200;

        const dX = pathX + scatter;
        const dY = pathY + scatter;

        const dx = dX - HOOP_POS.x;
        const dy = dY - HOOP_POS.y;
        const distSq = dx * dx + dy * dy;
        const dDist = Math.sqrt(distSq);

        // Convert Pixel Distance to Game Feet for Zone Lookup
        const feetDist = dDist / PIXELS_PER_FOOT;

        let decorZone = COURT_ZONES[COURT_ZONES.length-1];
        for (let j = 0; j < COURT_ZONES.length; j++) {
            if (feetDist < COURT_ZONES[j].limit) {
                decorZone = COURT_ZONES[j];
                break;
            }
        }

        const isHouse = decorZone.type === 'castle'; // Residential Houses

        // Safety Corridor Check: Prevent objects between player (sum=600) and hoop (sum=750)
        // Houses are scaled up ~4x, so we need a much wider safety corridor to avoid blocking the lane.
        const sum = dX + dY;
        if (isHouse) {
            if (sum > 200 && sum < 1150) continue;

            // House minimum distance check
            let tooClose = false;
            for (let h = 0; h < placedHouses.length; h++) {
                const hx = placedHouses[h].x - dX;
                const hy = placedHouses[h].y - dY;
                if ((hx * hx + hy * hy) < MIN_HOUSE_DIST_SQ) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
        } else {
            if (sum > 540 && sum < 810) continue;
        }

        let variant = 'default';
        if(decorZone.type === 'tree') {
             variant = (decorZone.name.includes("FORÊT") || decorZone.name.includes("MONT")) ? 'pine' : 'oak';
        }
        decors.push({ x: dX, y: dY, dist: dist, zoneType: decorZone.type, variant: variant, seed: Math.random() });
        if (isHouse) placedHouses.push({ x: dX, y: dY });
    }
    return decors.length;
}

function runOptimized() {
    let decors = [];
    let placedHouses = [];

    // Precalculate limits squared
    const zoneLimitsSq = COURT_ZONES.map(z => z.limit * z.limit);
    const PIXELS_PER_FOOT_SQ = PIXELS_PER_FOOT * PIXELS_PER_FOOT;

    for(let i=0; i<4000; i++) {
        const dist = Math.random() * 120000;
        const pathX = 733 - (dist * 0.7);
        const pathY = 150 + (dist * 0.7);
        const scatter = (Math.random() - 0.5) * 1200;

        const dX = pathX + scatter;
        const dY = pathY + scatter;

        const dx = dX - HOOP_POS.x;
        const dy = dY - HOOP_POS.y;
        const distSq = dx * dx + dy * dy;

        // OPTIMIZATION: Use squared distance for zone lookup
        const feetDistSq = distSq / PIXELS_PER_FOOT_SQ;

        let decorZone = COURT_ZONES[COURT_ZONES.length-1];
        for (let j = 0; j < COURT_ZONES.length; j++) {
            if (feetDistSq < zoneLimitsSq[j]) {
                decorZone = COURT_ZONES[j];
                break;
            }
        }

        const isHouse = decorZone.type === 'castle'; // Residential Houses

        // Safety Corridor Check: Prevent objects between player (sum=600) and hoop (sum=750)
        // Houses are scaled up ~4x, so we need a much wider safety corridor to avoid blocking the lane.
        const sum = dX + dY;
        if (isHouse) {
            if (sum > 200 && sum < 1150) continue;

            // House minimum distance check
            let tooClose = false;
            for (let h = 0; h < placedHouses.length; h++) {
                const hx = placedHouses[h].x - dX;
                const hy = placedHouses[h].y - dY;
                if ((hx * hx + hy * hy) < MIN_HOUSE_DIST_SQ) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
        } else {
            if (sum > 540 && sum < 810) continue;
        }

        let variant = 'default';
        if(decorZone.type === 'tree') {
             variant = (decorZone.name.includes("FORÊT") || decorZone.name.includes("MONT")) ? 'pine' : 'oak';
        }
        decors.push({ x: dX, y: dY, dist: dist, zoneType: decorZone.type, variant: variant, seed: Math.random() });
        if (isHouse) placedHouses.push({ x: dX, y: dY });
    }
    return decors.length;
}

// Warmup
for(let i=0; i<100; i++) { runBaseline(); runOptimized(); }

const ITERATIONS = 1000;

console.log("Measuring Baseline...");
const start1 = process.hrtime.bigint();
for(let i=0; i<ITERATIONS; i++) {
    runBaseline();
}
const end1 = process.hrtime.bigint();
const baselineTime = Number(end1 - start1) / 1e6;

console.log("Measuring Optimized...");
const start2 = process.hrtime.bigint();
for(let i=0; i<ITERATIONS; i++) {
    runOptimized();
}
const end2 = process.hrtime.bigint();
const optimizedTime = Number(end2 - start2) / 1e6;

console.log(`Baseline Time: ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized Time: ${optimizedTime.toFixed(2)} ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}% faster`);
