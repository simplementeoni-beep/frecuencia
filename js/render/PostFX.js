/**
 * PostFX — Efectos de post-procesado de Terror Analógico
 * Incluye: scanlines, ruido estático, aberración cromática, distorsión VHS,
 * grano de película, oscuridad pulsante, y sistema de partículas por tipo de enemigo.
 */
import { W, H } from '../core/Constants.js';

/* ═══════════════════════════════════════════════════════
   CONFIGURACIÓN DE PARTÍCULAS POR TIPO DE ENEMIGO
   Cada tipo tiene: color, brillo, tamaño, velocidad,
   comportamiento, cantidad y efectos especiales.
   ═══════════════════════════════════════════════════════ */

export const ENEMY_PARTICLES = {
  zombie: {
    count: 8,
    color: [80, 255, 80],         // Verde putrefacto bioluminiscente
    glowColor: 'rgba(80,255,80,',
    size: [1.2, 3.0],
    speed: [0.6, 1.8],
    life: [0.6, 1.2],
    gravity: 0.5,                  // Caen como viscosidad
    behavior: 'drip',              // Gotean hacia abajo
    trail: true,
    trailDecay: 0.85
  },
  dog: {
    count: 12,
    color: [255, 60, 40],          // Rojo sangre arterial
    glowColor: 'rgba(255,60,40,',
    size: [0.8, 2.2],
    speed: [2.5, 5.0],
    life: [0.3, 0.7],
    gravity: -0.3,                 // Flotan ligeramente
    behavior: 'scatter',           // Se dispersan rápido
    trail: false,
    sparks: true                   // Chispas al morir
  },
  surgeon: {
    count: 10,
    color: [180, 220, 255],        // Azul quirúrgico frío
    glowColor: 'rgba(180,220,255,',
    size: [1.0, 2.5],
    speed: [1.0, 2.5],
    life: [0.8, 1.5],
    gravity: 0,
    behavior: 'spiral',            // Giran en espiral (como bisturí)
    trail: true,
    trailDecay: 0.9,
    electric: true                 // Arcos eléctricos entre partículas
  },
  orderly: {
    count: 14,
    color: [255, 180, 40],         // Naranja industrial / gas tóxico
    glowColor: 'rgba(255,180,40,',
    size: [1.5, 4.0],
    speed: [0.8, 2.0],
    life: [1.0, 2.0],
    gravity: -0.8,                 // Se elevan como gas
    behavior: 'expand',            // Se expanden como nube tóxica
    trail: true,
    trailDecay: 0.75,
    smoke: true                    // Efecto de humo denso
  },
  cyst: {
    count: 16,
    color: [200, 50, 180],         // Magenta orgánico
    glowColor: 'rgba(200,50,180,',
    size: [1.0, 3.5],
    speed: [3.0, 6.0],
    life: [0.4, 0.9],
    gravity: 0,
    behavior: 'explode',           // Explosión radial violenta
    trail: true,
    trailDecay: 0.7,
    shockwave: true                // Onda de choque visual
  },
  boss: {
    count: 24,
    color: [160, 0, 255],          // Violeta profundo
    glowColor: 'rgba(160,0,255,',
    size: [2.0, 5.0],
    speed: [1.5, 4.0],
    life: [1.5, 3.0],
    gravity: -0.2,
    behavior: 'vortex',            // Vórtice ascendente
    trail: true,
    trailDecay: 0.92,
    electric: true,
    shockwave: true
  }
};

/**
 * Genera partículas de muerte específicas para un tipo de enemigo
 */
