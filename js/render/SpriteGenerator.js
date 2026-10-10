/**
 * Generador procedural de sprites pixel-art mediante Canvas 2D
 */

export function poly(g, pts, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fill();
}

export function makeSprite(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  drawFn(g);
  const d = g.getImageData(0, 0, w, h);
  return { w: w, h: h, data: new Uint32Array(d.data.buffer) };
}

/* ZOMBI PACIENTE (EXP-742) */
export function drawZombieBody(g, pose) {
  g.save();
  g.scale(0.6, 0.6);
  // walk3 = como walk1 pero con ligera inclinación para ciclo de 4
  // walk4 = como walk2 pero más pronunciado
  // alert  = de frente, brazos ligeramente separados
  const legOff = (pose === 'walk1' || pose === 'walk3') ? 8 : (pose === 'walk2' || pose === 'walk4' ? -8 : 0);
  const legLift = (pose === 'walk3') ? -4 : (pose === 'walk4' ? 4 : 0);
  const isAtk = (pose === 'atk');
  const isStun = (pose === 'stun');
  const isAlert = (pose === 'alert');
  const tiltBody = (pose === 'walk3') ? -0.06 : (pose === 'walk4') ? 0.06 : 0;

  // Piernas
  g.fillStyle = '#1c2420';
  g.fillRect(34 + legOff, 136 + legLift, 14, 84);
  g.fillRect(54 - legOff, 136 - legLift, 14, 84);
  g.fillStyle = '#090d0b';
  g.fillRect(30 + legOff, 218 + legLift, 20, 6);
  g.fillRect(52 - legOff, 218 - legLift, 20, 6);

  // Bata desgarrada EXP-742
  poly(g, [28, 58, 74, 58, 78, 148, 70, 140, 64, 152, 57, 142, 50, 154, 43, 143, 36, 152, 29, 142, 24, 148], '#33453d');
  poly(g, [32, 64, 70, 64, 73, 142, 63, 138, 54, 144, 46, 137, 36, 142, 28, 140], '#24332d');

  // Etiqueta EXP-742 en el pecho
  g.fillStyle = '#d8d4c5';
  g.fillRect(38, 82, 26, 9);
  g.fillStyle = '#161d19';
  g.font = '7px monospace';
  g.fillText('EXP-742', 40, 89);

  // Costuras en la bata
  g.strokeStyle = '#101713';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(42, 66);
  g.lineTo(44, 78);
  g.moveTo(60, 94);
  g.lineTo(62, 110);
  g.stroke();

  // Brazos con venas moradas brillantes
  if (isAlert) {
    // Brazos separados, postura de alerta
    poly(g, [26, 62, 4, 58, 2, 90, 14, 94, 24, 72], '#4a5a4a');
    poly(g, [74, 62, 96, 58, 98, 90, 86, 94, 76, 72], '#4a5a4a');
  } else if (isAtk) {
    poly(g, [26, 62, 10, 50, 4, 96, 16, 98, 25, 78], '#4a5a4a');
    poly(g, [74, 62, 90, 50, 96, 96, 84, 98, 75, 78], '#4a5a4a');
    g.fillStyle = '#a855f7';
    g.fillRect(3, 94, 4, 12);
    g.fillRect(93, 94, 4, 12);
  } else {
    poly(g, [28, 62, 16, 66, 6, 122, 16, 126, 26, 88], '#4a5a4a');
    poly(g, [72, 62, 84, 66, 94, 122, 84, 126, 74, 88], '#4a5a4a');
  }

  // Venas bioluminiscentes
  g.strokeStyle = '#c084fc';
  g.lineWidth = 2;
  g.shadowColor = '#a855f7';
  g.shadowBlur = 6;
  g.beginPath();
  if (isAtk) {
    g.moveTo(18, 60); g.lineTo(10, 80); g.lineTo(6, 96);
    g.moveTo(76, 60); g.lineTo(84, 80); g.lineTo(92, 96);
  } else {
    g.moveTo(22, 68); g.lineTo(14, 94); g.lineTo(10, 120);
    g.moveTo(78, 68); g.lineTo(86, 94); g.lineTo(90, 120);
  }
  g.stroke();
  g.shadowBlur = 0;

  // Cabeza con cicatrices y ojos blancos
  g.save();
  const headY = isStun ? 34 : 40;
  const tilt = isStun ? -0.2 : 0.12;
  g.translate(50, headY);
  g.rotate(tilt);
  g.translate(-50, -headY);
  g.fillStyle = '#364234';
  g.fillRect(43, headY + 4, 14, 14);
  g.fillStyle = '#5a6e57';
  g.beginPath();
  g.ellipse(50, headY - 10, 18, 21, 0, 0, 7);
  g.fill();

  // Sombra y pómulos
  g.fillStyle = '#435240';
  g.beginPath();
  g.ellipse(50, headY - 6, 15, 12, 0, 0, Math.PI);
  g.fill();

  // Cicatriz con grapas en la frente
  g.strokeStyle = '#212b20';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(38, headY - 24);
  g.lineTo(54, headY - 18);
  g.stroke();
  g.fillStyle = '#e6dfc9';
  g.fillRect(42, headY - 23, 2, 5);
  g.fillRect(48, headY - 20, 2, 5);

  // Ojos brillantes
  g.fillStyle = '#ffffff';
  g.shadowColor = '#c084fc';
  g.shadowBlur = 8;
  g.fillRect(40, headY - 13, 6, 4);
  g.fillRect(54, headY - 13, 6, 4);
  g.fillStyle = '#c084fc';
  g.fillRect(42, headY - 12, 2, 2);
  g.fillRect(56, headY - 12, 2, 2);
  g.shadowBlur = 0;

  // Mandíbula
  g.fillStyle = '#120a10';
  g.fillRect(43, headY + 1, 14, isAtk ? 6 : 3);
  if (isAtk) {
    g.fillStyle = '#e6dfc9';
    g.fillRect(44, headY + 1, 3, 2);
    g.fillRect(52, headY + 1, 3, 2);
  }
  g.restore();

  if (isStun) {
    g.strokeStyle = '#c084fc';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(50, 22, 14, 0, 5);
    g.stroke();
  }
  g.restore();
}

