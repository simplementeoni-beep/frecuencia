/**
 * Sistema de notificaciones tipo Toast renderizadas en el Canvas
 */
import { W } from '../core/Constants.js';

export class Toast {
  constructor() {
    this.text = '';
    this.alpha = 0;
    this.timer = 0;
  }

  show(text, duration = 2.4) {
    this.text = text;
    this.alpha = 1;
    this.timer = duration;
  }

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer > 1.4) this.alpha = 1;
      else this.alpha = Math.max(0, this.timer / 1.4);
    } else {
      this.alpha = 0;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0 || !this.text) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px "Bebas Neue", Impact, sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(W / 2 - 140, 24, 280, 24);
    ctx.fillStyle = '#c5aaff';
    ctx.shadowColor = '#8b5cff';
    ctx.shadowBlur = 10;
    ctx.fillText(this.text, W / 2, 42);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
