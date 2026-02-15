
    // --- HIGH SCORE LOGIC ---
    var highScoreCursor = 0;
    var highScoreName = ["A", "A", "A"];
    const KEYBOARD_LAYOUT = [
        "A", "B", "C", "D", "E", "F", "G",
        "H", "I", "J", "K", "L", "M", "N",
        "O", "P", "Q", "R", "S", "T", "U",
        "V", "W", "X", "Y", "Z", "OK", "DEL"
    ];
    var keyboardCursor = 0;

    function initHighScoreUI() {
        highScoreName = ["A", "A", "A"];
        highScoreCursor = 0;
        keyboardCursor = 0;
        renderKeyboard();
        updateHighScoreDisplay();
    }

    function renderKeyboard() {
        const grid = document.getElementById('keyboard');
        if(!grid) return;
        grid.innerHTML = '';
        KEYBOARD_LAYOUT.forEach((key, index) => {
            const div = document.createElement('div');
            div.className = 'key';
            if (index === keyboardCursor) div.classList.add('selected');
            if (key === 'OK') div.classList.add('action', 'confirm');
            if (key === 'DEL') div.classList.add('action', 'back');
            div.innerText = key;
            div.onclick = () => {
                keyboardCursor = index;
                renderKeyboard();
                handleHighScoreInput('SELECT');
            };
            grid.appendChild(div);
        });
    }

    function updateHighScoreDisplay() {
        const display = document.getElementById('hsNameDisplay');
        if(!display) return;
        let html = '';
        for(let i=0; i<3; i++) {
            if (i === highScoreCursor) html += `<span style="color:#FFD700; text-decoration:underline;">${highScoreName[i]}</span> `;
            else html += `${highScoreName[i]} `;
        }
        display.innerHTML = html.trim();
    }

    function handleHighScoreInput(action) {
        if (action === 'UP') {
            if (keyboardCursor >= 7) keyboardCursor -= 7;
        } else if (action === 'DOWN') {
            if (keyboardCursor + 7 < KEYBOARD_LAYOUT.length) keyboardCursor += 7;
        } else if (action === 'LEFT') {
            if (keyboardCursor > 0) keyboardCursor--;
        } else if (action === 'RIGHT') {
            if (keyboardCursor < KEYBOARD_LAYOUT.length - 1) keyboardCursor++;
        } else if (action === 'SELECT') {
            const char = KEYBOARD_LAYOUT[keyboardCursor];
            if (char === 'DEL') {
                if (highScoreCursor > 0) {
                    highScoreCursor--;
                    highScoreName[highScoreCursor] = 'A';
                    updateHighScoreDisplay();
                }
            } else if (char === 'OK') {
                submitHighScoreInput();
            } else {
                if (highScoreCursor < 3) {
                    highScoreName[highScoreCursor] = char;
                    highScoreCursor++;
                    if (highScoreCursor >= 3) {
                        keyboardCursor = KEYBOARD_LAYOUT.indexOf('OK');
                        renderKeyboard();
                    }
                    updateHighScoreDisplay();
                }
            }
        } else if (action === 'BACK') {
             if (highScoreCursor > 0) {
                highScoreCursor--;
                updateHighScoreDisplay();
            }
        }
        renderKeyboard();
    }

    function checkGameOverSequence(mode, score) {
        if(isSplitscreen) return;
        // Update Game Over State Logic
        if (isHighScore(mode, score)) {
            pendingHighScore = { mode: mode, score: score };
            highScoreUI.style.display = 'block';
            state = 'HIGHSCORE_INPUT';
            updateMobileControlsUI();
            initHighScoreUI();
        } else {
            openShop();
        }
    }

    // Wrapper for challenge updates
    function checkDailyProgress(type, amount) {
         if (window.processAllChallenges) {
             window.processAllChallenges(type, amount);
         }
    }

    function calculateShotThreshold() {
        const style = getCurrentStyle();
        const mods = style.modifiers;

        let aimBonus = (playerData.stats.aim - 1);
        let baseDampener = 6.0;
        if (currentGameMode === 'CONTEST') { aimBonus *= 0.2; baseDampener = 4.5; }
        if (currentGameMode === 'TIME_ATTACK') { aimBonus = 0; }
        let dampener = baseDampener + aimBonus;

        if(mods.timingWindow) dampener *= mods.timingWindow;

        // Note: We do NOT apply the 1.2x 'no-meter' bonus here.
        // This function returns the standard physical threshold (meter visible difficulty).
        // The shooter function applies the bonus on top if the meter is actually disabled.

        if (dampener > 36.0) dampener = 36.0;

        const distPenalty = 1.0 + Math.pow(distanceLevel, 1.25) * 0.06;
        let finalDistPenalty = distPenalty;
        if(mods.rangeBonus) finalDistPenalty = 1.0 + (distPenalty - 1.0) * (1.0 - mods.rangeBonus);

        // accuracy = (timingError / dampener) * difficulty * finalDistPenalty
        // success condition: |accuracy| <= 0.25
        // |timingError| <= 0.25 * dampener / (difficulty * finalDistPenalty)

        return (0.25 * dampener) / (playerData.difficulty * finalDistPenalty);
    }

    function getStreakFireHue(streak) {
        // Map streak 10->100 to Hue 30 (Orange) -> 200 (Blue)
        const s = Math.max(10, Math.min(100, streak));
        const t = (s - 10) / 90;
        return 30 + (t * 170);
    }

    function getCurrentVz() {
        if (isGroundedShot) {
            return 8.0 - (groundShotTimer * 0.5);
        }
        if (state === 'PRE_JUMP') {
            // Simulate virtual velocity increasing "timeliness" during gather
            // Gravity is 0.5. preJumpTimer counts down from 0.10 to 0.
            const style = getCurrentStyle();
            const jv = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            return jv + (0.5 * preJumpTimer * 60); // 60 to convert seconds to frames
        }
        return player3D.vz;
    }

    function getReleaseTargetVz(maxVz) {
        // 0: Jump (Early) -> 40% of max velocity left
        // 1: Setpoint (Mid) -> 25%
        // 2: Push (Late-Mid) -> 10%
        // 3: Release (Apex) -> 0%
        const timing = (playerData.releaseTiming !== undefined) ? playerData.releaseTiming : 3;
        if (timing === 0) return maxVz * 0.40;
        if (timing === 1) return maxVz * 0.25;
        if (timing === 2) return maxVz * 0.10;
        return 0;
    }

    function unlockAchievement(id) {
        if (!playerData.unlockedAchievements.includes(id)) {
            playerData.unlockedAchievements.push(id);
            const ach = ACHIEVEMENTS.find(a => a.id === id);
            if(ach) {
                playerData.tacos += ach.reward;
                saveData();
                showNotification(ach.name, ach.reward);
                updateUI();
            }
        }
    }

    function checkAchievements(context) {
        const dist = 10 + (distanceLevel * 5);
        const ls = playerData.lifetimeStats;

        // Dynamic Check for New Achievements
        ACHIEVEMENTS.forEach(ach => {
            if (ach.type === 'distance' && context === 'score') {
                if (dist >= ach.threshold) unlockAchievement(ach.id);
            }
            if (ach.type === 'streak' && (context === 'streak' || context === 'score')) {
                if (currentStreak >= ach.threshold) unlockAchievement(ach.id);
            }
        });

        if (context === 'score') {
            unlockAchievement('rookie');
            if (ls.makes >= 100) unlockAchievement('veteran');
             if (dist >= 25) unlockAchievement('amateur'); if (dist >= 50) unlockAchievement('sniper');
            if (dist >= 75) unlockAchievement('pro');
            if (dist >= 100) unlockAchievement('parking_lot');
            if (dist >= 125) unlockAchievement('longshot'); if (dist >= 150) unlockAchievement('levis_legend');
            if (dist >= 200) unlockAchievement('interstellar');
            if (dist >= 350) unlockAchievement('urban_legend');
            if (dist >= 500) unlockAchievement('moonwalker');
            if (dist >= 750) unlockAchievement('ice_cold');
            if (dist >= 1000) unlockAchievement('demigod');
            if (dist >= 4000) unlockAchievement('astronaut_training');
            if (playerData.difficulty >= 3) unlockAchievement('daredevil');
            if (playerData.difficulty >= 2) unlockAchievement('hard_mode');
        }
        if(context === 'shot_stats') {
             if(ls.shots >= 500) unlockAchievement('ball_hog');
             if(ls.misses >= 50) unlockAchievement('bricklayer');
        }
        if(context === 'contest') {
             if(contestData.score > 10) unlockAchievement('contest_winner');
             if(contestData.score > 20) unlockAchievement('contest_perfect');
        }
        if (context === 'shop') {
            if (playerData.unlockedSkins.length >= 5) unlockAchievement('fashionista');
            if (playerData.unlockedSkins.length >= 10) unlockAchievement('wardrobe_malfunction');
            if (playerData.unlockedSkins.length >= 15) unlockAchievement('collector');
            if (playerData.stats.income >= 5) unlockAchievement('sweet_tooth');
            if (playerData.stats.aim >= 5) unlockAchievement('hawkeye');
            if (playerData.stats.luck >= 5) unlockAchievement('leprechaun');
            if (playerData.stats.moonwalk >= 5) unlockAchievement('moonwalker_pro');
            const animalsOwned = new Set();
            playerData.unlockedSkins.forEach(skinId => { const s = SKINS_DB.find(x => x.id === skinId); if(s) animalsOwned.add(s.animal); });
            if(animalsOwned.size >= 3) unlockAchievement('zoo');
        }
        if (context === 'lucky') unlockAchievement('lucky');
        if (context === 'skin') {
            const s = playerData.currentSkin;
            if(s.includes('robot') || s.includes('alien') || s.includes('astronaut')) unlockAchievement('cosplay');
            if(s.includes('lumberjack') || s.includes('hockey')) unlockAchievement('eh');
            if(s.includes('zombie') || s.includes('vampire') || s.includes('devil')) unlockAchievement('spooky');
            if(s.includes('poutine')) unlockAchievement('poutine_chef');
        }
        if (playerData.tacos >= 100) unlockAchievement('pocket_change');
        if (playerData.tacos >= 500) unlockAchievement('tycoon');
        if (playerData.tacos >= 2000) unlockAchievement('millionaire');
    }

    function showNotification(name, reward) {
        const notifText = document.getElementById('notifText');
        notifText.innerText = `${name} (+${reward} Tacos)`;
        notif.style.display = 'block'; setTimeout(() => { notif.style.display = 'none'; }, 3000);
    }

    function renderAchievements() {
        const list = document.getElementById('achList');
        list.innerHTML = '';
        ACHIEVEMENTS.forEach(ach => {
            const unlocked = playerData.unlockedAchievements.includes(ach.id);
            const div = document.createElement('div');
            div.className = `ach-row ${unlocked ? 'unlocked' : ''}`;
            div.innerHTML = `<div style="display:flex; align-items:center;"><div class="ach-icon">${unlocked ? '🏆' : '🔒'}</div><div class="ach-info"><h4>${ach.name}</h4><span>${ach.desc}</span></div></div>${unlocked ? '<div style="color:#00FF00">✓</div>' : ''}`;
            list.appendChild(div);
        });
    }

    // --- GAME ACTIONS ---
    function startJump() {
        if (state !== 'IDLE') return;
        AudioSystem.init();

        // Pre-Jump (Gather/Crouch) for all characters
        state = 'PRE_JUMP';
        preJumpTimer = 0.10; // ~6 frames
        feedback = "";

        const style = getCurrentStyle();
        const jv = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;

        if (jv <= 0.5) {
            isGroundedShot = true;
            groundShotTimer = 0;
            player3D.vz = 0;
        } else {
            isGroundedShot = false;
            player3D.vz = jv;
        }
    }
    function releaseShot() {
        if (state === 'PRE_JUMP') {
            state = 'JUMPING';
            const style = getCurrentStyle();
            const jv = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;
            player3D.vz = jv; // Force launch if early release
        }

        if (state !== 'JUMPING') return;

        const style = getCurrentStyle();
        let maxVz = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 8.0;

        const currentVz = getCurrentVz();
        const targetVz = getReleaseTargetVz(maxVz);

        // Calculate error relative to the chosen release point
        // If target is 0 and current is 0, error is 0.
        // If target is 5 and current is 5, error is 0.
        // We use absolute difference for the check.
        const timingError = currentVz - targetVz;

        shoot(timingError);
    }
    function retryShot() {
        player3D.z = 0; player3D.vz = 0;
        state = 'IDLE';
        activeBalls = []; // Clear any remaining balls
    }

    function shoot(timingError) {
        state = 'SHOOTING';

        if (playerData.currentStyle === 'airbud') airbudJumpTime = 0;

        playerData.lifetimeStats.shots++;
        checkAchievements('shot_stats');

        const style = getCurrentStyle();
        const styleId = style.id;
        const mods = style.modifiers;

        let threshold = calculateShotThreshold();
        if (!playerData.meterEnabled) threshold *= 1.2;

        const dx = HOOP_POS.x - player3D.x; const dy = HOOP_POS.y - player3D.y;

        let spawnZ = 120;
        if (styleId === 'airbud') spawnZ = 95;
        if (styleId === 'telekinesis' || styleId === 'peekaboo') spawnZ = 130;

        let newBall = {
            x: player3D.x,
            y: player3D.y,
            z: player3D.z + spawnZ,
            vx: 0, vy: 0, vz: 0,
            active: true,
            isFire: (currentStreak >= 5 && currentGameMode !== 'TIME_ATTACK'),
            trail: [],
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            vrx: -0.2, // Backspin
            vry: (Math.random()-0.5)*0.1,
            vrz: (Math.random()-0.5)*0.1,
            isWindow: false
        };

        let flightTime = Math.min(120, 40 + (distanceLevel * 0.8));
        if(mods.speed) flightTime /= mods.speed;

        // Enforce minimum arc (parabola)
        flightTime = Math.max(32, flightTime);

        newBall.vx = (dx / flightTime); newBall.vy = (dy / flightTime); newBall.vz = (HOOP_POS.z - newBall.z + 0.5 * GRAVITY * flightTime * (flightTime - 1)) / flightTime;

        let isMiss = Math.abs(timingError) > threshold;

        // "Sur La Ligne" Bonus: 28% forgiveness zone (0.32 / 0.25 = 1.28)
        if (isMiss && Math.abs(timingError) < threshold * 1.28) {
            if(Math.random() > 0.5) { isMiss = false; feedback = "SUR LA LIGNE!"; feedbackTimer = 30; }
        }

        if (isMiss) {
            const luckChance = (playerData.stats.luck - 1) * 0.0111;
            let finalLuckChance = luckChance;
            if(mods.luckBonus) finalLuckChance *= mods.luckBonus;

            if (Math.random() < finalLuckChance) { feedback = "CHANCEUX!"; feedbackTimer = 30; checkAchievements('lucky'); }
            else {
                // Reconstruct accuracy magnitude for visuals
                // accuracy = 0.25 * (timingError / threshold)
                const accuracyMagnitude = 0.25 * (timingError / threshold);

                const len = Math.sqrt(dx*dx + dy*dy); const perpX = -dy / len; const perpY = dx / len;
                const scatter = (Math.random() > 0.5 ? 1 : -1) * Math.abs(accuracyMagnitude) * 15;
                newBall.vx += perpX * scatter; newBall.vy += perpY * scatter; newBall.vz -= Math.abs(accuracyMagnitude) * 5;

                if (Math.abs(timingError) > threshold * 3) {
                    feedback = "VITRE CASSÉE !";
                    newBall.isWindow = true;
                } else {
                    feedback = Math.abs(accuracyMagnitude) > 0.5 ? "AIRBALL" : "BRIQUE";
                    newBall.isWindow = false;
                }
                feedbackTimer = 30;
            }
        }

        activeBalls.push(newBall);

        // Legacy Sync: Update global ball for compatibility
        ball = Object.assign({}, newBall);
    }

    function handleScore(b) {
        const targetBall = b || ball;
        AudioSystem.playSwish();
        targetBall.active = false; playerData.lifetimeStats.makes++; currentStreak++;

        // Daily Challenge Hooks
        checkDailyProgress('makes', 1);
        checkDailyProgress('streak', currentStreak);

        checkAchievements('streak');
        crowdCheerTimer = 60;
        if(currentGameMode === 'CONTEST') {
            const isMoneyBall = (contestData.ballsInRack === 4);
            const points = isMoneyBall ? 2 : 1;
            contestData.score += points;
            if (currentStreak >= 3) { feedback = `SÉRIE DE ${currentStreak}!`; } else { feedback = isMoneyBall ? "MONEY BALL! (+2)" : "Swish (+1)"; }
            feedbackTimer = 30; updateContestUI(); state = 'RESETTING'; resetTimer = 30; nextAction = nextLevel;
        } else if (currentGameMode === 'TIME_ATTACK') {
             timeAttackData.score++;
             if (currentStreak >= 3) { feedback = `SÉRIE DE ${currentStreak}!`; } else { feedback = "Swish (+1)"; }
             feedbackTimer = 30; updateContestUI();
        } else {
            consecutiveMisses = 0;
            if (currentStreak >= 3) { feedback = `SÉRIE DE ${currentStreak} 🔥`; } else { feedback = "Swish"; }
            feedbackTimer = 60; state = 'RESETTING'; resetTimer = 60; nextAction = nextLevel;
        }
    }

    function handleMiss(b) {
        const targetBall = b || ball;
        if(state === 'GAMEOVER') return;
        AudioSystem.playFloorHit();
        targetBall.active = false;
        playerData.lifetimeStats.misses++; currentStreak = 0; checkAchievements('shot_stats');
        if(currentGameMode === 'CONTEST') {
            feedback = "Manqué"; feedbackTimer = 30; state = 'RESETTING'; resetTimer = 30; nextAction = nextLevel;
        } else if (currentGameMode === 'TIME_ATTACK') {
             feedback = "Manqué"; feedbackTimer = 30;
        } else {
            consecutiveMisses++; updateUI();
            const maxMisses = 2 + (playerData.stats.extraLives || 0);
            if (consecutiveMisses >= maxMisses) {
                feedback = "TERMINÉ !"; feedbackTimer = 60; state = 'GAMEOVER'; resetTimer = 90; nextAction = () => checkGameOverSequence('classic', 10 + (distanceLevel * 5));
            } else {
                feedback = "DERNIÈRE CHANCE !"; feedbackTimer = 60; state = 'RESETTING'; resetTimer = 90; nextAction = retryShot;
            }
        }
    }

    function updatePlayerAnimation(dt) {
        // dt is 1.0 at 60FPS.
        // Update Breathing
        g_breathingPhase += dt * 0.03; // ~3.5s per breath
        const breathArm = Math.sin(g_breathingPhase) * 0.05;

        // Determine Target Pose based on State
        const currentStyle = playerData.currentStyle || 'classic';
        const anim = ANIM_DATA[currentStyle] || ANIM_DATA['classic'];
        const idle = DEFAULT_IDLE;
        const lerpAngle = (a, b, t) => {
            if (Math.abs(b - a) > Math.PI) { if (b > a) a += 2 * Math.PI; else b += 2 * Math.PI; }
            return a + (b - a) * t;
        };
        const lerp = (a, b, t) => a + (b - a) * t;

        if (state === 'SHOOTING') {
            // Target is Release
            g_animTarget.la = anim.release.la;
            g_animTarget.ra = anim.release.ra;
            g_animTarget.lfa = anim.release.lfa;
            g_animTarget.rfa = anim.release.rfa;
            g_animTarget.w = anim.release.w;
            // Z-Angles (Default to 0 if missing)
            g_animTarget.la_z = anim.release.la_z || 0;
            g_animTarget.ra_z = anim.release.ra_z || 0;
            g_animTarget.lfa_z = anim.release.lfa_z || 0;
            g_animTarget.rfa_z = anim.release.rfa_z || 0;
            g_animTarget.guide_u = anim.release.guide_u !== undefined ? anim.release.guide_u : -1.7;
            g_animTarget.guide_u_z = anim.release.guide_u_z !== undefined ? anim.release.guide_u_z : 1.3;
        } else if (state === 'JUMPING') {
            let maxVz = (anim.modifiers && anim.modifiers.jumpVelocity !== undefined) ? anim.modifiers.jumpVelocity : 8.0;
            if (maxVz <= 0.1) maxVz = 1.0; // Avoid divide by zero
            let lift = Math.max(0, (maxVz - getCurrentVz()) / maxVz);
            lift = Math.min(1.0, lift);

            const startPose = anim.ready || idle;
            g_animTarget.la = lerpAngle(startPose.la, anim.set.la, lift);
            g_animTarget.ra = lerpAngle(startPose.ra, anim.set.ra, lift);
            g_animTarget.lfa = lerpAngle(startPose.lfa, anim.set.lfa, lift);
            g_animTarget.rfa = lerpAngle(startPose.rfa, anim.set.rfa, lift);
            g_animTarget.w = lerp(startPose.w, anim.set.w, lift);

            // Z-Angles Interpolation
            g_animTarget.la_z = lerp(startPose.la_z||0, anim.set.la_z||0, lift);
            g_animTarget.ra_z = lerp(startPose.ra_z||0, anim.set.ra_z||0, lift);
            g_animTarget.lfa_z = lerp(startPose.lfa_z||0, anim.set.lfa_z||0, lift);
            g_animTarget.rfa_z = lerp(startPose.rfa_z||0, anim.set.rfa_z||0, lift);

            // Guide Hand Interpolation
            // Default Start: 0.5 (Side), Default Set: -1.7 (Up/Forward)
            const startGuideU = startPose.guide_u !== undefined ? startPose.guide_u : 0.5;
            const setGuideU = anim.set.guide_u !== undefined ? anim.set.guide_u : -1.7;
            g_animTarget.guide_u = lerp(startGuideU, setGuideU, lift);

            const startGuideUZ = startPose.guide_u_z !== undefined ? startPose.guide_u_z : 0.2;
            const setGuideUZ = anim.set.guide_u_z !== undefined ? anim.set.guide_u_z : 1.3;
            g_animTarget.guide_u_z = lerp(startGuideUZ, setGuideUZ, lift);

        } else if (state === 'PRE_JUMP') {
             // Gather Pose (Ready + Crouch emphasis)
             const ready = anim.ready || idle;
             g_animTarget.la = ready.la;
             g_animTarget.ra = ready.ra;
             g_animTarget.lfa = ready.lfa;
             g_animTarget.rfa = ready.rfa;
             g_animTarget.w = ready.w;

             g_animTarget.la_z = ready.la_z || 0;
             g_animTarget.ra_z = ready.ra_z || 0;
             g_animTarget.lfa_z = ready.lfa_z || 0;
             g_animTarget.rfa_z = ready.rfa_z || 0;

             g_animTarget.guide_u = ready.guide_u !== undefined ? ready.guide_u : 0.5;
             g_animTarget.guide_u_z = ready.guide_u_z !== undefined ? ready.guide_u_z : 0.2;
        } else {
             // IDLE (With Breathing)
             g_animTarget.la = idle.la + breathArm;
             g_animTarget.ra = idle.ra - breathArm; // Opposing sway
             g_animTarget.lfa = idle.lfa + breathArm * 0.5;
             g_animTarget.rfa = idle.rfa - breathArm * 0.5;
             g_animTarget.w = idle.w;

             g_animTarget.la_z = idle.la_z || 0;
             g_animTarget.ra_z = idle.ra_z || 0;
             g_animTarget.lfa_z = idle.lfa_z || 0;
             g_animTarget.rfa_z = idle.rfa_z || 0;

             g_animTarget.guide_u = idle.guide_u !== undefined ? idle.guide_u : 0.5;
             g_animTarget.guide_u_z = idle.guide_u_z !== undefined ? idle.guide_u_z : 0.2;
        }

        // SMOOTHING (Interpolate State -> Target)
        // Using a fast lerp factor for responsiveness but smooth enough to kill snap
        const smoothFactor = Math.min(1.0, 0.25 * dt);

        g_animState.la = lerpAngle(g_animState.la, g_animTarget.la, smoothFactor);
        g_animState.ra = lerpAngle(g_animState.ra, g_animTarget.ra, smoothFactor);
        g_animState.lfa = lerpAngle(g_animState.lfa, g_animTarget.lfa, smoothFactor);
        g_animState.rfa = lerpAngle(g_animState.rfa, g_animTarget.rfa, smoothFactor);
        g_animState.w = lerp(g_animState.w, g_animTarget.w, smoothFactor);

        // Smooth Z-Angles
        g_animState.la_z = lerp(g_animState.la_z||0, g_animTarget.la_z, smoothFactor);
        g_animState.ra_z = lerp(g_animState.ra_z||0, g_animTarget.ra_z, smoothFactor);
        g_animState.lfa_z = lerp(g_animState.lfa_z||0, g_animTarget.lfa_z, smoothFactor);
        g_animState.rfa_z = lerp(g_animState.rfa_z||0, g_animTarget.rfa_z, smoothFactor);

        // Smooth Guide Hand
        const currentGuideU = g_animState.guide_u !== undefined ? g_animState.guide_u : 0.5;
        g_animState.guide_u = lerp(currentGuideU, g_animTarget.guide_u, smoothFactor);

        const currentGuideUZ = g_animState.guide_u_z !== undefined ? g_animState.guide_u_z : 0.2;
        g_animState.guide_u_z = lerp(currentGuideUZ, g_animTarget.guide_u_z, smoothFactor);
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.life -= dt;
            p.scale += (p.isFireParticle ? -0.01 : 0.05) * dt;
            p.alpha = p.life / p.maxLife;

            if (p.isFireParticle) {
                const r = p.life / p.maxLife;
                if (p.customHue !== undefined) {
                    // Dynamic Streak Fire: White -> Bright -> Base -> Dark
                    if (r > 0.8) p.color = `hsla(${p.customHue}, 100%, 95%, ${p.alpha})`;
                    else if (r > 0.5) p.color = `hsla(${p.customHue}, 100%, 75%, ${p.alpha})`;
                    else if (r > 0.2) p.color = `hsla(${p.customHue}, 100%, 50%, ${p.alpha})`;
                    else p.color = `hsla(${p.customHue}, 30%, 30%, ${p.alpha})`;
                } else {
                    // Classic Fire: White -> Yellow -> Orange -> Dark Grey
                    if (r > 0.8) p.color = `rgba(255, 255, 255, ${p.alpha})`;
                    else if (r > 0.5) p.color = `rgba(255, 255, 0, ${p.alpha})`;
                    else if (r > 0.2) p.color = `rgba(255, 69, 0, ${p.alpha})`;
                    else p.color = `rgba(50, 50, 50, ${p.alpha})`;
                }
            }

            if (p.life <= 0) {
                particles[i] = particles[particles.length - 1];
                particles.pop();
            }
        }
    }

    function update(dt) {
        if (resetTimer > 0) {
            resetTimer -= dt;
            if (resetTimer <= 0) {
                resetTimer = 0;
                if (nextAction) {
                    const action = nextAction;
                    nextAction = null;

                    // Context Safety: Save current context identity
                    // Because action() might trigger openShop() which calls loadContext(game1)
                    // If we don't restore, the rest of this update() loop and the final saveContext()
                    // will operate on the WRONG context (game1 instead of game2), corrupting state.
                    let currentCtx = null;
                    if (playerData === game1.playerData) currentCtx = game1;
                    else if (game2 && playerData === game2.playerData) currentCtx = game2;

                    action();

                    // Restore context if it was swapped
                    if (currentCtx && playerData !== currentCtx.playerData) {
                        loadContext(currentCtx);
                    }
                }
            }
        }

        updatePlayerAnimation(dt);
        updateParticles(dt);
        if (crowdCheerTimer > 0) crowdCheerTimer -= dt;
        weather.update(dt);

        // Character Streak Fire (Super Saiyan Effect)
        if (currentStreak >= 10 && state !== 'GAMEOVER') {
             const spawnCount = 2;
             for(let k=0; k<spawnCount; k++) {
                 if (Math.random() < 0.175 * dt) {
                     const hue = getStreakFireHue(currentStreak);
                     const life = 15 + Math.random() * 15;

                     // Spawn in a cylinder around player to create "outline"
                     const angle = Math.random() * Math.PI * 2;
                     const radius = 25 + Math.random() * 10;

                     particles.push({
                         x: player3D.x + Math.cos(angle) * radius,
                         y: player3D.y + Math.sin(angle) * radius * 0.4,
                         z: player3D.z + Math.random()*90,
                         vx: Math.cos(angle) * 0.5,
                         vy: Math.sin(angle) * 0.5,
                         vz: 6 + Math.random()*6, // Fast upward energy
                         life: life, maxLife: life,
                         scale: 1.5 + Math.random(),
                         alpha: 0.8,
                         isFireParticle: true,
                         customHue: hue
                     });
                 }
             }
        }

        if (state === 'SHOP' || state === 'ACHIEVEMENTS' || state === 'STATS') return;

        if (state === 'PRE_JUMP') {
            preJumpTimer -= dt * (1/60);
            if (preJumpTimer <= 0) {
                state = 'JUMPING';
                const style = getCurrentStyle();
                const jv = (style.modifiers.jumpVelocity !== undefined) ? style.modifiers.jumpVelocity : 9;

                if (jv <= 0.5) {
                    isGroundedShot = true;
                    groundShotTimer = 0;
                    player3D.vz = 0;
                } else {
                    isGroundedShot = false;
                    player3D.vz = jv;
                }
            }
        }

        if(currentGameMode === 'CONTEST' && state !== 'GAMEOVER') {
            if(contestData.timer > 0) {
                contestData.timer -= (1/60) * dt;
                if(contestData.timer <= 0) { contestData.timer = 0; endContest(); }
                if(Math.ceil(contestData.timer) !== lastDisplayedContestTime) { updateContestUI(); }
            }
        }

        if(currentGameMode === 'TIME_ATTACK' && state !== 'GAMEOVER') {
            if(timeAttackData.timer > 0) {
                timeAttackData.timer -= (1/60) * dt;
                if(timeAttackData.timer <= 0) {
                    timeAttackData.timer = 0;
                    endTimeAttack();
                }
                if(Math.ceil(timeAttackData.timer) !== lastDisplayedContestTime) { updateContestUI(); }
            }
        }
        if (state === 'JUMPING') {
            if (isGroundedShot) {
                groundShotTimer += dt;
                if (groundShotTimer > 60) {
                    shoot(20); // Force bad shot
                }
            } else {
                player3D.z += player3D.vz * dt; player3D.vz -= GRAVITY * dt;
                if (player3D.z <= 0) {
                    // Prevent Marché violation by forcing a late shot
                    player3D.z = 0; player3D.vz = 0;
                    // Calculate a penalty timing error (late release)
                    // Normal threshold is approx 1.0. We pass 5.0 to ensure a miss.
                    shoot(5.0);
                }
            }
        }
        if (state === 'SHOOTING') {
            if (playerData.currentStyle === 'airbud') airbudJumpTime += 1 * dt;
            if (player3D.z > 0) { player3D.z += player3D.vz * dt; player3D.vz -= GRAVITY * dt; if (player3D.z < 0) player3D.z = 0; }
            if (currentGameMode === 'TIME_ATTACK' && player3D.z <= 0) {
                state = 'IDLE';
                player3D.z = 0;
            }
        }

        // Process Active Balls
        for (let i = activeBalls.length - 1; i >= 0; i--) {
            let b = activeBalls[i];
            if (b.active) {
                if (b.isFire) {
                     // Update Trail
                     if (playerData.graphics === 'HIGH') {
                         if (!b.trail) b.trail = [];
                         b.trail.push({ x: b.x, y: b.y, z: b.z });
                         if (b.trail.length > 20) b.trail.shift();
                     }

                     // Emit Fire Particles
                     if (Math.random() < 1.0 * dt) {
                         const life = 20 + Math.random() * 20;
                         let customHue = undefined;
                         if (currentStreak >= 10) {
                             customHue = getStreakFireHue(currentStreak);
                         }
                         particles.push({
                             x: b.x + (Math.random()-0.5)*15,
                             y: b.y + (Math.random()-0.5)*15,
                             z: b.z + (Math.random()-0.5)*15,
                             vx: (Math.random()-0.5)*5,
                             vy: (Math.random()-0.5)*5,
                             vz: (Math.random()-0.5)*5,
                             life: life, maxLife: life,
                             scale: 0.8 + Math.random()*0.5, alpha: 1.0,
                             isFireParticle: true,
                             customHue: customHue
                         });
                    }
                } else {
                    if(b.trail && b.trail.length > 0) b.trail = [];
                }

                const prevZ = b.z;
                const prevX = b.x;
                const prevY = b.y;

                b.rotationX += (b.vrx || -0.2) * dt;
                b.rotationY += (b.vry || 0) * dt;
                b.rotationZ += (b.vrz || 0) * dt;

                b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= GRAVITY * dt;

                // Collision Logic
                if (prevZ >= HOOP_POS.z && b.z <= HOOP_POS.z) {
                    let t = 0;
                    if (prevZ !== b.z) {
                         t = (HOOP_POS.z - prevZ) / (b.z - prevZ);
                    }
                    const crossX = prevX + (b.x - prevX) * t;
                    const crossY = prevY + (b.y - prevY) * t;

                    const distToHoopCenter = Math.sqrt(Math.pow(crossX - HOOP_POS.x, 2) + Math.pow(crossY - HOOP_POS.y, 2));
                    if (distToHoopCenter < 25) { handleScore(b); continue; }

                    if (b.isWindow) {
                        AudioSystem.playWindowBreak();
                    } else if (feedback !== "AIRBALL") {
                        AudioSystem.playBrick();
                    }
                }
                const distToHoop = Math.sqrt(Math.pow(HOOP_POS.x - player3D.x, 2) + Math.pow(HOOP_POS.y - player3D.y, 2));
                const currentDist = Math.sqrt(Math.pow(b.x - player3D.x, 2) + Math.pow(b.y - player3D.y, 2));

                if (b.z < -50 || currentDist > distToHoop + 5000) { b.active = false; handleMiss(b); continue; }
                if (b.z <= 0) { b.z = 0; b.active = false; handleMiss(b); continue; }
            } else {
                activeBalls.splice(i, 1);
            }
        }
        if (feedbackTimer > 0) feedbackTimer -= 1 * dt;
    }

    // --- HELPER FUNCTIONS ---
    function nextLevel() {
        if(currentGameMode === 'CONTEST') {
            contestData.ballsInRack++;
            if(contestData.ballsInRack >= 5) {
                contestData.rack++; contestData.ballsInRack = 0;
                if(contestData.rack > 5) { endContest(); return; }
                else { setPlayerPositionForRack(contestData.rack); }
            }
            updateContestUI(); state = 'IDLE';
        } else if (currentGameMode === 'TIME_ATTACK') {
             // Continuous play, no level reset logic needed here usually
        } else {
            const baseReward = 1 * distanceLevel * playerData.difficulty;
            const multiplier = 1 + (playerData.stats.income - 1) * 0.5;
            let reward = Math.ceil(baseReward * multiplier);

            // New Streak Multiplier: +0.1x per shot in row
            if (currentStreak > 0) {
                reward = Math.ceil(reward * (1 + currentStreak * 0.1));
            }

            if (currentStreak > 1) reward += currentStreak * 2;
            playerData.tacos += reward;
            const jump = (playerData.stats.moonwalk !== undefined) ? playerData.stats.moonwalk : 1;

            // Hook Distance Challenge
            checkDailyProgress('distance', jump * 5);

            distanceLevel += jump;
            const currentDistanceVal = 10 + (distanceLevel * 5);
            if (currentDistanceVal > playerData.highScore) { playerData.highScore = currentDistanceVal; }
            saveData(); checkAchievements('score');
            player3D.x -= 15 * jump; player3D.y += 15 * jump; player3D.z = 0; player3D.vz = 0; state = 'IDLE'; updateUI();
            invalidateBackgroundCache();
        }
    }

    function endContest() {
        state = 'GAMEOVER'; feedback = "TERMINÉ !"; feedbackTimer = 120;

        // Increased Reward (x25 instead of x10)
        const reward = contestData.score * 25;
        playerData.tacos += reward;

        checkDailyProgress('contest_score', contestData.score);
        checkDailyProgress('play_contest', 1);

        checkAchievements('contest'); saveData(); resetTimer = 120; nextAction = () => checkGameOverSequence('contest', contestData.score);
    }

    function startTimeAttack() {
        timeAttackData = { timer: 60, score: 0, active: true };
        currentStreak = 0;
        activeBalls = []; // Clear any existing balls

        // 30ft Position
        player3D.x = 619; player3D.y = 207; player3D.z = 0; player3D.vz = 0;

        document.getElementById('classic-stats').style.display = 'none';

        state = 'IDLE';
        updateUI();
        updateContestUI();

        invalidateBackgroundCache();
    }

    function endTimeAttack() {
        timeAttackData.active = false;
        state = 'GAMEOVER';

        // Reward (Increased from x5 to x15)
        const reward = timeAttackData.score * 15 * playerData.difficulty;
        playerData.tacos += reward;

        checkDailyProgress('time_attack_score', timeAttackData.score);
        checkDailyProgress('play_time_attack', 1);

        // Save High Score
        let isRecord = false;
        if (!playerData.timeAttackHighScore || timeAttackData.score > playerData.timeAttackHighScore) {
            playerData.timeAttackHighScore = timeAttackData.score;
            isRecord = true;
        }

        if (isRecord) {
            feedback = `NOUVEAU RECORD: ${timeAttackData.score}!`;
        } else {
            feedback = `SCORE: ${timeAttackData.score} (RECORD: ${playerData.timeAttackHighScore})`;
        }

        feedbackTimer = 180;

        saveData();
        resetTimer = 180; nextAction = () => checkGameOverSequence('time_attack', timeAttackData.score);
    }

    function updateUI() {
        scoreEl.innerText = playerData.tacos;
        if(currentGameMode === 'CLASSIC') {
            const maxMisses = 2 + (playerData.stats.extraLives || 0);
            missValEl.innerText = `${consecutiveMisses}/${maxMisses}`;
            const dist = 10 + (distanceLevel * 5); const c = getCourtDetails(dist); courtNameEl.innerText = c.name;
        } else if (currentGameMode === 'CONTEST') {
            courtNameEl.innerText = "CONCOURS 3 POINTS";
        } else if (currentGameMode === 'TIME_ATTACK') {
            courtNameEl.innerText = "TIME ATTACK";
            // Update Timer/Score in UI loop, but title here is good
        }
    }

    function setPlayerPositionForRack(rackNum) {
        // NBA Style Semi-Circle Positions (Center @ 733, 150, Radius ~350)
        // Angles calculated relative to hoop normal vector (~153 deg)
        if(rackNum === 1) { player3D.x = 889; player3D.y = 463; } // Right Corner (Bottom-Right)
        else if(rackNum === 2) { player3D.x = 622; player3D.y = 482; } // Right Wing
        else if(rackNum === 3) { player3D.x = 420; player3D.y = 306; } // Top (Center)
        else if(rackNum === 4) { player3D.x = 401; player3D.y = 39; } // Left Wing
        else if(rackNum === 5) { player3D.x = 576; player3D.y = -163; } // Left Corner (Top-Left)

        // Correction for P2 in splitscreen if they share same coordinate space but need visual distinction?
        // Actually, they use the same world space. If P2 sees "Zone 3", it means their camera is looking at Zone 3 or they are standing there.
        // Wait, the issue description says "right player" (P2).
        // If the game logic is shared, setPlayerPositionForRack updates `player3D` of the CURRENT context.

        player3D.z = 0; player3D.vz = 0;
        invalidateBackgroundCache();
    }

    function updateContestUI() {
        // Now handled in drawBroadcastLowerThird
    }

    function startContest() {
        contestData = { timer: 60, score: 0, rack: 1, ballsInRack: 0, isActive: true };
        lastDisplayedContestTime = -1;
        currentStreak = 0;

        document.getElementById('classic-stats').style.display = 'none';

        setPlayerPositionForRack(1);

        state = 'IDLE';
        updateUI();
        updateContestUI();
        playerData.lifetimeStats.contests++;
    }

    function resetGame() {
        activeBalls = []; // Clear all balls on reset
        particles = []; // Clear particles
        if(currentGameMode === 'CONTEST') { startContest(); }
        else if(currentGameMode === 'TIME_ATTACK') { startTimeAttack(); }
        else {
            distanceLevel = 1; consecutiveMisses = 0;
            player3D = { x: 433, y: 300, z: 0, vz: 0 };
            document.getElementById('classic-stats').style.display = 'flex';
            state = 'IDLE';
            feedback = ""; feedbackTimer = 0; // Clear Marché feedback
            updateUI();
            invalidateBackgroundCache();
        }
    }

    // --- UI FUNCTIONS ---
    var g_shopTargetPlayer = 1; // 1 or 2
    var currentShopTab = 'upgrades';

    window.switchShopTab = function(tabName) {
        currentShopTab = tabName;
        // Update Tabs
        const tabs = document.querySelectorAll('.shop-tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        const activeTabBtn = Array.from(tabs).find(t => t.getAttribute('onclick').includes(tabName));
        if (activeTabBtn) activeTabBtn.classList.add('active');

        // Update Sections
        const sections = document.querySelectorAll('.shop-section');
        sections.forEach(s => s.classList.remove('active'));
        const activeSection = document.getElementById('tab-' + tabName);
        if (activeSection) activeSection.classList.add('active');
    }

    window.toggleControlsMenu = function() {
        const menuItems = document.getElementById('controls-items');
        const btn = document.querySelector('.controls-menu-toggle span');
        if (menuItems) {
            const isOpen = menuItems.classList.toggle('open');
            if (btn) btn.innerText = isOpen ? "FERMER ✕" : "MENU ☰";
        }
    }

    window.closeControlsMenu = function() {
        const menuItems = document.getElementById('controls-items');
        const btn = document.querySelector('.controls-menu-toggle span');
        if (menuItems && menuItems.classList.contains('open')) {
            menuItems.classList.remove('open');
            if (btn) btn.innerText = "MENU ☰";
        }
    }

    function getShopContext() {
        if (!isSplitscreen) return game1;
        return (g_shopTargetPlayer === 2) ? game2 : game1;
    }

    window.switchShopPlayer = function(p) {
        // Do NOT save current context state blindly here.
        // If called while the game loop is processing the OTHER player,
        // global variables might contain the other player's data.
        // Saving them into getShopContext() (which is the PREVIOUS tab)
        // would overwrite the previous player's data with the current loop's data.
        // Since we are just switching UI views, we load the new target.

        g_shopTargetPlayer = p;
        const btn1 = document.getElementById('btnShopP1');
        const btn2 = document.getElementById('btnShopP2');
        if (p === 1) {
            btn1.style.background = "#0047AB"; btn1.style.border = "2px solid #FFF";
            btn2.style.background = "#333"; btn2.style.border = "1px solid #555";
        } else {
            btn1.style.background = "#333"; btn1.style.border = "1px solid #555";
            btn2.style.background = "#0047AB"; btn2.style.border = "2px solid #FFF";
        }

        loadContext(getShopContext());
        updateShopUI();
        // We don't save here, updateShopUI just refreshes view.
        // But loadContext sets global variables, so we are now editing the new player.
    }

    window.openShop = function(force) {
        window.closeControlsMenu();
        g_shopTargetPlayer = 1; // Default to P1
        loadContext(game1);

        // If force is true (e.g. from Game Over logic), ignore state check
        if (!force && state !== 'IDLE' && state !== 'GAMEOVER') return;

        syncShopToEquipped();

        state = 'SHOP';
        if(isSplitscreen) {
            loadContext(game2); state = 'SHOP'; saveContext(game2);
            loadContext(game1); // Restore P1 for initial view
            document.getElementById('shopPlayerToggle').style.display = 'block';
            window.switchShopPlayer(1); // Set UI to P1
        } else {
            document.getElementById('shopPlayerToggle').style.display = 'none';
        }

        // Save immediately so subsequent helper calls (like updateDifficulty)
        // that use loadContext() will load the correct SHOP state.
        saveContext(game1);

        shopUI.style.display = 'block'; achUI.style.display = 'none'; statsUI.style.display = 'none';
        document.getElementById('challengesUI').style.display = 'none';
        document.getElementById('leaderboardUI').style.display = 'none';
        document.getElementById('diffSlider').value = playerData.difficulty;

        // Reset to first tab
        window.switchShopTab('upgrades');

        updateDifficulty(); updateShopUI();
        updateMobileControlsUI();
        saveContext(game1);
    }
    window.openAchievements = function() {
        window.closeControlsMenu();
        loadContext(game1);
        if(state !== 'IDLE' && state !== 'GAMEOVER') return;

        state = 'ACHIEVEMENTS';
        if(isSplitscreen) { loadContext(game2); state = 'ACHIEVEMENTS'; saveContext(game2); loadContext(game1); }

        achUI.style.display = 'block'; shopUI.style.display = 'none'; statsUI.style.display = 'none';
        document.getElementById('challengesUI').style.display = 'none';
        document.getElementById('leaderboardUI').style.display = 'none';
        renderAchievements();
        updateMobileControlsUI();
        saveContext(game1);
    }
    window.openStats = function() {
        window.closeControlsMenu();
        loadContext(game1);
        if(state !== 'IDLE' && state !== 'GAMEOVER' && state !== 'STATS') return;

        state = 'STATS';
        if(isSplitscreen) { loadContext(game2); state = 'STATS'; saveContext(game2); loadContext(game1); }

        shopUI.style.display = 'none';
        achUI.style.display = 'none';
        statsUI.style.display = 'block';
        document.getElementById('challengesUI').style.display = 'none';
        document.getElementById('leaderboardUI').style.display = 'none';
        populateInputSelects();
        const ls = playerData.lifetimeStats;
        document.getElementById('statShots').innerText = ls.shots;
        document.getElementById('statMakes').innerText = ls.makes;
        document.getElementById('statMisses').innerText = ls.misses;
        document.getElementById('statContests').innerText = ls.contests;
        document.getElementById('statBestDist').innerText = playerData.highScore + " pi";
        document.getElementById('statTimeAttack').innerText = playerData.timeAttackHighScore || 0;
        let acc = 0;
        if(ls.shots > 0) acc = ((ls.makes / ls.shots) * 100).toFixed(1);
        document.getElementById('statAccuracy').innerText = acc + "%";

        // Daily Challenge UI Update - Removed (Now in dedicated menu)

        const btnMob = document.getElementById('btnToggleMobile');
        if(btnMob) btnMob.innerText = playerData.mobileControls ? "TOUCH: ON" : "TOUCH: OFF";
        const btnGraph = document.getElementById('btnToggleGraphics');
        if(btnGraph) btnGraph.innerText = (playerData.graphics === 'HIGH') ? "QUALITÉ: HAUTE" : "QUALITÉ: BASSE";
        const btnMeter = document.getElementById('btnToggleMeter');
        if(btnMeter) btnMeter.innerText = playerData.meterEnabled ? "VISÉE: OUI" : "VISÉE: NON";
        const btnShape = document.getElementById('btnCycleMeterShape');
        if(btnShape) {
            let shapeName = playerData.meterShape || 'arc';
            btnShape.innerText = "FORME: " + shapeName.toUpperCase();
        }
        const sld = document.getElementById('meterSizeSlider');
        if(sld) {
            const sc = playerData.meterScale || 1.0;
            sld.value = sc;
            document.getElementById('meterSizeLabel').innerText = Math.round(sc*100) + "%";
        }
        const sldZoom = document.getElementById('cameraZoomSlider');
        if(sldZoom) {
            const zs = playerData.cameraZoomScale || 1.0;
            sldZoom.value = zs;
            document.getElementById('cameraZoomLabel').innerText = Math.round(zs*100) + "%";
        }
        updateMobileControlsUI();
    }
    window.toggleMeter = function() {
        playerData.meterEnabled = !playerData.meterEnabled;
        saveData(); openStats(); // Refresh UI
        saveContext(game1);
    }
    window.cycleMeterShape = function() {
        const shapes = ['arc', 'vertical', 'horizontal', 'orb', 'triangle', 'diamond', 'ring', 'chevron'];
        let idx = shapes.indexOf(playerData.meterShape);
        if (idx < 0) idx = 0;
        idx = (idx + 1) % shapes.length;
        playerData.meterShape = shapes[idx];
        saveData(); openStats(); // Refresh UI
        saveContext(game1);
    }
    window.updateMeterScale = function() {
        const val = parseFloat(document.getElementById('meterSizeSlider').value);
        playerData.meterScale = val;
        document.getElementById('meterSizeLabel').innerText = Math.round(val*100) + "%";
        saveData();
        saveContext(game1);
    }

    window.populateInputSelects = function() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const p1Sel = document.getElementById('p1InputSelect');
        const p2Sel = document.getElementById('p2InputSelect');

        if(!p1Sel || !p2Sel) return;

        const fillSelect = (sel, isP2) => {
            sel.innerHTML = '';

            const defOpt = document.createElement('option');
            defOpt.value = "-1";
            defOpt.textContent = isP2 ? "CLAVIER (ENTER)" : "CLAVIER / SOURIS";
            sel.appendChild(defOpt);

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                const opt = document.createElement('option');
                opt.value = i;

                let label = `MANETTE ${i+1}`;
                if (gp && gp.connected) {
                    let id = gp.id;
                    if(id.length > 15) id = id.substring(0,15) + "...";
                    label += ` (${id})`;
                } else {
                    label += " (Déconnectée)";
                }
                opt.textContent = label;
                sel.appendChild(opt);
            }
        };

        fillSelect(p1Sel, false);
        fillSelect(p2Sel, true);

        p1Sel.value = playerData.inputMap.p1;
        p2Sel.value = playerData.inputMap.p2;
    }

    window.updateInputMapping = function() {
        const p1Val = parseInt(document.getElementById('p1InputSelect').value);
        const p2Val = parseInt(document.getElementById('p2InputSelect').value);

        playerData.inputMap.p1 = p1Val;
        playerData.inputMap.p2 = p2Val;

        saveData();
        saveContext(game1);
    }
    window.updateReleaseTiming = function() {
        const val = parseInt(document.getElementById('releaseTimingSlider').value);
        playerData.releaseTiming = val;
        const labels = ["SAUT (TRÈS TÔT)", "POINT (TÔT)", "POUSSÉE (NORMAL)", "LÂCHER (TARD)"];
        document.getElementById('releaseTimingLabel').innerText = labels[val];
        saveData();
        saveContext(game1);
    }
    window.attemptReset = function() {
        const btn = document.getElementById('btnReset');
        if (resetStage === 0) { resetStage = 1; btn.innerText = "SÛR ? (CLIQUEZ ENCORE)"; btn.style.background = "#FF0000"; return; }

        // Nuclear Reset
        window.isResetting = true;
        localStorage.removeItem('tacoSaveData');

        playerData = createDefaultData();
        updateUI();
        closeStats();
        resetGame();
        resetStage = 0;

        btn.innerText = "RÉINITIALISER PROGRESSION"; btn.style.background = "#8B0000";
        feedback = "RESET!"; feedbackTimer = 60;

        // Ensure P1 context is updated immediately
        game1.playerData = playerData;
        if(isSplitscreen) game2.playerData = JSON.parse(JSON.stringify(playerData));

        saveContext(game1);

        // Brute force: Reload the page to ensure clean state if in-memory reset fails
        // This is a common pattern in web games for "Factory Reset" to avoid state pollution
        // Wait a short moment to show the "RESET!" feedback
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }
    window.unlockAllSkins = function() {
        if(resetStage === 0) {
            const btn = document.getElementById('btnUnlock');
            resetStage = 2; // Different stage for unlock
            btn.innerText = "SÛR ? (CLIQUEZ ENCORE)";
            btn.style.background = "#800080";
            return;
        }
        if(resetStage === 2) {
            // Unlocks everything
            SKINS_DB.forEach(skin => { if(!playerData.unlockedSkins.includes(skin.id)) playerData.unlockedSkins.push(skin.id); });
            CLOTHING_DB.forEach(c => { if(!playerData.unlockedClothing.includes(c.id)) playerData.unlockedClothing.push(c.id); });
            HATS_DB.forEach(h => { if(!playerData.unlockedHats.includes(h.id)) playerData.unlockedHats.push(h.id); });
            PANTS_DB.forEach(p => { if(!playerData.unlockedPants.includes(p.id)) playerData.unlockedPants.push(p.id); });
            SHOES_DB.forEach(s => { if(!playerData.unlockedShoes.includes(s.id)) playerData.unlockedShoes.push(s.id); });
            BALLS_DB.forEach(b => { if(!playerData.unlockedBalls.includes(b.id)) playerData.unlockedBalls.push(b.id); });
            SHOOTING_STYLES.forEach(s => { if(!playerData.unlockedStyles.includes(s.id)) playerData.unlockedStyles.push(s.id); });
            HAIRSTYLES.forEach(h => { if(!playerData.unlockedHairstyles.includes(h.id)) playerData.unlockedHairstyles.push(h.id); });

            // Max Stats
            playerData.purchasedStats.income = 5; playerData.stats.income = 5;
            playerData.purchasedStats.aim = 5; playerData.stats.aim = 5;
            playerData.purchasedStats.luck = 10; playerData.stats.luck = 10;
            playerData.purchasedStats.moonwalk = 5; playerData.stats.moonwalk = 5;
            playerData.purchasedStats.extraLives = 5; playerData.stats.extraLives = 5;

            checkAchievements('shop');
            saveData();
            updateShopUI();
            const btn = document.getElementById('btnUnlock');
            btn.innerText = "TOUT DÉBLOQUÉ !";
            btn.disabled = true;
            resetStage = 0;
            showNotification("TRICHEUR !", 0);
        }
    }

    window.closeAllMenus = function(callback) {
        // Reset Stats UI state
        resetStage = 0;
        const btn = document.getElementById('btnReset');
        if(btn) { btn.innerText = "RÉINITIALISER PROGRESSION"; btn.style.background = "#8B0000"; }

        // Close expandable HUD menu
        const menuItems = document.getElementById('controls-items');
        if (menuItems) {
            menuItems.classList.remove('open');
            const btnToggle = document.querySelector('.controls-menu-toggle span');
            if(btnToggle) btnToggle.innerText = "MENU ☰";
        }

        const resetState = (ctx) => {
            loadContext(ctx);
            if(['SHOP', 'ACHIEVEMENTS', 'STATS', 'LEADERBOARD', 'CHALLENGES'].includes(state)) {
                state = 'IDLE';
                // Only reset game if we are in a game over state that requires it
                // Includes "RECORD" for Time Attack high scores
                if(feedback === "TERMINÉ !" || feedback === "MARCHÉ!" || (feedback && feedback.includes("RECORD"))) resetGame();
            }
            saveContext(ctx);
        };

        // Important: Iterate both players to ensure clean state and prevent cross-save pollution
        resetState(game1);
        if(isSplitscreen) resetState(game2);

        shopUI.style.display = 'none';
        achUI.style.display = 'none';
        statsUI.style.display = 'none';
        document.getElementById('leaderboardUI').style.display = 'none';
        document.getElementById('challengesUI').style.display = 'none';

        // Restore P1 context for main loop
        loadContext(game1);
        updateMobileControlsUI();
        if(callback) callback();
    }

    window.closeShop = function() { window.closeAllMenus(); }
    window.closeAchievements = function() { window.closeAllMenus(); }
    window.closeStats = function() { window.closeAllMenus(); }

    window.updateDifficulty = function() {
        loadContext(getShopContext());
        const val = parseFloat(document.getElementById('diffSlider').value);
        playerData.difficulty = val;
        const label = document.getElementById('diffLabel');
        label.innerText = `x${val.toFixed(1)} Tacos`;
        if(val === 1) { label.innerText = "NORMAL (x1.0)"; label.style.color = "#00FF00"; }
        else if (val < 2.5) { label.innerText = `DIFFICILE (x${val.toFixed(1)})`; label.style.color = "#FFFF00"; }
        else { label.innerText = `LÉVIS LEGEND (x${val.toFixed(1)})`; label.style.color = "#FF0000"; }
        saveData();
        saveContext(getShopContext());
    }
    window.getUpgradeCost = function(statName) {
        const lvl = playerData.purchasedStats[statName];
        if (statName === 'income') return Math.floor(25 * Math.pow(lvl, 2));
        if (statName === 'aim') return Math.floor(50 * Math.pow(lvl, 2));
        if (statName === 'luck') return Math.floor(150 * Math.pow(lvl, 2));
        if (statName === 'moonwalk') return Math.floor(150 * Math.pow(lvl, 2));
        if (statName === 'extraLives') return Math.floor(1000 * Math.pow(2, lvl));
        return 999;
    }
    window.buyUpgrade = function(stat) {
        loadContext(getShopContext());
        if (stat === 'luck' && playerData.purchasedStats.luck >= 10) return;
        const cost = getUpgradeCost(stat);
        if (playerData.tacos >= cost) {
            playerData.tacos -= cost;
            playerData.purchasedStats[stat]++;
            playerData.stats[stat] = playerData.purchasedStats[stat]; // Auto-equip
            saveData();
            updateShopUI();
            updateUI();
            checkAchievements('shop');
            saveContext(getShopContext());
        }
    }
    window.changeStatLevel = function(stat, delta) {
        loadContext(getShopContext());
        const current = playerData.stats[stat];
        const max = playerData.purchasedStats[stat];
        const min = 0;

        let next = current + delta;
        if (next < min) next = min;
        if (next > max) next = max;

        if (next !== current) {
            playerData.stats[stat] = next;
            saveData();
            updateShopUI();
            updateUI();
            saveContext(getShopContext());
        }
    }
    // Helper to group skins
    function getSkinGroups(animal) {
        const skins = SKINS_DB.filter(s => s.animal === animal);
        const groups = {};
        const groupList = [];

        skins.forEach(s => {
            // Regex to find base: letters_letters/digits (e.g. human_lebron) ignoring _alt etc
            // But human_kobe8 and human_kobe24 should be separate.
            // Pattern: ^([a-z]+_[a-z0-9]+)
            const match = s.id.match(/^([a-z]+_[a-z0-9]+)/);
            const baseId = match ? match[1] : s.id;

            if (!groups[baseId]) {
                groups[baseId] = [];
                groupList.push(groups[baseId]);
            }
            groups[baseId].push(s);
        });
        return groupList;
    }

    window.changeAnimal = function(dir) {
        loadContext(getShopContext());
        viewingAnimalIndex += dir;
        if(viewingAnimalIndex < 0) viewingAnimalIndex = ANIMALS.length - 1;
        if(viewingAnimalIndex >= ANIMALS.length) viewingAnimalIndex = 0;
        viewingSkinIndex = 0;
        viewingVariantIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.changeSkin = function(dir) {
        loadContext(getShopContext());
        const currentAnimal = ANIMALS[viewingAnimalIndex];
        const groups = getSkinGroups(currentAnimal);

        viewingSkinIndex += dir;
        if(viewingSkinIndex < 0) viewingSkinIndex = groups.length - 1;
        if(viewingSkinIndex >= groups.length) viewingSkinIndex = 0;

        viewingVariantIndex = 0; // Reset variant when changing base skin
        updateShopUI();
        saveContext(getShopContext());
    }
    window.cycleSkinVariant = function() {
        loadContext(getShopContext());
        const currentAnimal = ANIMALS[viewingAnimalIndex];
        const groups = getSkinGroups(currentAnimal);
        const group = groups[viewingSkinIndex];

        if (group && group.length > 1) {
            viewingVariantIndex = (viewingVariantIndex + 1) % group.length;
            updateShopUI();
        }
        saveContext(getShopContext());
    }
    window.buyOrEquipSkin = function() {
        loadContext(getShopContext());
        const currentAnimal = ANIMALS[viewingAnimalIndex];
        const groups = getSkinGroups(currentAnimal);
        const group = groups[viewingSkinIndex];
        const skin = group[viewingVariantIndex];

        const isUnlocked = playerData.unlockedSkins.includes(skin.id);
        if (isUnlocked) { playerData.currentSkin = skin.id; checkAchievements('skin'); }
        else if (playerData.tacos >= skin.cost) {
            playerData.tacos -= skin.cost; playerData.unlockedSkins.push(skin.id); playerData.currentSkin = skin.id;
            checkAchievements('shop'); checkAchievements('skin');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changePants = function(dir) {
        loadContext(getShopContext());
        viewingPantsIndex += dir;
        if(viewingPantsIndex < 0) viewingPantsIndex = PANTS_DB.length - 1;
        if(viewingPantsIndex >= PANTS_DB.length) viewingPantsIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipPants = function() {
        loadContext(getShopContext());
        const pants = PANTS_DB[viewingPantsIndex];
        if(!playerData.unlockedPants) playerData.unlockedPants = ['pants_none'];

        const isUnlocked = playerData.unlockedPants.includes(pants.id);
        if (isUnlocked) {
            playerData.currentPants = pants.id;
        } else if (playerData.tacos >= pants.cost) {
            playerData.tacos -= pants.cost;
            playerData.unlockedPants.push(pants.id);
            playerData.currentPants = pants.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changeHairstyle = function(dir) {
        loadContext(getShopContext());
        viewingHairstyleIndex += dir;
        if(viewingHairstyleIndex < 0) viewingHairstyleIndex = HAIRSTYLES.length - 1;
        if(viewingHairstyleIndex >= HAIRSTYLES.length) viewingHairstyleIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipHairstyle = function() {
        loadContext(getShopContext());
        const hair = HAIRSTYLES[viewingHairstyleIndex];
        if(!playerData.unlockedHairstyles) playerData.unlockedHairstyles = ['default', 'bald'];

        const isUnlocked = playerData.unlockedHairstyles.includes(hair.id);
        if (isUnlocked) {
            playerData.customHairstyle = hair.id;
        } else if (playerData.tacos >= hair.cost) {
            playerData.tacos -= hair.cost;
            playerData.unlockedHairstyles.push(hair.id);
            playerData.customHairstyle = hair.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changeClothing = function(dir) {
        loadContext(getShopContext());
        viewingClothingIndex += dir;
        if(viewingClothingIndex < 0) viewingClothingIndex = CLOTHING_DB.length - 1;
        if(viewingClothingIndex >= CLOTHING_DB.length) viewingClothingIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipClothing = function() {
        loadContext(getShopContext());
        const clothing = CLOTHING_DB[viewingClothingIndex];
        if(!playerData.unlockedClothing) playerData.unlockedClothing = ['clothes_none'];

        const isUnlocked = playerData.unlockedClothing.includes(clothing.id);
        if (isUnlocked) {
            playerData.currentClothing = clothing.id;
        } else if (playerData.tacos >= clothing.cost) {
            playerData.tacos -= clothing.cost;
            playerData.unlockedClothing.push(clothing.id);
            playerData.currentClothing = clothing.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changeHat = function(dir) {
        loadContext(getShopContext());
        viewingHatIndex += dir;
        if(viewingHatIndex < 0) viewingHatIndex = HATS_DB.length - 1;
        if(viewingHatIndex >= HATS_DB.length) viewingHatIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipHat = function() {
        loadContext(getShopContext());
        const hat = HATS_DB[viewingHatIndex];
        if(!playerData.unlockedHats) playerData.unlockedHats = ['hat_none'];

        const isUnlocked = playerData.unlockedHats.includes(hat.id);
        if (isUnlocked) {
            playerData.currentHat = hat.id;
        } else if (playerData.tacos >= hat.cost) {
            playerData.tacos -= hat.cost;
            playerData.unlockedHats.push(hat.id);
            playerData.currentHat = hat.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changeBall = function(dir) {
        loadContext(getShopContext());
        viewingBallIndex += dir;
        if(viewingBallIndex < 0) viewingBallIndex = BALLS_DB.length - 1;
        if(viewingBallIndex >= BALLS_DB.length) viewingBallIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipBall = function() {
        loadContext(getShopContext());
        const ball = BALLS_DB[viewingBallIndex];
        if(!playerData.unlockedBalls) playerData.unlockedBalls = ['ball_classic'];

        const isUnlocked = playerData.unlockedBalls.includes(ball.id);
        if (isUnlocked) {
            playerData.currentBall = ball.id;
        }
        else if (playerData.tacos >= ball.cost) {
            playerData.tacos -= ball.cost;
            playerData.unlockedBalls.push(ball.id);
            playerData.currentBall = ball.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.changeShootingStyle = function(dir) {
        loadContext(getShopContext());
        viewingStyleIndex += dir;
        if(viewingStyleIndex < 0) viewingStyleIndex = SHOOTING_STYLES.length - 1;
        if(viewingStyleIndex >= SHOOTING_STYLES.length) viewingStyleIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipShootingStyle = function() {
        loadContext(getShopContext());
        const style = SHOOTING_STYLES[viewingStyleIndex];
        if(!playerData.unlockedStyles) playerData.unlockedStyles = ['classic']; // Safety
        const isUnlocked = playerData.unlockedStyles.includes(style.id);

        if (isUnlocked) {
            playerData.currentStyle = style.id;
        } else if (playerData.tacos >= style.cost) {
            playerData.tacos -= style.cost;
            playerData.unlockedStyles.push(style.id);
            playerData.currentStyle = style.id;
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }

    function syncShopToEquipped() {
        // Animal
        const skinId = playerData.currentSkin;
        const skinObj = SKINS_DB.find(s => s.id === skinId);
        if (skinObj) {
            const animal = skinObj.animal;
            viewingAnimalIndex = ANIMALS.indexOf(animal);
            if(viewingAnimalIndex < 0) viewingAnimalIndex = 0;

            // Skin Index
            const groups = getSkinGroups(animal);
            for(let i=0; i<groups.length; i++) {
                const group = groups[i];
                const variantIdx = group.findIndex(s => s.id === skinId);
                if(variantIdx !== -1) {
                    viewingSkinIndex = i;
                    viewingVariantIndex = variantIdx;
                    break;
                }
            }
        }

        // Hair
        if(playerData.customHairstyle) {
            viewingHairstyleIndex = HAIRSTYLES.findIndex(h => h.id === playerData.customHairstyle);
            if(viewingHairstyleIndex < 0) viewingHairstyleIndex = 0;
        }

        // Clothes
        if(playerData.currentClothing) {
            viewingClothingIndex = CLOTHING_DB.findIndex(c => c.id === playerData.currentClothing);
            if(viewingClothingIndex < 0) viewingClothingIndex = 0;
        }

        // Pants
        if(playerData.currentPants) {
            viewingPantsIndex = PANTS_DB.findIndex(p => p.id === playerData.currentPants);
            if(viewingPantsIndex < 0) viewingPantsIndex = 0;
        }

        // Hat
        if(playerData.currentHat) {
            viewingHatIndex = HATS_DB.findIndex(h => h.id === playerData.currentHat);
            if(viewingHatIndex < 0) viewingHatIndex = 0;
        }

        // Shoe
        if(playerData.currentShoes) {
            viewingShoeIndex = SHOES_DB.findIndex(s => s.id === playerData.currentShoes);
            if(viewingShoeIndex < 0) viewingShoeIndex = 0;
        }

        // Ball
        if(playerData.currentBall) {
            viewingBallIndex = BALLS_DB.findIndex(b => b.id === playerData.currentBall);
            if(viewingBallIndex < 0) viewingBallIndex = 0;
        }

        // Style
        if(playerData.currentStyle) {
            viewingStyleIndex = SHOOTING_STYLES.findIndex(s => s.id === playerData.currentStyle);
            if(viewingStyleIndex < 0) viewingStyleIndex = 0;
        }
    }

    window.updateCustomHeight = function() {
        loadContext(getShopContext());
        const val = parseFloat(document.getElementById('sldCustomHeight').value);
        if(!playerData.customSkinSettings) playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };
        playerData.customSkinSettings.height = val;
        document.getElementById('lblCustomHeight').innerText = Math.round(val * 100) + "%";
        saveData();
        saveContext(getShopContext());
    }

    window.updateCustomWidth = function() {
        loadContext(getShopContext());
        const val = parseFloat(document.getElementById('sldCustomWidth').value);
        if(!playerData.customSkinSettings) playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };
        playerData.customSkinSettings.width = val;
        document.getElementById('lblCustomWidth').innerText = Math.round(val * 100) + "%";
        saveData();
        saveContext(getShopContext());
    }

    window.updateCustomSkinTone = function() {
        loadContext(getShopContext());
        const val = parseInt(document.getElementById('sldCustomSkinTone').value);
        if(!playerData.customSkinSettings) playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };
        playerData.customSkinSettings.skinToneIndex = val;
        const color = SKIN_TONES[val];
        document.getElementById('previewSkinTone').style.background = color;
        saveData();
        saveContext(getShopContext());
    }

    window.updateCustomHairColor = function() {
        loadContext(getShopContext());
        const val = parseInt(document.getElementById('sldCustomHairColor').value);
        playerData.customHairColorIndex = val;
        const color = HAIR_COLORS[val];
        document.getElementById('previewHairColor').style.background = color;
        saveData();
        saveContext(getShopContext());
    }

    window.updateCustomHairSize = function() {
        loadContext(getShopContext());
        const val = parseFloat(document.getElementById('sldCustomHairSize').value);
        playerData.customHairLength = val;
        document.getElementById('lblCustomHairSize').innerText = Math.round(val * 100) + "%";
        saveData();
        saveContext(getShopContext());
    }

    window.toggleHandedness = function() {
        loadContext(getShopContext());
        playerData.isLefty = !playerData.isLefty;
        saveData(); updateShopUI();
        saveContext(getShopContext());
    }
    window.changeShoes = function(dir) {
        loadContext(getShopContext());
        viewingShoeIndex += dir;
        if(viewingShoeIndex < 0) viewingShoeIndex = SHOES_DB.length - 1;
        if(viewingShoeIndex >= SHOES_DB.length) viewingShoeIndex = 0;
        updateShopUI();
        saveContext(getShopContext());
    }
    window.buyOrEquipShoes = function() {
        loadContext(getShopContext());
        const shoe = SHOES_DB[viewingShoeIndex];
        if(!playerData.unlockedShoes) playerData.unlockedShoes = ['shoe_none'];

        const isUnlocked = playerData.unlockedShoes.includes(shoe.id);
        if (isUnlocked) {
            playerData.currentShoes = shoe.id;
        } else if (playerData.tacos >= shoe.cost) {
            playerData.tacos -= shoe.cost;
            playerData.unlockedShoes.push(shoe.id);
            playerData.currentShoes = shoe.id;
            checkAchievements('shop');
        }
        saveData(); updateShopUI(); updateUI();
        saveContext(getShopContext());
    }
    window.toggleMobileControls = function() {
        playerData.mobileControls = !playerData.mobileControls;
        saveData(); updateShopUI(); updateMobileControlsUI();
        const btn = document.getElementById('btnToggleMobile');
        if(btn) btn.innerText = playerData.mobileControls ? "TOUCH: ON" : "TOUCH: OFF";
        saveContext(game1);
    }
    window.toggleGraphics = function() {
        playerData.graphics = (playerData.graphics === 'HIGH') ? 'LOW' : 'HIGH';
        saveData();
        const btn = document.getElementById('btnToggleGraphics');
        if(btn) btn.innerText = (playerData.graphics === 'HIGH') ? "QUALITÉ: HAUTE" : "QUALITÉ: BASSE";
        invalidateBackgroundCache(); // Redraw background next frame
        saveContext(game1);
    }
    window.updateMobileControlsUI = function() {
        const btn = document.getElementById('mobileShootBtn');
        const btn2 = document.getElementById('mobileShootBtn2');

        const menuStates = ['SHOP', 'STATS', 'ACHIEVEMENTS', 'LEADERBOARD', 'CHALLENGES', 'HIGHSCORE_INPUT', 'STARTUP'];
        if(playerData.mobileControls && !menuStates.includes(state)) {
            btn.style.display = 'block';
            if (isSplitscreen && btn2) btn2.style.display = 'block';
            else if (btn2) btn2.style.display = 'none';
        } else {
            btn.style.display = 'none';
            if (btn2) btn2.style.display = 'none';
        }

        const splitText = document.getElementById('btnSplitText');
        if (splitText) {
             const splitBtn = splitText.parentElement;
             if (splitBtn && splitBtn.classList.contains('broadcast-btn')) {
                 splitBtn.style.display = 'block';
             }
        }
    }

    window.addEventListener("gamepadconnected", populateInputSelects);
    window.addEventListener("gamepaddisconnected", populateInputSelects);

    window.choosePlatform = function(mode) {
        AudioSystem.init();
        playerData.mobileControls = (mode === 'mobile');
        playerData.platformChosen = true;

        if (mode === 'mobile') {
            const elem = document.documentElement;
            const fsPromise = (elem.requestFullscreen) ? elem.requestFullscreen() : (elem.webkitRequestFullscreen ? elem.webkitRequestFullscreen() : null);

            if (fsPromise && fsPromise.catch) {
                fsPromise.catch(e => {
                    console.log("Fullscreen failed or rejected:", e);
                });
            }

        }

        saveData();
        startGame();
        saveContext(game1);
    }
    function checkStartup() {
        // Safety: Ensure resolution variables are defined
        if (typeof window.RESOLUTION_SCALE === 'undefined') {
            window.RESOLUTION_SCALE = 1;
            window.LOGICAL_WIDTH = 1066;
            window.LOGICAL_HEIGHT = 600;
            // Try to force resize calculation if possible
            if (typeof resizeGame === 'function') resizeGame();
        }

        if(!playerData.platformChosen) {
            state = 'STARTUP';
            document.getElementById('startup-ui').style.display = 'flex';
            document.getElementById('scorebug-container').style.display = 'none';
            document.getElementById('controls').style.display = 'none';
        } else {
            startGame();
        }
    }
    function startGame() {
        state = 'IDLE';
        document.getElementById('startup-ui').style.display = 'none';
        // Force hide High Score UI and other modals to be safe
        document.getElementById('highScoreUI').style.display = 'none';
        window.closeAllMenus(); // Ensures all other modals are closed and state is reset

        document.getElementById('scorebug-container').style.display = 'flex';
        document.getElementById('controls').style.display = 'flex';
        updateUI();
        updateMobileControlsUI();
        // Double safety check for High Score UI persistence
        setTimeout(() => {
            if(state === 'IDLE') {
                document.getElementById('highScoreUI').style.display = 'none';
            }
        }, 100);
    }
    function renderUpgradeControl(statName, containerId) {
        const active = playerData.stats[statName];
        const purchased = playerData.purchasedStats[statName];
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';

        // Down Arrow ([-]) - Visible if active level > 0
        if (active > 0) {
            html += `<button class="btn" onclick="changeStatLevel('${statName}', -1)" style="padding: 8px 12px; margin-right:5px;">⬇️</button>`;
        }

        // Up Arrow ([+]) or Buy Button
        if (active < purchased) {
            // Navigate up through owned levels
            html += `<button class="btn" onclick="changeStatLevel('${statName}', 1)" style="padding: 8px 12px;">⬆️</button>`;
        } else {
            // Buy next level
            if (statName === 'luck' && purchased >= 10) {
                html += `<button class="btn" disabled>MAX</button>`;
            } else {
                const cost = getUpgradeCost(statName);
                const disabled = playerData.tacos < cost ? 'disabled' : '';
                html += `<button class="btn" ${disabled} onclick="buyUpgrade('${statName}')">Acheter (${cost})</button>`;
            }
        }

        container.innerHTML = html;

        // Update Label Level
        const lblId = 'lvl' + statName.charAt(0).toUpperCase() + statName.slice(1);
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.innerText = active;
    }

    window.toggleSkinVariant = function() {
        if (!playerData.skinVariants) playerData.skinVariants = {};

        const currentAnimal = ANIMALS[viewingAnimalIndex];
        const animalSkins = SKINS_DB.filter(s => s.animal === currentAnimal);
        const skin = animalSkins[viewingSkinIndex];

        if (!skin) return;

        const currentVal = playerData.skinVariants[skin.id] || 0;
        playerData.skinVariants[skin.id] = (currentVal === 0) ? 1 : 0;

        saveData();
        updateShopUI();
    }

    window.updateShopUI = function() {
        document.getElementById('shopTacos').innerText = playerData.tacos;

        renderUpgradeControl('income', 'ctrl_income');
        renderUpgradeControl('aim', 'ctrl_aim');
        renderUpgradeControl('luck', 'ctrl_luck');
        renderUpgradeControl('moonwalk', 'ctrl_moonwalk');
        renderUpgradeControl('extraLives', 'ctrl_extraLives');

        // Skin UI
        const currentAnimal = ANIMALS[viewingAnimalIndex];
        const groups = getSkinGroups(currentAnimal);
        // Safety check if index out of bounds (e.g. after changing animal filter)
        if (viewingSkinIndex >= groups.length) viewingSkinIndex = 0;

        const group = groups[viewingSkinIndex];
        if (viewingVariantIndex >= group.length) viewingVariantIndex = 0;
        const skin = group[viewingVariantIndex];

        // Customization UI Logic
        const customControls = document.getElementById('customizationControls');
        if (skin.id === 'human_custom') {
            customControls.style.display = 'block';

            if(!playerData.customSkinSettings) playerData.customSkinSettings = { height: 1.0, width: 1.0, skinToneIndex: 4 };

            document.getElementById('sldCustomHeight').value = playerData.customSkinSettings.height;
            document.getElementById('lblCustomHeight').innerText = Math.round(playerData.customSkinSettings.height * 100) + "%";

            document.getElementById('sldCustomWidth').value = playerData.customSkinSettings.width;
            document.getElementById('lblCustomWidth').innerText = Math.round(playerData.customSkinSettings.width * 100) + "%";

            document.getElementById('sldCustomSkinTone').value = playerData.customSkinSettings.skinToneIndex;
            const color = SKIN_TONES[playerData.customSkinSettings.skinToneIndex];
            document.getElementById('previewSkinTone').style.background = color;
        } else {
            customControls.style.display = 'none';
        }

        // Global Hair Controls (Outside if block)
        if (typeof playerData.customHairColorIndex === 'undefined') playerData.customHairColorIndex = 0;
        document.getElementById('sldCustomHairColor').value = playerData.customHairColorIndex;
        const hairColor = HAIR_COLORS[playerData.customHairColorIndex];
        document.getElementById('previewHairColor').style.background = hairColor;

        if (typeof playerData.customHairLength === 'undefined') playerData.customHairLength = 1.0;
        document.getElementById('sldCustomHairSize').value = playerData.customHairLength;
        document.getElementById('lblCustomHairSize').innerText = Math.round(playerData.customHairLength * 100) + "%";

        document.getElementById('animalName').innerText = currentAnimal.toUpperCase();
        document.getElementById('skinName').innerText = skin.name;
        const btn = document.getElementById('btnEquipSkin');
        const status = document.getElementById('skinStatus');

        const isUnlocked = playerData.unlockedSkins.includes(skin.id);
        const isEquipped = playerData.currentSkin === skin.id;

        if (isEquipped) { status.innerText = "Équipé"; btn.style.display = 'none'; }
        else if (isUnlocked) { status.innerText = "Possédé"; btn.style.display = 'inline-block'; btn.innerText = "Équiper"; btn.disabled = false; }
        else { status.innerText = `Coût: ${skin.cost} Tacos`; btn.style.display = 'inline-block'; btn.innerText = "Acheter"; btn.disabled = playerData.tacos < skin.cost; }

        // Variant Button (Cycle Skins)
        let btnVar = document.getElementById('btnToggleVariant');
        if (!btnVar) {
            btnVar = document.createElement('button');
            btnVar.id = 'btnToggleVariant';
            btnVar.className = 'btn';
            btnVar.style.width = '100%';
            btnVar.style.marginTop = '5px';
            btnVar.style.fontSize = '0.9em';
            btnVar.style.background = '#444';
            // Insert after equip button
            btn.parentNode.insertBefore(btnVar, btn.nextSibling);
        }

        // Repurpose button for cycling skin variants
        btnVar.onclick = window.cycleSkinVariant;

        if (group.length > 1) {
            btnVar.style.display = 'inline-block';
            btnVar.innerText = `VERSION: ${viewingVariantIndex + 1} / ${group.length}`;
            btnVar.style.background = '#0047AB'; // Blue for info/action
        } else {
            // Fallback for hair variants (Style 2) - KEEP legacy support if single skin has internal variant
            if (skin.hairStyle2) {
                btnVar.style.display = 'inline-block';
                btnVar.onclick = window.toggleSkinVariant;
                const isActive = (playerData.skinVariants && playerData.skinVariants[skin.id] === 1);
                btnVar.innerText = isActive ? "COIFFURE: ALT" : "COIFFURE: ORIG";
                btnVar.style.background = isActive ? '#4CAF50' : '#444';
            } else {
                btnVar.style.display = 'none';
            }
        }

        // Hairstyle UI
        if (typeof HAIRSTYLES !== 'undefined') {
            const hair = HAIRSTYLES[viewingHairstyleIndex];
            document.getElementById('hairName').innerText = hair.name;
            const btnHair = document.getElementById('btnEquipHair');
            const statusHair = document.getElementById('hairStatus');

            if (!playerData.unlockedHairstyles) playerData.unlockedHairstyles = ['default'];
            const isUnlockedHair = playerData.unlockedHairstyles.includes(hair.id);
            const isEquippedHair = (playerData.customHairstyle === hair.id) || (hair.id === 'default' && (!playerData.customHairstyle || playerData.customHairstyle === 'default'));

            if (isEquippedHair) {
                statusHair.innerText = "Équipé";
                statusHair.style.display = 'block';
                btnHair.style.display = 'none';
            } else if (isUnlockedHair) {
                statusHair.innerText = "Possédé";
                statusHair.style.display = 'block';
                btnHair.style.display = 'inline-block';
                btnHair.innerText = "Équiper";
                btnHair.disabled = false;
                btnHair.onclick = window.buyOrEquipHairstyle;
            } else {
                statusHair.innerText = `Coût: ${hair.cost} Tacos`;
                statusHair.style.display = 'block';
                btnHair.style.display = 'inline-block';
                btnHair.innerText = "Acheter";
                btnHair.disabled = playerData.tacos < hair.cost;
                btnHair.onclick = window.buyOrEquipHairstyle;
            }
        }

        // Clothing UI
        const clothing = CLOTHING_DB[viewingClothingIndex];
        document.getElementById('clothingName').innerText = clothing.name;
        const btnClothing = document.getElementById('btnEquipClothing');
        const statusClothing = document.getElementById('clothingStatus');
        if(!playerData.unlockedClothing) playerData.unlockedClothing = ['clothes_none'];
        const isUnlockedClothing = playerData.unlockedClothing.includes(clothing.id);
        const isEquippedClothing = playerData.currentClothing === clothing.id;

        if (isEquippedClothing) { statusClothing.innerText = "Équipé"; btnClothing.style.display = 'none'; }
        else if (isUnlockedClothing) { statusClothing.innerText = "Possédé"; btnClothing.style.display = 'inline-block'; btnClothing.innerText = "Équiper"; btnClothing.disabled = false; }
        else { statusClothing.innerText = `Coût: ${clothing.cost} Tacos`; btnClothing.style.display = 'inline-block'; btnClothing.innerText = "Acheter"; btnClothing.disabled = playerData.tacos < clothing.cost; }

        // Pants UI
        const pants = PANTS_DB[viewingPantsIndex];
        document.getElementById('pantsName').innerText = pants.name;
        const btnPants = document.getElementById('btnEquipPants');
        const statusPants = document.getElementById('pantsStatus');
        if(!playerData.unlockedPants) playerData.unlockedPants = ['pants_none'];
        const isUnlockedPants = playerData.unlockedPants.includes(pants.id);
        const isEquippedPants = playerData.currentPants === pants.id;

        if (isEquippedPants) { statusPants.innerText = "Équipé"; btnPants.style.display = 'none'; }
        else if (isUnlockedPants) { statusPants.innerText = "Possédé"; btnPants.style.display = 'inline-block'; btnPants.innerText = "Équiper"; btnPants.disabled = false; }
        else { statusPants.innerText = `Coût: ${pants.cost} Tacos`; btnPants.style.display = 'inline-block'; btnPants.innerText = "Acheter"; btnPants.disabled = playerData.tacos < pants.cost; }

        // Hat UI
        const hat = HATS_DB[viewingHatIndex];
        document.getElementById('hatName').innerText = hat.name;
        const btnHat = document.getElementById('btnEquipHat');
        const statusHat = document.getElementById('hatStatus');
        if(!playerData.unlockedHats) playerData.unlockedHats = ['hat_none'];
        const isUnlockedHat = playerData.unlockedHats.includes(hat.id);
        const isEquippedHat = playerData.currentHat === hat.id;

        if (isEquippedHat) { statusHat.innerText = "Équipé"; btnHat.style.display = 'none'; }
        else if (isUnlockedHat) { statusHat.innerText = "Possédé"; btnHat.style.display = 'inline-block'; btnHat.innerText = "Équiper"; btnHat.disabled = false; }
        else { statusHat.innerText = `Coût: ${hat.cost} Tacos`; btnHat.style.display = 'inline-block'; btnHat.innerText = "Acheter"; btnHat.disabled = playerData.tacos < hat.cost; }

        // Shoes UI
        const shoe = SHOES_DB[viewingShoeIndex];
        document.getElementById('shoeName').innerText = shoe.name;
        const btnShoe = document.getElementById('btnEquipShoe');
        const statusShoe = document.getElementById('shoeStatus');
        if(!playerData.unlockedShoes) playerData.unlockedShoes = ['shoe_none'];
        const isUnlockedShoe = playerData.unlockedShoes.includes(shoe.id);
        const isEquippedShoe = playerData.currentShoes === shoe.id;

        if (isEquippedShoe) { statusShoe.innerText = "Équipé"; btnShoe.style.display = 'none'; }
        else if (isUnlockedShoe) { statusShoe.innerText = "Possédé"; btnShoe.style.display = 'inline-block'; btnShoe.innerText = "Équiper"; btnShoe.disabled = false; }
        else { statusShoe.innerText = `Coût: ${shoe.cost} Tacos`; btnShoe.style.display = 'inline-block'; btnShoe.innerText = "Acheter"; btnShoe.disabled = playerData.tacos < shoe.cost; }

        // Ball UI
        const ball = BALLS_DB[viewingBallIndex];
        document.getElementById('ballName').innerText = ball.name;
        const btnBall = document.getElementById('btnEquipBall');
        const statusBall = document.getElementById('ballStatus');
        if(!playerData.unlockedBalls) playerData.unlockedBalls = ['ball_classic'];
        const isUnlockedBall = playerData.unlockedBalls.includes(ball.id);
        const isEquippedBall = playerData.currentBall === ball.id;

        if (isEquippedBall) { statusBall.innerText = "Équipé"; btnBall.style.display = 'none'; }
        else if (isUnlockedBall) { statusBall.innerText = "Possédé"; btnBall.style.display = 'inline-block'; btnBall.innerText = "Équiper"; btnBall.disabled = false; }
        else { statusBall.innerText = `Coût: ${ball.cost} Tacos`; btnBall.style.display = 'inline-block'; btnBall.innerText = "Acheter"; btnBall.disabled = playerData.tacos < ball.cost; }

        // Style UI
        const style = SHOOTING_STYLES[viewingStyleIndex];
        document.getElementById('styleName').innerText = style.name;
        document.getElementById('styleDesc').innerText = style.desc;
        const btnStyle = document.getElementById('btnEquipStyle');
        const statusStyle = document.getElementById('styleStatus');
        const isUnlockedStyle = playerData.unlockedStyles ? playerData.unlockedStyles.includes(style.id) : (style.id === 'classic');
        const isEquippedStyle = playerData.currentStyle === style.id;

        if (isEquippedStyle) { statusStyle.innerText = "Équipé"; btnStyle.style.display = 'none'; }
        else if (isUnlockedStyle) { statusStyle.innerText = "Possédé"; btnStyle.style.display = 'inline-block'; btnStyle.innerText = "Équiper"; btnStyle.disabled = false; }
        else { statusStyle.innerText = `Coût: ${style.cost} Tacos`; btnStyle.style.display = 'inline-block'; btnStyle.innerText = "Acheter"; btnStyle.disabled = playerData.tacos < style.cost; }

        const btnHand = document.getElementById('btnToggleHand');
        btnHand.innerText = playerData.isLefty ? "MAIN: GAUCHER" : "MAIN: DROITIER";
    }
    function runForAllPlayers(callback) {
        // Run for P1
        loadContext(game1);
        callback();
        saveContext(game1);

        if (isSplitscreen) {
            // Run for P2
            loadContext(game2);
            callback();
            saveContext(game2);
        }
        // Restore P1 for UI
        loadContext(game1);
    }

    window.toggleMode = function() {
        window.closeControlsMenu();
        if(state !== 'IDLE' && state !== 'GAMEOVER') return;
        if(currentGameMode === 'CLASSIC') {
            currentGameMode = 'CONTEST';
            document.getElementById('modeBtnText').innerText = "CONCOURS";
        } else if (currentGameMode === 'CONTEST') {
            currentGameMode = 'TIME_ATTACK';
            document.getElementById('modeBtnText').innerText = "TIME ATTACK";
        } else {
            currentGameMode = 'CLASSIC';
            document.getElementById('modeBtnText').innerText = "CLASSIQUE";
        }
        runForAllPlayers(resetGame);
    }
    window.toggleMuteUI = function() {
        if (!AudioSystem.ctx) AudioSystem.init();
        const isMuted = AudioSystem.toggleMute();
        const btn = document.getElementById('btn-mute');
        if (btn) btn.innerText = isMuted ? "🔇" : "🔊";
    }
    window.prevTrack = function() {
        if (!AudioSystem.ctx) AudioSystem.init();
        AudioSystem.changeTrack(-1);
    }
    window.nextTrack = function() {
        if (!AudioSystem.ctx) AudioSystem.init();
        AudioSystem.changeTrack(1);
    }

    // --- GAME LOOP ---
    function drawStartupScene() {
        // Dark Background (Physical)
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Scale to Logical
        ctx.scale(window.RESOLUTION_SCALE, window.RESOLUTION_SCALE);

        // Calculate positions for 2D Composition using LOGICAL units
        const centerX = window.LOGICAL_WIDTH / 2;
        const centerY = window.LOGICAL_HEIGHT / 2;
        const scale = 2.0; // Base scale (Logical)

        // 1. Hoop (Right side of center)
        const hoopX = centerX + 150;
        const hoopY = centerY + 50;
        const hoopP = { x: hoopX, y: hoopY, scale: scale * 1.5 };

        // Draw Hoop Manually
        ctx.fillStyle = '#444'; ctx.fillRect(hoopX - 5, hoopY, 10, 300); // Pole
        // Backboard/Rim
        const bbW = 60 * hoopP.scale; const bbH = 40 * hoopP.scale; const bbX = hoopX - bbW/2; const bbY = hoopY - bbH - 10*hoopP.scale;
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(bbX, bbY, bbW, bbH);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2*hoopP.scale; ctx.strokeRect(bbX, bbY, bbW, bbH);
        ctx.fillStyle = '#CE1126'; ctx.fillRect(bbX + bbW*0.35, bbY + bbH*0.6, bbW*0.3, bbH*0.3);
        ctx.beginPath(); ctx.ellipse(hoopX, hoopY, 18 * hoopP.scale, 5 * hoopP.scale, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'orange'; ctx.lineWidth = 4 * hoopP.scale; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hoopX - 15*hoopP.scale, hoopY); ctx.lineTo(hoopX - 10*hoopP.scale, hoopY + 20*hoopP.scale); ctx.lineTo(hoopX + 10*hoopP.scale, hoopY + 20*hoopP.scale); ctx.lineTo(hoopX + 15*hoopP.scale, hoopY);
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1*hoopP.scale; ctx.stroke();

        // 2. Giant Taco Cat (Left side of center)
        const catX = centerX - 150;
        const catY = centerY + 50;
        const catP = { x: catX, y: catY, scale: scale * 3.5 }; // Giant
        drawDecor(catP, 'tacocat', 'default', 0.5);

        // 3. Fire Ball (In the hoop)
        const ballP = { x: hoopX, y: hoopY + 20, scale: scale * 1.5 };
        drawBallSprite(ballP.x, ballP.y, ballP.scale, true, Date.now() / -500);

        ctx.restore();
    }

    function draw() {
        if (state === 'STARTUP') {
            drawStartupScene();
            return;
        }

        if (isSplitscreen) {
            const w = canvas.width;
            const h = canvas.height;
            const halfW = w / 2;

            // Clear full canvas first? drawBackground fills rect so maybe not needed, but safe.
            // Actually drawBackground fills rect defined by args.

            // Draw P1 (Left)
            loadContext(game1);
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, halfW, h);
            ctx.clip();
            // No translation needed for left side
            ctx.scale(window.RESOLUTION_SCALE, window.RESOLUTION_SCALE);
            drawBackground(0, 0, window.LOGICAL_WIDTH / 2, window.LOGICAL_HEIGHT);
            ctx.restore();

            // Draw P2 (Right)
            loadContext(game2);
            ctx.save();
            ctx.beginPath();
            ctx.rect(halfW, 0, halfW, h);
            ctx.clip();
            ctx.translate(halfW, 0); // Move origin to middle
            ctx.scale(window.RESOLUTION_SCALE, window.RESOLUTION_SCALE);
            drawBackground(0, 0, window.LOGICAL_WIDTH / 2, window.LOGICAL_HEIGHT); // Draw as if at 0,0 with half width
            ctx.restore();

            // Divider Line
            ctx.beginPath();
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, h);
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#000';
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FFD700';
            ctx.stroke();

            // HUD
            if (typeof drawSplitscreenHUD === 'function') {
                drawSplitscreenHUD();
            }

        } else {
            loadContext(game1);
            ctx.save();
            ctx.scale(window.RESOLUTION_SCALE, window.RESOLUTION_SCALE);
            drawBackground(0, 0, window.LOGICAL_WIDTH, window.LOGICAL_HEIGHT);
            ctx.restore();
            drawBroadcastLowerThird();
        }
    }

    let lastTime = 0;
    let accumulator = 0;
    const FIXED_STEP = 1000 / 60; // 60 FPS physics (16.666ms)

    function updateEnvironment(dt) {
        clouds.forEach(c => {
             c.x += c.speed * dt;
             if(c.x > canvas.width + 200) c.x = -200;
        });
        if (typeof boatSystem !== 'undefined') {
            boatSystem.update(dt);
        }
    }

    function loop(timestamp) {
        requestAnimationFrame(loop);
        if (!lastTime) lastTime = timestamp;
        let frameTime = timestamp - lastTime;
        lastTime = timestamp;

        // Prevent spiral of death if browser hangs
        if (frameTime > 250) frameTime = 250;

        accumulator += frameTime;

        if (typeof GamepadController !== 'undefined') {
            GamepadController.update();
        }

        while (accumulator >= FIXED_STEP) {
            // update() expects dt in "frames" (1.0 = 16.66ms)
            // Since our logic was built around 1.0 being ~60fps, we pass 1.0.

            updateEnvironment(1.0);

            // Update P1
            loadContext(game1);
            update(1.0);
            saveContext(game1);

            if (isSplitscreen) {
                // Update P2
                loadContext(game2);
                update(1.0);
                saveContext(game2);
            }

            accumulator -= FIXED_STEP;
        }

        draw();
    }


    // Initial resize call
    resizeGame();
    checkStartup();

    // Start loop
    requestAnimationFrame(loop);
