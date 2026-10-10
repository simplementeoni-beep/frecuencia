/**
 * Motor de Raycasting pseudo-3D DDA con iluminación por linterna, niebla y Z-Buffer
 */
import { W, H, PLANE, DXN, DYN } from '../core/Constants.js';
import { Config } from '../core/Config.js';
import { pack, fogAt } from '../core/MathUtils.js';
import { sampleWallTexture } from './WallTextures.js';

export class Raycaster {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = canvas.getContext('2d');
    this.img = this.ctx.createImageData(W, H);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.zbuf = new Float32Array(W);
    this.contactShadows = [];
    this.wallColorBuf = [0, 0, 0];
  }

  /**
   * Renderiza un frame completo en el Canvas
   */
  render({
    player,
    map,
    lampGrid,
    theme,
    curLevel,
    nowT,
    beatInfo,
    combo = 1,
    weaponFlash = 0,
    fxPulse = 0,
    boss = null,
    enemies = [],
    projs = [],
    props = [],
    particles = [],
    SPR = {},
    SPRDEF = {},
    envElectric = 0
  }) {
    this.contactShadows = [];
    const pulse = Math.exp(-beatInfo.pos * 5);
    const beatBoost = 0.15 * pulse * (1 + 0.12 * (combo - 1));
    const lm = 0.65 + beatBoost + weaponFlash * 1.6 + (curLevel === 4 ? 0.10 * fxPulse : 0);

    let beatTintR = 0, beatTintG = 0, beatTintB = 0;
    if (curLevel === 3) {
      beatTintR = 14 * pulse; beatTintB = 28 * pulse;
    } else if (curLevel === 4) {
      const bossFactor = (boss && boss.alive) ? (1 - boss.hp / boss.max) : 1;
      beatTintR = 22 * pulse * (0.5 + 0.5 * bossFactor);
      beatTintB = 8 * pulse;
    }

    // --- PARPADEO DE TUBO FLUORESCENTE ---
    let flick = 1;
    
    // Parpadeo forzado por evento de sonido eléctrico (cortocircuito, electroshock)
    if (envElectric > 0) {
      // Si el evento acaba de empezar (>2s restantes), posible apagón total
      if (envElectric > 1.5 && Math.random() < 0.4) {
        flick = 0.02; // Apagón casi total
      } else {
        // Parpadeo estroboscópico loco
        flick = Math.random() < 0.5 ? 0.05 : (0.5 + Math.random() * 0.6);
      }
    } else if (Math.random() < 0.025 && Math.sin(nowT * 0.3) > 0.8) {
      // Apagón momentáneo natural (raro, aterrador)
      flick = 0.08 + Math.random() * 0.15;
    }
    
    // Zumbido de fluorescente (micro-variación constante)
    flick *= 0.95 + Math.sin(nowT * 23.7) * 0.025 + Math.sin(nowT * 41.3) * 0.015;

    // Per-lamp flicker seed (cada lámpara parpadea independientemente)
    const lampFlickSeed = nowT * 7.3;

    const a = player.a;
    const dirX = Math.cos(a), dirY = Math.sin(a);
    const plX = -Math.sin(a) * PLANE, plY = Math.cos(a) * PLANE;
    const px = player.x, py = player.y;
    const d0x = dirX - plX, d0y = dirY - plY;
    const d1x = dirX + plX, d1y = dirY + plY;

    const fa0 = theme.fA[0], fa1 = theme.fA[1], fa2 = theme.fA[2];
    const fb0 = theme.fB[0], fb1 = theme.fB[1], fb2 = theme.fB[2];
    const ce0 = theme.ce[0], ce1 = theme.ce[1], ce2 = theme.ce[2];
    const lc0 = theme.lc[0], lc1 = theme.lc[1], lc2 = theme.lc[2];
    const li = theme.li;
    const FR = theme.fog[0], FG = theme.fog[1], FB = theme.fog[2];

    const MH = map.length;
    const MW = MH > 0 ? map[0].length : 0;
    const half = H / 2;

    // --- ENCONTRAR LÁMPARAS CERCANAS PARA DEGRADADOS REALES ---
    // En lugar de chequear bloques vecinos, buscamos luces cercanas al jugador
    // para que la luz pueda esparcirse suavemente sin cortarse en los bordes de los bloques.
    const activeLamps = [];
    const searchRadius = 8;
    const pxInt = Math.floor(px), pyInt = Math.floor(py);
    for (let ly = Math.max(0, pyInt - searchRadius); ly <= Math.min(MH - 1, pyInt + searchRadius); ly++) {
      for (let lx = Math.max(0, pxInt - searchRadius); lx <= Math.min(MW - 1, pxInt + searchRadius); lx++) {
        if (lampGrid[ly * MW + lx]) {
          const lampId = lx * 31 + ly * 17;
          let lampFlick = 1;
          const flickPhase = Math.sin(lampFlickSeed + lampId * 0.73);
          if (flickPhase > 0.92) lampFlick = Math.random() > 0.5 ? 0.1 : 0.9;
          else if (flickPhase > 0.85) lampFlick = 0.5 + Math.sin(nowT * 60 + lampId) * 0.4;
          
          activeLamps.push({ x: lx + 0.5, y: ly + 0.5, flick: lampFlick });
        }
      }
    }

    // --- 1. RENDERIZADO DE SUELOS Y TECHOS ---
    for (let yy = 0; yy < H; yy++) {
      let p = yy - half;
      if (p === 0) p = 0.5;
      const isFloor = p > 0;
      const rowDist = half / Math.abs(p);
      const stX = rowDist * (d1x - d0x) / W;
      const stY = rowDist * (d1y - d0y) / W;
      let fx0 = px + rowDist * d0x;
      let fy0 = py + rowDist * d0y;
      const fb = fogAt(rowDist);
      const br = fb * lm, ob = 1 - fb;
      const base = yy * W;

      for (let xx = 0; xx < W; xx++) {
        let r, g, b;
        const ccx = Math.floor(fx0), ccy = Math.floor(fy0);
        let gl = 0, ox = 0, oy = 0, lit = false;

        // Linterna — cono de luz del jugador
        const vx = fx0 - px, vy = fy0 - py;
        const flDot = (vx * dirX + vy * dirY) / (rowDist || 1);
        const flInt = (flDot > 0.65) ? ((flDot - 0.65) / 0.35) / (1 + rowDist * 0.35) * 55 : 0;

        // Lámparas — Degradado radial perfecto
        for (let i = 0; i < activeLamps.length; i++) {
          const lamp = activeLamps[i];
          const ddx = fx0 - lamp.x, ddy = fy0 - lamp.y;
          const dist2 = ddx * ddx + ddy * ddy;
          
          if (dist2 < 25) { // Solo procesar si está razonablemente cerca
            const smoothGradient = 2.5 / (1 + dist2 * 0.5 + dist2 * dist2 * 0.1);
            gl += lamp.flick * smoothGradient;
            if (dist2 < 0.6) { ox = ddx; oy = ddy; lit = true; } // Para pintar el tubo fluorescente en el techo
          }
        }

        if (isFloor) {
          const ux = fx0 - ccx, uy = fy0 - ccy;
          if ((ccx + ccy) & 1) { r = fa0; g = fa1; b = fa2; }
          else { r = fb0; g = fb1; b = fb2; }
          if (ux < 0.04 || uy < 0.04) { r *= 0.6; g *= 0.6; b *= 0.6; }
          // Lámparas iluminan el suelo con fuerza (como en la referencia)
          r += lc0 * gl * li * flick * 1.4 + flInt * 0.6;
          g += lc1 * gl * li * flick * 1.4 + flInt * 0.55;
          b += lc2 * gl * li * flick * 1.4 + flInt * 0.75;
        } else {
          r = ce0; g = ce1; b = ce2;
          // Parche de luz en el techo (el fluorescente mismo, visible y brillante)
          if (lit && Math.abs(ox) < 0.38 && Math.abs(oy) < 0.15) {
            r = lc0 * 0.7 + 65; g = lc1 * 0.7 + 65; b = lc2 * 0.7 + 65;
            r *= flick; g *= flick; b *= flick;
          } else {
            // Reflejo difuso en el techo desde las lámparas
            r += lc0 * gl * 0.25 * flick * (li / 0.2) + flInt * 0.3;
            g += lc1 * gl * 0.25 * flick * (li / 0.2) + flInt * 0.25;
            b += lc2 * gl * 0.25 * flick * (li / 0.2) + flInt * 0.4;
          }
        }
        this.buf[base + xx] = pack(
          r * br + FR * ob + beatTintR * br,
          g * br + FG * ob + beatTintG * br,
          b * br + FB * ob + beatTintB * br
        );
        fx0 += stX; fy0 += stY;
      }
    }

    // --- 2. RAYCASTING DE PAREDES (DDA) ---
    for (let xx = 0; xx < W; xx++) {
      const camX = 2 * xx / W - 1;
      const rdx = dirX + plX * camX, rdy = dirY + plY * camX;
      let mx = px | 0, my = py | 0;
      const ddx2 = Math.abs(1 / rdx), ddy2 = Math.abs(1 / rdy);
      let sdx, sdy, stx, sty;

      if (rdx < 0) { stx = -1; sdx = (px - mx) * ddx2; }
      else { stx = 1; sdx = (mx + 1 - px) * ddx2; }
      if (rdy < 0) { sty = -1; sdy = (py - my) * ddy2; }
      else { sty = 1; sdy = (my + 1 - py) * ddy2; }

      let side = 0, hit = 0, guard = 0;
      while (!hit && guard++ < 96) {
        if (sdx < sdy) { sdx += ddx2; mx += stx; side = 0; }
        else { sdy += ddy2; my += sty; side = 1; }
        if (mx < 0 || my < 0 || mx >= MW || my >= MH || map[my][mx] > 0) hit = 1;
      }

      let pd = side === 0 ? (sdx - ddx2) : (sdy - ddy2);
      if (pd < 0.05) pd = 0.05;
      this.zbuf[xx] = pd;

      const type = (mx < 0 || my < 0 || mx >= MW || my >= MH) ? 1 : map[my][mx];
      const lh = H / pd;
      const ds = half - lh / 2, de = half + lh / 2;
      let wx = side === 0 ? py + pd * rdy : px + pd * rdx;
      wx -= Math.floor(wx);

      const y0 = Math.max(0, Math.floor(ds)), y1 = Math.min(H - 1, Math.floor(de));
      const fb2 = fogAt(pd);
      const sm = side ? 0.78 : 1;
      const br2 = fb2 * sm * lm, ob2 = 1 - fb2;
      const wallFlash = Math.max(0, 1 - Math.abs(camX) * 1.3) / (1 + pd * 0.4) * 50;

      // --- LUZ FLUORESCENTE EN PAREDES ---
      // Calculamos la luz sobre la coordenada real 2D de la pared
      let wallGl = 0;
      const hitX = side === 0 ? mx + (rdx > 0 ? 1 : 0) : wx;
      const hitY = side === 1 ? my + (rdy > 0 ? 1 : 0) : wx;
      for (let i = 0; i < activeLamps.length; i++) {
        const lamp = activeLamps[i];
        const dx = hitX - lamp.x, dy = hitY - lamp.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 25) {
          const smoothGradient = 2.5 / (1 + dist2 * 0.5 + dist2 * dist2 * 0.1);
          wallGl += lamp.flick * smoothGradient;
        }
      }

      for (let yy = y0; yy <= y1; yy++) {
        sampleWallTexture(type, wx, (yy - ds) / lh, this.wallColorBuf);
        let cr = this.wallColorBuf[0] + wallFlash * 0.85 + lc0 * wallGl * li * flick;
        let cg = this.wallColorBuf[1] + wallFlash * 0.8 + lc1 * wallGl * li * flick;
        let cb = this.wallColorBuf[2] + wallFlash * 1.1 + lc2 * wallGl * li * flick;
        if (type === 4 && cb > 200 && cr < 150) {
          cr *= flick; cg *= flick; cb *= flick;
        }
        this.buf[yy * W + xx] = pack(
          cr * br2 + FR * ob2 + beatTintR * br2,
          cg * br2 + FG * ob2 + beatTintG * br2,
          cb * br2 + FB * ob2 + beatTintB * br2
        );
      }
    }

    // --- 3. PROYECCIÓN DE ENTIDADES Y SPRITES (ORDENADOS POR DISTANCIA) ---
    const list = enemies.filter(e => e.alive).concat(projs, props.filter(p => !p.taken));
    list.forEach(e => {
      e.d2 = (e.x - px) * (e.x - px) + (e.y - py) * (e.y - py);
    });
    list.sort((m, n) => n.d2 - m.d2);

    const inv = 1 / (plX * dirY - dirX * plY);
    list.forEach(e => {
      const key = e.spr || e.type;
      const sp = SPR[key] || SPR[e.type] || SPR.zombie;
      const def = SPRDEF[e.type] || SPRDEF[key] || SPRDEF.zombie;
      if (!sp) return;

      const sx = e.x - px, sy = e.y - py;
      const tX = inv * (dirY * sx - dirX * sy);
      const tY = inv * (-plY * sx + plX * sy);
      if (tY <= 0.12) return;

      const scrX = Math.floor((W / 2) * (1 + tX / tY));
      const fall = e.dying > 0 ? (1 - e.dying / (e.dmax || 0.35)) : 0;
      const sc = e.scale || 1;
      let lift = def.lift || 0;
      const bob = (e.hp > 0 && !e.passive && !(e.stunTimer > 0)) ? Math.abs(Math.sin(nowT * 12 + e.x * 10)) * 0.08 : 0;
      let scY = sc * (1 + bob);
      const scX = sc * (1 - bob * 0.3);

      if (def.isFloor) {
        scY *= 0.25;
        lift = -0.48;
      }

      const sh = Math.abs(H / tY) * def.hWorld * (1 - 0.8 * fall) * scY;
      const sw = Math.abs(H / tY) * def.hWorld * (sp.w / sp.h) * scX;
      const bottom = half + H / (2 * tY) - (lift + bob * 0.2) * H / tY;
      const top = bottom - sh;
      const sX0 = Math.floor(scrX - sw / 2);
      const sX1 = Math.floor(scrX + sw / 2);

      const fbs = Math.max(0.25, fogAt(tY * 0.55));
      const bs = fbs * lm * (1 - 0.5 * fall) * 0.85;
      const obs = 1 - fbs;
      const fl = (e.flash > 0 ? 0.65 : 0) + (e.tele ? 0.5 : 0);

      // Guardar sombra de contacto con profundidad tY
      if (e.type !== 'orb' && tY < 14 && fall < 0.5) {
        this.contactShadows.push({
          x: scrX,
          y: bottom - 2,
          rx: Math.max(4, sw * 0.32),
          ry: Math.max(2, sw * 0.08),
          al: Math.max(0, 0.55 - tY * 0.035),
          tY: tY
        });
      }

      const y0s = Math.max(0, Math.floor(top));
      const y1s = Math.min(H - 1, Math.floor(bottom));

      for (let stripe = Math.max(0, sX0); stripe <= Math.min(W - 1, sX1); stripe++) {
        if (tY >= this.zbuf[stripe]) continue;
        const tx = Math.floor((stripe - sX0) / sw * sp.w);
        if (tx < 0 || tx >= sp.w) continue;

        for (let yy2 = y0s; yy2 <= y1s; yy2++) {
          const ty = Math.floor((yy2 - top) / sh * sp.h);
          if (ty < 0 || ty >= sp.h) continue;
          const c = sp.data[ty * sp.w + tx];
          if ((c >>> 24) < 128) continue;
          let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
          r = r + (255 - r) * fl;
          g = g + (200 - g) * fl;
          b = b + (255 - b) * fl;
          this.buf[yy2 * W + stripe] = pack(r * bs + FR * obs, g * bs + FG * obs, b * bs + FB * obs);
        }
      }
    });

    // Subir imagen procesada al canvas
    this.ctx.putImageData(this.img, 0, 0);

    // --- 3.5 AURAS Y EFECTOS VISUALES ÚNICOS POR TIPO DE ENEMIGO (Canvas 2D) ---
    const auraList = enemies.filter(e => e.alive && e.dying <= 0 && !e.passive && e.delay <= 0);
    auraList.forEach(e => {
      const esx = e.x - px, esy = e.y - py;
      const etX = inv * (dirY * esx - dirX * esy);
      const etY = inv * (-plY * esx + plX * esy);
      if (etY <= 0.2 || etY > 12) return;
      const escrX = Math.floor((W / 2) * (1 + etX / etY));
      if (escrX < -40 || escrX > W + 40) return;
      const eBottom = half + H / (2 * etY);
      const eHeight = Math.abs(H / etY) * 0.8;
      const eCenterY = eBottom - eHeight * 0.5;
      const eAuraR = Math.max(6, eHeight * 0.35);
      const eAlpha = Math.max(0, 0.6 - etY * 0.05);

      if (e.type === 'zombie') {
        // ZOMBIE: Goteo verde tóxico bioluminiscente
        this.ctx.shadowColor = 'rgb(80,255,80)';
        this.ctx.shadowBlur = eAuraR * 0.6;
        this.ctx.fillStyle = `rgba(40,180,40,${(eAlpha * 0.15).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX, eCenterY, eAuraR * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        // Gotitas cayendo
        const dripPhase = nowT * 3 + e.x * 5;
        for (let d = 0; d < 2; d++) {
          const dy = (dripPhase + d * 1.5) % 3;
          const dAlpha = (1 - dy / 3) * eAlpha * 0.3;
          this.ctx.fillStyle = `rgba(60,200,60,${dAlpha.toFixed(2)})`;
          this.ctx.beginPath();
          this.ctx.arc(escrX + (d - 0.5) * 4, eBottom - dy * eHeight * 0.12, 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      } else if (e.type === 'dog') {
        // DOG: Estela roja de velocidad + ojos brillantes
        this.ctx.shadowColor = 'rgb(255,60,40)';
        this.ctx.shadowBlur = eAuraR * 0.5;
        // Ojos rojos brillantes
        const eyeY = eCenterY - eHeight * 0.25;
        this.ctx.fillStyle = `rgba(255,30,20,${(eAlpha * 0.7).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX - 2, eyeY, 1.5, 0, Math.PI * 2);
        this.ctx.arc(escrX + 4, eyeY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        // Estela de movimiento cuando corre
        if (e.state === 'leap' || e.state === 'walk') {
          this.ctx.strokeStyle = `rgba(200,30,20,${(eAlpha * 0.2).toFixed(2)})`;
          this.ctx.lineWidth = 1;
          for (let t = 0; t < 3; t++) {
            this.ctx.beginPath();
            this.ctx.moveTo(escrX - eAuraR * 0.8, eCenterY + t * 3 - 3);
            this.ctx.lineTo(escrX - eAuraR * 1.5, eCenterY + t * 3 - 3 + (Math.random() - 0.5) * 4);
            this.ctx.stroke();
          }
        }
      } else if (e.type === 'surgeon') {
        // SURGEON: Aura azul fría quirúrgica + brillo de bisturí
        this.ctx.shadowColor = 'rgb(120,180,255)';
        this.ctx.shadowBlur = eAuraR * 0.8;
        this.ctx.fillStyle = `rgba(100,160,255,${(eAlpha * 0.1).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX, eCenterY, eAuraR * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        // Brillo de bisturí intermitente
        if (e.spr === 'surgeon_aim' || Math.sin(nowT * 8 + e.y * 3) > 0.7) {
          this.ctx.strokeStyle = `rgba(180,220,255,${(eAlpha * 0.5).toFixed(2)})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          const bx = escrX + eAuraR * 0.4;
          const by = eCenterY - eHeight * 0.1;
          this.ctx.moveTo(bx, by);
          this.ctx.lineTo(bx + 3 + Math.random() * 3, by - 4 - Math.random() * 4);
          this.ctx.stroke();
        }
      } else if (e.type === 'orderly') {
        // ORDERLY: Nube de gas tóxico naranja/amarillo
        this.ctx.shadowColor = 'rgb(200,140,30)';
        this.ctx.shadowBlur = eAuraR;
        this.ctx.fillStyle = `rgba(180,120,20,${(eAlpha * 0.08).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX, eCenterY, eAuraR, 0, Math.PI * 2);
        this.ctx.fill();
        // Humo que sube de los tanques
        for (let s = 0; s < 2; s++) {
          const smokeT = (nowT * 2 + s * 1.2) % 2;
          const smokeAlpha = (1 - smokeT / 2) * eAlpha * 0.12;
          const smokeY = eCenterY - eHeight * 0.35 - smokeT * eHeight * 0.2;
          this.ctx.fillStyle = `rgba(200,160,40,${smokeAlpha.toFixed(2)})`;
          this.ctx.beginPath();
          this.ctx.arc(escrX + (s - 0.5) * 6 + Math.sin(nowT * 3) * 2, smokeY, 2 + smokeT * 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
        // Indicador de carga
        if (e.state === 'charge') {
          this.ctx.strokeStyle = `rgba(255,200,50,${(eAlpha * 0.6).toFixed(2)})`;
          this.ctx.lineWidth = 2;
          for (let t = 0; t < 4; t++) {
            this.ctx.beginPath();
            this.ctx.moveTo(escrX - eAuraR, eCenterY + t * 4 - 6);
            this.ctx.lineTo(escrX - eAuraR * 2, eCenterY + t * 4 - 6 + (Math.random() - 0.5) * 6);
            this.ctx.stroke();
          }
        }
      } else if (e.type === 'cyst') {
        // CYST: Pulsación magenta orgánica
        const cystPulse = Math.sin(nowT * 6 + e.x * 4) * 0.5 + 0.5;
        this.ctx.shadowColor = 'rgb(200,50,180)';
        this.ctx.shadowBlur = eAuraR * (0.5 + cystPulse);
        this.ctx.fillStyle = `rgba(180,40,160,${(eAlpha * 0.12 * (0.5 + cystPulse)).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX, eCenterY, eAuraR * (0.6 + cystPulse * 0.3), 0, Math.PI * 2);
        this.ctx.fill();
      } else if (e.type === 'boss') {
        // BOSS: Vórtice violeta intenso + pulsación cardíaca
        const bossPulse = e.pulse || 0;
        this.ctx.shadowColor = 'rgb(140,0,220)';
        this.ctx.shadowBlur = eAuraR * (1 + bossPulse);
        this.ctx.fillStyle = `rgba(120,0,200,${(eAlpha * 0.15 * (0.6 + bossPulse * 0.8)).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(escrX, eCenterY, eAuraR * 1.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Anillos giratorios
        const ringAng = nowT * 2;
        this.ctx.strokeStyle = `rgba(160,40,255,${(eAlpha * 0.25).toFixed(2)})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(escrX, eCenterY, eAuraR * 1.5, eAuraR * 0.4, ringAng, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.shadowBlur = 0;
    });

    // --- 4. PARTÍCULAS DE MUERTE CON PROFUNDIDAD Z-BUFFER ---
    const dirX2 = Math.cos(player.a), dirY2 = Math.sin(player.a);
    const plX2 = -Math.sin(player.a) * PLANE, plY2 = Math.cos(player.a) * PLANE;
    const inv2 = 1 / (plX2 * dirY2 - dirX2 * plY2);

    particles.forEach(p => {
      const sx2 = p.x - player.x, sy2 = p.y - player.y;
      const tX2 = inv2 * (dirY2 * sx2 - dirX2 * sy2);
      const tY2 = inv2 * (-plY2 * sx2 + plX2 * sy2);
      if (tY2 <= 0.1) return;

      const scrX2 = Math.floor((W / 2) * (1 + tX2 / tY2));
      if (scrX2 < 0 || scrX2 >= W || tY2 > this.zbuf[scrX2]) return;

      const scrY2 = Math.floor(H / 2 + H / (2 * tY2) * 0.1);
      const al = p.life / p.maxLife;
      const screenR = p.r * (2 / tY2);

      // Partículas con tipo usan colores propios
      if (p.color) {
        this.ctx.shadowColor = `rgb(${p.color[0]},${p.color[1]},${p.color[2]})`;
        this.ctx.shadowBlur = screenR * 2.5;
        this.ctx.fillStyle = `${p.glowColor}${al.toFixed(2)})`;
        this.ctx.beginPath();
        if (p.smoke) {
          const t = 1 - al;
          this.ctx.arc(scrX2, scrY2, screenR * (1 + t * 2), 0, Math.PI * 2);
        } else {
          this.ctx.arc(scrX2, scrY2, screenR, 0, Math.PI * 2);
        }
        this.ctx.fill();
        // Centro brillante
        this.ctx.fillStyle = `rgba(255,255,255,${(al * 0.5).toFixed(2)})`;
        this.ctx.beginPath();
        this.ctx.arc(scrX2, scrY2, screenR * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        // Arcos eléctricos
        if (p.electric && Math.random() < 0.12) {
          this.ctx.strokeStyle = `${p.glowColor}${(al * 0.4).toFixed(2)})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(scrX2, scrY2);
          this.ctx.lineTo(scrX2 + (Math.random() - 0.5) * 12, scrY2 + (Math.random() - 0.5) * 12);
          this.ctx.stroke();
        }
        // Shockwave
        if (p.isShockwave) {
          const shockR = p.r * (H / tY2) * 0.5;
          this.ctx.strokeStyle = `${p.glowColor}${(al * 0.6).toFixed(2)})`;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(scrX2, scrY2, shockR, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      } else {
        this.ctx.fillStyle = `rgba(192,132,252,${al.toFixed(2)})`;
        this.ctx.shadowColor = '#a855f7';
        this.ctx.shadowBlur = 6;
        this.ctx.beginPath();
        this.ctx.arc(scrX2, scrY2, screenR, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.shadowBlur = 0;
    });

    // --- 5. SOMBRAS DE CONTACTO CON OCLUSIÓN DE PROFUNDIDAD ---
    this.contactShadows.forEach(s => {
      if (s.x < 0 || s.x >= W || s.tY > this.zbuf[s.x] + 0.1) return;
      this.ctx.fillStyle = `rgba(6,4,12,${s.al.toFixed(2)})`;
      this.ctx.beginPath();
      this.ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