export function spawnDeathParticles(enemy, particles) {
  const cfg = ENEMY_PARTICLES[enemy.type] || ENEMY_PARTICLES.zombie;
  const count = cfg.count;

  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
    const spd = cfg.speed[0] + Math.random() * (cfg.speed[1] - cfg.speed[0]);
    const sz = cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]);
    const life = cfg.life[0] + Math.random() * (cfg.life[1] - cfg.life[0]);

    let vx = Math.cos(ang) * spd;
    let vy = Math.sin(ang) * spd;

    // Comportamiento inicial según tipo
    if (cfg.behavior === 'drip') {
      vy = Math.abs(vy) * 0.5 + 0.3;
      vx *= 0.6;
    } else if (cfg.behavior === 'scatter') {
      vx *= 1.5 + Math.random();
      vy *= 1.5 + Math.random();
    }

    particles.push({
      x: enemy.x + (Math.random() - 0.5) * 0.3,
      y: enemy.y + (Math.random() - 0.5) * 0.3,
      vx, vy,
      life, maxLife: life,
      r: sz,
      type: enemy.type,
      color: cfg.color,
      glowColor: cfg.glowColor,
      gravity: cfg.gravity,
      behavior: cfg.behavior,
      trail: cfg.trail,
      trailDecay: cfg.trailDecay || 0.85,
      smoke: cfg.smoke || false,
      electric: cfg.electric || false,
      phase: Math.random() * Math.PI * 2, // Para espiral
      shockwave: cfg.shockwave ? 1.0 : 0
    });
  }

  // Shockwave global para el tipo
  if (cfg.shockwave) {
    particles.push({
      x: enemy.x, y: enemy.y,
      vx: 0, vy: 0,
      life: 0.5, maxLife: 0.5,
      r: 0.1,
      type: enemy.type + '_shockwave',
      color: cfg.color,
      glowColor: cfg.glowColor,
      gravity: 0,
      behavior: 'shockwave',
      isShockwave: true,
      maxRadius: enemy.type === 'boss' ? 8 : 4
    });
  }
}

/**
 * Actualiza partículas con comportamiento específico por tipo
 */
