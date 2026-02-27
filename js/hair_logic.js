// --- START hair_logic.js ---

// Hair Creator Global State
var hairEditorState = {
    view: 'back', // 'back' or 'front'
    brushSize: 10,
    brushAlpha: 100, // Percentage
    brushColor: '#000000',
    isEraser: false,
    blobs: { front: [], back: [] }, // Arrays of {x, y, r, c, a}
    isDrawing: false,
    history: [] // For undo
};

var hairCanvas = null;
var hairCtx = null;
var hairZoom = 1.0;
var hairPan = { x: 0, y: 0 };
var isPanning = false;

// Initialize Hair Creator UI
window.initHairCreator = function() {
    hairCanvas = document.getElementById('hairEditorCanvas');
    if (!hairCanvas) return;

    hairCtx = hairCanvas.getContext('2d');

    // Fill Color Palette
    const palette = document.getElementById('hairColorPalette');
    if (palette && palette.children.length === 0) {
        if (typeof HAIR_COLORS !== 'undefined') {
            HAIR_COLORS.forEach(color => {
                const btn = document.createElement('div');
                btn.style.width = '25px';
                btn.style.height = '25px';
                btn.style.backgroundColor = color;
                btn.style.border = '1px solid #555';
                btn.style.cursor = 'pointer';
                btn.onclick = () => setBrushColor(color);
                palette.appendChild(btn);
            });
        }
    }

    // Add Mouse/Touch Listeners
    hairCanvas.addEventListener('mousedown', startStroke);
    hairCanvas.addEventListener('mousemove', moveStroke);
    hairCanvas.addEventListener('mouseup', endStroke);
    hairCanvas.addEventListener('mouseleave', endStroke);

    hairCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startStroke(e.touches[0]); }, {passive: false});
    hairCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveStroke(e.touches[0]); }, {passive: false});
    hairCanvas.addEventListener('touchend', (e) => { e.preventDefault(); endStroke(); }, {passive: false});

    // Initialize default values
    const sizeSlider = document.getElementById('brushSizeSlider');
    if (sizeSlider) sizeSlider.value = hairEditorState.brushSize;

    const alphaSlider = document.getElementById('brushAlphaSlider');
    if (alphaSlider) alphaSlider.value = hairEditorState.brushAlpha;

    setBrushColor(typeof HAIR_COLORS !== 'undefined' ? HAIR_COLORS[0] : '#000000');

    // Initialize zoom
    hairZoom = 1.0;
    updateHairZoom();
};

window.openHairCreator = function() {
    // Validate State
    if (typeof state !== 'undefined' && state !== 'IDLE' && state !== 'SHOP' && state !== 'GAMEOVER') return;

    if (window.closeAllMenus) window.closeAllMenus(); // Close Shop

    if (typeof state !== 'undefined') state = 'HAIR_CREATOR';
    const ui = document.getElementById('hairCreatorUI');
    if (ui) ui.style.display = 'flex'; // It's a modal, usually flex centered

    // Explicitly hide mobile controls when entering Hair Creator
    const btnMobile = document.getElementById('mobileShootBtn');
    if (btnMobile) btnMobile.style.display = 'none';
    const btnMobile2 = document.getElementById('mobileShootBtn2');
    if (btnMobile2) btnMobile2.style.display = 'none';

    initHairCreator();

    // Load current slot data or reset
    // Default to slot 1 (index 1) since UI usually shows "Emplacement 1"
    const slotSelect = document.getElementById('hairSaveSlot');
    const slot = slotSelect ? parseInt(slotSelect.value) : 1;
    loadHairSlot(slot);

    renderHairCanvas();
};

window.closeHairCreator = function() {
    const ui = document.getElementById('hairCreatorUI');
    if (ui) ui.style.display = 'none';

    // Restore mobile controls if enabled
    if (typeof updateMobileControlsUI === 'function') {
        updateMobileControlsUI();
    }

    // Return to Shop or Idle
    if (typeof openShop === 'function') openShop();
    else if (typeof state !== 'undefined') state = 'IDLE';
};

window.setHairEditorView = function(view) {
    hairEditorState.view = view;
    const btnBack = document.getElementById('btnHairViewBack');
    const btnFront = document.getElementById('btnHairViewFront');
    if (btnBack) btnBack.style.border = (view === 'back') ? '2px solid #FFD700' : '1px solid #555';
    if (btnFront) btnFront.style.border = (view === 'front') ? '2px solid #FFD700' : '1px solid #555';
    renderHairCanvas();
};

window.updateBrushSize = function() {
    const slider = document.getElementById('brushSizeSlider');
    if (!slider) return;
    const val = slider.value;
    hairEditorState.brushSize = parseInt(val);
    const label = document.getElementById('brushSizeVal');
    if (label) label.innerText = val;
};

window.updateBrushAlpha = function() {
    const slider = document.getElementById('brushAlphaSlider');
    if (!slider) return;
    const val = slider.value;
    hairEditorState.brushAlpha = parseInt(val);
    const label = document.getElementById('brushAlphaVal');
    if (label) label.innerText = val + '%';
};

