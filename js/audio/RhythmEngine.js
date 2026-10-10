/**
 * Motor de sincronización rítmica y cálculo de Beats
 */
import { DEFAULT_BPM } from '../core/Constants.js';

export class RhythmEngine {
  constructor(initialBpm = DEFAULT_BPM) {
    this.bpm = initialBpm;
    this.beat = 60 / this.bpm;
    this.step = this.beat / 4;
    this.window = this.bpm >= 110 ? 0.12 : 0.13;
    this.userOffset = 0;
    this.latency = 0;
    this.t0 = 0;
    this.startPerf = performance.now() / 1000;
    this.lastBeatIdx = null;
  }

  setTempo(bpm, actx = null) {
    this.bpm = bpm;
    this.beat = 60 / this.bpm;
    this.step = this.beat / 4;
    this.window = bpm >= 110 ? 0.12 : 0.13;
    if (actx && actx.state === 'running') {
      this.t0 = actx.currentTime + 0.12;
    } else {
      this.startPerf = performance.now() / 1000;
    }
    this.lastBeatIdx = null;
  }

  elapsed(actx = null) {
    if (actx && actx.state === 'running') {
      return actx.currentTime - this.latency - this.t0;
    }
    return performance.now() / 1000 - this.startPerf;
  }

  beatInfo(actx = null) {
    const b = (this.elapsed(actx) - this.userOffset) / this.beat;
    const idx = Math.floor(b);
    return {
      idx: idx,
      pos: b - idx // [0, 1] dentro del beat
    };
  }

  beatDist(actx = null) {
    const p = this.beatInfo(actx).pos;
    return Math.min(p, 1 - p) * this.beat;
  }

  isOnBeat(actx = null) {
    return this.beatDist(actx) <= this.window;
  }

  adjustOffset(deltaSeconds) {
    this.userOffset += deltaSeconds;
    return this.userOffset;
  }
}
