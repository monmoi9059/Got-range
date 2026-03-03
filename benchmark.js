const PANTS_DB = [
    { id: 'pants_none', name: 'Aucun (Défaut)', cost: 0, type: 'none' },
    { id: 'pants_jeans', name: 'Jeans Bleus', cost: 500, type: 'long', color: '#000080' },
    { id: 'pants_jeans_black', name: 'Jeans Noirs', cost: 500, type: 'long', color: '#111' },
    { id: 'pants_khaki', name: 'Chinos', cost: 750, type: 'long', color: '#F0E68C' },
    { id: 'pants_camo', name: 'Treillis Camo', cost: 1000, type: 'long', color: '#556B2F' },
    { id: 'pants_joggers_grey', name: 'Joggers Gris', cost: 750, type: 'long', color: '#808080' },
    { id: 'pants_joggers_red', name: 'Joggers Rouges', cost: 750, type: 'long', color: '#FF0000' },
    { id: 'pants_track_blue', name: 'Survêt Bleu', cost: 1000, type: 'long', color: '#0000FF' },
    { id: 'pants_shorts_denim', name: 'Shorts Jeans', cost: 500, type: 'short', color: '#000080' },
    { id: 'pants_shorts_white', name: 'Shorts Blancs', cost: 500, type: 'short', color: '#FFF' },
    { id: 'pants_shorts_black', name: 'Shorts Noirs', cost: 500, type: 'short', color: '#000' },
    { id: 'pants_shorts_red', name: 'Shorts Rouges', cost: 500, type: 'short', color: '#FF0000' },
    { id: 'pants_shorts_camo', name: 'Shorts Camo', cost: 750, type: 'short', color: '#556B2F' },
    { id: 'pants_leggings', name: 'Leggings', cost: 1000, type: 'tights', color: '#000' },
    { id: 'pants_skirt_plaid', name: 'Kilt Écossais', cost: 1500, type: 'short', color: '#CC0000' },
    { id: 'pants_gold', name: 'Pantalons Or', cost: 5000, type: 'long', color: '#FFD700' },
    { id: 'pants_legend_wall', name: 'Shorts SPEEDY', cost: 1500, type: 'short', color: '#FFF', sideStripesColor: '#002B5C', trimColor: '#E31837', pattern: 'wizards' },
    { id: 'pants_legend_wall_alt', name: 'Shorts D.C.', cost: 1500, type: 'short', color: '#E31837', sideStripesColor: '#FFF', trimColor: '#002B5C' },
    { id: 'pants_legend_wall_rookie', name: 'Shorts ROOKIE', cost: 3000, type: 'short', color: '#002B5C', trimColor: '#C4A006' },
    { id: 'pants_legend_lebron', name: 'Shorts THE KING', cost: 7500, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
    { id: 'pants_legend_lebron_alt', name: 'Shorts KING', cost: 7500, type: 'short', color: '#000', sideStripesColor: '#E31837' },
    { id: 'pants_legend_lebron_cavs', name: 'Shorts KING', cost: 9000, type: 'short', color: '#6F263D', trimColor: '#FFB81C' },
    { id: 'pants_legend_kobe8', name: 'Shorts FROBE', cost: 9000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
    { id: 'pants_legend_kobe8_alt', name: 'Shorts MAMBA', cost: 9000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
    { id: 'pants_legend_kobe24', name: 'Shorts MAMBA', cost: 9000, type: 'short', color: '#FFF', trimColor: '#552583' },
    { id: 'pants_legend_kobe24_alt', name: 'Shorts EIGHT', cost: 9000, type: 'short', color: '#000', trimColor: '#FDB927' },
    { id: 'pants_legend_curry', name: 'Shorts CHEF', cost: 9000, type: 'short', color: '#1D428A', trimColor: '#FFC72C' },
    { id: 'pants_legend_curry_alt', name: 'Shorts CHEF', cost: 9000, type: 'short', color: '#FDB927', trimColor: '#1D428A' },
    { id: 'pants_legend_magic', name: 'Shorts MAGIC', cost: 9000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
    { id: 'pants_legend_magic_alt', name: 'Shorts MAGIC', cost: 9000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
    { id: 'pants_legend_drj', name: 'Shorts DOCTOR', cost: 10500, type: 'short', color: '#FFF', trimColor: '#ED174C' },
    { id: 'pants_legend_drj_alt', name: 'Shorts DOCTOR', cost: 10500, type: 'short', color: '#00285E', trimColor: '#E31837' },
    { id: 'pants_legend_wilt', name: 'Shorts STILT', cost: 12000, type: 'short', color: '#552583', sideStripesColor: '#FDB927' },
    { id: 'pants_legend_wilt_alt', name: 'Shorts THE STILT', cost: 12000, type: 'short', color: '#FFF', sideStripesColor: '#000' },
    { id: 'pants_legend_mj', name: 'Shorts G.O.A.T.', cost: 15000, type: 'short', color: '#CE1141', trimColor: '#000', pattern: 'bulls' },
    { id: 'pants_legend_mj_alt', name: 'Shorts G.O.A.T.', cost: 15000, type: 'short', color: '#000', pinstripesColor: '#CE1141' },
    { id: 'pants_legend_mj_wiz', name: 'Shorts G.O.A.T.', cost: 12000, type: 'short', color: '#002B5C', trimColor: '#C4A006' },
    { id: 'pants_legend_bird', name: 'Shorts LEGEND', cost: 12000, type: 'short', color: '#007A33', trimColor: '#FFF' },
    { id: 'pants_legend_bird_alt', name: 'Shorts LEGEND', cost: 12000, type: 'short', color: '#FFF', trimColor: '#007A33' },
    { id: 'pants_legend_shaq', name: 'Shorts DIESEL', cost: 12000, type: 'short', color: '#FDB927', sideStripesColor: '#552583' },
    { id: 'pants_legend_shaq_alt', name: 'Shorts DIESEL', cost: 12000, type: 'short', color: '#000', pinstripesColor: '#FFF' },
];

const targetId = 'pants_legend_shaq_alt';
const iterations = 1000000; // 1 million renders

// Baseline: Array.find
let startBaseline = process.hrtime.bigint();
let blackhole1 = null;
for (let i = 0; i < iterations; i++) {
    const pants = PANTS_DB.find(p => p.id === targetId);
    if (pants) {
        blackhole1 = pants.color;
    }
}
let endBaseline = process.hrtime.bigint();

// Optimized: Map.get
const pantsCache = new Map();
let startOptimized = process.hrtime.bigint();
let blackhole2 = null;
for (let i = 0; i < iterations; i++) {
    let pants = pantsCache.get(targetId);
    if (!pants) {
        pants = PANTS_DB.find(p => p.id === targetId);
        if (pants) pantsCache.set(targetId, pants);
    }
    if (pants) {
        blackhole2 = pants.color;
    }
}
let endOptimized = process.hrtime.bigint();

const baselineMs = Number(endBaseline - startBaseline) / 1000000;
const optimizedMs = Number(endOptimized - startOptimized) / 1000000;

console.log(`Baseline (Array.find): ${baselineMs.toFixed(2)}ms`);
console.log(`Optimized (Map cache): ${optimizedMs.toFixed(2)}ms`);
console.log(`Speedup: ${(baselineMs / optimizedMs).toFixed(2)}x faster`);
