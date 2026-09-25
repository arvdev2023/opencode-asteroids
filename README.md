# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `C`       | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up "Velocidad": al destruir asteroides puede soltarse un ítem; el rayo cian duplica la propulsión de la nave durante 5 segundos
- Power-up "Triple Disparo": el ítem magenta hace que la nave dispare 3 balas paralelas en línea recta durante 5 segundos
- Power-up "Escudo": el ítem verde crea un anillo verde alrededor de la nave durante 6 segundos que desvía los asteroides en vez de destruirte (cada impacto absorbido consume 1,5 s del escudo)
- Los ítems sueltados son 1/3 para cada tipo
- Skins de la nave: la tecla `C` cicla entre 5 siluetas con distinto color y forma; la preferencia se guarda en `localStorage`
- Estrella fugaz: cada 8-16 s aparece un asteroide dorado muy veloz que se desvanece a los 7 s; destruirla antes da 250 puntos extra
