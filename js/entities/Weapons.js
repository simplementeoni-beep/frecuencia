/**
 * Arsenal disponible en el juego con sus propiedades de combate
 */
export const WEAPONS = {
  scalpel: {
    name: 'BISTURÍ',
    cd: 0.38,      // Nerfeado: 0.24 → 0.38 (deja de superar a la escopeta)
    dmg: 1.8,     // Nerfeado: 2.2 → 1.8
    auto: false,
    range: 1.45,
    ammo: -1,
    maxAmmo: -1,
    icon: '🗡️'
  },
  pistol: {
    name: 'PISTOLA',
    cd: 0.22,
    dmg: 1.4,     // Ligeramente aumentado: 1.25 → 1.4
    auto: false,
    range: 18,
    ammo: 18,
    maxAmmo: 48,
    icon: '🔫'
  },
  shotgun: {
    name: 'ESCOPETA',
    cd: 0.65,
    dmg: 3.4,
    auto: false,
    range: 10,
    ammo: 6,
    maxAmmo: 24,
    icon: '💥'
  },
  smg: {
    name: 'SUBFUSIL',
    cd: 0.11,
    dmg: 0.6,
    auto: true,
    range: 15,
    ammo: 45,
    maxAmmo: 120,
    icon: '⚡'
  },
  defib: {
    name: 'DESFIBRILADOR',
    cd: 0.48,
    dmg: 2.8,
    auto: false,
    range: 4.5,
    ammo: 6,
    maxAmmo: 18,
    icon: '⚡'
  }
};
