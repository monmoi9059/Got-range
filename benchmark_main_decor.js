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
    { limit: 9999999, name: "DIMENSION TACO", type: 'grass', ground1: '#FF00FF', ground2: '#00FFFF', sky1: '#FFFF00', sky2: '#FF0000' }
];

const HOOP_POS = { x: 733, y: 150, z: 130 };
const PIXELS_PER_FOOT = 4.2426;

function runBaseline() {
    let total = 0;
    for(let i=0; i<4000; i++) {
        const dist = (i / 4000) * 120000;
        const dX = 733 - (dist * 0.7) + ((i % 1200) - 600);
        const dY = 150 + (dist * 0.7) + ((i % 1200) - 600);

        const sum = dX + dY;
        if (sum > 540 && sum < 810) continue;

        const dDist = Math.sqrt(Math.pow(dX - HOOP_POS.x, 2) + Math.pow(dY - HOOP_POS.y, 2));
        const feetDist = dDist / PIXELS_PER_FOOT;

        const decorZone = COURT_ZONES.find(z => feetDist < z.limit) || COURT_ZONES[COURT_ZONES.length-1];
        total += decorZone.limit;
    }
    return total;
}

function runOptimized() {
    let total = 0;
    for(let i=0; i<4000; i++) {
        const dist = (i / 4000) * 120000;
        const dX = 733 - (dist * 0.7) + ((i % 1200) - 600);
        const dY = 150 + (dist * 0.7) + ((i % 1200) - 600);

        const sum = dX + dY;
        if (sum > 540 && sum < 810) continue;

        const dx = dX - HOOP_POS.x;
        const dy = dY - HOOP_POS.y;
        const dDist = Math.sqrt(dx * dx + dy * dy);
        const feetDist = dDist / PIXELS_PER_FOOT;

        let decorZone = COURT_ZONES[COURT_ZONES.length-1];
        for (let j = 0; j < COURT_ZONES.length; j++) {
            if (feetDist < COURT_ZONES[j].limit) {
                decorZone = COURT_ZONES[j];
                break;
            }
        }
        total += decorZone.limit;
    }
    return total;
}

const iters = 1000;

const startB = process.hrtime.bigint();
for (let i = 0; i < iters; i++) runBaseline();
const endB = process.hrtime.bigint();

const startO = process.hrtime.bigint();
for (let i = 0; i < iters; i++) runOptimized();
const endO = process.hrtime.bigint();

const msB = Number(endB - startB) / 1000000;
const msO = Number(endO - startO) / 1000000;

console.log(`Baseline: ${msB.toFixed(2)}ms`);
console.log(`Optimized: ${msO.toFixed(2)}ms`);
console.log(`Speedup: ${(msB / msO).toFixed(2)}x`);