/** Perro experimental — poses: walk1, walk2, crouch, leap, stalk */
export function drawDogBody(g, pose) {
  g.save();
  g.scale(0.62, 0.62);
  const isCrouch = (pose === 'crouch');
  const isLeap = (pose === 'leap');
  const isStalk = (pose === 'stalk');
  // Stalk: cuerpo bajo y tenso, como acechando
  const dy = isCrouch ? 14 : (isLeap ? -6 : (isStalk ? 10 : 0));
  const bodyRY = isStalk ? 12 : (isCrouch ? 14 : 18);

  // Cuerpo demacrado
  g.fillStyle = '#1a2130';
  g.beginPath();
  g.ellipse(64, 40 + dy, 46, bodyRY, isLeap ? -0.1 : (isStalk ? 0.1 : 0), 0, 7);
  g.fill();

  // Costillas expuestas
  g.fillStyle = '#d5cebc';
  for (let r = 0; r < 4; r++) {
    g.beginPath();
    g.ellipse(48 + r * 9, 40 + dy, 2, isCrouch ? 8 : 11, 0.2, 0, 7);
    g.fill();
  }

  // Espina dorsal con grapas moradas brillantes
  g.strokeStyle = '#c084fc';
  g.lineWidth = 2.5;
  g.shadowColor = '#9333ea';
  g.shadowBlur = isCrouch ? 14 : 8;
  g.beginPath();
  g.moveTo(22, 34 + dy);
  g.quadraticCurveTo(62, 16 + dy, 114, 28 + dy);
  g.stroke();

  // Grapas quirúrgicas
  g.fillStyle = '#ffffff';
  for (let st = 0; st < 6; st++) {
    const sx = 30 + st * 14;
    const sy = 24 + dy - Math.sin(st * 0.5) * 4;
    g.fillRect(sx, sy, 3, 5);
  }
  g.shadowBlur = 0;

  // Cabeza y fauces
  const hx = isLeap ? 110 : 98;
  const hy = 28 + dy;
  poly(g, [hx, hy, hx + 32, hy - 4, hx + 48, hy + 10, hx + 28, hy + 18, hx, hy + 18], '#2d3648');
  poly(g, [hx + 8, hy - 2, hx + 12, hy - 18, hx + 20, hy - 1], '#1a2130');

  // Ojos morados fluorescentes
  g.fillStyle = '#ffffff';
  g.shadowColor = '#a855f7';
  g.shadowBlur = 8;
  g.fillRect(hx + 30, hy + 2, 6, 4);
  g.fillStyle = '#a855f7';
  g.fillRect(hx + 32, hy + 3, 3, 3);
  g.shadowBlur = 0;

  // Quijada abierta con dientes y sangre
  poly(g, [hx + 18, hy + 16, hx + 48, hy + 10, hx + 46, hy + 18, hx + 20, hy + 24], '#7f1d1d');
  g.fillStyle = '#ffffff';
  g.fillRect(hx + 34, hy + 10, 3, 4);
  g.fillRect(hx + 42, hy + 10, 3, 4);
  g.fillRect(hx + 36, hy + 16, 3, 3);

  // Patas
  g.fillStyle = '#121722';
  if (isLeap) {
    poly(g, [98, 46 + dy, 128, 42 + dy, 150, 56 + dy, 138, 62 + dy], '#1a2130');
    poly(g, [32, 46 + dy, 8, 42 + dy, -8, 58 + dy, 2, 64 + dy], '#1a2130');
  } else if (isCrouch) {
    poly(g, [92, 48 + dy, 108, 48 + dy, 116, 68 + dy, 106, 70 + dy], '#1a2130');
    poly(g, [28, 48 + dy, 44, 48 + dy, 38, 68 + dy, 28, 70 + dy], '#1a2130');
  } else {
    poly(g, [94, 48, 108, 48, 126, 82, 118, 84], '#1a2130');
    poly(g, [82, 50, 94, 52, 98, 82, 90, 84], '#1a2130');
    poly(g, [26, 50, 40, 50, 22, 82, 14, 80], '#1a2130');
    poly(g, [38, 52, 52, 52, 46, 84, 38, 84], '#1a2130');
  }

  // Cola
  poly(g, [20, 32 + dy, 2, 24 + dy, 4, 34 + dy, 18, 44 + dy], '#1a2130');
  // Stalk: pelo erizado en el lomo
  if (isStalk) {
    g.strokeStyle = '#2d3648';
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const sx = 35 + i * 12;
      g.beginPath();
      g.moveTo(sx, 24 + dy);
      g.lineTo(sx - 2, 14 + dy);
      g.stroke();
    }
  }
  g.restore();
}

