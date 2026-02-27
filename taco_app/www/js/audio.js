// --- START audio.js ---
    const AudioSystem = {
        ctx: null,
        isMuted: false,
        isPlayingMusic: false,
        nextNoteTime: 0,
        beatCount: 0,
        lookahead: 25.0,
        scheduleAheadTime: 0.1,
        timerID: null,

        // --- PROCEDURAL GENERATION STATE ---
        currentStyleIndex: 0,
        styles: [], // Populated in init
        genState: {
            rootFreq: 0,
            scale: [],
            chordProgression: [], // Array of scale degrees (0-6)
            currentChordIndex: 0, // Index in progression
            melodyNote: 0,
            intensity: 0, // 0.0 to 1.0
            section: 'intro', // intro, verse, chorus, bridge
            barCount: 0,
            lastSectionChange: 0
        },

        init: function() {
            if (this.ctx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            if(this.ctx.state === 'suspended') this.ctx.resume();

            // --- STYLE DEFINITIONS ---
            this.styles = [
                {
                    name: 'Procedural Rock',
                    tempo: 0.125, // 120 BPM (0.5s per beat, 0.125 per 16th)
                    keyRange: [80, 150], // Low E to D
                    scaleType: 'minor_pentatonic', // [0, 3, 5, 7, 10]
                    instruments: {
                        kick: { freq: 100, decay: 0.15, type: 'square', vol: 0.6 },
                        snare: { tone: 200, noise: 1500, decay: 0.15, vol: 0.4 },
                        hat: { freq: 4000, decay: 0.05, vol: 0.15 },
                        bass: { type: 'sawtooth', vol: 0.2, decay: 0.1 },
                        lead: { type: 'square', vol: 0.1, decay: 0.1 }
                    },
                    generate: (beat, time, sys) => this.generateRock(beat, time, sys)
                },
                {
                    name: 'Procedural Lo-Fi',
                    tempo: 0.22, // ~70 BPM
                    keyRange: [130, 200], // C3 to G3
                    scaleType: 'major_7th', // [0, 2, 4, 5, 7, 9, 11] approx
                    instruments: {
                        kick: { freq: 60, decay: 0.4, type: 'sine', vol: 0.5 },
                        snare: { tone: 200, noise: 800, decay: 0.1, vol: 0.15 }, // Soft snare
                        hat: { freq: 7000, decay: 0.03, vol: 0.05 },
                        bass: { type: 'sine', vol: 0.4, decay: 0.5 },
                        lead: { type: 'triangle', vol: 0.1, decay: 0.4 }
                    },
                    generate: (beat, time, sys) => this.generateLoFi(beat, time, sys)
                },
                {
                    name: 'Procedural Hip Hop',
                    tempo: 0.16, // ~94 BPM
                    keyRange: [40, 70], // Deep Bass
                    scaleType: 'minor', // [0, 2, 3, 5, 7, 8, 10]
                    instruments: {
                        kick: { freq: 50, decay: 0.8, type: 'sine', vol: 0.8 }, // 808-ish
                        snare: { tone: 180, noise: 2500, decay: 0.15, vol: 0.5 }, // Sharp
                        hat: { freq: 8000, decay: 0.02, vol: 0.2 }, // Trap hats
                        bass: { type: 'sine', vol: 0.6, decay: 0.2 },
                        lead: { type: 'sawtooth', vol: 0.1, decay: 0.1 } // G-Funk whine
                    },
                    generate: (beat, time, sys) => this.generateHipHop(beat, time, sys)
                }
            ];

            // Restore saved style if valid
            if (typeof playerData !== 'undefined' && playerData.currentTrackIndex !== undefined) {
                this.currentStyleIndex = playerData.currentTrackIndex;
                if(this.currentStyleIndex >= this.styles.length) this.currentStyleIndex = 0;
            }

            this.resetGenState();
            this.startMusic();
        },

        resetGenState: function() {
            const style = this.styles[this.currentStyleIndex];
            // Pick a root note
            const min = style.keyRange[0];
            const max = style.keyRange[1];
            this.genState.rootFreq = min + Math.random() * (max - min);

            // Set scale intervals (semitones)
            if(style.scaleType === 'minor_pentatonic') this.genState.scale = [0, 3, 5, 7, 10];
            else if(style.scaleType === 'major_7th') this.genState.scale = [0, 4, 7, 11, 14]; // Major 7 chord tones mainly
            else this.genState.scale = [0, 2, 3, 5, 7, 8, 10]; // Natural Minor

            this.genState.chordProgression = [0, 3, 4, 0]; // Basic I-IV-V-I
            this.genState.currentChordIndex = 0;
            this.genState.barCount = 0;
            this.genState.section = 'intro';
            this.genState.intensity = 0.2;
        },

        // --- CORE AUDIO UTILS ---
        toggleMute: function() {
            this.isMuted = !this.isMuted;
            if(this.ctx) {
                if(this.isMuted) this.ctx.suspend();
                else this.ctx.resume();
            }
            return this.isMuted;
        },

        changeTrack: function(direction) {
            this.currentStyleIndex += direction;
            if (this.currentStyleIndex >= this.styles.length) this.currentStyleIndex = 0;
            if (this.currentStyleIndex < 0) this.currentStyleIndex = this.styles.length - 1;

            // Save preference
            if(typeof playerData !== 'undefined') {
                playerData.currentTrackIndex = this.currentStyleIndex;
                if(typeof saveData === 'function') saveData();
            }

            this.resetGenState(); // New song for new style
            if(typeof showNotification === 'function') {
                showNotification("🎵 " + this.styles[this.currentStyleIndex].name, 0);
            }
        },

        // --- OSCILLATORS & EFFECTS ---
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

        playTone: function(time, freq, type, dur, vol=0.1) {
            if (!this.ctx || this.isMuted) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + dur);
        },

        // SFX (Keep existing game SFX)
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
            this.createOscillator('square', 200, 0, 0.1, 0.1);
        },

        playFloorHit: function() {
            if (!this.ctx || this.isMuted) return;
            this.createOscillator('triangle', 80, 0, 0.1, 0.2);
        },

        playWindowBreak: function() {
            if (!this.ctx || this.isMuted) return;
            const t = this.ctx.currentTime;
            // Noise burst
            const dur = 0.6;
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t+dur);
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start(t);
            // Glass tinkles
            for(let i=0; i<5; i++) {
                setTimeout(() => {
                    if(this.ctx && !this.isMuted) this.createOscillator('sine', 2000 + Math.random()*3000, 0, 0.1, 0.05);
                }, Math.random() * 200);
            }
        },

        // --- INSTRUMENT HELPERS ---
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

            // Tonal Body
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

            // Noise Snap
            const dur = decay * 1.5;
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
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
            const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
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

        playChord: function(time, notes, type='triangle', vol=0.1) {
            if(!this.ctx || this.isMuted) return;
            notes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(vol, time);
                gain.gain.linearRampToValueAtTime(vol*0.8, time + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 1.0); // Sustain a bit
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(time);
                osc.stop(time + 1.0);
            });
        },

        // --- SCHEDULER & LOGIC ---
        scheduler: function() {
            if (!this.styles || this.styles.length === 0) return;
            const style = this.styles[this.currentStyleIndex];
            const beatInterval = style.tempo;

            while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
                // Procedural Update Logic (Bar Transition)
                if (this.beatCount % 16 === 0 && this.beatCount > 0) {
                    this.updateProceduralState();
                }

                style.generate(this.beatCount % 16, this.nextNoteTime, this);

                this.nextNoteTime += beatInterval;
                this.beatCount++;
            }
            this.timerID = window.setTimeout(this.scheduler.bind(this), this.lookahead);
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
        },

        // --- GENERATORS ---
        getFreq: function(semitoneOffset) {
            // formula: f = f0 * (2^(n/12))
            return this.genState.rootFreq * Math.pow(2, semitoneOffset / 12);
        },

        updateProceduralState: function() {
            this.genState.barCount++;
            const barsInPhase = this.genState.barCount - this.genState.lastSectionChange;

            // Change Section?
            if (barsInPhase >= 8 && Math.random() > 0.4) {
                this.genState.lastSectionChange = this.genState.barCount;
                if(this.genState.section === 'intro') {
                    this.genState.section = 'verse';
                    this.genState.intensity = 0.5;
                } else if(this.genState.section === 'verse') {
                    this.genState.section = 'chorus';
                    this.genState.intensity = 0.8;
                } else if(this.genState.section === 'chorus') {
                    this.genState.section = Math.random() > 0.5 ? 'verse' : 'bridge';
                    this.genState.intensity = 0.6;
                } else {
                    this.genState.section = 'verse'; // Back to normal
                    this.genState.intensity = 0.5;
                }

                // Change Chord Progression
                if(Math.random() > 0.3) {
                    const sl = this.genState.scale.length;
                    // Random progression
                    this.genState.chordProgression = [0,
                        Math.floor(Math.random() * sl),
                        Math.floor(Math.random() * sl),
                        Math.floor(Math.random() * sl)
                    ];
                }
            }

            // Next chord in progression
            this.genState.currentChordIndex = (this.genState.currentChordIndex + 1) % this.genState.chordProgression.length;
        },

        // 1. ROCK GENERATOR
        generateRock: function(beat, time, sys) {
            const inst = sys.styles[sys.currentStyleIndex].instruments;
            const root = sys.genState.rootFreq;
            const chordRoot = sys.getFreq(sys.genState.scale[sys.genState.chordProgression[sys.genState.currentChordIndex]]);
            const intensity = sys.genState.intensity;

            // Drums: Standard Rock Beat
            if (beat === 0 || beat === 8) sys.playKick(time, inst.kick);
            if (beat === 4 || beat === 12) sys.playSnare(time, inst.snare);
            if (beat % 2 === 0) sys.playHiHat(time, inst.hat);

            // Fills
            if (beat > 12 && Math.random() < intensity * 0.5) sys.playSnare(time, inst.snare);

            // Bass: Driving 8ths
            if (beat % 2 === 0) {
                sys.playTone(time, chordRoot / 2, inst.bass.type, inst.bass.decay, inst.bass.vol); // Low Octave
            }

            // Rhythm Guitar (Power Chords)
            if (beat === 0 || (intensity > 0.6 && beat === 6)) {
                // Root + 5th
                sys.playChord(time, [chordRoot, chordRoot * 1.5], 'sawtooth', 0.1);
            }

            // Lead Guitar (Pentatonic Licks in Chorus/Solo)
            if (sys.genState.section === 'chorus' || sys.genState.section === 'bridge') {
                if (Math.random() < intensity * 0.4 && beat % 2 === 0) {
                    // Pick a note from pentatonic scale
                    const noteIdx = Math.floor(Math.random() * sys.genState.scale.length);
                    const noteFreq = sys.getFreq(sys.genState.scale[noteIdx] + 12); // Higher octave
                    sys.playTone(time, noteFreq, 'square', 0.1, inst.lead.vol);
                }
            }
        },

        // 2. LO-FI GENERATOR
        generateLoFi: function(beat, time, sys) {
            const inst = sys.styles[sys.currentStyleIndex].instruments;
            const chordRoot = sys.getFreq(sys.genState.scale[sys.genState.chordProgression[sys.genState.currentChordIndex]]);

            // Swing Logic: Delay off-beats (odd 16th notes)
            let swing = (beat % 2 === 1) ? 0.05 : 0;
            const t = time + swing;

            // Drums: Relaxed, sparse
            if (beat === 0 || (beat === 10 && Math.random()>0.3)) sys.playKick(t, inst.kick);
            if (beat === 4 || beat === 12) sys.playSnare(t, inst.snare);
            if (beat % 2 === 0 || Math.random() > 0.7) sys.playHiHat(t, inst.hat);

            // Chords: Lush, long sustain (Play on 1, maybe sustain through)
            if (beat === 0) {
                // Major 7th feel: Root, 3rd (Major), 5th, 7th
                // Scale is approximated, let's just use freq multipliers for 'jazzy' ratio
                // 1, 1.25 (Maj3), 1.5 (Per5), 1.875 (Maj7)
                const notes = [chordRoot, chordRoot * 1.25, chordRoot * 1.5, chordRoot * 1.875];
                sys.playChord(t, notes, 'triangle', 0.1);
            }

            // Melody: Simple, random wander
            if (beat % 4 === 0 && Math.random() > 0.4) {
                const noteIdx = Math.floor(Math.random() * sys.genState.scale.length);
                const noteFreq = sys.getFreq(sys.genState.scale[noteIdx] + 12);
                sys.playTone(t, noteFreq, 'sine', 0.2, inst.lead.vol);
            }
        },

        // 3. HIP HOP GENERATOR
        generateHipHop: function(beat, time, sys) {
            const inst = sys.styles[sys.currentStyleIndex].instruments;
            const chordRoot = sys.getFreq(sys.genState.scale[sys.genState.chordProgression[sys.genState.currentChordIndex]]);

            // Drums: Boom Bap or Trap
            // Kick pattern varies
            if (beat === 0) sys.playKick(time, inst.kick);
            if (beat === 10 || (beat===14 && Math.random()>0.5)) sys.playKick(time, inst.kick);

            // Snare on 4 and 12 (Standard)
            if (beat === 4 || beat === 12) sys.playSnare(time, inst.snare);

            // Hi-Hats: Trap rolls?
            if (beat % 2 === 0) {
                if (Math.random() > 0.8) {
                    // Roll
                    sys.playHiHat(time, {freq: inst.hat.freq, decay: 0.02, vol: inst.hat.vol});
                    sys.playHiHat(time+0.06, {freq: inst.hat.freq, decay: 0.02, vol: inst.hat.vol});
                    sys.playHiHat(time+0.12, {freq: inst.hat.freq, decay: 0.02, vol: inst.hat.vol});
                } else {
                    sys.playHiHat(time, inst.hat);
                }
            }

            // Bass: Heavy sub sine
            if (beat === 0 || beat === 10) {
                sys.playTone(time, chordRoot / 2, 'sine', 0.4, inst.bass.vol); // Deep sub
            }

            // Simple Hook (High pitch whine or bell)
            if (beat === 0 || beat === 6) {
                const noteIdx = Math.floor(Math.random() * 3); // Just root, 3rd, 5th
                const noteFreq = sys.getFreq(sys.genState.scale[noteIdx] + 24); // High Up
                sys.playTone(time, noteFreq, 'triangle', 0.1, inst.lead.vol);
            }
        }
    };

// --- END audio.js ---
