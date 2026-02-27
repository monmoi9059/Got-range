// --- HAIR CREATOR LOGIC ---
// Encapsulated logic for the hair creation UI

var HairEditor = {
    canvas: null,
    ctx: null,
    resolution: 32, // Pixel art resolution (32x32 grid)
    scale: 1,
    isDrawing: false,
    view: 'back', // 'back' (hair) or 'front' (beard)
    pixels: {
        back: [], // Array of {x, y, color}
        front: []
    },
    brushSize: 1,
    brushColor: '#000000',
    brushAlpha: 1.0,
    isEraser: false,
    history: [], // For undo

    init: function() {
        this.canvas = document.getElementById('hairEditorCanvas');
        if (!this.canvas) return; // UI not loaded yet
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Setup initial empty grid
        this.clearData();

        // Bind Events
        this.canvas.addEventListener('mousedown', this.startDraw.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.endDraw.bind(this));
        this.canvas.addEventListener('mouseleave', this.endDraw.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.startDraw(e.touches[0]); });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.draw(e.touches[0]); });
        this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.endDraw(); });

        // Setup Colors
        this.renderPalette();
        this.renderCanvas();
    },

    clearData: function() {
        this.pixels = { back: [], front: [] };
        this.history = [];
    },

    setView: function(v) {
        this.view = v;
        // Update UI buttons
        document.getElementById('btnHairViewBack').style.background = (v === 'back') ? '#444' : '#222';
        document.getElementById('btnHairViewFront').style.background = (v === 'front') ? '#444' : '#222';
        this.renderCanvas();
    },

    renderPalette: function() {
        const container = document.getElementById('hairColorPalette');
        if (!container) return;
        container.innerHTML = '';

        // Common hair colors
        const colors = [
            '#000000', '#1a1a1a', '#333333', // Blacks/Greys
            '#5c3a21', '#4a3020', '#3e271a', // Dark Browns
            '#6B4423', '#8B4513', '#A0522D', // Med Browns
            '#dcb98a', '#e3c179', '#f0d5be', // Blondes
            '#8B0000', '#A52A2A', '#CD5C5C', // Reds/Gingers
            '#C0C0C0', '#FFFFFF', // Grey/White
            '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF' // Fun
        ];

        colors.forEach(c => {
            const div = document.createElement('div');
            div.style.width = '20px';
            div.style.height = '20px';
            div.style.backgroundColor = c;
            div.style.border = '1px solid #555';
            div.style.cursor = 'pointer';
            div.onclick = () => {
                this.brushColor = c;
                this.isEraser = false;
                this.updateUI();
            };
            container.appendChild(div);
        });
    },

    updateUI: function() {
        const eraserBtn = document.getElementById('btnEraser');
        if (eraserBtn) {
            eraserBtn.innerText = this.isEraser ? "GOMME: ON" : "GOMME: OFF";
            eraserBtn.style.background = this.isEraser ? "#8B0000" : "#444";
        }
    },

    getMousePos: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    startDraw: function(e) {
        this.isDrawing = true;
        this.saveHistory(); // Save state before stroke
        this.draw(e);
    },

    draw: function(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);

        // Map to grid
        // Canvas is 300x300, Grid is 32x32
        const cellSize = this.canvas.width / this.resolution;
        const gx = Math.floor(pos.x / cellSize);
        const gy = Math.floor(pos.y / cellSize);

        // Brush Size application
        const r = Math.floor(this.brushSize / 2);

        for (let x = -r; x <= r; x++) {
            for (let y = -r; y <= r; y++) {
                const tx = gx + x;
                const ty = gy + y;

                if (tx >= 0 && tx < this.resolution && ty >= 0 && ty < this.resolution) {
                    // Check circular brush
                    if (x*x + y*y <= r*r + 1) {
                         this.setPixel(tx, ty);
                    }
                }
            }
        }

        this.renderCanvas();
    },

    endDraw: function() {
        this.isDrawing = false;
    },

    setPixel: function(x, y) {
        const list = this.pixels[this.view];

        // Remove existing pixel at this location
        const existingIdx = list.findIndex(p => p.x === x && p.y === y);

        if (this.isEraser) {
            if (existingIdx !== -1) list.splice(existingIdx, 1);
        } else {
            const pixelData = {
                x: x,
                y: y,
                color: this.brushColor,
                alpha: this.brushAlpha // Future support for transparency
            };

            if (existingIdx !== -1) {
                list[existingIdx] = pixelData;
            } else {
                list.push(pixelData);
            }
        }
    },

    saveHistory: function() {
        // Deep copy pixels
        const snapshot = JSON.stringify(this.pixels);
        this.history.push(snapshot);
        if (this.history.length > 10) this.history.shift(); // Max 10 steps
    },

    undo: function() {
        if (this.history.length > 0) {
            const prev = this.history.pop();
            this.pixels = JSON.parse(prev);
            this.renderCanvas();
        }
    },

    clearLayer: function() {
        this.saveHistory();
        this.pixels[this.view] = [];
        this.renderCanvas();
    },

    renderCanvas: function() {
        if (!this.ctx) return;

        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid Background (Checkers)
        const cellSize = this.canvas.width / this.resolution;

        for(let x=0; x<this.resolution; x++) {
            for(let y=0; y<this.resolution; y++) {
                this.ctx.fillStyle = ((x+y)%2 === 0) ? '#ddd' : '#fff';
                this.ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
        }

        // Draw Head Template (Guide)
        this.drawHeadTemplate(cellSize);

        // Draw Pixels
        const drawList = (list) => {
            list.forEach(p => {
                this.ctx.fillStyle = p.color;
                // Add slight alpha if configured
                // this.ctx.globalAlpha = p.alpha || 1.0;
                this.ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize, cellSize);
            });
        };

        // If viewing back, draw front dimmed behind? Or just current view?
        // Let's draw current view.
        drawList(this.pixels[this.view]);

        // Draw Grid Lines
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for(let i=0; i<=this.resolution; i++) {
            this.ctx.moveTo(i*cellSize, 0); this.ctx.lineTo(i*cellSize, this.canvas.height);
            this.ctx.moveTo(0, i*cellSize); this.ctx.lineTo(this.canvas.width, i*cellSize);
        }
        this.ctx.stroke();
    },

    drawHeadTemplate: function(s) {
        // Draw a guide head
        // Head is roughly centered, radius ~12 units (if 32x32)
        const cx = this.resolution / 2;
        const cy = this.resolution / 2;
        const r = this.resolution * 0.35;

        this.ctx.save();
        this.ctx.scale(s, s);

        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Semi-transparent skin
        this.ctx.beginPath();

        if (this.view === 'back') {
            // Circle + Neck
            this.ctx.arc(cx, cy, r, 0, Math.PI*2);
            this.ctx.rect(cx - r*0.4, cy + r*0.8, r*0.8, r*0.5);
            this.ctx.fill();
            // Ears hint
            this.ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
            this.ctx.beginPath(); this.ctx.ellipse(cx - r, cy, r*0.3, r*0.5, 0, 0, Math.PI*2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.ellipse(cx + r, cy, r*0.3, r*0.5, 0, 0, Math.PI*2); this.ctx.fill();
        } else {
            // Front Face (Beard guide)
            this.ctx.arc(cx, cy, r, 0, Math.PI*2);
            this.ctx.fill();
            // Mouth area hint
            this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
            this.ctx.beginPath(); this.ctx.arc(cx, cy + r*0.4, r*0.3, 0, Math.PI*2); this.ctx.fill();
        }

        this.ctx.restore();
    },

    export: function() {
        return {
            id: 'custom_' + Date.now(),
            name: 'Custom ' + (playerData.customHairstyles ? playerData.customHairstyles.length + 1 : 1),
            blobs: {
                back: this.compress(this.pixels.back),
                front: this.compress(this.pixels.front)
            },
            resolution: this.resolution
        };
    },

    // Convert pixels to simplified rectangles/blobs for rendering
    compress: function(pixelList) {
        // Optimization: Just return the pixel list for now.
        // A smarter compressor would merge adjacent same-colored pixels.
        return pixelList;
    },

    load: function(data) {
        if (data && data.blobs) {
            this.pixels.back = data.blobs.back || [];
            this.pixels.front = data.blobs.front || [];
            this.renderCanvas();
        }
    }
};