/* CIRUJANO CON BISTURÍ, PORTASUERO Y RECARGA */
export function drawSurgeonBody(g, pose) {
  g.save();
  g.scale(0.6, 0.6);
  const isAim = (pose === 'aim');
  const isReload = (pose === 'reload');
  const legOff = (pose === 'walk2' ? -8 : 8);

  // Soporte de suero a la espalda
  g.strokeStyle = '#94a3b8';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(30, 120); g.lineTo(30, 14); g.lineTo(22, 14);
  g.stroke();

  // Bolsa de suero morado brillante
  g.fillStyle = 'rgba(192,132,252,.85)';
  g.shadowColor = '#a855f7';
  g.shadowBlur = 10;
  g.fillRect(16, 18, 12, 24);
  g.shadowBlur = 0;
  g.strokeStyle = '#c084fc';
  g.lineWidth = 1.5;
  g.strokeRect(16, 18, 12, 24);

  // Tubo de infusión enrollado
  g.strokeStyle = 'rgba(216,180,254,.6)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(22, 42);
  g.quadraticCurveTo(34, 70, 40, 90);
  g.stroke();

  // Piernas
  g.fillStyle = '#132422';
  g.fillRect(36 + legOff, 170, 12, 50);
  g.fillRect(53 - legOff, 170, 12, 50);

  // Bata quirúrgica turquesa con manchas de sangre
  poly(g, [30, 58, 70, 58, 76, 190, 24, 190], '#285356');
  poly(g, [34, 64, 66, 64, 71, 184, 29, 184], '#3b6e72');

  // Manchas de sangre en la bata
  g.fillStyle = '#58131d';
  g.beginPath();
  g.ellipse(44, 110, 8, 14, 0.3, 0, 7);
  g.fill();
  g.beginPath();
  g.ellipse(58, 140, 10, 18, -0.2, 0, 7);
  g.fill();

  // Brazos y bisturí
  if (isAim) {
    poly(g, [28, 62, 16, 66, 12, 110, 22, 114, 28, 88], '#285356');
    poly(g, [72, 62, 88, 54, 94, 86, 82, 90, 72, 82], '#285356');
    // Bisturí alzado
    g.fillStyle = '#cbd5e1';
    g.fillRect(92, 62, 4, 28);
    g.fillStyle = '#c084fc';
    g.shadowColor = '#a855f7';
    g.shadowBlur = 12;
    g.fillRect(92, 50, 4, 16);
    g.shadowBlur = 0;
    // Haz láser morado guía
    g.strokeStyle = 'rgba(192,132,252,.75)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(94, 50);
    g.lineTo(140, 50);
    g.stroke();
  } else if (isReload) {
    // Recarga: brazo derecho hacia arriba hacia la bolsa de suero
    poly(g, [28, 62, 18, 66, 10, 120, 20, 124, 28, 90], '#285356');
    poly(g, [72, 62, 84, 58, 78, 36, 68, 38, 70, 60], '#285356');
    // Mano tocando la bolsa
    g.fillStyle = '#cbd5e1';
    g.fillRect(66, 32, 8, 8);
  } else {
    poly(g, [28, 62, 18, 66, 10, 120, 20, 124, 28, 90], '#285356');
    poly(g, [72, 62, 84, 70, 86, 112, 76, 114, 70, 90], '#285356');
    g.fillStyle = '#cbd5e1';
    g.fillRect(84, 80, 4, 32);
    g.fillStyle = '#c084fc';
    g.shadowColor = '#a855f7';
    g.shadowBlur = 8;
    g.fillRect(84, 112, 4, 12);
    g.shadowBlur = 0;
  }

  // Cabeza con gorro y mascarilla
  g.fillStyle = '#7e9294';
  g.beginPath();
  g.ellipse(50, 30, 16, 19, 0, 0, 7);
  g.fill();
  g.fillStyle = '#285356';
  g.beginPath();
  g.ellipse(50, 20, 17, 12, 0, Math.PI, 0);
  g.fill();

  // Mascarilla quirúrgica
  g.fillStyle = '#d5e1e4';
  g.fillRect(38, 32, 24, 15);
  g.strokeStyle = '#1c2e30';
  g.lineWidth = 1;
  g.strokeRect(38, 32, 24, 15);

  // Ojos oscuros con brillo
  g.fillStyle = '#11181a';
  g.fillRect(40, 25, 6, 4);
  g.fillRect(54, 25, 6, 4);
  g.fillStyle = '#ffffff';
  g.fillRect(42, 26, 2, 2);
  g.fillRect(56, 26, 2, 2);
  g.restore();
}

