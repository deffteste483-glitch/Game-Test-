import { AudioMixerState, DEFAULT_AUDIO_MIXER } from './authLogic';

export type SoundEffectType =
  | 'flip'
  | 'quill'
  | 'fanfare'
  | 'footstep'
  | 'mug'
  | 'interact'
  | 'npc';

class TavernSoundEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private mixer: AudioMixerState = { ...DEFAULT_AUDIO_MIXER };

  private fireGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private hallAmbienceGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private crackleTimer: number | null = null;
  private musicTimer: number | null = null;
  private noteIndex = 0;
  private lastFootstepMs = 0;
  private stepToggle = false;

  // Dorian mode lute progression (D Dorian: D, E, F, G, A, B, C)
  private readonly luteMelody = [
    { freq: 293.66, dur: 0.9, bass: 146.83 }, // D4 + D3
    { freq: 349.23, dur: 0.7, bass: 0 },      // F4
    { freq: 440.00, dur: 0.9, bass: 220.00 }, // A4 + A3
    { freq: 392.00, dur: 0.7, bass: 0 },      // G4
    { freq: 349.23, dur: 0.8, bass: 174.61 }, // F4 + F3
    { freq: 329.63, dur: 0.8, bass: 0 },      // E4
    { freq: 293.66, dur: 1.2, bass: 146.83 }, // D4 + D3
    { freq: 440.00, dur: 0.8, bass: 220.00 }, // A4
    { freq: 523.25, dur: 0.9, bass: 261.63 }, // C5 + C4
    { freq: 493.88, dur: 0.7, bass: 0 },      // B4
    { freq: 440.00, dur: 1.0, bass: 220.00 }, // A4
    { freq: 349.23, dur: 0.8, bass: 174.61 }, // F4
    { freq: 329.63, dur: 0.9, bass: 164.81 }, // E4
    { freq: 293.66, dur: 1.4, bass: 146.83 }, // D4
  ];

  public setMixer(newMixer: AudioMixerState) {
    this.mixer = { ...DEFAULT_AUDIO_MIXER, ...newMixer };
    this.applyVolumes();
  }

  public getMixer(): AudioMixerState {
    return { ...this.mixer };
  }

  private getMasterScale(): number {
    if (this.mixer.masterMuted) return 0;
    const master = typeof this.mixer.masterVolume === 'number' ? this.mixer.masterVolume : 85;
    return Math.max(0, Math.min(1, master / 100));
  }

  private getAmbienceScale(): number {
    const amb = typeof this.mixer.ambience === 'number' ? this.mixer.ambience : 75;
    return this.getMasterScale() * Math.max(0, Math.min(1, amb / 100));
  }

  private getSfxScale(): number {
    const sfx = typeof this.mixer.sfx === 'number' ? this.mixer.sfx : 80;
    const pages = typeof this.mixer.pages === 'number' ? this.mixer.pages : 85;
    return this.getMasterScale() * Math.max(0, Math.min(1, ((sfx * 0.7 + pages * 0.3) / 100)));
  }

  public ensureStarted() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.isRunning && this.ctx) {
      this.isRunning = true;
      this.setupContinuousAmbience();
    }
    this.applyVolumes();
  }

  private setupContinuousAmbience() {
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 2;

    // 1. Rain Continuous Soft Noise
    const rainBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const rainData = rainBuffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      b3 = 0.85 * b3 + white * 0.065;
      rainData[i] = (b0 + b1 + b2 + b3) * 0.22;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 950;
    rainFilter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    rainSource.start();

    // 2. Hearth Warm Rumble Base + Crackle Loop
    const fireBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const fireData = fireBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      fireData[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = fireData[i];
      fireData[i] *= 1.4;
    }

    const fireSource = this.ctx.createBufferSource();
    fireSource.buffer = fireBuffer;
    fireSource.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 220;

    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.value = 0;

    fireSource.connect(fireFilter);
    fireFilter.connect(this.fireGain);
    this.fireGain.connect(this.ctx.destination);
    fireSource.start();

    // 3. Warm Tavern Hall Room Tone / Subtle Hearth Murmur
    const hallSource = this.ctx.createBufferSource();
    hallSource.buffer = fireBuffer;
    hallSource.loop = true;

    const hallFilter = this.ctx.createBiquadFilter();
    hallFilter.type = 'bandpass';
    hallFilter.frequency.value = 340;
    hallFilter.Q.value = 1.2;

    this.hallAmbienceGain = this.ctx.createGain();
    this.hallAmbienceGain.gain.value = 0;

    hallSource.connect(hallFilter);
    hallFilter.connect(this.hallAmbienceGain);
    this.hallAmbienceGain.connect(this.ctx.destination);
    hallSource.start();

    // 4. Music Master Gain
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.ctx.destination);

    // Periodic Fireplace Crackles & Subtle Tavern Utensil Clinks
    this.crackleTimer = window.setInterval(() => {
      if (!this.ctx || this.mixer.masterMuted) return;
      if (this.mixer.fireplace > 0 && this.getAmbienceScale() > 0 && Math.random() < 0.62) {
        this.triggerFireCrackle();
      }
    }, 280);

    // Periodic Medieval Lute Notes
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.mixer.masterMuted || this.mixer.music <= 0) return;
      if (this.getMasterScale() <= 0) return;
      this.playNextLuteNote();
    }, 950);

    this.applyVolumes();
  }

  private triggerFireCrackle() {
    if (!this.ctx || !this.fireGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 1900, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);

    filter.type = 'highpass';
    filter.frequency.value = 800;

    const vol = (this.mixer.fireplace / 100) * this.getAmbienceScale() * 0.045;
    if (vol <= 0.0002) return;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  private playNextLuteNote() {
    if (!this.ctx || !this.musicGain) return;
    const step = this.luteMelody[this.noteIndex % this.luteMelody.length];
    this.noteIndex++;

    const now = this.ctx.currentTime;
    this.pluckString(step.freq, now, step.dur, 0.12);
    if (step.bass > 0) {
      this.pluckString(step.bass, now + 0.03, step.dur * 1.25, 0.08);
    }
  }

  private pluckString(freq: number, startTime: number, duration: number, baseAmp: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 2, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, startTime);
    filter.frequency.exponentialRampToValueAtTime(420, startTime + duration);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(baseAmp, startTime + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.25;

    osc.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);

    osc.start(startTime);
    subOsc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    subOsc.stop(startTime + duration + 0.05);
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const masterScale = this.getMasterScale();
    const ambScale = this.getAmbienceScale();

    if (this.fireGain) {
      const target = (this.mixer.fireplace / 100) * ambScale * 0.18;
      this.fireGain.gain.setTargetAtTime(target, now, 0.08);
    }
    if (this.rainGain) {
      const target = (this.mixer.rain / 100) * ambScale * 0.14;
      this.rainGain.gain.setTargetAtTime(target, now, 0.08);
    }
    if (this.hallAmbienceGain) {
      const target = ambScale * 0.06;
      this.hallAmbienceGain.gain.setTargetAtTime(target, now, 0.08);
    }
    if (this.musicGain) {
      const target = (this.mixer.music / 100) * masterScale * 0.85;
      this.musicGain.gain.setTargetAtTime(target, now, 0.08);
    }
  }

  /**
   * Soft wooden plank footstep sound, throttled so continuous movement sounds natural.
   */
  public playFootstep() {
    if (!this.ctx || !this.isRunning) return;
    const sfxVol = this.getSfxScale();
    if (sfxVol <= 0.01) return;

    const nowMs = performance.now();
    if (nowMs - this.lastFootstepMs < 275) return;
    this.lastFootstepMs = nowMs;
    this.stepToggle = !this.stepToggle;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = this.stepToggle ? 135 : 118;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.055);

    filter.type = 'lowpass';
    filter.frequency.value = 320;

    gain.gain.setValueAtTime(sfxVol * 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.065);
  }

  /**
   * Pewter/wooden mug clink & toast sound for counter and table interactions.
   */
  public playMugClink() {
    this.ensureStarted();
    const sfxVol = this.getSfxScale();
    if (!this.ctx || sfxVol <= 0.01) return;

    const now = this.ctx.currentTime;
    const freqs = [520, 780];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 0.92, start + 0.14);

      gain.gain.setValueAtTime(sfxVol * 0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  /**
   * Subtle wooden latch / object interaction sound.
   */
  public playObjectInteract() {
    this.ensureStarted();
    const sfxVol = this.getSfxScale();
    if (!this.ctx || sfxVol <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);

    gain.gain.setValueAtTime(sfxVol * 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  /**
   * Discrete NPC greeting chime when approaching an NPC.
   */
  public playNpcGreeting() {
    if (!this.ctx || !this.isRunning) return;
    const sfxVol = this.getSfxScale();
    if (sfxVol <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.11);

    gain.gain.setValueAtTime(sfxVol * 0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playPageFlip() {
    this.ensureStarted();
    const sfxVol = this.getSfxScale();
    if (!this.ctx || sfxVol <= 0.01) return;

    const now = this.ctx.currentTime;
    const duration = 0.22;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(650, now + duration);
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(sfxVol * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  public playQuillScratch() {
    this.ensureStarted();
    const sfxVol = this.getSfxScale();
    if (!this.ctx || sfxVol <= 0.01) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200 + Math.random() * 600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.035);

    gain.gain.setValueAtTime(sfxVol * 0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playCelebrationFanfare() {
    this.ensureStarted();
    const masterScale = this.getMasterScale();
    if (!this.ctx || masterScale <= 0) return;

    const vol =
      masterScale * (Math.max(this.mixer.music, this.mixer.sfx ?? 80, this.mixer.pages) / 100);
    if (vol <= 0) return;

    const now = this.ctx.currentTime;
    const chord = [293.66, 369.99, 440.0, 587.33]; // D major warm cadence
    chord.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(vol * 0.14, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.9);
    });
  }

  public playEffect(type: SoundEffectType) {
    switch (type) {
      case 'flip':
        this.playPageFlip();
        break;
      case 'quill':
        this.playQuillScratch();
        break;
      case 'fanfare':
        this.playCelebrationFanfare();
        break;
      case 'footstep':
        this.playFootstep();
        break;
      case 'mug':
        this.playMugClink();
        break;
      case 'interact':
        this.playObjectInteract();
        break;
      case 'npc':
        this.playNpcGreeting();
        break;
    }
  }
}

export const soundEngine = new TavernSoundEngine();
