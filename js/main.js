
    // Global Animation State
    var g_animState = { la: DEFAULT_IDLE.la, ra: DEFAULT_IDLE.ra, lfa: DEFAULT_IDLE.lfa, rfa: DEFAULT_IDLE.rfa, w: DEFAULT_IDLE.w };
    var g_animTarget = { la: DEFAULT_IDLE.la, ra: DEFAULT_IDLE.ra, lfa: DEFAULT_IDLE.lfa, rfa: DEFAULT_IDLE.rfa, w: DEFAULT_IDLE.w };
    var g_breathingPhase = 0;

    // Center of screen is 1066/2 = 533.
    // Shift hoop to x=600 is fine (slightly right),
    // but we might want to center the "court path" a bit more.
    const HOOP_POS = { x: 733, y: 150, z: 130 }; // Moved +133 to account for +266 width
    const PIXELS_PER_FOOT = 4.2426;

    var decors = [];
    // Increased range to ~120,000 pixels (approx 28,000 feet) to cover late game
    // Increased count to 4000 to maintain density
    for(let i=0; i<4000; i++) {
        const dist = Math.random() * 120000;
        const pathX = 733 - (dist * 0.7);
        const pathY = 150 + (dist * 0.7);
        const scatter = (Math.random() - 0.5) * 1200;

        const dX = pathX + scatter;
        const dY = pathY + scatter;

        // Safety Corridor Check: Prevent objects between player (sum=600) and hoop (sum=750)
        // Player Width ~30 units. Safety = 1.5x (~45).
        // Corridor: [600 - 60, 750 + 60] -> [540, 810]
        const sum = dX + dY;
        if (sum > 540 && sum < 810) continue;

        const dDist = Math.sqrt(Math.pow(dX - HOOP_POS.x, 2) + Math.pow(dY - HOOP_POS.y, 2));

        // Convert Pixel Distance to Game Feet for Zone Lookup
        const feetDist = dDist / PIXELS_PER_FOOT;

        const decorZone = COURT_ZONES.find(z => feetDist < z.limit) || COURT_ZONES[COURT_ZONES.length-1];
        let variant = 'default';
        if(decorZone.type === 'tree') {
             variant = (decorZone.name.includes("FORÊT") || decorZone.name.includes("MONT")) ? 'pine' : 'oak';
        }
        decors.push({ x: dX, y: dY, dist: dist, zoneType: decorZone.type, variant: variant, seed: Math.random() });
    }

    // Crowd Generation (Stands along the side)
    for(let d = 500; d < 120000; d += 800) {
        const pathX = 733 - (d * 0.7);
        const pathY = 150 + (d * 0.7);
        const offset = 400;
        const density = Math.min(1.0, d/50000);

        // Left Stand
        if (Math.random() > 0.3) {
             decors.push({ x: pathX - offset, y: pathY - offset, dist: d, zoneType: 'crowd', variant: {side:'left', density:density}, seed: Math.random() });
        }
        // Right Stand
        if (Math.random() > 0.3) {
             decors.push({ x: pathX + offset, y: pathY + offset, dist: d, zoneType: 'crowd', variant: {side:'right', density:density}, seed: Math.random() });
        }
    }

    // LANDMARK GENERATION
    SCALE_OBJECTS.forEach(obj => {
        if (obj.type) {
            const dist = obj.limit * PIXELS_PER_FOOT;
            const pathX = 733 - (dist * 0.7);
            const pathY = 150 + (dist * 0.7);
            // Place landmarks mostly centered but pushed back or offset
            const offset = (Math.random() > 0.5 ? 1 : -1) * (300 + Math.random()*200);
            decors.push({ x: pathX + offset, y: pathY + offset, dist: dist, zoneType: obj.type, variant: obj, seed: Math.random() });
        }
    });

    // TACO CAT: One per zone guaranteed
    for(let i=0; i<COURT_ZONES.length; i++) {
        const z = COURT_ZONES[i];
        const prevLimit = (i === 0) ? 0 : COURT_ZONES[i-1].limit;
        const range = Math.min(z.limit, prevLimit + 3000) - prevLimit; // Cap range slightly for large zones

        const dist = prevLimit + Math.random() * range; // This is FEET

        // Convert Feet to Pixels for Coordinate Calculation
        const pixelDist = dist * PIXELS_PER_FOOT;

        const pathX = 733 - (pixelDist * 0.7);
        const pathY = 150 + (pixelDist * 0.7);

        let dX, dY;
        let attempts = 0;
        do {
            const scatter = (Math.random() - 0.5) * 1000;
            dX = pathX + scatter;
            dY = pathY + scatter;
            attempts++;
        } while (attempts < 10 && (dX + dY > 540 && dX + dY < 810));

        decors.push({ x: dX, y: dY, dist: pixelDist, zoneType: 'tacocat', variant: 'default', seed: Math.random() });
    }

    // OPTIMIZATION: Sort decors by distance from hoop to allow early exit in render loop
    decors.sort((a, b) => a.dist - b.dist);

    var clouds = [];
    var mountainLayers = [];

    function initBackgroundElements() {
        // Clouds
        clouds = [];
        for(let i=0; i<8; i++) {
            let c = {
                x: Math.random() * 2000,
                y: Math.random() * 200,
                speed: 0.1 + Math.random() * 0.2,
                scale: 0.8 + Math.random() * 0.8,
                puffs: []
            };
            let numPuffs = 4 + Math.floor(Math.random() * 5);
            for(let j=0; j<numPuffs; j++) {
                c.puffs.push({
                    dx: (Math.random() - 0.5) * 60,
                    dy: (Math.random() - 0.5) * 30,
                    r: 25 + Math.random() * 25
                });
            }
            clouds.push(c);
        }

        // Mountain Layers
        mountainLayers = [];
        const colors = ['#2F4F4F', '#243b3b', '#162424'];
        const baseHeights = [250, 180, 120];
        const speeds = [0.02, 0.05, 0.1];

        for(let L=0; L<3; L++) {
            let points = [];
            let x = 0;
            let y = Math.random() * baseHeights[L];
            // Generate a looped path
            while(x <= 2200) { // Enough for screen width + shift
                 points.push({x: x, y: y});
                 x += 40 + Math.random() * 60;
                 y += (Math.random() - 0.5) * 100;
                 if(y < 50) y = 50; if(y > baseHeights[L] + 100) y = baseHeights[L] + 100;
            }
            // Smooth loop?
            points[points.length-1].y = points[0].y;
            mountainLayers.push({ points: points, color: colors[L], speed: speeds[L] });
        }
    }
    initBackgroundElements();

    var bgCache = null;

    // --- OPTIMIZATION: Render Object Pooling ---
    // Monomorphic class for V8 optimization
    class RenderItem {
        constructor() {
            this.type = null;
            this.depth = 0;
            this.x = 0;
            this.y = 0;
            this.scale = 0;
            this.zoneType = null;
            this.variant = null;
            this.seed = 0;
            this.alpha = 0;
            this.color = null;
            this.ballRef = null;
        }
    }

    var g_renderItemPool = [];
    var g_renderList = [];
    let g_poolIndex = 0;

    function getRenderItem() {
        let obj;
        if (g_poolIndex < g_renderItemPool.length) {
            obj = g_renderItemPool[g_poolIndex];
        } else {
            obj = new RenderItem();
            g_renderItemPool.push(obj);
        }
        g_poolIndex++;
        return obj;
    }

    // Pre-allocate some objects
    for(let i=0; i<1000; i++) {
        g_renderItemPool.push(new RenderItem());
    }

    // --- OPTIMIZATION: Cached Shooting Style ---
    let g_cachedStyleId = null;
    let g_cachedStyleObj = null;

    function getCurrentStyle() {
        const currentId = playerData.currentStyle || 'classic';
        if (currentId !== g_cachedStyleId || !g_cachedStyleObj) {
            g_cachedStyleObj = SHOOTING_STYLES.find(s => s.id === currentId) || SHOOTING_STYLES[0];
            g_cachedStyleId = currentId;
        }
        return g_cachedStyleObj;
    }

    function isMechanicalSkin(skinId) {
        if (!skinId) return false;
        const s = skinId.toLowerCase();
        return s.includes('robot') || s.includes('cyborg') || s.includes('mech') || s.includes('cyber') || s.includes('android');
    }

    // --- OPTIMIZATION: Fuzzy Noise Lookup Table ---
    const NOISE_LUT_SIZE = 4096;
    const g_noiseLUT = new Float32Array(NOISE_LUT_SIZE);
    for (let i = 0; i < NOISE_LUT_SIZE; i++) {
        g_noiseLUT[i] = Math.random();
    }


    function binarySearchLowerBound(arr, val) {
        let l = 0, r = arr.length - 1;
        let idx = arr.length; // Default if not found (all smaller)
        while (l <= r) {
            let m = (l + r) >>> 1; // Unsigned right shift for floor
            if (arr[m].dist >= val) {
                idx = m;
                r = m - 1;
            } else {
                l = m + 1;
            }
        }
        return idx;
    }

    // --- 1.5 AUDIO SYSTEM (RETRO SYNTH) ---
    // --- 2. GLOBAL VARIABLES ---
    const canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');

    // Optimization: Pre-calculated Sun Gradient
    const sunGradient = ctx.createRadialGradient(700, 80, 0, 700, 80, 80);
    sunGradient.addColorStop(0, '#FFD700');
    sunGradient.addColorStop(0.5, '#FFD700'); // Solid core (r=40)
    sunGradient.addColorStop(0.6, 'rgba(255, 165, 0, 0.5)'); // Glow start
    sunGradient.addColorStop(1, 'rgba(255, 165, 0, 0)'); // Fade out

    const scoreEl = document.getElementById('scoreVal');
    const shopUI = document.getElementById('shopUI');
    const achUI = document.getElementById('achUI');
    const statsUI = document.getElementById('statsUI');
    const notif = document.getElementById('notification');
    const courtNameEl = document.getElementById('courtNameDisplay');
    const missValEl = document.getElementById('missVal');
    const container = document.getElementById('game-container');

    canvas.width = 1066;
    canvas.height = 600;

    let viewingAnimalIndex = 0;
    let viewingSkinIndex = 0;
    let viewingHatIndex = 0;
    let viewingStyleIndex = 0;
    let viewingBallIndex = 0;
    let currentGameMode = 'CLASSIC';
    let contestData = { timer: 60, score: 0, rack: 1, ballsInRack: 0, isActive: false };
