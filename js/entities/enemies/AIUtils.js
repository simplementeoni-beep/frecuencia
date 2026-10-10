import { canMove, los } from '../../core/MathUtils.js';

export class AIUtils {
  static norm(dx, dy) {
    const d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  }

  static move(e, nx, ny, map) {
    const r = e.hw * 0.8;
    if (canMove(map, nx, ny, r)) {
      e.x = nx; e.y = ny;
    } else if (canMove(map, nx, e.y, r)) {
      e.x = nx;
    } else if (canMove(map, e.x, ny, r)) {
      e.y = ny;
    }
  }

  static dist(e, player) {
    return Math.hypot(player.x - e.x, player.y - e.y);
  }

  static canSee(e, player, map) {
    return los(map, e.x, e.y, player.x, player.y);
  }

  static perp(ux, uy, side) {
    return { x: -uy * side, y: ux * side };
  }
}
