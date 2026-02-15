
// Simulation of AudioSystem logic
const AudioSystem = {
    genState: {
        rootFreq: 100,
        scale: [0, 3, 5, 7, 10], // minor_pentatonic (length 5)
        chordProgression: [0, 3, 4, 0],
        currentChordIndex: 0,
        barCount: 0,
        lastSectionChange: 0,
        section: 'intro',
        intensity: 0.2
    },

    getFreq: function(semitoneOffset) {
        if (semitoneOffset === undefined) {
            console.log("CRASH: semitoneOffset is undefined!");
            return NaN;
        }
        return this.genState.rootFreq * Math.pow(2, semitoneOffset / 12);
    },

    updateProceduralState: function() {
        this.genState.barCount++;
        const barsInPhase = this.genState.barCount - this.genState.lastSectionChange;

        // Force change for testing
        if (true) {
            this.genState.lastSectionChange = this.genState.barCount;

            // Logic from js/audio.js
            if(Math.random() > 0.0) { // Force execution
                // Random progression
                this.genState.chordProgression = [0,
                    Math.floor(Math.random()*6),
                    Math.floor(Math.random()*6),
                    (Math.random()>0.5 ? 4 : 5)
                ];
                console.log("New Chord Progression:", this.genState.chordProgression);
            }
        }

        this.genState.currentChordIndex = (this.genState.currentChordIndex + 1) % this.genState.chordProgression.length;
    }
};

// Run simulation
console.log("Scale Length:", AudioSystem.genState.scale.length);
console.log("Running simulation...");

for(let i=0; i<50; i++) {
    AudioSystem.updateProceduralState();
    const chordIndex = AudioSystem.genState.chordProgression[AudioSystem.genState.currentChordIndex];
    const semitone = AudioSystem.genState.scale[chordIndex];
    console.log(`Step ${i}: Chord Index ${chordIndex}, Semitone ${semitone}`);

    const freq = AudioSystem.getFreq(semitone);
    if (isNaN(freq)) {
        console.log("CRASH DETECTED: Frequency is NaN");
        break;
    }
}
