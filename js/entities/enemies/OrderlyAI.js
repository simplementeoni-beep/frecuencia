import { AIUtils } from './AIUtils.js';
import { canMove } from '../../core/MathUtils.js';
export class OrderlyAI {
  static update(e, player, dt, bp, nowT, map, handlers) {
    const d = AIUtils.dist(e, player);
    const u = AIUtils.norm(player.x - e.x, player.y - e.y);

    if (e.stunTimer > 0) {
      e.spr = 'camillero_stun';
      return;
    }

    if (e.state === 'prep') {
      e.spr = 'camillero_charge';
      e._preChargeT -= dt;
      if (e._preChargeT <= 0) {
        e.state = 'charge';
        e.stateT = 0;
        e.chargeX = u.x; // Guardo dirección exacta
        e.chargeY = u.y;
      }
      return;
    }

    if (e.state === 'charge') {
      const sp = 4.5;
      e.spr = 'camillero_charge';
      const cx = e.x + e.chargeX * sp * dt;
      const cy = e.y + e.chargeY * sp * dt;
      
      if (d < 0.8) {
        e.state = 'walk';
        if (handlers && handlers.onHurtPlayer) handlers.onHurtPlayer(25, 0.7, true);
        return;
      }
      
      // Choca contra pared
      if (!canMove(map, cx, cy, e.hw * 0.8)) {
        e.state = 'stun';
        e.stunTimer = 2.5; // Stun largo
        e.spr = 'camillero_stun';
        return;
      }
      
      e.x = cx; e.y = cy;
      return;
    }

    if (d < 0.9 && e.state === 'walk') {
      e.spr = 'camillero_charge';
      return;
    }

    const sp = 1.8 * (0.2 + 1.4 * Math.exp(-bp * 3));
    e.spr = ((bp * 2) | 0) % 2 === 0 ? 'camillero_walk1' : 'camillero_walk2';

    AIUtils.move(e, e.x + u.x * sp * dt, e.y + u.y * sp * dt, map);
  }

  static onBeat(e, player, map) {
    if (e.state === 'walk' && AIUtils.dist(e, player) < 9 && AIUtils.canSee(e, player, map)) {
      // Condición estricta de visión para embestir
      e.state = 'prep';
      e._preChargeT = 1.5; // Telegrafía
    }
  }
}
