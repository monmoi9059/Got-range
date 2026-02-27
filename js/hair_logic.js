// --- HAIR CREATOR LOGIC ---
(function() {
    var hairCanvas, hairCtx;
    var isDrawing = false;
    var brushSize = 10;
    var brushColor = '#000000';
    var brushAlpha = 1.0;
    var isEraser = false;
    var currentView = 'back'; // back or front
    var hairData = {
        front: [],
        back: []
    };
    var history = [];

    // Helper to get mouse/touch pos
    function getPos(e) {
        const rect = hairCanvas.getBoundingClientRect();
        const scaleX = hairCanvas.width / rect.width;
        const scaleY = hairCanvas.height / rect.height;
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function drawHeadTemplate() {
        hairCtx.clearRect(0, 0, hairCanvas.width, hairCanvas.height);

        // Draw Guide Head (faded)
        hairCtx.save();
        hairCtx.globalAlpha = 0.3;
        hairCtx.fillStyle = '#dcb98a'; // Base skin
        const cx = hairCanvas.width / 2;
        const cy = hairCanvas.height / 2;
        const r = 80;

        hairCtx.beginPath();
        hairCtx.arc(cx, cy, r, 0, Math.PI * 2);
        hairCtx.fill();

        // Neck
        hairCtx.fillRect(cx - 30, cy + 50, 60, 60);

        // Ears
        if (currentView === 'back') {
            hairCtx.beginPath(); hairCtx.ellipse(cx - 90, cy, 20, 30, 0, 0, Math.PI*2); hairCtx.fill();
            hairCtx.beginPath(); hairCtx.ellipse(cx + 90, cy, 20, 30, 0, 0, Math.PI*2); hairCtx.fill();
        } else {
             // Front face details
             hairCtx.fillStyle = '#000';
             hairCtx.beginPath(); hairCtx.arc(cx - 30, cy - 10, 5, 0, Math.PI*2); hairCtx.fill();
             hairCtx.beginPath(); hairCtx.arc(cx + 30, cy - 10, 5, 0, Math.PI*2); hairCtx.fill();
        }

        hairCtx.restore();

        // Draw Hair Blobs
        const blobs = hairData[currentView];
        if (blobs) {
            blobs.forEach(b => {
                hairCtx.save();
                if(b.eraser) {
                    hairCtx.globalCompositeOperation = 'destination-out';
                    hairCtx.globalAlpha = 1.0;
                } else {
                    hairCtx.globalCompositeOperation = 'source-over';
                    hairCtx.globalAlpha = b.alpha;
                    hairCtx.fillStyle = b.color;
                }

                hairCtx.beginPath();
                hairCtx.arc(b.x, b.y, b.size, 0, Math.PI*2);
                hairCtx.fill();
                hairCtx.restore();
            });
        }
    }

    window.openHairCreator = function() {
        if(window.closeControlsMenu) window.closeControlsMenu();
        if (state !== 'SHOP' && state !== 'IDLE' && state !== 'GAMEOVER') return;

        const modal = document.getElementById('hairCreatorUI');
        modal.style.display = 'flex';

        hairCanvas = document.getElementById('hairEditorCanvas');
        hairCtx = hairCanvas.getContext('2d');

        // Init Palette
        const palette = document.getElementById('hairColorPalette');
        palette.innerHTML = '';
        HAIR_COLORS.forEach(c => {
            const d = document.createElement('div');
            d.style.width = '25px'; d.style.height = '25px';
            d.style.backgroundColor = c;
            d.style.border = '1px solid #555';
            d.style.cursor = 'pointer';
            d.onclick = () => { brushColor = c; isEraser = false; updateUI(); };
            palette.appendChild(d);
        });

        // Load existing custom hair if present
        if (!playerData.customHairstyles) playerData.customHairstyles = [];

        // Try to load slot 0 by default or clear
        hairData = { front: [], back: [] };
        history = [];
        drawHeadTemplate();

        updateUI();

        // Events
        hairCanvas.onmousedown = startDraw;
        hairCanvas.onmousemove = moveDraw;
        hairCanvas.onmouseup = endDraw;
        hairCanvas.onmouseout = endDraw;
        hairCanvas.ontouchstart = (e) => { e.preventDefault(); startDraw(e); };
        hairCanvas.ontouchmove = (e) => { e.preventDefault(); moveDraw(e); };
        hairCanvas.ontouchend = (e) => { e.preventDefault(); endDraw(e); };
    };

    window.closeHairCreator = function() {
        document.getElementById('hairCreatorUI').style.display = 'none';
        if (state === 'SHOP') window.openShop(true); // Return to shop
    };

    window.setHairEditorView = function(view) {
        currentView = view;
        drawHeadTemplate();
        updateUI();
    };

    window.updateBrushSize = function() {
        brushSize = parseInt(document.getElementById('brushSizeSlider').value);
        document.getElementById('brushSizeVal').innerText = brushSize;
    };

    window.updateBrushAlpha = function() {
        brushAlpha = parseInt(document.getElementById('brushAlphaSlider').value) / 100;
        document.getElementById('brushAlphaVal').innerText = Math.round(brushAlpha * 100) + "%";
    };

    window.toggleEraser = function() {
        isEraser = !isEraser;
        updateUI();
    };

    window.clearHairLayer = function() {
        saveState();
        hairData[currentView] = [];
        drawHeadTemplate();
    };

    window.undoHairStroke = function() {
        if (history.length > 0) {
            hairData = JSON.parse(history.pop());
            drawHeadTemplate();
        }
    };

    window.saveCustomHair = function() {
        const slot = parseInt(document.getElementById('hairSaveSlot').value);
        const id = 'custom_' + slot;

        // Remove existing
        const idx = playerData.customHairstyles.findIndex(h => h.id === id);
        if (idx !== -1) playerData.customHairstyles.splice(idx, 1);

        playerData.customHairstyles.push({
            id: id,
            blobs: JSON.parse(JSON.stringify(hairData)), // Deep copy
            name: "Custom " + (slot + 1)
        });

        // Select it
        playerData.customHairstyle = id;

        // Add to unlocked list if not there (virtual unlock)
        if (!playerData.unlockedHairstyles.includes(id)) playerData.unlockedHairstyles.push(id);

        saveData();
        // Refresh shop UI if open
        if (typeof updateShopUI === 'function') updateShopUI();

        window.closeHairCreator();
    };

    function updateUI() {
        const btnB = document.getElementById('btnHairViewBack');
        const btnF = document.getElementById('btnHairViewFront');
        if(currentView === 'back') {
            btnB.style.border = '2px solid #FFD700';
            btnF.style.border = 'none';
        } else {
            btnB.style.border = 'none';
            btnF.style.border = '2px solid #FFD700';
        }

        const btnE = document.getElementById('btnEraser');
        btnE.innerText = isEraser ? "GOMME: ON" : "GOMME: OFF";
        btnE.style.background = isEraser ? "#FF0000" : "#444";
    }

    function startDraw(e) {
        isDrawing = true;
        saveState();
        draw(e);
    }

    function moveDraw(e) {
        if (!isDrawing) return;
        draw(e);
    }

    function endDraw(e) {
        isDrawing = false;
    }

    function draw(e) {
        const pos = getPos(e);
        // Add blob
        hairData[currentView].push({
            x: pos.x,
            y: pos.y,
            size: brushSize,
            color: brushColor,
            alpha: brushAlpha,
            eraser: isEraser
        });
        drawHeadTemplate();
    }

    function saveState() {
        if (history.length > 10) history.shift();
        history.push(JSON.stringify(hairData));
    }

})();
