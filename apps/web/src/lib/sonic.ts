/**
 * SONIC ENGINE - TIMBER EDITION (FINAL)
 * Hardcoded "Timber Crack" logic for bids.
 * Organic, tactile woodblock sounds for all interactions.
 */

import * as Tone from 'tone';

class SonicEngine {
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  // Synths
  private woodHigh: Tone.MembraneSynth | null = null;
  private woodLow: Tone.MembraneSynth | null = null;
  private woodHollow: Tone.MembraneSynth | null = null;
  private woodDry: Tone.MembraneSynth | null = null;
  private woodTap: Tone.MembraneSynth | null = null;
  
  // Effects
  private reverb: Tone.Reverb | null = null;

  private async init() {
    if (this.isInitialized) return;
    await Tone.start();

    // Master Effects
    this.reverb = new Tone.Reverb({ decay: 0.3, preDelay: 0.01, wet: 0.1 }).toDestination();

    // 1. High/Classic Woodblock (Confetti)
    this.woodHigh = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).connect(this.reverb);

    // 2. Low/Deep Log (Thud)
    this.woodLow = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.2 }
    }).connect(this.reverb);

    // 3. Hollow/Bamboo (Pop)
    this.woodHollow = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
    }).connect(this.reverb);

    // 4. Dry/Click (Chime) - The "Timber Crack"
    this.woodDry = new Tone.MembraneSynth({
      pitchDecay: 0.001,
      octaves: 1,
      oscillator: { type: 'square2' }, // Square for the "crack" texture
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    }).toDestination(); 

    // 5. Tap (General Click/Tick) - The "Subtle Solid Tap"
    // Zero pitch decay to remove hollowness. Sine for clean tone.
    this.woodTap = new Tone.MembraneSynth({
      pitchDecay: 0, 
      octaves: 0,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 } // Shortened decay
    }).toDestination();

    this.isInitialized = true;
  }

  // --- MAPPED ACTIONS ---

  /**
   * The Bid Sound - "Timber Crack"
   * Hard, distorted wooden impact.
   */
  async chime() {
      if (this.isMuted) return;
      await this.init();
      // Even lower velocity: 0.4
      // Variation: Slight detune by randomly picking G2, G#2, or F#2
      const notes = ["F#2", "G2", "G#2"];
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.woodDry?.triggerAttackRelease(note, "32n", undefined, 0.4);
  }

  /**
   * Interaction Tick
   * The "Solid Tap" - Clean and subtle
   */
  async tick() {
      if (this.isMuted) return;
      await this.init();
      // Lowered velocity to 0.03 (barely audible)
      // Variation: Slight pitch shift between G3 and F#3
      const notes = ["F#3", "G3"];
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.woodTap?.triggerAttackRelease(note, "32n", undefined, 0.03); 
  }

  /**
   * Error Thud
   * Deep Log
   */
  async thud() {
      if (this.isMuted) return;
      await this.init();
      // Lowered velocity to 0.4
      // Variation: G2 or F2
      const notes = ["F2", "G2"];
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.woodLow?.triggerAttackRelease(note, "16n", undefined, 0.4);
  }

  /**
   * Message Pop
   * Hollow Bamboo
   */
  async pop() {
      if (this.isMuted) return;
      await this.init();
      // Lowered velocity to 0.3
      // Variation: E5 or D#5
      const notes = ["D#5", "E5"];
      const note = notes[Math.floor(Math.random() * notes.length)];
      this.woodHollow?.triggerAttackRelease(note, "32n", undefined, 0.3);
  }

  /**
   * Celebration Confetti
   * Forest Echo
   */
  async confetti() {
      if (this.isMuted) return;
      await this.init();
      const now = Tone.now();
      // Lowered velocity to 0.2
      // Fixed sequence for celebration to keep it musical, but slightly randomized timing?
      // Keeping it simple for now as celebration is rare
      this.woodHigh?.triggerAttackRelease("E6", "32n", now, 0.2);
      this.woodHigh?.triggerAttackRelease("C6", "32n", now + 0.1, 0.2);
      this.woodHigh?.triggerAttackRelease("A5", "32n", now + 0.2, 0.2);
  }

  /**
   * General UI Click (Global)
   * Aliases to tick for consistent feedback
   */
  async click() {
      await this.tick();
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    Tone.Destination.mute = muted;
  }
}

export const sonic = new SonicEngine();
