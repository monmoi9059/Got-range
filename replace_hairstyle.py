import re

with open('js/renderer.js', 'r') as f:
    content = f.read()

start_marker = "function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {"
start_idx = content.find(start_marker)

if start_idx == -1:
    print("Could not find start marker")
    exit(1)

# Find the matching closing brace
brace_count = 0
end_idx = -1
for i in range(start_idx, len(content)):
    if content[i] == '{':
        brace_count += 1
    elif content[i] == '}':
        brace_count -= 1
        if brace_count == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find matching closing brace")
    exit(1)

new_function_body = """function drawHairstyle(ctx, p, headY, headRadius, s, skinObj) {
        var style = skinObj.hairStyle || 'short';
        var color = skinObj.hairColor || '#000';
        // var color2 = skinObj.hairColor2 || null; // Unused for now

        // Override logic for shop preview
        if (typeof state !== 'undefined' && state === 'SHOP' && typeof viewingHairstyleIndex !== 'undefined' && typeof HAIRSTYLES !== 'undefined') {
             const preview = HAIRSTYLES[viewingHairstyleIndex];
             if (preview && preview.id !== 'default') {
                 style = preview.id;
                 if (style === 'afro') color = '#000'; // Default preview color
             }
        }

        // Derive a stable seed from the skin ID and render position
        let baseSeed = stringToSeed(skinObj.id || 'default');

        const modRadius = headRadius * (skinObj.hairScale || 1.0);
        const r = modRadius;

        // Helper: Static Hair Strand (Vector)
        const drawStrand = (x1, y1, c1x, c1y, c2x, c2y, x2, y2, width, col) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            if (c2x !== null && c2y !== null) ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
            else ctx.quadraticCurveTo(c1x, c1y, x2, y2);
            ctx.lineWidth = width;
            ctx.strokeStyle = col;
            ctx.lineCap = 'round';
            ctx.stroke();
        };

        if (style === 'bald') {
             // Shiny scalp
             if (color && color !== '#000' && color !== skinObj.skinTone) {
                 ctx.fillStyle = color;
                 ctx.globalAlpha = 0.2;
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius, 0, Math.PI*2); ctx.fill();
                 ctx.globalAlpha = 1.0;
             }
             const shine = ctx.createRadialGradient(p.x + headRadius*0.3, headY - headRadius*0.4, 0, p.x + headRadius*0.3, headY - headRadius*0.4, headRadius*0.4);
             shine.addColorStop(0, 'rgba(255,255,255,0.4)');
             shine.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = shine;
             ctx.beginPath();
             ctx.ellipse(p.x + headRadius*0.3, headY - headRadius*0.4, headRadius*0.3, headRadius*0.2, -0.5, 0, Math.PI*2);
             ctx.fill();
             return;
        }

        // --- PRESERVED STYLES ---

        if (style === 'cornrows') {
             // Tight braids logic (Allen Iverson Style - Close to Scalp)
             const r = modRadius * 1.0;

             // Base scalp (darkened skin or hair color base)
             ctx.fillStyle = adjustColor(color, -10);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             const numRows = 7;
             const braidWidth = 3 * s;

             for(let i=0; i<numRows; i++) {
                 // Perspective: Rows converge towards the neck slightly
                 const t = (i / (numRows - 1)) * 2 - 1; // -1 to 1 (Left to Right)
                 const absT = Math.abs(t);

                 // Top Point
                 const startX = p.x + t * (r * 0.9);
                 const xOffset = t * (r * 0.9);
                 const yDist = Math.sqrt(Math.max(0, (r * 1.05)**2 - xOffset**2));
                 const startY = headY - yDist;

                 // Bottom Point
                 const endX = p.x + t * (r * 0.3);
                 const endY = headY + r * 0.95;

                 // Control Points
                 const cp1x = p.x + t * (r * 0.95);
                 const cp1y = headY - r * 0.3;

                 const cp2x = p.x + t * (r * 0.6);
                 const cp2y = headY + r * 0.6;

                 // Draw Braid Path
                 ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                 ctx.lineWidth = braidWidth + 1*s;
                 ctx.lineCap = 'round';
                 ctx.beginPath(); ctx.moveTo(startX, startY); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();

                 ctx.strokeStyle = color;
                 ctx.lineWidth = braidWidth;
                 ctx.beginPath(); ctx.moveTo(startX, startY); ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY); ctx.stroke();

                 // Texture
                 ctx.fillStyle = adjustColor(color, 30); // Highlight
                 const steps = 12;
                 for(let j=0; j<=steps; j++) {
                     const tt = j/steps;
                     const inv = 1 - tt;
                     const bx = inv*inv*inv*startX + 3*inv*inv*tt*cp1x + 3*inv*tt*tt*cp2x + tt*tt*tt*endX;
                     const by = inv*inv*inv*startY + 3*inv*inv*tt*cp1y + 3*inv*tt*tt*cp2y + tt*tt*tt*endY;
                     ctx.beginPath(); ctx.arc(bx, by, 1*s, 0, Math.PI*2); ctx.fill();
                 }
             }

             // Headband (Team Color)
             const bandColor = skinObj.headbandColor || skinObj.jerseyColor || '#FFF';
             const bandY = headY - 1*s; // Lower
             const bandH = 3*s; // Thinner

             ctx.fillStyle = bandColor;
             ctx.beginPath();
             ctx.ellipse(p.x, bandY, r + 2*s, bandH, 0, 0, Math.PI*2);
             ctx.fill();

             ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.ellipse(p.x, bandY, r + 2*s, bandH, 0, 0, Math.PI*2); ctx.stroke();

             return;
        }

        if (style === 'mohawk') {
             // Shaved sides (Fade) - Draw fading scalp first
             const r = headRadius * 1.0;
             const fadeGrad = ctx.createLinearGradient(0, headY - r, 0, headY + r);
             fadeGrad.addColorStop(0, adjustColor(skinObj.skinTone, -10));
             fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.fillStyle = fadeGrad;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             // Draw Central Strip
             const stripW = 8 * s;
             const stripTopY = headY - headRadius * 1.4;
             const stripBotY = headY + headRadius * 1.0;

             // Strip Gradient
             const grad = ctx.createLinearGradient(0, stripTopY, 0, stripBotY);
             grad.addColorStop(0, color);
             grad.addColorStop(1, adjustColor(color, -20));
             ctx.fillStyle = grad;

             ctx.beginPath();
             // Top Texture
             const numSpikes = 10;
             for(let i=0; i<=numSpikes; i++) {
                 const angle = Math.PI + (i/numSpikes)*Math.PI; // Top arc
                 const rnd = seededRandom(baseSeed + i);
                 const nr = (stripW/2) + (rnd * 2 * s);
                 const cx = p.x + Math.cos(angle) * nr;
                 const cy = stripTopY + Math.sin(angle) * (stripW/4); // Flattened top
                 if(i===0) ctx.moveTo(cx, cy);
                 else ctx.lineTo(cx, cy);
             }
             ctx.lineTo(p.x + stripW/2, stripBotY);
             // Rounded bottom
             ctx.arc(p.x, stripBotY, stripW/2, 0, Math.PI);
             ctx.lineTo(p.x - stripW/2, stripTopY); // Close loop
             ctx.fill();

             // Internal Texture
             ctx.fillStyle = adjustColor(color, 20);
             for(let i=0; i<10; i++) {
                 const rnd = seededRandom(baseSeed + 700 + i);
                 const tx = p.x + (rnd-0.5) * stripW;
                 const ty = stripTopY + (seededRandom(baseSeed+800+i) * (stripBotY - stripTopY));
                 ctx.beginPath(); ctx.arc(tx, ty, 1*s, 0, Math.PI*2); ctx.fill();
             }
             return;
        }

        // --- NEW REALISTIC STATIC STYLES ---

        // 1. BUZZ / FADE / SHORT (Textured Scalp)
        if (['short', 'buzz_cut', 'fade', 'caesar', 'crew_cut', 'french_crop', 'high_tight', 'flat_top'].includes(style)) {
            const isFade = (style === 'fade' || style === 'short' || style === 'high_tight');

            // Scalp Base
            const grad = ctx.createRadialGradient(p.x, headY - 5*s, r * 0.2, p.x, headY - 5*s, r);
            grad.addColorStop(0, color);
            grad.addColorStop(0.7, color);
            grad.addColorStop(1, isFade ? 'rgba(0,0,0,0)' : adjustColor(color, -20));

            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

            // Stubble Texture (Static)
            ctx.fillStyle = adjustColor(color, 20);
            const dens = (style === 'buzz_cut') ? 100 : 50;
            for(let i=0; i<dens; i++) {
                const angle = seededRandom(baseSeed + i) * Math.PI * 2;
                const dist = Math.sqrt(seededRandom(baseSeed + i + 100)) * r * 0.9;
                const sx = p.x + Math.cos(angle) * dist;
                const sy = (headY - 2*s) + Math.sin(angle) * dist;
                ctx.fillRect(sx, sy, 1.5*s, 1.5*s);
            }
            // Hairline (Front/Top)
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(p.x, headY - 5*s, r * 0.9, Math.PI, 0); ctx.fill();
            return;
        }

        // 2. AFRO / CURLY (Cloud Shape + Detail)
        if (['afro', 'short_curly', 'curly_high', 'perm', 'jewfro'].includes(style)) {
             const afroSize = (style === 'afro') ? 1.4 : (style === 'curly_high' ? 1.3 : 1.1);
             // if (skinObj.afroSize) afroSize = skinObj.afroSize; // Already handled by modRadius logic partially, but extra volume here:
             const finalSize = skinObj.afroSize || afroSize;

             const ar = r * finalSize;
             const grad = ctx.createRadialGradient(p.x, headY, ar * 0.4, p.x, headY, ar);
             grad.addColorStop(0, adjustColor(color, 20));
             grad.addColorStop(1, adjustColor(color, -30));
             ctx.fillStyle = grad;

             // Cloud Outline
             ctx.beginPath();
             const bumps = 24;
             for(let i=0; i<bumps; i++) {
                 const a1 = (i/bumps) * Math.PI * 2;
                 const a2 = ((i+1)/bumps) * Math.PI * 2;
                 const mx = p.x + Math.cos((a1+a2)/2) * ar;
                 const my = headY + Math.sin((a1+a2)/2) * ar;
                 const rBump = ar * 0.15;
                 ctx.arc(mx, my, rBump, 0, Math.PI*2);
             }
             ctx.fill();

             // Curls Texture
             ctx.strokeStyle = adjustColor(color, -20);
             ctx.lineWidth = 1.5 * s;
             for(let i=0; i<40; i++) {
                 const a = seededRandom(baseSeed + i*10) * Math.PI * 2;
                 const d = seededRandom(baseSeed + i*10+1) * ar * 0.8;
                 const cx = p.x + Math.cos(a)*d;
                 const cy = headY + Math.sin(a)*d;
                 ctx.beginPath(); ctx.arc(cx, cy, 4*s, 0, Math.PI*1.5); ctx.stroke();
             }
             return;
        }

        // 3. DREADS / BRAIDS (Tubular Strands)
        if (['dreads_short', 'braids_back', 'dread_bun', 'twisted_fade'].includes(style)) {
             // Base Scalp
             ctx.fillStyle = adjustColor(color, -20);
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             const numDreads = (style === 'dread_bun') ? 12 : 20;
             const len = (style === 'dreads_short') ? 25*s : 40*s;
             const width = 6*s;

             for(let i=0; i<numDreads; i++) {
                 const angle = Math.PI + (i/numDreads) * Math.PI; // Fan out
                 const rndL = len * (0.8 + 0.4 * seededRandom(baseSeed + i));
                 const sx = p.x + Math.cos(angle) * r * 0.5;
                 const sy = headY - 10*s + Math.sin(angle) * r * 0.5;

                 // Drooping curve
                 const ex = sx + Math.cos(angle) * rndL * 0.5; // Flare out
                 const ey = sy + rndL; // Hang down

                 drawStrand(sx, sy, sx + (ex-sx)*0.2, sy + rndL*0.2, ex, ey - rndL*0.2, ex, ey, width, color);
                 // Texture rings
                 ctx.strokeStyle = adjustColor(color, 20); ctx.lineWidth = 1*s;
                 for(let k=1; k<5; k++) {
                     const tx = sx + (ex-sx)*(k/5);
                     const ty = sy + (ey-sy)*(k/5); // Approx
                     ctx.beginPath(); ctx.moveTo(tx-2*s, ty); ctx.lineTo(tx+2*s, ty); ctx.stroke();
                 }
             }

             if(style === 'dread_bun') {
                 // Bun on top
                 ctx.fillStyle = color;
                 ctx.beginPath(); ctx.arc(p.x, headY - r - 5*s, 15*s, 0, Math.PI*2); ctx.fill();
             }
             return;
        }

        // 4. LONG / FLOWING (Smooth Bezier)
        if (['long', 'long_straight', 'long_wavy', 'curtains', 'emo_fringe', 'mullet_modern', 'shag'].includes(style)) {
             // Base Mass
             const grad = ctx.createLinearGradient(0, headY - r, 0, headY + r * 3);
             grad.addColorStop(0, adjustColor(color, 20));
             grad.addColorStop(1, adjustColor(color, -20));
             ctx.fillStyle = grad;

             // Draw Hair Shape (Back View)
             ctx.beginPath();
             // Top Dome
             ctx.arc(p.x, headY - 5*s, r, Math.PI, 0);
             // Sides flowing down
             const len = (style === 'mullet_modern') ? 40*s : 60*s;
             const flare = (style === 'long_wavy') ? 20*s : 5*s;

             ctx.lineTo(p.x + r + flare, headY + len); // Bottom Right
             // Bottom Edge (Curve)
             ctx.quadraticCurveTo(p.x, headY + len + 10*s, p.x - r - flare, headY + len); // Bottom Left
             ctx.lineTo(p.x - r, headY - 5*s);
             ctx.fill();

             // Strand Details
             const numStrands = 12;
             ctx.lineWidth = 2*s;
             ctx.strokeStyle = adjustColor(color, -30); // Darker lines
             for(let i=0; i<=numStrands; i++) {
                 const t = i/numStrands;
                 const sx = p.x - r + (t * 2 * r);
                 const sy = headY - 5*s;
                 const ex = p.x - (r+flare) + (t * 2 * (r+flare));
                 const ey = headY + len;
                 // Waviness
                 const midX = (sx + ex)/2 + (style === 'long_wavy' ? (Math.sin(i)*10*s) : 0);
                 const midY = (sy + ey)/2;

                 ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(midX, midY, ex, ey); ctx.stroke();
             }

             if (style === 'mullet_modern') {
                 // Short sides
                 ctx.fillStyle = adjustColor(color, -20);
                 ctx.fillRect(p.x - r - 2*s, headY, 4*s, 20*s);
                 ctx.fillRect(p.x + r - 2*s, headY, 4*s, 20*s);
             }
             return;
        }

        // 5. UPDOS (Buns, Ponytails)
        if (['bun_low', 'top_knot', 'samurai_bun', 'space_buns', 'ponytail_high', 'ponytail_low', 'beehive', 'monk'].includes(style)) {
             // Slicked Base
             const grad = ctx.createRadialGradient(p.x, headY, r*0.2, p.x, headY, r);
             grad.addColorStop(0, adjustColor(color, 30));
             grad.addColorStop(1, color);
             ctx.fillStyle = grad;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

             // Strand lines converging to tie point
             let tieY = headY - r * 0.8; // High default
             if (style === 'bun_low' || style === 'ponytail_low') tieY = headY + r * 0.5;

             ctx.strokeStyle = adjustColor(color, -20); ctx.lineWidth = 1*s;
             for(let i=0; i<16; i++) {
                 const a = (i/16) * Math.PI * 2;
                 const sx = p.x + Math.cos(a) * r;
                 const sy = (headY - 2*s) + Math.sin(a) * r;
                 ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(p.x, (sy+tieY)/2, p.x, tieY); ctx.stroke();
             }

             // The Bun/Tail itself
             if (style.includes('bun') || style === 'top_knot' || style === 'beehive') {
                 const bSize = (style === 'beehive') ? 30*s : 15*s;
                 const bY = (style === 'beehive') ? headY - r - 20*s : tieY;
                 // Bun Sphere
                 const bunGrad = ctx.createRadialGradient(p.x, bY, 2*s, p.x, bY, bSize);
                 bunGrad.addColorStop(0, adjustColor(color, 40));
                 bunGrad.addColorStop(1, color);
                 ctx.fillStyle = bunGrad;
                 ctx.beginPath(); ctx.arc(p.x, bY, bSize, 0, Math.PI*2); ctx.fill();
                 // Swirl texture
                 ctx.strokeStyle = adjustColor(color, -20);
                 ctx.beginPath(); ctx.arc(p.x, bY, bSize*0.7, 0, Math.PI*1.5); ctx.stroke();
             }
             else if (style.includes('ponytail') || style === 'samurai_bun') {
                 // Tail falling down
                 const tLen = 40*s;
                 ctx.fillStyle = color;
                 ctx.beginPath();
                 ctx.moveTo(p.x - 5*s, tieY);
                 ctx.quadraticCurveTo(p.x - 15*s, tieY + tLen/2, p.x - 10*s, tieY + tLen);
                 ctx.lineTo(p.x + 10*s, tieY + tLen);
                 ctx.quadraticCurveTo(p.x + 15*s, tieY + tLen/2, p.x + 5*s, tieY);
                 ctx.fill();
             }
             else if (style === 'space_buns') {
                 // Two buns
                 const drawBun = (bx) => {
                     ctx.fillStyle = color;
                     ctx.beginPath(); ctx.arc(bx, headY - r * 0.8, 12*s, 0, Math.PI*2); ctx.fill();
                 };
                 drawBun(p.x - r*0.7);
                 drawBun(p.x + r*0.7);
             }
             return;
        }

        // 6. SLICKED / POMPADOUR / FLAT TOP
        if (['slicked_back', 'pompadour', 'flat_top', 'comb_over', 'undercut', 'bowl_cut'].includes(style)) {
             // Defined shapes
             ctx.fillStyle = color;

             if (style === 'flat_top') {
                 // Boxy top
                 const topY = headY - r * 1.5;
                 ctx.beginPath();
                 ctx.moveTo(p.x - r*0.8, headY);
                 ctx.lineTo(p.x - r*0.9, topY);
                 ctx.lineTo(p.x + r*0.9, topY); // Flat horizontal
                 ctx.lineTo(p.x + r*0.8, headY);
                 ctx.fill();
             }
             else if (style === 'pompadour') {
                 // High volume round
                 const topY = headY - r * 1.5;
                 ctx.beginPath();
                 ctx.arc(p.x, headY - 2*s, r, 0, Math.PI, false); // Bottom half
                 ctx.bezierCurveTo(p.x - r, topY, p.x + r, topY, p.x + r, headY - 2*s);
                 ctx.fill();
             }
             else {
                 // Bowl / Slicked
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, Math.PI, 0); ctx.lineTo(p.x + r, headY + 5*s); ctx.lineTo(p.x - r, headY + 5*s); ctx.fill();
             }

             // Sheen (Linear Gradient for slick look)
             const sheen = ctx.createLinearGradient(p.x - r, headY - r, p.x + r, headY - r);
             sheen.addColorStop(0, 'rgba(255,255,255,0)');
             sheen.addColorStop(0.5, 'rgba(255,255,255,0.3)');
             sheen.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = sheen;
             ctx.fill();
             return;
        }

        // 7. SPIKES
        if (['spikes', 'liberty_spikes', 'faux_hawk'].includes(style)) {
            // Scalp
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();

            const numSpikes = (style === 'liberty_spikes') ? 7 : 15;
            const spikeLen = (style === 'liberty_spikes') ? 35*s : 15*s;

            ctx.fillStyle = color;
            for(let i=0; i<numSpikes; i++) {
                // Fan out from center
                const a = Math.PI + (i/(numSpikes-1)) * Math.PI; // Top half arc
                // Faux Hawk concentrates in middle
                let len = spikeLen;
                let ang = a;
                if (style === 'faux_hawk') {
                    // Bias towards -PI/2 (Top)
                    const centerBias = 1 - Math.abs(i - numSpikes/2)/(numSpikes/2);
                    len *= centerBias + 0.5;
                }

                const baseW = 6*s;
                const bx = p.x + Math.cos(ang) * r * 0.8;
                const by = headY - 2*s + Math.sin(ang) * r * 0.8;
                const tx = p.x + Math.cos(ang) * (r + len);
                const ty = headY - 2*s + Math.sin(ang) * (r + len);

                // Triangle spike
                const perpA = ang + Math.PI/2;
                const dx = Math.cos(perpA) * baseW/2;
                const dy = Math.sin(perpA) * baseW/2;

                ctx.beginPath();
                ctx.moveTo(bx - dx, by - dy);
                ctx.lineTo(tx, ty);
                ctx.lineTo(bx + dx, by + dy);
                ctx.fill();
            }
            return;
        }

        // 8. DEFAULT / FALLBACK (Short textured)
        {
             const grad = ctx.createRadialGradient(p.x, headY - 5*s, r * 0.2, p.x, headY - 5*s, r);
             grad.addColorStop(0, adjustColor(color, 20));
             grad.addColorStop(1, color);
             ctx.fillStyle = grad;
             ctx.beginPath(); ctx.arc(p.x, headY - 2*s, r, 0, Math.PI*2); ctx.fill();
        }

    }"""

content = content[:start_idx] + new_function_body + content[end_idx:]

with open('js/renderer.js', 'w') as f:
    f.write(content)