// --- GLOBAL BINDINGS ---
window.openHairCreator = function() {
    if (typeof closeShop === 'function') closeShop(); // Close other menus
    if (state !== 'IDLE' && state !== 'SHOP' && state !== 'GAMEOVER') return; // Safety

    document.getElementById('hairCreatorUI').style.display = 'block';

    // Init Editor
    HairEditor.init();
};

window.closeHairCreator = function() {
    document.getElementById('hairCreatorUI').style.display = 'none';
    if(state === 'SHOP') window.openShop(true); // Return to shop if that's where we came from? Or just idle.
};

window.setHairEditorView = function(view) {
    HairEditor.setView(view);
};

window.updateBrushSize = function() {
    const val = parseInt(document.getElementById('brushSizeSlider').value);
    HairEditor.brushSize = val;
    document.getElementById('brushSizeVal').innerText = val;
};

window.updateBrushAlpha = function() {
    const val = parseInt(document.getElementById('brushAlphaSlider').value);
    HairEditor.brushAlpha = val / 100;
    document.getElementById('brushAlphaVal').innerText = val + "%";
};

window.toggleEraser = function() {
    HairEditor.isEraser = !HairEditor.isEraser;
    HairEditor.updateUI();
};

window.clearHairLayer = function() {
    HairEditor.clearLayer();
};

