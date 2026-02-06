            ctx.restore();
        };

        if (playerData.currentStyle === 'airbud' && state === 'SHOOTING') {
             const t = airbudJumpTime;
             const maxT = 30;
             if (t < maxT) {
                 const jumpHeight = 60 * s * sizeMod.h;
                 const nt = t / maxT;
                 const offset = 4 * jumpHeight * nt * (1 - nt);
                 p.y -= offset;
                 torsoY = p.y - legLen - bodyH;
                 headY = torsoY - (10 * s * sizeMod.head);
                 shoulderY = torsoY + (2*s);
                 armY = torsoY + (5*s);
                 // Recalculate shoulders
                 leftShoulderX = p.x - 12*s; rightShoulderX = p.x + 12*s;
             }
        }

        // 0b. Detached Ball Rendering
        drawDetachedBall(p, s, torsoY, bodyH, headY);

        // 0c. HELD BALL RENDERING (Layer 0)
        const isDetachedStyle = ['airbud', 'telekinesis'].includes(playerData.currentStyle);
        if (!isDetachedStyle && state !== 'SHOOTING' && state !== 'GAMEOVER') {
             let ballX, ballY;

             if (isSitting) {
                 // Ball in Lap
                 ballX = p.x;
                 ballY = torsoY + bodyH * 0.8;
             } else {
                 const isRightHand = !isLefty;
                 const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
                 const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
                 // Use Z-factor for ball position too!
                 const shootUZ = isRightHand ? rightArmZ : leftArmZ;
                 const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;
                 const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
                 const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

                 const shootSX = isRightHand ? rightShoulderX : leftShoulderX;

                 let elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
                 let wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);

                 let theta = shootFAngle + wristAngle;
                 ballX = wrist.x + Math.cos(theta) * 0 - Math.sin(theta) * 5 * s;
                 ballY = wrist.y + Math.sin(theta) * 0 + Math.cos(theta) * 5 * s;
             }

             var phys = getTempBallPhys(ballX, ballY, p);
             drawBallSprite(ballX, ballY, s, (currentStreak >= 5), 0, phys);
        }

        // Arms First (Layer 1) - Arms behind legs
        drawSegmentedArm(leftShoulderX, armY, false, leftArmAngle, leftForeArmAngle, leftArmZ, leftForeArmZ);
        drawSegmentedArm(rightShoulderX, armY, true, rightArmAngle, rightForeArmAngle, rightArmZ, rightForeArmZ);

        // 2. Legs (Base implementation)
        let lKneeX, lKneeY, rKneeX, rKneeY, lFootX, lFootY, rFootX, rFootY;

        if (isSitting) {
             // Sitting Pose: Knees wide, Feet forward/central
             lKneeX = p.x - 20*s*stanceMod; lKneeY = p.y - 5*s;
             rKneeX = p.x + 20*s*stanceMod; rKneeY = p.y - 5*s;
             lFootX = p.x - 12*s; lFootY = p.y + 5*s;
             rFootX = p.x + 12*s; rFootY = p.y + 5*s;
        } else if (isCrouching) {
             // Crouch Pose: Knees bent outward
             lKneeX = p.x - 15*s*stanceMod; lKneeY = p.y - legLen * 0.3;
             rKneeX = p.x + 15*s*stanceMod; rKneeY = p.y - legLen * 0.3;
             lFootX = p.x - 10*s*stanceMod; lFootY = p.y;
             rFootX = p.x + 10*s*stanceMod; rFootY = p.y;
        } else {
             // Standing
             const baseKneeY = p.y - (legLen * 0.5);
             lKneeX = p.x - 9*s*stanceMod; lKneeY = baseKneeY;
             rKneeX = p.x + 9*s*stanceMod; rKneeY = baseKneeY;
             lFootX = p.x - 10*s*stanceMod; lFootY = p.y;
             rFootX = p.x + 10*s*stanceMod; rFootY = p.y;
        }

        // Dirk Kick Logic
        if (state === 'JUMPING' && playerData.currentStyle === 'dirk') {
            const style = getCurrentStyle();
            const maxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            const lift = Math.min(1.0, Math.max(0, (maxVz - getCurrentVz()) / maxVz));
            const kickH = 20 * s * lift;
            const kickW = 15 * s * lift;
            if (playerData.isLefty) {
                 lKneeY -= kickH; lKneeX -= kickW; lFootX -= kickW; lFootY -= kickH*0.8;
            } else {
                 rKneeY -= kickH; rKneeX += kickW; rFootX += kickW; rFootY -= kickH*0.8;
            }
        }


        const legFurry = isFurry && (legColor === furColor);

        // Scale Hip Width with Body/Leg Width (Fixes narrow hips on wide chars)
        const hipScale = (sizeMod.legWidth || sizeMod.w || 1.0);
        const hipX = 8 * s * stanceMod * hipScale;

        let hipY = p.y - legLen;
        if (isSitting) hipY = p.y - 10 * s;

        // Calculate Tapered Leg Widths
        const legTaper = sizeMod.limbTaper || 0.7;
        const thighStartW = 8 * s * sizeMod.legWidth;
        const thighEndW = thighStartW * legTaper;
        const calfStartW = thighEndW;
        const calfEndW = calfStartW * legTaper;

        // Hip Joints
        if(!legFurry) {
            drawJoint(p.x - hipX, hipY, thighStartW * 0.5, thighColor, isMechanical);
            drawJoint(p.x + hipX, hipY, thighStartW * 0.5, thighColor, isMechanical);
        } else {
            drawFuzzyCircle(p.x - hipX, hipY, thighStartW * 0.5, thighColor, 10, s, true);
            drawFuzzyCircle(p.x + hipX, hipY, thighStartW * 0.5, thighColor, 30, s, true);
        }

        // Tapered Thighs
        drawFuzzyLimb(p.x - hipX, hipY, lKneeX, lKneeY, thighStartW, thighColor, s, legFurry, 1, thighEndW);
        drawFuzzyLimb(p.x + hipX, hipY, rKneeX, rKneeY, thighStartW, thighColor, s, legFurry, 3, thighEndW);

        // Calves & Socks/Shoes
        const drawLowerLeg = (xTop, yTop, xBot, yBot, isRight) => {
             const calfBaseColor = calfColor;

             // Draw Base Calf
             drawFuzzyLimb(xTop, yTop, xBot, yBot, calfStartW, calfBaseColor, s, legFurry, isRight?4:2, calfEndW);

             // Paw / Foot (If no shoes)
             if (legFurry && !skinObj.shoesColor) {
                 const pawColor = calfBaseColor;
                 const footS = sizeMod.footScale || 1.0;
                 drawFuzzyCircle(xBot, yBot, 4.5*s*footS, pawColor, isRight?50:60, s, true);
                 // Toes
                 for(let k=-1; k<=1; k++) {
                     drawFuzzyCircle(xBot + k*3*s*footS, yBot + 4*s*footS, 3*s*footS, pawColor, isRight?51+k:61+k, s, true);
                 }
             }

             // Knee Joint (Radius = Half Width)
             if(!legFurry) drawJoint(xTop, yTop, thighEndW * 0.5, thighColor, isMechanical);
             else drawFuzzyCircle(xTop, yTop, thighEndW * 0.5, thighColor, isRight?40:20, s, true);

             // Socks & Shoes Overlay
             if(skinObj.socksColor || skinObj.shoesColor) {
                 const shoeH = 5 * s; const sockH = 7 * s;
                 // Calculate local Y relative to the foot Y
                 const ankleY = yBot - shoeH; const sockY = ankleY - sockH;

                 // Interpolate X/Y
                 const getXAtY = (y) => {
                     const t = (y - yTop) / (yBot - yTop);
                     return xTop + (xBot - xTop) * t;
                 };

                 if(skinObj.socksColor) {
                     const sockTopX = getXAtY(sockY);
                     const ankleX = getXAtY(ankleY);
                     // Interpolate widths
                     const sockTopW = calfStartW + (calfEndW - calfStartW) * ((sockY - yTop)/(yBot - yTop));
                     const ankleW = calfStartW + (calfEndW - calfStartW) * ((ankleY - yTop)/(yBot - yTop));
                     drawFuzzyLimb(sockTopX, sockY, ankleX, ankleY, sockTopW, skinObj.socksColor, s, false, 0, ankleW);
                 }
                 if(skinObj.shoesColor) {
                     const ankleX = getXAtY(ankleY);
                     const ankleW = calfStartW + (calfEndW - calfStartW) * ((ankleY - yTop)/(yBot - yTop));
                     drawFuzzyLimb(ankleX, ankleY, xBot, yBot, ankleW, skinObj.shoesColor, s, false, 0, calfEndW);
                     // Shoe Foot
                     ctx.fillStyle = skinObj.shoesColor;
                     ctx.beginPath(); ctx.ellipse(xBot, yBot + 1*s, 4.5*s, 2.5*s, 0, 0, Math.PI*2); ctx.fill();
                 }
             }
        };

        drawLowerLeg(lKneeX, lKneeY, lFootX, lFootY, false); // Left
        drawLowerLeg(rKneeX, rKneeY, rFootX, rFootY, true); // Right

        // 6. Draw Body (Layer 2)
        const bodyFurry = isFurry && (torsoColor === furColor);
        let bodyOptions = {};

        // Define Body Shapes for Animals
        if (currentAnimal === 'bear') { bodyOptions.bodyShape = 'bear_new'; }
        else if (['rat', 'cat', 'rabbit', 'fox', 'monkey'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'oval'; // Small animals
        }
        else if (['dog', 'wolf', 'lion', 'tiger'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'athletic_animal'; // Leaner, standing
        }
        else if (['pig', 'cow', 'moose'].includes(currentAnimal)) {
            bodyOptions.bodyShape = 'round'; // Chunky
            bodyOptions.waistScale = 1.1;
            bodyOptions.roundness = 0.2;
        }

        if (skin === 'bear_panda') bodyOptions.chestStripeColor = '#000';

        // Auto-detect Jersey
        if (!bodyFurry && torsoColor !== furColor && !skinObj.pattern) {
            bodyOptions.isJersey = true;
        }

        bodyOptions.pattern = skinObj.pattern; // Pass pattern to body (e.g. tattoos)
        bodyOptions.animal = currentAnimal;

        const anchors = {
            shoulders: { left: {x: leftShoulderX, y: shoulderY}, right: {x: rightShoulderX, y: shoulderY} },
            hips: { left: {x: p.x - hipX, y: hipY}, right: {x: p.x + hipX, y: hipY} }
        };
        drawAnatomicBody(p.x, torsoY, bodyW, bodyH, s, torsoColor, bodyFurry, 40, bodyOptions, anchors);

        if(currentAnimal === 'penguin' && torsoColor === furColor) {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, torsoY + bodyH * 0.55, bodyW * 0.7, bodyH * 0.4, 0, 0, Math.PI*2); ctx.fill();
        }
        if(skinObj.pattern === 'tiger_stripes') {
             ctx.strokeStyle = '#000'; ctx.lineWidth = 2*s;
             // Body stripes
             ctx.beginPath(); ctx.moveTo(p.x - bodyW/2, torsoY + 10*s); ctx.lineTo(p.x - bodyW/4, torsoY + 15*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x + bodyW/2, torsoY + 10*s); ctx.lineTo(p.x + bodyW/4, torsoY + 15*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x - bodyW/2, torsoY + 25*s); ctx.lineTo(p.x - bodyW/4, torsoY + 30*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x + bodyW/2, torsoY + 25*s); ctx.lineTo(p.x + bodyW/4, torsoY + 30*s); ctx.stroke();
        }
        if(skinObj.pattern === 'cow_spots') {
             ctx.fillStyle = (skin === 'cow_strawberry') ? '#FF69B4' : '#000';
             ctx.beginPath(); ctx.arc(p.x - 5*s, torsoY + 10*s, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x + 8*s, torsoY + 25*s, 5*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x - 2*s, torsoY + 30*s, 4*s, 0, Math.PI*2); ctx.fill();
        }

        if(hasSpots) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p.x, torsoY + 20*s, 4*s, 0, Math.PI*2); ctx.fill(); }
        if(skin.includes('tabby')) { ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2*s; ctx.beginPath(); ctx.moveTo(p.x-5*s, torsoY+10*s); ctx.lineTo(p.x+5*s, torsoY+10*s); ctx.stroke(); }
        // Pattern Rendering
        if(skinObj.pattern === 'plaid') {
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.moveTo(p.x-bodyW/2, torsoY+10*s); ctx.lineTo(p.x+bodyW/2, torsoY+10*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x-bodyW/2, torsoY+20*s); ctx.lineTo(p.x+bodyW/2, torsoY+20*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x-bodyW/2, torsoY+30*s); ctx.lineTo(p.x+bodyW/2, torsoY+30*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x, torsoY); ctx.lineTo(p.x, torsoY+bodyH); ctx.stroke();
        }
        else if(skinObj.pattern === 'stripes') { // Referee or Bandit
             ctx.fillStyle = '#000';
             ctx.fillRect(p.x-5*s, torsoY, 10*s, bodyH); // Center stripe
             ctx.fillRect(p.x-15*s, torsoY, 5*s, bodyH); // Left stripe
             ctx.fillRect(p.x+10*s, torsoY, 5*s, bodyH); // Right stripe
        }
        else if(skinObj.pattern === 'suit') { // Tuxedo button
             ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p.x, torsoY + 15*s, 2*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, torsoY + 25*s, 2*s, 0, Math.PI*2); ctx.fill();
             // Bowtie
             ctx.fillStyle = 'red';
             ctx.beginPath(); ctx.moveTo(p.x, torsoY+5*s); ctx.lineTo(p.x-5*s, torsoY+2*s); ctx.lineTo(p.x-5*s, torsoY+8*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x, torsoY+5*s); ctx.lineTo(p.x+5*s, torsoY+2*s); ctx.lineTo(p.x+5*s, torsoY+8*s); ctx.fill();
        }
        else if(skinObj.pattern === 'suit_jacket') { // Back view of a suit
             ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1*s;
             // Center seam (Vent)
             ctx.beginPath(); ctx.moveTo(p.x, torsoY + bodyH * 0.7); ctx.lineTo(p.x, torsoY + bodyH); ctx.stroke();
             // Shoulder seams
             ctx.beginPath();
             ctx.moveTo(p.x - bodyW/2 + 5*s, torsoY + 5*s);
             ctx.quadraticCurveTo(p.x, torsoY + 8*s, p.x + bodyW/2 - 5*s, torsoY + 5*s);
             ctx.stroke();
        }

        // Clothing Details (New Layer)
        if(skinObj.clothingDetail === 'suspenders') {
             ctx.fillStyle = '#1a1a1a'; // Dark suspenders
             // Left
             ctx.fillRect(p.x - bodyW/2 + 2*s, torsoY, 3*s, bodyH);
             // Right
             ctx.fillRect(p.x + bodyW/2 - 5*s, torsoY, 3*s, bodyH);
        }
        if(skinObj.clothingDetail === 'apron_ties') {
             ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2*s;
             ctx.beginPath();
             ctx.moveTo(p.x, torsoY + bodyH*0.6);
             ctx.lineTo(p.x - 10*s, torsoY + bodyH*0.6 + 5*s); // Left hanging
             ctx.moveTo(p.x, torsoY + bodyH*0.6);
             ctx.lineTo(p.x + 10*s, torsoY + bodyH*0.6 + 5*s); // Right hanging
             // Knot
             ctx.fillStyle='#FFF'; ctx.beginPath(); ctx.arc(p.x, torsoY+bodyH*0.6, 3*s, 0, Math.PI*2); ctx.fill();
             ctx.stroke();
        }
        if(skinObj.clothingDetail === 'overalls') {
             ctx.fillStyle = skinObj.shortsColor || '#000080';
             // Bib
             ctx.fillRect(p.x - bodyW*0.3, torsoY + bodyH*0.3, bodyW*0.6, bodyH*0.4);
             // Straps
             ctx.fillRect(p.x - bodyW*0.3, torsoY, bodyW*0.1, bodyH*0.3);
             ctx.fillRect(p.x + bodyW*0.2, torsoY, bodyW*0.1, bodyH*0.3);
        }
        if(skinObj.clothingDetail === 'stitches') {
