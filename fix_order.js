        // 3. JORDAN / KOBE / SHAQ / BARKLEY (Bald/Shaved)
        // EXCEPTION: Kobe 8 and Kareem Alt (Afro) are handled later, so we must exclude them here
        if (id.includes('mj') || (id.includes('kobe') && !id.includes('kobe8')) || id.includes('shaq') || id.includes('barkley') || (id.includes('kareem') && !id.includes('kareem_alt')) || id.includes('glide')) {
            // Just the shiny scalp
            const shine = ctx.createRadialGradient(p.x + 5*s, headY - 10*s, 2*s, p.x, headY - 5*s, headRadius);
            shine.addColorStop(0, 'rgba(255,255,255,0.4)');
            shine.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = shine;
            ctx.beginPath(); ctx.arc(p.x, headY, headRadius * 0.9, 0, Math.PI*2); ctx.fill();
            return;
        }