/**
 * Paletas de iluminación, niebla y colores para cada nivel
 * HOSPITAL PSIQUIÁTRICO — Luz verde enfermiza institucional
 *
 * fA / fB  : colores del suelo (dos tonos alternos)
 * ce       : color del techo
 * lc       : color de la luz de las lámparas
 * li       : intensidad de niebla/luz global
 * fog      : color de la niebla de distancia
 */
export const THEMES = [
  // Nivel 0: Sala de Contención — fluorescente casi muerto, verde-amarillo enfermizo
  {
    fA:  [10, 18, 12],   // suelo: verde oscuro apagado
    fB:  [14, 22, 16],   // suelo alt
    ce:  [5,  12,  8],   // techo casi negro verdoso
    lc:  [80, 200, 90],  // lámpara: verde pálido
    li:  0.18,
    fog: [5,  14,  8]
  },
  // Nivel 1: Ala de Enfermos — verde clínico sucio, fluorescente largo
  {
    fA:  [12, 20, 14],
    fB:  [16, 26, 18],
    ce:  [6,  14,  9],
    lc:  [60, 190, 80],  // verde frío más brillante
    li:  0.22,
    fog: [8,  18, 10]
  },
  // Nivel 2: El Patio — verde acero, casi industrial, frío
  {
    fA:  [10, 16, 14],
    fB:  [14, 20, 18],
    ce:  [4,  10,  8],
    lc:  [40, 160, 70],  // verde más apagado, claustrofóbico
    li:  0.16,
    fog: [6,  12,  9]
  },
  // Nivel 3: Sala de Electroshock — verde eléctrico brillante, quema los ojos
  {
    fA:  [8,  22, 12],
    fB:  [12, 28, 16],
    ce:  [4,  16,  8],
    lc:  [100, 255, 110], // verde eléctrico máximo
    li:  0.28,
    fog: [6,  20, 10]
  },
  // Nivel 4: El Olvido — verde enfermo tirando a magenta, ambiente alienígena
  {
    fA:  [14, 16, 10],
    fB:  [18, 20, 14],
    ce:  [8,  10,  4],
    lc:  [60, 180, 90],
    li:  0.30,
    fog: [10, 14,  6]
  }
];
