/**
 * Constructor de mapas procedurales y distribución de lámparas por nivel.
 * Implementa 5 arquitecturas distintas para generar verdadero Terror Analógico.
 */

export function mk(w, h, f = 0) {
  const g = [];
  for (let y = 0; y < h; y++) {
    g[y] = [];
    for (let x = 0; x < w; x++) g[y][x] = f;
  }
  return g;
}

export function border(g, w, h, t = 1) {
  for (let x = 0; x < w; x++) { g[0][x] = t; g[h - 1][x] = t; }
  for (let y = 0; y < h; y++) { g[y][0] = t; g[y][w - 1] = t; }
}

export function put(g, list, t) {
  list.forEach(p => { if (g[p[1]] && g[p[1]][p[0]] !== undefined) g[p[1]][p[0]] = t; });
}

// ==========================================
// NIVEL 0: DESPERTAR (Laberinto Claustrofóbico ensanchado para evitar atascos)
// ==========================================
export function buildL0() {
  const w = 21, h = 21;
  const g = mk(w, h, 1);
  const lamps = [];
  
  const carve = (x, y, w, h) => {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) g[j][i] = 0;
    }
  };
  
  carve(2, 2, 4, 4); // Sala inicial
  carve(5, 3, 14, 2); // Pasillo largo este
  carve(17, 3, 2, 10); // Pasillo sur
  carve(6, 11, 13, 2); // Pasillo oeste
  carve(6, 5, 2, 8); // Pasillo norte
  carve(2, 5, 6, 2); // Pasillo oeste
  carve(2, 5, 2, 14); // Pasillo sur largo
  carve(2, 17, 16, 2); // Pasillo final este
  carve(16, 15, 3, 4); // Sala final
  g[16][19] = 4; // Puerta salida

  // Props volumétricos fijos (Pila de basura/cuerpos y Cartel)
  g[2][2] = 13; // Cartel publicitario
  g[6][14] = 10; g[7][14] = 10; // Basura en el pasillo ciego
  g[10][17] = 10; // Bloqueo en un giro

  // Lámparas espaciadas
  lamps.push([4, 4], [12, 4], [18, 8], [9, 12], [7, 8], [3, 12], [10, 18], [17, 16]);
  lamps.push([3, 3], [12, 3], [18, 8], [9, 12], [6, 8], [2, 12], [10, 18], [17, 16]);

  return { g, lamps };
}

// ==========================================
// NIVEL 1: MORGUE (Arquitectura de Hospital)
// ==========================================
export function buildL1() {
  const w = 31, h = 15;
  const g = mk(w, h, 2); // Bloques tipo morgue
  const lamps = [];

  // Pasillo central largo y recto
  for (let x = 1; x < w - 1; x++) {
    g[6][x] = 0; g[7][x] = 0; g[8][x] = 0;
  }

  // Habitaciones (salas de autopsia) a los lados del pasillo
  const makeRoom = (cx, cy) => {
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) g[y][x] = 0;
    }
    lamps.push([cx, cy]); // Luz en el centro de cada sala
  };

  makeRoom(5, 3); makeRoom(13, 3); makeRoom(21, 3); // Norte
  makeRoom(9, 11); makeRoom(17, 11); makeRoom(25, 11); // Sur

  // Props volumétricos: Camillas (11) y Pilas de cadáveres (10) en el centro de las salas
  g[3][5] = 11; g[3][21] = 11; // Camillas médicas
  g[11][9] = 10; g[11][17] = 11; g[11][25] = 10; // Bolsas de cadáveres y más camillas

  // Conectar habitaciones al pasillo
  g[5][5] = 0; g[5][13] = 0; g[5][21] = 0;
  g[9][9] = 0; g[9][17] = 0; g[9][25] = 0;

  // Lámparas del pasillo (zumbando solas)
  lamps.push([2, 7], [8, 7], [15, 7], [22, 7], [28, 7]);
  g[7][29] = 4; // Puerta

  return { g, lamps };
}

// ==========================================
// NIVEL 2: PERRERA (La Arena Abierta)
// ==========================================
export function buildL2() {
  const w = 27, h = 19;
  const g = mk(w, h, 3);
  const lamps = [];
  border(g, w, h, 3);

  // Vaciamos casi todo para hacer una "Arena"
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) g[y][x] = 0;
  }

  // Colocamos estructuras de "jaulas" permeables
  const cage = (cx, cy) => {
    // Las jaulas ahora son Pilares de Jaula Volumétricos (12)
    g[cy - 2][cx - 2] = 12; g[cy - 2][cx + 2] = 12;
    g[cy + 2][cx - 2] = 12; g[cy + 2][cx + 2] = 12;
    lamps.push([cx, cy]);
  };

  cage(7, 5); cage(19, 5);
  cage(7, 13); cage(19, 13);
  cage(13, 9); // Jaula central gigante
  
  // Trozos de carne y sangre esparcidos (10)
  g[5][13] = 10; g[13][5] = 10; g[17][17] = 10;

  g[9][25] = 4; // Salida
  return { g, lamps };
}

