    const GamepadController = {
        active: false,
        focusedElement: null,
        focusableElements: [],
        lastButtonStates: {},
        lastState: null,
        navRepeatTimer: 0,
        lastInputX: 0,
        lastInputY: 0,

        // Mapping (Standard)
        BTN_A: 0, BTN_B: 1, BTN_X: 2, BTN_Y: 3,
        BTN_UP: 12, BTN_DOWN: 13, BTN_LEFT: 14, BTN_RIGHT: 15,

        update: function() {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let anyActive = false;

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                if(!gp) continue;
                anyActive = true;

                if(!this.lastButtonStates[i]) this.lastButtonStates[i] = [];

                // Only activate if a button is pressed or previously active
                if (!this.active && gp.buttons.some(b => b.pressed)) {
                    this.active = true;
                    document.body.classList.add('gamepad-active');
                    if (window.updateButtonPrompts) window.updateButtonPrompts();
                }
            }
            if(!this.active) return;

            // Check State Change
            if (this.lastState !== state) {
                // FORCE CLEAR on state change to prevent stale navigation
                this.clearFocus();
                this.refreshFocusList();
                this.lastState = state;
                if (window.updateButtonPrompts) window.updateButtonPrompts();
            }

            for(let i=0; i<4; i++) {
                const gp = gamepads[i];
                if(!gp) continue;

                // Navigation (Any controller can navigate UI if configured or default behavior)
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
                // Input Active
                if (dx !== this.lastInputX || dy !== this.lastInputY) {
                    // New direction, reset timer to trigger immediately
                    this.navRepeatTimer = 0;
                }

                if (this.navRepeatTimer > 0) {
                    this.navRepeatTimer--;
                    if (this.navRepeatTimer === 0) {
                        // Repeat Move
                        this.performMove(dx, dy);
                        this.navRepeatTimer = 6; // Fast repeat
                    }
                } else {
                    // Initial Move
                    this.performMove(dx, dy);
                    this.navRepeatTimer = 20; // Initial delay
                }

                this.lastInputX = dx;
                this.lastInputY = dy;
            } else {
                // No Input
                this.navRepeatTimer = 0;
                this.lastInputX = 0;
                this.lastInputY = 0;
            }
        },

        performMove: function(dx, dy) {
            if (state === 'HIGHSCORE_INPUT') {
                if(dy < 0) handleHighScoreInput('UP');
                if(dy > 0) handleHighScoreInput('DOWN');
                if(dx < 0) handleHighScoreInput('LEFT');
                if(dx > 0) handleHighScoreInput('RIGHT');
            } else {
                this.moveFocus(dx, dy);
            }
        },

        moveFocus: function(dx, dy) {
            this.refreshFocusList();
            if (this.focusableElements.length === 0) return;

            // Slider Handling (Left/Right)
            if (this.focusedElement && this.focusedElement.tagName === 'INPUT' && this.focusedElement.type === 'range' && dx !== 0) {
                // If moving purely horizontally, adjust slider. If vertical component exists, allow escape.
                if (dy === 0) {
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
            }

            if (!this.focusedElement) {
                this.focusedElement = this.focusableElements[0];
                this.applyFocus();
                return;
            }

            const currentRect = this.focusedElement.getBoundingClientRect();
            const bestCandidate = this.findBestFocusCandidate(currentRect, dx, dy);

            if (bestCandidate) {
                this.focusedElement = bestCandidate;
                this.applyFocus();
            }
        },

        findBestFocusCandidate: function(currentRect, dx, dy) {
            let bestCandidate = null;
            let bestDistance = Infinity;

            const cx = currentRect.left + currentRect.width / 2;
            const cy = currentRect.top + currentRect.height / 2;

            for (const el of this.focusableElements) {
                if (el === this.focusedElement) continue;

                const rect = el.getBoundingClientRect();
                const ex = rect.left + rect.width / 2;
                const ey = rect.top + rect.height / 2;

                let isValid = false;
                // Allow some fuzziness (10px) to handle slight misalignments
                if (dy < 0) { // UP
                    if (rect.bottom <= currentRect.top + 10) isValid = true;
                } else if (dy > 0) { // DOWN
                    if (rect.top >= currentRect.bottom - 10) isValid = true;
                } else if (dx < 0) { // LEFT
                    if (rect.right <= currentRect.left + 10) isValid = true;
                } else if (dx > 0) { // RIGHT
                    if (rect.left >= currentRect.right - 10) isValid = true;
                }

                if (isValid) {
                    const dist = Math.sqrt(Math.pow(ex - cx, 2) + Math.pow(ey - cy, 2));

                    // Alignment heuristic: prefer elements orthogonally aligned
                    let alignmentOffset = 0;
                    if (dy !== 0) alignmentOffset = Math.abs(ex - cx); // Vertical move: minimize horizontal offset
                    else alignmentOffset = Math.abs(ey - cy); // Horizontal move: minimize vertical offset

                    // Weighted score: Distance + (Alignment * 2.0)
                    const score = dist + alignmentOffset * 2.0;

                    if (score < bestDistance) {
                        bestDistance = score;
                        bestCandidate = el;
                    }
                }
            }
            return bestCandidate;
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
            else if (state === 'GAMEOVER') containerSelector = '#controls'; // Partial nav

            if (!containerSelector) {
                this.clearFocus();
                return;
            }

            const container = document.querySelector(containerSelector);
            if(!container) {
                this.clearFocus();
                return;
            }

            // Check if container is visible
            const cStyle = window.getComputedStyle(container);
            if (cStyle.display === 'none' || cStyle.visibility === 'hidden') {
                if (state === 'IDLE') {
                    // IDLE might have hidden controls initially? No, usually visible.
                } else {
                    // If target container is hidden, we MUST clear the focus list to prevent
                    // navigating invisible or stale elements (like the main menu behind it).
                    this.clearFocus();
                    return;
                }
            }

            const all = Array.from(document.querySelectorAll(`${containerSelector} button, ${containerSelector} .ui-btn, ${containerSelector} input, ${containerSelector} select, ${containerSelector} .broadcast-btn, ${containerSelector} .broadcast-icon-btn`));
            this.focusableElements = all.filter(el => {
                const style = window.getComputedStyle(el);
                // Robust visibility check: display != none, visibility != hidden.
                // Removed offsetParent check as it can be flaky with fixed/absolute positioning in some contexts.
                return !el.disabled && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });

            if (!this.focusedElement || !this.focusableElements.includes(this.focusedElement)) {
                // Lost focus (e.g. element removed). Try to recover close match?
                // For now, simpler: default to first.
                if (this.focusableElements.length > 0) {
                    this.focusedElement = this.focusableElements[0];
                    this.applyFocus();
                } else {
                    this.focusedElement = null;
                }
            } else {
                // Ensure focus index is mostly irrelevant now but we keep it sync if needed?
                // No, we use object reference.
            }
        },

        applyFocus: function() {
            document.querySelectorAll('.gamepad-focus').forEach(el => el.classList.remove('gamepad-focus'));
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
                        // Special handling for Shop Upgrades (UI rebuilds)
                        // We click, then force refresh
                        this.focusedElement.click();

                        // Force refresh next frame/tick
                        setTimeout(() => {
                            this.refreshFocusList();
                        }, 50);
                    }
                }
            }

            // B Button: Back
            if (this.isPressed(gp, this.BTN_B, gpIndex)) {
                if (state === 'HIGHSCORE_INPUT') handleHighScoreInput('BACK');
                else if (state === 'SHOP') { if (window.closeShop) window.closeShop(); }
                else if (state === 'STATS') { if (window.closeStats) window.closeStats(); }
                else if (state === 'ACHIEVEMENTS') { if (window.closeAchievements) window.closeAchievements(); }
                else if (state === 'LEADERBOARD') { if (window.closeLeaderboard) window.closeLeaderboard(); }
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
