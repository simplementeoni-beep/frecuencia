/**
 * Coordinador de Inteligencia Artificial
 * Aplica Clean Code y delega cada comportamiento a su propia clase especializada.
 */
import { AIUtils } from './AIUtils.js';
import { ZombieAI } from './ZombieAI.js';
import { DogAI } from './DogAI.js';
import { SurgeonAI } from './SurgeonAI.js';
import { OrderlyAI } from './OrderlyAI.js';
import { CystAI } from './CystAI.js';
import { BossAI } from './BossAI.js';

export class EnemyAI {
  /**
   * Actualiza el movimiento y la máquina de estados de un enemigo
   */
  static update(e, player, dt, bp, nowT, map, enemies, handlers) {
    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      if (e.type === 'orderly') e.spr = 'camillero_stun';
      else if (e.type === 'zombie') e.spr = 'zombie_stun';
      return;
    }

    if (e.type === 'zombie') ZombieAI.update(e, player, dt, bp, nowT, map, enemies);
    else if (e.type === 'dog') DogAI.update(e, player, dt, bp, nowT, map, enemies, handlers);
    else if (e.type === 'surgeon') SurgeonAI.update(e, player, dt, bp, nowT, map);
    else if (e.type === 'orderly') OrderlyAI.update(e, player, dt, bp, nowT, map, handlers);
    else if (e.type === 'cyst') CystAI.update(e, player, dt, enemies, handlers);

    if (e.type === 'boss') return; // Boss no se separa físicamente igual

    // Separación física entre todos los enemigos
    const r = e.hw * 0.8;
    enemies.forEach(o => {
      if (o === e || !o.alive) return;
      const ox = e.x - o.x, oy = e.y - o.y;
      const od = Math.hypot(ox, oy);
      const lim = o.type === 'boss' ? 0.9 : 0.42;
      if (od < lim && od > 0.001) {
        const push = (lim - od) * 0.55;
        const px2 = e.x + (ox / od) * push;
        const py2 = e.y + (oy / od) * push;
        AIUtils.move(e, px2, py2, map);
      }
    });
  }

  /**
   * Reacciones al compás rítmico (OnBeat)
   */
  static onBeat(e, player, beatN, map, enemies, handlers) {
    if (!e.alive || e.dying > 0 || (e.passive && e.type !== 'boss' && e.type !== 'cyst')) return;
    
    if (e.delay > 0 || e.stunTimer > 0) return;

    if (e.type === 'zombie') ZombieAI.onBeat(e, player, handlers);
    else if (e.type === 'dog') DogAI.onBeat(e, player, map);
    else if (e.type === 'surgeon') SurgeonAI.onBeat(e, player, beatN, map, handlers);
    else if (e.type === 'orderly') OrderlyAI.onBeat(e, player, map);
    else if (e.type === 'cyst') CystAI.onBeat(e, enemies);
    else if (e.type === 'boss') BossAI.onBeat(e, player, enemies, map, handlers);
  }
}
