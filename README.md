# 🎵 FRECUENCIA — Terror Rítmico en Primera Persona

> *Sigue el pulso en la oscuridad, cambia de arma al compás y sobrevive al Proyecto F.*

Un videojuego de terror en primera persona construido con **HTML5 Canvas puro**, sin frameworks ni dependencias externas. El gameplay gira en torno a un motor de ritmo: atacar al ritmo del beat multiplica el daño y el combo.

---

## 🕹️ Demo

Abre `index.html` directamente en tu navegador (Chrome/Firefox recomendado) — no requiere servidor.

> Para módulos ES, si el navegador bloquea `file://`, sirve con:
> ```bash
> npx serve .
> ```

---

## ✨ Características

| Sistema | Descripción |
|---|---|
| 🎮 **Raycasting 3D** | Motor de renderizado tipo Wolfenstein/DOOM hecho desde cero |
| 🎵 **RhythmEngine** | Beat tracker que premia atacar al compás |
| 👾 **IA de enemigos** | 7 tipos únicos con comportamientos diferenciados |
| 🔫 **Arsenal** | Sistema de armas con cambio al ritmo |
| 🎨 **Efectos visuales** | Post-FX de analog horror, partículas, shake, paletas de color por nivel |
| 🔊 **Audio generativo** | Motor de audio Web Audio API con sonidos ambientales procedurales |
| 🏆 **Leaderboard** | Tabla de puntajes local |
| 🌗 **Dark / Light mode** | Soporte completo con `prefers-color-scheme` |

---

## 👾 Tipos de Enemigos

- **Zombie** — Básico, se mueve hacia el jugador
- **Dog** — Rápido y agresivo
- **Cyst** — Estático, dispara proyectiles al ritmo
- **Orderly** — Táctico, flanquea y cubre
- **Surgeon** — Élite, ataque preciso y defensivo
- **Boss** — Jefe de fase con múltiples patrones de ataque
- **EnemyAI** — Base abstracta de comportamiento compartido

---

## 🗂️ Estructura del Proyecto

```
Frecuencia/
├── index.html              # UI completa + pantallas del juego
├── package.json
└── js/
    ├── main.js             # Orquestador principal + game loop
    ├── core/
    │   ├── Config.js       # Configuración global
    │   ├── Constants.js    # Constantes de pantalla y overlays
    │   └── MathUtils.js    # Colisiones, raycasting helpers
    ├── entities/
    │   ├── Player.js       # Estado y lógica del jugador
    │   ├── Weapons.js      # Definiciones de armas
    │   └── enemies/
    │       ├── AIUtils.js         # Utilidades compartidas de IA
    │       ├── EnemyAI.js         # Clase base de IA
    │       ├── EnemyFactory.js    # Fábrica de enemigos
    │       ├── ZombieAI.js
    │       ├── DogAI.js
    │       ├── CystAI.js
    │       ├── OrderlyAI.js
    │       ├── SurgeonAI.js
    │       └── BossAI.js
    ├── world/
    │   ├── LevelData.js    # Datos de niveles y oleadas
    │   ├── MapBuilder.js   # Generador de mapas procedural
    │   └── Themes.js       # Paletas de color por nivel
    ├── render/
    │   ├── Raycaster.js         # Motor de raycasting DDA
    │   ├── SpriteGenerator.js   # Sprites generados en canvas
    │   ├── ViewRenderer.js      # HUD, armas, crosshair, efectos
    │   ├── PostFX.js            # Analog horror, partículas, glitch
    │   └── WallTextures.js      # Texturas procedurales de paredes
    ├── audio/
    │   ├── AudioEngine.js    # Síntesis de sonidos Web Audio API
    │   ├── RhythmEngine.js   # Beat tracker y multiplier de combo
    │   └── AmbientSounds.js  # Sonidos ambientales procedurales
    └── ui/
        ├── InputManager.js   # Teclado, mouse, touch
        ├── Toast.js          # Notificaciones en pantalla
        └── Leaderboard.js    # Tabla de puntajes
```

---

## 🎮 Controles

| Tecla | Acción |
|---|---|
| `W A S D` | Moverse |
| `Mouse` | Apuntar |
| `Click izquierdo` | Disparar / Atacar |
| `1 2 3` | Cambiar arma |
| `R` | Recargar |
| `Shift` | Correr |
| `Esc` | Pausa |

---

## 🛠️ Tecnologías

- **HTML5 Canvas 2D** — Renderizado principal
- **Web Audio API** — Motor de audio generativo
- **ES Modules nativos** — Sin bundler
- **Vanilla CSS** — Estilos puros, sin frameworks

---

## 🚀 Desarrollo

```bash
# Clonar
git clone https://github.com/simplementeoni-beep/frecuencia.git
cd frecuencia

# Servir localmente
npx serve .
# o
python3 -m http.server 8080
```

Luego abre `http://localhost:8080` en tu navegador.

---

## 📝 Licencia

Distribuido bajo la **Apache License 2.0**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

```
Copyright 2026 ONI (simplementeoni-beep)

Licensed under the Apache License, Version 2.0
```
