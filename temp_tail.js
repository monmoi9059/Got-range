    function drawRealisticHuman(p, s, skinObj) {
        const isMechanical = isMechanicalSkin(skinObj.id);
        // Base Setup
        const sizeMod = {
            w: skinObj.widthScale || 0.9,
            h: skinObj.heightScale || 1.1,
            head: 0.9,
            armWidth: skinObj.armWidthScale || (skinObj.widthScale || 0.9),
            legWidth: skinObj.legWidthScale || (skinObj.widthScale || 0.9)
        };

        const skinTone = skinObj.skinTone || '#8d5524';

        // Body Dimensions
        const bodyW = 20 * s * sizeMod.w;
        const bodyH = 40 * s * sizeMod.h;
        let legLen = 30 * s * sizeMod.h;

        // Crouch compression (shorten legs visually)
        if (state === 'PRE_JUMP') {
            legLen *= 0.7;
        }

        let torsoY = p.y - legLen - bodyH;
        let neckLen = 0;
        if (skinObj.neckLength) neckLen = skinObj.neckLength * s;
        let headY = torsoY - (10 * s * sizeMod.head) - neckLen;
        const headRadius = 12 * s * sizeMod.head;

        // Super Saiyan Aura
        if (currentStreak >= 10) {
             const hue = getStreakFireHue(currentStreak);
             ctx.save();
             ctx.shadowBlur = 30 * s;
             ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
             ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 2.5, bodyH * 2.0, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 15 * s;
             ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.15)`;
             ctx.beginPath();
             ctx.ellipse(p.x, torsoY + bodyH*0.5, bodyW * 1.5, bodyH * 1.5, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        }

        // 0. Calculate Arm Configuration
        const r_la = g_animState.la;
        const r_ra = g_animState.ra;
        const r_lfa = g_animState.lfa;
        const r_rfa = g_animState.rfa;
        const r_w = g_animState.w;
        const r_la_z = g_animState.la_z || 0;
        const r_ra_z = g_animState.ra_z || 0;
        const r_lfa_z = g_animState.lfa_z || 0;
        const r_rfa_z = g_animState.rfa_z || 0;

        let leftArmAngle, rightArmAngle, leftForeArmAngle, rightForeArmAngle, wristAngle;
        let leftArmZ, rightArmZ, leftForeArmZ, rightForeArmZ;

        if (playerData.isLefty) {
            leftArmAngle = Math.PI - r_ra; rightArmAngle = Math.PI - r_la;
            leftForeArmAngle = Math.PI - r_rfa; rightForeArmAngle = Math.PI - r_lfa;
            wristAngle = -r_w;
            leftArmZ = r_ra_z; rightArmZ = r_la_z;
            leftForeArmZ = r_rfa_z; rightForeArmZ = r_lfa_z;
        } else {
            leftArmAngle = r_la; rightArmAngle = r_ra;
            leftForeArmAngle = r_lfa; rightForeArmAngle = r_rfa;
            wristAngle = r_w;
            leftArmZ = r_la_z; rightArmZ = r_ra_z;
            leftForeArmZ = r_lfa_z; rightForeArmZ = r_rfa_z;
        }

        // Draw Neck
        if (neckLen > 5*s) {
            ctx.fillStyle = skinTone;
            const neckW = 12 * s * sizeMod.w * 0.7;
            ctx.fillRect(p.x - neckW/2, torsoY + 10*s, neckW, -neckLen - 5*s);
        }
        let shoulderY = torsoY + (2*s);
        let armY = torsoY + (5*s);
        let leftShoulderX = p.x - 16*s; let rightShoulderX = p.x + 16*s;
        const upperArmLen = 20 * s * sizeMod.h * 1.05;
        const foreArmLen = 20 * s * sizeMod.h * 1.05;

        // PROCEDURAL GUIDE HAND LOGIC
        if (isTwoHandedStyle(playerData.currentStyle) && (state === 'JUMPING' || state === 'PRE_JUMP')) {
            const isRightHand = !playerData.isLefty;
            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootUZ = isRightHand ? rightArmZ : leftArmZ;
            const shootFZ = isRightHand ? rightForeArmZ : leftForeArmZ;

            const effUpper = upperArmLen * Math.max(0.1, Math.cos(shootUZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(shootFZ));

            const elbow = getJoint(shootSX, armY, effUpper, shootUAngle);
            const wrist = getJoint(elbow.x, elbow.y, effFore, shootFAngle);
            const ballPos = calculateBallPosition(wrist.x, wrist.y, s, shootFAngle, wristAngle);

            const guideTargetX = ballPos.x + (isRightHand ? -8*s : 8*s);
            const guideTargetY = ballPos.y;
            const guideSX = isRightHand ? leftShoulderX : rightShoulderX;

            const animGuideU = (g_animState.guide_u !== undefined) ? g_animState.guide_u : -1.7;
            const animGuideUZ = (g_animState.guide_u_z !== undefined) ? g_animState.guide_u_z : 1.3;
            const finalGuideU = isRightHand ? animGuideU : (-Math.PI - animGuideU);

            const guideEffUpper = upperArmLen * Math.max(0.1, Math.cos(animGuideUZ));
            const guideElbow = getJoint(guideSX, armY, guideEffUpper, finalGuideU);

            const dx = guideTargetX - guideElbow.x;
            const dy = guideTargetY - guideElbow.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const fixedGuideFAngle = Math.atan2(dy, dx);
            const ratio = Math.min(0.99, dist / foreArmLen);
            const fixedGuideFZ = Math.acos(ratio);

            if (isRightHand) {
                leftArmAngle = finalGuideU; leftForeArmAngle = fixedGuideFAngle;
                leftArmZ = animGuideUZ; leftForeArmZ = fixedGuideFZ;
            } else {
                rightArmAngle = finalGuideU; rightForeArmAngle = fixedGuideFAngle;
                rightArmZ = animGuideUZ; rightForeArmZ = fixedGuideFZ;
            }
        }

        drawDetachedBall(p, s, torsoY, bodyH, headY);

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
                 leftShoulderX = p.x - 16*s; rightShoulderX = p.x + 16*s;
             }
        }

        const isDetachedStyle = ['airbud', 'telekinesis'].includes(playerData.currentStyle);
        if (!isDetachedStyle && state !== 'SHOOTING' && state !== 'GAMEOVER') {
            const isRightHand = !playerData.isLefty;
            const shootUAngle = isRightHand ? rightArmAngle : leftArmAngle;
            const shootFAngle = isRightHand ? rightForeArmAngle : leftForeArmAngle;
            const shootSX = isRightHand ? rightShoulderX : leftShoulderX;

            let elbow = getJoint(shootSX, armY, upperArmLen, shootUAngle);
            let wrist = getJoint(elbow.x, elbow.y, foreArmLen, shootFAngle);

            let theta = shootFAngle + wristAngle;
            let ballX = wrist.x + Math.cos(theta) * 0 - Math.sin(theta) * 5 * s;
            let ballY = wrist.y + Math.sin(theta) * 0 + Math.cos(theta) * 5 * s;

            var phys = getTempBallPhys(ballX, ballY, p);
            drawBallSprite(ballX, ballY, s, (currentStreak >= 5), 0, phys);
        }

        // Colors
        const jerseyColor = skinObj.jerseyColor || '#FFF';
        const shortsColor = skinObj.shortsColor || '#FFF';
        const sleeveRight = skinObj.sleeveRight || skinObj.sleeveColor;
        const sleeveLeft = skinObj.sleeveLeft || skinObj.sleeveColor;
        const socksColor = skinObj.socksColor;
        const shoesColor = skinObj.shoesColor;

        // Legs
        const baseKneeY = p.y - (legLen * 0.5);
        const stanceModLegs = sizeMod.stance || 1.0;
        const hipOffset = 7 * s;
        const footOffset = 10 * s * stanceModLegs;
        const kneeOffset = (hipOffset + footOffset) / 2;

        let lKneeX = p.x - kneeOffset, lKneeY = baseKneeY;
        let rKneeX = p.x + kneeOffset, rKneeY = baseKneeY;
        let lFootX = p.x - footOffset, lFootY = p.y;
        let rFootX = p.x + footOffset, rFootY = p.y;

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

        const drawHumanArm = (sx, sy, isRight, angle1, angle2, angle1_z, angle2_z) => {
            const isShootingSide = (playerData.isLefty && !isRight) || (!playerData.isLefty && isRight);
            let uColor = skinTone, fColor = skinTone;
            let activeSleeveColor = null;

            if (skinObj.jerseyType === 'tshirt' || skinObj.jerseyType === 'link_tunic') uColor = jerseyColor;

            if (isRight && sleeveRight) activeSleeveColor = sleeveRight;
            if (!isRight && sleeveLeft) activeSleeveColor = sleeveLeft;

            if (activeSleeveColor) {
                fColor = activeSleeveColor;
            }

            let uZ = angle1_z || 0;
            let fZ = angle2_z || 0;
            if (p.type === 'player_shadow') { uZ = 0; fZ = 0; }

            const effUpper = upperArmLen * Math.max(0.1, Math.cos(uZ));
            const effFore = foreArmLen * Math.max(0.1, Math.cos(fZ));

            drawJoint(sx, sy, 4*s*sizeMod.armWidth, uColor, isMechanical);

            let elbow = getJoint(sx, sy, effUpper, angle1);
            const upperTattoos = skinObj.tattoos && !activeSleeveColor;
            drawMuscleLimb(sx, sy, elbow.x, elbow.y, 8*s*sizeMod.armWidth, uColor, 'thigh', s, upperTattoos);

            if (activeSleeveColor) {
                 const midX = (sx + elbow.x) / 2;
                 const midY = (sy + elbow.y) / 2;
                 drawMuscleLimb(midX, midY, elbow.x, elbow.y, 8.2*s*sizeMod.armWidth, activeSleeveColor, 'thigh', s, false);
            }

            let wrist = getJoint(elbow.x, elbow.y, effFore, angle2);
            const foreTattoos = skinObj.tattoos && !activeSleeveColor;
            drawMuscleLimb(elbow.x, elbow.y, wrist.x, wrist.y, 6*s*sizeMod.armWidth, fColor, 'thigh', s, foreTattoos);

            drawJoint(elbow.x, elbow.y, 3*s*sizeMod.armWidth, activeSleeveColor || uColor, isMechanical);

            ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.rotate(angle2 + (isShootingSide ? wristAngle : 0));

            ctx.fillStyle = skinTone;
            ctx.beginPath();
            ctx.moveTo(-2*s, 0); ctx.lineTo(2*s, 0); ctx.lineTo(2.5*s, 6*s); ctx.lineTo(-2.5*s, 6*s);
            ctx.fill();

            if (isShootingSide && state !== 'SHOOTING' && state !== 'GAMEOVER' && !isDetachedStyle) {
                ctx.fillStyle = skinTone;
                ctx.beginPath(); ctx.arc(-2*s, 6*s, 1.5*s, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(2*s, 6*s, 1.5*s, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        };

        drawHumanArm(leftShoulderX, armY, false, leftArmAngle, leftForeArmAngle, leftArmZ, leftForeArmZ);
        drawHumanArm(rightShoulderX, armY, true, rightArmAngle, rightForeArmAngle, rightArmZ, rightForeArmZ);

        drawJoint(p.x - 7*s, p.y - legLen, 4*s*sizeMod.legWidth, skinTone, isMechanical);
        drawJoint(p.x + 7*s, p.y - legLen, 4*s*sizeMod.legWidth, skinTone, isMechanical);

        drawMuscleLimb(p.x - 7*s, p.y - legLen, lKneeX, lKneeY, 8*s*sizeMod.legWidth, skinTone, 'thigh', s, skinObj.tattoos);
        drawMuscleLimb(p.x + 7*s, p.y - legLen, rKneeX, rKneeY, 8*s*sizeMod.legWidth, skinTone, 'thigh', s, skinObj.tattoos);

        // Neck (Layer 1.5)
        const neckW = 10 * s * sizeMod.w;
        const neckH = 10 * s;
        ctx.fillStyle = skinTone;
        ctx.beginPath();
        ctx.moveTo(p.x - neckW, torsoY + 8*s);
        ctx.quadraticCurveTo(p.x - neckW*0.6, torsoY - neckH*0.8, p.x - neckW*0.4, torsoY - neckH);
        ctx.lineTo(p.x + neckW*0.4, torsoY - neckH);
        ctx.quadraticCurveTo(p.x + neckW*0.6, torsoY - neckH*0.8, p.x + neckW, torsoY + 8*s);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath(); ctx.rect(p.x - 1*s, torsoY - neckH + 2*s, 2*s, neckH); ctx.fill();

        // Torso & Shorts
        const jerseyH = bodyH * 0.85;
        const reducedBodyW = bodyW * 0.9;
        const waistY = torsoY + bodyH * 0.85;
        let shortsLen = (0.5 * legLen) + (0.15 * bodyH) + 2*s;
        if (skinObj.shortsLength === 'short') { shortsLen = (0.25 * legLen) + (0.1 * bodyH); }

        drawShorts(p.x, waistY, reducedBodyW * 1.05, shortsLen, s, skinObj);

        const anchors = {
            shoulders: { left: {x: leftShoulderX, y: shoulderY}, right: {x: rightShoulderX, y: shoulderY} },
            hips: { left: {x: p.x - 7*s, y: p.y - legLen}, right: {x: p.x + 7*s, y: p.y - legLen} }
        };

        if (skinObj.jerseyType === 'none') {
             drawAnatomicBody(p.x, torsoY, reducedBodyW, jerseyH, s, skinTone, false, 0, { chestStripeColor: null, pattern: skinObj.pattern }, anchors);
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.beginPath(); ctx.moveTo(p.x, torsoY + 10*s); ctx.lineTo(p.x, torsoY + jerseyH*0.8); ctx.lineTo(p.x + 2*s, torsoY + jerseyH*0.8); ctx.lineTo(p.x + 2*s, torsoY + 10*s); ctx.fill();
        } else if (skinObj.jerseyType === 'link_tunic') {
             drawLinkTunic(p.x, torsoY, reducedBodyW, jerseyH, s, skinObj, anchors);
        } else {
             drawJersey(p.x, torsoY, reducedBodyW, jerseyH, s, skinObj, anchors);
        }

        if (skinObj.jerseyName) {
             const nameText = skinObj.jerseyName.toUpperCase();
             ctx.fillStyle = skinObj.numberColor || "#FFF";
             const maxW = reducedBodyW * 0.9;
             let fontSize = 7 * s;
             ctx.font = `bold ${fontSize}px Arial`;
             let textW = ctx.measureText(nameText).width;

             ctx.textAlign = "center";
             if (textW > maxW) {
                 const scaleFactor = maxW / textW;
                 ctx.save();
                 ctx.translate(p.x, torsoY + bodyH * 0.25);
                 ctx.scale(scaleFactor, 1);
                 ctx.fillText(nameText, 0, 0);
                 ctx.restore();
             } else {
                 ctx.fillText(nameText, p.x, torsoY + bodyH * 0.25);
             }
        }

        if (skinObj.number) {
            ctx.fillStyle = skinObj.numberColor || "#FFF";
            ctx.font = `bold ${12 * s}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(skinObj.number, p.x, torsoY + bodyH * 0.6);
        }

        if (skinObj.clothingDetail === 'overalls') {
             const bibColor = skinObj.shortsColor || '#000080';
             ctx.fillStyle = bibColor;
             ctx.fillRect(p.x - reducedBodyW*0.35, torsoY + 15*s, reducedBodyW*0.7, jerseyH - 15*s);
             ctx.fillRect(p.x - reducedBodyW*0.35, torsoY, 4*s, 20*s);
             ctx.fillRect(p.x + reducedBodyW*0.35 - 4*s, torsoY, 4*s, 20*s);
             ctx.fillStyle = '#FFD700';
             ctx.beginPath(); ctx.arc(p.x - reducedBodyW*0.35 + 2*s, torsoY + 18*s, 2*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x + reducedBodyW*0.35 - 2*s, torsoY + 18*s, 2*s, 0, Math.PI*2); ctx.fill();
        }

        const drawLowerLeg = (xTop, yTop, xBot, yBot, isRight) => {
             let calfCol = skinTone;
             if (skinObj.legType === 'pants') calfCol = shortsColor;
             drawMuscleLimb(xTop, yTop, xBot, yBot, 7*s*sizeMod.legWidth, calfCol, 'calf', s);
             if(socksColor) {
                 const sockH = 7 * s;
                 const sockY = yBot - 5*s - sockH;
                 const t = (sockY - yTop) / (yBot - yTop);
                 const sockTopX = xTop + (xBot - xTop) * t;
                 const ankleY = yBot - 5*s;
                 const t2 = (ankleY - yTop) / (yBot - yTop);
                 const ankleX = xTop + (xBot - xTop) * t2;
                 drawMuscleLimb(sockTopX, sockY, ankleX, ankleY, 6.5*s*sizeMod.legWidth, socksColor, 'standard', s);
                 ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
                 for(let i=0; i<3; i++) {
                     const ly = sockY + (i*2*s);
                     ctx.beginPath(); ctx.moveTo(sockTopX - 3*s, ly); ctx.lineTo(sockTopX + 3*s, ly); ctx.stroke();
                 }
             }
             if(shoesColor) {
                 drawRealisticShoe(xBot, yBot, 5.5*s, 5.5*s, shoesColor, isRight);
             }
        };
        drawLowerLeg(lKneeX, lKneeY, lFootX, lFootY, false);
        drawLowerLeg(rKneeX, rKneeY, rFootX, rFootY, true);

        // Tail
        if (skinObj.tailType) {
            const tx = p.x;
            const ty = waistY + 5*s;
            const tailColor = skinObj.furColor || skinTone;
            const tW = 4*s;

            if (skinObj.tailType === 'bull') {
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = tW;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 20*s, ty + 20*s); ctx.stroke();
                 drawFuzzyPath([{x: tx+20*s, y: ty+20*s}, {x: tx+28*s, y: ty+32*s}, {x: tx+12*s, y: ty+32*s}], '#3E2723', s, true, 901);
            }
            else if (skinObj.tailType === 'snake') {
                 ctx.beginPath(); ctx.strokeStyle = '#2E8B57'; ctx.lineWidth = 6*s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx - 15*s, ty + 10*s, tx - 25*s, ty + 5*s); ctx.stroke();
            }
            else if (skinObj.tailType === 'devil') {
                ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4 * s;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 25*s, ty - 20*s); ctx.stroke();
                ctx.fillStyle = '#8B0000'; ctx.beginPath();
                const ttx = tx + 25*s, tty = ty - 20*s;
                ctx.moveTo(ttx, tty); ctx.lineTo(ttx - 5*s, tty + 10*s); ctx.lineTo(ttx + 5*s, tty + 10*s); ctx.fill();
            }
        }

        // HEAD AND HAIR
        if (skinObj.headType && skinObj.headType !== 'human') {
            drawHybridHead(p, headY, headRadius, s, skinObj.headType, skinObj);
        } else {
            // Standard Human Head - Back View
            ctx.fillStyle = skinTone;
            // Ears
            ctx.beginPath(); ctx.ellipse(p.x - headRadius*0.95, headY, 3.5*s, 6*s, -0.1, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + headRadius*0.95, headY, 3.5*s, 6*s, 0.1, 0, Math.PI*2); ctx.fill();

            if(skinObj.ears === 'elf') {
                 ctx.beginPath(); ctx.moveTo(p.x - headRadius*0.9, headY-5*s); ctx.lineTo(p.x - headRadius*1.6, headY-10*s); ctx.lineTo(p.x - headRadius*0.9, headY+2*s); ctx.fill();
                 ctx.beginPath(); ctx.moveTo(p.x + headRadius*0.9, headY-5*s); ctx.lineTo(p.x + headRadius*1.6, headY-10*s); ctx.lineTo(p.x + headRadius*0.9, headY+2*s); ctx.fill();
            }

            // Skull
            ctx.beginPath();
            ctx.ellipse(p.x, headY - 1*s, headRadius * 0.95, headRadius * 1.05, 0, 0, Math.PI*2);

            if (playerData.graphics === 'HIGH') {
                 const r = headRadius;
                 ctx.fillStyle = skinTone;
                 ctx.fill();
                 const shade = ctx.createRadialGradient(p.x - r*0.3, headY - r*0.3, r*0.1, p.x, headY, r*1.1);
                 shade.addColorStop(0, 'rgba(255,255,255,0.1)');
                 shade.addColorStop(0.5, 'rgba(0,0,0,0)');
                 shade.addColorStop(1, 'rgba(0,0,0,0.4)');
                 ctx.fillStyle = shade;
                 ctx.fill();
                 const neckShadow = ctx.createRadialGradient(p.x, headY + r*0.9, 0, p.x, headY + r*0.9, r*0.7);
                 neckShadow.addColorStop(0, 'rgba(0,0,0,0.3)');
                 neckShadow.addColorStop(1, 'rgba(0,0,0,0)');
                 ctx.fillStyle = neckShadow;
                 ctx.beginPath(); ctx.ellipse(p.x, headY + r*0.7, r*0.5, r*0.3, 0, 0, Math.PI*2); ctx.fill();
            } else {
                 ctx.fill();
                 ctx.fillStyle = 'rgba(0,0,0,0.15)';
                 ctx.beginPath(); ctx.arc(p.x, headY + headRadius*0.6, 5*s, 0, Math.PI*2); ctx.fill();
            }

            // NEW HAIR LOGIC CALL
            drawHairstyle(ctx, p, headY, headRadius, s, skinObj);
        }

        // Accessories
        if (skinObj.headAccessory === 'sombrero') {
            ctx.fillStyle = skinObj.hatColor || '#1a1a1a';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, 30*s, 8*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 10*s, Math.PI, 0); ctx.fill();
        }
        else if (skinObj.headAccessory === 'crown') {
            ctx.fillStyle = '#FFD700'; ctx.strokeStyle='#DAA520'; ctx.lineWidth=2*s;
            ctx.beginPath(); ctx.moveTo(p.x - 12*s, headY - 5*s); ctx.lineTo(p.x + 12*s, headY - 5*s); ctx.lineTo(p.x + 15*s, headY - 15*s); ctx.lineTo(p.x + 5*s, headY - 10*s); ctx.lineTo(p.x, headY - 20*s); ctx.lineTo(p.x - 5*s, headY - 10*s); ctx.lineTo(p.x - 15*s, headY - 15*s); ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'halo') {
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3*s;
            ctx.beginPath(); ctx.ellipse(p.x, headY - 25*s, 12*s, 4*s, 0, 0, Math.PI*2); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'horns') {
            ctx.fillStyle = '#8B0000';
            ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x - 15*s, headY - 15*s, p.x - 5*s, headY - 20*s); ctx.lineTo(p.x - 8*s, headY - 5*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x + 10*s, headY - 5*s); ctx.quadraticCurveTo(p.x + 15*s, headY - 15*s, p.x + 5*s, headY - 20*s); ctx.lineTo(p.x + 8*s, headY - 5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'wizard_hat') {
            ctx.fillStyle = skinObj.hatColor || '#000080';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 10*s, 20*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY - 10*s); ctx.lineTo(p.x + 10*s, headY - 10*s); ctx.lineTo(p.x + 5*s, headY - 25*s); ctx.lineTo(p.x - 20*s, headY - 35*s); ctx.fill(); // Crooked tip
        }
        else if (skinObj.headAccessory === 'chef_hat') {
            ctx.fillStyle = '#FFF'; ctx.strokeStyle='#EEE'; ctx.lineWidth=1*s;
            ctx.fillRect(p.x-10*s, headY-15*s, 20*s, 10*s);
            ctx.beginPath(); ctx.arc(p.x, headY-20*s, 12*s, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'helmet') {
            const hColor = skinObj.hatColor || '#AAA';
            ctx.fillStyle = hColor;
            ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(p.x - 12*s, headY, 24*s, 5*s); // Visor area
        }
        else if (skinObj.headAccessory === 'top_hat') {
            ctx.fillStyle = '#111';
            ctx.fillRect(p.x - 15*s, headY - 10*s, 30*s, 4*s); // Brim
            ctx.fillRect(p.x - 10*s, headY - 25*s, 20*s, 15*s); // Cylinder
        }
        else if (skinObj.headAccessory === 'flower') {
            ctx.fillStyle = '#FF69B4';
            for(let i=0; i<5; i++) {
                const angle = (i/5)*Math.PI*2;
                ctx.beginPath(); ctx.arc(p.x + Math.cos(angle)*8*s + 10*s, headY - 10*s + Math.sin(angle)*8*s, 4*s, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(p.x + 10*s, headY - 10*s, 4*s, 0, Math.PI*2); ctx.fill();
        }
        else if (skinObj.headAccessory === 'bow') {
            ctx.fillStyle = skinObj.hatColor || '#FF0000';
            ctx.beginPath(); ctx.moveTo(p.x, headY - 15*s); ctx.lineTo(p.x - 10*s, headY - 20*s); ctx.lineTo(p.x - 10*s, headY - 10*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x, headY - 15*s); ctx.lineTo(p.x + 10*s, headY - 20*s); ctx.lineTo(p.x + 10*s, headY - 10*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'beanie') {
            ctx.fillStyle = skinObj.hatColor || '#FF0000';
            ctx.beginPath(); ctx.arc(p.x, headY - 5*s, headRadius * 1.1, Math.PI, 0); ctx.lineTo(p.x + headRadius*1.1, headY); ctx.lineTo(p.x - headRadius*1.1, headY); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 3*s, 0, Math.PI*2); ctx.fill(); // Pom
        }
        else if (skinObj.headAccessory === 'ear_muffs') {
            ctx.fillStyle = skinObj.hatColor || '#FFF';
            ctx.beginPath(); ctx.arc(p.x - 12*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 12*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2*s;
            ctx.beginPath(); ctx.arc(p.x, headY - 5*s, 12*s, Math.PI, 0); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'headband' && skinObj.hairStyle !== 'headband') {
             // Standalone headband (e.g. Ninja)
             const bandColor = skinObj.hatColor || '#FF0000';
             ctx.fillStyle = bandColor;
             ctx.fillRect(p.x - headRadius, headY - 8*s, headRadius * 2, 6*s);
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY - 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY - 5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'bandana_neck') {
             ctx.fillStyle = skinObj.hatColor || '#FF0000';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY + 5*s); ctx.lineTo(p.x, headY + 15*s); ctx.lineTo(p.x + 10*s, headY + 5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'scarf') {
             ctx.fillStyle = skinObj.hatColor || '#8B0000';
             ctx.lineWidth = 6*s; ctx.strokeStyle = skinObj.hatColor || '#8B0000';
             ctx.beginPath(); ctx.arc(p.x, headY + 5*s, 10*s, 0, Math.PI*2); ctx.stroke();
             ctx.fillRect(p.x + 5*s, headY + 5*s, 6*s, 15*s); // Hanging part
        }
        else if (skinObj.headAccessory === 'gold_bands') {
             ctx.fillStyle = '#FFD700';
             ctx.fillRect(p.x - 15*s, headY - 15*s, 30*s, 5*s);
             ctx.fillRect(p.x - 15*s, headY + 5*s, 30*s, 5*s);
        }

        if(skinObj.headDetail === 'mohawk' && skinObj.hairStyle !== 'mohawk') {
             // Animal mohawk (already handled by drawHairstyle for humans)
             ctx.fillStyle = skinObj.hairColor || '#000';
             for(let i=0; i<5; i++) {
                 ctx.beginPath(); ctx.arc(p.x, headY - 10*s - (i*4*s), (5-i)*s + 2*s, 0, Math.PI*2); ctx.fill();
             }
        }
        if(skinObj.headDetail === 'visor') {
             ctx.fillStyle = '#FF0000'; ctx.shadowBlur = 5; ctx.shadowColor = '#FF0000';
             ctx.fillRect(p.x - 8*s, headY - 5*s, 16*s, 4*s);
             ctx.shadowBlur = 0;
        }

        // Back Props
        if (skinObj.backAccessory === 'cape') {
            ctx.fillStyle = skinObj.backColor || '#000';
            ctx.fillRect(p.x - bodyW/1.5, torsoY + 5*s, bodyW*1.3, bodyH*0.8);
        }
        if (skinObj.backAccessory === 'wings') {
            ctx.fillStyle = skinObj.backColor || '#FFF';
            ctx.beginPath(); ctx.ellipse(p.x - 20*s, torsoY + 10*s, 10*s, 20*s, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + 20*s, torsoY + 10*s, 10*s, 20*s, 0.5, 0, Math.PI*2); ctx.fill();
        }
        if (skinObj.backAccessory === 'backpack') {
             ctx.fillStyle = skinObj.backColor || '#555';
             ctx.fillRect(p.x - bodyW/2, torsoY + 10*s, bodyW, bodyH*0.6);
        }
        drawMeterCommon(p, s, sizeMod);
    }


    let g_cachedSkinId = null;
    let g_cachedSkinObj = null;

    function drawMeterCommon(p, s, sizeMod) {
        if (state === 'JUMPING' || state === 'PRE_JUMP') {
            const style = getCurrentStyle();
            let baseMaxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            if (baseMaxVz <= 0.5) baseMaxVz = 9;

            const boost = 0.5 * 0.10 * 60;
            const adjustedMaxVz = baseMaxVz + boost;

            const curVz = getCurrentVz();
            const targetVz = getReleaseTargetVz(baseMaxVz);
            const dist = adjustedMaxVz - targetVz;

            let progress = 1.0 - (Math.abs(curVz - targetVz) / dist);
            progress = Math.max(0, Math.min(1, progress));

            const groundY = p.y + (player3D.z * s);
            const meterY = groundY - (130 * s * sizeMod.h);
            const cx = p.x + (60 * s); const radius = 50 * s;

            const thresh = calculateShotThreshold();
            const greenWidth = thresh / dist;

            let gStart = 1.0 - greenWidth;
            let gEnd = 1.0;
            gStart = Math.max(0, gStart);

            if (playerData.meterEnabled) {
                drawShotMeter(cx, meterY, radius * (playerData.meterScale || 1.0), s, progress, gStart, playerData.meterShape || 'arc', gEnd);
            }
        }
    }

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

        if (skin === 'bear_panda' || skinObj.hasBlackEars) hasBlackEars = true;

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
        bodyOptions.skinId = skin;
        bodyOptions.hasSpots = hasSpots;
        bodyOptions.spotColor = skinObj.spotColor;
        bodyOptions.isTabby = skin.includes('tabby');

        const anchors = {
            shoulders: { left: {x: leftShoulderX, y: shoulderY}, right: {x: rightShoulderX, y: shoulderY} },
            hips: { left: {x: p.x - hipX, y: hipY}, right: {x: p.x + hipX, y: hipY} }
        };
        drawAnatomicBody(p.x, torsoY, bodyW, bodyH, s, torsoColor, bodyFurry, 40, bodyOptions, anchors);

        if(currentAnimal === 'penguin' && torsoColor === furColor) {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, torsoY + bodyH * 0.55, bodyW * 0.7, bodyH * 0.4, 0, 0, Math.PI*2); ctx.fill();
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
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
             // Random stitches
             ctx.beginPath(); ctx.moveTo(p.x-5*s, torsoY+10*s); ctx.lineTo(p.x-5*s, torsoY+15*s); ctx.moveTo(p.x-8*s, torsoY+12*s); ctx.lineTo(p.x-2*s, torsoY+12*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x+5*s, torsoY+25*s); ctx.lineTo(p.x+5*s, torsoY+30*s); ctx.moveTo(p.x+2*s, torsoY+27*s); ctx.lineTo(p.x+8*s, torsoY+27*s); ctx.stroke();
             // Head stitch
             ctx.beginPath(); ctx.moveTo(p.x, headY-headRadius); ctx.lineTo(p.x, headY-headRadius+5*s); ctx.moveTo(p.x-3*s, headY-headRadius+2*s); ctx.lineTo(p.x+3*s, headY-headRadius+2*s); ctx.stroke();
        }

        // 7. Draw Tail (Layer 3)
        // Skip for bears, humans, robots, astronauts, frogs (unless specific tail logic exists)
        const hasTail = (!['bear', 'human', 'frog'].includes(currentAnimal) || skinObj.tailType) && !skin.includes('astronaut') && !skin.includes('robot');

        if (hasTail) {
            const tx = p.x;
            const ty = (torsoY + bodyH) - 5*s;

            if (skinObj.tailType === 'devil') {
                ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 4 * s;
                ctx.beginPath(); ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 25*s, ty - 20*s); ctx.stroke();
                // Triangle Tip
                ctx.fillStyle = '#8B0000'; ctx.beginPath();
                const ttx = tx + 25*s, tty = ty - 20*s;
                ctx.moveTo(ttx, tty); ctx.lineTo(ttx - 5*s, tty + 10*s); ctx.lineTo(ttx + 5*s, tty + 10*s); ctx.fill();
            }
            else if (skinObj.tailType === 'bull') {
                 // Minotaur tail
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4 * s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 25*s, ty + 5*s); ctx.stroke();
                 drawFuzzyPath([{x: tx+25*s, y: ty+5*s}, {x: tx+35*s, y: ty+8*s}, {x: tx+35*s, y: ty+2*s}], '#000', s, true, 101);
            }
            else if (currentAnimal === 'rat') {
                // Rat: Long, thin, smooth, flesh colored
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3*s;
                ctx.moveTo(tx, ty);
                // S-curve down
                ctx.bezierCurveTo(tx + 20*s, ty + 10*s, tx + 10*s, ty + 30*s, tx + 25*s, ty + 40*s);
                ctx.stroke();
            }
            else if (currentAnimal === 'monkey') {
                // Monkey: Long, curled up
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4*s;
                ctx.moveTo(tx, ty);
                ctx.bezierCurveTo(tx + 20*s, ty - 10*s, tx + 25*s, ty - 30*s, tx + 10*s, ty - 40*s);
                ctx.stroke();
            }
            else if (currentAnimal === 'dino') {
                // T-Rex: Thick, tapered
                ctx.fillStyle = tailColor;
                ctx.beginPath();
                ctx.moveTo(tx - 5*s, ty);
                ctx.lineTo(tx + 5*s, ty);
                // Curve down to a point
                ctx.quadraticCurveTo(tx + 30*s, ty + 10*s, tx + 45*s, ty + 5*s); // Tip
                ctx.quadraticCurveTo(tx + 20*s, ty + 20*s, tx - 5*s, ty + 5*s);
                ctx.fill();
            }
            else if (currentAnimal === 'turtle') {
                // Turtle: Short pointed
                ctx.fillStyle = tailColor;
                ctx.beginPath(); ctx.moveTo(tx - 3*s, ty); ctx.lineTo(tx + 3*s, ty); ctx.lineTo(tx, ty + 10*s); ctx.fill();
            }
            else if (currentAnimal === 'chicken') {
                // Chicken: Feathers
                ctx.fillStyle = tailColor;
                for(let i=-1; i<=1; i++) {
                    ctx.beginPath(); ctx.ellipse(tx + (i*5*s), ty - 5*s, 4*s, 10*s, i*0.5, 0, Math.PI*2); ctx.fill();
                }
            }
            else if (currentAnimal === 'fox' || currentAnimal === 'wolf' || skinObj.tailType === 'multi') {
                // Bushy Tail
                const tailPoints = [
                    {x: tx, y: ty},
                    {x: tx + 15*s, y: ty + 5*s},
                    {x: tx + 30*s, y: ty - 10*s}, // Tip
                    {x: tx + 15*s, y: ty - 15*s}
                ];
                let tColor = tailColor;
                if(skinObj.tailType === 'multi') { // Kitsune
                    for(let k=0; k<3; k++) {
                        const off = (k-1)*10*s;
                        drawFuzzyPath([{x:tx,y:ty},{x:tx+15*s+off,y:ty+5*s},{x:tx+30*s+off,y:ty-10*s},{x:tx+15*s+off,y:ty-15*s}], '#FFD700', s, true, 100+k);
                    }
                } else {
                    drawFuzzyPath(tailPoints, tColor, s, true, 99);
                    // White tip for classic fox
                    if(currentAnimal === 'fox' && skin === 'fox_classic') {
                        const tipPoints = [{x: tx + 20*s, y: ty - 5*s}, {x: tx + 30*s, y: ty - 10*s}, {x: tx + 20*s, y: ty - 12*s}];
                        drawFuzzyPath(tipPoints, '#FFF', s, true, 100);
                    }
                }
            }
            else if (currentAnimal === 'rabbit') {
                // Round Fluffy Tail
                drawFuzzyCircle(p.x, ty - 2*s, 6*s, tailColor, 102, s, true);
            }
            else if (currentAnimal === 'pig') {
                // Curly Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3 * s;
                ctx.moveTo(tx, ty);
                ctx.bezierCurveTo(tx + 10*s, ty - 5*s, tx + 10*s, ty + 10*s, tx + 20*s, ty);
                ctx.stroke();
            }
            else if (['lion', 'cow', 'zebra', 'giraffe'].includes(currentAnimal)) {
                // Tufted Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 3 * s;
                ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 10*s, tx + 25*s, ty + 5*s); ctx.stroke();
                // Tuft
                let tuftColor = '#000';
                if (currentAnimal === 'lion') tuftColor = '#8B4513';
                if (currentAnimal === 'cow' && skinObj.furColor === '#8B0000') tuftColor = '#8B0000'; // Highland
                if (skin === 'lion_white') tuftColor = '#EEE';

                drawFuzzyPath([{x: tx+25*s, y: ty+5*s}, {x: tx+35*s, y: ty+8*s}, {x: tx+35*s, y: ty+2*s}], tuftColor, s, true, 101);
            }
            else if (currentAnimal === 'elephant') {
                 // Thin tail with small tuft
                 ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 2*s;
                 ctx.moveTo(tx, ty);
                 ctx.quadraticCurveTo(tx + 5*s, ty + 15*s, tx + 8*s, ty + 25*s); ctx.stroke();
                 drawFuzzyCircle(tx + 8*s, ty + 25*s, 3*s, tailColor, 101, s, true);
            }
            else if (currentAnimal === 'penguin') {
                // Stubby Tail
                ctx.fillStyle = tailColor;
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 10*s, ty + 5*s); ctx.lineTo(tx + 5*s, ty + 10*s); ctx.fill();
            }
            else if (currentAnimal === 'moose') {
                // Short Stubby Tail (Deer/Moose like)
                ctx.fillStyle = tailColor;
                ctx.beginPath();
                ctx.ellipse(tx, ty, 4*s, 6*s, 0, 0, Math.PI*2);
                ctx.fill();
            }
            else {
                // Standard Thin Tail
                ctx.beginPath(); ctx.strokeStyle = tailColor; ctx.lineWidth = 4 * s;
                ctx.lineCap = 'round'; ctx.moveTo(tx, ty);
                ctx.quadraticCurveTo(tx + 15*s, ty + 5*s, tx + 20*s, ty - 10*s); ctx.stroke();
                if(currentAnimal === 'tiger' || skinObj.pattern === 'tiger_stripes') {
                    // Stripes on tail
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2*s;
                    ctx.beginPath(); ctx.moveTo(tx+5*s, ty); ctx.lineTo(tx+5*s, ty+3*s); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx+10*s, ty); ctx.lineTo(tx+10*s, ty+3*s); ctx.stroke();
                }

            }
        }

        // 8. Draw Head & Ears (Layer 4)
        ctx.fillStyle = (hasBlackEars) ? '#000' : furColor;
        if (skinObj.earColor) ctx.fillStyle = skinObj.earColor;
        if(skin.includes('alien')) ctx.fillStyle = '#32CD32';

        const drawEarPair = (drawFunc) => {
             // Left (Base)
             ctx.save(); ctx.translate(p.x, headY); drawFunc(1); ctx.restore();
             // Right (Mirrored)
             ctx.save(); ctx.translate(p.x, headY); ctx.scale(-1, 1); drawFunc(-1); ctx.restore();
        };

        if (currentAnimal === 'lion') {
            // LION (Unchanged as requested)
            let earY = headY - 8*s; let earX = 12*s; let earR = 6*s;
            drawFuzzyCircle(p.x - earX, earY, earR, ctx.fillStyle, 55, s, isFurry, false);
            drawFuzzyCircle(p.x + earX, earY, earR, ctx.fillStyle, 56, s, isFurry, false);
        }
        else if (currentAnimal === 'rat') {
             drawEarPair(() => {
                 // Large, round, wide-set on top
                 const pts = [{x: -5*s, y: -10*s}, {x: -12*s, y: -20*s}, {x: -18*s, y: -8*s}, {x: -10*s, y: -2*s}];
                 drawFuzzyPath(pts, ctx.fillStyle, s, true, 51);
             });
        }
        else if (currentAnimal === 'cat') {
             let w = 10*s; let h = 12*s; let baseAngle = 0;
             if(skin.includes('sphinx')) { w=16*s; h=20*s; baseAngle = -0.2; }
             if(skin.includes('persian')) { w=8*s; h=7*s; }

             drawEarPair(() => {
                 ctx.save();
                 ctx.rotate(baseAngle);
                 // Triangular with distinct connection
                 ctx.beginPath();
                 ctx.moveTo(-5*s, -8*s); // Inner base
                 ctx.lineTo(-12*s, -8*s - h); // Tip
                 ctx.lineTo(-5*s - w, -4*s); // Outer base
                 ctx.quadraticCurveTo(-10*s, -6*s, -5*s, -8*s); // Curve back to skull
                 ctx.fill();
                 ctx.restore();
             });
        }
        else if (currentAnimal === 'dog') {
             let type = 'floppy';
             if(skin.includes('husky') || skin.includes('police') || skin.includes('wolf') || skin.includes('boxer')) type = 'pricked';
             if(skin.includes('pug')) type = 'button';

             drawEarPair(() => {
                 if(type === 'pricked') {
                     // High triangular (Husky/Wolf)
                     ctx.beginPath();
                     ctx.moveTo(-6*s, -10*s);
                     ctx.lineTo(-12*s, -25*s);
                     ctx.lineTo(-18*s, -8*s);
                     ctx.quadraticCurveTo(-12*s, -12*s, -6*s, -10*s);
                     ctx.fill();
                 } else if (type === 'button') {
                     // Folded forward (Pug)
                     ctx.beginPath();
                     ctx.moveTo(-6*s, -8*s);
                     ctx.quadraticCurveTo(-14*s, -12*s, -12*s, 0);
                     ctx.lineTo(-6*s, -4*s);
                     ctx.fill();
                 } else {
                     // Floppy (Golden/Dalmation) - Drooping from side
                     ctx.beginPath();
                     ctx.moveTo(-10*s, -5*s);
                     ctx.bezierCurveTo(-20*s, -5*s, -25*s, 10*s, -15*s, 20*s);
                     ctx.bezierCurveTo(-10*s, 15*s, -8*s, 5*s, -10*s, -5*s);
                     ctx.fill();
                 }
             });
        }
        else if (currentAnimal === 'bear') {
             drawEarPair(() => {
                 // Small, round, side-top
                 ctx.beginPath();
                 ctx.arc(-14*s, -10*s, 6*s, 0, Math.PI*2);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'rabbit') {
             drawEarPair(() => {
                 // Elongated, correct width-to-height
                 ctx.beginPath();
                 ctx.moveTo(-5*s, -10*s);
                 ctx.bezierCurveTo(-5*s, -50*s, -15*s, -50*s, -12*s, -10*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'fox' || currentAnimal === 'wolf') {
             drawEarPair(() => {
                 // Large Triangular
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -8*s);
                 ctx.lineTo(-15*s, -28*s);
                 ctx.lineTo(-22*s, -6*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'tiger') {
             drawEarPair(() => {
                 // Rounded - Black back with white spot
                 ctx.fillStyle = '#000';
                 ctx.beginPath();
                 ctx.arc(-12*s, -8*s, 7*s, 0, Math.PI*2);
                 ctx.fill();
                 // White Spot (Ocelli)
                 ctx.fillStyle = '#FFF';
                 ctx.beginPath(); ctx.arc(-12*s, -8*s, 2*s, 0, Math.PI*2); ctx.fill();
             });
        }
        else if (currentAnimal === 'monkey') {
             drawEarPair(() => {
                 // Side, human-like round
                 ctx.beginPath();
                 ctx.arc(-16*s, 0, 6*s, 0, Math.PI*2);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'pig') {
             drawEarPair(() => {
                 // Leaf shape, slightly flopped forward
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -8*s);
                 ctx.quadraticCurveTo(-16*s, -20*s, -14*s, -22*s); // Top corner
                 ctx.quadraticCurveTo(-18*s, -10*s, -14*s, 0); // Bottom corner
                 ctx.lineTo(-8*s, -4*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'cow') {
             drawEarPair(() => {
                 // Horizontal, slightly droopy
                 ctx.beginPath();
                 ctx.moveTo(-12*s, -4*s);
                 ctx.quadraticCurveTo(-25*s, -8*s, -28*s, 2*s);
                 ctx.quadraticCurveTo(-20*s, 5*s, -12*s, 2*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'moose') {
             drawEarPair(() => {
                 // Large Paddle-like ears
                 ctx.beginPath();
                 ctx.moveTo(-10*s, -5*s);
                 ctx.bezierCurveTo(-30*s, -15*s, -35*s, 5*s, -25*s, 10*s);
                 ctx.quadraticCurveTo(-15*s, 5*s, -10*s, 0);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'elephant') {
             drawEarPair(() => {
                 // Giant Fan Ears
                 ctx.beginPath();
                 ctx.moveTo(-12*s, -8*s);
                 ctx.bezierCurveTo(-45*s, -25*s, -55*s, 25*s, -20*s, 35*s);
                 ctx.quadraticCurveTo(-15*s, 20*s, -12*s, 10*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'giraffe') {
             drawEarPair(() => {
                 // Ossicones (Horns)
                 ctx.fillStyle = '#8B4513';
                 ctx.beginPath(); ctx.moveTo(-5*s, -15*s); ctx.lineTo(-5*s, -25*s); ctx.lineTo(-3*s, -25*s); ctx.lineTo(-3*s, -15*s); ctx.fill();
                 ctx.beginPath(); ctx.arc(-4*s, -25*s, 2*s, 0, Math.PI*2); ctx.fill();
                 // Ears
                 ctx.fillStyle = furColor;
                 ctx.beginPath();
                 ctx.moveTo(-8*s, -10*s);
                 ctx.quadraticCurveTo(-20*s, -12*s, -22*s, -5*s);
                 ctx.quadraticCurveTo(-15*s, -2*s, -8*s, -5*s);
                 ctx.fill();
             });
        }
        else if (currentAnimal === 'human') {
            // Human Ears (Keep existing logic, simplified)
            ctx.fillStyle = furColor;
            if (skinObj.ears === 'elf') {
                // Pointy Elf Ears
                // Left Ear
                ctx.beginPath();
                ctx.moveTo(p.x - 10*s, headY);
                ctx.lineTo(p.x - 22*s, headY - 8*s); // Tip
                ctx.lineTo(p.x - 10*s, headY + 6*s);
                ctx.fill();
                // Right Ear
                ctx.beginPath();
                ctx.moveTo(p.x + 10*s, headY);
                ctx.lineTo(p.x + 22*s, headY - 8*s); // Tip
                ctx.lineTo(p.x + 10*s, headY + 6*s);
                ctx.fill();
            } else {
                ctx.beginPath(); ctx.ellipse(p.x - 12*s, headY, 3*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(p.x + 12*s, headY, 3*s, 6*s, 0, 0, Math.PI*2); ctx.fill();
            }

            if(skinObj.hairStyle === 'afro') {
                 ctx.fillStyle = skinObj.hairColor || '#000';
                 ctx.beginPath(); ctx.arc(p.x, headY - 2*s, headRadius * 1.5, 0, Math.PI*2); ctx.fill();
            }
        }
        if(currentAnimal === 'moose') {
            ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 4*s;
            ctx.beginPath(); ctx.moveTo(p.x-10*s, headY-10*s); ctx.lineTo(p.x-30*s, headY-25*s); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(p.x+10*s, headY-10*s); ctx.lineTo(p.x+30*s, headY-25*s); ctx.stroke();
        }
        if(currentAnimal === 'cow') {
            ctx.fillStyle = '#EEE';
            ctx.beginPath(); ctx.moveTo(p.x-5*s, headY-10*s); ctx.quadraticCurveTo(p.x-15*s, headY-20*s, p.x-12*s, headY-25*s); ctx.lineTo(p.x-8*s, headY-15*s); ctx.fill();
            ctx.beginPath(); ctx.moveTo(p.x+5*s, headY-10*s); ctx.quadraticCurveTo(p.x+15*s, headY-20*s, p.x+12*s, headY-25*s); ctx.lineTo(p.x+8*s, headY-15*s); ctx.fill();
        }

        // Head Circle
        let headColor = furColor;
        if(skin.includes('alien')) headColor = '#32CD32';
        if(currentAnimal === 'penguin') headColor = '#000';
        if(currentAnimal === 'lion' && skin !== 'lion_scar') {
             if(skin === 'lion_white') headColor = '#EEE';
             else if(skin === 'lion_classic') headColor = '#A0522D';
             else headColor = '#8B4513';
        }

        // SNOUT POINTING UP (Back View)
        // Draw a smaller, slightly offset circle near the top of the head to represent the snout pointing towards the basket.
        // Moved BEFORE the head drawing to ensure it's "behind" (rendered first) or "on top" correctly depending on view logic.
        // Actually, for a back view, if the animal looks UP, the snout is on the far side (front face) peeking over.
        // Drawing it FIRST ensures the main head mass covers the bottom of it, making it look like it's attached to the front/top.
        if (['dog', 'wolf', 'fox', 'bear', 'pig', 'cow', 'moose', 'rat', 'lion', 'tiger'].includes(currentAnimal)) {
            // Position snout higher to "peek" over the top of the head
            const snoutScale = sizeMod.snoutScale || 1.0;
            const snoutY = headY - headRadius * 0.85;
            const snoutR = headRadius * 0.45 * snoutScale;

            // Slightly darker shade for snout to distinguish it
            let snoutColor = headColor;

            // Draw Snout (With shading enabled to match "reimplement 3d shading" request)
            drawFuzzyCircle(p.x, snoutY, snoutR, snoutColor, 65, s, isFurry, true);

            // Nose Tip (Black dot usually)
            if (currentAnimal !== 'moose') { // Moose has big nose nostrils
                const noseY = snoutY - snoutR * 0.5;
                const noseR = snoutR * 0.4;
                const noseColor = (currentAnimal === 'pig') ? '#FF69B4' : '#000'; // Pig nose pinkish? Or darker pink.

                if (isFurry) {
                    drawFuzzyCircle(p.x, noseY, noseR, noseColor, 66, s, true, true);
                } else {
                    ctx.fillStyle = noseColor;
                    // Add simple shading for smooth nose tip
                    const grad = ctx.createRadialGradient(p.x - noseR*0.3, noseY - noseR*0.3, noseR*0.1, p.x, noseY, noseR);
                    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
                    grad.addColorStop(1, noseColor);
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(p.x, noseY, noseR, 0, Math.PI*2); ctx.fill();
                }
            }
        }

        if (currentAnimal === 'cat' || currentAnimal === 'bear' || currentAnimal === 'frog') {
             // Wide Head - Single Mass
             if (!isFurry) {
                 ctx.fillStyle = headColor;
                 ctx.beginPath(); ctx.ellipse(p.x, headY, headRadius * 1.2, headRadius * 0.9, 0, 0, Math.PI*2); ctx.fill();
             }
             // Draw Main Head
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 62, s, isFurry, true);
        }
        else if (currentAnimal === 'cow' || currentAnimal === 'moose' || currentAnimal === 'pig') {
             // Boxy Head - Single Mass
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 60, s, isFurry, true);
        }
        else if (['fox', 'wolf', 'dog'].includes(currentAnimal)) {
             // Tapered Head - Single Mass
             drawFuzzyCircle(p.x, headY, headRadius * 1.0, headColor, 60, s, isFurry, true);
        }
        else if (currentAnimal === 'penguin') {
             // Continuous
             ctx.fillStyle = headColor;
             ctx.beginPath();
             ctx.moveTo(p.x - bodyW/2, torsoY + 5*s);
             ctx.lineTo(p.x + bodyW/2, torsoY + 5*s);
             ctx.lineTo(p.x + headRadius, headY);
             ctx.lineTo(p.x - headRadius, headY);
             ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius, 0, Math.PI*2); ctx.fill();
        }
        else if (currentAnimal === 'elephant') {
             ctx.fillStyle = headColor;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius * 1.2, 0, Math.PI*2); ctx.fill();
        }
        else {
             drawFuzzyCircle(p.x, headY, headRadius, headColor, 60, s, isFurry, true);
        }

        // MANE (Lion) - Moved to be last layer
        if(currentAnimal === 'lion' && skin !== 'lion_scar') {
             ctx.fillStyle = '#8B4513';
             if(skin === 'lion_white') ctx.fillStyle = '#EEE';
             if(skin === 'lion_classic') ctx.fillStyle = '#A0522D';
             drawFuzzyCircle(p.x, headY, headRadius * 1.6, ctx.fillStyle, 61, s, isFurry, false);
        }

        // FACE DETAILS REMOVED - Back View Only

        if(skinObj.pattern === 'tiger_stripes') {
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s;
             ctx.beginPath(); ctx.moveTo(p.x, headY - 10*s); ctx.lineTo(p.x, headY - 5*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x - 5*s, headY - 8*s); ctx.lineTo(p.x - 2*s, headY - 4*s); ctx.stroke();
             ctx.beginPath(); ctx.moveTo(p.x + 5*s, headY - 8*s); ctx.lineTo(p.x + 2*s, headY - 4*s); ctx.stroke();
        }

        // Head Details
        if(skinObj.headDetail === 'antenna') {
             ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 2*s;
             ctx.beginPath(); ctx.moveTo(p.x, headY - headRadius); ctx.lineTo(p.x, headY - headRadius - 15*s); ctx.stroke();
             ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(p.x, headY - headRadius - 15*s, 3*s, 0, Math.PI*2); ctx.fill();
        }
        if(skinObj.headDetail === 'tattoo_stripe') {
             ctx.fillStyle = '#FF0000';
             // Stripe going up the back left side of the head (Kratos)
             ctx.beginPath();
             ctx.moveTo(p.x - 4*s, headY + headRadius * 0.8);
             ctx.quadraticCurveTo(p.x - 12*s, headY, p.x - 4*s, headY - headRadius * 0.9);
             ctx.lineTo(p.x - 8*s, headY - headRadius * 0.9);
             ctx.quadraticCurveTo(p.x - 16*s, headY, p.x - 8*s, headY + headRadius * 0.8);
             ctx.fill();
        }
        if(skinObj.headDetail === 'bandana_ties') {
             ctx.fillStyle = 'red';
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY);
             ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s);
             ctx.lineTo(p.x + headRadius + 12*s, headY + 15*s);
             ctx.lineTo(p.x + headRadius, headY + 5*s);
             ctx.fill();
        }


        // Head Accessories
        if (skinObj.headAccessory === 'sombrero') {
            ctx.fillStyle = skinObj.hatColor || '#1a1a1a';
            ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, 30*s, 8*s, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, headY - 15*s, 10*s, Math.PI, 0); ctx.fill();
        }
        else if (skinObj.headAccessory === 'crown') {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.moveTo(p.x-8*s, headY-10*s); ctx.lineTo(p.x-4*s, headY-18*s); ctx.lineTo(p.x, headY-10*s);
            ctx.lineTo(p.x+4*s, headY-18*s); ctx.lineTo(p.x+8*s, headY-10*s); ctx.lineTo(p.x+8*s, headY-5*s); ctx.lineTo(p.x-8*s, headY-5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'wizard_hat') {
            ctx.fillStyle = skinObj.hatColor || '#000080';
            ctx.beginPath(); ctx.moveTo(p.x-10*s, headY-5*s); ctx.lineTo(p.x+10*s, headY-5*s); ctx.lineTo(p.x, headY-30*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'chef_hat') {
             ctx.fillStyle = '#FFF'; ctx.fillRect(p.x-8*s, headY-25*s, 16*s, 15*s);
        }
        else if (skinObj.headAccessory === 'helmet') {
             ctx.strokeStyle = skinObj.hatColor || '#87CEEB'; ctx.lineWidth=2*s;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius-2*s, 0, Math.PI*2); ctx.stroke();
             if(skinObj.hatColor === '#FFF') { // Hockey mask fill
                 ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
             }
        }
        else if (skinObj.headAccessory === 'horns') {
             ctx.fillStyle = 'red';
             ctx.beginPath(); ctx.moveTo(p.x-5*s, headY-10*s); ctx.lineTo(p.x-8*s, headY-18*s); ctx.lineTo(p.x-2*s, headY-10*s); ctx.fill();
             ctx.beginPath(); ctx.moveTo(p.x+5*s, headY-10*s); ctx.lineTo(p.x+8*s, headY-18*s); ctx.lineTo(p.x+2*s, headY-10*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'halo') {
             ctx.strokeStyle='#FFD700'; ctx.lineWidth=2*s; ctx.beginPath(); ctx.ellipse(p.x, headY-15*s, 8*s, 3*s, 0, 0, Math.PI*2); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'beanie') {
             ctx.fillStyle = skinObj.hatColor || '#FF0000'; ctx.fillRect(p.x-10*s, headY-12*s, 20*s, 6*s);
        }
        else if (skinObj.headAccessory === 'ear_muffs') {
             const col = skinObj.hatColor || '#FFF';
             ctx.fillStyle = col;
             ctx.beginPath(); ctx.arc(p.x - headRadius - 2*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x + headRadius + 2*s, headY, 6*s, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = col; ctx.lineWidth = 3*s;
             ctx.beginPath(); ctx.arc(p.x, headY, headRadius + 4*s, Math.PI, 0); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'collar') {
             ctx.fillStyle = skinObj.hatColor || '#FF0000';
             ctx.fillRect(p.x - headRadius, headY + headRadius - 2*s, headRadius * 2, 4*s);
             ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(p.x, headY + headRadius, 3*s, 0, Math.PI*2); ctx.fill();
        }
        else if (skinObj.headAccessory === 'scarf') {
             ctx.strokeStyle = skinObj.hatColor || '#00008B'; ctx.lineWidth = 6*s;
             ctx.beginPath(); ctx.arc(p.x, headY + headRadius, 6*s, 0, Math.PI, false); ctx.stroke();
             // Dangling part
             ctx.fillStyle = skinObj.hatColor || '#00008B';
             ctx.fillRect(p.x + 4*s, headY + headRadius, 6*s, 15*s);
        }
        else if (skinObj.headAccessory === 'fez') {
             ctx.fillStyle = '#8B0000';
             ctx.beginPath(); ctx.moveTo(p.x - 6*s, headY - 8*s); ctx.lineTo(p.x + 6*s, headY - 8*s); ctx.lineTo(p.x + 4*s, headY - 18*s); ctx.lineTo(p.x - 4*s, headY - 18*s); ctx.fill();
             ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1*s; ctx.beginPath(); ctx.moveTo(p.x, headY - 18*s); ctx.lineTo(p.x + 2*s, headY - 12*s); ctx.stroke();
        }
        else if (skinObj.headAccessory === 'bow') {
             ctx.fillStyle = skinObj.hatColor || '#FFC0CB';
             ctx.beginPath();
             ctx.ellipse(p.x - 6*s, headY - 8*s, 6*s, 4*s, -0.2, 0, Math.PI*2); ctx.fill();
             ctx.beginPath();
             ctx.ellipse(p.x + 6*s, headY - 8*s, 6*s, 4*s, 0.2, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.arc(p.x, headY - 8*s, 2*s, 0, Math.PI*2); ctx.fill();
        }
        else if (skinObj.headAccessory === 'flower') {
             ctx.fillStyle = '#FF69B4';
             const fx = p.x + headRadius; const fy = headY - 5*s;
             for(let i=0; i<5; i++) {
                 const a = (i/5)*Math.PI*2;
                 ctx.beginPath(); ctx.arc(fx + Math.cos(a)*4*s, fy + Math.sin(a)*4*s, 3*s, 0, Math.PI*2); ctx.fill();
             }
             ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(fx, fy, 2*s, 0, Math.PI*2); ctx.fill();
        }
        else if (skinObj.headAccessory === 'algae') {
             ctx.fillStyle = '#2E8B57';
             drawFuzzyPath([{x:p.x-5*s,y:headY-10*s},{x:p.x+5*s,y:headY-12*s},{x:p.x+8*s,y:headY-5*s},{x:p.x-8*s,y:headY-4*s}], '#2E8B57', s, true, 200);
        }
        else if (skinObj.headAccessory === 'hat') {
             ctx.fillStyle = skinObj.hatColor || '#5D4037';
             // Brim
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.8, 4*s, 0, 0, Math.PI*2); ctx.fill();
             // Top
             ctx.beginPath(); ctx.arc(p.x, headY - 10*s, headRadius * 0.9, Math.PI, 0); ctx.fill();
        }
        else if (skinObj.headAccessory === 'floppy_cap') {
             const capColor = skinObj.hatColor || '#00A000';
             ctx.fillStyle = capColor;
             // Base (Headband part)
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius, headY - 2*s);
             ctx.lineTo(p.x + headRadius, headY - 2*s);
             ctx.lineTo(p.x + headRadius, headY - 8*s);
             ctx.lineTo(p.x - headRadius, headY - 8*s);
             ctx.fill();

             // Floppy Tail
             ctx.beginPath();
             ctx.moveTo(p.x - headRadius + 2*s, headY - 8*s);
             ctx.lineTo(p.x + headRadius - 2*s, headY - 8*s);
             // Curve down and to the right/left
             ctx.quadraticCurveTo(p.x + 20*s, headY + 10*s, p.x + 15*s, headY + 25*s); // Tail tip
             ctx.quadraticCurveTo(p.x - 5*s, headY + 15*s, p.x - headRadius + 2*s, headY - 8*s);
             ctx.fill();
        }
        else if (skinObj.headAccessory === 'top_hat') {
             ctx.fillStyle = '#111';
             // Brim
             ctx.beginPath(); ctx.ellipse(p.x, headY - 5*s, headRadius * 1.5, 3*s, 0, 0, Math.PI*2); ctx.fill();
             // Cylinder
             ctx.fillRect(p.x - headRadius * 0.8, headY - 25*s, headRadius * 1.6, 20*s);
        }
        else if (skinObj.headAccessory === 'headband') {
             ctx.fillStyle = skinObj.hatColor || '#FF0000'; // Default red
             if(skinObj.hatColor === '#FFF' && skin.includes('tiger_white')) ctx.fillStyle = '#000'; // Contrast for white tiger
             ctx.fillRect(p.x - headRadius, headY - 8*s, headRadius * 2, 6*s);
             // Knot/Tails
             ctx.beginPath(); ctx.moveTo(p.x + headRadius, headY - 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY + 5*s); ctx.lineTo(p.x + headRadius + 10*s, headY - 5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'bandana_neck') {
             ctx.fillStyle = '#FF0000';
             ctx.beginPath(); ctx.moveTo(p.x - 10*s, headY + 5*s); ctx.lineTo(p.x, headY + 15*s); ctx.lineTo(p.x + 10*s, headY + 5*s); ctx.fill();
        }
        else if (skinObj.headAccessory === 'feathers') {
             ctx.fillStyle = '#FFF';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 15*s, 4*s, 10*s, 0, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#000'; ctx.lineWidth = 1*s; ctx.stroke();
             ctx.fillStyle = '#FF0000';
             ctx.beginPath(); ctx.ellipse(p.x, headY - 15*s, 2*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
        }

        // Head Details that act like accessories
        if(skinObj.headDetail === 'mohawk') {
             ctx.fillStyle = skinObj.hairColor || '#000';
             for(let i=0; i<5; i++) {
                 ctx.beginPath(); ctx.arc(p.x, headY - 10*s - (i*4*s), (5-i)*s + 2*s, 0, Math.PI*2); ctx.fill();
             }
        }
        if(skinObj.headDetail === 'visor') {
             ctx.fillStyle = '#FF0000'; ctx.shadowBlur = 5; ctx.shadowColor = '#FF0000';
             ctx.fillRect(p.x - 8*s, headY - 5*s, 16*s, 4*s);
             ctx.shadowBlur = 0;
        }
        if(skinObj.headDetail === 'yellow_neck') {
             ctx.fillStyle = '#FFD700';
             ctx.beginPath(); ctx.arc(p.x, headY + 5*s, 8*s, 0, Math.PI, false); ctx.fill();
        }

        // 11. Back Props (New Layer - Drawn on top of body for Back View)
        // Existing Back Accessories moved here
        if (skinObj.backAccessory === 'cape') {
            ctx.fillStyle = skinObj.backColor || '#000';
            ctx.fillRect(p.x - bodyW/1.5, torsoY + 5*s, bodyW*1.3, bodyH*0.8);
        }
        if (skinObj.backAccessory === 'wings') {
            ctx.fillStyle = skinObj.backColor || '#FFF';
            ctx.beginPath(); ctx.ellipse(p.x - 20*s, torsoY + 10*s, 10*s, 20*s, -0.5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(p.x + 20*s, torsoY + 10*s, 10*s, 20*s, 0.5, 0, Math.PI*2); ctx.fill();
        }
        if (skinObj.backAccessory === 'backpack') {
             ctx.fillStyle = skinObj.backColor || '#555';
             ctx.fillRect(p.x - bodyW/2, torsoY + 10*s, bodyW, bodyH*0.6);
        }
        if (skinObj.backAccessory === 'shell') {
             const shellW = bodyW * 1.4;
             const shellH = bodyH * 0.8;
             const sx = p.x;
             const sy = torsoY + bodyH * 0.4;
             const color = skinObj.backColor || '#006400';

             // Shell Rim (Outline)
             ctx.fillStyle = '#556B2F'; // Dark Olive Green
             ctx.beginPath();
             ctx.ellipse(sx, sy, shellW * 0.55, shellH * 0.55, 0, 0, Math.PI * 2);
             ctx.fill();

             // Shell Dome (Body)
             const grad = ctx.createRadialGradient(sx - shellW * 0.2, sy - shellH * 0.2, shellW * 0.1, sx, sy, shellW * 0.6);
             grad.addColorStop(0, '#228B22'); // Forest Green Light
             grad.addColorStop(1, color); // Base Dark Green
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.ellipse(sx, sy, shellW * 0.5, shellH * 0.5, 0, 0, Math.PI * 2);
             ctx.fill();

             // Scute Pattern (Hexagons)
             ctx.strokeStyle = 'rgba(0,0,0,0.3)';
             ctx.lineWidth = 2 * s;
             ctx.beginPath();

             // Center Scute
             const hexR = shellW * 0.15;
             for (let i = 0; i < 6; i++) {
                 const angle = (i / 6) * Math.PI * 2;
                 const hx = sx + Math.cos(angle) * hexR;
                 const hy = sy + Math.sin(angle) * hexR;
                 if (i === 0) ctx.moveTo(hx, hy);
                 else ctx.lineTo(hx, hy);
             }
             ctx.closePath();

             // Surrounding Scutes
             const outerR = shellW * 0.35;
             for(let i=0; i<6; i++) {
                 const angle = (i/6) * Math.PI * 2;
                 const hx = sx + Math.cos(angle) * hexR;
                 const hy = sy + Math.sin(angle) * hexR;
                 const ox = sx + Math.cos(angle) * outerR;
                 const oy = sy + Math.sin(angle) * outerR;
                 ctx.moveTo(hx, hy);
                 ctx.lineTo(ox, oy);
             }
             ctx.stroke();
        }

        // New Props
        if (skinObj.backProp) {
             const bp = skinObj.backProp;
             const centerX = p.x;
             const centerY = torsoY + bodyH * 0.4;

             if (bp === 'axe') {
                 // Axe handle diagonal
                 ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 // Axe head
                 ctx.fillStyle = '#AAA';
                 ctx.beginPath();
                 ctx.moveTo(centerX - 15*s, centerY - 15*s);
                 ctx.lineTo(centerX - 20*s, centerY - 20*s);
                 ctx.quadraticCurveTo(centerX - 10*s, centerY - 25*s, centerX - 5*s, centerY - 15*s);
                 ctx.fill();
             }
             if (bp === 'hero_gear') {
                 // Sword Hilt (Behind Shield)
                 ctx.fillStyle = '#800080'; // Master Sword Hilt
                 ctx.fillRect(centerX - 15*s, centerY - 30*s, 30*s, 5*s); // Crossguard
                 ctx.fillStyle = '#00008B'; // Handle
                 ctx.fillRect(centerX - 3*s, centerY - 35*s, 6*s, 15*s);

                 // Shield
                 ctx.fillStyle = '#00008B'; // Blue
                 ctx.beginPath();
                 ctx.moveTo(centerX - 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 10*s, centerY + 10*s);
                 ctx.lineTo(centerX, centerY + 20*s);
                 ctx.lineTo(centerX - 10*s, centerY + 10*s);
                 ctx.fill();

                 // Silver Trim
                 ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 2*s;
                 ctx.beginPath();
                 ctx.moveTo(centerX - 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 12*s, centerY - 20*s);
                 ctx.lineTo(centerX + 10*s, centerY + 10*s);
                 ctx.lineTo(centerX, centerY + 20*s);
                 ctx.lineTo(centerX - 10*s, centerY + 10*s);
                 ctx.closePath();
                 ctx.stroke();

                 // Triforce detail
                 ctx.fillStyle = '#FFD700';
                 ctx.beginPath(); ctx.moveTo(centerX, centerY - 10*s); ctx.lineTo(centerX + 4*s, centerY); ctx.lineTo(centerX - 4*s, centerY); ctx.fill();
             }
             if (bp === 'chaos_blades') {
                 // Two Crossed Blades
                 const drawBlade = (x, y, angle, flip) => {
                     ctx.save();
                     ctx.translate(x, y);
                     ctx.rotate(angle);
                     if(flip) ctx.scale(-1, 1);

                     // Blade
                     ctx.fillStyle = '#A9A9A9'; // Metal
                     ctx.beginPath();
                     ctx.moveTo(0, 0);
                     ctx.quadraticCurveTo(10*s, 10*s, 5*s, 30*s); // Outer edge
                     ctx.quadraticCurveTo(0, 20*s, -5*s, 30*s); // Inner hook?
                     ctx.lineTo(-2*s, 0);
                     ctx.fill();

                     // Glow
                     ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 1*s;
                     ctx.stroke();

                     // Handle
                     ctx.fillStyle = '#8B4513';
                     ctx.fillRect(-2*s, -10*s, 4*s, 10*s);

                     ctx.restore();
                 };

                 drawBlade(centerX - 5*s, centerY - 10*s, -0.5, false);
                 drawBlade(centerX + 5*s, centerY - 10*s, 0.5, true);

                 // Chain
                 ctx.strokeStyle = '#333'; ctx.lineWidth = 1*s;
                 ctx.beginPath();
                 ctx.moveTo(centerX - 5*s, centerY - 20*s);
                 ctx.quadraticCurveTo(centerX, centerY, centerX + 5*s, centerY - 20*s);
                 ctx.stroke();
             }
             if (bp === 'guitar') {
                 // Guitar Body
                 ctx.fillStyle = '#8B4513';
                 ctx.beginPath();
                 ctx.ellipse(centerX, centerY, 12*s, 18*s, -0.2, 0, Math.PI*2);
                 ctx.fill();
                 ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(centerX, centerY, 5*s, 0, Math.PI*2); ctx.fill();
                 // Neck
                 ctx.fillStyle = '#5D4037';
                 ctx.fillRect(centerX - 3*s, centerY - 30*s, 6*s, 20*s);
             }
             if (bp === 'oxygen_tank') {
                 ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#AAA'; ctx.lineWidth = 1*s;
                 ctx.fillRect(centerX - 12*s, centerY - 15*s, 24*s, 35*s);
                 ctx.strokeRect(centerX - 12*s, centerY - 15*s, 24*s, 35*s);
                 // Tubes
                 ctx.strokeStyle = '#CCC'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX, centerY - 15*s); ctx.quadraticCurveTo(centerX, centerY - 25*s, centerX - 10*s, centerY - 20*s); ctx.stroke();
             }
             if (bp === 'katanas') {
                 ctx.strokeStyle = '#333'; ctx.lineWidth = 3*s;
                 // X shape
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(centerX + 15*s, centerY - 15*s); ctx.lineTo(centerX - 15*s, centerY + 15*s); ctx.stroke();
                 // Hilts
                 ctx.fillStyle = '#000';
                 ctx.fillRect(centerX - 18*s, centerY - 18*s, 5*s, 5*s);
                 ctx.fillRect(centerX + 13*s, centerY - 18*s, 5*s, 5*s);
             }
             if (bp === 'sword') {
                 ctx.strokeStyle = '#555'; ctx.lineWidth = 4*s;
                 ctx.beginPath(); ctx.moveTo(centerX - 15*s, centerY - 15*s); ctx.lineTo(centerX + 15*s, centerY + 15*s); ctx.stroke();
                 // Hilt (Basket)
                 ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(centerX - 15*s, centerY - 15*s, 5*s, 0, Math.PI*2); ctx.fill();
             }
             if (bp === 'hockey_sticks') {
                 ctx.strokeStyle = '#D2B48C'; ctx.lineWidth = 3*s; // Wood
                 // Crossed
                 ctx.beginPath(); ctx.moveTo(centerX - 10*s, centerY - 20*s); ctx.lineTo(centerX + 10*s, centerY + 20*s); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(centerX + 10*s, centerY - 20*s); ctx.lineTo(centerX - 10*s, centerY + 20*s); ctx.stroke();
                 // Blades at bottom
                 ctx.fillStyle = '#000'; // Tape
                 ctx.fillRect(centerX + 8*s, centerY + 18*s, 8*s, 4*s);
                 ctx.fillRect(centerX - 16*s, centerY + 18*s, 8*s, 4*s);
             }
             if (bp === 'staff') {
                 ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX + 15*s, centerY - 30*s); ctx.lineTo(centerX - 15*s, centerY + 30*s); ctx.stroke();
                 // Orb (Optimized)
                 const orbX = centerX + 15*s;
                 const orbY = centerY - 30*s;
                 const orbR = 5*s;
                 const glowR = orbR + 15;
                 const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, glowR);
                 orbGrad.addColorStop(0, '#00FFFF');
                 orbGrad.addColorStop(orbR/glowR, '#00FFFF');
                 orbGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                 ctx.fillStyle = orbGrad;
                 ctx.beginPath(); ctx.arc(orbX, orbY, glowR, 0, Math.PI*2); ctx.fill();
             }
             if (bp === 'windup_key') {
                 ctx.strokeStyle = '#C0C0C0'; ctx.lineWidth = 3*s;
                 ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX, centerY + 10*s); ctx.stroke();
                 // Handle
                 ctx.lineWidth = 2*s;
                 ctx.beginPath(); ctx.arc(centerX - 5*s, centerY, 5*s, 0, Math.PI*2); ctx.stroke();
                 ctx.beginPath(); ctx.arc(centerX + 5*s, centerY, 5*s, 0, Math.PI*2); ctx.stroke();
             }
        }

        // 9. Jersey Number (Layer 5)
        if(!skin.includes('alien') && !skin.includes('robot') && skinObj.number) {
            ctx.fillStyle = skinObj.numberColor || "#FFF";
            ctx.font = `bold ${12 * s}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(skinObj.number, p.x, torsoY + bodyH * 0.6);
        }

        // 10. Shot Meter (Layer 6)
        drawMeterCommon(p, s, sizeMod);
    }
    function getProjectedY(gDist, currentDist, horizonY) {
        if (gDist <= 0) { const p = project(HOOP_POS.x, HOOP_POS.y, 0); return p ? p.y : horizonY; }
        const ratio = gDist / currentDist;
        const wx = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratio; const wy = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratio;
        const p = project(wx, wy, 0); return p ? p.y : canvas.height;
    }

    function drawMountainLayer(layer, horizonY, dx, scale) {
        if (playerData.graphics === 'HIGH') {
            if (!layer.gradient) {
                const grad = ctx.createLinearGradient(0, horizonY - 150, 0, horizonY);
                grad.addColorStop(0, layer.color);
                grad.addColorStop(1, '#1a1a1a');
                layer.gradient = grad;
            }
            ctx.fillStyle = layer.gradient;
        } else {
            ctx.fillStyle = layer.color;
        }

        if (!scale) scale = 1.0;

        ctx.beginPath();
        ctx.moveTo((layer.points[0].x * scale) + dx, horizonY);
        layer.points.forEach(p => { ctx.lineTo((p.x * scale) + dx, horizonY - (p.y * scale)); });
        ctx.lineTo((layer.points[layer.points.length-1].x * scale) + dx, horizonY);
        ctx.fill();
    }

    function drawBackground(vpX, vpY, vpW, vpH) {
        if (vpW === undefined) { vpX=0; vpY=0; vpW=canvas.width; vpH=canvas.height; }
        g_viewport = { x: vpX, y: vpY, w: vpW, h: vpH };

        // Optimization: Per-frame camera calculation
        // Camera Follow Logic
        if (!window.g_camSmooth) window.g_camSmooth = { x: player3D.x, y: player3D.y };

        let targetX = player3D.x;
        let targetY = player3D.y;

        if (state === 'SHOOTING' && activeBalls.length > 0 && currentGameMode === 'CLASSIC') {
            const b = activeBalls[activeBalls.length - 1];
            if (b.active) {
                targetX = b.x;
                targetY = b.y;
            }
        }

        // Smooth Interpolation
        const lerp = 0.1;
        window.g_camSmooth.x += (targetX - window.g_camSmooth.x) * lerp;
        window.g_camSmooth.y += (targetY - window.g_camSmooth.y) * lerp;

        // Snap if close to avoid micro-jitter
        if (Math.abs(targetX - window.g_camSmooth.x) < 1) window.g_camSmooth.x = targetX;
        if (Math.abs(targetY - window.g_camSmooth.y) < 1) window.g_camSmooth.y = targetY;

        const camX = window.g_camSmooth.x;
        const camY = window.g_camSmooth.y;

        const dxToHoop = HOOP_POS.x - camX;
        const dyToHoop = HOOP_POS.y - camY;
        const angleToHoop = Math.atan2(dyToHoop, dxToHoop);
        const camRotation = -angleToHoop - Math.PI / 2;
        const camSin = Math.sin(camRotation);
        const camCos = Math.cos(camRotation);
        const camZoom = isSplitscreen ? 450 : 698;
        const camHeight = 130000 / camZoom;

        if (!g_camCache) g_camCache = {};
        g_camCache.rotation = camRotation;
        g_camCache.sinRot = camSin;
        g_camCache.cosRot = camCos;
        g_camCache.cameraZoom = camZoom;
        g_camCache.cameraHeight = camHeight;
        g_camCache.x = camX;
        g_camCache.y = camY;

        // Ensure globals are updated
        cameraZoom = camZoom;
        cameraHeight = camHeight;

        const horizonY = (vpH - 120) * 0.38;

        if (!bgCache || bgCache.distanceLevel !== distanceLevel || bgCache.mode !== currentGameMode) {
            bgCache = { distanceLevel: distanceLevel, mode: currentGameMode, pastFloors: [] };

            let court;
            if (currentGameMode === 'CONTEST') {
                court = COURT_THEMES.arena;
            } else if (currentGameMode === 'TIME_ATTACK') {
                court = COURT_THEMES.carnival;
            } else {
                const currentDist = 10 + (distanceLevel * 5);
                court = getCourtDetails(currentDist);
            }

            // Sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, vpH * 0.6);
            skyGrad.addColorStop(0, court.sky1); skyGrad.addColorStop(1, court.sky2);
            bgCache.sky = skyGrad;

            // Current Floor
            if (playerData.graphics === 'HIGH') {
                 // Bake texture for high graphics
                 const fCv = document.createElement('canvas');
                 fCv.width = vpW;
                 fCv.height = Math.ceil(vpH - horizonY);
                 const fCtx = fCv.getContext('2d');

                 // Base Gradient
                 const grad = fCtx.createLinearGradient(0, 0, 0, fCv.height);
                 grad.addColorStop(0, court.ground1); grad.addColorStop(1, court.ground2);
                 fCtx.fillStyle = grad;
                 fCtx.fillRect(0, 0, fCv.width, fCv.height);

                 // Procedural Textures based on Type
                 if (court.type === 'arena') {
                     // Wood Planks
                     fCtx.fillStyle = court.ground2;
                     const plankW = 40;
                     for(let i=0; i<fCv.width; i+=plankW) {
                         fCtx.fillRect(i, 0, 2, fCv.height);
                     }
                 }
                 else if (court.type === 'carnival') {
                     // Carnival Checkerboard
                     const size = 50;
                     fCtx.fillStyle = court.ground2;
                     for(let y=0; y<fCv.height; y+=size) {
                         for(let x=0; x<fCv.width; x+=size) {
                             if ((Math.floor(x/size) + Math.floor(y/size)) % 2 === 0) {
                                 fCtx.fillRect(x, y, size, size);
                             }
                         }
                     }
                 }
                 else if (court.type === 'grass' || court.type === 'tree') {
                     // Grass Blades removed for clean High graphics
                 }
                 else if (court.type === 'castle') {
                    // Clean asphalt
                 }
                 else if (court.type === 'mountain') {
                     // Ice / Snow Gloss
                     // Reflections (Fake)
                     const gradRef = fCtx.createLinearGradient(0, 0, fCv.width, fCv.height);
                     gradRef.addColorStop(0, 'rgba(255,255,255,0)');
                     gradRef.addColorStop(0.5, 'rgba(255,255,255,0.1)');
                     gradRef.addColorStop(1, 'rgba(255,255,255,0)');
                     fCtx.fillStyle = gradRef;
                     fCtx.fillRect(0, 0, fCv.width, fCv.height);
                 }
                 else if (court.type === 'water') {
                    // Clean water
                 }
                 else if (court.type === 'space') {
                     // Craters / Dust
                     fCtx.fillStyle = 'rgba(0,0,0,0.2)';
                     for(let i=0; i<20; i++) {
                         const r = 10 + Math.random() * 40;
                         const cx = Math.random() * fCv.width;
                         const cy = Math.random() * fCv.height;
                         fCtx.beginPath();
                         fCtx.arc(cx, cy, r, 0, Math.PI*2);
                         fCtx.fill();
                     }
                 }

                 bgCache.floorImage = fCv;
            } else {
                 const currentZoneGrad = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
                 currentZoneGrad.addColorStop(0, court.ground1); currentZoneGrad.addColorStop(1, court.ground2);
                 bgCache.currentFloor = currentZoneGrad;
            }

            // Past Floors (Only for CLASSIC)
            if (currentGameMode === 'CLASSIC') {
                const currentDist = 10 + (distanceLevel * 5);
                for (let i = 0; i < COURT_ZONES.length; i++) {
                    const z = COURT_ZONES[i];
                    let zStart = (i === 0) ? 0 : COURT_ZONES[i-1].limit;
                    let zEnd = z.limit;
                    if (zStart >= currentDist) break;
                    let drawEnd = Math.min(zEnd, currentDist);
                    const yTop = getProjectedY(zStart, currentDist, horizonY); const yBottom = getProjectedY(drawEnd, currentDist, horizonY);
                    if ((yBottom - yTop) > 0.5) {
                        const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
                        grad.addColorStop(0, z.ground1); grad.addColorStop(1, z.ground2);
                        bgCache.pastFloors.push({ y: yTop, h: (yBottom - yTop) + 2, grad: grad });
                    }
                }
            }
        }

        // DRAW FROM CACHE
        ctx.fillStyle = bgCache.sky; ctx.fillRect(0, 0, vpW, vpH);

        // SUN / MOON / STARS / MOUNTAINS (CLASSIC ONLY)
        if (currentGameMode === 'CLASSIC') {
            if (distanceLevel > 8) {
                 // Simple stars
                 ctx.fillStyle = 'rgba(255,255,255,0.8)';
                 for(let i=0; i<30; i++) {
                     let sx = (i * 137) % vpW;
                     let sy = (i * 59) % (horizonY * 0.8);
                     ctx.beginPath(); ctx.arc(sx, sy, 1 + (i%2), 0, Math.PI*2); ctx.fill();
                }
            } else {
                 // Sun
                 if (playerData.graphics === 'HIGH') {
                     const sunX = 700, sunY = 80;
                     const glow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 120);
                     glow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                     glow.addColorStop(0.4, 'rgba(255, 165, 0, 0.4)');
                     glow.addColorStop(1, 'rgba(255, 69, 0, 0)');
                     ctx.fillStyle = glow;
                     ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, Math.PI*2); ctx.fill();
                     ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(sunX, sunY, 40, 0, Math.PI*2); ctx.fill();
                 } else {
                     ctx.fillStyle = sunGradient;
                     ctx.beginPath(); ctx.arc(700, 80, 80, 0, Math.PI*2); ctx.fill();
                 }
            }

            // BACKGROUND MOUNTAINS
            const mountainScale = 1.0 / (1.0 + (distanceLevel - 1) * 0.01);

            mountainLayers.forEach(layer => {
                 const shift = (camX + camY) * layer.speed;
                 const loopWidth = 2000 * mountainScale;
                 const offset = shift % loopWidth;
                 let startX = -offset;
                 if (startX > 0) startX -= loopWidth;

                 let currentX = startX;
                 while(currentX < vpW) {
                     drawMountainLayer(layer, horizonY, currentX, mountainScale);
                     currentX += loopWidth;
                 }
            });
        }

        // CLOUDS
        if (currentGameMode === 'CLASSIC') {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            clouds.forEach(c => {
                 // c.x updated in updateEnvironment
                 let xPos = c.x;
                 let yPos = c.y;
                 ctx.beginPath();
                 c.puffs.forEach(p => {
                     ctx.moveTo(xPos + p.dx * c.scale, yPos + p.dy * c.scale);
                     ctx.arc(xPos + p.dx * c.scale, yPos + p.dy * c.scale, p.r * c.scale, 0, Math.PI*2);
                 });
                 ctx.fill();
            });
        }

        if (bgCache.floorImage) {
             ctx.drawImage(bgCache.floorImage, 0, horizonY);
        } else {
             ctx.fillStyle = bgCache.currentFloor; ctx.fillRect(0, horizonY, vpW, vpH - horizonY);
        }

        if (currentGameMode === 'CLASSIC') {
            const currentDist = 10 + (distanceLevel * 5);
            for (let i = 0; i < COURT_ZONES.length; i++) {
                const z = COURT_ZONES[i];
                let zStart = (i === 0) ? 0 : COURT_ZONES[i-1].limit;
                if (zStart >= currentDist) break;
                let drawEnd = Math.min(z.limit, currentDist);

                // Re-project zone boundaries based on current camera
                const ratioStart = zStart / currentDist;
                const ratioEnd = drawEnd / currentDist;

                const wxStart = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratioStart;
                const wyStart = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratioStart;
                const pStart = project(wxStart, wyStart, 0, g_camCache); // Force use of current camera cache

                const wxEnd = HOOP_POS.x + (player3D.x - HOOP_POS.x) * ratioEnd;
                const wyEnd = HOOP_POS.y + (player3D.y - HOOP_POS.y) * ratioEnd;
                const pEnd = project(wxEnd, wyEnd, 0, g_camCache);

                const yTop = pStart ? pStart.y : horizonY;
                const yBottom = pEnd ? pEnd.y : canvas.height;

                if ((yBottom - yTop) > 0.5) {
                    const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
                    grad.addColorStop(0, z.ground1); grad.addColorStop(1, z.ground2);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, yTop, vpW, yBottom - yTop);
                }
            }
        }

        ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(vpW, horizonY); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();

        // 3D OBJECTS
        g_poolIndex = 0;
        g_renderList.length = 0;

        // Use cached camera values (already calculated at top of function)

        // OPTIMIZATION: Cull objects far beyond the player
        // Player moves away from hoop. d.dist approximates distance from hoop (in pixels).
        // Objects with d.dist >> playerDistFromHoop are behind the camera.
        const playerDistFromHoop = Math.sqrt(Math.pow(player3D.x - HOOP_POS.x, 2) + Math.pow(player3D.y - HOOP_POS.y, 2));
        const cullDist = playerDistFromHoop + 3000; // Margin for scatter and frustum depth

        // OPTIMIZATION: Start iteration from visible range
        // Objects with d.dist << playerDistFromHoop are too far in the distance to be seen (sub-pixel scale).
        // We assume a max visible depth of ~15000 pixels.

        // Helper to process decor immediately (Avoids array allocation)
        const processDecor = function(d) {
            // Fast Z-Check
            const dx = d.x - camX;
            const dy = d.y - camY;
            // ry calculation: dx * sin + dy * cos
            const ry = dx * camSin + dy * camCos;
            // cameraOffset is 550 in project()
            const depth = 550 - ry;
            if (depth <= 0) return;

            // Inline projection
            const rx = dx * camCos - dy * camSin;
            const scale = camZoom / depth;
            const screenX = vpW / 2 + (rx * scale);
            const screenY = horizonY + (camHeight - 0) * scale; // z is 0

            const obj = getRenderItem();
            obj.type = 'decor';
            obj.depth = depth;
            obj.x = screenX;
            obj.y = screenY;
            obj.scale = scale;
            obj.zoneType = d.zoneType;
            obj.variant = d.variant;
            obj.seed = d.seed;
            g_renderList.push(obj);
        };

        if (currentGameMode === 'CLASSIC') {
            const startDist = Math.max(0, playerDistFromHoop - 15000);
            let startIndex = 0;
            if (startDist > 1000) {
                 startIndex = binarySearchLowerBound(decors, startDist);
            }
            for (let i = startIndex; i < decors.length; i++) {
                const d = decors[i];
                if (d.dist > cullDist) break;
                processDecor(d);
            }
        } else if (currentGameMode === 'TIME_ATTACK') {
            // Carnival: Circle of tents around hoop
            const r = 800;
            for(let i=0; i<8; i++) {
                const angle = (i/8) * Math.PI * 2;
                processDecor({
                    x: HOOP_POS.x + Math.cos(angle)*r,
                    y: HOOP_POS.y + Math.sin(angle)*r,
                    zoneType: 'carnival_tent',
                    variant: {},
                    seed: i
                });
            }
        } else if (currentGameMode === 'CONTEST') {
            // Arena: Bleachers
            const r = 900;
            for(let i=0; i<12; i++) {
                const angle = (i/12) * Math.PI * 2;
                processDecor({
                    x: HOOP_POS.x + Math.cos(angle)*r,
                    y: HOOP_POS.y + Math.sin(angle)*r,
                    zoneType: 'arena_bleachers',
                    variant: {},
                    seed: i
                });
            }
        }

        const hoopProj = project(HOOP_POS.x, HOOP_POS.y, HOOP_POS.z);
        if (hoopProj) {
            const obj = getRenderItem();
            obj.type = 'hoop';
            obj.depth = hoopProj.depth;
            obj.x = hoopProj.x; obj.y = hoopProj.y; obj.scale = hoopProj.scale;
            g_renderList.push(obj);
        }

        const playerProj = project(player3D.x, player3D.y, player3D.z);
        if (playerProj) {
            const obj = getRenderItem();
            obj.type = 'player';
            obj.depth = playerProj.depth;
            obj.x = playerProj.x; obj.y = playerProj.y; obj.scale = playerProj.scale;
            g_renderList.push(obj);
        }

        const shadowProj = project(player3D.x, player3D.y, 0);
        if (shadowProj) {
            const obj = getRenderItem();
            obj.type = 'player_shadow';
            obj.depth = shadowProj.depth + 0.1;
            obj.x = shadowProj.x; obj.y = shadowProj.y; obj.scale = shadowProj.scale;
            g_renderList.push(obj);
        }

        activeBalls.forEach(b => {
            if (b.active) {
                const ballShadowProj = project(b.x, b.y, 0);
                if (ballShadowProj) {
                    const obj = getRenderItem();
                    obj.type = 'ball_shadow';
                    obj.depth = ballShadowProj.depth + 0.1;
                    obj.x = ballShadowProj.x; obj.y = ballShadowProj.y; obj.scale = ballShadowProj.scale;
                    obj.ballRef = b;
                    g_renderList.push(obj);
                }

                const ballProj = project(b.x, b.y, b.z);
                if (ballProj) {
                    const obj = getRenderItem();
                    obj.type = 'ball';
                    obj.depth = ballProj.depth;
                    obj.x = ballProj.x; obj.y = ballProj.y; obj.scale = ballProj.scale;
                    obj.ballRef = b;
                    g_renderList.push(obj);
                }
            }
        });

        particles.forEach(p => {
             const proj = project(p.x, p.y, p.z);
             if(proj) {
                 const obj = getRenderItem();
                 obj.type = 'smoke';
                 // Force streak fire particles behind the player (depth > 550)
                 if (p.isFireParticle && p.customHue !== undefined) {
                     obj.depth = Math.max(proj.depth, 580);
                 } else {
                     obj.depth = proj.depth;
                 }
                 obj.x = proj.x; obj.y = proj.y; obj.scale = proj.scale;
                 obj.alpha = p.alpha;
                 obj.color = p.color;
                 g_renderList.push(obj);
             }
        });

        g_renderList.sort((a, b) => b.depth - a.depth);
        g_renderList.forEach(obj => {
            if (obj.type === 'decor') drawDecor(obj, obj.zoneType, obj.variant, obj.seed);
            if (obj.type === 'hoop') drawHoop(obj);
            if (obj.type === 'player_shadow') drawRealisticShadow(obj, 'player');
            if (obj.type === 'ball_shadow') drawRealisticShadow(obj, 'ball');
            if (obj.type === 'player') drawPlayer(obj);
            if (obj.type === 'ball') drawBall(obj, obj.ballRef);
            if (obj.type === 'smoke') drawSmoke(obj, obj.alpha, obj.color);
        });

        // Draw Weather overlay on top of 3D scene but behind UI
        weather.draw(project);

        if (feedbackTimer > 0) {
            ctx.save(); ctx.font = "900 60px 'Arial Black'";
            ctx.fillStyle = feedback === "MUY BIEN!" || feedback === "CHANCEUX!" || feedback === "Swish" || feedback.includes('MONEY') || feedback === "SUR LA LIGNE!" || feedback === "OUF!" || feedback.includes('SÉRIE') ? "#00FF00" : "#FF0000";
            if (feedback === "DERNIÈRE CHANCE !") ctx.fillStyle = "#FFA500";
            ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.textAlign = "center";
            ctx.fillText(feedback, vpW/2, 200); ctx.strokeText(feedback, vpW/2, 200);
            ctx.restore();
        }
    }

    // Achievement Logic Helpers
    function drawSplitscreenHUD() {
        const w = canvas.width;
        const h = canvas.height;

        ctx.save();
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;

        const drawPlayerHUD = (gCtx, xCenter, label, actionBtn) => {
            ctx.textAlign = "center";

            // Label
            ctx.font = "bold 20px 'Roboto Condensed'";
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText(label, xCenter, 30);

            // Stats
            ctx.font = "900 32px 'Russo One'";
            ctx.fillStyle = "#FFD700";

            let line1 = "";
            let line2 = "";

            if (currentGameMode === 'CLASSIC') {
                const dist = 10 + (gCtx.distanceLevel * 5);
                const maxMisses = 2 + (gCtx.playerData.stats.extraLives || 0);
                line1 = `${dist} PI`;
                line2 = `MISS: ${gCtx.consecutiveMisses}/${maxMisses}`;
                // Streak?
                if (gCtx.currentStreak > 1) line2 += ` (${gCtx.currentStreak} 🔥)`;
            } else if (currentGameMode === 'CONTEST') {
                line1 = `SCORE: ${gCtx.contestData.score}`;
                line2 = `TIME: ${Math.ceil(gCtx.contestData.timer)}`;
            } else if (currentGameMode === 'TIME_ATTACK') {
                line1 = `SCORE: ${gCtx.timeAttackData.score}`;
                line2 = `TIME: ${Math.ceil(gCtx.timeAttackData.timer)}`;
            }

            ctx.fillText(line1, xCenter, 65);

            ctx.font = "bold 24px 'Roboto Condensed'";
            ctx.fillStyle = "#FFF";
            ctx.fillText(line2, xCenter, 95);

            // Game Over State
            if (gCtx.state === 'GAMEOVER') {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(xCenter - 150, h/2 - 60, 300, 120);

                ctx.font = "900 40px 'Russo One'";
                ctx.fillStyle = "#FF0000";
                ctx.fillText("TERMINÉ", xCenter, h/2 - 10);

                ctx.font = "bold 20px 'Roboto Condensed'";
                ctx.fillStyle = "#FFF";
                ctx.fillText(`PRESS ${actionBtn}`, xCenter, h/2 + 30);
                ctx.fillText("TO RESTART", xCenter, h/2 + 55);
            }
        };