/* CAMILLERO CON MÁSCARA DE GAS Y CAMILLA */
export function drawCamilleroBody(g, pose) {
  g.save();
  g.scale(0.56, 0.56);
  const isCharge = (pose === 'charge');
  const isStun = (pose === 'stun');
  const tilt = isCharge ? 0.14 : (isStun ? -0.16 : 0);

  g.save();
  g.translate(56, 120);
  g.rotate(tilt);
  g.translate(-56, -120);

  // Tanques de gas a la espalda
  g.fillStyle = '#27272a';
  g.fillRect(28, 24, 16, 48);
  g.fillRect(68, 24, 16, 48);
  g.fillStyle = '#c084fc';
  g.shadowColor = '#9333ea';
  g.shadowBlur = 8;
  g.fillRect(32, 32, 8, 32);
  g.fillRect(72, 32, 8, 32);
  g.shadowBlur = 0;

  // Piernas
  g.fillStyle = '#18181b';
  g.fillRect(36, 160, 18, 60);
  g.fillRect(58, 160, 18, 60);

  // Torso y delantal de carnicero manchado
  poly(g, [32, 60, 80, 60, 86, 180, 26, 180], '#3f3c35');
  poly(g, [36, 66, 76, 66, 80, 174, 32, 174], '#524d42');
  g.fillStyle = '#5c121e';
  g.beginPath();
  g.ellipse(54, 110, 14, 24, 0.15, 0, 7);
  g.fill();
  g.beginPath();
  g.ellipse(66, 140, 12, 18, -0.2, 0, 7);
  g.fill();

  // Brazos empujando la camilla
  poly(g, [28, 66, 12, 82, 10, 132, 22, 132, 34, 92], '#3f3c35');
  poly(g, [84, 66, 100, 82, 102, 132, 90, 132, 78, 92], '#3f3c35');

  // Cabeza con máscara de gas
  g.fillStyle = '#27272a';
  g.beginPath();
  g.ellipse(56, 36, 18, 22, 0, 0, 7);
  g.fill();

  // Lentes moradas fluorescentes
  g.fillStyle = '#ffffff';
  g.shadowColor = '#c084fc';
  g.shadowBlur = 10;
  g.beginPath();
  g.arc(48, 32, 6, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(64, 32, 6, 0, 7);
  g.fill();
  g.fillStyle = '#c084fc';
  g.beginPath();
  g.arc(48, 32, 4, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(64, 32, 4, 0, 7);
  g.fill();
  g.shadowBlur = 0;

  // Manguera de respiración
  g.strokeStyle = '#18181b';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(56, 44);
  g.quadraticCurveTo(56, 66, 42, 80);
  g.stroke();
  g.restore();

  // Camilla de acero ensangrentada al frente
  const cx0 = 12;
  const cy0 = isCharge ? 126 : 132;
  const cw = 88;
  const ch = 86;
  g.strokeStyle = '#64748b';
  g.lineWidth = 4;
  g.strokeRect(cx0, cy0, cw, ch);

  // Barrotes de la camilla
  g.strokeStyle = '#475569';
  g.lineWidth = 2;
  for (let bar = 1; bar < 4; bar++) g.strokeRect(cx0, cy0 + bar * 20, cw, 2);

  // Bandeja con sangre
  g.fillStyle = 'rgba(127,29,29,.65)';
  g.fillRect(cx0 + 6, cy0 + 6, cw - 12, ch - 12);

  // Ruedas de la camilla
  g.fillStyle = '#0f172a';
  g.beginPath();
  g.arc(cx0 + 8, cy0 + ch + 6, 8, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(cx0 + cw - 8, cy0 + ch + 6, 8, 0, 7);
  g.fill();
  g.fillStyle = '#94a3b8';
  g.beginPath();
  g.arc(cx0 + 8, cy0 + ch + 6, 3, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(cx0 + cw - 8, cy0 + ch + 6, 3, 0, 7);
  g.fill();

  if (isStun) {
    g.strokeStyle = '#facc15';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(56, 12, 12, 0, 5);
    g.stroke();
  }
  g.restore();
}

/* QUISTE PULSANTE (BIOMASA) */
export function drawCyst(g, stage) {
  const r0 = 8 + stage * 4;
  const gr = g.createRadialGradient(24, 24, 2, 24, 24, 24);
  gr.addColorStop(0, stage >= 4 ? '#ffffff' : '#f3e8ff');
  gr.addColorStop(0.35, stage >= 4 ? '#d8b4fe' : '#a855f7');
  gr.addColorStop(0.75, '#58122a');
  gr.addColorStop(1, 'rgba(30,5,15,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(24, 24, r0 + 2, 0, 7);
  g.fill();

  // Pústulas y venas
  g.fillStyle = stage >= 4 ? '#ffffff' : '#c084fc';
  g.beginPath();
  g.arc(18, 20, r0 * 0.35, 0, 7);
  g.fill();
  g.beginPath();
  g.arc(28, 26, r0 * 0.28, 0, 7);
  g.fill();
  if (stage >= 3) {
    g.strokeStyle = '#e0aaff';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(12, 24);
    g.lineTo(36, 24);
    g.moveTo(24, 12);
    g.lineTo(24, 36);
    g.stroke();
  }
}

/**
 * Genera el diccionario completo de sprites en memoria (buffers Uint32Array) y metadatos
 */
export function generateSprites() {
  const SPR = {};

  SPR.zombie_walk1 = makeSprite(64, 136, g => drawZombieBody(g, 'walk1'));
  SPR.zombie_walk2 = makeSprite(64, 136, g => drawZombieBody(g, 'walk2'));
  SPR.zombie_walk3 = makeSprite(64, 136, g => drawZombieBody(g, 'walk3'));
  SPR.zombie_walk4 = makeSprite(64, 136, g => drawZombieBody(g, 'walk4'));
  SPR.zombie_alert = makeSprite(64, 136, g => drawZombieBody(g, 'alert'));
  SPR.zombie_atk   = makeSprite(64, 136, g => drawZombieBody(g, 'atk'));
  SPR.zombie_stun  = makeSprite(64, 136, g => drawZombieBody(g, 'stun'));
  SPR.zombie = SPR.zombie_walk1;

  SPR.dog_walk1  = makeSprite(96, 58, g => drawDogBody(g, 'walk1'));
  SPR.dog_walk2  = makeSprite(96, 58, g => drawDogBody(g, 'walk2'));
  SPR.dog_crouch = makeSprite(96, 58, g => drawDogBody(g, 'crouch'));
  SPR.dog_leap   = makeSprite(96, 58, g => drawDogBody(g, 'leap'));
  SPR.dog_stalk  = makeSprite(96, 58, g => drawDogBody(g, 'stalk'));
  SPR.dog_dead = makeSprite(96, 58, g => {
    g.save();
    g.scale(0.62, 0.62);
    g.translate(64, 52);
    g.rotate(0.35);
    g.translate(-64, -52);
    drawDogBody(g, 'crouch');
    g.fillStyle = 'rgba(127,29,29,0.75)';
    g.beginPath();
    g.ellipse(64, 52, 44, 12, 0, 0, 7);
    g.fill();
    g.restore();
  });
  SPR.dog = SPR.dog_walk1;

  SPR.surgeon_walk1  = makeSprite(64, 136, g => drawSurgeonBody(g, 'walk1'));
  SPR.surgeon_walk2  = makeSprite(64, 136, g => drawSurgeonBody(g, 'walk2'));
  SPR.surgeon_aim    = makeSprite(64, 136, g => drawSurgeonBody(g, 'aim'));
  SPR.surgeon_reload = makeSprite(64, 136, g => drawSurgeonBody(g, 'reload'));
  SPR.surgeon = SPR.surgeon_walk1;

  SPR.camillero_walk1 = makeSprite(80, 140, g => drawCamilleroBody(g, 'walk1'));
  SPR.camillero_walk2 = makeSprite(80, 140, g => drawCamilleroBody(g, 'walk2'));
  SPR.camillero_charge = makeSprite(80, 140, g => drawCamilleroBody(g, 'charge'));
  SPR.camillero_stun = makeSprite(80, 140, g => drawCamilleroBody(g, 'stun'));
  SPR.camillero = SPR.camillero_walk1;
  SPR.orderly = SPR.camillero_walk1;
  SPR.camillero_dead = makeSprite(80, 140, g => {
    g.save();
    g.translate(40, 110);
    g.rotate(0.32);
    g.translate(-40, -110);
    drawCamilleroBody(g, 'stun');
    g.fillStyle = 'rgba(127,29,29,0.8)';
    g.beginPath();
    g.ellipse(40, 128, 38, 12, 0, 0, 7);
    g.fill();
    g.restore();
  });

  SPR.cyst_1 = makeSprite(48, 48, g => drawCyst(g, 1));
  SPR.cyst_2 = makeSprite(48, 48, g => drawCyst(g, 2));
  SPR.cyst_3 = makeSprite(48, 48, g => drawCyst(g, 3));
  SPR.cyst_4 = makeSprite(48, 48, g => drawCyst(g, 4));
  SPR.cyst = SPR.cyst_1;

  SPR.orb = makeSprite(24, 24, g => {
    const gr = g.createRadialGradient(12, 12, 1, 12, 12, 12);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.35, 'rgba(168,85,247,.95)');
    gr.addColorStop(1, 'rgba(139,92,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 24, 24);
  });

  SPR.pickup_ammo = makeSprite(36, 44, g => {
    g.fillStyle = '#1e293b'; g.fillRect(4, 24, 28, 16);
    g.fillStyle = '#334155'; g.fillRect(4, 24, 28, 4);
    g.fillStyle = '#c084fc'; g.shadowColor = '#a855f7'; g.shadowBlur = 8;
    g.fillRect(10, 32, 16, 4);
    g.fillRect(14, 14, 8, 12); g.fillRect(16, 10, 4, 4);
    g.shadowBlur = 0;
  });

  SPR.pickup_medkit = makeSprite(36, 44, g => {
    g.fillStyle = '#e2e8f0'; g.fillRect(4, 22, 28, 18);
    g.fillStyle = '#0f172a'; g.fillRect(12, 17, 12, 5);
    g.fillStyle = '#dc2626'; g.shadowColor = '#ef4444'; g.shadowBlur = 6;
    g.fillRect(16, 26, 4, 10); g.fillRect(13, 29, 10, 4);
    g.shadowBlur = 0;
  });

  SPR.pickup_fe = makeSprite(36, 44, g => {
    g.fillStyle = '#fef3c7'; g.fillRect(6, 12, 24, 28);
    g.strokeStyle = '#b45309'; g.lineWidth = 1; g.strokeRect(6, 12, 24, 28);
    g.font = 'bold 18px sans-serif'; g.fillStyle = '#7c3aed'; g.shadowColor = '#c084fc'; g.shadowBlur = 8;
    g.fillText('Fe', 10, 32); g.shadowBlur = 0;
  });

  SPR.pickup_scalpel = makeSprite(36, 44, g => {
    g.fillStyle = '#64748b'; g.fillRect(6, 32, 24, 8);
    g.fillStyle = '#e2e8f0'; g.shadowColor = '#c084fc'; g.shadowBlur = 8;
    g.fillRect(16, 12, 4, 22); g.fillRect(14, 8, 8, 4); g.shadowBlur = 0;
  });
  SPR.pickup = SPR.pickup_ammo;

  SPR.bed = makeSprite(120, 60, g => {
    g.fillStyle = '#3d4456'; g.fillRect(8, 42, 5, 15); g.fillRect(107, 42, 5, 15);
    g.fillStyle = '#5a6278'; g.fillRect(4, 36, 112, 6);
    g.fillRect(6, 6, 4, 32); g.fillRect(110, 6, 4, 32); g.fillRect(6, 6, 108, 3);
    poly(g, [12, 22, 108, 22, 116, 36, 4, 36], '#3a4152');
    g.fillStyle = '#2c3242'; g.fillRect(20, 28, 80, 2);
    g.shadowColor = '#8b5cff'; g.shadowBlur = 8; g.fillStyle = '#c4a8ff';
    g.fillRect(52, 22, 3, 12); g.fillRect(52, 22, 11, 3); g.fillRect(52, 27, 8, 3);
  });

  SPR.heart = makeSprite(128, 150, g => {
    g.fillStyle = '#1d212d'; g.fillRect(44, 0, 14, 52); g.fillRect(72, 0, 14, 52);
    g.fillStyle = '#3d4456'; g.fillRect(44, 0, 3, 52); g.fillRect(72, 0, 3, 52);
    g.save(); g.translate(64, 96); g.scale(0.38, 0.38);
    const hp = new Path2D('M0 -40 C-60 -110 -160 -40 -90 40 C-60 75 -20 100 0 130 C20 100 60 75 90 40 C160 -40 60 -110 0 -40 Z');
    const gr = g.createRadialGradient(0, 20, 10, 0, 20, 190);
    gr.addColorStop(0, '#b3294f'); gr.addColorStop(0.6, '#5a1329'); gr.addColorStop(1, '#1e0710');
    g.fillStyle = gr; g.fill(hp); g.lineWidth = 8; g.strokeStyle = '#0a0508'; g.stroke(hp);
    g.save(); g.clip(hp);
    g.fillStyle = '#2b3142'; g.fillRect(-170, -22, 340, 14); g.fillRect(-170, 54, 340, 12);
    g.fillStyle = '#8a91a6'; [-120, -60, 0, 60, 120].forEach(x => { g.beginPath(); g.arc(x, -15, 3, 0, 7); g.fill(); });
    g.strokeStyle = '#3a0c1e'; g.lineWidth = 7; g.beginPath(); g.moveTo(-60, -60); g.bezierCurveTo(-20, -20, -20, 60, -40, 120); g.stroke();
    g.restore();
    const cg = g.createRadialGradient(0, 22, 2, 0, 22, 64);
    cg.addColorStop(0, '#f3e8ff'); cg.addColorStop(0.35, '#a855f7'); cg.addColorStop(1, 'rgba(139,92,255,0)');
    g.fillStyle = cg; g.beginPath(); g.arc(0, 22, 64, 0, 7); g.fill();
    g.restore();
  });

  SPR.dead_body = makeSprite(128, 64, g => {
    g.fillStyle = '#18181b'; g.fillRect(20, 20, 80, 30);
    g.fillStyle = '#09090b'; g.beginPath(); g.ellipse(85, 35, 18, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#5c121e'; g.beginPath(); g.ellipse(40, 45, 45, 15, 0.2, 0, 7); g.fill();
    g.strokeStyle = '#27272a'; g.lineWidth = 3; g.beginPath(); g.moveTo(25, 35); g.lineTo(80, 35); g.stroke();
  });

  SPR.blood_puddle = makeSprite(128, 64, g => {
    g.fillStyle = 'rgba(90,4,14,0.85)';
    g.beginPath(); g.ellipse(64, 32, 55, 22, 0.1, 0, 7); g.fill();
    g.beginPath(); g.ellipse(40, 25, 30, 15, 0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(90, 40, 25, 10, -0.2, 0, 7); g.fill();
  });

  SPR.bones = makeSprite(64, 64, g => {
    g.fillStyle = '#d4d4d8'; g.fillRect(15, 28, 34, 8);
    g.beginPath(); g.arc(15, 24, 6, 0, 7); g.arc(15, 40, 6, 0, 7); g.fill();
    g.beginPath(); g.arc(49, 24, 6, 0, 7); g.arc(49, 40, 6, 0, 7); g.fill();
    g.fillStyle = '#7f1d1d'; g.beginPath(); g.ellipse(32, 32, 22, 14, 0, 0, 7); g.fill();
  });

  SPR.flesh_veins = makeSprite(128, 128, g => {
    g.strokeStyle = 'rgba(130,20,30,0.8)'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(64, 120); g.bezierCurveTo(40, 80, 90, 40, 20, 10); g.stroke();
    g.beginPath(); g.moveTo(64, 120); g.bezierCurveTo(80, 90, 30, 50, 110, 20); g.stroke();
  });

  SPR.surgical_tray = makeSprite(64, 32, g => {
    g.fillStyle = '#a1a1aa'; g.fillRect(10, 10, 44, 12);
    g.fillStyle = '#5c121e'; g.fillRect(15, 12, 20, 8);
    g.fillStyle = '#d4d4d8'; g.fillRect(38, 12, 12, 4);
  });

  const SPRDEF = {
    zombie:           { hWorld: 0.82, base: 1.1 },
    zombie_alert:     { hWorld: 0.82, base: 1.1 },
    dog:              { hWorld: 0.42, base: 2.8 },
    dog_dead:         { hWorld: 0.42, base: 2.8 },
    dog_stalk:        { hWorld: 0.42, base: 2.8 },
    surgeon:          { hWorld: 0.86, base: 1.5 },
    surgeon_reload:   { hWorld: 0.86, base: 1.5 },
    orderly:          { hWorld: 0.88, base: 1.8 },
    camillero:        { hWorld: 0.88, base: 1.8 },
    camillero_dead:   { hWorld: 0.88, base: 1.8 },
    cyst: { hWorld: 0.44, lift: 0 },
    heart: { hWorld: 1.35 },
    orb: { hWorld: 0.22, lift: 0.42 },
    pickup: { hWorld: 0.5 },
    pickup_ammo: { hWorld: 0.45 },
    pickup_medkit: { hWorld: 0.45 },
    pickup_fe: { hWorld: 0.45 },
    pickup_scalpel: { hWorld: 0.45 },
    bed: { hWorld: 0.5 },
    // Decals y decoraciones
    dead_body: { hWorld: 0.8, isFloor: true },
    blood_puddle: { hWorld: 0.9, isFloor: true },
    bones: { hWorld: 0.5, isFloor: true },
    flesh_veins: { hWorld: 1.2, isFloor: true },
    surgical_tray: { hWorld: 0.4, isFloor: true }
  };

  return { SPR, SPRDEF };
}
