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
                    name: 'Seven Nation Taco',
                    tempo: 0.125, // ~120 BPM
                    totalTicks: 2048, // 128 bars
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: E Minor
                        // Riff: E G E D C B
                        // Notes: E2=82.4, G2=98.0, D2=73.4, C2=65.4, B1=61.7

                        const playRiff = (octave=1, type='sine', vol=0.3) => {
                            const notes = [
                                {s: 0, n: 82.4*octave}, {s: 3, n: 82.4*octave}, {s: 4, n: 98.0*octave},
                                {s: 6, n: 82.4*octave}, {s: 8, n: 73.4*octave}, {s: 10, n: 65.4*octave}, {s: 12, n: 61.7*octave}
                            ];
                            const note = notes.find(n => n.s === step);
                            if (note) sys.playTone(time, note.n, type, 0.2); // vol handles inside playTone? No, playTone is fixed vol 0.1.
                            // Custom call for volume control if needed, but standard is fine.
                        };

                        // DRUMS
                        if (bar >= 8) { // Drums enter at bar 8
                            if (step % 4 === 0) sys.playKick(time);
                            if (bar >= 16 && step % 8 === 4) sys.playSnare(time); // Snare enters bar 16
                            if (bar >= 32 && step % 2 === 0) sys.playHiHat(time); // Hi-hat enters bar 32
                        }

                        // RIFF
                        if (bar < 8) {
                            playRiff(1, 'sine'); // Intro: simple bass
                        } else if (bar < 16) {
                            playRiff(1, 'sawtooth'); // Lounder bass
                        } else if (bar < 32) {
                            playRiff(1, 'sawtooth'); // Full band build
                            playRiff(2, 'square'); // Guitar octave
                        } else if (bar < 48) {
                            // Chorus / Solo
                            playRiff(2, 'sawtooth');
                            if (step % 4 === 0) sys.playChord(time, [164.8, 196.0, 246.9], 'sawtooth', 2000, 0.1); // Power chords
                        } else if (bar < 64) {
                            // Breakdown
                            if (step === 0) sys.playTone(time, 82.4, 'sine', 1.0); // Long bass drone
                        } else {
                            // Outro
                            playRiff(1, 'sine');
                        }
                    }
                },
                {
                    name: 'Sirius Taco',
                    tempo: 0.11, // ~136 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: C Minor
                        // Arp: C Eb G C (C3, Eb3, G3, C4)
                        const arp = [130.8, 155.6, 196.0, 261.6];

                        // BACKGROUND PAD
                        if (step === 0 && bar < 64) {
                             sys.playTone(time, 65.4, 'sawtooth', 2.0); // C2 drone
                        }

                        // ARPEGGIO (The iconic part)
                        if (bar >= 4) {
                            sys.playTone(time, arp[step % 4], 'sine', 0.1);
                        }

                        // BASS HITS
                        if (bar >= 16 && bar < 48) {
                             if (step === 0) sys.playKick(time, {freq: 100, decay: 0.8});
                             if (step === 8) sys.playSnare(time, {noise: 1000});
                        }

                        // MELODY (Synth Brass)
                        if (bar >= 32 && bar < 64) {
                            // Simple melody over the arp
                            if (step === 0) sys.playTone(time, 523.2, 'sawtooth', 0.4); // C5
                            if (step === 12) sys.playTone(time, 466.2, 'sawtooth', 0.4); // Bb4
                        }
                    }
                },
                {
                    name: 'Space Taco',
                    tempo: 0.127, // ~118 BPM (Eurodance)
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: D Minor

                        // DRUMS
                        if (bar >= 4 && bar < 60) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 8 === 4) sys.playSnare(time);
                            if (step % 2 === 0) sys.playHiHat(time);
                        }

                        // INTRO BUILD
                        if (bar < 4) {
                            if (step % 4 === 0) sys.playTone(time, 146.8, 'sawtooth', 0.1); // D3 pulsing
                        }
                        // MAIN THEME
                        else if (bar < 32) {
                            // "Y'all ready for this" riff simulation
                            // D F G A
                            if (step === 0) sys.playTone(time, 293.7, 'square', 0.1);
                            if (step === 2) sys.playTone(time, 349.2, 'square', 0.1);
                            if (step === 4) sys.playTone(time, 392.0, 'square', 0.1);
                            if (step === 6) sys.playTone(time, 440.0, 'square', 0.1);
                        }
                        // BREAKDOWN
                        else if (bar < 48) {
                             if (step % 8 === 0) sys.playChord(time, [146.8, 174.6, 220.0], 'sawtooth', 800, 0.2); // Dm hit
                        }
                        // FINAL CHORUS
                        else {
                             if (step % 4 === 0) sys.playKick(time);
                             if (step === 0) sys.playTone(time, 293.7, 'square', 0.1);
                             if (step === 2) sys.playTone(time, 587.3, 'square', 0.1); // Octave jump
                        }
                    }
                },
                {
                    name: 'Taco Nation',
                    tempo: 0.107, // ~140 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: B Minor (Kernkraft 400 is usually B major/minor ambiguous but sounds minor)

                        // MELODY: B B B D A B, B A F#
                        // Notes: B4=493.9, D5=587.3, A4=440.0, F#4=370.0
                        const melody = [
                            {s: 0, n: 493.9}, {s: 2, n: 493.9}, {s: 4, n: 493.9},
                            {s: 6, n: 587.3}, {s: 8, n: 440.0}, {s: 10, n: 493.9},
                            {s: 12, n: 493.9}, {s: 14, n: 440.0} // first half
                        ];
                        const melody2 = [
                            {s: 0, n: 370.0} // second half landing note usually
                        ];

                        // DRUMS
                        if (bar >= 8) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 4 === 2) sys.playHiHat(time);
                        }

                        // LEAD
                        if (bar >= 4 && bar < 64) {
                            const note = melody.find(n => n.s === step);
                            if (note) sys.playTone(time, note.n, 'sawtooth', 0.15);
                            if (step === 0 && bar % 2 === 1) sys.playTone(time, 370.0, 'sawtooth', 0.15); // Landing F# on odd bars
                        }
                    }
                },
                {
                    name: 'Final Taco-down',
                    tempo: 0.127, // ~118 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: F# Minor
                        // Riff: F# E D E...
                        // F#4=370.0, E4=329.6, D4=293.7, C#4=277.2

                        const riff = [
                            // Bar 0: F# (0), E (2), D (4), E (12) -- simplified
                            {b: 0, s: 0, n: 370.0}, {b: 0, s: 2, n: 329.6}, {b: 0, s: 4, n: 293.7}, {b: 0, s: 12, n: 329.6},
                            // Bar 1: F# (0)...
                            {b: 1, s: 0, n: 370.0}
                        ];

                        const localBar = bar % 4; // 4 bar phrases
                        const note = riff.find(n => n.b === localBar && n.s === step);

                        // SYNTH BRASS
                        if (bar >= 4 && bar < 32 && note) {
                            sys.playTone(time, note.n, 'sawtooth', 0.2);
                        }

                        // GALLOP BASS
                        if (bar >= 8) {
                            if (step % 4 === 0) sys.playTone(time, 92.5, 'square', 0.1); // F#2
                            if (step % 4 === 2) sys.playTone(time, 92.5, 'square', 0.1);
                            if (step % 4 === 3) sys.playTone(time, 92.5, 'square', 0.1);
                        }

                        // DRUMS
                        if (bar >= 8) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 8 === 4) sys.playSnare(time);
                        }
                    }
                },
                {
                    name: 'Eye of the Taco',
                    tempo: 0.14, // ~107 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: C Minor
                        // C (punch) ... C Bb C (punch) ... C Bb C (punch) ... G Ab (punch)

                        // INTRO / RIFF
                        if (bar < 16 || (bar >= 32 && bar < 48)) {
                            // Muted guitar chug
                            if (step % 2 === 0) sys.playTone(time, 130.8, 'square', 0.05);

                            // The Hits
                            if (bar % 4 === 0 && step === 0) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.2); // C
                            if (bar % 4 === 0 && step === 12) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.2); // C
                            if (bar % 4 === 1 && step === 0) sys.playChord(time, [116.5, 174.6, 233.1], 'sawtooth', 800, 0.2); // Bb
                            if (bar % 4 === 1 && step === 4) sys.playChord(time, [130.8, 196.0, 261.6], 'sawtooth', 800, 0.2); // C
                        }

                        // DRUMS
                        if (bar >= 4) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 4 === 2) sys.playSnare(time);
                        }
                    }
                },
                {
                    name: 'We Will Guac You',
                    tempo: 0.36, // ~83 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 8; // Working in 8th notes effectively due to slow tempo

                        // STOMP STOMP CLAP
                        if (step === 0) sys.playKick(time, {freq: 60, decay: 0.3, vol: 0.8});
                        if (step === 2) sys.playKick(time, {freq: 60, decay: 0.3, vol: 0.8});
                        if (step === 4) sys.playSnare(time, {noise: 2000, decay: 0.3, vol: 0.6});

                        // GUITAR SOLO (Bar 16+)
                        if (bar >= 16) {
                            // Pentatonic E major riffing
                            if (step % 2 === 0 && Math.random() > 0.3) {
                                const notes = [329.6, 392.0, 440.0, 493.9, 587.3];
                                sys.playTone(time, notes[Math.floor(Math.random()*notes.length)], 'sawtooth', 0.2);
                            }
                        }
                    }
                },
                {
                    name: 'Beat It (The Taco)',
                    tempo: 0.11, // ~138 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: Eb Minor
                        // Riff: Eb Gb Ab Bb Ab Gb Eb...

                        // GONG INTRO
                        if (beat === 0) sys.playChord(time, [77.7, 155.6, 233.1], 'sine', 200, 0.8); // Deep crash

                        // RIFF
                        if (bar >= 4 && bar < 32) {
                            const riff = [
                                {s: 0, n: 155.6}, {s: 2, n: 185.0}, {s: 4, n: 207.7}, {s: 6, n: 185.0},
                                {s: 8, n: 155.6}, {s: 12, n: 138.6}
                            ];
                            const note = riff.find(n => n.s === step);
                            if (note) sys.playTone(time, note.n, 'sawtooth', 0.15);
                        }

                        // DRUMS
                        if (bar >= 2) {
                            if (step % 8 === 0) sys.playKick(time);
                            if (step % 8 === 4) sys.playSnare(time, {noise: 3000});
                            if (step % 8 === 2) sys.playKick(time, {vol: 0.3}); // Ghost kick
                        }
                    }
                },
                {
                    name: 'Sweet Taco O\' Mine',
                    tempo: 0.12, // ~125 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: Db Major (Intro riff pattern)
                        // Db, Db(8va), Ab, Gb, Db(8va), Ab, F, Db(8va) - approx pattern
                        // Db4=277.2, Db5=554.4, Ab4=415.3, Gb4=370.0, F4=349.2

                        const riff = [277.2, 554.4, 415.3, 370.0, 554.4, 415.3, 349.2, 554.4];

                        // GUITAR INTRO
                        if (bar < 16) {
                            if (step % 2 === 0) {
                                sys.playTone(time, riff[(step/2)%8], 'square', 0.1);
                            }
                        }

                        // FULL BAND
                        if (bar >= 16) {
                            if (step % 4 === 0) sys.playKick(time);
                            if (step % 4 === 2) sys.playSnare(time);
                            if (step % 2 === 0) sys.playHiHat(time);

                            // Power chords
                            if (step === 0 && bar % 4 === 0) sys.playChord(time, [277.2, 415.3, 554.4], 'sawtooth', 1000, 0.2); // Db
                            if (step === 0 && bar % 4 === 1) sys.playChord(time, [233.1, 349.2, 466.2], 'sawtooth', 1000, 0.2); // Bb
                        }
                    }
                },
                {
                    name: 'We Are The Tacos',
                    tempo: 0.16, // ~94 BPM
                    totalTicks: 2048,
                    schedule: (beat, time, sys) => {
                        const bar = Math.floor(beat / 16);
                        const step = beat % 16;
                        // Key: C Minor

                        // PIANO BALLAD INTRO
                        if (bar < 8) {
                            if (step === 0) sys.playChord(time, [130.8, 155.6, 196.0], 'triangle', 600, 0.15); // Cm
                            if (step === 8) sys.playChord(time, [116.5, 146.8, 174.6], 'triangle', 600, 0.15); // Bb
                        }
                        // CHORUS ANTHEM
                        else {
                            // Heavy Kick
                            if (step % 8 === 0) sys.playKick(time, {freq: 50, decay: 0.8});
                            if (step % 8 === 4) sys.playSnare(time, {noise: 1500, decay: 0.3});

                            // Melody "We are the champions"
                            // G G F# G A ...
                            if (step === 0) sys.playTone(time, 392.0, 'sawtooth', 0.2); // G4
                            if (step === 4) sys.playTone(time, 370.0, 'sawtooth', 0.2); // F#4
                            if (step === 6) sys.playTone(time, 392.0, 'sawtooth', 0.2); // G4
                            if (step === 8) sys.playTone(time, 440.0, 'sawtooth', 0.3); // A4
                        }
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
