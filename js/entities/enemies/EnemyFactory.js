/**
 * Fábrica y generador de entidades enemigas
 */
import { solid } from '../../core/MathUtils.js';

export function mkEnemy(type, x, y) {
  const e = {
    type: type,
    x: x,
    y: y,
    hw: 0.2,
    hp: 3,
    flash: 0,
    dying: 0,
    dmax: 0.38,
    alive: true,
    delay: 2.6,
    tele: false,
    passive: false,
    scale: 1,
    state: 'walk',
    stateT: 0,
    stunTimer: 0,
    crouchT: 0,
    chargeX: 0,
    chargeY: 0,
    cystBeat: 0,
    pose: 'walk1',
    spr: type
  };

  if (type === 'dog') {
    e.hp = 2;
    e.hw = 0.3;
    e.dmax = 0.32;
  } else if (type === 'surgeon') {
    e.hp = 3;
    e.hw = 0.22;
    e.dmax = 0.42;
  } else if (type === 'orderly' || type === 'camillero') {
    e.type = 'orderly';
    e.hp = 6;
    e.hw = 0.34;
    e.dmax = 0.45;
    e.spr = 'camillero_walk1';
  } else if (type === 'cyst') {
    e.hp = 2;
    e.hw = 0.28;
    e.passive = true;
    e.dmax = 0.25;
    e.spr = 'cyst_1';
  } else if (type === 'boss') {
    e.spr = 'heart';
    e.hp = 160;
    e.max = 160;
    e.hw = 0.85;
    e.passive = true;
    e.delay = 2.5;
    e.phase = 1;
    e.dmax = 1.4;
    e.beats = 0;
  }

  return e;
}

export function spawnList(list, delay, map, enemiesArray) {
  list.forEach(p => {
    let sx = p[1], sy = p[2];
    if (solid(map, sx, sy)) {
      let found = false;
      for (let nr = 1; nr <= 3 && !found; nr++) {
        for (let dy = -nr; dy <= nr && !found; dy++) {
          for (let dx = -nr; dx <= nr && !found; dx++) {
            const nx = Math.floor(sx) + dx + 0.5;
            const ny = Math.floor(sy) + dy + 0.5;
            if (!solid(map, nx, ny)) {
              sx = nx;
              sy = ny;
              found = true;
            }
          }
        }
      }
      if (!found) return; // Si no hay celda libre, evitar fantasma
    }
    const e = mkEnemy(p[0], sx, sy);
    e.delay = delay;
    enemiesArray.push(e);
  });
}
