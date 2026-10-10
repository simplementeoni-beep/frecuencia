import { spawnList } from './EnemyFactory.js';

export class BossAI {
  static onBeat(b, player, enemies, map, handlers) {
    b.pulse = 1;
    b.beats = (b.beats || 0) + 1;
    const f = b.hp / b.max;
    const ph = f > 0.66 ? 1 : (f > 0.33 ? 2 : 3);
    if (ph !== b.phase) {
      b.phase = ph;
    }

    let minions = 0;
    enemies.forEach(e => {
      if (e.alive && e.type !== 'boss' && e.dying <= 0) minions++;
    });

    if (ph === 1) {
      if (b.beats % 4 === 0 && minions < 5) {
        spawnList([['zombie', 16.5, 2.5], ['cyst', 12.5, 7.5], ['zombie', 16.5, 12.5]], 0.6, map, enemies);
      }
    } else if (ph === 2) {
      if (b.beats % 2 === 0 && handlers.onBossShoot) handlers.onBossShoot(b, 3.0, 7);
      if (b.beats % 8 === 0 && minions < 6) {
        spawnList([['dog', 16.5, 7.5], ['cyst', 14.5, 4.5]], 0.4, map, enemies);
      }
    } else {
      if (handlers.onBossShoot) handlers.onBossShoot(b, 3.2, 7);
      if (b.beats % 6 === 0 && minions < 6) {
        spawnList([['zombie', 16.5, 2.5], ['orderly', 16.5, 7.5], ['surgeon', 16.5, 12.5]], 0.6, map, enemies);
      }
    }
  }
}