function setBrushColor(color) {
    hairEditorState.brushColor = color;
    hairEditorState.isEraser = false;
    const btn = document.getElementById('btnEraser');
    if (btn) {
        btn.innerText = "GOMME: OFF";
        btn.style.background = "#444";
    }
}

window.toggleEraser = function() {
    hairEditorState.isEraser = !hairEditorState.isEraser;
    const btn = document.getElementById('btnEraser');
    if (btn) {
        if (hairEditorState.isEraser) {
            btn.innerText = "GOMME: ON";
            btn.style.background = "#D32F2F";
        } else {
            btn.innerText = "GOMME: OFF";
            btn.style.background = "#444";
        }
    }
};

window.clearHairLayer = function() {
    saveHistory();
    hairEditorState.blobs[hairEditorState.view] = [];
    renderHairCanvas();
};

window.undoHairStroke = function() {
    if (hairEditorState.history.length > 0) {
        const prev = hairEditorState.history.pop();
        hairEditorState.blobs = JSON.parse(prev); // Deep copy restore
        renderHairCanvas();
    }
};

function saveHistory() {
    if (hairEditorState.history.length > 10) hairEditorState.history.shift();
    hairEditorState.history.push(JSON.stringify(hairEditorState.blobs));
}

window.loadHairSlot = function(slotIndex) {
    // Find existing custom data in playerData
    const id = `custom_${slotIndex}`;
    if (typeof playerData === 'undefined') return;
    if (!playerData.customHairstyles) playerData.customHairstyles = [];

    let data = playerData.customHairstyles.find(h => h.id === id);

    if (!data) {
        // Initialize empty
        hairEditorState.blobs = { front: [], back: [] };
    } else {
        // Deep copy to avoid editing live data until save
        const rawBlobs = JSON.parse(JSON.stringify(data.blobs || { front: [], back: [] }));

        // De-normalize Helper
        const denormalize = (list) => {
            if (!list || list.length === 0) return [];
            // Check heuristic: if x is small (e.g., < 50), assume it's normalized relative coords
            // Canvas is 300x300, center 150. Normalized is (val - 150)/100.
            if (Math.abs(list[0].x) < 50) {
                return list.map(b => ({
                    x: b.x * 100 + 150,
                    y: b.y * 100 + 150,
                    r: (b.r || 0.1) * 100,
                    c: b.c,
                    a: b.a
                }));
            }
            return list;
        };

        hairEditorState.blobs = {
            front: denormalize(rawBlobs.front),
            back: denormalize(rawBlobs.back)
        };
    }

    // Reset view
    setHairEditorView('back');
    renderHairCanvas();
}

window.saveCustomHair = function() {
    const slotSelect = document.getElementById('hairSaveSlot');
    const slotIndex = slotSelect ? slotSelect.value : 1;
    const id = `custom_${slotIndex}`;

    if (typeof playerData === 'undefined') return;
    if (!playerData.customHairstyles) playerData.customHairstyles = [];

    // Remove existing
    const idx = playerData.customHairstyles.findIndex(h => h.id === id);
    if (idx !== -1) playerData.customHairstyles.splice(idx, 1);

    // Normalize Data (Convert 300x300 canvas coords to relative coords based on 100px head radius)
    // Center is 150, 150. Scale reference is 100.
    const normalizeBlobs = (list) => {
        return list.map(b => ({
            x: (b.x - 150) / 100,
            y: (b.y - 150) / 100,
            r: b.r / 100,
            c: b.c, // Hex color string
            a: b.a
        }));
    };

    const savedData = {
        front: normalizeBlobs(hairEditorState.blobs.front),
        back: normalizeBlobs(hairEditorState.blobs.back)
    };

    // Add new
    playerData.customHairstyles.push({
        id: id,
        blobs: savedData
    });

    // Auto-equip?
    playerData.customHairstyle = id;
    playerData.hair = id; // Also set the main hair property

    // Save to local storage
    if (typeof saveData === 'function') saveData();

    if (typeof showNotification === 'function') showNotification("COIFFURE SAUVEGARDÉE !", 0);

    closeHairCreator();
};

// --- Zoom Logic ---

window.zoomHairCanvas = function(delta) {
    hairZoom += delta;
    if (hairZoom < 1.0) hairZoom = 1.0;
    if (hairZoom > 3.0) hairZoom = 3.0;
    updateHairZoom();
};

function updateHairZoom() {
    if (!hairCanvas) hairCanvas = document.getElementById('hairEditorCanvas');
    if (hairCanvas) {
        hairCanvas.style.transform = `scale(${hairZoom})`;
    }
    const display = document.getElementById('hairZoomDisplay');
    if (display) {
        display.innerText = Math.round(hairZoom * 100) + '%';
    }
}


// --- Drawing Logic ---

