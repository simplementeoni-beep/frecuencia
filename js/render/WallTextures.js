/**
 * Generador procedural de texturas de pared — VERSIÓN TERROR ANALÓGICO
 * Texturas ricas con relieve, agujeros, baldosas rotas y sangre.
 */

const sharedColor = [0, 0, 0];

/**
 * Función pseudoaleatoria rápida para ruido/estática
 */
function noise(u, v) {
  return Math.abs(Math.sin(u * 12.9898 + v * 78.233) * 43758.5453) % 1;
}

/**
 * Muestra el color procedural de una pared en coordenadas de textura (u, v)
 * @param {number} type Tipo de bloque en el mapa
 * @param {number} u Coordenada horizontal [0, 1]
 * @param {number} v Coordenada vertical [0, 1]
 * @param {Array<number>} out Buffer reutilizable [r, g, b]
 * @returns {Array<number>} [r, g, b]
 */
export function sampleWallTexture(type, u, v, out = sharedColor) {
  let r = 0, g = 0, b = 0;

  if (type === 1) {
    // DESPERTAR: Hormigón con agujeros profundos y tuberías
    r = 28; g = 30; b = 38;
    // Agujero principal en el centro
    const distToCenter = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2) * 2.5);
    if (distToCenter < 0.25 + noise(u, v) * 0.05) {
      r = 4; g = 4; b = 6; // Oscuridad profunda del agujero
      // Tubería cruzando el agujero
      if (v > 0.45 && v < 0.52) {
        r = 45; g = 25; b = 15; // Óxido
        if (v > 0.46 && v < 0.49) { r = 65; g = 40; b = 25; } // Brillo de tubería
      }
    } else {
      // Bordes del hormigón
      if (u < 0.03 || u > 0.97) { r *= 0.4; g *= 0.4; b *= 0.4; }
      if (v > 0.9) { r *= 0.65; g *= 0.65; b *= 0.7; }
      // Grietas que salen del agujero
      if (Math.abs(u - v) < 0.015 && u > 0.5) { r *= 0.3; g *= 0.3; b *= 0.3; }
    }

  } else if (type === 2) {
    // MORGUE: Azulejos de hospital rotos con moho y sangre
    const tilesX = 6, tilesY = 6;
    const tileU = (u * tilesX) % 1;
    const tileV = (v * tilesY) % 1;
    const tileCol = Math.floor(u * tilesX);
    const tileRow = Math.floor(v * tilesY);
    
    // Azulejo faltante (revela ladrillo oscuro)
    const isMissing = (tileCol === 2 && tileRow === 3) || (tileCol === 4 && tileRow === 1);
    
    if (isMissing) {
      r = 15; g = 18; b = 22; // Ladrillo oscuro/moho
      if ((v * 30) % 1 < 0.1) { r *= 0.5; g *= 0.5; b *= 0.5; } // Juntas del ladrillo
    } else {
      r = 55; g = 65; b = 75; // Azulejo blanco frío sucio
      if (tileU < 0.08 || tileU > 0.92 || tileV < 0.08 || tileV > 0.92) {
        r = 10; g = 15; b = 20; // Juntas negras llenas de moho
      } else {
        // Reflejo aséptico
        if (tileU > 0.2 && tileU < 0.4 && tileV > 0.2 && tileV < 0.4) {
          r *= 1.3; g *= 1.3; b *= 1.3;
        }
      }
    }
    // Chorrera de sangre desde arriba
    if (u > 0.35 && u < 0.45 && v < 0.6) {
      const bloodWave = Math.sin(v * 10) * 0.02;
      if (u > 0.38 + bloodWave && u < 0.42 + bloodWave) {
        r = 60; g = 10; b = 15; // Sangre oscura
      }
    }

  } else if (type === 3) {
    // PERRERA: Metal de matadero oxidado con marcas de garras
    r = 30; g = 25; b = 25;
    if (u < 0.05 || u > 0.95) { r *= 0.45; g *= 0.45; b *= 0.5; }
    if (v % 0.25 < 0.03) { r = 15; g = 10; b = 10; } // Pliegues de chapa
    
    // Zonas gigantes de óxido
    if (noise(u * 2, v * 2) > 0.6) {
      r = 65; g = 25; b = 10;
    }
    // Marcas de garras gigantes (diagonales)
    const claw = (u + v * 0.5);
    if ((claw > 0.6 && claw < 0.62) || (claw > 0.7 && claw < 0.72) || (claw > 0.8 && claw < 0.82)) {
      if (v > 0.2 && v < 0.8) {
        r = 10; g = 5; b = 5; // Arañazo profundo
      }
    }
    // Sangre fresca salpicada abajo
    if (v > 0.75 && noise(u * 5, v * 5) > 0.4) {
      r = 120; g = 0; b = 0;
    }

  } else if (type === 4) {
    // QUIRÓFANO: Paneles de acero y pantallas CRT rotas
    r = 25; g = 30; b = 40;
    if (u < 0.02 || u > 0.98 || v < 0.02 || v > 0.98) { r = 10; g = 10; b = 15; }
    
    // Pantalla incrustada
    if (u > 0.2 && u < 0.8 && v > 0.3 && v < 0.6) {
      const screenNoise = noise(u * 10, v * 10);
      if (screenNoise > 0.5) {
        r = 180; g = 200; b = 255; // Estática azulada brillante
      } else {
        r = 20; g = 30; b = 60; // Estática oscura
      }
      // Scanline de la pantalla
      if ((v * 40) % 1 < 0.3) { r *= 0.5; g *= 0.5; b *= 0.5; }
    } else {
      // Cables venosos debajo de la pantalla
      if (u > 0.45 && u < 0.55 && v > 0.6) {
        r = 15; g = 15; b = 15; // Cable negro
        if (u > 0.48 && u < 0.52) { r = 35; g = 35; b = 40; } // Brillo
      }
    }

  } else if (type === 8) {
    // CORAZÓN: Biomasa pura, carne pulsante con ojos
    r = 45; g = 15; b = 30;
    // Textura carnosa
    if (noise(u * 4, v * 4) > 0.5) { r = 65; g = 20; b = 40; }
    
    // Venas oscuras pulsantes (simuladas por curvas sinusoidales espaciales)
    const vein = Math.sin(u * 15 + Math.sin(v * 10) * 2);
    if (vein > 0.8) {
      r = 20; g = 5; b = 10;
    }

    // Ojo incrustado cerrado/entreabierto
    const eyeDist = Math.sqrt(Math.pow(u - 0.7, 2) + Math.pow(v - 0.4, 2) * 3);
    if (eyeDist < 0.15) {
      if (eyeDist < 0.04) {
        r = 10; g = 10; b = 10; // Pupila
      } else if (eyeDist < 0.1) {
        r = 180; g = 170; b = 100; // Esclerótica amarillenta (enferma)
      } else {
        r = 80; g = 10; b = 20; // Párpados irritados
      }
    }

  } else if (type === 9) {
    // CARTEL PUBLICITARIO (Easter Egg)
    // Fondo de papel viejo
    r = 200; g = 190; b = 170;
    if (noise(u*2, v*2) > 0.5) { r = 180; g = 170; b = 150; }
    // Bordes rasgados
    if (u < 0.1 + noise(v, u)*0.05 || u > 0.9 - noise(v, u)*0.05 || v < 0.1 || v > 0.9) {
      r = 20; g = 20; b = 25; // Pared oscura de fondo
    } else {
      // Simulación de una figura aterradora borrosa en el cartel
      const figDist = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2));
      if (figDist < 0.3) {
        r *= 0.3; g *= 0.2; b *= 0.2; // Silueta oscura/rojiza
        if (figDist < 0.1) { r = 255; g = 0; b = 0; } // Ojos rojos
      }
      // Texto incomprensible (rayas negras)
      if (v > 0.75 && v < 0.85 && (u * 20) % 1 > 0.4 && u > 0.2 && u < 0.8) {
        r = 30; g = 30; b = 30;
      }
    }
  } else if (type === 10) {
    // PROP VOLUMÉTRICO: Pila de cadáveres / Bolsas
    r = 15; g = 15; b = 18; // Plástico negro brillante
    if (noise(u * 8, v * 8) > 0.6) { r = 25; g = 25; b = 30; } // Brillo del plástico
    // Pliegues y cuerdas
    if ((u + v) % 0.3 < 0.02 || (u - v + 1) % 0.4 < 0.02) {
      r = 5; g = 5; b = 5; // Hendiduras profundas
    }
    // Charco de sangre masivo en la base
    if (v > 0.8) {
      r = 80; g = 10; b = 15;
      if (noise(u * 5, v * 5) > 0.5) { r = 120; g = 0; b = 0; }
    }
  } else if (type === 11) {
    // PROP VOLUMÉTRICO: Armario Médico / Pila de Camillas (Morgue y Quirófano)
    r = 60; g = 70; b = 80; // Metal aséptico
    // Cajones / separaciones
    if ((v * 5) % 1 < 0.05 || u < 0.05 || u > 0.95) {
      r = 20; g = 25; b = 30;
    }
    // Manija del cajón
    if (u > 0.4 && u < 0.6 && (v * 5) % 1 > 0.2 && (v * 5) % 1 < 0.3) {
      r = 120; g = 130; b = 140; // Brillo metálico
    }
    // Manchas de sangre oxidada
    if (u > 0.7 && v > 0.4 && v < 0.7 && noise(u * 10, v * 10) > 0.4) {
      r = 60; g = 20; b = 20;
    }
  } else if (type === 12) {
    // PROP VOLUMÉTRICO: Pilar de Jaula (Perrera)
    r = 10; g = 10; b = 12; // Fondo muy oscuro
    // Barrotes verticales gruesos
    if ((u * 8) % 1 < 0.2) {
      r = 50; g = 45; b = 40; // Metal oxidado
      if (u > 0.3 && u < 0.4 && v > 0.4 && v < 0.6) {
        r = 10; g = 10; b = 10; // Barrote roto/doblado
      }
    }
    // Barrotes horizontales
    if ((v * 4) % 1 < 0.08) {
      r = 45; g = 40; b = 35;
    }
  } else if (type === 13) {
    // PROP VOLUMÉTRICO: Pilar Publicitario
    r = 22; g = 22; b = 25; // Pilar gris oscuro
    if (v > 0.2 && v < 0.8 && u > 0.1 && u < 0.9) {
      // El cartel pegado en el centro del bloque
      r = 200; g = 190; b = 170; // Papel
      if (noise(u*2, v*2) > 0.5) { r = 180; g = 170; b = 150; } // Suciedad
      const figDist = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow((v - 0.5)*1.5, 2));
      if (figDist < 0.25) {
        r *= 0.3; g *= 0.2; b *= 0.2; // Silueta
        if (figDist < 0.08) { r = 255; g = 0; b = 0; } // Ojos
      }
      if (v > 0.65 && v < 0.75 && (u * 25) % 1 > 0.4) {
        r = 30; g = 30; b = 30; // Texto
      }
    }
  } else {
    // Default (resto de niveles) — Ladrillo asqueroso
    r = 20; g = 22; b = 26;
    if (((u * 5) % 1) < 0.05 || ((v * 5) % 1) < 0.05) { r = 10; g = 10; b = 12; }
    if (noise(u, v) > 0.8) { r = 35; g = 35; b = 40; } // Moho
  }

  out[0] = r;
  out[1] = g;
  out[2] = b;
  return out;
}
