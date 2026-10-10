/**
 * Gestión y persistencia segura de la tabla de clasificación
 */
import { formatTime } from '../core/MathUtils.js';

const STORAGE_KEY = 'frecuencia_leaderboard';

export class Leaderboard {
  static getRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  static save(playerName, timeTakenSeconds, shots, status) {
    try {
      const record = {
        name: playerName || 'JUGADOR',
        time: timeTakenSeconds,
        shots: shots,
        status: status
      };
      const lb = this.getRecords();
      lb.push(record);
      lb.sort((a, b) => {
        if (a.status === 'Superado' && b.status !== 'Superado') return -1;
        if (b.status === 'Superado' && a.status !== 'Superado') return 1;
        return a.time - b.time;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lb.slice(0, 10)));
    } catch (e) {
      // Silenciar errores de localStorage bloqueado
    }
  }

  static render(tbodyElement) {
    if (!tbodyElement) return;
    const records = this.getRecords();
    let html = '';
    records.forEach(r => {
      html += `<tr><td>${r.name}</td><td>${formatTime(r.time)}</td><td>${r.shots}</td><td>${r.status}</td></tr>`;
    });
    tbodyElement.innerHTML = html;
  }
}
