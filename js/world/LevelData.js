/**
 * Datos y configuración de los niveles (oleadas, spawn, bpm, lore)
 */
import { buildL0, buildL1, buildL2, buildL3, buildL4 } from './MapBuilder.js';

export const LEVELS = [
  {
    name: 'Despertar',
    sub: 'Tutorial',
    weapon: 'scalpel',
    weaponName: 'Arma inicial: bisturí',
    bpm: 100,
    build: buildL0,
    start: [3.5, 3.5, 0],
    memory: null
  },
  {
    name: 'Morgue',
    sub: 'Nivel 1',
    weapon: 'pistol',
    weaponName: 'Arma nueva: pistola',
    bpm: 100,
    build: buildL1,
    start: [6.5, 3.5, 0],
    waves: [
      // Oleada 1: Enjambre frontal
      [['zombie', 13.5, 3.5], ['zombie', 14.5, 3.5], ['zombie', 21.5, 3.5], ['zombie', 20.5, 3.5], ['orderly', 9.5, 11.5]],
      // Oleada 2: Más densidad
      [['zombie', 17.5, 11.5], ['zombie', 18.5, 11.5], ['zombie', 25.5, 11.5], ['zombie', 15.5, 7.5], ['cyst', 10.5, 5.5]],
      // Oleada 3: Horda total
      [['zombie', 14.5, 7.5], ['zombie', 20.5, 7.5], ['cyst', 9.5, 11.5], ['orderly', 25.5, 11.5], ['zombie', 5.5, 3.5], ['zombie', 6.5, 3.5], ['zombie', 11.5, 3.5], ['orderly', 12.5, 3.5]]
    ],
    memory: {
      head: 'Recuerdo 1 de 4',
      text: '«Eras médico. Tus manos cuidaban vidas antes de este lugar.»'
    }
  },
  {
    name: 'Perrera',
    sub: 'Nivel 2',
    weapon: 'shotgun',
    weaponName: 'Arma nueva: escopeta',
    bpm: 100,
    build: buildL2,
    start: [3.5, 10.5, 0],
    waves: [
      // Oleada 1: Zombis sirven de escudo, perros rápidos detrás
      [['zombie', 13.5, 3.5], ['zombie', 13.5, 4.5], ['zombie', 13.5, 5.5], ['dog', 16.5, 4.5], ['dog', 16.5, 5.5], ['cyst', 15.5, 5.5]],
      // Oleada 2: Flanqueo de perros por los lados
      [['dog', 24.5, 3.5], ['dog', 24.5, 7.5], ['zombie', 20.5, 5.5], ['zombie', 20.5, 4.5], ['zombie', 21.5, 2.5], ['orderly', 22.5, 5.5]],
      // Oleada 3: Caos
      [['dog', 13.5, 3.5], ['dog', 13.5, 7.5], ['dog', 24.5, 5.5], ['zombie', 18.5, 3.5], ['zombie', 18.5, 5.5], ['zombie', 18.5, 7.5], ['cyst', 20.5, 5.5], ['orderly', 22.5, 3.5], ['orderly', 22.5, 7.5]]
    ],
    memory: {
      head: 'Recuerdo 2 de 4',
      text: '«El experimento se llamaba Proyecto F. Buscaban modular el alma humana con sonido.»'
    }
  },
  {
    name: 'Quirófano',
    sub: 'Nivel 3',
    weapon: 'smg',
    weaponName: 'Arma nueva: subfusil',
    bpm: 100,
    build: buildL3,
    start: [4.5, 12.5, 0],
    waves: [
      // Oleada 1: Cirujanos disparando desde lejos, protegidos por zombis
      [['zombie', 12.5, 8.5], ['zombie', 12.5, 9.5], ['zombie', 12.5, 10.5], ['surgeon', 17.5, 10.5], ['surgeon', 17.5, 7.5], ['cyst', 13.5, 10.5]],
      // Oleada 2: Perros atacando rápido mientras te disparan
      [['dog', 12.5, 5.5], ['dog', 12.5, 13.5], ['zombie', 10.5, 8.5], ['zombie', 10.5, 10.5], ['surgeon', 15.5, 7.5], ['surgeon', 15.5, 11.5], ['orderly', 14.5, 7.5]],
      // Oleada 3: Fuego cruzado extremo
      [['surgeon', 10.5, 7.5], ['surgeon', 10.5, 10.5], ['surgeon', 17.5, 8.5], ['surgeon', 17.5, 9.5], ['zombie', 14.5, 8.5], ['zombie', 14.5, 10.5], ['dog', 13.5, 6.5], ['dog', 13.5, 12.5], ['cyst', 14.5, 10.5], ['orderly', 15.5, 9.5]]
    ],
    memory: {
      head: 'Recuerdo 3 de 4',
      text: '«El dibujo era de tu hija, Fe. Tú fuiste el último sujeto de prueba.»'
    }
  },
  {
    name: 'El Corazón',
    sub: 'Jefe final',
    weapon: 'defib',
    weaponName: 'Arma nueva: desfibrilador',
    bpm: 120,
    build: buildL4,
    start: [3.5, 3.5, 0],
    waves: null,
    boss: true,
    memory: null
  }
];