// ==========================================
// NIVEL 3: QUIRÓFANO (Espirales Desorientadoras)
// ==========================================
export function buildL3() {
  const w = 25, h = 21;
  const g = mk(w, h, 4);
  const lamps = [];

  // Limpiamos
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) g[y][x] = 0;
  }

  // Anillos concéntricos (Paredes que bloquean la visión y forman pasillos curvos)
  const drawRing = (rx, ry, rw, rh, holeDir) => {
    for (let x = rx; x < rx + rw; x++) { g[ry][x] = 4; g[ry + rh - 1][x] = 4; }
    for (let y = ry; y < ry + rh; y++) { g[y][rx] = 4; g[y][rx + rw - 1] = 4; }
    // Abrir un agujero para pasar
    if (holeDir === 'N') { g[ry][rx + Math.floor(rw/2)] = 0; g[ry][rx + Math.floor(rw/2)+1] = 0; }
    if (holeDir === 'S') { g[ry+rh-1][rx + Math.floor(rw/2)] = 0; g[ry+rh-1][rx + Math.floor(rw/2)-1] = 0; }
    if (holeDir === 'E') { g[ry + Math.floor(rh/2)][rx+rw-1] = 0; g[ry + Math.floor(rh/2)+1][rx+rw-1] = 0; }
    if (holeDir === 'W') { g[ry + Math.floor(rh/2)][rx] = 0; g[ry + Math.floor(rh/2)-1][rx] = 0; }
  };

  drawRing(2, 2, 21, 17, 'S'); // Anillo exterior
  drawRing(5, 4, 15, 13, 'E'); // Anillo medio
  drawRing(8, 6, 9, 9, 'N'); // Sala central de operaciones

  // Props: Armarios de instrumental quirúrgico (11) en los anillos oscuros
  g[3][3] = 11; g[17][21] = 11; g[17][3] = 11; 
  // Pila de restos en el centro
  g[9][10] = 10; g[9][14] = 10;

  // Lámparas
  lamps.push([12, 10], [12, 8], [12, 12]); // Muy iluminado en el centro
  lamps.push([3, 10], [21, 10], [12, 3], [12, 17]); // Pasillos oscuros

  g[10][12] = 4; // Salida en el centro (es un ascensor)
  return { g, lamps };
}

// ==========================================
// NIVEL 4: EL CORAZÓN (Cavernas Orgánicas)
// ==========================================
export function buildL4() {
  const w = 31, h = 25;
  let g = mk(w, h, 8);
  const lamps = [];

  // Inicialización aleatoria (Autómatas Celulares)
  // Fijamos una semilla determinista para que el nivel sea siempre igual y jugable
  const seed = [0.3, 0.6, 0.2, 0.8, 0.4, 0.9, 0.1, 0.5, 0.7];
  let sIdx = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (seed[(x * 13 + y * 7) % seed.length] > 0.42) g[y][x] = 0;
    }
  }

  // Suavizado (Cellular Automata rules) - 3 iteraciones
  for (let iter = 0; iter < 3; iter++) {
    const ng = mk(w, h, 8);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (g[y + dy][x + dx] === 8) walls++;
          }
        }
        ng[y][x] = walls > 4 ? 8 : 0;
      }
    }
    g = ng;
  }

  border(g, w, h, 8);

  // Asegurar una cueva central gigante para la batalla contra el jefe
  for (let y = 8; y < 17; y++) {
    for (let x = 10; x < 21; x++) {
      const dist = Math.sqrt((x - 15)**2 + (y - 12)**2);
      if (dist < 4.5) g[y][x] = 0;
    }
  }

  // Forzar un camino limpio desde el inicio (2,2)
  for(let x = 2; x < 12; x++) g[3][x] = 0;
  for(let y = 3; y < 12; y++) g[y][12] = 0;
  
  // Props: Quistes gigantes en las paredes (10)
  g[5][10] = 10; g[13][16] = 10; g[15][9] = 10;

  // Lámparas "biológicas" pulsantes esparcidas por las cavernas
  lamps.push([15, 12], [11, 10], [19, 14], [15, 7], [15, 17], [6, 3]);

  return { g, lamps };
}
