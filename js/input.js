// --- START input.js ---
    // Virtual Cursor System
    const VirtualCursor = {
        element: null,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        visible: false,
        speed: 7.5,
        scrollSpeed: 7.5,

        init: function() {
            if (!document.getElementById('gamepad-cursor')) {
                this.element = document.createElement('div');
                this.element.id = 'gamepad-cursor';
                this.element.style.position = 'fixed';
                this.element.style.width = '20px';
                this.element.style.height = '20px';
                this.element.style.borderRadius = '50%';
                this.element.style.backgroundColor = 'rgba(255, 215, 0, 0.8)'; // Gold
                this.element.style.border = '2px solid white';
                this.element.style.boxShadow = '0 0 10px black';
                this.element.style.pointerEvents = 'none'; // Click-through for elementFromPoint
                this.element.style.zIndex = '999999';
                this.element.style.display = 'none';
                this.element.style.transform = 'translate(-50%, -50%)'; // Center pivot

                // Add a crosshair or simple styling
                this.element.innerHTML = '<div style="position:absolute; top:50%; left:50%; width:4px; height:4px; background:red; transform:translate(-50%,-50%); border-radius:50%;"></div>';

                document.body.appendChild(this.element);
            } else {
                this.element = document.getElementById('gamepad-cursor');
            }
        },

        updatePosition: function(dx, dy) {
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;

            this.visible = true;
            this.element.style.display = 'block';

            this.x += dx * this.speed;
            this.y += dy * this.speed;

            // Clamp to screen
            this.x = Math.max(0, Math.min(window.innerWidth, this.x));
            this.y = Math.max(0, Math.min(window.innerHeight, this.y));

            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        },

        handleScroll: function(dx, dy) {
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;

            // Find scrollable target under cursor or active modal
            // Priority: Hovered element -> Open Modal -> Window

            // 1. Try element under cursor
            // temporarily hide cursor to get element below
            this.element.style.display = 'none';
            let target = document.elementFromPoint(this.x, this.y);
            this.element.style.display = 'block';

            // Walk up to find scrollable
            let scrolled = false;
            while(target) {
                if (target.scrollHeight > target.clientHeight || target.scrollWidth > target.clientWidth) {
                    const style = window.getComputedStyle(target);
                    if (['auto', 'scroll'].includes(style.overflowY) || ['auto', 'scroll'].includes(style.overflowX)) {
                        target.scrollBy(dx * this.scrollSpeed, dy * this.scrollSpeed);
                        scrolled = true;
                        break;
                    }
                }
                target = target.parentElement;
            }

            if (!scrolled) {
                // Fallback: Check for open visible modal
                const visibleModal = document.querySelector('.modal[style*="display: block"]');
                if (visibleModal) {
                    visibleModal.scrollBy(dx * this.scrollSpeed, dy * this.scrollSpeed);
                } else {
                    window.scrollBy(dx * this.scrollSpeed, dy * this.scrollSpeed);
                }
            }
        },

        click: function() {
            this.visible = true;
            this.element.style.display = 'block';

            // Click animation
            this.element.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => this.element.style.transform = 'translate(-50%, -50%) scale(1.0)', 100);

            // Trigger click
            this.element.style.display = 'none'; // Hide to click through
            const target = document.elementFromPoint(this.x, this.y);
            this.element.style.display = 'block';

            if (target) {
                // Focus input if text
                if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                    target.focus();
                }

                // Dispatch full mouse sequence for compatibility
                const opts = { bubbles: true, cancelable: true, view: window, clientX: this.x, clientY: this.y };
                target.dispatchEvent(new MouseEvent('mousedown', opts));
                target.dispatchEvent(new MouseEvent('mouseup', opts));
                target.click();
            }
        }
    };

    const GamepadController = {
        active: false,
        lastButtonStates: {},
        lastState: null,

        // Mapping (Standard)
        BTN_A: 0, BTN_B: 1, BTN_X: 2, BTN_Y: 3,

        update: function() {
            // Initialize cursor if needed
            if (!VirtualCursor.element) VirtualCursor.init();

            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

            // We focus mainly on Player 1 for UI navigation to avoid conflict,
            // but we could allow any controller to move the cursor.
            // Let's allow any active controller to drive the cursor (last wins).

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                if(!gp) continue;

                if(!this.lastButtonStates[i]) this.lastButtonStates[i] = [];

                // Check Left Stick (Axes 0, 1) -> Cursor
                const lsX = gp.axes[0] || 0;
                const lsY = gp.axes[1] || 0;
                VirtualCursor.updatePosition(lsX, lsY);

                // Check Right Stick (Axes 2, 3) -> Scroll
                const rsX = gp.axes[2] || 0;
                const rsY = gp.axes[3] || 0;
                VirtualCursor.handleScroll(rsX, rsY);

                // Check Actions

                // A Button (0) -> Click
                if (this.isPressed(gp, this.BTN_A, i)) {
                    VirtualCursor.click();
                }

                // X Button (2) -> Shoot (Game Action)
                // We keep this specific logic for gameplay
                const p1Map = (game1.playerData.inputMap && game1.playerData.inputMap.p1 !== undefined) ? game1.playerData.inputMap.p1 : -1;
                const p2Map = (game1.playerData.inputMap && game1.playerData.inputMap.p2 !== undefined) ? game1.playerData.inputMap.p2 : -1;

                if (i === p1Map) {
                    if (this.isPressed(gp, this.BTN_X, i)) doGameAction(game1, 'press');
                    if (this.isReleased(gp, this.BTN_X, i)) doGameAction(game1, 'release');
                }

                if (isSplitscreen && i === p2Map) {
                    if (this.isPressed(gp, this.BTN_X, i)) doGameAction(game2, 'press');
                    if (this.isReleased(gp, this.BTN_X, i)) doGameAction(game2, 'release');
                }

                // B Button (1) -> Back / Close Menu
                if (this.isPressed(gp, this.BTN_B, i)) {
                    if (state === 'HIGHSCORE_INPUT') handleHighScoreInput('BACK');
                    else if (['SHOP', 'STATS', 'ACHIEVEMENTS', 'LEADERBOARD'].includes(state)) {
                        window.closeAllMenus();
                    }
                }

                // Save state
                for(let b=0; b<gp.buttons.length; b++) {
                    this.lastButtonStates[i][b] = gp.buttons[b].pressed;
                }
            }
        },

        isPressed: function(gp, btnIndex, gpIndex) {
            const lastState = this.lastButtonStates[gpIndex] || [];
            return gp.buttons[btnIndex] && gp.buttons[btnIndex].pressed && !lastState[btnIndex];
        },

        isReleased: function(gp, btnIndex, gpIndex) {
            const lastState = this.lastButtonStates[gpIndex] || [];
            return gp.buttons[btnIndex] && !gp.buttons[btnIndex].pressed && lastState[btnIndex];
        }
    };

    function handleActionPress() {
        if (state === 'GAMEOVER') {
            if (isSplitscreen) resetGame();
            else openShop();
        } else if (state === 'IDLE' || state === 'FREE_ROAM_MOVING' || state === 'FREE_ROAM_SPRINTING' || state === 'TEAM_1V1_DEFENSE') {
            if (currentGameMode === 'TEAM_1V1' && team1v1Data.possession === 'away') {
                if (typeof attemptBlock === 'function') attemptBlock();
            } else {
                startJump();
            }
        }
    }

    // Start buttons
    const mobBtn = document.getElementById('mobileShootBtn');
    if (mobBtn) {
        mobBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (isSplitscreen) {
                doGameAction(game2, 'press');
            } else {
                doGameAction(game1, 'press');
            }
        }, {passive: false});
        mobBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isSplitscreen) {
                doGameAction(game2, 'release');
            } else {
                doGameAction(game1, 'release');
            }
        }, {passive: false});
    }

    const mobBtn2 = document.getElementById('mobileShootBtn2');
    if (mobBtn2) {
        mobBtn2.addEventListener('touchstart', (e) => {
            e.preventDefault();
            doGameAction(game1, 'press');
        }, {passive: false});
        mobBtn2.addEventListener('touchend', (e) => {
            e.preventDefault();
            doGameAction(game1, 'release');
        }, {passive: false});
    }

    function doGameAction(game, type) {
        loadContext(game);
        if (type === 'press') {
            handleActionPress();
        } else if (type === 'release') {
            if (state === 'JUMPING' || state === 'PRE_JUMP' || state === 'FREE_ROAM_LAYUP' || state === 'FREE_ROAM_DUNK') releaseShot();
        } else if (type === 'pass') {
            if (typeof passBall === 'function') passBall();
        } else if (type === 'switch_player') {
            if (typeof switchPlayer === 'function') switchPlayer();
        } else if (type === 'steal') {
            if (typeof attemptSteal === 'function') attemptSteal();
        }
        saveContext(game);
    }

    var enterPressed = false;
    window.keysDown = window.keysDown || {};

    window.addEventListener('keydown', (e) => {
        window.keysDown[e.code] = true;
        // General Keyboard Accessibility for Custom Buttons
        if (e.code === 'Enter' || e.code === 'Space') {
            const active = document.activeElement;
            if (active && (active.classList.contains('broadcast-btn') || active.classList.contains('broadcast-icon-btn'))) {
                if (e.code === 'Space') e.preventDefault(); // Prevent scroll
                active.click();
                active.classList.add('active-key');
                setTimeout(() => active.classList.remove('active-key'), 100);
                return;
            }
        }

        // High Score / UI Handling
        if (state === 'HIGHSCORE_INPUT') {
            loadContext(game1);
            if (e.code === 'ArrowUp') handleHighScoreInput('UP');
            if (e.code === 'ArrowDown') handleHighScoreInput('DOWN');
            if (e.code === 'ArrowLeft') handleHighScoreInput('LEFT');
            if (e.code === 'ArrowRight') handleHighScoreInput('RIGHT');
            if (e.code === 'Enter') handleHighScoreInput('SELECT');
            if (e.code === 'Backspace') handleHighScoreInput('BACK');
            saveContext(game1);
            return;
        }

        // Global UI Toggles (P1 only for simplicity)
        if(state === 'SHOP') { if(e.code === 'Escape') { loadContext(game1); closeShop(); return; } }
        if(state === 'ACHIEVEMENTS') { if(e.code === 'Escape') { loadContext(game1); closeAchievements(); return; } }
        if(state === 'STATS') { if(e.code === 'Escape') { loadContext(game1); closeStats(); return; } }
        if(state === 'LEADERBOARD') { if(e.code === 'Escape') { loadContext(game1); closeLeaderboard(); return; } }
        if(state === 'CHALLENGES') { if(e.code === 'Escape') { loadContext(game1); window.closeAllMenus(); return; } }

        if(e.code === 'KeyP') { loadContext(game1); openShop(); return; }
        if(e.code === 'KeyO') { loadContext(game1); openAchievements(); return; }
        if(e.code === 'KeyS') {
            loadContext(game1);
            if (currentGameMode !== 'FREE_ROAM' && currentGameMode !== 'TEAM_1V1') {
                openStats(); return;
            }
        }
        if(e.code === 'KeyL') { loadContext(game1); openLeaderboard(); return; }
        if(e.code === 'KeyC') { loadContext(game1); openChallenges(); return; }

        if (currentGameMode === 'TEAM_1V1') {
            if (e.code === 'KeyE') {
                loadContext(game1);
                if (team1v1Data.possession === 'home') {
                    doGameAction(game1, 'pass');
                } else {
                    doGameAction(game1, 'switch_player');
                }
                saveContext(game1);
            }
            if (e.code === 'KeyQ') {
                loadContext(game1);
                if (team1v1Data.possession === 'away') {
                    doGameAction(game1, 'steal');
                }
                saveContext(game1);
            }
        }

        // P1 Action
        if (e.code === 'Space' && !spacePressed) {
            spacePressed = true;
            doGameAction(game1, 'press');
        }

        // P2 Action
        if (isSplitscreen && e.code === 'Enter' && !enterPressed) {
            enterPressed = true;
            doGameAction(game2, 'press');
        }
    });

    window.addEventListener('keyup', (e) => {
        window.keysDown[e.code] = false;
        if (e.code === 'Space') {
            spacePressed = false;
            doGameAction(game1, 'release');
        }
        if (isSplitscreen && e.code === 'Enter') {
            enterPressed = false;
            doGameAction(game2, 'release');
        }
    });

    window.addEventListener('mousedown', (e) => {
        // Hide virtual cursor on real mouse interaction
        if (typeof VirtualCursor !== 'undefined' && VirtualCursor.element) {
            VirtualCursor.visible = false;
            VirtualCursor.element.style.display = 'none';
        }

        if(e.target.closest('.modal') || e.target.closest('#startup-ui') || e.target.closest('.ui-btn') || e.target.closest('.broadcast-btn') || e.target.closest('.broadcast-icon-btn')) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;

        // P1 Mouse Control (Default) or P2 if on right side in splitscreen
        if (isSplitscreen && x > canvas.width / 2) {
             doGameAction(game2, 'press');
        } else {
             // Check mobile flag inside context?
             loadContext(game1);
             if (state === 'IDLE' && playerData.mobileControls) { saveContext(game1); return; }
             saveContext(game1);

             doGameAction(game1, 'press');
        }
    });
    window.addEventListener('mouseup', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;

        if (isSplitscreen && x > canvas.width / 2) {
             doGameAction(game2, 'release');
        } else {
            loadContext(game1);
            if (state === 'JUMPING' && playerData.mobileControls) { saveContext(game1); return; }
            saveContext(game1);

            doGameAction(game1, 'release');
        }
    });

    // Handle Page Visibility (Mute audio on background)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (AudioSystem.ctx && AudioSystem.ctx.state === 'running') {
                AudioSystem.ctx.suspend();
            }
        } else {
            // Only resume if user hasn't explicitly muted it
            if (AudioSystem.ctx && !AudioSystem.isMuted && AudioSystem.ctx.state === 'suspended') {
                AudioSystem.ctx.resume();
            }
        }
    });

// --- END input.js ---
