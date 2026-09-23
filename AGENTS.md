# AGENTS.md

Clon de Asteroids en canvas HTML5 puro. Sin dependencias, sin bundler, sin package.json.

## Reglas del repo

- **No hay toolchain**: no existen tests, linter ni formatter. No busques scripts npm; la verificación es manual en el navegador.
- **Un solo archivo de lógica**: `game.js`, cargado con `<script src>` (script clásico). No introducir módulos ES: rompe al abrir `index.html` con `file://`.
- **Español**: mantener comentarios y cadenas de UI en español, como el código y README existentes.
- **README desactualizado**: promete power-ups y una "estrella fugaz" que no están implementados en el código. El código es la fuente de verdad.

## Ejecutar y verificar

- Correr: abrir `index.html` directamente, o `npx serve .` → http://localhost:3000.
- Verificar cambios con una partida manual: disparar, perder una vida, game over → reiniciar con Espacio, avanzar de nivel.

## Detalles no obvios

- Canvas fijo: `W`/`H` en `game.js` deben coincidir con `width`/`height` del `<canvas>` en `index.html`.
- Input: `keys[code]` para teclas mantenidas; `pressed(code)` detecta flanco y consume el flag — llamarlo una sola vez por frame.
- Si añades estado global, reinícialo en `initGame()` (y en `nextLevel()` si aplica); los estados del juego son `'playing' | 'dead' | 'gameover'`.