export function updateParticlesAdvanced(particles, dt) {
  return particles.filter(p => {
    p.life -= dt;
    if (p.life <= 0) return false;

    const t = 1 - p.life / p.maxLife; // 0→1 progreso

    // Aplicar gravedad
    if (p.gravity) {
      p.vy += p.gravity * dt;
    }

    // Comportamientos específicos
    if (p.behavior === 'spiral') {
      const angle = p.phase + t * 8;
      const spiralForce = 0.5 * (1 - t);
      p.vx += Math.cos(angle) * spiralForce * dt * 10;
      p.vy += Math.sin(angle) * spiralForce * dt * 10;
    } else if (p.behavior === 'vortex') {
      const angle = p.phase + t * 12;
      p.vx += Math.cos(angle) * 2 * dt;
      p.vy -= dt * 1.5; // Ascenso
    } else if (p.behavior === 'expand') {
      // Desacelera y se expande como gas
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.r += dt * 2; // Crece
    } else if (p.behavior === 'drip') {
      p.vx *= 0.95;
      // No frenar vy para que gotee
    }

    // Shockwave: solo crece el radio
    if (p.isShockwave) {
      p.r = t * p.maxRadius;
      return true;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Fricción base
    if (p.behavior !== 'drip') {
      p.vx *= 0.94;
      p.vy *= 0.94;
    }

    return true;
  });
}

/* ═══════════════════════════════════════════════════════
   EFECTOS DE POST-PROCESADO DE TERROR ANALÓGICO
   ═══════════════════════════════════════════════════════ */

// Cache para el patrón de scanlines (se genera una vez)
let scanlinePattern = null;
let scanlineCanvas = null;

function getScanlinePattern(ctx) {
  if (scanlinePattern) return scanlinePattern;
  scanlineCanvas = document.createElement('canvas');
  scanlineCanvas.width = 1;
  scanlineCanvas.height = 4;
  const sg = scanlineCanvas.getContext('2d');
  sg.fillStyle = 'rgba(0,0,0,0.18)';
  sg.fillRect(0, 0, 1, 2);
  sg.fillStyle = 'rgba(0,0,0,0)';
  sg.fillRect(0, 2, 1, 2);
  scanlinePattern = ctx.createPattern(scanlineCanvas, 'repeat');
  return scanlinePattern;
}

/**
 * Renderiza scanlines de CRT sobre el canvas
 */
export function drawScanlines(ctx, intensity = 0.4, envAnalog = 0) {
  const pat = getScanlinePattern(ctx);
  if (!pat) return;
  // Si hay evento analógico, las scanlines se marcan mucho más
  ctx.globalAlpha = Math.min(1.0, intensity + envAnalog * 0.15);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

/**
 * Ruido estático analógico (grano de película + interferencia)
 * Más sutil que un efecto completo para no matar FPS
 */
export function drawStaticNoise(ctx, nowT, hp, intensity = 0.08, envAnalog = 0) {
  // Aumentar ruido cuando la vida es baja o hay evento analógico
  const hpFactor = hp < 30 ? 0.25 : (hp < 50 ? 0.12 : 0);
  const analogFactor = envAnalog > 0 ? (envAnalog * 0.1) : 0;
  const totalIntensity = Math.min(1.0, intensity + hpFactor + analogFactor);

  // Grano de película disperso
  ctx.fillStyle = `rgba(255,255,255,${totalIntensity})`;
  const grainCount = 40 + (hp < 30 ? 80 : 0);
  for (let i = 0; i < grainCount; i++) {
    const gx = Math.random() * W;
    const gy = Math.random() * H;
    const gs = Math.random() * 1.5 + 0.5;
    ctx.fillRect(gx, gy, gs, gs);
  }

  // Líneas de interferencia horizontales aleatorias (como VHS)
  if (Math.random() < 0.04 + (hp < 30 ? 0.12 : 0) + (envAnalog > 0 ? 0.3 : 0)) {
    const lineY = Math.random() * H;
    const lineH = 1 + Math.random() * (envAnalog > 0 ? 8 : 3);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.08 + analogFactor})`;
    ctx.fillRect(0, lineY, W, lineH);
  }

  // Glitch horizontal intenso (raro normalmente, común en evento analógico)
  if (Math.random() < 0.015 + (hp < 20 ? 0.06 : 0) + (envAnalog > 0 ? 0.15 : 0)) {
    const gy = Math.random() * H;
    const gh = 2 + Math.random() * (envAnalog > 0 ? 20 : 8);
    const shift = (Math.random() - 0.5) * (12 + envAnalog * 10);
    ctx.drawImage(ctx.canvas, 0, gy, W, gh, shift, gy, W, gh);
  }
}

/**
 * Aberración cromática — desplaza canales RGB para efecto de lente dañada
 * Se intensifica al recibir daño o con poca vida
 */
export function drawChromaticAberration(ctx, fx, hp) {
  const baseShift = 1;
  const hurtShift = fx.hurt > 0 ? fx.hurt * 6 : 0;
  const lowHpShift = hp < 25 ? (25 - hp) * 0.15 : 0;
  const shift = baseShift + hurtShift + lowHpShift;

  if (shift < 1.2) return; // No aplicar si es imperceptible

  // Desplazar rojo a la izquierda y azul a la derecha
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.06 + hurtShift * 0.08;

  // Canal rojo desplazado
  ctx.drawImage(ctx.canvas, -shift, 0);
  // Canal azul desplazado
  ctx.drawImage(ctx.canvas, shift, 0);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Viñeta de oscuridad más agresiva para terror
 * Simula visión de túnel que empeora con poca vida o paranoia
 */
export function drawHorrorVignette(ctx, hp, beatPulse, envParanoia = 0) {
  // Visión de túnel extrema si hay paranoia
  let pFactor = envParanoia > 0 ? Math.min(1.0, envParanoia / 4.0) : 0;
  
  const innerRadius = (hp < 30 ? H * 0.22 : H * 0.3) * (1 - pFactor * 0.4);
  const outerRadius = W * 0.55 * (1 - pFactor * 0.2);
  
  const vg = ctx.createRadialGradient(W / 2, H / 2, innerRadius, W / 2, H / 2, outerRadius);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.4, `rgba(0,0,0,${hp < 30 ? 0.25 : 0.12})`);
  
  // La paranoia oscurece agresivamente los bordes
  let darkEdge = hp < 30 ? 0.55 : 0.38;
  if (pFactor > 0) darkEdge = Math.min(0.9, darkEdge + pFactor * 0.4);
  
  vg.addColorStop(0.7, `rgba(0,0,0,${darkEdge})`);
  vg.addColorStop(1, `rgba(2,0,4,${hp < 30 ? 0.92 : (0.82 + pFactor*0.18)})`);
  
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Pulsación de oscuridad al compás (como si la oscuridad respirara)
  if (beatPulse > 0.01) {
    const breathAlpha = beatPulse * 0.06;
    ctx.fillStyle = `rgba(0,0,0,${breathAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Bordes de esquina extra oscuros
  const cornerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.4);
  cornerGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
  cornerGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cornerGrad;
  ctx.fillRect(0, 0, W / 2, H / 2);

  const cornerGrad2 = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.4);
  cornerGrad2.addColorStop(0, 'rgba(0,0,0,0.35)');
  cornerGrad2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cornerGrad2;
  ctx.fillRect(W / 2, 0, W / 2, H / 2);

  const cornerGrad3 = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.4);
  cornerGrad3.addColorStop(0, 'rgba(0,0,0,0.35)');
  cornerGrad3.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cornerGrad3;
  ctx.fillRect(0, H / 2, W / 2, H / 2);

  const cornerGrad4 = ctx.createRadialGradient(W, H, 0, W, H, W * 0.4);
  cornerGrad4.addColorStop(0, 'rgba(0,0,0,0.35)');
  cornerGrad4.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cornerGrad4;
  ctx.fillRect(W / 2, H / 2, W / 2, H / 2);
}

