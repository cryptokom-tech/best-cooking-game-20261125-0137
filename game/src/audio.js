// Synthesized sound effects with WebAudio — no audio files, no network.
// Every call is guarded: headless runs and muted runs never throw.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (this.ctx || this.muted) return this.ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, slideTo = 0) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch { /* sound is decoration; never break the game */ }
  }

  noise(dur, vol = 0.08, freq = 1200) {
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
    } catch { /* ignore */ }
  }

  // Short wooden knock: chopping.
  thock() {
    this.noise(0.07, 0.16, 700);
    this.tone(190, 0.08, 'triangle', 0.1, 90);
  }

  // Bright pick-up blip.
  pickup() {
    this.tone(620, 0.09, 'sine', 0.1, 880);
  }

  // Sizzle burst while food cooks.
  sizzle() {
    this.noise(0.18, 0.05, 2600);
  }

  // Two-note serve bell.
  ding() {
    this.tone(880, 0.16, 'sine', 0.14);
    setTimeout(() => this.tone(1318, 0.28, 'sine', 0.14), 110);
  }

  // Low buzz for a wrong dish or an expired ticket.
  buzz() {
    this.tone(160, 0.3, 'sawtooth', 0.09, 90);
  }

  // Urgency beep when a ticket is about to expire.
  alarm() {
    this.tone(980, 0.1, 'square', 0.05, 980);
  }

  // Shift-end fanfare.
  fanfare() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.12), i * 130));
  }

  // Click on a button.
  click() {
    this.tone(440, 0.06, 'sine', 0.08, 520);
  }
}
