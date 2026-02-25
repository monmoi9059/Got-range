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
        // Light top-left, Dark bottom-right
        // We use this for the "Base Cap" to ensure volume.
        const drawBaseCap = (radiusMod, color) => {
             // Use sketchy circle logic but filled with gradient
             // We can generate points using drawSketchyCircle logic and fill with gradient
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

        const drawShadowOverlay = () => {
             // Generic rim shadow? Already handled by drawBaseCap overlay.
        };

        // 1. SCALP PROTECTION (The Fix)
        if (style.includes('fade') || style === 'mohawk' || style === 'short') {
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

        if (style === 'bald_stubble' || style === 'buzz_cut') {
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
            const afroSize = (style==='afro' ? 1.5 : 1.2);
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

            if (style === 'fade_box') {
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

        if (style === 'cornrows' || style === 'braids') {
            drawBaseCap(1.0, hairColor);
            // Rows
            const rows = 5;
            for(let i=0; i<rows; i++) {
                const xOff = (i - (rows-1)/2) * (headRadius*0.4);
                const pts = [];
                for(let j=0; j<=10; j++) {
                    const t = j/10;
                    const y = headY - headRadius + (t * headRadius * 2);
                    const yNorm = (y - headY)/headRadius;
                    const widthAtY = Math.sqrt(1 - yNorm*yNorm) * headRadius;
                    if (Math.abs(xOff) < widthAtY) {
                        pts.push({x: p.x + xOff, y: y});
                    }
                }
                drawSketchyPath(ctx, pts, 'rgba(0,0,0,0.5)', 2*s, baseSeed+100+i, false);
            }
            return;
        }

        if (style === 'mohawk') {
            // Skin base drawn above
            // Strip
            const stripW = headRadius * 0.4;
            const pts = [
                {x: p.x, y: headY + headRadius}, // Nape
                {x: p.x - stripW, y: headY},
                {x: p.x - stripW*0.5, y: headY - headRadius*1.2}, // Top Front
                {x: p.x + stripW*0.5, y: headY - headRadius*1.2},
                {x: p.x + stripW, y: headY},
            ];
            drawSketchyFill(ctx, pts, hairColor, baseSeed+2);
            return;
        }

        if (style === 'spiky' || style === 'spikes') {
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

        if (style === 'long' || style === 'curly_long' || style === 'straight') {
             const len = (style === 'straight') ? 10*s : 25*s;
             const pts = [
                 {x: p.x - headRadius, y: headY - headRadius*0.5},
                 {x: p.x - headRadius*1.3, y: headY + headRadius + len},
                 {x: p.x + headRadius*1.3, y: headY + headRadius + len},
                 {x: p.x + headRadius, y: headY - headRadius*0.5},
                 {x: p.x, y: headY - headRadius*1.2}
             ];
             drawSketchyFill(ctx, pts, hairColor, baseSeed+4);
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

        if (style === 'short' || style === 'short_curly') {
             drawBaseCap(1.1, hairColor);
             if (style === 'short_curly') {
                 for(let i=0; i<5; i++) {
                     const ang = Math.random() * Math.PI;
                     drawSketchyPath(ctx, [{x:p.x, y:headY}, {x:p.x+Math.cos(ang)*10*s, y:headY-Math.sin(ang)*10*s}], 'rgba(0,0,0,0.2)', 1, baseSeed+300+i, false);
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

        // Default
        drawBaseCap(1.05, hairColor);
    }
