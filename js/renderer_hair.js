    function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        const hairColor = skinObj.hairColor || '#000';
        let style = skinObj.hairStyle || 'bald_clean';

        // Map legacy
        if (style === 'bald') style = 'bald_clean';
        if (style === 'short') style = 'buzz_cut';

        const hairScale = skinObj.hairScale || 1.0;
        const modRadius = headRadius * hairScale;

        // Deterministic Seed
        let seed = 0;
        const seedStr = (skinObj.id || 'default') + (style || '');
        for(let i=0; i<seedStr.length; i++) seed = (seed + seedStr.charCodeAt(i)) % 10000;

        // Helper: Adjust Color
        function adjustColor(color, percent) {
            var R = parseInt(color.substring(1,3),16);
            var G = parseInt(color.substring(3,5),16);
            var B = parseInt(color.substring(5,7),16);
            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);
            R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255;
            var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
            var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
            var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
            return "#"+RR+GG+BB;
        }

        // --- 0. CUSTOM ---
        if (style.startsWith('custom_')) {
             if (playerData.customHairstyles) {
                 const customData = playerData.customHairstyles.find(h => h.id === style);
                 if (customData && customData.blobs && customData.blobs.back) {
                     drawCustomBlobs(ctx, p, headY, headRadius, s, customData.blobs.back);
                 }
             }
             return;
        }

        // --- 1. BALD / STUBBLE ---
        if (style === 'bald_clean') {
             // Shiny Skin Match - 2.5D Gloss
             const shine = ctx.createRadialGradient(p.x, headY - headRadius*0.5, 0, p.x, headY - headRadius*0.5, headRadius);
             shine.addColorStop(0, 'rgba(255,255,255,0.4)');
             shine.addColorStop(0.5, 'rgba(255,255,255,0.1)');
             shine.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = shine;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             return;
        }

        if (style === 'bald_stubble') {
             // 2.5D Stubble Gradient
             const stubbleGrad = ctx.createRadialGradient(p.x, headY, headRadius*0.5, p.x, headY, headRadius);
             stubbleGrad.addColorStop(0, 'rgba(0,0,0,0)'); // Skin showing top
             stubbleGrad.addColorStop(1, hairColor); // Hair on sides/back
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = stubbleGrad;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             ctx.globalAlpha = 1.0;
             return;
        }

        // --- 2. FADES / BUZZ / SHORT ---
        if (style.startsWith('fade_') || style.startsWith('buzz_') || style === 'caesar_cut' || style === 'waves_360') {
             // Base Layer (Darker top/sides)
             let topColor = hairColor;
             let sideColor = adjustColor(hairColor, -10); // Darker sides for fade

             if (style === 'buzz_colored') {
                 topColor = skinObj.hairColor || '#00FF00'; // Rodman Green
                 sideColor = skinObj.hairColor2 || '#FFD700'; // Rodman Gold
             }

             // Fade Logic: Gradient from neck (skin/light) to top (dark)
             const fadeHeight = (style === 'fade_high') ? 0.3 : (style === 'fade_low' ? 0.7 : 0.5);

             // Draw smooth head shape (hairline)
             // Base (Sides)
             const fadeGrad = ctx.createLinearGradient(p.x, headY + headRadius, p.x, headY - headRadius);
             if (style.includes('fade')) {
                 // Skin tone approximation (or just transparent if drawing over skin)
                 fadeGrad.addColorStop(0, 'rgba(0,0,0,0.1)'); // Nape
                 fadeGrad.addColorStop(fadeHeight, sideColor); // Fade line
                 fadeGrad.addColorStop(1, topColor); // Top
             } else {
                 // Buzz cut (Uniform)
                 fadeGrad.addColorStop(0, sideColor);
                 fadeGrad.addColorStop(1, topColor);
             }

             ctx.fillStyle = fadeGrad;
             ctx.beginPath(); ctx.arc(p.x, headY, modRadius, 0, Math.PI*2); ctx.fill();

             // Volume Shading (2.5D)
             const volGrad = ctx.createRadialGradient(p.x - modRadius*0.3, headY - modRadius*0.5, modRadius*0.2, p.x, headY, modRadius);
             volGrad.addColorStop(0, adjustColor(topColor, 40)); // Highlight
             volGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
             volGrad.addColorStop(1, 'rgba(0,0,0,0.4)'); // Shadow
             ctx.fillStyle = volGrad;
             ctx.fill();

             // Specific Shapes for Fades
             if (style === 'fade_box') {
                 // Flat Top
                 ctx.fillStyle = topColor;
                 ctx.beginPath();
                 ctx.moveTo(p.x - modRadius*0.9, headY - modRadius*0.5);
                 ctx.lineTo(p.x + modRadius*0.9, headY - modRadius*0.5);
                 ctx.lineTo(p.x + modRadius*0.8, headY - modRadius*1.4); // Flattop up
                 ctx.lineTo(p.x - modRadius*0.8, headY - modRadius*1.4);
                 ctx.fill();

                 // Shading for flat top surface
                 ctx.fillStyle = adjustColor(topColor, 20);
                 ctx.beginPath();
                 ctx.ellipse(p.x, headY - modRadius*1.4, modRadius*0.8, 3*s, 0, 0, Math.PI*2);
                 ctx.fill();
             }
             else if (style === 'fade_pompadour' || style === 'curly_top_fade') {
                 // Volume on top
                 ctx.fillStyle = topColor;
                 // Draw a puff on top
                 ctx.beginPath();
                 ctx.arc(p.x, headY - modRadius*0.6, modRadius*0.7, Math.PI, 0);
                 ctx.fill();

                 if (style === 'curly_top_fade') {
                     // Textured top (Curls)
                     ctx.strokeStyle = adjustColor(topColor, 10);
                     ctx.lineWidth = 2*s;
                     for(let i=0; i<8; i++) {
                         let ax = (seededRandom(seed+i)-0.5)*modRadius;
                         let ay = (seededRandom(seed+i+50)-0.5)*modRadius*0.4 - modRadius*0.7;
                         ctx.beginPath(); ctx.arc(p.x+ax, headY+ay, 3*s, 0, Math.PI*2); ctx.stroke();
                     }
                 }
             }

             // Texture Lines (Buzz Line / Part)
             if (style === 'buzz_line' || style === 'slick_side_part') {
                 ctx.strokeStyle = adjustColor(topColor, -30); // Dark line
                 ctx.lineWidth = 1.5*s;
                 ctx.beginPath();
                 ctx.moveTo(p.x + modRadius*0.5, headY - modRadius*0.2);
                 ctx.lineTo(p.x + modRadius*0.8, headY - modRadius*0.5);
                 ctx.stroke();
             }

             // Waves (360 Waves)
             if (style === 'waves_360') {
                 ctx.strokeStyle = adjustColor(topColor, 20);
                 ctx.lineWidth = 1.5*s;
                 ctx.globalAlpha = 0.3;
                 for(let w=1; w<4; w++) {
                     ctx.beginPath();
                     ctx.ellipse(p.x, headY - 5*s, modRadius * (w/4), modRadius * (w/4) * 0.8, 0, 0, Math.PI*2);
                     ctx.stroke();
                 }
                 ctx.globalAlpha = 1.0;
             }
             return;
        }

        // --- 3. AFRO / CURLS ---
        if (style.startsWith('afro_') || style === 'curls_textured') {
             // 2.5D Sphere clusters
             const afroScale = (style === 'afro_mini') ? 1.1 : (style === 'afro_70s' ? 1.6 : 1.25);
             if (style === 'curls_textured') {
                 // Tighter, less puff
                 const r = headRadius * 1.1;
                 const baseGrad = ctx.createRadialGradient(p.x, headY, r*0.5, p.x, headY, r);
                 baseGrad.addColorStop(0, hairColor);
                 baseGrad.addColorStop(1, adjustColor(hairColor, -20));
                 ctx.fillStyle = baseGrad;
                 ctx.beginPath(); ctx.arc(p.x, headY, r, 0, Math.PI*2); ctx.fill();

                 // Draw curls as rings
                 ctx.strokeStyle = adjustColor(hairColor, 20);
                 ctx.lineWidth = 2*s;
                 for(let i=0; i<20; i++) {
                     let ang = seededRandom(seed+i)*Math.PI*2;
                     let rad = seededRandom(seed+i+9)*headRadius;
                     ctx.beginPath(); ctx.arc(p.x+Math.cos(ang)*rad, headY+Math.sin(ang)*rad, 3*s, 0, Math.PI*2); ctx.stroke();
                 }
                 return;
             }

             const r = headRadius * afroScale;

             // Main Mass (Sphere with gradient)
             const grad = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.1, p.x, headY, r);
             grad.addColorStop(0, adjustColor(hairColor, 30));
             grad.addColorStop(0.6, hairColor);
             grad.addColorStop(1, adjustColor(hairColor, -30));
             ctx.fillStyle = grad;

             // Draw bumpy outline
             ctx.beginPath();
             const bumps = 12;
             for(let i=0; i<=bumps; i++) {
                 const a = (i/bumps)*Math.PI*2;
                 const bumpR = r + (Math.sin(a*bumps)*2*s); // Subtle waviness
                 const px = p.x + Math.cos(a)*bumpR;
                 const py = (headY-2*s) + Math.sin(a)*bumpR;
                 if (i===0) ctx.moveTo(px, py);
                 else ctx.lineTo(px, py);
             }
             ctx.fill();

             // Detail Texture (No floating balls, just shading blobs)
             ctx.fillStyle = adjustColor(hairColor, -10);
             const dens = 12;
             for(let i=0; i<dens; i++) {
                 const rx = (seededRandom(seed + i) - 0.5) * r * 1.4;
                 const ry = (seededRandom(seed + i + 50) - 0.5) * r * 1.4;
                 // Clip to approx shape
                 if ((rx*rx)+(ry*ry) < r*r*0.7) {
                     ctx.beginPath(); ctx.arc(p.x + rx, headY - 2*s + ry, 4*s, 0, Math.PI*2); ctx.fill();
                 }
             }
             return;
        }

        // --- 4. BRAIDS / CORNROWS ---
        if (style.startsWith('cornrows_') || style === 'braids_box' || style === 'braids_zigzag') {
             // Scalp Base
             ctx.fillStyle = adjustColor(hairColor, -20);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, modRadius, 0, Math.PI*2); ctx.fill();

             const numRows = (style === 'cornrows_straight' || style === 'braids_zigzag') ? 9 : 7;
             let rowW = 3.5 * s;
             if (style === 'cornrows_braids') { rowW = 5 * s; }
             if (style === 'braids_zigzag') { rowW = 3.5 * s; }
             if (style === 'braids_box') { rowW = 6 * s; }

             for(let i=0; i<numRows; i++) {
                 // Spherical Distribution
                 const t = (i / (numRows - 1)); // 0 to 1
                 const angle = (t - 0.5) * 2.0; // -1 to 1 (Normalized angle)
                 const theta = angle * 1.2; // Radians spread

                 // Start (Forehead/Top)
                 const sx = p.x + Math.sin(theta) * modRadius * 0.85;
                 const sy = (headY - 2*s) - Math.cos(theta) * modRadius * 0.95;

                 // End (Nape)
                 const ex = p.x + Math.sin(theta) * modRadius * 0.6;
                 const ey = (headY - 2*s) + modRadius * 0.9;

                 // Control Points for spherical wrapping
                 const cpX = p.x + Math.sin(theta) * modRadius * 1.15;
                 const cpY = (headY - 2*s); // Mid-height

                 const path = new Path2D();

                 if (style === 'braids_box') {
                     // Loose hanging braids (Travis/Asap)
                     const hangX = p.x + Math.sin(theta) * modRadius * 1.1;
                     const hangY = headY + 15*s;
                     path.moveTo(sx, sy);
                     const r1 = (seededRandom(seed + i) - 0.5) * 10 * s;
                     const r2 = (seededRandom(seed + i + 50) - 0.5) * 10 * s;
                     path.bezierCurveTo(cpX + r1, cpY, hangX + r2, hangY - 10*s, hangX, hangY);
                 } else if (style === 'braids_zigzag') {
                     path.moveTo(sx, sy);
                     const tightCpX = p.x + Math.sin(theta) * modRadius * 1.02;
                     const steps = 30;
                     const zigFreq = 10 * Math.PI;
                     const zigAmp = 1.5 * s;

                     for (let j = 1; j <= steps; j++) {
                         const t = j / steps;
                         const invT = 1 - t;
                         const bx = invT * invT * sx + 2 * invT * t * tightCpX + t * t * ex;
                         const by = invT * invT * sy + 2 * invT * t * cpY + t * t * ey;
                         const offset = Math.sin(t * zigFreq + (i * Math.PI)) * zigAmp;
                         path.lineTo(bx + offset, by);
                     }
                 } else {
                     // Standard Cornrow
                     path.moveTo(sx, sy);
                     path.quadraticCurveTo(cpX, cpY, ex, ey);
                 }

                 // Base Shadow
                 ctx.strokeStyle = adjustColor(hairColor, -40);
                 ctx.lineWidth = rowW + 1*s;
                 ctx.stroke(path);

                 // Main Color
                 ctx.strokeStyle = hairColor;
                 ctx.lineWidth = rowW;
                 ctx.lineCap = 'round';
                 ctx.stroke(path);

                 // Highlight Line (Cylindrical Shine)
                 ctx.strokeStyle = adjustColor(hairColor, 30);
                 ctx.lineWidth = rowW * 0.3;
                 ctx.globalAlpha = 0.5;
                 ctx.stroke(path);
                 ctx.globalAlpha = 1.0;

                 // Detail Pattern (Braided look - Segments)
                 if (rowW > 3*s) {
                     ctx.strokeStyle = adjustColor(hairColor, -20);
                     ctx.lineWidth = 1*s;
                     ctx.setLineDash([2*s, 3*s]);
                     ctx.stroke(path);
                     ctx.setLineDash([]);
                 }
             }
             return;
        }

        // --- 5. DREADS ---
        if (style.startsWith('dreads_')) {
             if (style === 'dreads_tied') {
                 // High Bun (Ja/Booker)
                 // Base Skull
                 ctx.fillStyle = hairColor;
                 ctx.beginPath(); ctx.arc(p.x, headY-5*s, modRadius, 0, Math.PI*2); ctx.fill();

                 // Bun
                 const bunY = headY - modRadius - 5*s;
                 const bunR = 12*s;
                 // Bun Gradient
                 const bunGrad = ctx.createRadialGradient(p.x - 5*s, bunY - 5*s, 2*s, p.x, bunY, bunR);
                 bunGrad.addColorStop(0, adjustColor(hairColor, 40));
                 bunGrad.addColorStop(1, hairColor);
                 ctx.fillStyle = bunGrad;
                 ctx.beginPath(); ctx.arc(p.x, bunY, bunR, 0, Math.PI*2); ctx.fill();

                 // Texture on bun
                 ctx.strokeStyle = adjustColor(hairColor, -20);
                 ctx.lineWidth = 2*s;
                 ctx.beginPath();
                 ctx.arc(p.x, bunY, bunR*0.8, 0, Math.PI*2);
                 ctx.stroke();

                 // Tips sticking out
                 ctx.strokeStyle = hairColor; ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(p.x, bunY); ctx.lineTo(p.x - 15*s, bunY + 10*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(p.x, bunY); ctx.lineTo(p.x + 15*s, bunY + 10*s); ctx.stroke();

             } else if (style === 'dreads_short') {
                 // Jimmy Butler / Short Dreads - Spiky but thick
                 ctx.fillStyle = adjustColor(hairColor, -10);
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, modRadius, 0, Math.PI*2); ctx.fill();

                 const num = 12;
                 const len = 10 * s;
                 for(let i=0; i<num; i++) {
                     const angle = (i/num)*Math.PI + Math.PI; // Top arc
                     const sx = p.x + Math.cos(angle) * modRadius * 0.8;
                     const sy = headY - 2*s + Math.sin(angle) * modRadius * 0.8;

                     // Draw thick rounded line (cylinder)
                     ctx.lineCap = 'round';
                     const rx = (seededRandom(seed+i) - 0.5) * 5 * s;
                     const ex = sx + rx;
                     const ey = sy + len;

                     // Shadow
                     ctx.strokeStyle = adjustColor(hairColor, -30);
                     ctx.lineWidth = 5*s;
                     ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
                     // Color
                     ctx.strokeStyle = hairColor;
                     ctx.lineWidth = 3*s;
                     ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
                 }
             } else {
                 // Loose Dreads (Long)
                 ctx.fillStyle = adjustColor(hairColor, -20); // Base
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, modRadius, 0, Math.PI*2); ctx.fill();

                 const num = 14;
                 const len = 25 * s; // Longer
                 for(let i=0; i<num; i++) {
                     const angle = (i/num) * Math.PI*1.2 + Math.PI*1.4; // Fan around head
                     const sx = p.x + Math.cos(angle) * modRadius * 0.5;
                     const sy = headY - 2*s + Math.sin(angle) * modRadius * 0.5;

                     const ex = sx + (Math.random()-0.5)*10*s;
                     const ey = sy + len + (Math.random()*10*s);

                     // Draw Strand with Gradient (Simulate cylinder)
                     const grad = ctx.createLinearGradient(sx, sy, sx+5*s, sy); // Side to side
                     grad.addColorStop(0, adjustColor(hairColor, -20));
                     grad.addColorStop(0.5, adjustColor(hairColor, 20)); // Shine
                     grad.addColorStop(1, adjustColor(hairColor, -20));

                     ctx.strokeStyle = grad;
                     ctx.lineWidth = 6*s;
                     ctx.lineCap = 'round';
                     ctx.beginPath();
                     ctx.moveTo(sx, sy);
                     ctx.quadraticCurveTo(sx + (ex-sx)/2 + 5*s, sy + (ey-sy)/2, ex, ey);
                     ctx.stroke();
                 }
             }
             return;
        }

        // --- 6. LONG / FLOW ---
        if (style === 'long_flow' || style === 'surfer_flow' || style === 'med_wavy') {
             // Flowing locks (Nash/Dirk)
             const hairLen = (style === 'long_flow') ? 25*s : 20*s;

             // Back Base (Darker)
             ctx.fillStyle = adjustColor(hairColor, -20);
             ctx.beginPath();
             ctx.moveTo(p.x - modRadius, headY);
             ctx.quadraticCurveTo(p.x - modRadius*1.2, headY + hairLen, p.x - modRadius*0.8, headY + hairLen + 10*s); // Left flare
             ctx.lineTo(p.x + modRadius*0.8, headY + hairLen + 10*s);
             ctx.quadraticCurveTo(p.x + modRadius*1.2, headY + hairLen, p.x + modRadius, headY);
             ctx.fill();

             // Main Volume Gradient
             const volGrad = ctx.createLinearGradient(p.x, headY - modRadius, p.x, headY + hairLen);
             volGrad.addColorStop(0, adjustColor(hairColor, 20)); // Top highlight
             volGrad.addColorStop(0.5, hairColor);
             volGrad.addColorStop(1, adjustColor(hairColor, -10)); // Bottom shadow

             ctx.fillStyle = volGrad;
             ctx.beginPath();
             ctx.arc(p.x, headY - 5*s, modRadius, Math.PI, 0); // Top
             ctx.lineTo(p.x + modRadius, headY + hairLen); // Right down
             // Bottom wave
             ctx.quadraticCurveTo(p.x, headY + hairLen + 5*s, p.x - modRadius, headY + hairLen);
             ctx.lineTo(p.x - modRadius, headY - 5*s);
             ctx.fill();

             // Individual Strands/Highlights
             ctx.strokeStyle = 'rgba(255,255,255,0.1)';
             ctx.lineWidth = 2*s;
             ctx.beginPath();
             ctx.moveTo(p.x - modRadius*0.6, headY);
             ctx.quadraticCurveTo(p.x - modRadius*0.7, headY + hairLen*0.5, p.x - modRadius*0.5, headY + hairLen);
             ctx.stroke();

             ctx.beginPath();
             ctx.moveTo(p.x + modRadius*0.6, headY);
             ctx.quadraticCurveTo(p.x + modRadius*0.7, headY + hairLen*0.5, p.x + modRadius*0.5, headY + hairLen);
             ctx.stroke();
             return;
        }

        // --- 7. UNIQUE STYLES ---
        if (style === 'mullet_80s') {
             // Business front, Party back
             // Top (Short)
             ctx.fillStyle = hairColor;
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, modRadius, Math.PI, 0); ctx.fill();
             // Back (Long Flap)
             const flapW = modRadius * 1.8;
             const flapH = 20*s;
             ctx.fillStyle = adjustColor(hairColor, -10);
             ctx.beginPath();
             ctx.moveTo(p.x - flapW/2, headY);
             ctx.lineTo(p.x + flapW/2, headY);
             ctx.lineTo(p.x + flapW/2 + 5*s, headY + flapH); // Flare out
             ctx.lineTo(p.x - flapW/2 - 5*s, headY + flapH);
             ctx.fill();
             // Texture
             ctx.strokeStyle = adjustColor(hairColor, 10);
             ctx.lineWidth = 2*s;
             for(let i=0; i<5; i++) {
                 ctx.beginPath(); ctx.moveTo(p.x - 10*s + i*5*s, headY + 5*s); ctx.lineTo(p.x - 10*s + i*5*s, headY + flapH - 2*s); ctx.stroke();
             }
             return;
        }

        if (style === 'top_knot' || style === 'med_bun') {
             // Tight sides, bun on top
             // Base (Tight)
             const tightGrad = ctx.createRadialGradient(p.x, headY, modRadius*0.5, p.x, headY, modRadius);
             tightGrad.addColorStop(0, hairColor);
             tightGrad.addColorStop(1, adjustColor(hairColor, -20));
             ctx.fillStyle = tightGrad;
             ctx.beginPath(); ctx.arc(p.x, headY - 5*s, modRadius, 0, Math.PI*2); ctx.fill();

             // Bun
             const bunY = headY - modRadius - 5*s;
             const bunR = 8*s;
             ctx.fillStyle = adjustColor(hairColor, 10); // Lighter bun
             ctx.beginPath(); ctx.arc(p.x, bunY, bunR, 0, Math.PI*2); ctx.fill();
             // Knot detail
             ctx.strokeStyle = adjustColor(hairColor, -30);
             ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.arc(p.x, bunY, bunR, 0, Math.PI*2); ctx.stroke();
             return;
        }

        if (style === 'anchor_man_80s' || style === 'slicked_back' || style === 'slick_side_part' || style === 'ivy_league' || style === 'undercut_slick' || style === 'crew_messy' || style === 'shaggy_top' || style === 'side_swept_fringe' || style === 'surfer_flow' || style === 'med_bob' || style === 'med_shag' || style === 'med_curtain' || style === 'med_wolf' || style === 'med_twist' || style === 'med_braids' || style === 'med_slick' || style === 'med_bedhead' || style === 'med_undercut') {
             // MEDIUM / TEXTURED / SLICK
             const isUndercut = (style === 'undercut_slick' || style === 'med_undercut');
             const sideLen = isUndercut ? 0 : 4*s;

             // Base Sides
             const sideColor = isUndercut ? adjustColor(hairColor, -40) : adjustColor(hairColor, -10);
             if (isUndercut) {
                 // Shaved sides gradient
                 const shaveGrad = ctx.createLinearGradient(p.x, headY + headRadius, p.x, headY);
                 shaveGrad.addColorStop(0, 'rgba(0,0,0,0.1)');
                 shaveGrad.addColorStop(1, sideColor);
                 ctx.fillStyle = shaveGrad;
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, modRadius, 0, Math.PI*2); ctx.fill();
             } else {
                 ctx.fillStyle = sideColor;
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, modRadius, 0, Math.PI*2); ctx.fill();
             }

             // Top Mass
             ctx.fillStyle = hairColor;
             let topW = modRadius * 0.9;
             let topH = modRadius * 1.1; // Height above origin

             if (style === 'anchor_man_80s') { topW *= 1.2; topH *= 1.1; } // Big hair
             if (style === 'shaggy_top') { topW *= 1.1; }

             ctx.beginPath();
             // Top Arc
             ctx.moveTo(p.x - topW, headY - 5*s);
             ctx.bezierCurveTo(p.x - topW, headY - topH*1.5, p.x + topW, headY - topH*1.5, p.x + topW, headY - 5*s);

             // Bottom Edge
             if (isUndercut) {
                 ctx.lineTo(p.x + topW*0.6, headY + 5*s); // Slick back point
                 ctx.lineTo(p.x - topW*0.6, headY + 5*s);
             } else if (style === 'anchor_man_80s') {
                 ctx.lineTo(p.x + topW, headY + 10*s); // Full back
                 ctx.lineTo(p.x - topW, headY + 10*s);
             } else {
                 // Tapered back
                 ctx.quadraticCurveTo(p.x, headY + 10*s, p.x - topW, headY - 5*s);
             }
             ctx.fill();

             // Texture Lines
             ctx.strokeStyle = adjustColor(hairColor, 20);
             ctx.lineWidth = 2*s;
             ctx.beginPath();
             const lines = 5;
             for(let i=0; i<lines; i++) {
                 const t = (i/lines);
                 const x = p.x - topW*0.6 + t * topW * 1.2;
                 ctx.moveTo(x, headY - topH * 0.8);
                 ctx.lineTo(x, headY + 5*s);
             }
             ctx.stroke();

             // Messy bits for shag/bedhead
             if (style === 'med_bedhead' || style === 'shaggy_top' || style === 'crew_messy') {
                 ctx.fillStyle = hairColor;
                 for(let i=0; i<6; i++) {
                     const ang = (i/6)*Math.PI*2;
                     const rad = topW;
                     const sx = p.x + Math.cos(ang)*rad;
                     const sy = headY - 5*s + Math.sin(ang)*rad;
                     ctx.beginPath();
                     ctx.arc(sx, sy, 4*s, 0, Math.PI*2);
                     ctx.fill();
                 }
             }

             return;
        }

        // --- 8. DEFAULT / UNKNOWN ---
        // Basic Layered Cut
        const defGrad = ctx.createRadialGradient(p.x - modRadius*0.3, headY - modRadius*0.5, 0, p.x, headY, modRadius);
        defGrad.addColorStop(0, adjustColor(hairColor, 30));
        defGrad.addColorStop(1, hairColor);
        ctx.fillStyle = defGrad;
        ctx.beginPath(); ctx.arc(p.x, headY - 5*s, modRadius, 0, Math.PI*2); ctx.fill();

                     // Irregular patches
                     ctx.beginPath();
                     ctx.ellipse(sx, sy, 6*s, 4*s, seededRandom(seed+i)*3, 0, Math.PI*2);
                     ctx.fill();
                 }
                 ctx.restore();
             } else {
                 const grad = ctx.createLinearGradient(0, headY - modRadius, 0, headY + 5*s);
                 grad.addColorStop(0, adjustColor(hairColor, 20));
                 grad.addColorStop(1, adjustColor(hairColor, -10));
                 drawSolidLayeredBase(1.01, 0, grad, false, 'natural');
             }
             return;
        }

        if (style.startsWith('fade_')) {
             // Skin fade base (Shaved sides)
             drawSolidLayeredBase(1.0, 2*s, adjustColor(hairColor, -30), false, 'shaved');

             // Top geometry varies
             const w = modRadius * 0.9;
             let topH = modRadius * 1.1;

             if (style === 'fade_box') topH = modRadius * 1.5; // Flat top
