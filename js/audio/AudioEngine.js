/**
 * Motor de síntesis procedural de sonido (Web Audio API) y efectos de sonido
 */

const ROOTS = [87.31, 69.30, 58.27, 65.41];
const CHORDS = [
  [174.61, 207.65, 261.63],
  [138.59, 174.61, 207.65],
  [233.08, 277.18, 349.23],
  [261.63, 329.63, 392.00]
];
const MELODY = {
  0: 349.23, 4: 415.30, 8: 523.25, 12: 466.16,
  16: 415.30, 20: 392.00, 24: 349.23
};

export class AudioEngine {
  constructor(rhythmEngine) {
    this.rhythm = rhythmEngine;
    this.actx = null;
    this.master = null;
    this.layers = [];
    this.revSend = null;
    this.noiseBuf = null;
    this.nextT = 0;
    this.stepIdx = 0;
    this.musicLevel = 0;
    this.intervalId = null;
    this.audioTried = false;
  }

  makeIR(sec, decay) {
    const rate = this.actx.sampleRate;
    const len = (rate * sec) | 0;
    const b = this.actx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return b;
  }

  init() {
    if (this.audioTried && this.actx) return;
    this.audioTried = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    try {
      this.actx = new AC();
      const comp = this.actx.createDynamicsCompressor();
      comp.connect(this.actx.destination);

      this.master = this.actx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(comp);

      const conv = this.actx.createConvolver();
      conv.buffer = this.makeIR(2.2, 2.5);
      const wet = this.actx.createGain();
      wet.gain.value = 0.35;
      conv.connect(wet);
      wet.connect(this.master);

      this.revSend = this.actx.createGain();
      this.revSend.connect(conv);

      this.layers = [];
      for (let i = 0; i < 4; i++) {
        const g = this.actx.createGain();
        g.gain.value = i === 0 ? 1 : 0;
        g.connect(this.master);
        const s = this.actx.createGain();
        s.gain.value = 0.45;
        g.connect(s);
        s.connect(this.revSend);
        this.layers.push(g);
      }

      const nb = this.actx.createBuffer(1, this.actx.sampleRate, this.actx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
      this.noiseBuf = nb;

      const flt = this.actx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 320;
      flt.Q.value = 2;
      const dg = this.actx.createGain();
      dg.gain.value = 0.11;
      flt.connect(dg);
      dg.connect(this.layers[0]);

      [[87.31, 'sawtooth'], [43.65, 'sine'], [130.81, 'triangle']].forEach(p => {
        const o = this.actx.createOscillator();
        o.type = p[1];
        o.frequency.value = p[0];
        o.connect(flt);
        o.start();
      });

      const lfo = this.actx.createOscillator();
      const lg = this.actx.createGain();
      lfo.frequency.value = 0.13;
      lg.gain.value = 110;
      lfo.connect(lg);
      lg.connect(flt.frequency);
      lfo.start();

      const hum = this.actx.createOscillator();
      const hg = this.actx.createGain();
      hum.type = 'sine';
      hum.frequency.value = 120;
      hg.gain.value = 0.012;
      hum.connect(hg);
      hum.connect(this.layers[0]);
      hum.start();

      this.rhythm.latency = (this.actx.outputLatency || 0) + (this.actx.baseLatency || 0);
      this.nextT = this.actx.currentTime + 0.15;
      this.rhythm.t0 = this.nextT;
      this.stepIdx = 0;

      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = setInterval(() => this.schedule(), 25);
    } catch (e) {
      this.actx = null;
    }
  }

  resume() {
    if (this.actx && this.actx.state === 'suspended') {
      this.actx.resume();
    }
  }

  env(g, t, vol, dur, a = 0.005) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  kick(t, vol, f0, f1, dur) {
    const o = this.actx.createOscillator(), g = this.actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.layers[0]);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  tone(type, f, t, dur, vol, dest, det) {
    const o = this.actx.createOscillator(), g = this.actx.createGain();
    o.type = type;
    o.frequency.value = f;
    if (det) o.detune.value = det;
    this.env(g, t, vol, dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(t, dur, vol, ftype, freq, q, dest) {
    const s = this.actx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.actx.createBiquadFilter();
    f.type = ftype;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.actx.createGain();
    this.env(g, t, vol, dur, 0.002);
    s.connect(f);
    f.connect(g);
    g.connect(dest);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  bass(t, f, dur) {
    const o = this.actx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    const fl = this.actx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.Q.value = 6;
    fl.frequency.setValueAtTime(650, t);
    fl.frequency.exponentialRampToValueAtTime(140, t + dur);
    const g = this.actx.createGain();
    this.env(g, t, 0.28, dur, 0.006);
    o.connect(fl);
    fl.connect(g);
    g.connect(this.layers[1]);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.tone('sine', f, t, dur, 0.3, this.layers[1]);
  }

  pad(t, notes, vol) {
    const dur = this.rhythm.step * 16;
    notes.forEach((f, i) => {
      const o = this.actx.createOscillator(), g = this.actx.createGain(), fl = this.actx.createBiquadFilter();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = (i - 1) * 9;
      fl.type = 'lowpass';
      fl.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(fl);
      fl.connect(g);
      g.connect(this.layers[3]);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  scheduleStep(i, t) {
    const s = i % 16;
    const bar = Math.floor(i / 16) % 4;
    const m = i % 32;
    const L = this.musicLevel;

    if (s % 4 === 0) this.kick(t, (s === 0 || s === 8) ? 0.95 : 0.8, 120, 42, 0.32);
    if (s === 2 || s === 10) this.kick(t, L === 4 ? 0.55 : 0.3, 90, 40, 0.18);
    if (s === 0) this.tone('sine', 1568, t, 0.07, 0.045, this.layers[0]);
    if (s % 2 === 0) this.bass(t, ROOTS[bar], this.rhythm.step * 1.8);
    if (s === 4 || s === 12) {
      this.noise(t, 0.2, 0.32, 'bandpass', 1800, 0.8, this.layers[2]);
      this.tone('triangle', 190, t, 0.12, 0.25, this.layers[2]);
    }
    if (s % 2 === 0) this.noise(t, 0.04, (s % 4 === 2) ? 0.07 : 0.045, 'highpass', 7000, 0.7, this.layers[2]);
    else if (L === 2) this.noise(t, 0.03, 0.03, 'highpass', 8000, 0.7, this.layers[2]);
    if (s === 10) {
      this.tone('sine', 2100, t, 0.3, 0.05, this.layers[2], 6);
      this.tone('sine', 3370, t, 0.25, 0.035, this.layers[2], -9);
    }
    if (L === 3 && s === 0) this.tone('triangle', 739.99, t, this.rhythm.step * 14, 0.03, this.layers[2], 8);
    if (MELODY[m]) {
      this.tone('sine', MELODY[m], t, 1.0, 0.13, this.layers[3], -14);
      this.tone('sine', MELODY[m] * 2.756, t, 0.35, 0.03, this.layers[3], -14);
    }
    if (s === 0) this.pad(t, CHORDS[bar], L === 4 ? 0.08 : 0.05);
  }

  schedule() {
    if (!this.actx) return;
    // Protección contra saturación si el navegador estuvo en segundo plano
    if (this.nextT < this.actx.currentTime - 0.25) {
      this.nextT = this.actx.currentTime + 0.05;
      this.stepIdx = Math.floor((this.nextT - this.rhythm.t0) / this.rhythm.step);
    }
    while (this.nextT < this.actx.currentTime + 0.2) {
      this.scheduleStep(this.stepIdx, this.nextT);
      this.nextT += this.rhythm.step;
      this.stepIdx++;
    }
  }

  updateLayers(combo) {
    if (!this.actx) return;
    for (let k = 1; k < 4; k++) {
      this.layers[k].gain.setTargetAtTime(combo >= k + 1 ? 1 : 0, this.actx.currentTime, 0.07);
    }
  }

  sfxShoot(kind, on) {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    if (kind === 'scalpel') {
      this.noise(t, 0.08, 0.4, 'bandpass', 2200, 0.9, this.master);
      const o = this.actx.createOscillator(), g = this.actx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(600, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.09);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.12);
    } else if (kind === 'shotgun') {
      this.noise(t, 0.22, 0.85, 'bandpass', 700, 0.6, this.master);
      const o = this.actx.createOscillator(), g = this.actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.35);
    } else if (kind === 'smg') {
      this.noise(t, 0.06, 0.35, 'bandpass', 1500, 0.8, this.master);
      this.tone('sine', 120, t, 0.07, 0.3, this.master);
    } else if (kind === 'defib') {
      const z = this.actx.createOscillator(), zg = this.actx.createGain();
      z.type = 'sawtooth';
      z.frequency.setValueAtTime(90, t);
      z.frequency.exponentialRampToValueAtTime(900, t + 0.18);
      zg.gain.setValueAtTime(0.3, t);
      zg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      z.connect(zg);
      zg.connect(this.master);
      z.start(t);
      z.stop(t + 0.35);
      this.noise(t, 0.2, 0.3, 'highpass', 3000, 0.6, this.master);
    } else {
      this.noise(t, 0.13, 0.5, 'bandpass', 900, 0.7, this.master);
      const p = this.actx.createOscillator(), pg = this.actx.createGain();
      p.type = 'sine';
      p.frequency.setValueAtTime(170, t);
      p.frequency.exponentialRampToValueAtTime(48, t + 0.16);
      pg.gain.setValueAtTime(0.55, t);
      pg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      p.connect(pg);
      pg.connect(this.master);
      p.start(t);
      p.stop(t + 0.25);
    }
    if (on) this.tone('sine', 880, t, 0.18, 0.09, this.master);
  }

  sfxHit() {
    if (!this.actx) return;
    this.noise(this.actx.currentTime, 0.08, 0.3, 'lowpass', 600, 0.5, this.master);
  }

  sfxStun() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    this.tone('sine', 1200, t, 0.25, 0.18, this.master, 12);
    this.tone('triangle', 800, t + 0.04, 0.2, 0.12, this.master);
  }

  sfxClink() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    this.tone('triangle', 1800, t, 0.15, 0.08, this.master);
    this.tone('sine', 2600, t, 0.12, 0.05, this.master);
  }

  sfxPick() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    this.tone('sine', 660, t, 0.12, 0.12, this.master);
    this.tone('sine', 990, t + 0.09, 0.18, 0.12, this.master);
  }

  sfxCrash() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    this.noise(t, 0.28, 0.7, 'lowpass', 350, 0.7, this.master);
    this.tone('sawtooth', 65, t, 0.35, 0.4, this.master);
  }

  sfxDie() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    const o = this.actx.createOscillator(), f = this.actx.createBiquadFilter(), g = this.actx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.45);
    f.type = 'lowpass';
    f.frequency.value = 380;
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.55);
  }

  sfxHurt() {
    if (!this.actx) return;
    const t = this.actx.currentTime;
    this.noise(t, 0.18, 0.45, 'lowpass', 400, 0.5, this.master);
    this.tone('sine', 70, t, 0.2, 0.5, this.master);
  }
}
