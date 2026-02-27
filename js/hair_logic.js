
var g_hairZoom = 1.0;
var g_hairPanX = 0;
var g_hairPanY = 0;
var g_hairSaveSlots = [null, null, null, null, null];
var g_currentHairSlot = 0;
var isHairDragging = false;
var lastDragX = 0;
var lastDragY = 0;
var isDrawing = false; // Separate drag for drawing vs panning

function openHairCreator() {
    window.closeControlsMenu();
    loadContext(game1);
    // If coming from Shop, state is SHOP. If idle, IDLE.
    // Allow opening from Shop or Idle.
    if(state !== 'IDLE' && state !== 'SHOP' && state !== 'GAMEOVER') return;

    state = 'HAIR_CREATOR';

    // Init UI
    const ui = document.getElementById('hairCreatorUI');
    if(ui) {
        ui.style.display = 'flex'; // Flex for centering
        initHairCreator();
    }

    // Hide other UIs
    document.getElementById('shopUI').style.display = 'none';
    document.getElementById('statsUI').style.display = 'none';

    updateMobileControlsUI();
}

function closeHairCreator() {
    const ui = document.getElementById('hairCreatorUI');
    if(ui) ui.style.display = 'none';

    // Return to previous state (Shop)
    window.openShop(true);
}

function initHairCreator() {
    const canvas = document.getElementById('hairEditorCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    // Reset View
    g_hairZoom = 1.0;
    g_hairPanX = 0;
    g_hairPanY = 0;
    updateHairZoom();

    // Add Mouse Wheel Listener for Zoom
    canvas.onwheel = function(e) {
        e.preventDefault();
        const delta = Math.sign(e.deltaY) * -0.1;
        const newZoom = Math.max(0.5, Math.min(5.0, g_hairZoom + delta));
        g_hairZoom = newZoom;
        updateHairZoom();
    };

    // Mouse Interaction
    canvas.onmousedown = function(e) {
        // Middle Click or Space+Click for Pan?
        // For simplicity: Right click or specific tool for Pan?
        // Let's use Right Click for Pan, Left Click for Draw.
        if (e.button === 2 || e.buttons === 4) { // Right or Middle
            isHairDragging = true;
            lastDragX = e.clientX;
            lastDragY = e.clientY;
            e.preventDefault(); // Prevent context menu
        } else {
            isDrawing = true;
            handleHairDraw(e);
        }
    };

    // Prevent Context Menu on Canvas
    canvas.oncontextmenu = function(e) { e.preventDefault(); return false; };

    // Initial Render
    renderHairCanvas();
}

// Global listeners (run once on script load)
window.addEventListener('mouseup', function() {
    isHairDragging = false;
    isDrawing = false;
});

window.addEventListener('mousemove', function(e) {
    if (state !== 'HAIR_CREATOR') return;

    if (isHairDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        g_hairPanX += dx;
        g_hairPanY += dy;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        updateHairZoom();
    } else if (isDrawing) {
        handleHairDraw(e);
    }
});

function resetHairView() {
    g_hairZoom = 1.0;
    g_hairPanX = 0;
    g_hairPanY = 0;
    updateHairZoom();
}

function updateHairZoom() {
    const canvas = document.getElementById('hairEditorCanvas');
    if(!canvas) return;

    // We use CSS transform for visual zoom/pan to be performant
    // But input coordinates need to be mapped back.
    canvas.style.transform = `translate(${g_hairPanX}px, ${g_hairPanY}px) scale(${g_hairZoom})`;
}

function getCanvasCoordinates(e) {
    const canvas = document.getElementById('hairEditorCanvas');
    const rect = canvas.getBoundingClientRect();
    // Scale is applied visually via CSS transform, so getBoundingClientRect includes it.
    // Resolution scale logic?
    // The canvas logical size is 300x300.

    // Rect width/height is the visual size on screen (affected by zoom).
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function handleHairDraw(e) {
    const pos = getCanvasCoordinates(e);
    const canvas = document.getElementById('hairEditorCanvas');
    const ctx = canvas.getContext('2d');

    // Simple drawing for now (Brush)
    const size = parseInt(document.getElementById('brushSizeSlider').value) || 10;
    const alpha = (parseInt(document.getElementById('brushAlphaSlider').value) || 100) / 100;
    const color = '#000000'; // Default black for testing

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size/2, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function renderHairCanvas() {
    const canvas = document.getElementById('hairEditorCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear background
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Head Template (Behind everything)
    drawHeadTemplate(ctx);

    // Grid
    drawHairGrid(ctx);

    // In a real implementation, we would redraw the strokes layer here
    // But since we are drawing directly to canvas bitmap, we don't need to redraw loop
    // unless we implement Undo/Redo buffers.
}

function drawHeadTemplate(ctx) {
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2 + 20;
    const r = 70;

    ctx.save();
    // Try to use player skin tone if available
    let color = '#d2b48c';
    if (typeof playerData !== 'undefined' && typeof SKIN_TONES !== 'undefined') {
        if (playerData.customSkinSettings && playerData.customSkinSettings.skinToneIndex !== undefined) {
            color = SKIN_TONES[playerData.customSkinSettings.skinToneIndex];
        }
    }

    ctx.fillStyle = color;

    // Ears
    ctx.beginPath(); ctx.ellipse(cx - r, cy, 15, 25, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r, cy, 15, 25, 0, 0, Math.PI*2); ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(cx - 30, cy + r - 10, 60, 60);

    ctx.restore();
}

function drawHairGrid(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.strokeStyle = '#EEE';
    ctx.lineWidth = 1;

    const step = 20;
    ctx.beginPath();
    for(let x=0; x<=w; x+=step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for(let y=0; y<=h; y+=step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Center lines
    ctx.strokeStyle = '#CCC';
    ctx.beginPath();
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.stroke();
}

function saveCustomHair() {
    // Placeholder logic
    const slot = document.getElementById('hairSaveSlot').value;
    alert("Saved to slot " + slot);
}

// Expose global
window.openHairCreator = openHairCreator;
window.closeHairCreator = closeHairCreator;
window.saveCustomHair = saveCustomHair;
window.resetHairView = resetHairView;
