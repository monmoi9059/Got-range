    const GamepadController = {
        active: false,
        focusedElement: null,
        focusIndex: 0,
        focusableElements: [],
        lastButtonStates: {},
        lastState: null,
        navDelay: 0,

        // Mapping (Standard)
        BTN_A: 0, BTN_B: 1, BTN_X: 2, BTN_Y: 3,
        BTN_UP: 12, BTN_DOWN: 13, BTN_LEFT: 14, BTN_RIGHT: 15,

        update: function() {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let anyActive = false;

            if (this.navDelay > 0) this.navDelay--;

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                if(!gp) continue;
                anyActive = true;

                if(!this.lastButtonStates[i]) this.lastButtonStates[i] = [];

                // Only activate if a button is pressed or previously active
                if (!this.active && gp.buttons.some(b => b.pressed)) this.active = true;
            }
            if(!this.active) return;

            // Check State Change
            if (this.lastState !== state) {
                this.refreshFocusList();
                this.lastState = state;
            }

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                if(!gp) continue;

                // Navigation (Any controller can navigate UI if configured or default behavior)
                // For simplicity, we allow any controller to navigate menus to avoid lockout.
                this.handleNavigation(gp, i);

                // Actions (Strict Mapping)
                this.handleActions(gp, i);

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
        },

        handleNavigation: function(gp, gpIndex) {
            if (this.navDelay > 0) return;

            // Check D-Pad
            let dx = 0; let dy = 0;
            if (gp.buttons[12] && gp.buttons[12].pressed) dy = -1;
            if (gp.buttons[13] && gp.buttons[13].pressed) dy = 1;
            if (gp.buttons[14] && gp.buttons[14].pressed) dx = -1;
            if (gp.buttons[15] && gp.buttons[15].pressed) dx = 1;

            // Check Left Stick (Threshold 0.5)
            if (gp.axes[0] && Math.abs(gp.axes[0]) > 0.5) dx = Math.sign(gp.axes[0]);
            if (gp.axes[1] && Math.abs(gp.axes[1]) > 0.5) dy = Math.sign(gp.axes[1]);

            if (dx !== 0 || dy !== 0) {
                if (state === 'HIGHSCORE_INPUT') {
                    if(dy < 0) handleHighScoreInput('UP');
                    if(dy > 0) handleHighScoreInput('DOWN');
                    if(dx < 0) handleHighScoreInput('LEFT');
                    if(dx > 0) handleHighScoreInput('RIGHT');
                } else {
                    this.moveFocus(dx, dy);
                }
                this.navDelay = 12; // ~200ms debounce
            }
        },

        moveFocus: function(dx, dy) {
            this.refreshFocusList();
            if (this.focusableElements.length === 0) return;

            // Slider Handling (Left/Right)
            if (this.focusedElement && this.focusedElement.tagName === 'INPUT' && this.focusedElement.type === 'range' && dx !== 0) {
                const step = parseFloat(this.focusedElement.step) || 1;
                const val = parseFloat(this.focusedElement.value);
                const min = parseFloat(this.focusedElement.min);
                const max = parseFloat(this.focusedElement.max);

                let newVal = val;
                if (dx > 0) newVal = Math.min(max, val + step);
                if (dx < 0) newVal = Math.max(min, val - step);

                if (newVal !== val) {
                    this.focusedElement.value = newVal;
                    this.focusedElement.dispatchEvent(new Event('input'));
                }
                return;
            }

            let direction = dy !== 0 ? dy : dx;

            if (direction > 0) this.focusIndex++;
            else if (direction < 0) this.focusIndex--;

            if (this.focusIndex < 0) this.focusIndex = this.focusableElements.length - 1;
            if (this.focusIndex >= this.focusableElements.length) this.focusIndex = 0;

            this.applyFocus();
        },

        refreshFocusList: function() {
            let containerSelector = '';
            if (state === 'STARTUP') containerSelector = '#startup-ui';
            else if (state === 'IDLE') containerSelector = '#controls';
            else if (state === 'SHOP') containerSelector = '#shopUI';
            else if (state === 'STATS') containerSelector = '#statsUI';
            else if (state === 'ACHIEVEMENTS') containerSelector = '#achUI';
            else if (state === 'LEADERBOARD') containerSelector = '#leaderboardUI';
            else if (state === 'HIGHSCORE_INPUT') containerSelector = '#highScoreUI';

            if (!containerSelector) {
                this.clearFocus();
                return;
            }

            const container = document.querySelector(containerSelector);
            if(!container) return;

            const all = Array.from(container.querySelectorAll('button, .ui-btn, input, select'));
            this.focusableElements = all.filter(el => {
                return el.offsetParent !== null && !el.disabled && el.style.display !== 'none';
            });

            if (!this.focusedElement || !this.focusableElements.includes(this.focusedElement)) {
                this.focusIndex = 0;
                this.applyFocus();
            } else {
                this.focusIndex = this.focusableElements.indexOf(this.focusedElement);
            }
        },

        applyFocus: function() {
            document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
            this.focusedElement = this.focusableElements[this.focusIndex];
            if (this.focusedElement) {
                this.focusedElement.classList.add('gamepad-focus');
                if(this.focusedElement.scrollIntoView) {
                    this.focusedElement.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                }
            }
        },

        clearFocus: function() {
            document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
            this.focusedElement = null;
            this.focusableElements = [];
        },

        handleActions: function(gp, gpIndex) {
            // A Button: Select/Click
            if (this.isPressed(gp, this.BTN_A, gpIndex)) {
                if (state === 'HIGHSCORE_INPUT') {
                    handleHighScoreInput('SELECT');
                } else if (this.focusedElement) {
                    if(this.focusedElement.tagName === 'SELECT') {
                        const sel = this.focusedElement;
                        let idx = sel.selectedIndex + 1;
                        if(idx >= sel.options.length) idx = 0;
                        sel.selectedIndex = idx;
                        sel.dispatchEvent(new Event('change'));
                    } else {
                        this.focusedElement.click();
                        this.refreshFocusList();
                    }
                }
            }

            // B Button: Back
            if (this.isPressed(gp, this.BTN_B, gpIndex)) {
                if (state === 'HIGHSCORE_INPUT') handleHighScoreInput('BACK');
                else if (state === 'SHOP') closeShop();
                else if (state === 'STATS') closeStats();
                else if (state === 'ACHIEVEMENTS') closeAchievements();
                else if (state === 'LEADERBOARD') closeLeaderboard();
            }

            // X Button: Shoot (Game Action)
            const p1Map = (game1.playerData.inputMap && game1.playerData.inputMap.p1 !== undefined) ? game1.playerData.inputMap.p1 : -1;
            const p2Map = (game1.playerData.inputMap && game1.playerData.inputMap.p2 !== undefined) ? game1.playerData.inputMap.p2 : -1;

            if (gpIndex === p1Map) {
                if (this.isPressed(gp, this.BTN_X, gpIndex)) doGameAction(game1, 'press');
                if (this.isReleased(gp, this.BTN_X, gpIndex)) doGameAction(game1, 'release');
            }

            if (isSplitscreen && gpIndex === p2Map) {
                if (this.isPressed(gp, this.BTN_X, gpIndex)) doGameAction(game2, 'press');
                if (this.isReleased(gp, this.BTN_X, gpIndex)) doGameAction(game2, 'release');
            }
        }
    };

    function handleActionPress() {
        if (state === 'GAMEOVER') {
            if (isSplitscreen) resetGame();
            else openShop();
        } else if (state === 'IDLE') {
            startJump();
        }
    }

    // Start buttons
    const mobBtn = document.getElementById('mobileShootBtn');
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
            if (state === 'JUMPING' || state === 'PRE_JUMP') releaseShot();
        }
        saveContext(game);
    }

    var enterPressed = false;

    window.addEventListener('keydown', (e) => {
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

        if(e.code === 'KeyP') { loadContext(game1); openShop(); return; }
        if(e.code === 'KeyO') { loadContext(game1); openAchievements(); return; }
        if(e.code === 'KeyS') { loadContext(game1); openStats(); return; }
        if(e.code === 'KeyL') { loadContext(game1); openLeaderboard(); return; }

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
        if(e.target.closest('.modal') || e.target.closest('.ui-btn') || e.target.closest('.broadcast-btn') || e.target.closest('.broadcast-icon-btn')) return;

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

    // Initial resize call
    // --- SPLITSCREEN & STATE MANAGEMENT ---
