    const AudioSystem = {
        ctx: null,
        isMuted: false,
        isPlayingMusic: false,
        nextNoteTime: 0,
        beatCount: 0,
        lookahead: 25.0,
        scheduleAheadTime: 0.1,
        timerID: null,
        currentTrackIndex: 0,
        tracks: [],

        init: function() {
            if (this.ctx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            if(this.ctx.state === 'suspended') this.ctx.resume();

            this.tracks = [
                {
                    name: 'Street King (Rap)',
                    tempo: 0.17, // ~88 BPM (Standard Boom Bap)
                    totalTicks: 1024, // 64 Bars
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: C Minor
                        // Progression: Cm - Ab - Fm - G7 (Classic dramatic feel)
                        const roots = [130.81, 103.83, 87.31, 98.00];
                        const root = roots[Math.floor(bar/4)%4];

                        // SECTION: INTRO (0-7) - Simple Piano Loop
                        if (bar < 8) {
                            if (step === 0) sys.playChord(time, [root*2, root*2.4, root*3], 'triangle', 1000, 0.05);
                            if (step === 3 || step === 11) sys.playTone(time, root*4, 'sine', 0.1);
                        }
                        // SECTION: VERSE (8-23) - Beat Drops
                        else if (bar < 24) {
                            // Boom Bap Kick Pattern
                            if (step === 0 || step === 10 || (step === 7 && Math.random()>0.7)) sys.playKick(time, {freq: 55, decay: 0.6});
                            // Heavy Snare on 4 and 12
                            if (step === 4 || step === 12) sys.playSnare(time, {tone: 180, noise: 800, decay: 0.15});
                            // Closed Hat eighths with swing
                            let swing = (step % 2 === 1) ? 0.04 : 0;
                            if (step % 2 === 0) sys.playHiHat(time+swing, {freq: 4000, decay: 0.04, vol: 0.1});

                            // Sub Bass (Sine wave)
                            if (step === 0 || step === 10) sys.playTone(time, root/2, 'sine', 0.4);
                        }
                        // SECTION: CHORUS (24-39) - Full Strings & Lead
                        else if (bar < 40) {
                            if (step === 0 || step === 10 || step === 14) sys.playKick(time, {freq: 55, decay: 0.6});
                            if (step === 4 || step === 12) sys.playSnare(time, {tone: 180, noise: 1200, decay: 0.2});
                            if (step % 2 === 0) sys.playHiHat(time, {vol: 0.15});

                            // Orchestral Hits
                            if (step === 0) sys.playChord(time, [root, root*1.2, root*1.5, root*2], 'sawtooth', 800, 0.1);
                            // High Lead Whistle/Synth
                            if (step === 14) sys.playTone(time, root*8, 'sine', 0.3);
                        }
                        // SECTION: BRIDGE (40-47) - Breakbeat
                        else if (bar < 48) {
                             if (step % 2 === 0) sys.playKick(time);
                             if (step % 4 === 2) sys.playSnare(time);
                        }
                        // OUTRO (48-63) - Fade
                        else {
                            if (step === 0) sys.playChord(time, [root, root*1.2, root*1.5], 'triangle', 600, 0.05);
                        }
                    }
                },
                {
                    name: 'Trap Lord',
                    tempo: 0.11, // ~136 BPM (Fast tempo, half-time feel)
                    totalTicks: 1024,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: F Minor (Dark)
                        const root = 87.31; // F2

                        // 808 Pattern (Long decay kick)
                        // Kick on 0. Snare on 8 (Beat 3 in half-time).

                        // SECTION: INTRO (0-7) - Bell Melody
                        if (bar < 8) {
                            // Creepy Bells
                            if (step === 0) sys.playTone(time, 698.46, 'sine', 0.1); // F5
                            if (step === 3) sys.playTone(time, 523.25, 'sine', 0.1); // C5
                            if (step === 6) sys.playTone(time, 554.37, 'sine', 0.1); // Db5
                        }
                        // SECTION: DROP (8-39)
                        else if (bar < 40) {
                            // 808 Kick (Deep Sine with pitch drop)
                            if (step === 0 || (step === 10 && bar%2===0)) {
                                sys.playKick(time, {freq: 45, decay: 1.2, type: 'sine', vol: 0.8});
                            }

                            // Sharp Snare/Clap on 8
                            if (step === 8) sys.playSnare(time, {tone: 400, noise: 3000, decay: 0.1, vol: 0.4});

                            // Hi-Hat Rolls
                            // 16th notes standard
                            if (step % 2 === 0) {
                                // Random Rolls on beat 4, 12, etc
                                if ((step === 4 || step === 12) && Math.random() > 0.5) {
                                    // 32nd notes triplet burst
                                    sys.playHiHat(time, {decay: 0.02});
                                    sys.playHiHat(time + 0.033, {decay: 0.02});
                                    sys.playHiHat(time + 0.066, {decay: 0.02});
                                } else {
                                    sys.playHiHat(time, {decay: 0.03});
                                }
                            }

                            // Dark Lead
                            if (step === 0) sys.playTone(time, 349.23, 'sawtooth', 0.2); // F4
                        }
                        // SECTION: COOLDOWN (40-55)
                        else if (bar < 56) {
                            if (step === 0) sys.playTone(time, 174.61, 'sine', 0.5); // F3 Pad
                        }
                        // OUTRO
                        else {
                            if (step === 0) sys.playKick(time, {freq: 40, decay: 1.5});
                        }
                    }
                },
                {
                    name: 'Arena Legend (Rock)',
                    tempo: 0.13, // ~115 BPM
                    totalTicks: 1024,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: E Major (Guitar standard)
                        const root = 82.41; // E2

                        // Power Chords (Root + Fifth)
                        const powerChord = (rootFreq) => [rootFreq, rootFreq * 1.5];

                        // SECTION: INTRO (0-7) - Drum Solo build
                        if (bar < 8) {
                            if (step % 4 === 0) sys.playKick(time, {freq: 100, decay: 0.2});
                            if (step % 4 === 2) sys.playSnare(time, {noise: 1000, decay: 0.2});
                            if (bar > 6 && step % 1 === 0) sys.playSnare(time, {vol: (step/16)*0.5}); // Roll
                        }
                        // SECTION: VERSE (8-23) - Chug riff
                        else if (bar < 24) {
                            // Palm mute chug
                            if (step % 2 === 0) sys.playTone(time, root, 'sawtooth', 0.05);

                            // Simple beat
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 4 === 2) sys.playSnare(time);
                            if (step % 2 === 0) sys.playHiHat(time, {freq: 3000, decay: 0.1}); // Open hat
                        }
                        // SECTION: CHORUS (24-39) - Big Power Chords
                        else if (bar < 40) {
                            // Driving Beat
                            if (step === 0 || step === 10) sys.playKick(time);
                            if (step === 4 || step === 12) sys.playSnare(time);
                            if (step % 2 === 0) sys.playHiHat(time, {vol: 0.2}); // Crash cymbal approx

                            // Wall of Sound
                            if (step === 0) {
                                // E Power Chord
                                sys.playChord(time, [root, root*1.5, root*2], 'sawtooth', 2000, 0.15);
                            }
                            if (step === 6) {
                                // A Power Chord
                                sys.playChord(time, [110, 165, 220], 'sawtooth', 2000, 0.15);
                            }
                            if (step === 12) {
                                // B Power Chord
                                sys.playChord(time, [123, 185, 246], 'sawtooth', 2000, 0.15);
                            }
                        }
                        // SOLO (40-55)
                        else if (bar < 56) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 2 === 0) {
                                // Pentatonic Solo
                                let scale = [329.6, 392.0, 440.0, 493.9, 587.3, 659.3]; // E minor pentatonic
                                let note = scale[Math.floor(Math.random()*scale.length)];
                                sys.playTone(time, note, 'square', 0.1);
                            }
                        }
                        // OUTRO
                        else {
                            if (step === 0) sys.playChord(time, [root, root*1.5], 'sawtooth', 1000, 0.2); // Final chord
                        }
                    }
                }
            ];
            var _ignoreOld = [
                {
                    name: 'Lo-Fi Chill',
                    tempo: 0.2, // Seconds per 16th note (approx 75 BPM)
                    schedule: (beat, time, sys) => {
                        if (beat % 16 === 0 || beat % 16 === 10) sys.playKick(time, {freq: 150, decay: 0.5});
                        if (beat % 16 === 8) sys.playSnare(time, {tone: 250, noise: 1000});
                        if (beat % 2 === 0) sys.playHiHat(time, {freq: 7000, decay: 0.05, vol: 0.1});
                        if (beat === 0) sys.playChord(time, [261.6, 311.1, 392.0, 466.2], 'triangle', 800);
                        if (beat === 16) sys.playChord(time, [174.6, 207.7, 261.6, 311.1], 'triangle', 800);
                    }
                },
                {
                    name: 'Rock Arena',
                    tempo: 0.15, // Faster (100 BPM)
                    schedule: (beat, time, sys) => {
                        if (beat % 16 === 0 || beat % 16 === 10 || beat % 16 === 14) sys.playKick(time, {freq: 120, decay: 0.3, type:'square'});
                        if (beat % 16 === 4 || beat % 16 === 12) sys.playSnare(time, {tone: 200, noise: 800, decay: 0.2, vol: 0.3});
                        if (beat % 4 === 0) sys.playHiHat(time, {freq: 5000, decay: 0.1, vol: 0.2});
                        if (beat === 0) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 2000, 0.1); // C3 Power
                        if (beat === 16) sys.playChord(time, [110.0, 164.8, 220.0], 'sawtooth', 2000, 0.1); // A2 Power
                    }
                },
                {
                    name: 'Eye of the Taco',
                    tempo: 0.14,
                    schedule: (beat, time, sys) => {
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time);
                        if (beat % 1 === 0) sys.playHiHat(time, {vol: 0.05});
                        // Iconic riff: C... C Bb C...
                        if (beat === 0) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.1);
                        if (beat === 3) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.1);
                        if (beat === 4) sys.playChord(time, [116.5, 174.6, 233.1], 'sawtooth', 800, 0.1); // Bb
                        if (beat === 5) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.1);
                    }
                },
                {
                    name: 'Beat It (The Taco)',
                    tempo: 0.11,
                    schedule: (beat, time, sys) => {
                        // Iconic drum intro
                        if (beat % 8 === 0) sys.playKick(time, {decay: 0.2, freq: 100});
                        if (beat % 8 === 4) sys.playSnare(time, {noise: 2000, decay: 0.2});
                        if (beat % 8 === 2 || beat % 8 === 6) sys.playKick(time, {vol: 0.2});

                        // Riff (Low)
                        const riff = [146.8, 164.8, 196.0, 146.8]; // E G A E
                        if (beat % 4 === 0) sys.playTone(time, riff[(beat/4)%4], 'sawtooth', 0.1);
                    }
                },
                {
                    name: 'We Will Guac You',
                    tempo: 0.36, // Slow stomp stomp clap
                    schedule: (beat, time, sys) => {
                        // Stomp Stomp Clap (on 16th grid? No, beat here is 16th note index usually in the code)
                        // In code: beat count goes 0 to 31.
                        // Stomp (0), Stomp (2), Clap (4), Rest (6)
                        if (beat % 8 === 0) sys.playKick(time, {freq: 80, decay: 0.4, vol: 0.8});
                        if (beat % 8 === 2) sys.playKick(time, {freq: 80, decay: 0.4, vol: 0.8});
                        if (beat % 8 === 4) sys.playSnare(time, {noise: 1500, decay: 0.3, vol: 0.5});
                    }
                },
                {
                    name: 'Taco Style',
                    tempo: 0.11,
                    schedule: (beat, time, sys) => {
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time);
                        if (beat % 1 === 0) sys.playHiHat(time, {decay: 0.03});
                        // Synth stab
                        if (beat === 0 || beat === 6 || beat === 12) sys.playChord(time, [293.7, 369.9, 440.0], 'sawtooth', 2000, 0.05);
                    }
                },
                {
                    name: 'Old Town Taco',
                    tempo: 0.22,
                    schedule: (beat, time, sys) => {
                        if (beat % 16 === 0) sys.playKick(time, {freq: 60, decay: 0.8});
                        if (beat % 16 === 8) sys.playSnare(time, {tone: 200, decay: 0.1});
                        if (beat % 2 === 0) sys.playHiHat(time, {vol: 0.1, decay: 0.02});
                        if (beat % 8 === 0) sys.playHiHat(time, {vol: 0.2, decay: 0.05}); // Accent
                        // Banjo-ish pluck
                        if (beat === 0) sys.playTone(time, 196.0, 'triangle', 0.2); // G3
                        if (beat === 3) sys.playTone(time, 246.9, 'triangle', 0.2); // B3
                    }
                },
                {
                    name: 'Sweet Taco O\' Mine',
                    tempo: 0.12,
                    schedule: (beat, time, sys) => {
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time);
                        // Riff (High pitch)
                        const notes = [554.4, 830.6, 659.3, 554.4, 987.8, 554.4, 932.3, 554.4]; // Db major-ish
                        if (beat % 2 === 0) {
                            sys.playTone(time, notes[(beat/2)%8], 'square', 0.1);
                        }
                    }
                },
                {
                    name: 'Taco Queen',
                    tempo: 0.15,
                    schedule: (beat, time, sys) => {
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time);
                        if (beat % 1 === 0) sys.playHiHat(time, {vol: 0.05}); // 16th note disco high hat
                        if (beat % 2 === 1) sys.playHiHat(time, {vol: 0.15, decay: 0.1}); // Open hat on off beat
                        if (beat === 0) sys.playChord(time, [220, 277, 329], 'sine', 1000, 0.1); // A major
                        if (beat === 16) sys.playChord(time, [293, 370, 440], 'sine', 1000, 0.1); // D major
                    }
                },
                {
                    name: 'Billie Taco',
                    tempo: 0.13,
                    schedule: (beat, time, sys) => {
                        // Boom Tish Boom Tish
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time);
                        if (beat % 2 === 0) sys.playHiHat(time);

                        // Bass line: F# C# E F# E C# B C#
                        const bass = [185, 138, 164, 185, 164, 138, 123, 138];
                        if (beat % 4 === 0) {
                            sys.playTone(time, bass[(beat/4)%8], 'triangle', 0.2);
                        }
                    }
                },
                {
                    name: 'Uptown Taco',
                    tempo: 0.13,
                    schedule: (beat, time, sys) => {
                        if (beat % 4 === 0) sys.playKick(time);
                        if (beat % 4 === 2) sys.playSnare(time, {noise: 2000});
                        // Funk guitar scratch
                        if (beat % 2 === 0) sys.playHiHat(time, {freq: 2000, vol: 0.05});
                        // Horn hits
                        if (beat === 0) sys.playChord(time, [261, 329, 392, 493], 'sawtooth', 1500, 0.1);
                        if (beat === 3) sys.playChord(time, [261, 329, 392, 493], 'sawtooth', 1500, 0.1);
                    }
                },
                {
                    name: 'Despacitaco',
                    tempo: 0.17,
                    schedule: (beat, time, sys) => {
                        // Reggaeton: Kick on 0, Snare on 3, 6, 8, 11, 14...
                        // Basic: Kick (0), Snare (3), Kick (8), Snare (11) - dembow
                        // 16 step: K . . S . . . . K . . S . . . .
                        if (beat % 16 === 0) sys.playKick(time);
                        if (beat % 16 === 3) sys.playSnare(time);
                        if (beat % 16 === 8) sys.playKick(time);
                        if (beat % 16 === 11) sys.playSnare(time);

                        // Guitar melody
                        if (beat === 0) sys.playTone(time, 293, 'sine', 0.2);
                        if (beat === 6) sys.playTone(time, 220, 'sine', 0.2);
                    }
                },
                {
                    name: 'Trap Beat',
                    tempo: 0.18, // ~83 BPM
                    schedule: (beat, time, sys) => {
                        if (beat % 32 === 0 || beat % 32 === 10 || beat % 32 === 22) sys.playKick(time, {freq: 60, decay: 1.0, type: 'sine', vol: 0.8});
                        if (beat % 16 === 8) sys.playSnare(time, {tone: 400, noise: 2000, decay: 0.15, vol: 0.4});
                        if (beat % 2 === 0) {
                             if (beat === 28 || beat === 30) {
                                 sys.playHiHat(time, {freq: 8000, decay: 0.02, vol: 0.2});
                                 sys.playHiHat(time + 0.06, {freq: 8000, decay: 0.02, vol: 0.15});
                                 sys.playHiHat(time + 0.12, {freq: 8000, decay: 0.02, vol: 0.1});
                             } else {
                                 sys.playHiHat(time, {freq: 8000, decay: 0.05, vol: 0.25});
                             }
                        }
                        if (beat === 0) sys.playChord(time, [261.6, 311.1, 392.0], 'sine', 400, 0.05);
                        if (beat === 16) sys.playChord(time, [233.0, 277.1, 349.2], 'sine', 400, 0.05);
                    }
                }
            ];

            if (playerData.currentTrackIndex !== undefined) {
                this.currentTrackIndex = playerData.currentTrackIndex;
                if(this.currentTrackIndex >= this.tracks.length) this.currentTrackIndex = 0;
            }
            this.startMusic();
        },

        toggleMute: function() {
            this.isMuted = !this.isMuted;
            if(this.ctx) {
                if(this.isMuted) this.ctx.suspend();
                else this.ctx.resume();
            }
            return this.isMuted;
        },

        changeTrack: function(direction) {
            this.currentTrackIndex += direction;
            if (this.currentTrackIndex >= this.tracks.length) this.currentTrackIndex = 0;
            if (this.currentTrackIndex < 0) this.currentTrackIndex = this.tracks.length - 1;

            playerData.currentTrackIndex = this.currentTrackIndex;
            saveData();
            showNotification("🎵 " + this.tracks[this.currentTrackIndex].name, 0);
        },

        createOscillator: function(type, freq, start, dur, vol) {
            if (!this.ctx || this.isMuted) return;
            const t = this.ctx.currentTime + (start || 0);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + dur);
            return { osc, gain };
        },

        playTone: function(time, freq, type, dur) {
            this.createOscillator(type, freq, 0, dur, 0.1);
        },

        playSwish: function() {
            if (!this.ctx || this.isMuted) return;
            const t = this.ctx.currentTime;
            const dur = 0.4;
            const bufferSize = this.ctx.sampleRate * dur;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 1;
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.linearRampToValueAtTime(300, t + dur);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + dur);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(t);
        },

        playBrick: function() {
            if (!this.ctx || this.isMuted) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(250, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        },

        playFloorHit: function() {
            if (!this.ctx || this.isMuted) return;
            this.createOscillator('triangle', 80, 0, 0.1, 0.2);
        },

        playWindowBreak: function() {
            if (!this.ctx || this.isMuted) return;
            const t = this.ctx.currentTime;
            const dur = 0.6;
            const bufferSize = this.ctx.sampleRate * dur;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(t);

            for(let i=0; i<5; i++) {
                setTimeout(() => {
                    if(this.ctx && !this.isMuted) this.createOscillator('sine', 2000 + Math.random()*3000, 0, 0.1, 0.05);
                }, Math.random() * 200);
            }
        },

        playKick: function(time, opts={}) {
            if(!this.ctx || this.isMuted) return;
            const freq = opts.freq || 150;
            const decay = opts.decay || 0.5;
            const type = opts.type || 'sine';
            const vol = opts.vol || 0.4;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + decay);
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + decay);
        },

        playSnare: function(time, opts={}) {
            if(!this.ctx || this.isMuted) return;
            const toneFreq = opts.tone || 250;
            const noiseFilter = opts.noise || 1000;
            const decay = opts.decay || 0.1;
            const vol = opts.vol || 0.15;
            const type = opts.type || 'triangle';

            if (type !== 'noise_only') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(toneFreq, time);
                gain.gain.setValueAtTime(vol, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + decay);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + decay);
            }

            const dur = decay * 2;
            const bufferSize = this.ctx.sampleRate * dur;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const nGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = noiseFilter;
            nGain.gain.setValueAtTime(vol, time);
            nGain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.ctx.destination);
            noise.start(time);
        },

        playHiHat: function(time, opts={}) {
            if(!this.ctx || this.isMuted) return;
            const freq = opts.freq || 7000;
            const decay = opts.decay || 0.05;
            const vol = opts.vol || 0.1;

            const dur = decay;
            const bufferSize = this.ctx.sampleRate * dur;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = freq;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(time);
        },

        playChord: function(time, notes, type='triangle', filterFreq=800, vol=0.04) {
            if(!this.ctx || this.isMuted) return;
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;

                if (type === 'triangle') {
                    const lfo = this.ctx.createOscillator();
                    const lfoGain = this.ctx.createGain();
                    lfo.frequency.value = 2 + Math.random();
                    lfoGain.gain.value = 1.5;
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);
                    lfo.start(time);
                    lfo.stop(time + 2.0);
                }

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = filterFreq;

                gain.gain.setValueAtTime(vol, time);
                gain.gain.linearRampToValueAtTime(vol * 1.5, time + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 2.0);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(time);
                osc.stop(time + 2.0);
            });
        },

        scheduler: function() {
            if (!this.tracks || this.tracks.length === 0) return;
            const track = this.tracks[this.currentTrackIndex] || this.tracks[0];
            const beatInterval = track.tempo;

            while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
                this.scheduleNote(this.beatCount, this.nextNoteTime);
                this.nextNoteTime += beatInterval;
                this.beatCount++;
                const max = track.totalTicks || 32;
                if(this.beatCount >= max) this.beatCount = 0;
            }
            this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
        },

        scheduleNote: function(beatNumber, time) {
            const track = this.tracks[this.currentTrackIndex] || this.tracks[0];
            if(track.schedule) track.schedule(beatNumber, time, this);
        },

        startMusic: function() {
            if(this.isPlayingMusic) return;
            if(!this.ctx) return;
            this.isPlayingMusic = true;
            this.nextNoteTime = this.ctx.currentTime + 0.1;
            this.scheduler();
        },

        stopMusic: function() {
            this.isPlayingMusic = false;
            window.clearTimeout(this.timerID);
        }
    };
