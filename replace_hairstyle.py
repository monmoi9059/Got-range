import os

filepath = 'js/renderer.js'
start_marker = 'function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {'
end_marker = 'function drawRealisticHuman(p, s, skinObj) {'

with open(filepath, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker in line:
        start_idx = i
    if end_marker in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    # Keep the lines before start_idx
    new_content = lines[:start_idx]

    # Insert new implementation
    new_content.append('''    // --- HAIR RENDERING HELPERS ---
    function drawScalpCoverage(ctx, p, headY, headRadius, s, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        const grad = ctx.createRadialGradient(p.x, headY - headRadius*0.3, headRadius*0.2, p.x, headY, headRadius);
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    function drawHairStrands(ctx, startX, startY, length, angleBase, spread, count, color, s, curliness = 0, seedBase = 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2 * s;
        ctx.lineCap = 'round';
        for (let i = 0; i < count; i++) {
            const r1 = seededRandom(seedBase + i * 13);
            const r2 = seededRandom(seedBase + i * 7 + 500);
            const angle = angleBase + (r1 - 0.5) * spread;
            const l = length * (0.8 + r2 * 0.4);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            if (curliness > 0.5) {
                const loops = 4;
                const loopRadius = curliness * 3 * s;
                let cx = startX; let cy = startY;
                const step = l / (loops * 4);
                for(let j=0; j<loops * 4; j++) {
                    cx += Math.cos(angle) * step; cy += Math.sin(angle) * step;
                    const offset = Math.sin(j) * loopRadius;
                    const perp = angle + Math.PI/2;
                    ctx.lineTo(cx + Math.cos(perp)*offset, cy + Math.sin(perp)*offset);
                }
            } else if (curliness > 0) {
                const endX = startX + Math.cos(angle) * l;
                const endY = startY + Math.sin(angle) * l;
                const cpX = (startX + endX)/2 + (r1-0.5)*10*s;
                const cpY = (startY + endY)/2 + (r2-0.5)*10*s;
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            } else {
                const endX = startX + Math.cos(angle) * l;
                let endY = startY + Math.sin(angle) * l;
                if (l > 20*s) endY += l * 0.2;
                const cpX = startX + Math.cos(angle) * l * 0.3;
                const cpY = startY + Math.sin(angle) * l * 0.3 + (l * 0.1);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            }
            ctx.stroke();
        }
    }

    function drawHairTexture(ctx, cx, cy, r, color, s, density = 1.0, seed = 1) {
        const count = 40 * density;
        ctx.fillStyle = color;
        for(let i=0; i<count; i++) {
            const angle = seededRandom(seed + i*123) * Math.PI * 2;
            const dist = Math.sqrt(seededRandom(seed + i*456)) * r;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.beginPath(); ctx.arc(px, py, 0.9 * s, 0, Math.PI*2); ctx.fill();
        }
    }

    function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        const style = skinObj.hairStyle || 'default';
        let hairColor = skinObj.hairColor || '#000';

        if ((skinObj.id === 'human_custom' || skinObj.hairStyle) && playerData.customHairColorIndex !== undefined) {
             // Handled in drawPlayer usually
        }

        const modRadius = headRadius * (skinObj.hairScale || 1.0);
        const lenScale = (skinObj.hairScale || 1.0) * s;
        const baseSeed = p.x * p.y + (skinObj.id ? skinObj.id.length : 0);

        const adjustColor = (color, percent) => {
            if(!color || !color.startsWith('#')) return color;
            var num = parseInt(color.replace("#",""),16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt, B = ((num >> 8) & 0x00FF) + amt, G = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
        };

        // --- SHORT & TEXTURED ---
        const shortStyles = ['short', 'buzz_cut', 'caesar', 'french_crop', 'waves', 'fade', 'undercut', 'crew_cut', 'bald', 'default'];

        if (shortStyles.includes(style)) {
            if (style === 'bald') {
                drawScalpCoverage(ctx, p, headY, headRadius, s, skinObj.skinTone || '#8d5524');
                const shineR = headRadius * 0.4;
                const grad = ctx.createRadialGradient(p.x - shineR*0.5, headY - shineR*0.5, 0, p.x, headY, shineR);
                grad.addColorStop(0, 'rgba(255,255,255,0.4)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x - shineR*0.3, headY - shineR*0.3, shineR, 0, Math.PI*2); ctx.fill();
                return;
            }
            drawScalpCoverage(ctx, p, headY, headRadius, s, skinObj.skinTone || '#8d5524');
            const density = (style === 'buzz_cut' || style === 'waves') ? 1.5 : 1.0;

            if (style === 'fade' || style === 'undercut') {
                ctx.save(); ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.clip();
                const grad = ctx.createLinearGradient(0, headY + headRadius, 0, headY - headRadius);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(0.4, adjustColor(hairColor, -20));
                grad.addColorStop(1, hairColor);
                ctx.fillStyle = grad; ctx.fillRect(p.x - headRadius, headY - headRadius, headRadius*2, headRadius*2);
                drawHairTexture(ctx, p.x, headY - headRadius*0.3, headRadius*0.8, hairColor, s, 1.2, baseSeed);
                ctx.restore();
            } else if (style === 'waves') {
                ctx.fillStyle = hairColor; ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = adjustColor(hairColor, 30); ctx.lineWidth = 1.5 * s;
                for(let i=0; i<5; i++) {
                    ctx.beginPath(); ctx.arc(p.x, headY - headRadius + i*5*s, headRadius * 0.8, 0.2, Math.PI - 0.2); ctx.stroke();
                }
            } else {
                ctx.fillStyle = hairColor; ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
                drawHairTexture(ctx, p.x, headY, headRadius, adjustColor(hairColor, 20), s, density, baseSeed);
            }
            return;
        }

        // --- MEDIUM & VOLUME ---
        const volumeStyles = ['afro', 'short_curly', 'curly_high', 'perm', 'messy_bedhead', 'pompadour', 'faux_hawk', 'shag', 'dirk_shaggy', 'short_afro', 'spikes', 'liberty_spikes', 'mohawk'];

        if (volumeStyles.includes(style)) {
            let volRadius = modRadius;

            if (style === 'afro') { volRadius *= 1.4; }
            if (style === 'short_curly') { volRadius *= 1.1; }
            if (style === 'pompadour') {
                ctx.fillStyle = hairColor;
                ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 0.9, headRadius * 1.3, 0, 0, Math.PI*2); ctx.fill();
                drawHairStrands(ctx, p.x, headY - headRadius, 15*s, -Math.PI/2, 0.5, 10, adjustColor(hairColor, 20), s, 0, baseSeed);
                return;
            }
            if (style === 'mohawk' || style === 'liberty_spikes') {
                 const w = 15*s;
                 ctx.fillStyle = hairColor;
                 ctx.beginPath();
                 ctx.ellipse(p.x, headY, w/2, headRadius*1.2, 0, 0, Math.PI*2);
                 ctx.fill();
                 const numSpikes = 7;
                 for(let i=0; i<numSpikes; i++) {
                     const y = headY - headRadius + (i/(numSpikes-1))*headRadius*2;
                     const len = (style==='liberty_spikes') ? 30*s : 15*s;
                     ctx.beginPath(); ctx.moveTo(p.x, y); ctx.lineTo(p.x - 5*s, y - 5*s); ctx.lineTo(p.x, y - len); ctx.lineTo(p.x + 5*s, y - 5*s); ctx.fill();
                 }
                 return;
            }

            drawFuzzyCircle(p.x, headY, volRadius, hairColor, baseSeed, s, true, true);
            drawHairTexture(ctx, p.x, headY, volRadius * 0.8, adjustColor(hairColor, 20), s, 1.5, baseSeed);
            return;
        }

        // --- LONG & FLOWING ---
        const longStyles = ['long', 'long_straight', 'long_wavy', 'curtains', 'bob', 'emo_fringe', 'mullet_modern', 'comb_over', 'straight'];

        if (longStyles.includes(style)) {
            drawScalpCoverage(ctx, p, headY, headRadius, s, adjustColor(hairColor, -20));
            const crownY = headY - headRadius * 0.5;
            const length = (style === 'bob') ? 25*s : (style === 'mullet_modern' ? 35*s : 50*s);
            const isWavy = style.includes('wavy') || style === 'curtains';
            const strandCount = (playerData.graphics === 'HIGH') ? 40 : 20;

            drawHairStrands(ctx, p.x, crownY, length, Math.PI/2, 1.5, strandCount, adjustColor(hairColor, -10), s, isWavy ? 0.3 : 0, baseSeed);
            drawHairStrands(ctx, p.x, crownY, length * 0.9, Math.PI/2, 1.2, strandCount, hairColor, s, isWavy ? 0.3 : 0, baseSeed+100);

            if (style === 'mullet_modern') {
                drawHairTexture(ctx, p.x, headY, headRadius, hairColor, s, 1.0, baseSeed);
            }
            return;
        }

        // --- BRAIDS & DREADS ---
        const braidStyles = ['cornrows', 'dreads', 'dreads_short', 'braids_back', 'twisted_fade'];
        if (braidStyles.includes(style)) {
            drawScalpCoverage(ctx, p, headY, headRadius, s, skinObj.skinTone || '#8d5524');
            const numRows = 7;
            const rowW = 4*s;
            for(let i=0; i<numRows; i++) {
                const xOff = (i - Math.floor(numRows/2)) * rowW * 1.2;
                ctx.strokeStyle = hairColor;
                ctx.lineWidth = rowW;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x + xOff, headY - headRadius * 0.8);
                ctx.quadraticCurveTo(p.x + xOff*1.1, headY, p.x + xOff * 0.5, headY + headRadius);
                ctx.stroke();
                ctx.strokeStyle = adjustColor(hairColor, 30);
                ctx.lineWidth = 1*s;
                ctx.setLineDash([2*s, 2*s]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            if (style.includes('dreads')) {
                const count = 15;
                for(let i=0; i<count; i++) {
                    const angle = Math.PI/2 + (seededRandom(baseSeed+i) - 0.5) * 1.5;
                    drawHairStrands(ctx, p.x + (seededRandom(i)-0.5)*headRadius, headY, 20*s, angle, 0.2, 1, hairColor, s, 0.1, baseSeed+i);
                }
            }
            return;
        }

        // --- BUNS & TAILS ---
        const bunStyles = ['bun_low', 'top_knot', 'samurai_bun', 'dread_bun', 'ponytail_high', 'ponytail_low', 'pigtails', 'space_buns'];
        if (bunStyles.includes(style)) {
            drawScalpCoverage(ctx, p, headY, headRadius, s, hairColor);
            const tieY = style.includes('high') || style === 'top_knot' ? headY - headRadius*0.5 : headY + headRadius*0.2;

            ctx.strokeStyle = adjustColor(hairColor, 20);
            ctx.lineWidth = 1*s;
            for(let i=0; i<10; i++) {
                const angle = seededRandom(baseSeed+i) * Math.PI * 2;
                const dist = headRadius;
                ctx.beginPath();
                ctx.moveTo(p.x + Math.cos(angle)*dist, headY + Math.sin(angle)*dist);
                ctx.lineTo(p.x, tieY);
                ctx.stroke();
            }

            if (style === 'pigtails' || style === 'space_buns') {
                drawFuzzyCircle(p.x - headRadius, tieY, 8*s, hairColor, baseSeed, s, true);
                drawFuzzyCircle(p.x + headRadius, tieY, 8*s, hairColor, baseSeed, s, true);
            } else {
                drawFuzzyCircle(p.x, tieY, 12*s, hairColor, baseSeed, s, true);
                if (style.includes('ponytail')) {
                    drawHairStrands(ctx, p.x, tieY, 30*s, Math.PI/2, 0.5, 15, hairColor, s, 0.1, baseSeed);
                }
            }
            return;
        }

        // --- UNIQUE / OTHER ---
        const uniqueStyles = ['flat_top', 'bowl_cut', 'clown', 'monk', 'beehive'];
        if (uniqueStyles.includes(style)) {
             if (style === 'flat_top') {
                 ctx.fillStyle = hairColor;
                 ctx.fillRect(p.x - headRadius*0.8, headY - headRadius*1.5, headRadius*1.6, headRadius*1.5);
                 ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
             } else if (style === 'bowl_cut') {
                 drawScalpCoverage(ctx, p, headY, headRadius, s, hairColor);
                 ctx.fillStyle = adjustColor(hairColor, -20);
                 ctx.beginPath(); ctx.arc(p.x, headY, headRadius * 1.1, 0, Math.PI, false); ctx.fill();
             } else {
                 drawScalpCoverage(ctx, p, headY, headRadius, s, hairColor);
             }
             return;
        }

        // Final Fallback
        drawScalpCoverage(ctx, p, headY, headRadius, s, hairColor);
    }

''')

    # Append the rest of the file
    new_content.extend(lines[end_idx:])

    with open(filepath, 'w') as f:
        f.writelines(new_content)

    print(f"Successfully replaced drawHairstyle in {filepath}")
else:
    print("Could not find start/end markers")
