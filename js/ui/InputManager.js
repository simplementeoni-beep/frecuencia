/**
 * Gestor unificado de entrada (Teclado, Ratón y Gamepad)
 * Soporta: Teclado, Mouse Look (pointer lock), Gamepad (ambos joysticks)
 */

const BLOCK_KEYS = {
  Space: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
  Digit1: 1, Digit2: 1, Digit3: 1, Digit4: 1, Digit5: 1
};

export class InputManager {
  constructor(stageElement) {
    this.stage = stageElement;
    this.keys = {};
    this.firePressed = false;
    this.mouseDown = false;
    this.advancePressed = false;
    this.skipPressed = false;
    this.selectedWeaponKey = null;
    this.wheelCycle = 0;
    this.offsetDelta = 0;

    this.padPrevFire = false;
    this.padPrevAny = false;
    this.padPrevL = false;
    this.padPrevR = false;

    // ── Mouse Look (pointer lock) ──
    this.mouseDeltaX = 0;       // Acumulador de movimiento horizontal del ratón
    this.pointerLocked = false;  // Estado del pointer lock
    this.mouseSensitivity = 0.003; // Sensibilidad del ratón para girar la cámara

    this.setupListeners();
  }

  setupListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable)) return;
      if (BLOCK_KEYS[e.code]) e.preventDefault();
      if (e.repeat) {
        this.keys[e.code] = true;
        return;
      }
      this.keys[e.code] = true;

      if (e.code === 'Comma') this.offsetDelta -= 0.015;
      if (e.code === 'Period') this.offsetDelta += 0.015;
      if (e.code === 'KeyF' || e.code === 'Enter') this.advancePressed = true;
      if (e.code === 'KeyN') this.skipPressed = true;

      if (e.code === 'Digit1') this.selectedWeaponKey = 'scalpel';
      if (e.code === 'Digit2') this.selectedWeaponKey = 'pistol';
      if (e.code === 'Digit3') this.selectedWeaponKey = 'shotgun';
      if (e.code === 'Digit4') this.selectedWeaponKey = 'smg';
      if (e.code === 'Digit5') this.selectedWeaponKey = 'defib';

      if (e.code === 'Space' || e.code === 'ControlLeft' || e.code === 'KeyZ') {
        this.firePressed = true;
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });

    if (this.stage) {
      // ── Pointer Lock: solo se activa al hacer clic en el canvas ──
      this.stage.addEventListener('mousedown', e => {
        this.stage.focus();

        // Solo activar pointer lock si se hizo clic en el canvas directamente
        const clickedCanvas = (e.target && e.target.tagName === 'CANVAS');

        if (!this.pointerLocked && clickedCanvas) {
          // Clic en el canvas sin pointer lock: activar mouse look
          this.stage.requestPointerLock?.();
        } else if (this.pointerLocked) {
          // Ya en pointer lock: clic = disparar
          this.mouseDown = true;
          this.firePressed = true;
        }
        // Si se hizo clic en un botón/overlay, no hacer nada especial
      });

      this.stage.addEventListener('wheel', e => {
        this.wheelCycle = e.deltaY > 0 ? 1 : -1;
        e.preventDefault();
      }, { passive: false });

      // ── Escuchar movimiento del ratón para mouse look ──
      document.addEventListener('mousemove', e => {
        if (this.pointerLocked) {
          this.mouseDeltaX += e.movementX || 0;
        }
      });

      // ── Detectar cambios en pointer lock ──
      document.addEventListener('pointerlockchange', () => {
        this.pointerLocked = (document.pointerLockElement === this.stage);
        if (!this.pointerLocked) {
          this.mouseDeltaX = 0;
          this.mouseDown = false;
        }
      });
    }

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  getPad() {
    let pads;
    try {
      pads = navigator.getGamepads ? navigator.getGamepads() : [];
    } catch (e) {
      pads = [];
    }
    let gp = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i] && pads[i].connected) {
        gp = pads[i];
        break;
      }
    }
    const r = { mv: 0, st: 0, turn: 0, fire: false, any: false, cycleL: false, cycleR: false };
    if (!gp) return r;

    // Aumentamos el deadzone a 0.25 para evitar "drift" (movimiento fantasma) en mandos genéricos
    const dz = v => Math.abs(v) < 0.25 ? 0 : v;
    const b = n => gp.buttons[n] && gp.buttons[n].pressed;

    // Joystick izquierdo: movimiento (Adelante/Atrás, Izquierda/Derecha)
    r.mv = -dz(gp.axes[1] || 0);
    r.st = dz(gp.axes[0] || 0);

    // Joystick derecho: cámara (Girar)
    // En mandos estándar, Right Stick X es axes[2].
    // Solo leemos este eje. Si leemos axes[3] podríamos estar leyendo un gatillo y causar giros constantes.
    r.turn = dz(gp.axes[2] || 0);

    r.fire = !!(b(7) || b(0)); // Solo RT o Botón A
    r.cycleL = !!b(4); // LB
    r.cycleR = !!b(5); // RB

    for (let i = 0; i < gp.buttons.length; i++) {
      if (gp.buttons[i] && gp.buttons[i].pressed) {
        r.any = true;
        break;
      }
    }
    return r;
  }

  poll(dt) {
    const pad = this.getPad();

    let mv = 0, st = 0, turn = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) mv += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) mv -= 1;
    if (this.keys.KeyA) st -= 1;
    if (this.keys.KeyD) st += 1;
    if (this.keys.ArrowLeft || this.keys.KeyQ) turn -= 1;
    if (this.keys.ArrowRight || this.keys.KeyE) turn += 1;

    // ── Mouse Look: convertir delta del ratón en giro de cámara ──
    if (this.pointerLocked && this.mouseDeltaX !== 0) {
      turn += this.mouseDeltaX * this.mouseSensitivity / (dt || 1/60);
      // Normalizar para que no se acumule demasiado
      turn = Math.max(-3, Math.min(3, turn));
      this.mouseDeltaX = 0;
    }

    mv += pad.mv;
    st += pad.st;
    turn += pad.turn;

    mv = Math.max(-1, Math.min(1, mv));
    st = Math.max(-1, Math.min(1, st));
    // No clampar turn a [-1,1] para permitir giros más rápidos con ratón
    turn = Math.max(-3, Math.min(3, turn));

    let cycle = this.wheelCycle;
    this.wheelCycle = 0;

    if (pad.cycleL && !this.padPrevL) cycle = -1;
    this.padPrevL = pad.cycleL;

    if (pad.cycleR && !this.padPrevR) cycle = 1;
    this.padPrevR = pad.cycleR;

    if (pad.fire && !this.padPrevFire) this.firePressed = true;
    this.padPrevFire = pad.fire;

    let advanceNow = this.advancePressed;
    if (pad.any && !this.padPrevAny) advanceNow = true;
    this.padPrevAny = pad.any;
    this.advancePressed = false;

    const skipNow = this.skipPressed;
    this.skipPressed = false;

    const fireNow = this.firePressed;
    this.firePressed = false;

    const fireHeld = this.keys.Space || this.keys.KeyZ || this.keys.ControlLeft || this.mouseDown || pad.fire;

    const weaponKey = this.selectedWeaponKey;
    this.selectedWeaponKey = null;

    const offsetDelta = this.offsetDelta;
    this.offsetDelta = 0;

    return {
      mv, st, turn,
      firePressed: fireNow,
      fireHeld: fireHeld,
      cycle,
      weaponKey,
      advance: advanceNow,
      skip: skipNow,
      offsetDelta
    };
  }
}
