import { AIUtils } from './AIUtils.js';

export class SurgeonAI {
  static update(e, player, dt, bp, nowT, map) {
    const d = AIUtils.dist(e, player);
    const u = AIUtils.norm(player.x - e.x, player.y - e.y);

    if (e._teleportCd > 0) e._teleportCd -= dt;

    if (e._reloadT > 0) {
      e._reloadT -= dt;
      e.spr = 'surgeon_reload';
      // Retrocede ligeramente
      AIUtils.move(e, e.x - u.x * 1.2 * dt, e.y - u.y * 1.2 * dt, map);
      return;
    }

    // Escape Cuántico (Teletransporte)
    if (d < 3 && e._teleportCd <= 0) {
      e._teleportCd = 5.0; // Cooldown
      // Buscar punto lejano
      let farX = e.x, farY = e.y;
      let maxD = 0;
      for (let y = 1; y < map.length - 1; y++) {
        for (let x = 1; x < map[0].length - 1; x++) {
          if (map[y][x] === 0) {
            const tempD = Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y);
            if (tempD > maxD) { maxD = tempD; farX = x + 0.5; farY = y + 0.5; }
          }
        }
      }
      e.x = farX; e.y = farY; // Teleport
      return;
    }

    // Kiting
    let dirm = 1;
    let ux = u.x, uy = u.y;
    if (d > 8) {
      dirm = 1; // Acercarse
    } else if (d < 5) {
      dirm = -1; // Alejarse
    } else {
      dirm = 0.3; // Strafing
      const side = Math.sin(nowT * 0.8 + e.x) > 0 ? 1 : -1;
      const p = AIUtils.perp(u.x, u.y, side);
      const un = AIUtils.norm(u.x * 0.2 + p.x * 0.9, u.y * 0.2 + p.y * 0.9);
      ux = un.x; uy = un.y;
      dirm = 1;
    }

    const sp = 1.5 * (0.4 + 1.2 * Math.exp(-bp * 3));
    e.spr = (((bp * 2) | 0) % 2 === 0 ? 'surgeon_walk1' : 'surgeon_walk2');
    AIUtils.move(e, e.x + ux * dirm * sp * dt, e.y + uy * dirm * sp * dt, map);
  }

  static onBeat(e, player, beatN, map, handlers) {
    const d = AIUtils.dist(e, player);
    if (d < 12 && AIUtils.canSee(e, player, map) && beatN % 2 === 0) {
      if (handlers.onSurgeonShoot) {
        handlers.onSurgeonShoot(e);
        if (d < 7) handlers.onSurgeonShoot(e);
      }
      e.spr = 'surgeon_aim';
      e._reloadT = 0.6;
    }
  }
}