/**
 * Efecto de «respiración de oscuridad» — la pantalla oscila lentamente
 * como si algo vivo la envolviera
 */
export function drawDarknessBreathing(ctx, nowT, hp) {
  const breathRate = hp < 30 ? 3.5 : 1.8;
  const breathDepth = hp < 30 ? 0.12 : 0.05;
  const breath = Math.sin(nowT * breathRate) * breathDepth;
  if (breath > 0.005) {
    ctx.fillStyle = `rgba(0,0,0,${breath.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/**
 * Distorsión VHS: líneas de tracking defectuoso
 * Aparecen intermitentemente para efecto analógico
 */
export function drawVHSTracking(ctx, nowT, envAnalog = 0) {
  // Si hay un evento analógico, el tracking está completamente roto
  const isBroken = envAnalog > 0;
  
  // Bandas de tracking que se desplazan verticalmente
  const trackingY = ((nowT * (isBroken ? 120 : 30)) % (H + 40)) - 20;
  if (isBroken || Math.sin(nowT * 0.7) > 0.85) {
    ctx.fillStyle = `rgba(255,255,255,${isBroken ? 0.1 : 0.03})`;
    ctx.fillRect(0, trackingY, W, isBroken ? 15 : 6);
    ctx.fillStyle = `rgba(0,0,0,${isBroken ? 0.3 : 0.1})`;
    ctx.fillRect(0, trackingY + (isBroken ? 15 : 6), W, isBroken ? 6 : 2);
  }

  // Distorsión de borde inferior (como cinta gastada)
  if (isBroken || Math.sin(nowT * 1.3) > 0.92) {
    const distY = H - (isBroken ? 60 : 20) + Math.sin(nowT * 5) * 4;
    ctx.fillStyle = `rgba(20,0,40,${isBroken ? 0.3 : 0.15})`;
    ctx.fillRect(0, distY, W, isBroken ? 60 : 20);
    
    // Desgarro inferior de imagen (tearing)
    if (isBroken && Math.random() < 0.5) {
       ctx.drawImage(ctx.canvas, 0, H-40, W, 40, (Math.random()-0.5)*20, H-40, W, 40);
    }
  }
}

/**
 * Renderiza las partículas avanzadas con efectos visuales por tipo
 */
export function drawAdvancedParticles(ctx, particles, player, nowT) {
  const PLANE = 0.66;
  const dirX = Math.cos(player.a), dirY = Math.sin(player.a);
  const plX = -Math.sin(player.a) * PLANE, plY = Math.cos(player.a) * PLANE;
  const inv = 1 / (plX * dirY - dirX * plY);

  particles.forEach(p => {
    if (!p.color) return; // Partícula legacy sin color

    const sx = p.x - player.x, sy = p.y - player.y;
    const tX = inv * (dirY * sx - dirX * sy);
    const tY = inv * (-plY * sx + plX * sy);
    if (tY <= 0.1) return;

    const scrX = Math.floor((W / 2) * (1 + tX / tY));
    const scrY = Math.floor(H / 2 + H / (2 * tY) * 0.1);
    if (scrX < -20 || scrX > W + 20) return;

    const t = 1 - p.life / p.maxLife;
    const al = Math.max(0, p.life / p.maxLife);
    const screenR = Math.max(1, p.r * (2 / tY));

    // Shockwave
    if (p.isShockwave) {
      const shockR = p.r * (H / tY) * 0.5;
      ctx.strokeStyle = `${p.glowColor}${(al * 0.6).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(scrX, scrY, shockR, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    // Glow exterior
    ctx.shadowColor = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
    ctx.shadowBlur = screenR * 3;

    // Partícula principal
    ctx.fillStyle = `${p.glowColor}${al.toFixed(2)})`;
    ctx.beginPath();

    if (p.smoke) {
      // Partículas de humo: más grandes y difusas
      const smokeR = screenR * (1 + t * 2);
      ctx.arc(scrX, scrY, smokeR, 0, Math.PI * 2);
    } else {
      ctx.arc(scrX, scrY, screenR, 0, Math.PI * 2);
    }
    ctx.fill();

    // Centro brillante
    ctx.fillStyle = `rgba(255,255,255,${(al * 0.7).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(scrX, scrY, screenR * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Arcos eléctricos entre partículas cercanas
    if (p.electric && Math.random() < 0.15) {
      const nearP = particles.find(o =>
        o !== p && o.color && !o.isShockwave &&
        Math.hypot(o.x - p.x, o.y - p.y) < 1.5
      );
      if (nearP) {
        const nsx = nearP.x - player.x, nsy = nearP.y - player.y;
        const ntX = inv * (dirY * nsx - dirX * nsy);
        const ntY = inv * (-plY * nsx + plX * nsy);
        if (ntY > 0.1) {
          const nscrX = Math.floor((W / 2) * (1 + ntX / ntY));
          const nscrY = Math.floor(H / 2 + H / (2 * ntY) * 0.1);
          ctx.strokeStyle = `${p.glowColor}${(al * 0.5).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(scrX, scrY);
          // Zig-zag eléctrico
          const midX = (scrX + nscrX) / 2 + (Math.random() - 0.5) * 8;
          const midY = (scrY + nscrY) / 2 + (Math.random() - 0.5) * 8;
          ctx.lineTo(midX, midY);
          ctx.lineTo(nscrX, nscrY);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;
  });
}

/**
 * Efecto de sangre en pantalla cuando te golpean (más visceral)
 */
export function drawBloodSplatter(ctx, hurtAmount) {
  if (hurtAmount <= 0) return;

  // Borde rojo más visceral
  const intensity = Math.min(1, hurtAmount * 1.5);
  
  // Gradiente radial rojo desde los bordes
  const bg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(0.6, `rgba(80,0,0,${(intensity * 0.3).toFixed(2)})`);
  bg.addColorStop(1, `rgba(120,10,10,${(intensity * 0.6).toFixed(2)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gotas de sangre en los bordes
  if (intensity > 0.2) {
    ctx.fillStyle = `rgba(100,5,5,${(intensity * 0.4).toFixed(2)})`;
    for (let i = 0; i < 3; i++) {
      const dx = Math.random() < 0.5 ? Math.random() * 30 : W - Math.random() * 30;
      const dy = Math.random() * H;
      const dw = 3 + Math.random() * 8;
      const dh = 10 + Math.random() * 30;
      ctx.fillRect(dx, dy, dw, dh);
    }
  }
}

/**
 * Aplica todos los efectos de post-procesado de terror analógico
 */
export function applyAnalogHorror(ctx, { nowT, hp, fx, beatPulse, combo, motes }) {
  // 1. Viñeta de terror (reemplaza la viñeta original)
  drawHorrorVignette(ctx, hp, beatPulse, fx.envParanoia);

  // 2. Oscuridad que respira
  drawDarknessBreathing(ctx, nowT, hp);

  // 3. Scanlines CRT
  drawScanlines(ctx, hp < 30 ? 0.35 : 0.2, fx.envAnalog);

  // 4. Ruido estático
  drawStaticNoise(ctx, nowT, hp, 0.05, fx.envAnalog);

  // 5. Tracking VHS
  drawVHSTracking(ctx, nowT, fx.envAnalog);

  // 6. Esporas/motas (las originales pero más oscuras)
  ctx.fillStyle = 'rgba(100,60,160,.2)';
  if (motes) {
    motes.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.sz, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. Efectos de combo (tinte más oscuro)
  if (combo >= 3) {
    ctx.fillStyle = `rgba(60,20,100,${(0.03 * combo * beatPulse).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H - 30);
  }

  // 8. Sangre en pantalla
  drawBloodSplatter(ctx, fx.hurt);

  // 9. Tinte rojo de vida baja (más intenso)
  if (hp < 30) {
    const lowPulse = Math.sin(nowT * 3.5) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(50,0,5,${(0.22 + 0.15 * lowPulse).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // 10. Aberración cromática
  drawChromaticAberration(ctx, fx, hp);

  // 11. Fade
  if (fx.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fx.fade / 1.0).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
