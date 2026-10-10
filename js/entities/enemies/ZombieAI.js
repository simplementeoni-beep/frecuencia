import { AIUtils } from './AIUtils.js';

export class ZombieAI {
  static update(e, player, dt, bp, nowT, map, enemies) {
    const d = AIUtils.dist(e, player);
    const hasSight = AIUtils.canSee(e, player, map);
    const u = AIUtils.norm(player.x - e.x, player.y - e.y);

    if (e.stunTimer > 0) {
      e.spr = 'zombie_stun';
      return;
    }

    if (hasSight && !e._sawPlayer) {
      e._alertT = 0.4;
      e._sawPlayer = true;
    }
    if (!hasSight && d > 6) e._sawPlayer = false;

    if (e._alertT > 0) {
      e._alertT -= dt;
      e.spr = e.spr || 'zombie_walk1';
      return;
    }

    if (d < 0.65) {
      e.spr = 'zombie_atk';
      return;
    }

    // Swarm AI: Repulsion from other zombies
    let fx = u.x, fy = u.y;
    enemies.forEach(o => {
      if (o === e || !o.alive || o.type !== 'zombie') return;
      const od = Math.hypot(e.x - o.x, e.y - o.y);
      if (od < 2.5 && od > 0.01) {
        const side = (e.x * 17 + e.y * 31) % 2 < 1 ? 1 : -1;
        fx += (-u.y * side) * 0.4 / (od + 0.5);
        fy += (u.x * side) * 0.4 / (od + 0.5);
      }
    });
    
    const fn = AIUtils.norm(fx, fy);
    const shamble = Math.sin(nowT * 2.5 + e.x * 10) * 0.3;
    const tx = fn.x * 0.85 - fn.y * shamble;
    const ty = fn.y * 0.85 + fn.x * shamble;
    const tn = AIUtils.norm(tx, ty);

    // Rhythmic Snap: Only move during the beat pulse
    const sp = 1.0 * (0.18 + 2.0 * Math.exp(-bp * 4.5));

    const frame = ((bp * 2) | 0) % 4;
    const frames = ['zombie_walk1', 'zombie_walk2', 'zombie_walk3', 'zombie_walk4'];
    e.spr = frames[frame] || 'zombie_walk1';

    AIUtils.move(e, e.x + tn.x * sp * dt, e.y + tn.y * sp * dt, map);
  }

  static onBeat(e, player, handlers) {
    if (AIUtils.dist(e, player) < 0.75) {
      if (handlers.onHurtPlayer) handlers.onHurtPlayer(7, 0.2, false);
    }
  }
}