window.undoHairStroke = function() {
    HairEditor.undo();
};

window.saveCustomHair = function() {
    const slot = parseInt(document.getElementById('hairSaveSlot').value);
    const data = HairEditor.export();

    if (!playerData.customHairstyles) playerData.customHairstyles = [];

    // Replace or Add
    // Actually we store by ID, but we want slots for UI simplicity
    // Let's just store up to 5 custom styles in the array
    if (playerData.customHairstyles[slot]) {
        playerData.customHairstyles[slot] = data;
    } else {
        playerData.customHairstyles[slot] = data;
    }

    // Register as unlockable/selectable
    // Add to HAIRSTYLES global DB dynamically?
    // No, renderer handles custom data from playerData.

    // Auto-equip
    playerData.customHairstyle = data.id;

    saveData();
    window.closeHairCreator();

    // Show notification
    showNotification("COIFFURE SAUVEGARDÉE !", 0);

    // Update shop UI if open
    if(typeof updateShopUI === 'function') updateShopUI();
};

// --- RENDERER HELPER FOR CUSTOM HAIR ---
// This function is called by the main renderer to draw the pixel data
function drawCustomBlobs(ctx, p, headY, headRadius, s, pixelList) {
    if (!pixelList || pixelList.length === 0) return;

    // Grid scaling
    // Resolution 32 pixels covers approx 2.5 * headRadius width
    const gridScale = (headRadius * 2.8) / 32;
    const offsetX = p.x - (16 * gridScale);
    const offsetY = headY - (16 * gridScale);

    pixelList.forEach(px => {
        ctx.fillStyle = px.color;
        // ctx.globalAlpha = px.alpha || 1.0;
        // Draw slightly larger to avoid gaps
        ctx.fillRect(offsetX + px.x * gridScale, offsetY + px.y * gridScale, gridScale * 1.05, gridScale * 1.05);
    });
    // ctx.globalAlpha = 1.0;
}
