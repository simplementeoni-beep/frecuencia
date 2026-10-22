# 🎙️ FRECUENCIA — Guía de Preguntas y Respuestas para la Feria
### Preparación para Exposición Oral · Feria Escolar de Bachillerato

> Estudia esto como si fuera un examen. Cada pregunta está basada en algo que **realmente existe en tu código**.

---

## 🧭 ¿Cómo usar este documento?

1. **Lee la pregunta** en voz alta como si el jurado te la dijera
2. **Cierra el documento** e intenta responder de memoria
3. **Verifica** que hayas cubierto los puntos clave en negritas
4. Practica hasta que la respuesta salga natural, sin leer

---

# 🔷 BLOQUE 1 — EL PROYECTO (Qué es y por qué)

---

### P: ¿Qué es FRECUENCIA y cuál es su propuesta de valor?

**R:** FRECUENCIA es un videojuego de terror en primera persona que yo construí desde cero usando **HTML5 Canvas, JavaScript puro y Web Audio API** — sin ningún motor de videojuegos externo. La propuesta innovadora es que el juego tiene un **motor de ritmo musical integrado**: cuando disparas exactamente al compás de la música (lo que se llama *On-Beat*), el juego te recompensa con daño multiplicado hasta 4 veces. Si disparas a destiempo, pierdes el combo y haces daño mínimo. Eso convierte la sincronización rítmica en la mecánica central del combate.

---

### P: ¿Por qué elegiste hacer un videojuego para la feria?

**R:** Porque un videojuego combina casi todas las áreas de conocimiento que se evalúan: **matemáticas** para el motor 3D, **física** para el audio y las colisiones, **programación** para la lógica del juego, **diseño narrativo** para la historia, y **diseño gráfico** para los sprites y la interfaz. Es el proyecto más complejo que pude presentar desde cero.

---

### P: ¿Cuántos archivos tiene el proyecto y cómo están organizados?

**R:** Tiene una estructura modular: `js/core/` para constantes y configuración, `js/render/` para lo visual, `js/audio/` para el motor de sonido, `js/entities/` para los personajes y enemigos, `js/world/` para los mapas y niveles, y `js/ui/` para controles e interfaz. El archivo principal es **`main.js`** con la clase `Game`. El portal web es `index.html` y el demo táctil es `demo.html`.

---

# 🔷 BLOQUE 2 — MATEMÁTICAS Y MOTOR 3D

---

### P: ¿Cómo funciona el efecto 3D si el juego está hecho en 2D?

**R:** Uso una técnica llamada **Raycasting**, la misma que usaban juegos como Wolfenstein 3D y DOOM. El mapa es una cuadrícula plana 2D. Desde la posición del jugador, el programa **lanza rayos invisibles** — uno por cada columna de píxeles de la pantalla. Cuando un rayo choca con una pared, calcula qué tan lejos está. Si está lejos, la pared se dibuja pequeña; si está cerca, se dibuja grande. Eso crea la ilusión de perspectiva 3D sin modelos 3D reales.

---

### P: ¿Qué significa el algoritmo DDA que aparece en tu README?

**R:** DDA significa **Digital Differential Analyzer**. Es el algoritmo que mueve cada rayo por la cuadrícula del mapa de forma eficiente. En lugar de probar miles de puntos, el DDA calcula exactamente cuánto debe avanzar el rayo para llegar al siguiente borde de la cuadrícula — horizontal o vertical — y salta directamente a ese borde. Esto hace el raycasting **muy rápido** porque nunca revisa bloques innecesarios. En mi código está en `Raycaster.js`, con las variables `sdx`, `sdy`, `ddx2` y `ddy2`.

---

### P: ¿Cómo sabes a qué altura dibujar cada pared?

**R:** Con una fórmula de perspectiva: la **altura de la pared en pantalla es inversamente proporcional a la distancia del rayo**. Si `pd` es la distancia perpendicular a la pared, entonces la altura en píxeles es `H / pd`, donde `H` es la altura de la pantalla. Si la pared está a 1 unidad, ocupa la pantalla completa. Si está a 10 unidades, se ve 10 veces más pequeña. Esa relación inversa produce la perspectiva correcta.

---

### P: ¿Qué es el Z-Buffer y para qué lo usas?

**R:** El **Z-Buffer** es un array de números — uno por cada columna de píxeles — donde guardo la distancia de la pared que impactó el rayo en esa columna. Lo uso para resolver el problema de oclusiones: cuando quiero dibujar un enemigo, comparo su distancia con el valor del Z-Buffer en esa columna. Si hay una pared más cercana, el enemigo no se dibuja. En mi código es `this.zbuf`, de tipo `Float32Array(W)`, que se actualiza en el bucle de paredes y se consulta al proyectar sprites.

---

### P: ¿Cómo calculas la posición de los enemigos en pantalla?

