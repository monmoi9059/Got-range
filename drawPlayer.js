    function drawPlayer(p) {
        if (!p) return;
        // Debug
        // if(Math.random() < 0.01) console.log("drawPlayer", p, playerData.currentSkin);

        const s = p.scale;
        const skin = playerData.currentSkin;

        let skinObj;
        if (skin === g_cachedSkinId && g_cachedSkinObj) {
            skinObj = g_cachedSkinObj;
        } else {
            skinObj = SKINS_DB.find(x => x.id === skin);
            if(!skinObj) skinObj = SKINS_DB[0];
            g_cachedSkinId = skin;
            g_cachedSkinObj = skinObj;
        }

        const isMechanical = isMechanicalSkin(skinObj.id);
        const currentAnimal = skinObj.animal;

        if (currentAnimal === 'human') {
            drawRealisticHuman(p, s, skinObj);
            return;
        }

        let sizeMod = { w: 1, h: 1, head: 1, stance: 1.0, limbLen: 1.0, armWidth: 1.0, legWidth: 1.0, shoulderWidth: 1.0, footScale: 1.0, neckWidth: 1.0, snoutScale: 1.0, limbTaper: 0.7 };
        switch(currentAnimal) {
            case 'rat': sizeMod = { w: 0.7, h: 0.7, head: 0.8, stance: 0.8, limbLen: 0.85, shoulderWidth: 0.6, footScale: 0.8, neckWidth: 0.8, snoutScale: 1.0, limbTaper: 0.7 }; break;
            case 'cat':
                sizeMod = { w: 0.8, h: 0.8, head: 0.9, stance: 0.9, limbLen: 0.9, shoulderWidth: 0.6, footScale: 0.9, neckWidth: 0.9, snoutScale: 0.8, limbTaper: 0.7 };
                if (skin.includes('sphinx')) { sizeMod.w = 0.7; sizeMod.h = 0.85; sizeMod.head = 0.85; } // Skinny
                if (skin.includes('persian')) { sizeMod.w = 1.0; sizeMod.h = 0.8; sizeMod.head = 1.0; } // Fluffy
                if (skin.includes('panther')) { sizeMod.w = 0.9; sizeMod.h = 0.9; sizeMod.limbLen = 1.0; } // Athletic
                if (skin.includes('garfield')) { sizeMod.w = 1.1; sizeMod.h = 0.9; sizeMod.head = 1.1; } // Fat cat
                break;
            case 'rabbit': sizeMod = { w: 0.8, h: 0.8, head: 0.9, stance: 0.9, limbLen: 0.9, shoulderWidth: 0.6, footScale: 1.2, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'dog':
                sizeMod = { w: 1.0, h: 1.0, head: 1.0, stance: 1.0, limbLen: 1.0, shoulderWidth: 0.7, footScale: 1.0, neckWidth: 1.1, snoutScale: 1.1, limbTaper: 0.7 };
                if (skin.includes('pug')) { sizeMod.w = 0.9; sizeMod.h = 0.75; sizeMod.head = 1.1; sizeMod.limbLen = 0.8; sizeMod.snoutScale = 0.5; } // Small & Flat
                if (skin.includes('husky') || skin.includes('police') || skin.includes('wolf')) { sizeMod.w = 1.05; sizeMod.h = 1.1; sizeMod.limbLen = 1.1; } // Athletic
                if (skin.includes('boxer')) { sizeMod.w = 1.1; sizeMod.h = 1.05; sizeMod.shoulderWidth = 0.9; } // Muscular
                if (skin.includes('dalmation')) { sizeMod.w = 0.95; sizeMod.h = 1.05; sizeMod.limbLen = 1.1; } // Lean
                break;
            case 'moose': sizeMod = { w: 1.2, h: 1.3, head: 1.1, stance: 1.1, limbLen: 1.1, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.4, limbTaper: 0.7 }; break;
            case 'bear': sizeMod = { w: 1.4, h: 1.3, head: 1.2, stance: 1.6, limbLen: 0.7, armWidth: 1.3, legWidth: 1.5, shoulderWidth: 0.9, footScale: 1.3, neckWidth: 1.4, snoutScale: 1.2, limbTaper: 0.85 }; break;
            case 'human': sizeMod = { w: 0.9, h: 1.1, head: 0.9, stance: 1.0, limbLen: 1.0, shoulderWidth: 1.0, footScale: 1.0, neckWidth: 1.0, limbTaper: 0.8 }; break;
            case 'fox': sizeMod = { w: 0.9, h: 0.9, head: 0.95, stance: 0.95, limbLen: 0.95, shoulderWidth: 0.6, footScale: 0.9, neckWidth: 0.9, snoutScale: 1.1, limbTaper: 0.7 }; break;
            case 'wolf': sizeMod = { w: 1.1, h: 1.1, head: 1.1, stance: 1.05, limbLen: 1.05, legWidth: 1.1, shoulderWidth: 0.7, footScale: 1.0, neckWidth: 1.1, snoutScale: 1.2, limbTaper: 0.75 }; break;
            case 'lion': sizeMod = { w: 1.3, h: 1.2, head: 1.25, stance: 1.2, limbLen: 1.05, legWidth: 1.25, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.1, limbTaper: 0.8 }; break;
            case 'tiger': sizeMod = { w: 1.3, h: 1.2, head: 1.2, stance: 1.2, limbLen: 1.05, legWidth: 1.25, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.1, limbTaper: 0.8 }; break;
            case 'pig': sizeMod = { w: 1.1, h: 0.9, head: 1.0, stance: 1.5, limbLen: 0.7, armWidth: 1.2, legWidth: 1.2, shoulderWidth: 0.6, footScale: 0.8, neckWidth: 1.2, snoutScale: 1.0, limbTaper: 0.85 }; break;
            case 'cow': sizeMod = { w: 1.3, h: 1.3, head: 1.2, stance: 1.5, limbLen: 0.9, legWidth: 1.2, shoulderWidth: 0.7, footScale: 1.1, neckWidth: 1.3, snoutScale: 1.2, limbTaper: 0.85 }; break;
            case 'monkey': sizeMod = { w: 0.85, h: 0.9, head: 0.9, stance: 1.0, limbLen: 1.2, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'penguin': sizeMod = { w: 1.0, h: 0.8, head: 0.9, stance: 1.1, limbLen: 0.5, shoulderWidth: 0.5, footScale: 1.3, neckWidth: 1.0, limbTaper: 0.8 }; break;
            case 'chicken': sizeMod = { w: 0.7, h: 0.7, head: 0.7, stance: 0.8, limbLen: 0.7, armWidth: 0.6, legWidth: 0.6, shoulderWidth: 0.5, footScale: 0.8, neckWidth: 0.6, limbTaper: 0.6 }; break;
            case 'frog': sizeMod = { w: 0.8, h: 0.7, head: 1.0, stance: 1.4, limbLen: 1.1, armWidth: 0.8, legWidth: 0.8, shoulderWidth: 0.6, footScale: 1.4, neckWidth: 0.8, limbTaper: 0.7 }; break;
            case 'turtle': sizeMod = { w: 1.1, h: 0.9, head: 0.9, stance: 1.2, limbLen: 0.6, armWidth: 1.2, legWidth: 1.2, shoulderWidth: 0.8, footScale: 1.1, neckWidth: 1.2, limbTaper: 0.8 }; break;
            case 'elephant': sizeMod = { w: 1.5, h: 1.3, head: 1.4, stance: 1.3, limbLen: 0.8, armWidth: 1.5, legWidth: 1.6, shoulderWidth: 0.9, footScale: 1.5, neckWidth: 1.5, limbTaper: 0.9 }; break;
            case 'dino': sizeMod = { w: 1.3, h: 1.3, head: 1.2, stance: 1.2, limbLen: 1.1, legWidth: 1.4, shoulderWidth: 0.7, footScale: 1.3, neckWidth: 1.2, snoutScale: 1.3, limbTaper: 0.8 }; break;
            case 'zebra': sizeMod = { w: 1.2, h: 1.2, head: 1.1, stance: 1.1, limbLen: 1.1, shoulderWidth: 0.75, footScale: 1.0, neckWidth: 1.2, snoutScale: 1.2, limbTaper: 0.7 }; break;
            case 'giraffe': sizeMod = { w: 1.2, h: 1.6, head: 1.0, stance: 1.2, limbLen: 1.5, shoulderWidth: 0.7, footScale: 1.2, neckWidth: 0.7, limbTaper: 0.7 }; break;
        }

        // Apply Skin Overrides (Size & Proportions)
        if (skinObj.widthScale) sizeMod.w = skinObj.widthScale;
        if (skinObj.heightScale) sizeMod.h = skinObj.heightScale;
        if (skinObj.armWidthScale) sizeMod.armWidth = skinObj.armWidthScale;
        if (skinObj.legWidthScale) sizeMod.legWidth = skinObj.legWidthScale;

        // Fill defaults if missing
        if (!sizeMod.armWidth) sizeMod.armWidth = sizeMod.w;
        if (!sizeMod.legWidth) sizeMod.legWidth = sizeMod.w;

        // V-Taper / Hulk Body Size Adjustment
        if (currentAnimal === 'human' && skinObj.jerseyType === 'none') {
            sizeMod.w *= 1.5;
            sizeMod.h *= 1.5;
        }

        // Determine if Furry
        const NON_FURRY_ANIMALS = ['dino', 'turtle', 'penguin', 'frog', 'elephant', 'human'];
        const isNonFurrySkin = skin.includes('robot') || skin.includes('astronaut') || skin.includes('alien') || skin.includes('ninja');
        let isFurry = !NON_FURRY_ANIMALS.includes(currentAnimal) && !isNonFurrySkin;

        // 1. Setup Base Colors
        let furColor = '#555', tailColor = '#FFC0CB', torsoColor = '#555', legColor = '#555', armColor = '#555';
        let thighColor = '#555', calfColor = '#555';
        let bellyColor = null, hasSpots = false, hasBlackEars = false;

        if (skin === 'bear_panda') hasBlackEars = true;

        if(currentAnimal === 'rat') { furColor = '#696969'; tailColor = '#FFC0CB'; }
        else if(currentAnimal === 'cat') { furColor = '#808080'; tailColor = '#808080'; }
        else if(currentAnimal === 'dog') { furColor = '#8B4513'; tailColor = '#8B4513'; }
        else if(currentAnimal === 'bear') { furColor = '#4B3621'; tailColor = '#4B3621'; }
        else if(currentAnimal === 'rabbit') { furColor = '#fff'; tailColor = '#fff'; }
        else if(currentAnimal === 'moose') { furColor = '#5D4037'; tailColor = '#5D4037'; }
        else if(currentAnimal === 'fox') { furColor = '#D2691E'; tailColor = '#D2691E'; }
        else if(currentAnimal === 'wolf') { furColor = '#808080'; tailColor = '#808080'; }
        else if(currentAnimal === 'lion') { furColor = '#DAA520'; tailColor = '#DAA520'; }
        else if(currentAnimal === 'tiger') { furColor = '#FFA500'; tailColor = '#FFA500'; }
        else if(currentAnimal === 'pig') { furColor = '#FFC0CB'; tailColor = '#FFC0CB'; }
        else if(currentAnimal === 'cow') { furColor = '#FFF'; tailColor = '#FFF'; }
        else if(currentAnimal === 'monkey') { furColor = '#8B4513'; tailColor = '#8B4513'; }
        else if(currentAnimal === 'penguin') { furColor = '#000'; tailColor = '#000'; }
        else if(currentAnimal === 'human') {
            furColor = skinObj.skinTone || '#8d5524';
            tailColor = 'transparent';
        }

        // 2. Apply Skin Overrides (Data Driven)
        // Biological overrides first
        if (skinObj.furColor) { furColor = skinObj.furColor; tailColor = skinObj.furColor; }
        if (skinObj.hasSpots) hasSpots = true;

        if (skin.includes('alien')) { furColor = '#32CD32'; tailColor = '#32CD32'; }
        if (skin.includes('zombie')) { furColor = '#98FB98'; }
        if (skin.includes('robot')) { furColor = '#C0C0C0'; }

        // Default clothes to fur color (naked)
        torsoColor = furColor; legColor = furColor; armColor = furColor;
        thighColor = legColor; calfColor = legColor;

        // Clothing overrides
        torsoColor = skinObj.jerseyColor || furColor;
        thighColor = skinObj.shortsColor || furColor;
        calfColor = furColor; // Default exposed calf

        // Arms: Default to fur, check for sleeves
        armColor = furColor;
        if (skinObj.sleeveColor) armColor = skinObj.sleeveColor;

        // Legs: If "trousers" (long pants), calf follows thigh color
        if (skinObj.legType === 'pants') calfColor = thighColor;
        if (skinObj.legType === 'tights') calfColor = thighColor;

        // Panda Logic (Black limbs)
        if (skinObj.legType === 'panda_limbs') {
            legColor = '#000'; thighColor = '#000'; calfColor = '#000'; armColor = '#000';
        }

        // 0. Calculate Arm Config EARLY
        // Uses global smooth animation state
        const r_la = g_animState.la;
        const r_ra = g_animState.ra;
        const r_lfa = g_animState.lfa;
        const r_rfa = g_animState.rfa;
        const r_w = g_animState.w;

        // Z-Rotation (Depth)
        const r_la_z = g_animState.la_z || 0;
        const r_ra_z = g_animState.ra_z || 0;
        const r_lfa_z = g_animState.lfa_z || 0;
        const r_rfa_z = g_animState.rfa_z || 0;

        let leftArmAngle, rightArmAngle, leftForeArmAngle, rightForeArmAngle, wristAngle;
        let leftArmZ, rightArmZ, leftForeArmZ, rightForeArmZ;

        const isLefty = playerData.isLefty;
        if (isLefty) {
            leftArmAngle = Math.PI - r_ra; rightArmAngle = Math.PI - r_la;
            leftForeArmAngle = Math.PI - r_rfa; rightForeArmAngle = Math.PI - r_lfa;
            wristAngle = -r_w;
            // Swap Z for Lefty
            leftArmZ = r_ra_z; rightArmZ = r_la_z;
            leftForeArmZ = r_rfa_z; rightForeArmZ = r_lfa_z;
        } else {
            leftArmAngle = r_la; rightArmAngle = r_ra;
            leftForeArmAngle = r_lfa; rightForeArmAngle = r_rfa;
            wristAngle = r_w;
            // Standard Z
            leftArmZ = r_la_z; rightArmZ = r_ra_z;
            leftForeArmZ = r_lfa_z; rightForeArmZ = r_rfa_z;
        }

        let bodyW = 20 * s * sizeMod.w; let bodyH = 40 * s * sizeMod.h;
        if(currentAnimal === 'bear') bodyW = 30 * s * sizeMod.w;

        let legLen = 30 * s * sizeMod.h * (sizeMod.limbLen || 1.0);
        let neckLen = 0;

        // Pose Logic
        const isSitting = (state === 'GAMEOVER' && currentAnimal !== 'human');
        const isCrouching = (state === 'PRE_JUMP'); // Now applies to animals too (Gather)

        let torsoY;
        if (isSitting) {
             torsoY = p.y - bodyH * 0.85; // Low to ground
        } else if (isCrouching) {
             torsoY = p.y - legLen * 0.6 - bodyH; // Crouched
        } else {
             torsoY = p.y - legLen - bodyH;
        }
        if (skinObj.neckLength) neckLen = skinObj.neckLength * s;
        let headY = torsoY - (10 * s * sizeMod.head) - neckLen;
        let headRadius = 12 * s * sizeMod.head;

        // Super Saiyan Aura
        if (currentStreak >= 10) {
             const hue = getStreakFireHue(currentStreak);
             ctx.save();
             // Outer Glow
             ctx.shadowBlur = 30 * s;
             ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
             ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.2)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 2.5, bodyH * 2.0, 0, 0, Math.PI*2);
             ctx.fill();
             // Inner Core
             ctx.shadowBlur = 15 * s;
             ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.3)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 1.5, bodyH * 1.5, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        // Draw Neck (Universal - Connect Head to Body)
        const neckWidth = 10 * s * (sizeMod.neckWidth || (sizeMod.w || 1.0) * 0.6);
        const neckTopY = headY + headRadius * 0.5;
        const neckBottomY = torsoY + (10*s);
