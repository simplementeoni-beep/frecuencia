/**
 * DemoGame: Versión especializada del motor FRECUENCIA para la demo interactiva.
 * Diseñado como un tutorial extendido de pasillo ("El Corredor del Despertar")
 * con progresión de armas, enemigos por oleadas y pantalla de finalización orientada a la feria CRAK.
 */
import { Game } from '../main.js';
import { buildDemoCorridor } from '../world/MapBuilder.js';
import { mkEnemy } from '../entities/enemies/EnemyFactory.js';
import { THEMES } from '../world/Themes.js';
import { OVERLAYS } from '../core/Constants.js';

export class DemoGame extends Game {
  constructor() {
    super();

    // Sobrescribir tema inicial con el hospital psiquiátrico
    this.theme = THEMES[0];
    this.maxComboReached = 1;
    this.totalEnemies = 6;
    this.enemiesKilled = 0;

    this.corridorState = {
      started: false,
      toldRhythm: false,
      pistolGiven: false,
      ambush2Triggered: false,
      ambush3Triggered: false,
      doorOpened: false,
      finished: false
    };

    // Registrar overlay de finalización de demo
    if (!OVERLAYS.includes('demo-finish')) {
      OVERLAYS.push('demo-finish');
    }

    this.setupDemoButtons();
  }

  showOverlay(name) {
    OVERLAYS.forEach(k => {
      const el = this.$(k);
      if (el) el.classList.toggle('hidden', k !== name);
    });
  }

  setupDemoButtons() {
    // Botón de reintento en la pantalla final
    this.$('btn-retry-demo')?.addEventListener('click', () => {
      this.retryDemo();
    });

    // Botón de reintento en caso de muerte
    this.$('btn-retry-dead')?.addEventListener('click', () => {
      this.retryDemo();
    });
  }

  loadLevel(n, fresh = false) {
    if (this.lbTimeout) {
      clearTimeout(this.lbTimeout);
      this.lbTimeout = null;
    }

    this.curLevel = 0;
    const b = buildDemoCorridor();
    this.map = b.g;
    this.MH = this.map.length;
    this.MW = this.map[0].length;
    this.lampGrid = new Uint8Array(this.MW * this.MH);
    b.lamps.forEach(p => {
      this.lampGrid[p[1] * this.MW + p[0]] = 1;
    });

    this.theme = THEMES[0];
    this.audio.musicLevel = 0;
    this.rhythm.setTempo(100, this.audio.actx);

    // Posición inicial del jugador en la celda inicial mirando hacia el este
    this.player.reset(0);
    this.player.x = 2.5;
    this.player.y = 4.0;
    this.player.a = 0;
    this.player.bob = 0;
    this.player.inventory = ['scalpel'];
    this.player.weapon = 'scalpel';

    this.enemies = [];
    this.projs = [];
    this.props = [];
    this.boss = null;
    this.tut = null;
    this.combo = 1;
    this.maxComboReached = 1;
    this.audio.updateLayers(this.combo);

    this.hp = 100;
    this.fx.fade = 1.4;

    // Props ambientales a lo largo del corredor
    this.props.push({ x: 1.8, y: 3.0, spr: 'bed', taken: false });
    this.props.push({ x: 15.0, y: 3.0, spr: 'pickup_ammo', taken: false, pick: true, type: 'ammo' });
    this.props.push({ x: 15.0, y: 2.3, spr: 'pickup_fe', taken: false, type: 'fe' });
    this.props.push({ x: 24.0, y: 5.6, spr: 'dead_body', taken: false });
    this.props.push({ x: 33.0, y: 2.4, spr: 'bones', taken: false });
    this.props.push({ x: 42.0, y: 4.0, spr: 'blood_puddle', taken: false });

    // Enemigos en progresión a lo largo del pasillo
    // 1. Zombi solitario (tutorial de golpe rítmico con bisturí)
    const e1 = mkEnemy('zombie', 9.5, 4.0);
    e1.hp = 2; e1.passive = false; e1.delay = 0;

    // 2. Emboscada intermedia: 2 zombis de vanguardia + 1 camillero resistente
    const e2 = mkEnemy('zombie', 20.5, 3.5);
    e2.hp = 2; e2.passive = true; e2.delay = 0;

    const e3 = mkEnemy('zombie', 22.0, 4.5);
    e3.hp = 2; e3.passive = true; e3.delay = 0;

    const e4 = mkEnemy('orderly', 24.5, 4.0);
    e4.hp = 4; e4.passive = true; e4.delay = 0;

    // 3. Emboscada final de alta tensión: 1 Perro experimental veloz + 1 Zombi
    const e5 = mkEnemy('dog', 33.5, 4.0);
    e5.hp = 2; e5.passive = true; e5.delay = 0;

    const e6 = mkEnemy('zombie', 35.5, 3.5);
    e6.hp = 2; e6.passive = true; e6.delay = 0;

    this.enemies = [e1, e2, e3, e4, e5, e6];
    this.totalEnemies = 6;
    this.enemiesKilled = 0;

    // Estado del corredor
    this.corridorState = {
      started: false,
      toldRhythm: false,
      pistolGiven: false,
      ambush2Triggered: false,
      ambush3Triggered: false,
      doorOpened: false,
      finished: false
    };

    this.toast.show('DESPERTAR: AVANZA POR EL PASILLO');
    this.updateHUDWeaponIcon();
  }

