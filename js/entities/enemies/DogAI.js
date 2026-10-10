import { AIUtils } from './AIUtils.js';

export class DogAI {
  static update(e, player, dt, bp, nowT, map, enemies, handlers) {
    const d = AIUtils.dist(e, player);
    const u = AIUtils.norm(player.x - e.x, player.y - e.y);

    if (e.state === 'crouch') {
      e.spr = 'dog_crouch';
      return;
    }

    if (e.state === 'stalk') {
      e._stalkT = (e._stalkT || 0) + dt;
      // Acecho Perpendicular
      const side = (e.x * e.y + e._stalkT) % 2 < 1 ? 1 : -1;
      const p = AIUtils.perp(u.x, u.y, side);
      const sp = 0.9;
      AIUtils.move(e, e.x + p.x * sp * dt, e.y + p.y * sp * dt, map);
      e.spr = 'dog_stalk';
      if (e._stalkT > 1.2) {
        e.state = 'crouch';
        e._stalkT = 0;
      }
      return;
    }

    if (e.state === 'leap') {
      e.spr = 'dog_leap';
      const sp = 5.2;
      const lx = e.x + e.chargeX * sp * dt;
      const ly = e.y + e.chargeY * sp * dt;
      if (d < 0.75) {
        e.state = 'walk';
        if (handlers && handlers.onHurtPlayer) handlers.onHurtPlayer(12, 0.4, false);
        return;
      }
      AIUtils.move(e, lx, ly, map);
      e.stateT += dt;
      if (e.stateT > 0.65) e.state = 'walk';
      return;
    }

    // Flanqueo Oportunista: Calculate angle to player camera (approximated by moving perpendicular)
    let jfx = u.x, jfy = u.y;
    if (d < 5) {
      const angle = ((e.x * 7 + e.y * 13) % 4) * Math.PI * 0.5;
      const side = Math.sin(angle + nowT * 1.2) > 0 ? 1 : -1;
      const p = AIUtils.perp(u.x, u.y, side);
      const jn = AIUtils.norm(u.x * 0.5 + p.x * 0.7, u.y * 0.5 + p.y * 0.7);
      jfx = jn.x; jfy = jn.y;
    }

    const ph = (bp * 2) % 1;
    const sp = 2.5 * (0.15 + 2.2 * Math.exp(-ph * 4.5));
    e.spr = ((bp * 2) | 0) % 2 === 0 ? 'dog_walk1' : 'dog_walk2';

    AIUtils.move(e, e.x + jfx * sp * dt, e.y + jfy * sp * dt, map);
  }

  static onBeat(e, player, map) {
    if (e.state === 'crouch') {
      e.state = 'leap';
      e.stateT = 0;
      const d2 = AIUtils.dist(e, player) || 1;
      e.chargeX = (player.x - e.x) / d2;
      e.chargeY = (player.y - e.y) / d2;
    } else if (e.state === 'walk' && AIUtils.dist(e, player) < 6 && AIUtils.canSee(e, player, map)) {
      e.state = 'stalk';
      e._stalkT = 0;
    }
  }
}
