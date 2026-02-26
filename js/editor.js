    var hairEditor = {
        active: false,
        canvas: null,
        ctx: null,
        view: 'back', // 'back' or 'front'
        brushSize: 10,
        brushAlpha: 1.0,
        colorIndex: 0,
        data: { back: [], front: [] },
        isEraser: false,
        isDrawing: false,
        headRadius: 100, // Canvas scale
        history: [] // For Undo
    };

    window.openHairCreator = function() {
        if(window.closeControlsMenu) window.closeControlsMenu();
        loadContext(game1); // Single player context for editing

        state = 'HAIR_CREATOR';
        shopUI.style.display = 'none';
        document.getElementById('hairCreatorUI').style.display = 'flex'; // Flex for centering
        updateMobileControlsUI();

        // Init Editor
        hairEditor.active = true;
        hairEditor.canvas = document.getElementById('hairEditorCanvas');
        hairEditor.ctx = hairEditor.canvas.getContext('2d');
        hairEditor.data = { back: [], front: [] };
        hairEditor.history = []; // Reset undo

        // Load current if it's a custom one?
        const currentSlotVal = document.getElementById('hairSaveSlot').value;
        window.loadCustomHairSlot(currentSlotVal);

        renderHairEditor();
        initHairPalette();

        // Event Listeners (Once)
        if(!hairEditor.initialized) {
            hairEditor.canvas.addEventListener('mousedown', startPaint);
            hairEditor.canvas.addEventListener('mousemove', movePaint);
            hairEditor.canvas.addEventListener('mouseup', endPaint);
            hairEditor.canvas.addEventListener('mouseleave', endPaint);

            hairEditor.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startPaint(e.touches[0]);
            }, {passive: false});
            hairEditor.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                movePaint(e.touches[0]);
            }, {passive: false});
            hairEditor.canvas.addEventListener('touchend', endPaint);

            // Slot change listener
            document.getElementById('hairSaveSlot').addEventListener('change', (e) => {
                 window.loadCustomHairSlot(e.target.value);
            });

            hairEditor.initialized = true;
        }
    };

    window.closeHairCreator = function() {
        state = 'IDLE';
        document.getElementById('hairCreatorUI').style.display = 'none';
        hairEditor.active = false;
        // Return to shop
        window.openShop(true);
    };

    window.setHairEditorView = function(view) {
        hairEditor.view = view;
        const btnBack = document.getElementById('btnHairViewBack');
        const btnFront = document.getElementById('btnHairViewFront');

        if(view === 'back') {
            btnBack.style.background = '#444';
            btnFront.style.background = '#222';
        } else {
            btnBack.style.background = '#222';
            btnFront.style.background = '#444';
        }
        renderHairEditor();
    };

    window.toggleEraser = function() {
        hairEditor.isEraser = !hairEditor.isEraser;
        const btn = document.getElementById('btnEraser');
        if(hairEditor.isEraser) {
            btn.innerText = "GOMME: ON";
            btn.style.background = "#FF0000";
            // Deselect color palette visual
            const container = document.getElementById('hairColorPalette');
            if(container) Array.from(container.children).forEach(c => c.style.borderColor = 'transparent');
        } else {
            btn.innerText = "GOMME: OFF";
            btn.style.background = "#444";
            // Reselect current color
            initHairPalette();
        }
    };

    window.updateBrushSize = function() {
        const val = parseInt(document.getElementById('brushSizeSlider').value);
        hairEditor.brushSize = val;
        document.getElementById('brushSizeVal').innerText = val;
    };

    window.updateBrushAlpha = function() {
        const val = parseInt(document.getElementById('brushAlphaSlider').value);
        hairEditor.brushAlpha = val / 100.0;
        document.getElementById('brushAlphaVal').innerText = val + "%";
    };

    function initHairPalette() {
        const container = document.getElementById('hairColorPalette');
        if(!container) return;
        container.innerHTML = '';
        HAIR_COLORS.forEach((color, idx) => {
            const div = document.createElement('div');
            div.style.width = '30px';
            div.style.height = '30px';
            div.style.backgroundColor = color;
            div.style.borderRadius = '50%';
            div.style.cursor = 'pointer';
            div.style.border = '2px solid transparent';

            div.onclick = () => {
                hairEditor.colorIndex = idx;
                hairEditor.isEraser = false; // Turn off eraser
                document.getElementById('btnEraser').innerText = "GOMME: OFF";
                document.getElementById('btnEraser').style.background = "#444";

                // Update selection visual
                Array.from(container.children).forEach(c => c.style.borderColor = 'transparent');
                div.style.borderColor = '#FFF';
            };

            if(idx === hairEditor.colorIndex && !hairEditor.isEraser) div.style.borderColor = '#FFF';
            container.appendChild(div);
        });
    }

    function getCanvasCoords(e) {
        const rect = hairEditor.canvas.getBoundingClientRect();
        const scaleX = hairEditor.canvas.width / rect.width;
        const scaleY = hairEditor.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function startPaint(e) {
        if(!hairEditor.active) return;
        hairEditor.isDrawing = true;

        // Push state for undo BEFORE drawing
        hairEditor.history.push(JSON.parse(JSON.stringify(hairEditor.data)));
        if(hairEditor.history.length > 10) hairEditor.history.shift();

        paint(e);
    }

    function movePaint(e) {
        if(hairEditor.isDrawing) paint(e);
    }

    function endPaint() {
        hairEditor.isDrawing = false;
    }

    function paint(e) {
        const pos = getCanvasCoords(e);
        const cx = hairEditor.canvas.width / 2;
        const cy = hairEditor.canvas.height / 2;
        const r = hairEditor.headRadius;

        if (hairEditor.isEraser) {
            const bx = (pos.x - cx) / r;
            const by = (pos.y - cy) / r;
            const br = hairEditor.brushSize / r;

            const list = (hairEditor.view === 'back') ? hairEditor.data.back : hairEditor.data.front;
            const newList = list.filter(b => {
                const dx = b.x - bx;
                const dy = b.y - by;
                // Collision check (blob center vs eraser circle)
                // A bit generous overlap for better feel
                return Math.sqrt(dx*dx + dy*dy) > (b.r + br * 0.5);
            });

            if (list.length !== newList.length) {
                if(hairEditor.view === 'back') hairEditor.data.back = newList;
                else hairEditor.data.front = newList;
                renderHairEditor();
            }
        } else {
            const blob = {
                x: (pos.x - cx) / r,
                y: (pos.y - cy) / r,
                r: hairEditor.brushSize / r,
                c: hairEditor.colorIndex,
                a: hairEditor.brushAlpha
            };

            if(hairEditor.view === 'back') hairEditor.data.back.push(blob);
            else hairEditor.data.front.push(blob);

            renderHairEditor();
        }
    }

    window.undoHairStroke = function() {
        if(hairEditor.history.length > 0) {
            hairEditor.data = hairEditor.history.pop();
            renderHairEditor();
        }
    };

    window.clearHairLayer = function() {
        hairEditor.history.push(JSON.parse(JSON.stringify(hairEditor.data)));
        if(hairEditor.view === 'back') hairEditor.data.back = [];
        else hairEditor.data.front = [];
        renderHairEditor();
    };

    window.loadCustomHairSlot = function(slotIndex) {
        slotIndex = parseInt(slotIndex);
        const id = 'custom_' + slotIndex;
        // Check if data exists in playerData
        const existing = playerData.customHairstyles.find(h => h.id === id);

        if (existing) {
            hairEditor.data = JSON.parse(JSON.stringify(existing.blobs)); // Deep copy
        } else {
            hairEditor.data = { back: [], front: [] };
        }
        renderHairEditor();
    };

    window.saveCustomHair = function() {
        const slot = parseInt(document.getElementById('hairSaveSlot').value);
        const id = 'custom_' + slot;

        // Update or Add
        const existingIdx = playerData.customHairstyles.findIndex(h => h.id === id);
        const newEntry = {
            id: id,
            blobs: JSON.parse(JSON.stringify(hairEditor.data))
        };

        if(existingIdx !== -1) {
            playerData.customHairstyles[existingIdx] = newEntry;
        } else {
            playerData.customHairstyles.push(newEntry);
        }

        // Ensure unlocked
        if(!playerData.unlockedHairstyles.includes(id)) playerData.unlockedHairstyles.push(id);

        // Auto-equip
        playerData.customHairstyle = id;

        saveData();
        showNotification("COIFFURE SAUVEGARDÉE !", 0);
    };

    function renderHairEditor() {
        const ctx = hairEditor.ctx;
        const w = hairEditor.canvas.width;
        const h = hairEditor.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = hairEditor.headRadius;

        ctx.clearRect(0, 0, w, h);

        // Draw Head Template (Guide)
        ctx.fillStyle = '#8d5524'; // Generic skin
        if(playerData.customSkinSettings && SKIN_TONES[playerData.customSkinSettings.skinToneIndex]) {
             ctx.fillStyle = SKIN_TONES[playerData.customSkinSettings.skinToneIndex];
        }
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

        // Guide lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke(); // Center vert
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); // Center horz

        if (hairEditor.view === 'front') {
            // Draw Face Template
            // Eyes
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.ellipse(cx - 30, cy - 10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 30, cy - 10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
            // Mouth
            ctx.beginPath(); ctx.arc(cx, cy + 30, 10, 0, Math.PI); ctx.stroke();
        } else {
            // Back view guide
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillText("ARRIÈRE TÊTE", cx - 40, cy + 5);
        }

        // Render Blobs

        const drawBlobs = (list) => {
            list.forEach(b => {
                ctx.fillStyle = HAIR_COLORS[b.c];
                const alpha = (b.a !== undefined) ? b.a : 1.0;
                const oldAlpha = ctx.globalAlpha;
                ctx.globalAlpha = oldAlpha * alpha;

                ctx.beginPath();
                ctx.arc(cx + b.x * r, cy + b.y * r, b.r * r, 0, Math.PI*2);
                ctx.fill();

                ctx.globalAlpha = oldAlpha;
            });
        };

        // We cleared screen, drew head.
        // Actually, head should be sandwiched.
        // Let's re-clear and do proper order.
        ctx.clearRect(0, 0, w, h);

        // Background Layer (The "Other side")
        if (hairEditor.view === 'back') {
            // Draw Front blobs dim/behind
            ctx.globalAlpha = 0.3;
            drawBlobs(hairEditor.data.front);
            ctx.globalAlpha = 1.0;
        } else {
            // Draw Back blobs dim/behind
            ctx.globalAlpha = 0.3;
            drawBlobs(hairEditor.data.back);
            ctx.globalAlpha = 1.0;
        }

        // Draw Head
        ctx.fillStyle = '#8d5524';
        if(playerData.customSkinSettings && SKIN_TONES[playerData.customSkinSettings.skinToneIndex]) {
             ctx.fillStyle = SKIN_TONES[playerData.customSkinSettings.skinToneIndex];
        }
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();

        // Guide lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

        // Face features on Front view
        if (hairEditor.view === 'front') {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.ellipse(cx - 30, cy - 10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 30, cy - 10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy + 30, 10, 0, Math.PI); ctx.stroke();
        }

        // Foreground Layer (Active side)
        if (hairEditor.view === 'back') {
            drawBlobs(hairEditor.data.back);
        } else {
            drawBlobs(hairEditor.data.front);
        }
    }
