        // Always draw neck if gap exists or explicitly requested (Rat/Giraffe fix)
        if (neckBottomY > neckTopY || skinObj.neckLength) {
             const savedFill = ctx.fillStyle;
             ctx.fillStyle = furColor;
             // Ensure skin tone for humans
             if (currentAnimal === 'human') ctx.fillStyle = skinObj.skinTone || furColor;

             ctx.fillRect(p.x - neckWidth/2, neckTopY, neckWidth, neckBottomY - neckTopY);
             ctx.fillStyle = savedFill;
        }

        // Lift shoulders for humans to extend jersey higher (Trapezoid shape)
        let shoulderY = torsoY + (2*s);
        let armY = torsoY + (5*s); // Lower attachment
        if (currentAnimal === 'human') { shoulderY = torsoY; armY = torsoY; } // Square shoulders at top of bounding box

        // Stance modifier for shoulder width and hip width
        const stanceMod = sizeMod.stance || 1.0;

        // Dynamic Shoulder Width (Scaling with Body Width)
        const shoulderScale = (sizeMod.w || 1.0) * (sizeMod.shoulderWidth || 1.0);
        let shoulderBaseW = 12 * s * stanceMod * shoulderScale;

        // Extra Broad for Hulk/Strong types (Shirtless = Broad)
        if (skinObj.jerseyType === 'none') {
            shoulderBaseW *= 1.5;
        }

        let leftShoulderX = p.x - shoulderBaseW;
        let rightShoulderX = p.x + shoulderBaseW;

        let armLenMod = sizeMod.limbLen || 1.0;
        if (skinObj.armLen) armLenMod = skinObj.armLen;
        else if (currentAnimal === 'bear') armLenMod = 0.95; // Bears have slightly shorter arms but not too short to break shooting
        let upperArmLen = 20 * s * sizeMod.h * 1.05 * armLenMod; let foreArmLen = 20 * s * sizeMod.h * 1.05 * armLenMod;

        // --- PROCEDURAL GUIDE HAND LOGIC (ANIMALS) ---
        // Updated to handle Z-foreshortening in IK (Approximation)
        if (isTwoHandedStyle(playerData.currentStyle) && (state === 'JUMPING' || state === 'PRE_JUMP')) {
            const isRightHand = !isLefty;

            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootUZ = isRightHand ? rightArmZ : leftArmZ;
            const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;

            // Calculate effective lengths for 2D projection
            const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

            const elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
            const wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);
            const ballPos = calculateBallPosition(wrist.x, wrist.y, s, shootFAngle, wristAngle);

            // 2. Calculate Guide Arm Target
            const guideTargetX = ballPos.x + (isRightHand ? -15*s : 15*s);
            const guideTargetY = ballPos.y;

            const guideSX = isRightHand ? leftShoulderX : rightShoulderX;

            // 3. Solve IK
            const distSq = (guideTargetX - guideSX)**2 + (guideTargetY - armY)**2;
            const maxLen = upperArmLen + foreArmLen;
            const minScale = Math.min(1.0, Math.sqrt(distSq) / maxLen);
            const maxZ = Math.acos(Math.max(0, Math.min(1, minScale * 0.99)));
            const guideZ = Math.min(shootUZ, maxZ);

            const effGuideUpper = upperArmLen * Math.max(0.1, Math.cos(guideZ));
            const effGuideFore = foreArmLen * Math.max(0.1, Math.cos(guideZ));

            const ik = solveIK(guideSX, armY, guideTargetX, guideTargetY, effGuideUpper, effGuideFore, isLefty);

            // 4. Override Guide Arm Angles
            if (isRightHand) {
                leftArmAngle = ik.uAngle;
                leftForeArmAngle = ik.fAngle;
                // Sync Z
                leftArmZ = guideZ; leftForeArmZ = guideZ;
            } else {
                rightArmAngle = ik.uAngle;
                rightForeArmAngle = ik.fAngle;
                rightArmZ = guideZ; rightForeArmZ = guideZ;
            }
        }

        const isShadow = (p.type === 'player_shadow');

        const drawSegmentedArm = (sx, sy, isRight, angle1, angle2, angle1_z, angle2_z) => {
            const armFurry = isFurry && (armColor === furColor);
            const seedBase = isRight ? 10 : 20;
            const isShootingSide = (isLefty && !isRight) || (!isLefty && isRight);

            let thisUpperColor = armColor;
            let thisForeColor = armColor;
            let activeSleeveColor = null;

            // T-Shirt Logic
            if(skinObj.jerseyType === 'tshirt' || skinObj.jerseyType === 'link_tunic') {
                thisUpperColor = torsoColor;
            }

            // Sleeve Logic (Physical side based)
            if(isRight && skinObj.sleeveRight) {
                activeSleeveColor = skinObj.sleeveRight;
            }
            if(!isRight && skinObj.sleeveLeft) {
                activeSleeveColor = skinObj.sleeveLeft;
            }

            if (activeSleeveColor) {
                thisForeColor = activeSleeveColor;
            }

            // Calculate Tapered Widths
            const taper = sizeMod.limbTaper || 0.7;
            const upperStartW = 7 * s * sizeMod.armWidth;
            const upperEndW = upperStartW * taper;
            const foreStartW = upperEndW; // Seamless transition
            const foreEndW = foreStartW * taper;

            // FORESHORTENING
            let uFactor = Math.cos(angle1_z || 0);
            let fFactor = Math.cos(angle2_z || 0);

            // Shadow Logic: Show full length (projected to ground) to imply depth
            if (isShadow) {
                // If shadow, we ignore the Z-shortening because the shadow
                // of a forward-reaching arm (parallel to ground) is full length.
                // However, our Z-angle is "angle from screen plane".
                // If Z=90, arm is pointing at camera (horizontal). Shadow is full length.
                // If Z=0, arm is parallel to screen (horizontal). Shadow is full length.
                // What if arm is pointing UP? That's controlled by angle1 (X/Y).
                // If angle1 is -PI/2 (UP), and Z=0, arm is vertical. Shadow is short (blob).
                // So, we should use uFactor = 1.0 for shadow pass?
                uFactor = 1.0;
                fFactor = 1.0;
            }

            uFactor = Math.max(0.1, Math.abs(uFactor));
            fFactor = Math.max(0.1, Math.abs(fFactor));

            let elbow = getJoint(sx, sy, upperArmLen * uFactor, angle1);

            // Shoulder Joint (Radius = Half Width for seamless look)
            if(!armFurry) drawJoint(sx, sy, upperStartW * 0.5, thisUpperColor, isMechanical);
            else drawFuzzyCircle(sx, sy, upperStartW * 0.5, thisUpperColor, seedBase, s, true);

            // Upper Arm (Tapered)
            drawFuzzyLimb(sx, sy, elbow.x, elbow.y, upperStartW, thisUpperColor, s, armFurry, seedBase, upperEndW);

            // Arm Sleeve Upper Segment (Mid-Bicep to Elbow)
            if (activeSleeveColor) {
                const midX = (sx + elbow.x) / 2;
                const midY = (sy + elbow.y) / 2;
                // Interpolate width at mid point
                const midW = upperStartW + (upperEndW - upperStartW) * 0.5;
                drawFuzzyLimb(midX, midY, elbow.x, elbow.y, midW, activeSleeveColor, s, false, seedBase, upperEndW);
            }

            let wrist = getJoint(elbow.x, elbow.y, foreArmLen * fFactor, angle2);

            // Forearm (Tapered)
            drawFuzzyLimb(elbow.x, elbow.y, wrist.x, wrist.y, foreStartW, thisForeColor, s, activeSleeveColor ? false : armFurry, seedBase + 1, foreEndW);

            // Elbow Joint (Radius = Half Width)
            let elbowColor = thisUpperColor;
            if (activeSleeveColor) {
                elbowColor = activeSleeveColor;
            } else if (thisForeColor === furColor && thisUpperColor !== furColor) {
                elbowColor = thisUpperColor; // Sleeve covers elbow
            } else if (thisUpperColor === furColor) {
                elbowColor = furColor;
            }

            const elbowFurry = activeSleeveColor ? false : armFurry;
            if(!elbowFurry) drawJoint(elbow.x, elbow.y, upperEndW * 0.5, elbowColor, isMechanical);
            else drawFuzzyCircle(elbow.x, elbow.y, upperEndW * 0.5, elbowColor, seedBase+2, s, true);

            ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.rotate(angle2 + (isShootingSide ? wristAngle : 0));

            // Paw / Hand
            if (armFurry && !activeSleeveColor) {
                 // Fuzzy Paw
                 const pawColor = thisForeColor;
                 drawFuzzyCircle(0, 0, 4.5*s, pawColor, seedBase+5, s, true);
                 // Toes
                 for(let k=-1; k<=1; k++) {
                     drawFuzzyCircle(k*3*s, 5*s, 2.5*s, pawColor, seedBase+6+k, s, true);
                 }
            } else {
                 // Simple Hand
                 ctx.fillStyle = furColor; ctx.beginPath(); ctx.arc(0, 0, 5*s, 0, Math.PI*2); ctx.fill();
            }

            if (wristAngle > 0.5 && isShootingSide) {
                 if(skin.includes('hockey')) { ctx.strokeStyle='#8B4513'; ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 40*s); ctx.lineTo(10*s, 45*s); ctx.stroke(); }
            }

            // Ball removed (drawn earlier)
