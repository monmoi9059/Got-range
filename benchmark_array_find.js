const { performance } = require('perf_hooks');

const SCALE_OBJECTS = [
    { limit: 15, name: "Voiture Compacte", icon: "🚗" },
    { limit: 25, name: "Orignal (2m)", icon: "🦌" },
    { limit: 30, name: "Ligne de 3 points", icon: "🏀" },
    { limit: 40, name: "Autobus Scolaire", icon: "🚌" },
    { limit: 60, name: "Piste de Bowling", icon: "🎳" },
    { limit: 94, name: "Terrain NBA", icon: "🏀" },
    { limit: 150, name: "Baleine Bleue", icon: "🐋" },
    { limit: 195, name: "Tour de Pise", icon: "🇮🇹", type: 'landmark_leaning' },
    { limit: 230, name: "Envergure Boeing 747", icon: "✈️" },
    { limit: 272, name: "Chute Montmorency", icon: "🌊" },
    { limit: 305, name: "Statue de la Liberté", icon: "🗽", type: 'landmark_statue' },
    { limit: 350, name: "Château Frontenac", icon: "🏰", type: 'landmark_castle' },
    { limit: 450, name: "Pyramide de Gizeh", icon: "🔺", type: 'landmark_pyramid' },
    { limit: 600, name: "Space Needle", icon: "🛸", type: 'landmark_needle' },
    { limit: 984, name: "Tour Eiffel", icon: "🇫🇷", type: 'landmark_tower' },
    { limit: 1454, name: "Empire State Building", icon: "🏙️", type: 'landmark_building', color: '#555' },
    { limit: 1815, name: "Tour CN", icon: "🗼", type: 'landmark_needle' },
    { limit: 2200, name: "Pont de Québec (Travée)", icon: "🌉" },
    { limit: 2717, name: "Burj Khalifa", icon: "🏢", type: 'landmark_building', color: '#AAA' },
    { limit: 5280, name: "Un Mille (1.6km)", icon: "🛣️" },
    { limit: 10000, name: "Piste Aéroport", icon: "🛫" },
    { limit: 14410, name: "Mont Rainier", icon: "🏔️" },
    { limit: 20310, name: "Mont Denali", icon: "⛰️" },
    { limit: 29029, name: "Mont Everest", icon: "🗻" },
    { limit: 35000, name: "Altitude de Croisière", icon: "✈️" },
    { limit: 100000, name: "Stratosphère", icon: "🎈" },
    { limit: 328000, name: "Ligne de Kármán (Espace)", icon: "🌌" },
    { limit: 1300000, name: "Station Spatiale (ISS)", icon: "🛰️" },
    { limit: 9999999, name: "La Lune", icon: "🌑" }
];

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

// ORIGINAL IMPLEMENTATION
let _lastScaleDist = -1;
let _lastScaleObj = null;
function getScaleObjectFind(dist) {
    if (dist === _lastScaleDist) return _lastScaleObj;
    _lastScaleDist = dist;
    _lastScaleObj = SCALE_OBJECTS.find(o => dist < o.limit) || SCALE_OBJECTS[SCALE_OBJECTS.length-1]; // Small array, keep find
    return _lastScaleObj;
}

let _lastCourtDist = -1;
let _lastCourtObj = null;
function getCourtDetailsFind(dist) {
    if (dist === _lastCourtDist) return _lastCourtObj;
    _lastCourtDist = dist;
    _lastCourtObj = COURT_ZONES.find(z => dist < z.limit) || COURT_ZONES[COURT_ZONES.length-1]; // Small array, keep find
    return _lastCourtObj;
}

// OPTIMIZED IMPLEMENTATION
let _lastScaleDistOpt = -1;
let _lastScaleObjOpt = null;
function getScaleObjectFor(dist) {
    if (dist === _lastScaleDistOpt) return _lastScaleObjOpt;
    _lastScaleDistOpt = dist;
    for (let i = 0; i < SCALE_OBJECTS.length; i++) {
        if (dist < SCALE_OBJECTS[i].limit) {
            _lastScaleObjOpt = SCALE_OBJECTS[i];
            return _lastScaleObjOpt;
        }
    }
    _lastScaleObjOpt = SCALE_OBJECTS[SCALE_OBJECTS.length-1];
    return _lastScaleObjOpt;
}

let _lastCourtDistOpt = -1;
let _lastCourtObjOpt = null;
function getCourtDetailsFor(dist) {
    if (dist === _lastCourtDistOpt) return _lastCourtObjOpt;
    _lastCourtDistOpt = dist;
    for (let i = 0; i < COURT_ZONES.length; i++) {
        if (dist < COURT_ZONES[i].limit) {
            _lastCourtObjOpt = COURT_ZONES[i];
            return _lastCourtObjOpt;
        }
    }
    _lastCourtObjOpt = COURT_ZONES[COURT_ZONES.length-1];
    return _lastCourtObjOpt;
}

const ITERATIONS = 10000000;
const DISTANCES_TO_TEST = [10, 100, 500, 1000, 5000, 20000, 100000, 2000000];

function runBenchmark(name, fn, items) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const dist = items[i % items.length];
        fn(dist);
    }
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return end - start;
}

console.log("Warming up...");
runBenchmark("Warmup Find Scale", getScaleObjectFind, DISTANCES_TO_TEST);
runBenchmark("Warmup For Scale", getScaleObjectFor, DISTANCES_TO_TEST);

console.log("\nRunning Benchmarks...");
const scaleFindTime = runBenchmark("Array.find getScaleObject", getScaleObjectFind, DISTANCES_TO_TEST);
const scaleForTime = runBenchmark("For loop getScaleObject", getScaleObjectFor, DISTANCES_TO_TEST);
const courtFindTime = runBenchmark("Array.find getCourtDetails", getCourtDetailsFind, DISTANCES_TO_TEST);
const courtForTime = runBenchmark("For loop getCourtDetails", getCourtDetailsFor, DISTANCES_TO_TEST);

console.log(`\nResults:`);
console.log(`getScaleObject: For loop is ${(scaleFindTime / scaleForTime).toFixed(2)}x faster`);
console.log(`getCourtDetails: For loop is ${(courtFindTime / courtForTime).toFixed(2)}x faster`);
