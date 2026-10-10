/**
 * Motor de Sonidos Ambientales del Hospital Psiquiátrico (V2)
 * --- DIRECCIÓN DE TERROR PSICOLÓGICO ---
 * El silencio es el arma principal. Los sonidos constantes arruinan el miedo.
 * Este motor implementa un "Director de Tensión" que elige momentos precisos
 * para asustar o desorientar al jugador.
 */

// === LIBRERÍA CURADA DE SONIDOS ===
// Seleccionamos solo los mejores audios para cada contexto.
const SOUND_LIBRARY = {
  // 1. LOOPS BASE: Sonidos de muy bajo volumen que definen el espacio.
  loops: {
    0: [{ path: 'audio/ambiente/viento_pasillo_1.mp3', vol: 0.15 }, { path: 'audio/ambiente/goteo_agua_1.mp3', vol: 0.12 }], // Aislamiento
    1: [{ path: 'audio/ambiente/fluorescente_zumbido_1.mp3', vol: 0.06 }], // Pabellón
    2: [{ path: 'audio/ambiente/tuberia_crujir_1.mp3', vol: 0.15 }], // Terapia Shock
    3: [{ path: 'audio/ambiente/viento_pasillo_1.mp3', vol: 0.10 }, { path: 'audio/musica/radio_estatica_1.mp3', vol: 0.05 }], // Quirófano
    4: [{ path: 'audio/musica/caja_musical_rota_1.mp3', vol: 0.10 }] // Corazón
  },
  
  // 2. EVENTOS POR NIVEL: Ocurren cada 12-35 segundos. Rompen el silencio.
  events: {
    0: [
      { path: 'audio/puertas/puerta_golpe_1.mp3', vol: 0.35 },
      { path: 'audio/susurros/susurro_largo_1.mp3', vol: 0.25 },
      { path: 'audio/impactos/golpe_pared_1.mp3', vol: 0.40 }
    ],
    1: [
      { path: 'audio/puertas/puerta_chirrido_1.mp3', vol: 0.30 },
      { path: 'audio/impactos/caida_cuerpo_1.mp3', vol: 0.35 },
      { path: 'audio/gritos/grito_ahogado_1.mp3', vol: 0.28 },
      { path: 'audio/ambiente/metal_caer_1.mp3', vol: 0.30 }
    ],
    2: [
      { path: 'audio/electrico/electroshock_1.mp3', vol: 0.35 },
      { path: 'audio/puertas/reja_sacudir_1.mp3', vol: 0.35 },
      { path: 'audio/electrico/corto_circuito_1.mp3', vol: 0.30 },
      { path: 'audio/gritos/grito_ahogado_2.mp3', vol: 0.25 }
    ],
    3: [
      { path: 'audio/impactos/objeto_rodar_1.mp3', vol: 0.25 },
      { path: 'audio/impactos/silla_arrastrar_1.mp3', vol: 0.30 },
      { path: 'audio/risas/risa_llorando_1.mp3', vol: 0.20 },
      { path: 'audio/ambiente/metal_caer_1.mp3', vol: 0.35 }
    ],
    4: [
      { path: 'audio/musica/nana_distorsionada_1.mp3', vol: 0.20 },
      { path: 'audio/analogico/estatica_voz_1.mp3', vol: 0.25 },
      { path: 'audio/musica/piano_nota_1.mp3', vol: 0.35 }
    ]
  },

  // 3. PARANOIA: Ocurren cuando llevas rato solo, sin enemigos. Te hacen mirar atrás.
  paranoia: [
    { path: 'audio/pasos/pasos_rapidos_1.mp3', vol: 0.35 },
    { path: 'audio/pasos/pasos_descalzos_1.mp3', vol: 0.30 },
    { path: 'audio/puertas/puerta_cerrar_1.mp3', vol: 0.40 },
    { path: 'audio/susurros/susurro_ayuda_1.mp3', vol: 0.25 },
    { path: 'audio/risas/risa_nino_lejos_1.mp3', vol: 0.25 }
  ],

  // 4. PÁNICO: Ocurren cuando estás al borde de la muerte (HP < 35). Aumentan la urgencia.
  panic: [
    { path: 'audio/susurros/susurro_distorsionado_1.mp3', vol: 0.35 },
    { path: 'audio/ambiente/respiracion_pesada_1.mp3', vol: 0.35 },
    { path: 'audio/electrico/apagon_1.mp3', vol: 0.45 },
    { path: 'audio/risas/risa_loca_1.mp3', vol: 0.30 }
  ]
};

export class AmbientSounds {
  constructor() {
    this.actx = null;
    this.master = null;
    this.buffers = new Map();
    this.loaded = false;
    this.enabled = false;
    
    // Director de Tensión
    this.timeSinceLastEvent = 0;
    this.nextEventDelay = 15; // Primer evento a los 15s
    this.aloneTime = 0;
    
    // Control de Loops Base
    this.currentLevel = -1;
    this.activeLoops = [];
  }

  init(actx) {
    if (this.loaded) return;
    this.actx = actx;
    this.master = actx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(actx.destination);
    this.enabled = true;
    this._preloadAll();
  }

