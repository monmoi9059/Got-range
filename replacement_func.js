    function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        const hairColor = skinObj.hairColor || '#000';
        const style = skinObj.hairStyle || 'bald_clean';
        const skinTone = skinObj.skinTone || '#8d5524';

        // Helper for consistent texture
        const getSeed = (offset) => {
            let h = 0;
            const str = skinObj.id || 'default';
            for(let i=0; i<str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
            return Math.abs(h + offset);
        };

        const baseSeed = getSeed(0);

        // Setup Base Gradient for "Realistic Shading"
        const drawBaseCap = (radiusMod, color) => {
             // Use sketchy circle logic but filled with gradient
             const points = [];
             const segs = 32;
             const r = headRadius * radiusMod;
             let idx = (baseSeed * 150) & (NOISE_LUT_SIZE - 1);
             for (let i = 0; i < segs; i++) {
                const angle = (i / segs) * Math.PI * 2;
                idx = (idx + 1) & (NOISE_LUT_SIZE - 1);
                // Less wobble for base cap (scalp adherence)
                const rMod = r * (1.0 + (g_noiseLUT[idx] - 0.5) * 0.05);
                points.push({
                    x: p.x + Math.cos(angle) * rMod,
                    y: headY + Math.sin(angle) * rMod
                });
             }

             // Gradient
             const grad = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.2, p.x, headY, r*1.2);
             if (color instanceof CanvasGradient) {
                 ctx.fillStyle = color;
             } else {
                 grad.addColorStop(0, '#FFFFFF'); // Specular
                 grad.addColorStop(0.2, color);
                 grad.addColorStop(1.0, 'rgba(0,0,0,0.8)'); // Shadow
                 ctx.fillStyle = color;
             }

             drawSketchyFill(ctx, points, color, baseSeed); // Fill solid first

             if (!(color instanceof CanvasGradient)) {
                 // Overlay Shadow
                 ctx.save();
                 ctx.beginPath();
                 ctx.moveTo(points[0].x, points[0].y);
                 for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                 ctx.clip();
                 const shadowGrad = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.2, p.x, headY, r*1.2);
                 shadowGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
                 shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
                 shadowGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
                 ctx.fillStyle = shadowGrad;
                 ctx.fill();
                 ctx.restore();
             }
        };

        // 1. SCALP PROTECTION (The Fix)
        // Ensure scalp is covered for styles that sit on top
        if (style.includes('fade') || style.includes('mohawk') || style.includes('short') || style.includes('cornrows') || style.includes('braids') || style.includes('dread')) {
             drawBaseCap(0.98, skinTone);
        }

        // 2. STYLES
        if (style === 'bald_clean') {
            const shine = ctx.createRadialGradient(p.x + headRadius*0.3, headY - headRadius*0.4, 0, p.x + headRadius*0.3, headY - headRadius*0.4, headRadius*0.5);
            shine.addColorStop(0, 'rgba(255,255,255,0.4)');
            shine.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = shine;
            ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
            drawSketchyCircle(ctx, p.x, headY, headRadius, 'rgba(0,0,0,0.1)', baseSeed, false);
            return;
        }

        if (style === 'bald_stubble' || style === 'buzz_cut' || style === 'bald') {
            drawBaseCap(1.0, hairColor);
            // Stipple Texture
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for(let i=0; i<40; i++) {
                const ang = Math.random() * Math.PI * 2;
                const r = Math.random() * headRadius * 0.9;
                ctx.fillRect(p.x + Math.cos(ang)*r, headY + Math.sin(ang)*r, 1.5*s, 1.5*s);
            }
            return;
        }

        if (style.includes('afro') || style === 'curly') {
            const afroSize = (style.includes('afro') ? 1.5 : 1.2);
            drawBaseCap(afroSize, hairColor);

            // Sketchy Curls
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1.5 * s;
            const r = headRadius * afroSize;
            for(let i=0; i<12; i++) {
                const ang = (i/12)*Math.PI*2;
                const cr = r * 0.8;
                const cx = p.x + Math.cos(ang)*cr;
                const cy = headY + Math.sin(ang)*cr - 2*s;
                drawSketchyCircle(ctx, cx, cy, 6*s, 'rgba(0,0,0,0)', baseSeed+i, false); // Just outline
            }
            return;
        }

        if (style.includes('fade')) {
            // Gradient Hair
            const fadeGrad = ctx.createLinearGradient(0, headY - headRadius, 0, headY + headRadius);
            fadeGrad.addColorStop(0, hairColor);
            fadeGrad.addColorStop(0.4, hairColor);
            fadeGrad.addColorStop(0.8, 'rgba(0,0,0,0)'); // Transparent to show skin base

            drawBaseCap(1.02, fadeGrad);

            if (style.includes('box') || style.includes('high')) {
                // High top / Box fade
                const topY = headY - headRadius * 1.4;
                const w = headRadius * 0.9;
                const boxPts = [
                    {x: p.x - w, y: headY},
                    {x: p.x - w, y: topY},
                    {x: p.x + w, y: topY},
                    {x: p.x + w, y: headY}
                ];
                drawSketchyFill(ctx, boxPts, hairColor, baseSeed+1);
            }
            return;
        }

        if (style.includes('cornrows') || style.includes('braids')) {
            // Draw rows ON TOP of the skin base cap
            const rows = 5;
            for(let i=0; i<rows; i++) {
                const xOff = (i - (rows-1)/2) * (headRadius*0.45);
                const pts = [];
                // Create a curved path over the head
                for(let j=0; j<=10; j++) {
                    const t = j/10;
                    // Curve from front (top) to back (bottom)
                    // y range: headY - headRadius to headY + headRadius
                    const y = (headY - headRadius*1.1) + (t * headRadius * 2.2);

                    // Width at Y (sphere projection approx)
                    const yNorm = (y - headY)/(headRadius*1.1);
                    const widthAtY = Math.sqrt(Math.max(0, 1 - yNorm*yNorm)) * headRadius;

                    // Converge slightly at back
                    const taper = 1.0 - (t * 0.3);

                    if (Math.abs(xOff * taper) < widthAtY) {
                        pts.push({x: p.x + xOff * taper, y: y});
                    }
                }
                if (pts.length > 1) {
                    drawSketchyPath(ctx, pts, hairColor, 4*s, baseSeed+100+i, false);
                    // Add shading/highlight to braid
                    drawSketchyPath(ctx, pts, 'rgba(255,255,255,0.1)', 1.5*s, baseSeed+200+i, false);
                }
            }
            return;
        }

        if (style.includes('dreads') || style.includes('locks')) {
            drawBaseCap(1.05, hairColor);
            // Hanging locks
            const numLocks = 15;
            for(let i=0; i<numLocks; i++) {
                const ang = Math.PI + (i/numLocks)*Math.PI; // Top arc
                const sx = p.x + Math.cos(ang)*headRadius*0.8;
                const sy = headY + Math.sin(ang)*headRadius*0.8;
                const len = 30*s;
                // Dangling sketchy path
                const ex = sx + (Math.random()-0.5)*10*s;
                const ey = sy + len;

                const pts = [{x:sx, y:sy}, {x:sx, y:sy+len*0.5}, {x:ex, y:ey}];
                drawSketchyPath(ctx, pts, hairColor, 5*s, baseSeed+300+i, false);
            }
            return;
        }

        if (style.includes('mohawk')) {
            // Strip
            const stripW = headRadius * 0.4;
            const pts = [
                {x: p.x, y: headY + headRadius}, // Nape
                {x: p.x - stripW, y: headY},
                {x: p.x - stripW*0.5, y: headY - headRadius*1.3}, // Top Front
                {x: p.x + stripW*0.5, y: headY - headRadius*1.3},
                {x: p.x + stripW, y: headY},
            ];
            drawSketchyFill(ctx, pts, hairColor, baseSeed+2);
            return;
        }

        if (style.includes('spik') || style === 'spikes') {
             const pts = [];
             const center = {x: p.x, y: headY};
             const r = headRadius * 1.4;
             const spikes = 9;
             for(let i=0; i<spikes; i++) {
                 const a1 = Math.PI + (i/spikes)*Math.PI;
                 const a2 = Math.PI + ((i+0.5)/spikes)*Math.PI;
                 pts.push({x: center.x + Math.cos(a1)*headRadius, y: center.y + Math.sin(a1)*headRadius});
                 pts.push({x: center.x + Math.cos(a2)*r, y: center.y + Math.sin(a2)*r});
             }
             pts.push({x: center.x + headRadius, y: center.y});
             pts.push({x: center.x - headRadius, y: center.y});
             drawSketchyFill(ctx, pts, hairColor, baseSeed+3);
             return;
        }

        if (style.includes('long') || style.includes('straight') || style.includes('mullet') || style.includes('shaggy')) {
             const isMullet = style.includes('mullet');
             const len = (style === 'straight' || isMullet) ? 15*s : 25*s;

             // Base shape
             const pts = [
                 {x: p.x - headRadius, y: headY - headRadius*0.5},
                 {x: p.x - headRadius*1.2, y: headY + headRadius + len},
                 {x: p.x + headRadius*1.2, y: headY + headRadius + len},
                 {x: p.x + headRadius, y: headY - headRadius*0.5},
                 {x: p.x, y: headY - headRadius*1.2}
             ];
             drawSketchyFill(ctx, pts, hairColor, baseSeed+4);

             if (isMullet) {
                 // Short top/sides drawn over
                 drawBaseCap(1.05, hairColor);
             }

             // Lines
             const numLines = 5;
             for(let i=0; i<numLines; i++) {
                 const x = p.x - headRadius + (i/numLines)*headRadius*2;
                 drawSketchyPath(ctx, [{x:x, y:headY}, {x:x, y:headY+len}], 'rgba(0,0,0,0.2)', 1*s, baseSeed+200+i, false);
             }
             return;
        }

        if (style === 'hat') {
             // Sideburns
             drawSketchyCircle(ctx, p.x - headRadius, headY, 4*s, hairColor, baseSeed, true);
             drawSketchyCircle(ctx, p.x + headRadius, headY, 4*s, hairColor, baseSeed+1, true);
             return;
        }

        if (style.includes('short')) {
             drawBaseCap(1.1, hairColor);
             if (style.includes('curly')) {
                 for(let i=0; i<8; i++) {
                     const ang = Math.random() * Math.PI;
                     const r = Math.random() * headRadius;
                     drawSketchyPath(ctx, [{x:p.x+Math.cos(ang)*r, y:headY-Math.sin(ang)*r}, {x:p.x+Math.cos(ang)*(r+5*s), y:headY-Math.sin(ang)*(r+5*s)}], 'rgba(0,0,0,0.2)', 1, baseSeed+300+i, false);
                 }
             }
             return;
        }

        if (style === 'snakes') {
             // Gorgon
             drawBaseCap(1.0, hairColor);
             for(let i=0; i<6; i++) {
                 const ang = Math.PI + (i/5)*Math.PI;
                 const sx = p.x + Math.cos(ang)*headRadius*0.8;
                 const sy = headY + Math.sin(ang)*headRadius*0.8;
                 const ex = p.x + Math.cos(ang)*headRadius*2.5;
                 const ey = headY + Math.sin(ang)*headRadius*2.5;
                 drawSketchyPath(ctx, [{x:sx, y:sy}, {x:ex, y:ey}], hairColor, 4*s, baseSeed+400+i, false);
             }
             return;
        }

        // Default / Slicked / Pompadour
        if (style.includes('slick') || style.includes('pompadour')) {
             const pts = [
                 {x: p.x - headRadius, y: headY},
                 {x: p.x - headRadius, y: headY - headRadius*1.5}, // Higher top
                 {x: p.x + headRadius, y: headY - headRadius*1.5},
                 {x: p.x + headRadius, y: headY}
             ];
             drawSketchyFill(ctx, pts, hairColor, baseSeed+5);
             return;
        }

        // Final Fallback
        drawBaseCap(1.05, hairColor);
    }
