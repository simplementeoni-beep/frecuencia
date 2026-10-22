/**
 * Punto de entrada principal y orquestador del ciclo de juego (Frecuencia)
 */
import { W, H, OVERLAYS } from './core/Constants.js';
import { Config } from './core/Config.js';
import { canMove, solid } from './core/MathUtils.js';
import { THEMES } from './world/Themes.js';
import { LEVELS } from './world/LevelData.js';
import { WEAPONS } from './entities/Weapons.js';
import { Player } from './entities/Player.js';
import { mkEnemy, spawnList } from './entities/enemies/EnemyFactory.js';
import { EnemyAI } from './entities/enemies/EnemyAI.js';
import { generateSprites } from './render/SpriteGenerator.js';
import { Raycaster } from './render/Raycaster.js';
import { drawWeapon, drawCross, drawHUD, drawFX } from './render/ViewRenderer.js';
import { applyAnalogHorror, spawnDeathParticles, updateParticlesAdvanced } from './render/PostFX.js';
import { RhythmEngine } from './audio/RhythmEngine.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { AmbientSounds } from './audio/AmbientSounds.js';
import { InputManager } from './ui/InputManager.js';
import { Toast } from './ui/Toast.js';
import { Leaderboard } from './ui/Leaderboard.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.stage = document.getElementById('stage');
    this.raycaster = new Raycaster(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    const { SPR, SPRDEF } = generateSprites();
    this.SPR = SPR;
    this.SPRDEF = SPRDEF;

    this.rhythm = new RhythmEngine(100);
    this.audio = new AudioEngine(this.rhythm);
    this.ambient = new AmbientSounds();
    this.input = new InputManager(this.stage);
    this.toast = new Toast();
    this.player = new Player();

    // Estado del juego
    this.state = 'title';
    this.stateT = 0;
    this.combo = 1;
    this.hp = 100;
    this.nowT = 0;
    this.memTimer = 0;
    this.cardT = 0;
    this.curLevel = 0;
    this.waveIdx = 0;
    this.levelT = 0;
    this.beatN = 0;
    this.gameStartTime = 0;
    this.playerName = 'JUGADOR';
    this.lbTimeout = null;
    this.difficulty = 1; // 0: Fácil, 1: Normal, 2: Difícil
    this.levelTimer = null; // Temporizador para el Quirófano
    this.warnedOverload = false;

    // Entidades del mundo
    this.map = [];
    this.MW = 0;
    this.MH = 0;
    this.lampGrid = new Uint8Array(1);
    this.theme = THEMES[0];
    this.enemies = [];
    this.projs = [];
    this.props = [];
    this.particles = [];
    this.boss = null;
    this.tut = null;

    // Efectos visuales y combate
    this.weapon = { cd: 0, recoil: 0, flash: 0, slash: 0 };
    this.fx = { hurt: 0, onBeat: 0, shake: 0, pulse: 0, fade: 0, shield: 0, envElectric: 0, envAnalog: 0, envParanoia: 0 };
    this.stats = { shots: 0, onBeat: 0 };

    // Typewriter para escenas de memoria
    this.memTypeText = '';
    this.memTypeIdx = 0;
    this.memTypeTimer = 0;

    // Motas y esporas flotantes
    this.motes = [];
    for (let mi = 0; mi < 24; mi++) {
      this.motes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 8,
        sz: Math.random() * 2 + 1,
        al: Math.random() * 0.5 + 0.2
      });
    }

    this.setupUI();
    this.setupDevTools();
  }

  $(id) {
    return document.getElementById(id);
  }

  showOverlay(name) {
    OVERLAYS.forEach(k => {
      const el = this.$(k);
      if (el) el.classList.toggle('hidden', k !== name);
    });
    // Mostrar el botón de pantalla completa solo en menús, ocultarlo en gameplay
    const fsBtn = this.$('btn-fullscreen');
    if (fsBtn) {
      fsBtn.style.display = (name === null) ? 'none' : '';
    }
  }

  setState(s) {
    this.state = s;
    this.stateT = 0;
  }

  setupUI() {
    this.$('go')?.addEventListener('click', () => {
      this.showOverlay('name-input');
      setTimeout(() => {
        this.$('player-name-field')?.focus();
      }, 100);
    });

    this.$('btn-confirm-name')?.addEventListener('click', () => {
      const v = this.$('player-name-field')?.value.trim().toUpperCase();
      if (v) this.playerName = v.substring(0, 10);
      this.beginAt(0);
    });

    this.$('player-name-field')?.addEventListener('keydown', e => {
      if (e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.$('btn-confirm-name')?.click();
      }
    });

    this.$('btn-leaderboard-close')?.addEventListener('click', () => {
      if (this.lbTimeout) {
        clearTimeout(this.lbTimeout);
        this.lbTimeout = null;
      }
      this.setState('title');
      this.showOverlay('title');
    });

    this.$('btn-fullscreen')?.addEventListener('click', () => {
      const elem = this.stage;
      if (!document.fullscreenElement) {
        if (elem?.requestFullscreen) elem.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    });

    document.querySelectorAll('#levels button').forEach(b => {
      b.addEventListener('click', () => {
        this.beginAt(parseInt(b.getAttribute('data-level'), 10));
      });
    });

    document.querySelectorAll('.diff-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const diffStr = e.target.getAttribute('data-diff');
        this.difficulty = diffStr === 'easy' ? 0 : (diffStr === 'hard' ? 2 : 1);
      });
    });

    window.addEventListener('gamepadconnected', e => {
      const padEl = this.$('pad');
      if (padEl) padEl.textContent = 'Mando: ' + e.gamepad.id.substring(0, 32);
      // Diagnóstico de ejes al conectar el mando
      const gp = e.gamepad;
      const axisInfo = gp.axes.map((v, i) => `A${i}:${v.toFixed(2)}`).join(' ');
      const btnCount = gp.buttons.length;
      this.toast.show(`🎮 MANDO CONECTADO · ${btnCount} botones · ${gp.axes.length} ejes`);
      console.log('[FRECUENCIA] Mando conectado:', gp.id);
      console.log('[FRECUENCIA] Ejes:', axisInfo);
      console.log('[FRECUENCIA] Tip: usa __frec.pad() para ver ejes en tiempo real');
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.toast.show('⚠️ MANDO DESCONECTADO');
    });
  }

  showOffset() {
    const offEl = this.$('off');
    if (offEl) {
      offEl.textContent = (this.rhythm.userOffset >= 0 ? '+' : '') + Math.round(this.rhythm.userOffset * 1000) + ' ms';
    }
  }

  loadLevel(n, fresh = false) {
    if (this.lbTimeout) {
      clearTimeout(this.lbTimeout);
      this.lbTimeout = null;
    }

    this.curLevel = n;
    const L = LEVELS[n];
    const b = L.build();
    this.map = b.g;
    this.MH = this.map.length;
    this.MW = this.map[0].length;
    this.lampGrid = new Uint8Array(this.MW * this.MH);
    b.lamps.forEach(p => {
      this.lampGrid[p[1] * this.MW + p[0]] = 1;
    });

    this.theme = THEMES[n];
    this.audio.musicLevel = n;
    this.rhythm.setTempo(L.bpm, this.audio.actx);

    this.player.x = L.start[0];
    this.player.y = L.start[1];
    this.player.a = L.start[2];
    this.player.bob = 0;

    if (fresh) {
      this.player.reset(n);
    } else if (L.weapon) {
      this.player.addWeapon(L.weapon);
      this.player.weapon = L.weapon;
    }

    this.enemies = [];
    this.projs = [];
    this.props = [];
    this.boss = null;
    this.waveIdx = 0;
    this.levelT = 0;
    this.beatN = 0;
    this.tut = null;
    this.combo = 1;
    this.levelTimer = null;
    this.warnedOverload = false;
    this.audio.updateLayers(this.combo);

    this.hp = fresh ? 100 : Math.min(100, this.hp + 40);
    this.fx.fade = 0;

    if (n === 0) {
      this.props.push({ x: 1.7, y: 3.5, spr: 'bed', taken: false });
      this.props.push({ x: 8.5, y: 3.5, spr: 'pickup_ammo', taken: false, pick: true, type: 'ammo' });
      this.props.push({ x: 5.5, y: 2.2, spr: 'pickup_fe', taken: false, type: 'fe' });
      this.tut = { step: 0, dist: 0, turn: 0, lx: this.player.x, ly: this.player.y, la: this.player.a, doorOpen: false };
      this.toast.show('DESPERTAR: CAMINA CON W/A/S/D');
    } else if (L.boss) {
      // El Corazón en el centro de la gran cámara (15.5, 12.0)
      this.boss = mkEnemy('boss', 15.5, 12.0);
      this.enemies.push(this.boss);

      // Flechas y arterias biológicas luminosas que guían al jugador desde el inicio (3.5, 3.5)
      this.props.push(
        // Tramo Este
        { x: 6.0, y: 3.0, spr: 'vein_arrow_east' },
        { x: 9.0, y: 3.0, spr: 'vein_arrow_east' },
        { x: 12.0, y: 3.0, spr: 'vein_arrow_east' },
        // Giro hacia el Sur
        { x: 15.0, y: 3.0, spr: 'vein_arrow_south' },
        // Tramo Sur hacia la cámara
        { x: 15.0, y: 5.5, spr: 'vein_arrow_south' },
        { x: 15.0, y: 8.0, spr: 'vein_arrow_south' },
        { x: 15.0, y: 10.5, spr: 'vein_arrow_south' },
        // Suministros y decoraciones en la cámara del jefe
        { x: 12.5, y: 12.0, spr: 'pickup_ammo', taken: false, type: 'ammo' },
        { x: 18.5, y: 12.0, spr: 'pickup_medkit', taken: false, type: 'medkit' },
        { x: 15.5, y: 8.5, spr: 'pickup_ammo', taken: false, type: 'ammo' },
        { x: 13.5, y: 10.5, spr: 'flesh_veins' },
        { x: 17.5, y: 10.5, spr: 'flesh_veins' },
        { x: 15.5, y: 14.5, spr: 'blood_puddle' }
      );
      this.toast.show('EL CORAZÓN · SIGUE EL FLUJO DE LAS ARTERIAS');
    } else {
      if (n === 1) {
        this.props.push({ x: 8.5, y: 4.5, spr: 'pickup_ammo', taken: false, type: 'ammo' });
        this.props.push({ x: 14.5, y: 4.5, spr: 'pickup_medkit', taken: false, type: 'medkit' });
        this.props.push({ x: 21.5, y: 4.5, spr: 'pickup_fe', taken: false, type: 'fe' });
        this.props.push(
          { x: 3.5, y: 2.5, spr: 'dead_body' }, { x: 16.5, y: 6.5, spr: 'dead_body' }, { x: 22.5, y: 2.5, spr: 'dead_body' },
          { x: 4.5, y: 2.5, spr: 'blood_puddle' }, { x: 12.5, y: 4.5, spr: 'blood_puddle' }, { x: 18.5, y: 6.5, spr: 'blood_puddle' }
        );
        this.toast.show('LA MORGUE · NIVEL 1');
      } else if (n === 2) {
        this.props.push({ x: 10.5, y: 5.5, spr: 'pickup_ammo', taken: false, type: 'ammo' });
        this.props.push({ x: 18.5, y: 5.5, spr: 'pickup_medkit', taken: false, type: 'medkit' });
        this.props.push(
          { x: 6.5, y: 4.5, spr: 'bones' }, { x: 14.5, y: 2.5, spr: 'bones' }, { x: 22.5, y: 8.5, spr: 'bones' },
          { x: 8.5, y: 4.5, spr: 'blood_puddle' }, { x: 12.5, y: 7.5, spr: 'blood_puddle' }
        );
        this.toast.show('LA PERRERA · NIVEL 2');
      } else if (n === 3) {
        // Temporizador de sobrecarga según dificultad: Fácil 120s, Normal 90s, Difícil 60s
        const times = [120, 90, 60];
        this.levelTimer = times[this.difficulty] !== undefined ? times[this.difficulty] : 90;
        this.warnedOverload = false;
        this.props.push({ x: 11.5, y: 7.5, spr: 'pickup_ammo', taken: false, type: 'ammo' });
        this.props.push({ x: 15.5, y: 7.5, spr: 'pickup_medkit', taken: false, type: 'medkit' });
        this.props.push(
          { x: 9.5, y: 5.5, spr: 'surgical_tray' }, { x: 13.5, y: 9.5, spr: 'surgical_tray' },
          { x: 10.5, y: 6.5, spr: 'blood_puddle' }, { x: 12.5, y: 8.5, spr: 'blood_puddle' }, { x: 11.5, y: 4.5, spr: 'blood_puddle' }
        );
        this.toast.show('EL QUIRÓFANO · EVITA LA SOBRECARGA DEL GENERADOR');
      }
      spawnList(L.waves[0], 2.6, this.map, this.enemies);
    }
  }

  startLevel(n, fresh = false) {
    this.loadLevel(n, fresh);
    const L = LEVELS[n];
    if (this.$('cardsub')) this.$('cardsub').textContent = L.sub;
    if (this.$('cardname')) this.$('cardname').textContent = L.name;
    if (this.$('cardweapon')) this.$('cardweapon').textContent = L.weaponName;
    this.cardT = 2.6;
    this.setState('card');
    this.showOverlay('card');
  }

  enterPlay() {
    this.setState('play');
    this.showOverlay(null);
    if (this.curLevel === 0) this.fx.fade = 1.6;
  }

  beginAt(n) {
    if (this.lbTimeout) {
      clearTimeout(this.lbTimeout);
      this.lbTimeout = null;
    }
    this.audio.init();
    this.audio.resume();
    // Inicializar sonidos ambientales con el mismo AudioContext
    if (this.audio.actx && !this.ambient.loaded) {
      this.ambient.init(this.audio.actx);
    }
    this.stats.shots = 0;
    this.stats.onBeat = 0;
    this.gameStartTime = performance.now();
    this.startLevel(n, true);
  }

  advance() {
    if (this.lbTimeout) {
      clearTimeout(this.lbTimeout);
      this.lbTimeout = null;
    }
    if (this.stateT < 0.3 && this.state !== 'title') return;
    if (this.state === 'title') this.beginAt(0);
    else if (this.state === 'card') this.enterPlay();
    else if (this.state === 'dead') this.startLevel(this.curLevel, true);
    else if (this.state === 'memory') this.startLevel(this.curLevel + 1, false);
    else if (this.state === 'win') this.beginAt(0);
  }

  completeLevel() {
    if (this.curLevel === 0) {
      this.startLevel(1, false);
      return;
    }
    if (this.curLevel === 4) {
      this.ending();
      return;
    }
    const m = LEVELS[this.curLevel].memory;
    if (this.$('memhead')) this.$('memhead').textContent = m.head;
    if (this.$('memquote')) this.$('memquote').textContent = '';
    this.memTypeText = m.text;
    this.memTypeIdx = 0;
    this.memTypeTimer = 0;
    this.memTimer = 5.5 + m.text.length * 0.045;
    this.setState('memory');
    this.showOverlay('memory');
  }

  ending() {
    const pct = this.stats.shots ? Math.round(100 * this.stats.onBeat / this.stats.shots) : 0;
    if (this.$('stats')) {
      this.$('stats').textContent = `Disparos al compás: ${pct} % (${this.stats.onBeat} de ${this.stats.shots}).`;
    }
    this.combo = 1;
    this.audio.updateLayers(this.combo);
    this.setState('win');
    this.showOverlay('win');

    const timeTaken = (performance.now() - this.gameStartTime) / 1000;
    Leaderboard.save(this.playerName, timeTaken, this.stats.shots, 'Superado');

    if (this.lbTimeout) {
      clearTimeout(this.lbTimeout);
      this.lbTimeout = null;
    }
    this.lbTimeout = setTimeout(() => {
      this.lbTimeout = null;
      Leaderboard.render(this.$('leaderboard-body'));
      this.showOverlay('leaderboard');
    }, 4000);
  }

  skipLevel() {
    if (this.curLevel === 0 || this.curLevel === 4) this.completeLevel();
    else this.startLevel(this.curLevel + 1, false);
  }

  pBlocked(x, y) {
    return this.boss && this.boss.alive && Math.hypot(x - this.boss.x, y - this.boss.y) < 0.95;
  }

  hurt(n) {
    if (this.state !== 'play') return;
    this.hp -= n;
    this.fx.hurt = 0.38;
    this.fx.shake = 0.28;
    this.audio.sfxHurt();
    if (this.combo > 1) {
      this.combo--;
      this.audio.updateLayers(this.combo);
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.combo = 1;
      this.audio.updateLayers(this.combo);
      this.setState('dead');
      this.showOverlay('dead');

      const timeTaken = (performance.now() - this.gameStartTime) / 1000;
      Leaderboard.save(this.playerName, timeTaken, this.stats.shots, 'Muerto');

      if (this.lbTimeout) {
        clearTimeout(this.lbTimeout);
        this.lbTimeout = null;
      }
      this.lbTimeout = setTimeout(() => {
        this.lbTimeout = null;
        Leaderboard.render(this.$('leaderboard-body'));
        this.showOverlay('leaderboard');
      }, 4000);
    }
  }

  shootAt(e, speed, dmg) {
    const dx = this.player.x - e.x, dy = this.player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    this.projs.push({
      x: e.x, y: e.y,
      vx: dx / d * speed, vy: dy / d * speed,
      life: 7, dmg: dmg, spr: 'orb'
    });
  }

  explodeCyst(c) {
    c.alive = false;
    c.hp = 0;
    c.dying = 0.1;
    this.audio.sfxCrash();
    this.fx.shake = Math.max(this.fx.shake, 0.32);
    if (Math.hypot(c.x - this.player.x, c.y - this.player.y) < 1.9) {
      this.hurt(18);
    }
    this.enemies.forEach(o => {
      if (o !== c && o.alive && Math.hypot(o.x - c.x, o.y - c.y) < 2.6) {
        this.hitEnemy(o, 3.5, true);
      }
    });
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      this.projs.push({
        x: c.x, y: c.y,
        vx: Math.cos(ang) * 3.4, vy: Math.sin(ang) * 3.4,
        life: 2.5, dmg: 6, spr: 'orb'
      });
    }
  }

  hitEnemy(e, dmg, on) {
    if (e.type === 'boss') {
      if (on) {
        e.hp -= dmg;
        e.flash = 0.14;
        this.fx.shake = Math.max(this.fx.shake, 0.15);
        this.audio.sfxHit();
      } else {
        e.hp -= 0.3;
        this.audio.sfxClink();
        this.fx.shield = 0.4;
      }
      if (e.hp <= 0 && e.dying <= 0) {
        e.hp = 0;
        e.dying = e.dmax;
        this.audio.sfxDie();
      }
      return;
    }

    if (e.type === 'cyst') {
      e.hp -= dmg;
      e.flash = 0.12;
      if (e.hp <= 0) this.explodeCyst(e);
      return;
    }

    e.hp -= dmg;
    e.flash = 0.12;
    if (on) {
      if (e.type === 'zombie') { e.stunTimer = this.rhythm.beat * 1.4; this.audio.sfxStun(); }
      else if (e.type === 'dog') { e.stunTimer = this.rhythm.beat * 0.8; this.audio.sfxStun(); }
      else if (e.type === 'surgeon') { e.stunTimer = this.rhythm.beat * 1.1; this.audio.sfxStun(); }
      else if (e.type === 'orderly' && e.state === 'stun') { e.hp -= dmg * 1.4; }
    }
    
    // Scale damage reduction based on difficulty (harder = more HP for enemies implicitly)
    if (this.difficulty === 2) e.hp += dmg * 0.2; // takes 20% less damage
    else if (this.difficulty === 0) e.hp -= dmg * 0.3; // takes 30% more damage

    if (e.hp <= 0 && e.dying <= 0) {
      e.dying = e.dmax;
      this.audio.sfxDie();
      if (e.type === 'dog') e.spr = 'dog_dead';
      else if (e.type === 'orderly') e.spr = 'camillero_dead';
    } else {
      this.audio.sfxHit();
    }
  }

  fire(press) {
    if (this.state !== 'play' || !this.player.weapon || this.weapon.cd > 0) return;
    const kind = this.player.weapon;
    const WD = WEAPONS[kind];

    if (WD.ammo !== -1 && this.player.ammo[kind] <= 0) {
      this.audio.sfxClink();
      return;
    }
    if (WD.ammo !== -1) this.player.ammo[kind]--;

    const recoilAmt = kind === 'shotgun' ? Config.shotgunRecoil : (kind === 'smg' ? Config.smgRecoil : (kind === 'defib' ? Config.defibRecoil : Config.pistolRecoil));
    this.weapon.cd = WD.cd;
    this.weapon.recoil = recoilAmt;
    this.weapon.flash = kind === 'scalpel' ? 0 : 0.07;
    this.weapon.slash = kind === 'scalpel' ? 1 : 0;
    this.stats.shots++;

    if (kind === 'shotgun') this.fx.shake = Math.max(this.fx.shake, 0.72);
    else if (kind === 'smg') this.fx.shake = Math.max(this.fx.shake, 0.22);
    else if (kind === 'defib') this.fx.shake = Math.max(this.fx.shake, 0.52);
    else if (kind === 'pistol') this.fx.shake = Math.max(this.fx.shake, 0.12);

    const on = this.rhythm.isOnBeat(this.audio.actx);
    if (press) {
      if (on) {
        this.stats.onBeat++;
        if (this.combo < 4) this.combo++;
        this.fx.onBeat = 0.6;
      } else {
        if (this.combo > 1) this.combo--;
      }
      this.audio.updateLayers(this.combo);
    }
    this.audio.sfxShoot(kind, on && press);

    const mult = 1 + 0.5 * (this.combo - 1);
    const dirX = Math.cos(this.player.a), dirY = Math.sin(this.player.a);
    const plX = -Math.sin(this.player.a) * 0.66, plY = Math.cos(this.player.a) * 0.66;
    const inv = 1 / (plX * dirY - dirX * plY);
    const cand = [];

    this.enemies.forEach(e => {
      if (!e.alive || e.dying > 0) return;
      const sx = e.x - this.player.x, sy = e.y - this.player.y;
      const tX = inv * (dirY * sx - dirX * sy);
      const tY = inv * (-plY * sx + plX * sy);
      if (tY < 0.15 || tY > WD.range) return;
      const col = Math.floor((W / 2) * (1 + tX / tY));
      if (col < 0 || col >= W) return;
      if (tY > this.raycaster.zbuf[col] + 0.05) return;

      const dev = Math.abs(tX / tY);
      let tol;
      if (kind === 'scalpel') tol = Math.max(0.45, (e.hw * 1.8) / tY + 0.25);
      else if (kind === 'shotgun') tol = Math.max(0.28, (e.hw + 0.35) / tY + 0.12);
      else if (kind === 'defib') tol = Math.max(0.35, (e.hw * 1.5) / tY + 0.18);
      else tol = Math.max(0.14, (e.hw * 1.2) / tY + 0.06);

      if (dev < tol) cand.push({ e: e, t: tY });
    });

    cand.sort((a, b) => a.t - b.t);

    if (kind === 'scalpel') {
      if (cand.length) {
        this.hitEnemy(cand[0].e, WD.dmg * mult * (on ? 2.2 : 1.0), on);
        this.fx.shake = Math.max(this.fx.shake, 0.22);
      }
    } else if (kind === 'shotgun') {
      cand.slice(0, 4).forEach(c => {
        this.hitEnemy(c.e, WD.dmg * mult * (1 - Math.min(0.7, c.t / 14)), on);
      });
    } else if (cand.length) {
      this.hitEnemy(cand[0].e, WD.dmg * mult, on);
    }
  }

  onBeat() {
    this.fx.pulse = 1;
    this.beatN++;
    if (this.state !== 'play') return;

    this.enemies.forEach(e => {
      EnemyAI.onBeat(e, this.player, this.beatN, this.map, this.enemies, {
        onHurtPlayer: (amt, shake, crash) => {
          // El daño escala con el nivel y la dificultad
          let lvlMult = 1 + this.curLevel * 0.35;
          if (this.difficulty === 0) lvlMult *= 0.6;
          else if (this.difficulty === 2) lvlMult *= 1.5;
          
          this.hurt(amt * lvlMult);
          this.fx.shake = Math.max(this.fx.shake, shake);
          if (crash) this.audio.sfxCrash();
        },
        onExplodeCyst: cyst => this.explodeCyst(cyst),
        onSurgeonShoot: surgeon => {
          const onB = this.rhythm.isOnBeat(this.audio.actx);
          // FIX: en-ritmo = más rápido y más daño. Estaba invertido antes.
          const spd = onB ? 4.8 : 3.2;
          const dmg = onB ? 8 : 4;
          this.shootAt(surgeon, spd, dmg);
        },
        onBossShoot: (boss, spd, dmg) => this.shootAt(boss, spd, dmg)
      });
    });

    // Destello de tensión al compás en Quirófano
    if (this.curLevel === 3 && this.beatN % 8 === 0) {
      this.fx.envElectric = 0.35;
    }
  }

  tutorialUpdate(dt) {
    if (!this.tut) return;
    const moved = Math.hypot(this.player.x - this.tut.lx, this.player.y - this.tut.ly);
    const turned = Math.abs(this.player.a - this.tut.la);
    this.tut.lx = this.player.x;
    this.tut.ly = this.player.y;
    this.tut.la = this.player.a;

    if (this.tut.step === 0) {
      this.tut.dist += moved;
      if (this.tut.dist > 2.0) {
        this.tut.step = 1;
        this.toast.show('GIRA CON FLECHAS O TECLAS Q / E');
      }
    } else if (this.tut.step === 1) {
      this.tut.turn += turned;
      let gunTaken = false;
      this.props.forEach(p => { if (p.pick && p.taken) gunTaken = true; });
      if (this.tut.turn > 0.9 || gunTaken) {
        this.tut.step = 2;
        this.toast.show('RECOGE EL ARMA DEL SUELO');
      }
    } else if (this.tut.step === 2) {
      this.props.forEach(p => {
        if (p.pick && p.taken) {
          this.player.addWeapon('pistol');
          this.player.weapon = 'pistol';
          this.tut.step = 3;
          this.toast.show('DISPARA JUSTO CUANDO EL CÍRCULO LLEGUE AL CENTRO');
          [[12, 2.3], [12, 4.7]].forEach(q => {
            const e = mkEnemy('zombie', q[0], q[1]);
            e.hp = 2; e.passive = false; e.delay = 0;
            this.enemies.push(e);
          });
        }
      });
    } else if (this.tut.step === 3) {
      let left = 0;
      this.enemies.forEach(e => {
        if (e.alive && e.dying <= 0) left++;
      });
      if (left === 0) {
        this.tut.step = 4;
        this.map[3][13] = 0;
        this.toast.show('¡LA PUERTA SE HA ABIERTO! CRÚZALA');
      }
    } else if (this.tut.step === 4) {
      if (this.player.x > 13.1) {
        this.completeLevel();
      }
    }
  }

  update(dt) {
    this.nowT += dt;
    this.stateT += dt;

    this.updateEnvironment(dt);

    const bi = this.rhythm.beatInfo(this.audio.actx);
    if (this.rhythm.lastBeatIdx !== bi.idx) {
      this.rhythm.lastBeatIdx = bi.idx;
      this.onBeat();
    }

    this.updateFx(dt);

    const inputData = this.input.poll(dt);
    if (inputData.offsetDelta !== 0) {
      this.rhythm.adjustOffset(inputData.offsetDelta);
      this.showOffset();
    }

    if (this.handleGameState(inputData, dt)) return;

    this.levelT += dt;

    if (inputData.skip) this.skipLevel();

    this.updatePlayerActions(inputData, dt);
    this.updatePlayerMovement(inputData, dt);
    this.updatePickups();
    this.updateCombat(inputData);
    this.updateEntities(dt, bi);

    if (this.curLevel === 0 && this.tut) this.tutorialUpdate(dt);

    // Gestión del temporizador de sobrecarga en el Nivel 3 (Quirófano)
    if (this.state === 'play' && this.curLevel === 3 && this.levelTimer !== null) {
      this.levelTimer -= dt;

      if (this.levelTimer <= 15 && !this.warnedOverload) {
        this.warnedOverload = true;
        this.toast.show('¡ALERTA! SOBRECARGA INMINENTE DEL GENERADOR');
        try { this.audio.sfxHurt?.(); } catch (e) {}
      }

      if (this.levelTimer <= 15) {
        this.fx.envElectric = Math.max(this.fx.envElectric, 0.2 + 0.25 * Math.sin(this.nowT * 14));
        if (this.beatN % 2 === 0) {
          this.fx.shake = Math.max(this.fx.shake, 0.12);
        }
      }

      if (this.levelTimer <= 0) {
        this.levelTimer = 0;
        this.fx.envElectric = 1.0;
        this.fx.shake = 0.8;
        this.toast.show('¡SOBRECARGA FATAL DEL GENERADOR!');
        this.hurt(999);
      }
    }

    // Efecto de proximidad y latido hacia El Corazón en Nivel 4
    if (this.state === 'play' && this.curLevel === 4 && this.boss && this.boss.alive) {
      const distToHeart = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
      const proximity = Math.max(0, 1 - distToHeart / 18);
      if (proximity > 0.15) {
        this.fx.pulse = Math.max(this.fx.pulse, proximity * 0.85);
      }
    }

    this.checkWaveProgress();
  }

  updateEnvironment(dt) {
    const ambientEvent = this.ambient.update(dt, {
      hp: this.hp, enemies: this.enemies,
      curLevel: this.curLevel, state: this.state
    });
    if (ambientEvent === 'electric') this.fx.envElectric = 2.5;
    if (ambientEvent === 'analog') this.fx.envAnalog = 3.0;
    if (ambientEvent === 'paranoia') this.fx.envParanoia = 4.0;
    if (ambientEvent === 'impact') this.fx.shake = Math.max(this.fx.shake, 0.5);

    this.motes.forEach(m => {
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < 0) m.x = W; if (m.x > W) m.x = 0;
      if (m.y < 0) m.y = H; if (m.y > H) m.y = 0;
    });
  }

  updateFx(dt) {
    this.fx.pulse = Math.max(0, this.fx.pulse - dt * 5);
    this.toast.update(dt);
    this.fx.hurt = Math.max(0, this.fx.hurt - dt);
    this.fx.shake = Math.max(0, this.fx.shake - dt);
    this.fx.onBeat = Math.max(0, this.fx.onBeat - dt);
    this.fx.fade = Math.max(0, this.fx.fade - dt);
    this.fx.shield = Math.max(0, this.fx.shield - dt);
    this.fx.envElectric = Math.max(0, this.fx.envElectric - dt);
    this.fx.envAnalog = Math.max(0, this.fx.envAnalog - dt);
    this.fx.envParanoia = Math.max(0, this.fx.envParanoia - dt);
    this.weapon.cd = Math.max(0, this.weapon.cd - dt);
    this.weapon.recoil = Math.max(0, this.weapon.recoil - dt * 6);
    this.weapon.flash = Math.max(0, this.weapon.flash - dt);
    this.weapon.slash = Math.max(0, (this.weapon.slash || 0) - dt * 5);
  }

  handleGameState(inputData, dt) {
    if (inputData.advance && (this.state === 'dead' || this.state === 'memory' || this.state === 'win' || this.state === 'card')) {
      this.advance();
    }
    if (this.state === 'card') {
      this.cardT -= dt;
      if (this.cardT <= 0) this.enterPlay();
      return true;
    }
    if (this.state === 'memory') {
      this.memTimer -= dt;
      if (this.memTimer <= 0) this.startLevel(this.curLevel + 1, false);
      if (this.memTypeIdx < this.memTypeText.length) {
        this.memTypeTimer += dt;
        const charsM = Math.floor(this.memTypeTimer / 0.038);
        if (charsM > 0) {
          this.memTypeIdx = Math.min(this.memTypeText.length, this.memTypeIdx + charsM);
          if (this.$('memquote')) this.$('memquote').textContent = this.memTypeText.substring(0, this.memTypeIdx);
          this.memTypeTimer = 0;
        }
      }
      return true;
    }
    return this.state !== 'play';
  }

  updatePlayerActions(inputData, dt) {
    if (inputData.weaponKey) {
      this.player.selectWeapon(inputData.weaponKey, w => {
        this.audio.sfxPick(); this.toast.show(w.name);
      });
    }
    if (inputData.cycle !== 0) {
      this.player.cycleWeapon(inputData.cycle, w => {
        this.audio.sfxPick(); this.toast.show(w.name);
      });
    }
  }

  updatePlayerMovement(inputData, dt) {
    this.player.a += inputData.turn * Config.turnSpeed * dt;
    
    // Multiplicador de velocidad de enemigos simulado moviendo más lento al jugador en difícil
    // Y más rápido en fácil
    let spdMult = 1.0;
    if (this.difficulty === 0) spdMult = 1.15;
    else if (this.difficulty === 2) spdMult = 0.9;
    
    const dx = Math.cos(this.player.a), dy = Math.sin(this.player.a);
    const vx = (dx * inputData.mv - dy * inputData.st) * Config.playerSpeed * spdMult * dt;
    const vy = (dy * inputData.mv + dx * inputData.st) * Config.playerSpeed * spdMult * dt;

    if (canMove(this.map, this.player.x + vx, this.player.y, 0.2) && !this.pBlocked(this.player.x + vx, this.player.y)) {
      this.player.x += vx;
    }
    if (canMove(this.map, this.player.x, this.player.y + vy, 0.2) && !this.pBlocked(this.player.x, this.player.y + vy)) {
      this.player.y += vy;
    }

    this.player.moving = (inputData.mv !== 0 || inputData.st !== 0);
    if (this.player.moving) this.player.bob += dt * 8;
  }

  updatePickups() {
    this.props.forEach(p => {
      if (p.taken) return;
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < Config.pickupRadius) {
        if (p.type === 'ammo' || p.spr === 'pickup_ammo') {
          p.taken = true; this.audio.sfxPick();
          this.player.addAmmo('pistol', 12); this.player.addAmmo('shotgun', 4);
          this.player.addAmmo('smg', 30); this.player.addAmmo('defib', 3);
        } else if (p.type === 'medkit' || p.spr === 'pickup_medkit') {
          p.taken = true; this.audio.sfxPick();
          this.hp = Math.min(100, this.hp + 35);
        } else if (p.type === 'fe' || p.spr === 'pickup_fe') {
          p.taken = true; this.audio.sfxPick();
        }
      }
    });
  }

  updateCombat(inputData) {
    if (inputData.firePressed) {
      this.fire(true);
    } else if (inputData.fireHeld && this.player.weapon && WEAPONS[this.player.weapon].auto && this.weapon.cd <= 0) {
      this.fire(false);
    }
  }

  updateEntities(dt, bi) {
    this.enemies.forEach(e => {
      if (!e.alive) return;
      if (e.flash > 0) e.flash -= dt;
      if (e.delay > 0) e.delay -= dt;

      if (e.alive && e.dying <= 0 && e.delay <= 0 && e.type !== 'boss' && solid(this.map, e.x, e.y)) {
        e.alive = false; return;
      }

      if (e.type === 'boss') {
        e.pulse = Math.max(0, (e.pulse || 0) - dt * 4);
        e.scale = 1 + 0.07 * (e.pulse || 0);
      } else if (e.dying <= 0 && e.delay <= 0 && !e.passive) {
        EnemyAI.update(e, this.player, dt, bi.pos, this.nowT, this.map, this.enemies, {
          beat: this.rhythm.beat,
          onHurtPlayer: (amt, shake, crash) => {
            this.hurt(amt); this.fx.shake = Math.max(this.fx.shake, shake);
            if (crash) this.audio.sfxCrash();
          },
          onCrash: () => {
            this.audio.sfxCrash(); this.fx.shake = 0.45;
          }
        });
      }

      if (e.dying > 0) {
        e.dying -= dt;
        if (e.type === 'boss') this.fx.shake = Math.max(this.fx.shake, 0.15);
        if (e.dying <= 0) {
          e.alive = false;
          if (e.type === 'boss') this.completeLevel();
          else spawnDeathParticles(e, this.particles);
        }
      }
    });

    this.particles = updateParticlesAdvanced(this.particles, dt);

    this.projs = this.projs.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0 || !canMove(this.map, p.x, p.y, 0.05)) return false;
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 0.35) {
        this.hurt(p.dmg); return false;
      }
      return true;
    });
  }

  checkWaveProgress() {
    if (this.state === 'play' && this.curLevel !== 0 && !LEVELS[this.curLevel].boss) {
      let alive = 0, anyPending = false;
      this.enemies.forEach(e => {
        if (e.alive && e.dying <= 0 && e.delay <= 0) alive++;
        if (e.alive && e.dying <= 0 && e.delay > 0) anyPending = true;
      });

      if (alive > 0 && !anyPending && this.levelT > Config.softlockCheckDelay) {
        this.enemies.forEach(e => {
          if (e.alive && e.dying <= 0 && e.delay <= 0) {
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) > Config.maxStuckDistance || this.levelT > Config.softlockForceKillDelay) {
              e.alive = false; this.toast.show('OBJETIVO ELIMINADO A DISTANCIA');
            }
          }
        });
      }

      if (alive === 0 && !anyPending && this.levelT > Config.waveClearDelay) {
        if (this.waveIdx < LEVELS[this.curLevel].waves.length - 1) {
          this.waveIdx++;
          spawnList(LEVELS[this.curLevel].waves[this.waveIdx], 1.4, this.map, this.enemies);
          this.levelT = 1;
        } else {
          this.completeLevel();
        }
      }
    }
  }

  draw() {
    this.raycaster.render({
      player: this.player,
      map: this.map,
      lampGrid: this.lampGrid,
      theme: this.theme,
      curLevel: this.curLevel,
      nowT: this.nowT,
      beatInfo: this.rhythm.beatInfo(this.audio.actx),
      combo: this.combo,
      weaponFlash: this.weapon.flash,
      fxPulse: this.fx.pulse,
      boss: this.boss,
      enemies: this.enemies,
      projs: this.projs,
      props: this.props,
      particles: this.particles,
      SPR: this.SPR,
      SPRDEF: this.SPRDEF,
      envElectric: this.fx.envElectric
    });

    if (this.state !== 'title') {
      if (this.fx.shake > 0) {
        this.ctx.save();
        this.ctx.translate(
          (Math.random() - 0.5) * this.fx.shake * Config.shakeAmount,
          (Math.random() - 0.5) * this.fx.shake * (Config.shakeAmount * 0.625)
        );
      }

      drawWeapon(this.ctx, this.player, this.weapon);

      if (this.fx.shake > 0) this.ctx.restore();

      const bi2 = this.rhythm.beatInfo(this.audio.actx);
      const beatPulse2 = Math.exp(-bi2.pos * 5);
      applyAnalogHorror(this.ctx, {
        nowT: this.nowT,
        hp: this.hp,
        fx: this.fx,
        beatPulse: beatPulse2,
        combo: this.combo,
        motes: this.motes
      });
      drawCross(this.ctx, bi2, this.fx, this.rhythm.beat, this.rhythm.window);
      drawHUD(
        this.ctx, this.player, this.hp, this.combo,
        this.enemies, this.curLevel, LEVELS[this.curLevel].name,
        this.boss, this.toast, this.levelTimer
      );
    }
  }

  setupDevTools() {
    window.__frec = {
      state: () => this.state,
      level: () => this.curLevel,
      kill: () => { this.enemies.forEach(e => { if (e.type !== 'boss') e.alive = false; }); },
      die: () => { this.hurt(999); },
      tp: (x, y, a) => { this.player.x = x; this.player.y = y; this.player.a = a; },
      bossHp: v => { if (this.boss) this.boss.hp = v; },
      weapon: () => this.player.weapon,
      enemies: () => this.enemies.filter(e => e.alive).length,
      // Diagnóstico del mando en tiempo real — útil para depurar el joystick derecho
      // Uso: abre la consola del navegador y escribe: __frec.pad()
      pad: () => {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = Array.from(pads).find(p => p && p.connected);
        if (!gp) { console.log('No hay mando conectado'); return; }
        const axes = gp.axes.map((v, i) => `axes[${i}] = ${v.toFixed(3)}`).join('\n');
        const btns = gp.buttons.map((b, i) => b.pressed ? `btn[${i}] PRESSED` : null).filter(Boolean).join(', ');
        console.log('=== MANDO:', gp.id, '===');
        console.log(axes);
        console.log('Botones activos:', btns || 'ninguno');
        console.log('Turn calculado:', this.input.getPad().turn.toFixed(3));
        return { axes: Array.from(gp.axes), buttons: gp.buttons.length };
      }
    };
  }

  start() {
    this.loadLevel(1, true);
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

// La clase Game se exporta. La instanciación ocurre en index.html.