let lastDisplayedContestTime = -1;
    let distanceLevel = 1;
    var state = 'IDLE';
    let feedback = "";
    let feedbackTimer = 0;
    let crowdCheerTimer = 0;
    let consecutiveMisses = 0;
    var currentStreak = 0;
    let spacePressed = false;
    let cameraZoom = 800;
    let cameraHeight = 300;
    let g_camCache = null; // Optimization: Per-frame camera cache
    let resetStage = 0;
    let isGroundedShot = false;
    let groundShotTimer = 0;
    let airbudJumpTime = 0;

    // Physique
    const GRAVITY = 0.5;
    const DEBUG = false;
    // Shift player start position to match new center (300 -> 433)
    var player3D = { x: 433, y: 300, z: 0, vz: 0 };
    var ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, active: false, isFire: false, trail: [], rotationX: 0 };
    var activeBalls = [];
    var timeAttackData = { timer: 60, score: 0, highScore: 0, active: false };
    var particles = [];

    // Expose for debugging
    if (DEBUG) {
        window.player3D = player3D;
        window.state = state;
    }

    function createDefaultData() {
        return {
            tacos: 0, level: 1, difficulty: 1.0, highScore: 10,
            stats: { income: 1, aim: 1, luck: 1, moonwalk: 1, extraLives: 0 },
            purchasedStats: { income: 1, aim: 1, luck: 1, moonwalk: 1, extraLives: 0 },
            lifetimeStats: { shots: 0, makes: 0, misses: 0, contests: 0 },
            dailyChallenge: { date: '', id: '', progress: 0, claimed: false },
            unlockedSkins: ['human_anchor', 'rat_classic'], currentSkin: 'human_anchor', unlockedAchievements: [],
            unlockedStyles: ['classic'], currentStyle: 'classic', unlockedBalls: ['ball_classic'], currentBall: 'ball_classic', isLefty: false,
            unlockedHats: ['hat_none'], currentHat: 'hat_none',
            mobileControls: false, platformChosen: false,
            meterEnabled: true, meterShape: 'arc', meterScale: 1.0,
            releaseTiming: 3,
            graphics: 'HIGH',
            currentTrackIndex: 0,
            leaderboards: { classic: [], contest: [], time_attack: [] },
            inputMap: { p1: -1, p2: -1 }
        };
    }

    let savedData = localStorage.getItem('tacoSaveData');
    let playerData = savedData ? JSON.parse(savedData) : createDefaultData();

    // Migration logic to fix old saves
    if(!playerData.unlockedAchievements) playerData.unlockedAchievements = [];
    if(!playerData.stats.income) playerData.stats.income = 1;
    if(!playerData.stats.moonwalk) playerData.stats.moonwalk = 1;
    if(!playerData.inputMap) playerData.inputMap = { p1: -1, p2: -1 };
    if(typeof playerData.stats.extraLives === 'undefined') playerData.stats.extraLives = 0;
    if(!playerData.lifetimeStats) playerData.lifetimeStats = { shots: 0, makes: 0, misses: 0, contests: 0 };
    if(!playerData.unlockedSkins) playerData.unlockedSkins = ['rat_classic'];
    if(!playerData.currentSkin) playerData.currentSkin = 'rat_classic';
    if(!playerData.unlockedStyles) playerData.unlockedStyles = ['classic'];
    if(!playerData.currentStyle) playerData.currentStyle = 'classic';
    if(typeof playerData.isLefty === 'undefined') playerData.isLefty = false;
    if(!playerData.leaderboards) playerData.leaderboards = { classic: [], contest: [], time_attack: [] };
    if(typeof playerData.platformChosen === 'undefined') playerData.platformChosen = false;
    if(!playerData.dailyChallenge) playerData.dailyChallenge = { date: '', id: '', progress: 0, claimed: false };
    if(typeof playerData.meterEnabled === 'undefined') playerData.meterEnabled = true;
    if(typeof playerData.meterShape === 'undefined') playerData.meterShape = 'arc';
    if(typeof playerData.releaseTiming === 'undefined') playerData.releaseTiming = 3;
    if(typeof playerData.graphics === 'undefined') playerData.graphics = 'HIGH';
    if(typeof playerData.currentTrackIndex === 'undefined') playerData.currentTrackIndex = 0;
    if(!playerData.leaderboards) playerData.leaderboards = { classic: [], contest: [], time_attack: [] };
    if(!playerData.unlockedHats) playerData.unlockedHats = ['hat_none'];
    if(!playerData.currentHat) playerData.currentHat = 'hat_none';

    // Migration: purchasedStats
    if (!playerData.purchasedStats) {
        playerData.purchasedStats = {
            income: playerData.stats.income || 1,
            aim: playerData.stats.aim || 1,
            luck: playerData.stats.luck || 1,
            moonwalk: playerData.stats.moonwalk || 1,
            extraLives: (typeof playerData.stats.extraLives !== 'undefined') ? playerData.stats.extraLives : 0
        };
    }

    // Don't auto-set mobileControls here anymore, wait for choice if not chosen
    window.playerData = playerData;

    // Initialize Daily Challenge
    initDailyChallenge();

    // --- 3. HELPER FUNCTIONS ---
    var saveTimer = null;
    function forceSave() {
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        localStorage.setItem('tacoSaveData', JSON.stringify(playerData));
    }

    function saveData() {
        if (saveTimer) return; // Coalesce: A save is already pending
        saveTimer = setTimeout(forceSave, 1000);
    }

    // Ensure data is saved when closing or hiding
    window.addEventListener('beforeunload', forceSave);
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) forceSave();
    });

    function initDailyChallenge() {
        const today = new Date().toDateString();
        // Reset if date changed or if data is missing/corrupt
        if (playerData.dailyChallenge.date !== today || !playerData.dailyChallenge.id) {
            const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length);
            const challenge = DAILY_CHALLENGES[randomIndex];
            playerData.dailyChallenge = {
                date: today,
                id: challenge.id,
                progress: 0,
                claimed: false
            };
            saveData();
        }
    }

    // --- LEADERBOARD LOGIC ---
    let pendingHighScore = { mode: null, score: 0 };

    function getLeaderboard(mode) {
        if (!playerData.leaderboards) playerData.leaderboards = { classic: [], contest: [], time_attack: [] };
        if (!playerData.leaderboards[mode]) playerData.leaderboards[mode] = [];
        return playerData.leaderboards[mode];
    }

    function isHighScore(mode, score) {
        const list = getLeaderboard(mode);
        if (list.length < 50) return true;
        const lowest = list[list.length - 1].score;
        return score > lowest;
    }

    function addHighScore(mode, score, name) {
        const list = getLeaderboard(mode);
        const entry = {
            name: name.toUpperCase().substring(0, 3),
            score: score,
            date: new Date().toDateString()
        };
        list.push(entry);
        list.sort((a, b) => b.score - a.score);
        if (list.length > 50) list.length = 50;
        saveData();
    }

    function openLeaderboard() {
        loadContext(game1);
        if(state !== 'IDLE' && state !== 'GAMEOVER') return;

        state = 'LEADERBOARD';
        if(isSplitscreen) { loadContext(game2); state = 'LEADERBOARD'; saveContext(game2); loadContext(game1); }

        document.getElementById('leaderboardUI').style.display = 'block';
        document.getElementById('shopUI').style.display = 'none';
        document.getElementById('statsUI').style.display = 'none';
        document.getElementById('achUI').style.display = 'none';
        switchLeaderboardTab(currentGameMode === 'CLASSIC' ? 'classic' : (currentGameMode === 'CONTEST' ? 'contest' : 'time_attack'));
        saveContext(game1);
    }

    function closeLeaderboard() {
        // If coming from Game Over flow?
        // Note: feedback is context-specific. closeAllMenus resets it.
        // We capture it before closing.
        const shouldOpenShop = (feedback === "TERMINÉ !" || feedback === "MARCHÉ!" || (feedback && feedback.includes("RECORD")));

        window.closeAllMenus(() => {
            if (shouldOpenShop) window.openShop();
        });
    }

    function switchLeaderboardTab(mode) {
        document.getElementById('btnTabClassic').className = mode === 'classic' ? 'lb-tab active' : 'lb-tab';
        document.getElementById('btnTabContest').className = mode === 'contest' ? 'lb-tab active' : 'lb-tab';
        document.getElementById('btnTabTime').className = mode === 'time_attack' ? 'lb-tab active' : 'lb-tab';

        const list = getLeaderboard(mode);
        const container = document.getElementById('lbList');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">AUCUN RECORD</div>';
            return;
        }

        list.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'lb-row';
            // Highlight pending score? Not easy to track unique ID without adding one.
            // Just basic render.
            div.innerHTML = `<span class="lb-rank">${index + 1}.</span><span class="lb-name">${entry.name}</span><span class="lb-score">${entry.score}</span>`;
            container.appendChild(div);
        });
    }

    function handleHighScoreInput() {
        // Called when game detects high score
        state = 'HIGHSCORE_INPUT';
        document.getElementById('highScoreUI').style.display = 'block';
        setTimeout(() => {
             const inp = document.getElementById('hsNameInput');
             inp.value = '';
             inp.focus();
        }, 100);
    }

    function submitHighScoreInput() {
        const name = highScoreName.join('');
        if (!name) return;

        addHighScore(pendingHighScore.mode, pendingHighScore.score, name);
        document.getElementById('highScoreUI').style.display = 'none';

        // Ensure changes persist in game1 context (Single Player)
        loadContext(game1);

        state = 'IDLE';
        // Force feedback to "TERMINÉ !" to ensure closeAllMenus resets the game properly
        // and that the Shop opens after the leaderboard closes.
        feedback = "TERMINÉ !";

        saveContext(game1);

        // Show Leaderboard to confirm
        openLeaderboard();
        // Force the tab to the relevant mode
        switchLeaderboardTab(pendingHighScore.mode);
    }
    var isSplitscreen = false;

    // Define the default/initial state factory
    function createGameContext() {
        return {
            state: 'IDLE',
            preJumpTimer: 0,
            feedback: "",
            feedbackTimer: 0,
            player3D: { x: 433, y: 300, z: 0, vz: 0 },
            activeBalls: [],
            particles: [],
            currentStreak: 0,
            consecutiveMisses: 0,
            distanceLevel: 1,
            contestData: { timer: 60, score: 0, rack: 1, ballsInRack: 0, isActive: false },
            timeAttackData: { timer: 60, score: 0, active: false },
            animState: { la: Math.PI/2 - 0.2, ra: Math.PI/2 + 0.2, lfa: Math.PI/2 - 0.1, rfa: Math.PI/2 + 0.1, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 },
            animTarget: { la: 0, ra: 0, lfa: 0, rfa: 0, w: 0, la_z: 0, ra_z: 0, lfa_z: 0, rfa_z: 0 },
            breathingPhase: 0,
            camSmooth: { x: 433, y: 300 },
            camCache: {},
            airbudJumpTime: 0,
            isGroundedShot: false,
            groundShotTimer: 0,
            crowdCheerTimer: 0,
            ball: {}, // Legacy
            playerData: null, // Will hold reference to profile
            bgCache: null, // Per-player background cache
            resetTimer: 0,
            nextAction: null,
            inputState: { shootPressed: false }, // Abstracted input
            viewingIndices: { animal: 0, skin: 0, hat: 0, ball: 0, style: 0 } // UI state
        };
    }

    var game1 = createGameContext();
    var game2 = createGameContext();

    // Initialize P1 with the loaded global data
    // We will do this via loadContext/saveContext flow in the loop,
    // but we need to ensure the objects exist.

    function saveContext(ctxObj) {
        ctxObj.state = state;
        ctxObj.preJumpTimer = preJumpTimer;
        ctxObj.feedback = feedback;
        ctxObj.feedbackTimer = feedbackTimer;
        // Deep copy player3D to avoid reference issues if replaced?
        // Actually player3D is an object. If we replace the reference 'player3D = ...', we need to be careful.
        // But the global 'player3D' variable holds the reference.
        ctxObj.player3D = player3D;
        ctxObj.activeBalls = activeBalls;
        ctxObj.particles = particles;
        ctxObj.currentStreak = currentStreak;
        ctxObj.consecutiveMisses = consecutiveMisses;
        ctxObj.distanceLevel = distanceLevel;
        ctxObj.contestData = contestData;
        ctxObj.timeAttackData = timeAttackData;
        ctxObj.animState = g_animState;
        ctxObj.animTarget = g_animTarget;
        ctxObj.breathingPhase = g_breathingPhase;
        ctxObj.camSmooth = window.g_camSmooth;
        ctxObj.camCache = window.g_camCache;
        ctxObj.airbudJumpTime = airbudJumpTime;
        ctxObj.isGroundedShot = isGroundedShot;
        ctxObj.groundShotTimer = groundShotTimer;
        ctxObj.crowdCheerTimer = crowdCheerTimer;
        ctxObj.ball = ball;
        ctxObj.playerData = playerData;
        ctxObj.bgCache = bgCache;
        ctxObj.resetTimer = resetTimer;
        ctxObj.nextAction = nextAction;
        // UI State
        ctxObj.viewingIndices = {
            animal: viewingAnimalIndex,
            skin: viewingSkinIndex,
            hat: viewingHatIndex,
            ball: viewingBallIndex,
            style: viewingStyleIndex
        };
    }

    function loadContext(ctxObj) {
        state = ctxObj.state;
        preJumpTimer = ctxObj.preJumpTimer;
        feedback = ctxObj.feedback;
        feedbackTimer = ctxObj.feedbackTimer;
        player3D = ctxObj.player3D;
        activeBalls = ctxObj.activeBalls;
        particles = ctxObj.particles;
        currentStreak = ctxObj.currentStreak;
        consecutiveMisses = ctxObj.consecutiveMisses;
        distanceLevel = ctxObj.distanceLevel;
        contestData = ctxObj.contestData;
        timeAttackData = ctxObj.timeAttackData;
        g_animState = ctxObj.animState;
        g_animTarget = ctxObj.animTarget;
        g_breathingPhase = ctxObj.breathingPhase;
        window.g_camSmooth = ctxObj.camSmooth;
        window.g_camCache = ctxObj.camCache;
        airbudJumpTime = ctxObj.airbudJumpTime;
        isGroundedShot = ctxObj.isGroundedShot;
        groundShotTimer = ctxObj.groundShotTimer;
        crowdCheerTimer = ctxObj.crowdCheerTimer;
        ball = ctxObj.ball;
        // CRITICAL: Only switch playerData if the context has one.
        // This prevents overwriting the global reference with null/undefined
        // which could cause accidental sharing if a fallback is triggered later.
        if (ctxObj.playerData) {
            playerData = ctxObj.playerData;
        }
        bgCache = ctxObj.bgCache;
        resetTimer = ctxObj.resetTimer;
        nextAction = ctxObj.nextAction;

        // UI State
        if (ctxObj.viewingIndices) {
            viewingAnimalIndex = ctxObj.viewingIndices.animal;
            viewingSkinIndex = ctxObj.viewingIndices.skin;
            viewingHatIndex = ctxObj.viewingIndices.hat || 0;
            viewingBallIndex = ctxObj.viewingIndices.ball;
            viewingStyleIndex = ctxObj.viewingIndices.style;
        }

        // Ensure globals that might be undefined are safe
        if(!window.g_camSmooth) window.g_camSmooth = { x: 433, y: 300 };
    }

    // Initialize Game 1 with current globals immediately
    saveContext(game1);

    // P2 Setup (Separate Profile)
    game2.playerData = createDefaultData();
    // Give P2 some generic skins or copy P1? Let's copy P1's unlocked stuff but reset progress
    // Actually, deep cloning P1's initial state is safer for now.
    game2.playerData = JSON.parse(JSON.stringify(playerData));
    // Reset session stats for P2
    game2.playerData.tacos = 0; // Session score for competition? Or keep tacos?
    // Let's keep it separate.

    function toggleSplitscreen() {
        if(state !== 'IDLE' && state !== 'GAMEOVER') return;
        isSplitscreen = !isSplitscreen;

        const sb = document.getElementById('scorebug-container');
        const btnText = document.getElementById('btnSplitText');

        if(isSplitscreen) {
            // Reset P2 with a deep copy of P1's data (which is currently loaded in global playerData)
            // Important: We must use game1.playerData if playerData reference is ambiguous,
            // but relying on 'playerData' global which should be game1's at this point (via loop/events).
            game2 = createGameContext();
            // Fallback to game1.playerData if global is somehow unlinked, but usually they match.
            // Using JSON parse/stringify ensures DEEP COPY and NEW REFERENCE.
            const sourceData = (game1 && game1.playerData) ? game1.playerData : playerData;
            game2.playerData = JSON.parse(JSON.stringify(sourceData));
            game2.playerData.tacos = 0; // Fresh score

            if(sb) sb.style.display = 'none';
            if(btnText) btnText.innerText = "1 PLAYER";
        } else {
            if(sb) sb.style.display = 'flex';
            if(btnText) btnText.innerText = "2 PLAYERS";
        }

        // Ensure both players are initialized for current mode
        runForAllPlayers(resetGame);

        updateMobileControlsUI();
        invalidateBackgroundCache();
        resizeGame();
    }
