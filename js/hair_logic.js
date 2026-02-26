    // --- HAIR CREATOR LOGIC ---
    var hairCanvas, hairCtx;
    var isDrawingHair = false;
    var hairBrushSize = 10;
    var hairBrushAlpha = 100;
    var hairColor = '#000000';
    var isEraser = false;
    var hairHistory = [];
    var hairView = 'back'; // 'back' or 'front'
    var hairZoom = 1.0;

    function initHairCreator() {
        hairCanvas = document.getElementById('hairEditorCanvas');
        if (hairCanvas) {
            hairCtx = hairCanvas.getContext('2d', { willReadFrequently: true });

            // Setup events
            hairCanvas.addEventListener('mousedown', startHairDraw);
            hairCanvas.addEventListener('mousemove', drawHair);
            hairCanvas.addEventListener('mouseup', stopHairDraw);
            hairCanvas.addEventListener('mouseout', stopHairDraw);

            // Touch support
            hairCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                startHairDraw({ clientX: touch.clientX, clientY: touch.clientY });
            }, {passive: false});

            hairCanvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                drawHair({ clientX: touch.clientX, clientY: touch.clientY });
            }, {passive: false});

            hairCanvas.addEventListener('touchend', stopHairDraw);

            renderHairColorPalette();
            drawGuideHead(); // Init background
        }
    }

    function renderHairColorPalette() {
        const p = document.getElementById('hairColorPalette');
        if (!p) return;
        p.innerHTML = '';
        HAIR_COLORS.forEach(c => {
            const div = document.createElement('div');
            div.style.width = '25px';
            div.style.height = '25px';
            div.style.backgroundColor = c;
            div.style.border = '1px solid #555';
            div.style.cursor = 'pointer';
            div.onclick = () => {
                hairColor = c;
                isEraser = false;
                document.getElementById('btnEraser').innerText = "GOMME: OFF";
                document.getElementById('btnEraser').style.background = "#444";
                // Highlight selection
                Array.from(p.children).forEach(d => d.style.borderColor = '#555');
                div.style.borderColor = '#FFF';
            };
            p.appendChild(div);
        });
    }

    window.openHairCreator = function() {
        window.closeControlsMenu();
        loadContext(game1);
        if(state !== 'IDLE' && state !== 'GAMEOVER') return;

        state = 'HAIR_CREATOR';
        document.getElementById('hairCreatorUI').style.display = 'flex'; // Flex for centering

        // Init canvas if needed
        if(!hairCanvas) initHairCreator();

        // Load current custom hair if exists
        loadCustomHairFromSlot(0); // Default to slot 1

        saveContext(game1);
    }

    window.closeHairCreator = function() {
        document.getElementById('hairCreatorUI').style.display = 'none';
        state = 'IDLE';
        // Open shop back up
        openShop();
    }

    window.setHairEditorView = function(view) {
        hairView = view;
        // Visual toggle
        document.getElementById('btnHairViewBack').style.border = view === 'back' ? '2px solid #FFF' : '1px solid #555';
        document.getElementById('btnHairViewFront').style.border = view === 'front' ? '2px solid #FFF' : '1px solid #555';
        // Redraw canvas with correct layer
        redrawHairCanvas();
    }

    // Fix mouse pos for CSS zoom
    function getMousePos(evt) {
        if (!hairCanvas) return { x: 0, y: 0 };
        const rect = hairCanvas.getBoundingClientRect();
        // With CSS scale, rect will be scaled.
        // clientX within rect.
        // we want coord relative to 300x300 internal resolution.

        const x = (evt.clientX - rect.left) / (rect.width / hairCanvas.width);
        const y = (evt.clientY - rect.top) / (rect.height / hairCanvas.height);
        return { x, y };
    }

    function startHairDraw(e) {
        if (!hairCanvas || !hairCtx) return;
        isDrawingHair = true;
        const pos = getMousePos(e);
        saveHairState(); // Push to history

        hairCtx.beginPath();
        hairCtx.moveTo(pos.x, pos.y);

        // Setup brush
        hairCtx.lineCap = 'round';
        hairCtx.lineJoin = 'round';
        hairCtx.lineWidth = hairBrushSize;
        hairCtx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : `rgba(${hexToRgb(hairColor)}, ${hairBrushAlpha/100})`;
        hairCtx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

        // Draw single dot
        hairCtx.lineTo(pos.x, pos.y);
        hairCtx.stroke();
    }

    function drawHair(e) {
        if(!isDrawingHair || !hairCtx) return;
        const pos = getMousePos(e);
        hairCtx.lineTo(pos.x, pos.y);
        hairCtx.stroke();
    }

    function stopHairDraw() {
        if(isDrawingHair) {
            isDrawingHair = false;
            if(hairCtx) hairCtx.closePath();
            // Save to current layer data
            saveLayerData();
        }
    }

    window.updateBrushSize = function() {
        hairBrushSize = parseInt(document.getElementById('brushSizeSlider').value);
        document.getElementById('brushSizeVal').innerText = hairBrushSize;
    }

    window.updateHairZoom = function() {
        // Safety check if called before init
        if (!hairCanvas) hairCanvas = document.getElementById('hairEditorCanvas');
        if (!hairCanvas) return;

        const val = parseFloat(document.getElementById('hairZoomSlider').value);
        hairZoom = val;
        document.getElementById('hairZoomVal').innerText = Math.round(val * 100) + "%";

        // Apply transform to canvas element
        hairCanvas.style.transform = `scale(${hairZoom})`;
        hairCanvas.style.transformOrigin = "center";

        // Ensure parent has overflow hidden
        if (hairCanvas.parentElement) {
            hairCanvas.parentElement.style.overflow = "hidden";
        }
    }

    window.updateBrushAlpha = function() {
        hairBrushAlpha = parseInt(document.getElementById('brushAlphaSlider').value);
        document.getElementById('brushAlphaVal').innerText = hairBrushAlpha + "%";
    }

    window.toggleEraser = function() {
        isEraser = !isEraser;
        const btn = document.getElementById('btnEraser');
        if(isEraser) {
            btn.innerText = "GOMME: ON";
            btn.style.background = "#FF0000";
        } else {
            btn.innerText = "GOMME: OFF";
            btn.style.background = "#444";
        }
    }

    window.clearHairLayer = function() {
        if (!hairCtx) return;
        saveHairState();
        hairCtx.clearRect(0, 0, hairCanvas.width, hairCanvas.height);
        saveLayerData();
    }

    window.undoHairStroke = function() {
        if(hairHistory.length > 0 && hairCtx) {
            const last = hairHistory.pop();
            const img = new Image();
            img.onload = function() {
                hairCtx.clearRect(0, 0, hairCanvas.width, hairCanvas.height);
                hairCtx.drawImage(img, 0, 0);
                saveLayerData();
            };
            img.src = last;
        }
    }

    function saveHairState() {
        if (!hairCanvas) return;
        hairHistory.push(hairCanvas.toDataURL());
        if(hairHistory.length > 10) hairHistory.shift();
    }

    // Layer Management (Back vs Front)
    var currentHairData = { back: null, front: null };

    function saveLayerData() {
        if (!hairCanvas) return;
        currentHairData[hairView] = hairCanvas.toDataURL();
    }

    function drawGuideHead() {
        if (!hairCanvas) return;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="60" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
            <rect x="130" y="210" width="40" height="50" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
        </svg>`;
        const url = "data:image/svg+xml;base64," + btoa(svg);
        hairCanvas.style.backgroundImage = `url('${url}')`;
        hairCanvas.style.backgroundSize = "contain";
    }

    function redrawHairCanvas() {
        if (!hairCtx || !hairCanvas) return;
        hairCtx.clearRect(0, 0, hairCanvas.width, hairCanvas.height);
        if (currentHairData[hairView]) {
            const img = new Image();
            img.onload = function() {
                hairCtx.drawImage(img, 0, 0);
            };
            img.src = currentHairData[hairView];
        }
    }

    // Hex to RGB helper
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
    }

    window.saveCustomHair = function() {
        const slot = document.getElementById('hairSaveSlot').value;
        const id = `custom_${slot}`;

        // Find or create in HAIRSTYLES
        let hairObj = HAIRSTYLES.find(h => h.id === id);
        if (!hairObj) {
            hairObj = { id: id, name: `Perso ${parseInt(slot)+1}`, cost: 0, isCustom: true };
            HAIRSTYLES.push(hairObj);
        }

        // Save images data to LocalStorage (separate key to avoid bloating playerData too much?)
        // Or put in playerData.customHairData[slot]
        if (!playerData.customHairData) playerData.customHairData = {};
        playerData.customHairData[id] = {
            back: currentHairData.back,
            front: currentHairData.front
        };

        // Auto equip
        playerData.customHairstyle = id;

        saveData();
        showNotification("COIFFURE SAUVEGARDÉE !", 0);
        closeHairCreator();
    }

    window.loadCustomHairFromSlot = function(slotIdx) {
        const slot = document.getElementById('hairSaveSlot').value || slotIdx;
        const id = `custom_${slot}`;

        // Reset current session
        currentHairData = { back: null, front: null };
        hairHistory = [];

        if (playerData.customHairData && playerData.customHairData[id]) {
            currentHairData.back = playerData.customHairData[id].back;
            currentHairData.front = playerData.customHairData[id].front;
        }

        // Refresh view
        setHairEditorView('back'); // Default to back view
    }

    // Hook dropdown change
    const hairSaveSlot = document.getElementById('hairSaveSlot');
    if (hairSaveSlot) {
        hairSaveSlot.addEventListener('change', function() {
            loadCustomHairFromSlot(this.value);
        });
    }
