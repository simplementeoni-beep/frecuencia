/**
 * Estado y control del jugador
 */
import { WEAPONS } from './Weapons.js';

export class Player {
  constructor() {
    this.x = 2.5;
    this.y = 4.5;
    this.a = 0;
    this.bob = 0;
    this.moving = false;
    this.weapon = 'scalpel';
    this.inventory = ['scalpel'];
    this.ammo = { pistol: 24, shotgun: 10, smg: 60, defib: 9 };
    this.maxAmmo = { pistol: 48, shotgun: 24, smg: 120, defib: 18 };
  }

  reset(curLevel = 0, difficulty = 1) {
    const baseWeapons = ['scalpel'];
    if (curLevel >= 1) baseWeapons.push('pistol');
    if (curLevel >= 2) baseWeapons.push('shotgun');
    if (curLevel >= 3) baseWeapons.push('smg');
    if (curLevel >= 4) baseWeapons.push('defib');
    this.inventory = baseWeapons;
    this.weapon = this.inventory[this.inventory.length - 1];

    if (difficulty === 0) {
      // Fácil (Feria): más munición inicial y mayor reserva máxima
      this.ammo = { pistol: 36, shotgun: 16, smg: 90, defib: 15 };
      this.maxAmmo = { pistol: 72, shotgun: 32, smg: 180, defib: 30 };
    } else if (difficulty === 2) {
      // Difícil (Survival): recursos estrictos
      this.ammo = { pistol: 14, shotgun: 6, smg: 35, defib: 5 };
      this.maxAmmo = { pistol: 30, shotgun: 14, smg: 70, defib: 10 };
    } else {
      // Normal: balance estándar
      this.ammo = { pistol: 24, shotgun: 10, smg: 60, defib: 9 };
      this.maxAmmo = { pistol: 48, shotgun: 24, smg: 120, defib: 18 };
    }

    this.bob = 0;
    this.moving = false;
  }

  selectWeapon(w, onSelect = null) {
    if (this.inventory.indexOf(w) !== -1 && this.weapon !== w) {
      this.weapon = w;
      if (onSelect) onSelect(WEAPONS[w]);
      return true;
    }
    return false;
  }

  cycleWeapon(dir, onSelect = null) {
    let idx = this.inventory.indexOf(this.weapon);
    if (idx === -1) idx = 0;
    const next = (idx + dir + this.inventory.length) % this.inventory.length;
    return this.selectWeapon(this.inventory[next], onSelect);
  }

  addWeapon(w) {
    if (this.inventory.indexOf(w) === -1) {
      this.inventory.push(w);
    }
  }

  addAmmo(type, amount) {
    if (this.ammo[type] !== undefined) {
      this.ammo[type] = Math.min(this.maxAmmo[type], this.ammo[type] + amount);
    }
  }
}