**R:** Uso una **proyección de cámara**. Dado el vector de dirección `(dirX, dirY)` y el plano de cámara `(plX, plY)`, calculo para cada enemigo `tX` (posición horizontal en pantalla) y `tY` (distancia perpendicular a la cámara). La columna es `W/2 * (1 + tX/tY)` y el tamaño del sprite es `H/tY`. Para esto necesito invertir la matriz 2x2 del sistema de cámara — esa inversa es la variable `inv` que aparece en `Raycaster.js` al inicio de la proyección de sprites.

---

# 🔷 BLOQUE 3 — EL MOTOR DE RITMO

---

### P: ¿Cómo detecta el juego si disparé al compás?

**R:** Tengo una clase llamada **`RhythmEngine`** en `js/audio/RhythmEngine.js`. Conoce el tempo en **BPM** y usa el reloj de alta precisión del `AudioContext` para calcular exactamente en qué posición dentro del compás estamos. Cuando el jugador dispara, el método `isOnBeat()` calcula la fracción de beat actual. Si está dentro de una **ventana de tolerancia** alrededor del pulso, devuelve `true`. Es como comparar el tiempo de disparo con el "latido" del tempo musical.

---

### P: ¿Qué pasa exactamente cuando disparo On-Beat o Off-Beat?

**R:** En el método `fire()` de `main.js` reviso el resultado de `isOnBeat()`. Si es **On-Beat**: el combo sube un nivel (máximo x4), el daño se multiplica por `1 + 0.5 * (combo - 1)` — con combo x4 hago 2.5 veces el daño base —, el enemigo queda aturdido, y hay un destello visual. Si es **Off-Beat**: el combo baja, el daño es el base sin multiplicadores, y no hay aturdimiento.

---

### P: ¿El ritmo afecta a los enemigos también?

**R:** Sí. Tengo el método **`onBeat()`** en `Game` que se ejecuta cada vez que el metrónomo marca un pulso. Ahí llamo a la IA de cada enemigo vivo con `EnemyAI.onBeat()`. Los enemigos **solo se mueven y atacan sincronizados con el beat**. Eso hace que el combate se sienta como una coreografía y obliga al jugador a anticipar los movimientos según el tempo.

---

### P: ¿Por qué usaste Web Audio API en lugar de archivos MP3?

**R:** Porque permite generar sonido **en tiempo real matemáticamente** con osciladores y filtros, sin archivos de audio pesados. Además, el `AudioContext` tiene un reloj de **altísima precisión** — mucho más exacto que `Date.now()` —, crítico para el motor de ritmo: necesito saber al milisegundo cuándo cae el beat.

---

# 🔷 BLOQUE 4 — INTELIGENCIA ARTIFICIAL

---

### P: ¿Cómo programaste la inteligencia de los enemigos?

**R:** Cada tipo de enemigo tiene su propio archivo de IA en `js/entities/enemies/`: `ZombieAI.js`, `DogAI.js`, `CystAI.js`, `SurgeonAI.js`, `OrderlyAI.js` y `BossAI.js`. Todos comparten una base en `EnemyAI.js`. Los enemigos tienen un campo **`state`** (`'idle'`, `'walk'`, `'attack'`, `'stun'`, `'charge'`). En cada beat, la IA evalúa distancia al jugador, salud, tipo, y decide el siguiente estado y acción.

---

### P: ¿Cuántos tipos de enemigos hay y en qué se diferencian?

**R:** Hay **6 tipos más el jefe**:
- **Zombie:** Básico, camina directo. Débil.
- **Dog:** Muy rápido, hace saltos (`leap`). Peligroso en movimiento.
- **Cyst:** Estático, dispara proyectiles en 8 direcciones al explotar.
- **Orderly:** Táctico, flanquea, alta resistencia y carga.
- **Surgeon:** Dispara proyectiles a distancia en sincronía con el beat.
- **Boss (El Corazón):** Jefe final con HP altísimo y patrones múltiples de ataque.

---

### P: ¿Cómo evitaste que el juego se bloqueara si los enemigos se atascan?

**R:** Tengo un sistema anti-softlock en `main.js`. Con `softlockCheckDelay` (25 segundos) y `softlockForceKillDelay` (35 segundos), si el jugador no avanza y los enemigos están atasscados más allá de `maxStuckDistance`, el sistema los elimina forzosamente para que la partida continúe. Estos valores están centralizados en `Config.js`.

---

# 🔷 BLOQUE 5 — DISEÑO DE NIVELES

---

### P: ¿Cuántos niveles tiene el juego y cómo son?

**R:** Hay **5 niveles** (del 0 al 4):
- **0 — Despertar:** Tutorial. Puerta real que se abre al matar todos los enemigos.
- **1 — La Morgue:** 3 oleadas de zombis y camilleros. Das la pistola.
- **2 — La Perrera:** 3 oleadas con perros experimentales que flanquean. Escopeta.
- **3 — El Quirófano:** **Temporizador de sobrecarga** del generador (120/90/60 segundos según dificultad). Si se agota, el generador explota y mueres.
- **4 — El Corazón:** Jefe final biomecánico en una gran cámara central.

---

### P: ¿Los mapas son hechos a mano o generados automáticamente?

