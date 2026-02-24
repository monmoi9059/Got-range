import sys

# New Content
new_code = """    // --- Hairstyle Sprite System ---
    const g_hairSpriteCache = new Map(); // Key: "sheet_index_color" -> Canvas
    const g_hairSheets = [null, null, null]; // Image objects

    function getHairSprite(sheetIdx, spriteIdx, color) {
        // Load sheet if needed
        if (!g_hairSheets[sheetIdx]) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = HAIRSTYLE_SHEETS[sheetIdx];
            g_hairSheets[sheetIdx] = img;
        }

        const img = g_hairSheets[sheetIdx];
        if (!img.complete || img.naturalWidth === 0) return null; // Not ready

        const key = ;
        if (g_hairSpriteCache.has(key)) return g_hairSpriteCache.get(key);

        // Generate Sprite
        // Grid: 8 cols, 6 rows.
        const cols = 8;
        const rows = 6;
        const cellW = img.naturalWidth / cols;
        const cellH = img.naturalHeight / rows;

        const col = spriteIdx % cols;
        const row = Math.floor(spriteIdx / cols);

        // 1. Extract and Mask
        const cvs = document.createElement('canvas');
        cvs.width = cellW;
        cvs.height = cellH;
        const ctx = cvs.getContext('2d', {willReadFrequently: true});

        ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);

        const idata = ctx.getImageData(0, 0, cellW, cellH);
        const data = idata.data;

        for(let i=0; i<data.length; i+=4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // Heuristic Masking for Gen AI Sprite Sheet
            let isTransparent = false;

            // Sky Detection (Blue is dominant channel)
            if (b > r + 20 && b > g + 20 && b > 100) isTransparent = true;
            // Grass Detection (Green is dominant channel)
            else if (g > r + 10 && g > b + 10 && g < 180) isTransparent = true;
            // Shirt (White/Light Grey) - Check high luminosity and low saturation
            else if (r > 200 && g > 200 && b > 200) isTransparent = true;
            // Skin (Peach) - R > G > B usually
            else if (r > 200 && g > 160 && b < 180 && r > b + 40) isTransparent = true;

            if (isTransparent) {
                data[i+3] = 0;
            } else {
                // Convert hair to grayscale luminance for tinting
                const lum = 0.299*r + 0.587*g + 0.114*b;
                data[i] = lum;
                data[i+1] = lum;
                data[i+2] = lum;
            }
        }

        ctx.putImageData(idata, 0, 0);

        // 2. Tint with User Color
        const tintCvs = document.createElement('canvas');
        tintCvs.width = cellW;
        tintCvs.height = cellH;
        const tCtx = tintCvs.getContext('2d');

        // Draw User Color base
        tCtx.fillStyle = color;
        tCtx.fillRect(0, 0, cellW, cellH);

        // Multiply grayscale texture on top
        tCtx.globalCompositeOperation = 'multiply';
        tCtx.drawImage(cvs, 0, 0);

        // Mask out the transparent areas (restore alpha from source)
        tCtx.globalCompositeOperation = 'destination-in';
        tCtx.drawImage(cvs, 0, 0);

        g_hairSpriteCache.set(key, tintCvs);
        return tintCvs;
    }

    function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        if (!playerData.currentHair && !skinObj.hairStyle) return;
        if (skinObj.headDetail === 'mohawk' || skinObj.headDetail === 'afro') return;

        // Use skin hair style or player default
        const hairId = skinObj.hairStyle || playerData.currentHair;

        // Find hair data
        let hairData = HAIRSTYLES.find(h => h.id === hairId);
        // Fallback
        if (!hairData) hairData = HAIRSTYLES[0];

        // Handle Bald
        if (hairId === 'bald_clean') return;
        if (hairId === 'bald_stubble') {
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             return;
        }

        if (hairData.sheet !== undefined) {
            const hairColor = skinObj.hairColor || '#000000';
            const sprite = getHairSprite(hairData.sheet, hairData.index, hairColor);

            if (sprite) {
                // Position Adjustment
                // We assume sprite is centered on head.
                const finalW = 120 * s;
                const finalH = 120 * s;

                // Center align
                ctx.drawImage(sprite, p.x - finalW/2, headY - finalH * 0.45, finalW, finalH);
            }
        }
    }
"""

with open('js/renderer.js', 'r') as f:
    lines = f.readlines()

# Replace lines 5398 to 5712 (0-indexed: 5397 to 5712)
# Check context
start_line = 5397
end_line = 5712

# Verification
if "function drawHairstyle" not in lines[start_line]:
    print(f"Error: Start line mismatch. Found: {lines[start_line]}")
    sys.exit(1)

# Perform replacement
new_lines = lines[:start_line] + [new_code + "\n"] + lines[end_line+1:]

with open('js/renderer.js', 'w') as f:
    f.writelines(new_lines)

print("Successfully updated js/renderer.js")