function getCanvasCoords(e) {
    if (!hairCanvas) return {x:0, y:0};

    // We need to account for the CSS transform (scale) on the canvas
    const rect = hairCanvas.getBoundingClientRect();

    // The rect width/height includes the scale transform.
    // However, the canvas internal resolution is fixed (300x300).
    // So scaleX/scaleY calculation based on rect will naturally handle the zoom
    // IF the click coordinates are relative to the zoomed element's top-left.

    const scaleX = hairCanvas.width / rect.width;
    const scaleY = hairCanvas.height / rect.height;

    // Handle Touch vs Mouse
    let clientX = e.clientX;
    let clientY = e.clientY;

    // If it's a touch object (or similar structure), use it
    if (e.touches && e.touches.length > 0) {
         clientX = e.touches[0].clientX;
         clientY = e.touches[0].clientY;
    } else if (e.clientX === undefined && e.x !== undefined) {
         // Fallback for some event types
         clientX = e.x;
         clientY = e.y;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function startStroke(e) {
    hairEditorState.isDrawing = true;
    saveHistory();
    // Normalize event logic handled in getCanvasCoords or passed object
    // If e is a Touch event, it has changedTouches. If it's a touch point, it has clientX/Y.
    // The listener passes `e.touches[0]` for touch events.
    addBlob(getCanvasCoords(e));
    renderHairCanvas();
}

function moveStroke(e) {
    if (!hairEditorState.isDrawing) return;
    addBlob(getCanvasCoords(e));
    renderHairCanvas();
}

function endStroke() {
    hairEditorState.isDrawing = false;
}

function addBlob(pos) {
    const list = hairEditorState.blobs[hairEditorState.view];
    // Scale brush size inversely if needed?
    // Actually no, if we zoom in, we want more precision, so the brush should stay same size in pixels (smaller on screen)
    // But currently brushSize is in canvas pixels.
    // If we zoom, the canvas pixels are bigger on screen.
    const r = hairEditorState.brushSize;

    if (hairEditorState.isEraser) {
        // Remove blobs colliding with brush
        for (let i = list.length - 1; i >= 0; i--) {
            const b = list[i];
            const dx = b.x - pos.x;
            const dy = b.y - pos.y;
            if (Math.sqrt(dx*dx + dy*dy) < r + b.r) {
                list.splice(i, 1);
            }
        }
    } else {
        // Add blob
        list.push({
            x: Math.round(pos.x),
            y: Math.round(pos.y),
            r: r,
            c: hairEditorState.brushColor,
            a: hairEditorState.brushAlpha / 100
        });
    }
}

// Render Function
function renderHairCanvas() {
    if (!hairCtx || !hairCanvas) return;
    const w = hairCanvas.width;
    const h = hairCanvas.height;

    hairCtx.clearRect(0, 0, w, h);

    // Draw Grid
    hairCtx.strokeStyle = '#DDD';
    hairCtx.lineWidth = 1;
    hairCtx.beginPath();
    for(let x=0; x<=w; x+=30) { hairCtx.moveTo(x,0); hairCtx.lineTo(x,h); }
    for(let y=0; y<=h; y+=30) { hairCtx.moveTo(0,y); hairCtx.lineTo(w,y); }
    hairCtx.stroke();

    // Draw Head Template (Reference)
    // Scale template to fit center
    const cx = w/2;
    const cy = h/2;
    drawHeadTemplate(hairCtx, cx, cy, 100); // 100 radius approx

    // Draw Blobs
    if (hairEditorState.view === 'front') {
        // Draw back hair dimly behind?
        drawBlobs(hairEditorState.blobs.back, 0.3); // Ghost
        // Draw Head (Already drawn)
        // Draw Front Blobs
        drawBlobs(hairEditorState.blobs.front, 1.0);
    } else {
        // Back View
        // Draw Front hair? Maybe not needed for back view.
        drawBlobs(hairEditorState.blobs.back, 1.0);
    }
}

function drawBlobs(list, globalAlphaMult) {
    if (!list) return;
    list.forEach(b => {
        hairCtx.globalAlpha = b.a * globalAlphaMult;
        hairCtx.fillStyle = b.c;
        hairCtx.beginPath();
        hairCtx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        hairCtx.fill();
    });
    hairCtx.globalAlpha = 1.0;
}

function drawHeadTemplate(ctx, cx, cy, r) {
    ctx.fillStyle = '#f0d5be'; // Skin tone
    ctx.strokeStyle = '#CCC';

    // Ears
    ctx.beginPath(); ctx.ellipse(cx - r, cy, r*0.2, r*0.4, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + r, cy, r*0.2, r*0.4, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Face Guide (if Front)
    if (hairEditorState.view === 'front') {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.arc(cx - r*0.4, cy - r*0.1, r*0.1, 0, Math.PI*2); ctx.fill(); // Eye
        ctx.beginPath(); ctx.arc(cx + r*0.4, cy - r*0.1, r*0.1, 0, Math.PI*2); ctx.fill(); // Eye
        ctx.beginPath(); ctx.moveTo(cx - r*0.2, cy + r*0.5); ctx.quadraticCurveTo(cx, cy + r*0.7, cx + r*0.2, cy + r*0.5); ctx.stroke(); // Mouth
    } else {
        // Back of head guide (Neck)
        ctx.fillStyle = '#e0c6af';
        ctx.fillRect(cx - r*0.4, cy + r*0.8, r*0.8, r*0.5);
    }
}