**R:** Los diseñé yo manualmente como **matrices de números en `LevelData.js`**, donde 0 es espacio vacío y positivos son tipos de pared. La **construcción técnica** la hace `MapBuilder.js` con funciones como `buildL0()`, `buildL1()`, etc. Eso separa el diseño del nivel de la implementación.

---

# 🔷 BLOQUE 6 — PORTAL WEB Y DESPLIEGUE

---

### P: ¿Qué es el `index.html` y para qué sirve en la feria?

**R:** Es el **portal oficial del proyecto para la feria**. Permite que los visitantes: accedan al demo desde su celular, lean la historia completa en 5 capítulos, conozcan los enemigos, y **califiquen el proyecto en Google Forms** directamente desde el portal o escaneando un código QR con el celular, sin necesitar papel.

---

### P: ¿Dónde está publicado el juego?

**R:** El código está en **GitHub** en `simplementeoni-beep/frecuencia`. El despliegue es automático con **Netlify** mediante `netlify.toml`: cada push a `main` despliega la nueva versión automáticamente. Sin servidor propio, costo cero.

---

### P: ¿Por qué hiciste un `demo.html` separado?

**R:** Porque el juego completo requiere teclado y mouse. Para la feria necesitaba que los visitantes con celular pudieran probarlo al instante. El `demo.html` tiene un **D-Pad virtual táctil**, botón de disparo grande para el pulgar, y vista adaptada a modo vertical. Técnicamente sigue usando el Z-Buffer y el raycasting, solo cambian los controles.

---

# 🔷 BLOQUE 7 — HISTORIA Y NARRATIVA

---

### P: ¿De qué trata la historia del juego?

**R:** El protagonista es el **Dr. Ian Vane**, psiquiatra en el Hospital San Cayetano. Sus colegas convirtieron su investigación de terapias sonoras en un arma de control mental (el **Proyecto F**). Al intentar denunciarlo, lo encerraron como paciente *EXP-742* y empezaron a borrarle la memoria con descargas sónicas. La máquina central (**El Corazón**) se sobrecargó y enloqueció a todos. Vane despierta amnésico solo con un dibujo de su hija **Fe** en el bolsillo y debe escapar destruyendo la máquina.

---

### P: ¿Por qué se llama FRECUENCIA?

**R:** Doble significado: la **frecuencia sonora** del Proyecto F que enloquece a los pacientes, y la **frecuencia rítmica** que el jugador debe mantener para sobrevivir. El nombre conecta la narrativa con la mecánica del juego.

---

# 🔷 BLOQUE 8 — PREGUNTAS TRAMPA

---

### P: ¿Usaste algún motor de juegos, librería o código de otro?

**R:** **No.** Todo lo codifiqué yo desde cero. No usé Unity, Godot, Three.js, Phaser ni ninguna librería de juegos. Lo único externo son las fuentes de **Google Fonts** y la **Web Audio API** que es parte nativa del navegador, no una librería. El raycasting, la IA, el motor de ritmo, el sistema de audio y el portal — todo fue implementado por mí.

---

### P: ¿Qué parte fue la más difícil de programar?

**R:** El **motor de raycasting con Z-Buffer para la proyección de sprites**. El raycasting de paredes es directo, pero para que los enemigos se vean correctamente detrás y delante de paredes según su posición real, tuve que implementar el Z-Buffer y la transformación inversa de la matriz de cámara para proyectar cada sprite. El cálculo requiere invertir una matriz 2x2 y comparar distancias — eso tardó varias iteraciones hasta funcionar.

---

### P: ¿Tu juego corre en todos los navegadores?

**R:** Sí, en todos los modernos. Usa **ES Modules nativos** que Chrome, Firefox, Safari y Edge ya soportan. El único requisito es servirlo desde HTTP — con `file://` los módulos son bloqueados por política CORS. El README documenta `npx serve .` o `python3 -m http.server` para uso local.

---

### P: ¿Qué mejorarías si tuvieras más tiempo?

**R:** Tres cosas concretas: 1) **Texturas importadas reales** para paredes más detalladas. 2) **Modo multijugador local** con WebSockets. 3) **Un editor visual de niveles** — ahora diseño los mapas como matrices de números en código, lo cual funciona pero es lento para niveles complejos.

---

# 📊 Datos que impresionan al jurado

| Dato | Valor |
|---|---|
| Líneas de código JavaScript | ~3,500+ líneas |
| Módulos `.js` del motor | 18 archivos |
| Tipos de enemigos | 6 + jefe final |
| Niveles jugables | 5 |
| Tecnologías web | HTML5 Canvas, Web Audio API, ES Modules, CSS |
| Dependencias externas | **0** (cero frameworks, cero librerías) |
| Plataformas | PC (teclado/mouse) + Celular táctil |
| Algoritmo gráfico central | DDA Raycasting + Z-Buffer |
| Costo de hosting | $0 (Netlify gratuito) |

---

> 💡 **Tip final:** Si el jurado te hace una pregunta que no sabes, di: *"Esa parte específica no la tengo de memoria, pero puedo mostrarte el código exacto si tienes un momento."* Eso demuestra honestidad y confianza en tu propio trabajo.
