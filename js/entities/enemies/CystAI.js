import { AIUtils } from './AIUtils.js';

export class CystAI {
  static update(e, player, dt, enemies, handlers) {
    if (e.state === 'overload') {
      e._overloadT -= dt;
      e.spr = 'cyst_' + (Math.floor(e._overloadT * 10) % 2 === 0 ? '4' : '3');
      
      if (e._overloadT <= 0) {
        // Detonación Masiva
        enemies.forEach(o => {
          if (o !== e && o.alive && o.type !== 'boss') {
            if (AIUtils.dist(e, o) < 2.5) {
              o.alive = false; // Mata a los enemigos en el radio
            }
          }
        });
        if (AIUtils.dist(e, player) < 2.5) {
          if (handlers.onHurtPlayer) handlers.onHurtPlayer(20, 0.8, true);
        }
        if (handlers.onExplodeCyst) handlers.onExplodeCyst(e);
        e.alive = false; // El quiste se destruye
      }
      return;
    }

    // Activar sobrecarga si el jugador se acerca o si recibió daño (simulado con cystBeat alto)
    if (AIUtils.dist(e, player) < 1.5 || e.cystBeat >= 2) {
      e.state = 'overload';
      e._overloadT = 1.2;
    } else {
      e.spr = 'cyst_1';
    }
  }

  static onBeat(e, enemies) {
    if (e.state === 'overload') {
      // Reacción en cadena
      enemies.forEach(o => {
        if (o !== e && o.alive && o.type === 'cyst' && AIUtils.dist(e, o) < 3.5) {
          o.cystBeat = 2; // Fuerza a explotar
        }
      });
    }
  }
}