  async _preloadAll() {
    const allPaths = new Set();
    const extractPaths = (obj) => {
      if (Array.isArray(obj)) obj.forEach(item => allPaths.add(item.path));
      else Object.values(obj).forEach(val => extractPaths(val));
    };
    extractPaths(SOUND_LIBRARY);

    const promises = Array.from(allPaths).map(async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        const buf = await this.actx.decodeAudioData(ab);
        this.buffers.set(path, buf);
      } catch (_) {}
    });
    
    await Promise.allSettled(promises);
    this.loaded = true;
  }

  _play(s, isLoop = false, panValue = 0) {
    if (!this.actx || !this.enabled) return null;
    const buf = this.buffers.get(s.path);
    if (!buf) return null;

    const src = this.actx.createBufferSource();
    src.buffer = buf;
    src.loop = isLoop;

    const gain = this.actx.createGain();
    const t = this.actx.currentTime;
    
    // Si es loop, fadeIn largo; si es evento, fadeIn corto
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(s.vol, t + (isLoop ? 2.0 : 0.15));

    if (!isLoop) {
      gain.gain.setValueAtTime(s.vol, t + buf.duration - 0.3);
      gain.gain.linearRampToValueAtTime(0.001, t + buf.duration);
    }

    if (panValue !== 0 && this.actx.createStereoPanner) {
      const panner = this.actx.createStereoPanner();
      panner.pan.value = Math.max(-0.85, Math.min(0.85, panValue));
      src.connect(gain);
      gain.connect(panner);
      panner.connect(this.master);
    } else {
      src.connect(gain);
      gain.connect(this.master);
    }

    src.start(t);
    if (!isLoop) src.stop(t + buf.duration + 0.05);
    
    return { src, gain };
  }

  _updateLevelLoops(newLevel) {
    if (this.currentLevel === newLevel) return;
    this.currentLevel = newLevel;

    // Detener loops anteriores suavemente
    const t = this.actx.currentTime;
    this.activeLoops.forEach(node => {
      if (node.gain) {
        node.gain.gain.cancelScheduledValues(t);
        node.gain.gain.linearRampToValueAtTime(0.001, t + 2);
      }
      if (node.src) node.src.stop(t + 2.1);
    });
    this.activeLoops = [];

    // Iniciar nuevos loops
    const loops = SOUND_LIBRARY.loops[newLevel] || [];
    loops.forEach(s => {
      const node = this._play(s, true, 0); // Loops sin pan estéreo
      if (node) this.activeLoops.push(node);
    });
  }

  update(dt, gameState) {
    if (!this.enabled || !this.actx || this.actx.state !== 'running' || !this.loaded) return;
    if (gameState.state !== 'play') return;

    this._updateLevelLoops(gameState.curLevel);

    const { hp, enemies, curLevel } = gameState;
    const isLowHp = hp < 35;
    const aliveEnemies = enemies ? enemies.filter(e => e.alive && e.dying <= 0 && e.delay <= 0).length : 0;
    
    if (aliveEnemies === 0) {
      this.aloneTime += dt;
    } else {
      this.aloneTime = 0;
    }

    this.timeSinceLastEvent += dt;

    let triggeredEvent = null;

    if (this.timeSinceLastEvent >= this.nextEventDelay) {
      triggeredEvent = this._triggerEvent(curLevel, isLowHp);
      
      // El silencio es importante. Calculamos el próximo evento.
      // Entre 12 y 35 segundos de silencio.
      let minDelay = 12;
      let maxDelay = 35;
      
      if (isLowHp) {
        // En pánico, los eventos son ligeramente más frecuentes (8 a 25 segs)
        minDelay = 8; maxDelay = 25;
      }
      
      this.nextEventDelay = minDelay + Math.random() * (maxDelay - minDelay);
      this.timeSinceLastEvent = 0;
    }
    
    return triggeredEvent;
  }

  _triggerEvent(level, isLowHp) {
    let pool = [];

    // Decidir de qué piscina sacar el sonido
    if (isLowHp && Math.random() < 0.6) {
      // 60% chance de sonido de Pánico si estás muriendo
      pool = SOUND_LIBRARY.panic;
    } else if (this.aloneTime > 10 && Math.random() < 0.5) {
      // 50% chance de sonido de Paranoia si llevas 10s solo
      pool = SOUND_LIBRARY.paranoia;
    } else {
      // Evento regular del nivel
      pool = SOUND_LIBRARY.events[level] || SOUND_LIBRARY.events[0];
    }

    if (!pool || pool.length === 0) return null;

    const s = pool[Math.floor(Math.random() * pool.length)];
    const pan = (Math.random() - 0.5) * 1.5; // Desorientación estéreo fuerte
    
    this._play(s, false, pan);

    // Determinar categoría para el efecto visual (Terror Analógico)
    if (s.path.includes('electrico')) return 'electric';
    if (s.path.includes('analogico') || s.path.includes('musica')) return 'analog';
    if (s.path.includes('impactos') || s.path.includes('puertas') || s.path.includes('metal')) return 'impact';
    if (s.path.includes('susurros') || s.path.includes('risas') || s.path.includes('pasos')) return 'paranoia';
    
    return null;
  }

  setEnabled(val) { 
    this.enabled = val; 
  }
}
