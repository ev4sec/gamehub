type Wave = OscillatorType;

/**
 * The synthesis primitive, shared by every game. No audio files, so nothing to
 * load, nothing to 404, and the whole hub stays a single static bundle.
 *
 * This deliberately knows nothing about what any game's sounds mean. A game
 * builds its own vocabulary on top of `tone` and `noise`; see games/snake/sfx.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  /** Must be called from a user gesture; browsers block audio before one. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  tone(
    freq: number,
    duration: number,
    wave: Wave = 'square',
    gain = 1,
    slideTo?: number,
    delay = 0,
  ): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration);
    }

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  noise(duration: number, gain = 0.6): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const rate = this.ctx.sampleRate;
    const frames = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(1, frames, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const env = this.ctx.createGain();
    env.gain.value = gain;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start();
  }

  /** The one sound that belongs to the shell rather than any game: a click. */
  ui(): void {
    this.tone(760, 0.05, 'square', 0.35);
  }
}

export const audio = new AudioEngine();
