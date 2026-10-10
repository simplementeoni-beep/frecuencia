/**
 * Renderizado de interfaz gráfica 2D sobre el canvas: HUD, mirilla, armas y efectos
 */
import { W, H } from '../core/Constants.js';
import { poly } from './SpriteGenerator.js';
import { WEAPONS } from '../entities/Weapons.js';

export function circle(ctx, cx, cy, r, style, w = 1) {
  ctx.strokeStyle = style;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawWeapon(ctx, player, weaponState) {
  const k = player.weapon;
  if (!k) return;
  const bx = W / 2 + Math.sin(player.bob) * 4;
  const by = H - 30 + weaponState.recoil * 10 + (player.moving ? Math.abs(Math.cos(player.bob)) * 3 : 0);
  const rc = weaponState.recoil * 6;

  ctx.fillStyle = '#181a23';
  if (k === 'scalpel') {
    const sl = weaponState.slash || 0;
    const sx = bx + 40 - sl * 60;
    const sy = by - 35 - sl * 30 + rc;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.3 - sl * 0.7);
    // Mango quirúrgico
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -10, 12, 65);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -10, 3, 65);
    // Hoja afilada de bisturí
    poly(ctx, [-4, -10, 4, -10, 2, -42, -4, -28], '#e2e8f0');
    // Filo con brillo morado
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.lineTo(2, -42);
    ctx.stroke();
    ctx.restore();
    if (sl > 0) {
      ctx.strokeStyle = 'rgba(216,180,254,' + (sl * 0.9).toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx + 60, by - 60);
      ctx.quadraticCurveTo(bx, by - 80, bx - 60, by - 40);
      ctx.stroke();
    }
  } else if (k === 'pistol') {
    ctx.beginPath();
    ctx.moveTo(bx - 34, by + 8);
    ctx.lineTo(bx - 18, by - 32);
    ctx.lineTo(bx + 18, by - 32);
    ctx.lineTo(bx + 34, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a4052';
    ctx.fillRect(bx - 9, by - 78 + rc, 18, 50);
    ctx.fillStyle = 'rgba(139,92,255,.5)';
    ctx.fillRect(bx - 9, by - 78 + rc, 3, 50);
    ctx.fillStyle = '#565d72';
    ctx.fillRect(bx - 4, by - 84 + rc, 8, 7);
  } else if (k === 'shotgun') {
    ctx.beginPath();
    ctx.moveTo(bx - 46, by + 8);
    ctx.lineTo(bx - 26, by - 30);
    ctx.lineTo(bx + 26, by - 30);
    ctx.lineTo(bx + 46, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a4052';
    ctx.fillRect(bx - 18, by - 92 + rc, 14, 64);
    ctx.fillRect(bx + 4, by - 92 + rc, 14, 64);
    ctx.fillStyle = 'rgba(139,92,255,.45)';
    ctx.fillRect(bx - 18, by - 92 + rc, 3, 64);
    ctx.fillStyle = '#2b3142';
    ctx.fillRect(bx - 22, by - 56 + rc, 44, 14);
  } else if (k === 'smg') {
    ctx.beginPath();
    ctx.moveTo(bx - 38, by + 8);
    ctx.lineTo(bx - 20, by - 30);
    ctx.lineTo(bx + 20, by - 30);
    ctx.lineTo(bx + 38, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a4052';
    ctx.fillRect(bx - 12, by - 70 + rc, 24, 44);
    ctx.fillStyle = '#565d72';
    ctx.fillRect(bx - 4, by - 92 + rc, 8, 24);
    ctx.fillStyle = '#2b3142';
    ctx.fillRect(bx + 12, by - 56 + rc, 9, 26);
    ctx.fillStyle = 'rgba(139,92,255,.5)';
    ctx.fillRect(bx - 12, by - 70 + rc, 3, 44);
  } else {
    // Desfibrilador
    ctx.beginPath();
    ctx.moveTo(bx - 70, by + 8);
    ctx.lineTo(bx - 50, by - 24);
    ctx.lineTo(bx - 14, by - 24);
    ctx.lineTo(bx - 10, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 70, by + 8);
    ctx.lineTo(bx + 50, by - 24);
    ctx.lineTo(bx + 14, by - 24);
    ctx.lineTo(bx + 10, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b3142';
    ctx.fillRect(bx - 60, by - 64 + rc, 42, 38);
    ctx.fillRect(bx + 18, by - 64 + rc, 42, 38);
    ctx.strokeStyle = '#8b5cff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 60, by - 64 + rc, 42, 38);
    ctx.strokeRect(bx + 18, by - 64 + rc, 42, 38);
    ctx.fillStyle = '#161822';
    ctx.fillRect(bx - 52, by - 56 + rc, 26, 22);
    ctx.fillRect(bx + 26, by - 56 + rc, 26, 22);
    if (weaponState.flash > 0 || (Math.random() < 0.25)) {
      ctx.strokeStyle = 'rgba(200,170,255,.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - 18, by - 45 + rc);
      for (let zx = -12; zx <= 18; zx += 6) {
        ctx.lineTo(bx + zx, by - 45 + rc + (Math.random() - 0.5) * 14);
      }
      ctx.lineTo(bx + 18, by - 45 + rc);
      ctx.stroke();
    }
  }

  if (weaponState.flash > 0) {
    ctx.fillStyle = 'rgba(139,92,255,.35)';
    ctx.beginPath();
    ctx.arc(bx, by - 92, k === 'shotgun' ? 34 : 26, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,255,.95)';
    ctx.beginPath();
    ctx.arc(bx, by - 92, k === 'shotgun' ? 16 : 12, 0, 7);
    ctx.fill();
  }
}

export function drawCross(ctx, beatInfo, fx, beatDuration, windowSize) {
  const cx = W / 2, cy = H / 2 - 6, r0 = 11;
  const p = beatInfo.pos;
  const inWin = Math.min(p, 1 - p) * beatDuration <= windowSize;
  const rr = r0 * (1 + 2.2 * (1 - p));
  const al = Math.min(1, p * 3);

  circle(ctx, cx, cy, r0, inWin ? 'rgba(255,255,255,.9)' : 'rgba(139,92,255,.5)', inWin ? 2 : 1);
  circle(ctx, cx, cy, rr, 'rgba(197,170,255,' + al.toFixed(2) + ')', 1);

  ctx.strokeStyle = fx.onBeat > 0 ? '#ffffff' : '#e6dfc9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
  ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '13px VT323, monospace';
  if (fx.onBeat > 0) {
    ctx.globalAlpha = Math.min(1, fx.onBeat * 2);
    ctx.fillStyle = '#c5aaff';
    ctx.fillText('AL COMPÁS', cx, cy - 22);
    ctx.globalAlpha = 1;
  }
  if (fx.shield > 0) {
    ctx.globalAlpha = Math.min(1, fx.shield * 3);
    ctx.fillStyle = '#8fb4ff';
    ctx.fillText('ESCUDO', cx, cy + 30);
    ctx.globalAlpha = 1;
  }
}

export function drawHUD(ctx, player, hp, combo, enemies, curLevel, levelName, boss, toast) {
  ctx.fillStyle = 'rgba(7,6,10,.92)';
  ctx.fillRect(0, H - 32, W, 32);
  ctx.fillStyle = 'rgba(139,92,255,.35)';
  ctx.fillRect(0, H - 32, W, 1);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '11px VT323, monospace';
  ctx.fillStyle = '#8a84a0';
  ctx.fillText('VIDA', 14, H - 21);

  ctx.font = '21px VT323, monospace';
  ctx.fillStyle = hp < 30 ? '#ff6a7a' : '#e6dfc9';
  ctx.fillText(String(Math.max(0, Math.ceil(hp))), 14, H - 5);

  // Combo y letra F
  const bx = W / 2 - 50;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < combo ? '#8b5cff' : '#231e31';
    ctx.fillRect(bx + i * 22, H - 18, 18, 7);
  }
  ctx.font = '12px VT323, monospace';
  ctx.fillStyle = '#8a84a0';
  ctx.textAlign = 'center';
  ctx.fillText('COMBO', W / 2 - 17, H - 22);

  ctx.textAlign = 'left';
  ctx.font = '20px "Bebas Neue", Impact, sans-serif';
  ctx.fillStyle = '#a983ff';
  ctx.globalAlpha = combo >= 4 ? 1 : 0.28;
  ctx.fillText('F', bx - 18, H - 7);
  ctx.globalAlpha = 1;

  ctx.font = '20px VT323, monospace';
  ctx.fillStyle = '#e6dfc9';
  ctx.fillText('x' + combo, bx + 92, H - 7);

  // Inventario y munición
  const inv = player.inventory;
  const startX = W - 14 - (inv.length * 44);
  for (let w = 0; w < inv.length; w++) {
    const wKey = inv[w];
    const wInfo = WEAPONS[wKey];
    const isCur = (wKey === player.weapon);
    const slotX = startX + w * 44;

    ctx.fillStyle = isCur ? 'rgba(139,92,255,.28)' : 'rgba(20,18,28,.6)';
    ctx.fillRect(slotX, H - 28, 40, 24);
    ctx.strokeStyle = isCur ? '#a855f7' : '#3d384e';
    ctx.lineWidth = isCur ? 1.5 : 1;
    ctx.strokeRect(slotX, H - 28, 40, 24);

    ctx.font = '10px VT323, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = isCur ? '#ffffff' : '#7a748c';
    ctx.fillText(String(w + 1), slotX + 3, H - 18);

    ctx.font = '11px sans-serif';
    ctx.fillText(wInfo.icon, slotX + 13, H - 13);

    ctx.font = '11px VT323, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = isCur ? '#e6dfc9' : '#8a84a0';
    const am = (wInfo.ammo === -1) ? '∞' : player.ammo[wKey];
    ctx.fillText(am, slotX + 37, H - 8);
  }

  // Contador de enemigos activos en el HUD
  let left = 0;
  enemies.forEach(e => {
    if (e.alive && e.dying <= 0 && e.type !== 'boss' && e.delay <= 0) left++;
  });
  ctx.textAlign = 'right';
  ctx.font = '12px VT323, monospace';
  ctx.fillStyle = '#8a84a0';
  ctx.fillText(boss ? 'JEFE FINAL' : levelName.toUpperCase() + ' · ' + left + ' ENEMIGOS', W - 10, 14);

  if (boss && boss.alive) {
    ctx.textAlign = 'center';
    ctx.font = '14px VT323, monospace';
    ctx.fillStyle = '#d8d0bf';
    ctx.fillText('EL CORAZÓN', W / 2, 14);
    ctx.fillStyle = '#161822';
    ctx.fillRect(W / 2 - 120, 19, 240, 6);
    ctx.fillStyle = '#8b5cff';
    ctx.fillRect(W / 2 - 120, 19, 240 * Math.max(0, boss.hp / boss.max), 6);
    ctx.fillStyle = '#07060a';
    ctx.fillRect(W / 2 - 120 + 80 - 1, 18, 2, 8);
    ctx.fillRect(W / 2 - 120 + 160 - 1, 18, 2, 8);
  }

  if (toast) toast.draw(ctx);
}

export function drawFX(ctx, beatInfo, combo, fx, hp, motes) {
  const pulse = Math.exp(-beatInfo.pos * 5);

  // Esporas y motas
  ctx.fillStyle = 'rgba(192,132,252,.35)';
  motes.forEach(m => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Viñeta perimetral
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.68);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,3,9,.72)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (combo >= 3) {
    ctx.fillStyle = 'rgba(139,92,255,' + (0.04 * combo * pulse).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H - 30);
  }
  if (fx.hurt > 0) {
    ctx.fillStyle = 'rgba(122,22,38,' + (fx.hurt * 1.1).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (hp < 30) {
    ctx.fillStyle = 'rgba(60,0,10,' + (0.18 + 0.1 * pulse).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (fx.fade > 0) {
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, fx.fade / 1.0).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}
