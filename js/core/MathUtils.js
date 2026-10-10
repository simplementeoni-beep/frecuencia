/**
 * Utilidades matemáticas puras, colisiones y empaquetado de color
 */

import { Config } from './Config.js';

/**
 * Empaqueta componentes RGB en un entero Uint32 para el ImageData
 */
export function pack(r, g, b) {
  r = r < 0 ? 0 : (r > 255 ? 255 : r | 0);
  g = g < 0 ? 0 : (g > 255 ? 255 : g | 0);
  b = b < 0 ? 0 : (b > 255 ? 255 : b | 0);
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

/**
 * Factor de atenuación por niebla de distancia
 */
export function fogAt(distance) {
  const f = 1 / (1 + distance * distance * Config.fogMultiplier);
  return f < Config.fogThreshold ? Config.fogThreshold : f;
}

/**
 * Comprueba si una coordenada (px, py) colisiona con un bloque sólido del mapa
 */
export function solid(map, px, py) {
  const mh = map.length;
  if (mh === 0) return true;
  const mw = map[0].length;
  const mx = px | 0;
  const my = py | 0;
  if (py < 0 || px < 0 || my >= mh || mx >= mw) return true;
  return map[my][mx] !== 0;
}

/**
 * Comprobación de colisión con radio para movimiento de entidades
 */
export function canMove(map, px, py, r) {
  return !solid(map, px - r, py - r) &&
         !solid(map, px + r, py - r) &&
         !solid(map, px - r, py + r) &&
         !solid(map, px + r, py + r);
}

/**
 * Línea de visión directa (Line of Sight) entre dos puntos
 */
export function los(map, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  const n = Math.ceil(d / 0.25);
  for (let i = 1; i < n; i++) {
    if (solid(map, x0 + dx * i / n, y0 + dy * i / n)) return false;
  }
  return true;
}

/**
 * Distancia euclidiana entre dos puntos
 */
export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Rota un vector 90 grados perpendicularmente según el lado (1 o -1)
 */
export function rotatePerp(ux, uy, side) {
  return {
    ux: -uy * side,
    uy: ux * side
  };
}

/**
 * Formatea segundos en formato m:ss
 */
export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ":" + (sec < 10 ? "0" : "") + sec;
}