  updateHUDWeaponIcon() {
    const iconEl = this.$('btn-weapon-icon');
    if (iconEl) {
      iconEl.textContent = this.player.weapon === 'pistol' ? '🔫' : '🗡️';
    }
  }

  toggleWeapon() {
    if (this.player.inventory.includes('pistol')) {
      this.player.weapon = this.player.weapon === 'pistol' ? 'scalpel' : 'pistol';
      this.updateHUDWeaponIcon();
      this.toast.show(`ARMA: ${this.player.weapon === 'pistol' ? 'PISTOLA' : 'BISTURÍ'}`);
    }
  }

  update(dt) {
    super.update(dt);

    if (this.state !== 'play' || this.corridorState.finished) return;

    // Seguimiento del combo máximo alcanzado
    if (this.combo > this.maxComboReached) {
      this.maxComboReached = this.combo;
    }

    // Contar bajas de enemigos
    let aliveCount = 0;
    this.enemies.forEach(e => {
      if (e.alive && e.dying <= 0) aliveCount++;
    });
    this.enemiesKilled = this.totalEnemies - aliveCount;

    const px = this.player.x;

    // Evento 1: Comienza a caminar por el pasillo
    if (px > 5.0 && !this.corridorState.started) {
      this.corridorState.started = true;
    }

    // Evento 2: Recordatorio de ritmo al ver al primer zombi
    if (px > 6.8 && !this.corridorState.toldRhythm && this.enemies[0]?.alive) {
      this.corridorState.toldRhythm = true;
      this.toast.show('ATACA AL COMPÁS DEL RITMO (ON-BEAT) PARA MULTIPLICAR DAÑO');
    }

    // Evento 3: Recogida de la pistola en la camilla (x = 15)
    let gunTaken = false;
    this.props.forEach(p => { if (p.pick && p.taken) gunTaken = true; });

    if ((px > 14.2 || gunTaken) && !this.corridorState.pistolGiven) {
      this.corridorState.pistolGiven = true;
      this.player.addWeapon('pistol');
      this.player.weapon = 'pistol';
      this.player.ammo['pistol'] = Math.max(this.player.ammo['pistol'] || 0, 36);
      this.updateHUDWeaponIcon();
      this.toast.show('¡PISTOLA EQUIPADA! DISPARA A DISTANCIA AL COMPÁS');
    }

    // Evento 4: Activar segunda emboscada (zombis + camillero)
    if (px > 14.8 && !this.corridorState.ambush2Triggered) {
      this.corridorState.ambush2Triggered = true;
      if (this.enemies[1]) this.enemies[1].passive = false;
      if (this.enemies[2]) this.enemies[2].passive = false;
      if (this.enemies[3]) this.enemies[3].passive = false;
    }

    // Evento 5: Activar tercera emboscada clímax (perro veloz)
    if (px > 27.5 && !this.corridorState.ambush3Triggered) {
      this.corridorState.ambush3Triggered = true;
      if (this.enemies[4]) this.enemies[4].passive = false;
      if (this.enemies[5]) this.enemies[5].passive = false;
      this.toast.show('¡ALERTA! SUJETO EXPERIMENTAL APROXIMÁNDOSE');
    }

    // Evento 6: Abrir compuerta blindada al derrotar a todos los enemigos
    if (aliveCount === 0 && !this.corridorState.doorOpened) {
      this.corridorState.doorOpened = true;
      this.map[3][43] = 0;
      this.map[4][43] = 0;
      this.map[5][43] = 0;
      this.toast.show('¡COMPUERTA DESBLOQUEADA! CRUZA LA SALIDA');
      try {
        this.audio.sfxOnBeat?.();
      } catch (e) {}
    }

    // Evento 7: Cruce de la compuerta final
    if (px > 43.4 && !this.corridorState.finished) {
      this.corridorState.finished = true;
      this.finishDemo();
    }
  }

  finishDemo() {
    this.setState('demo-finish');
    this.showOverlay('demo-finish');

    if (this.audio) {
      this.audio.updateLayers(1);
    }

    // Liberar pointer lock si estaba activo
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }

    const shots = this.stats.shots || 0;
    const onBeat = this.stats.onBeat || 0;
    const accuracy = shots > 0 ? Math.round((onBeat / shots) * 100) : 0;
    const maxCombo = this.maxComboReached || 1;

    // Actualizar métricas en pantalla
    const elAcc = this.$('finish-accuracy');
    if (elAcc) elAcc.textContent = `${accuracy}%`;

    const elKills = this.$('finish-kills');
    if (elKills) elKills.textContent = `${this.enemiesKilled} / ${this.totalEnemies}`;

    const elCombo = this.$('finish-combo');
    if (elCombo) elCombo.textContent = `x${maxCombo}`;
  }

  retryDemo() {
    this.beginAt(0);
  }

  startDemo() {
    this.loadLevel(0, true);
    this.state = 'title';
    this.showOverlay('title');

    let last = performance.now();
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
