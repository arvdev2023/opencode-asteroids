'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.color  = '#fff';
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ───────────────────────────────────────────────────────────
const STAR_TTL    = 7;    // segundos en pantalla
const STAR_SPEED  = 230;  // px/s, mucho más rápida que cualquier asteroide
const STAR_POINTS = 250;  // bonus por destruirla
const STAR_RADIUS = 15;

class ShootingStar extends Asteroid {
  constructor() {
    // Nace en un borde aleatorio, apuntando hacia el centro con dispersión
    const edge = randInt(0, 3);
    let x, y;
    if (edge === 0)      { x = 0;          y = rand(0, H); }
    else if (edge === 1) { x = W;          y = rand(0, H); }
    else if (edge === 2) { x = rand(0, W); y = 0; }
    else                 { x = rand(0, W); y = H; }
    super(x, y, 1);

    const angle = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.7, 0.7);
    this.vx = Math.cos(angle) * STAR_SPEED;
    this.vy = Math.sin(angle) * STAR_SPEED;

    this.ttl      = STAR_TTL;
    this.radius   = STAR_RADIUS;
    this.points   = STAR_POINTS;
    this.color    = '#ffd700';
    this.rotSpeed = rand(2, 4);

    // Silueta de estrella de 5 puntas en vez de polígono irregular
    const n = 10;
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.45;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      explode(this.x, this.y, 5);
    }
  }

  split() { return []; }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    // Estela dorada tras la trayectoria
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 0.18, this.y - this.vy * 0.18);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore();

    super.draw();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKINS = [
  { name: 'CLÁSICA', color: '#fff',    verts: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'DELTA',   color: '#0ff',    verts: [[22,0],[-8,-4],[-14,-9],[-11,0],[-14,9],[-8,4]] },
  { name: 'HALCÓN',  color: '#f0f',    verts: [[18,0],[-10,-12],[-6,0],[-10,12]] },
  { name: 'TITÁN',   color: '#0f0',    verts: [[14,0],[-2,-7],[-10,-10],[-8,0],[-10,10],[-2,7]] },
  { name: 'AGUJA',   color: '#ffd700', verts: [[23,0],[-9,-3],[-14,-6],[-11,0],[-14,6],[-9,3]] },
];

// La llama del propulsor se ancla al punto más trasero de cada silueta
for (const skin of SKINS)
  skin.flameX = Math.min(...skin.verts.map(v => v[0])) + 3;

// Skin elegida (preferencia del jugador: NO se reinicia en initGame)
let skinIndex = 0;

// Persistencia entre sesiones; try/catch por si file:// bloquea el almacenamiento
try {
  const saved = parseInt(localStorage.getItem('asteroids-skin'), 10);
  if (!isNaN(saved) && saved >= 0 && saved < SKINS.length) skinIndex = saved;
} catch (e) { /* almacenamiento no disponible */ }

function saveSkin() {
  try { localStorage.setItem('asteroids-skin', String(skinIndex)); } catch (e) {}
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.shieldTime    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shieldTime    > 0) this.shieldTime    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedBoost > 0 ? 520 : 260;  // px/s² (duplica con Velocidad)
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    // Triple Disparo: 3 balas paralelas, mismo ángulo (línea recta, sin dispersión)
    if (this.tripleShot > 0) {
      const GAP = 6;
      const px = -Math.sin(this.angle);
      const py =  Math.cos(this.angle);
      return [-GAP, 0, GAP].map(o => new Bullet(ox + px * o, oy + py * o, this.angle));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Nave coloreada según el efecto activo (Velocidad: cian, Triple: magenta); sin efecto, color de la skin
    ctx.strokeStyle = this.speedBoost > 0 ? '#0ff' : this.tripleShot > 0 ? '#f0f' : skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta de la skin elegida
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor, anclada a la parte trasera de la silueta
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -4);
      ctx.lineTo(skin.flameX - rand(6, 14), 0);
      ctx.lineTo(skin.flameX,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    // Anillo de escudo (pulsa suave y parpadea al terminar, como los ítems)
    if (this.shieldTime > 0 &&
        !(this.shieldTime < 2 && Math.floor(this.shieldTime * 8) % 2 === 0)) {
      const pulse = 1 + Math.sin(this.shieldTime * 12) * 0.06;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, SHIELD_RADIUS * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255') {
    this.color = color;   // componentes "r,g,b" para componer rgba()
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ("Velocidad", "Triple Disparo" y "Escudo") ──────────────────────
const DROP_CHANCE     = 0.12;  // probabilidad de que un asteroide destruido suelte un ítem
const ITEM_TTL        = 10;    // segundos que el ítem flota en pantalla
const BOOST_TIME      = 5;     // duración de "Velocidad" al recogerlo
const TRIPLE_TIME     = 5;     // duración de "Triple Disparo" al recogerlo
const SHIELD_TIME     = 6;     // duración del efecto de Escudo al recogerlo
const SHIELD_HIT_COST = 1.5;   // segundos de escudo que consume cada impacto absorbido
const SHIELD_RADIUS   = 18;    // radio visual del anillo de escudo

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.type = type;   // 'speed' | 'triple' | 'shield'
    this.x      = x;
    this.y      = y;
    this.radius = 10;
    this.ttl    = ITEM_TTL;
    this.dead   = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 45);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por desaparecer
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    if (this.type === 'triple') {
      // Tres balas en fila (magenta)
      ctx.strokeStyle = '#f0f';
      for (const ox of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.moveTo(ox, -7);
        ctx.lineTo(ox,  7);
        ctx.stroke();
      }
    } else if (this.type === 'shield') {
      // Insignia de escudo (verde)
      ctx.strokeStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo( 0, -10);
      ctx.lineTo( 8,  -6);
      ctx.lineTo( 8,   3);
      ctx.lineTo( 0,  10);
      ctx.lineTo(-8,   3);
      ctx.lineTo(-8,  -6);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo (cian)
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo( 3, -10);
      ctx.lineTo(-5,   2);
      ctx.lineTo(-1,   2);
      ctx.lineTo(-3,  10);
      ctx.lineTo( 5,  -2);
      ctx.lineTo( 1,  -2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;  // cuenta atrás para la siguiente estrella fugaz
let skinLabelTimer = 0;  // segundos restantes del rótulo "SKIN: ..." del HUD

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(8, 16);
  skinLabelTimer = 0;
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  starTimer = rand(8, 16);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// El escudo rebota un asteroide: refleja su velocidad, lo aparta y cuesta tiempo de escudo
function deflectAsteroid(a) {
  const nx = a.x - ship.x;
  const ny = a.y - ship.y;
  const len = Math.hypot(nx, ny) || 1;
  const ux = nx / len;
  const uy = ny / len;

  // Reflejar la componente de velocidad que apunta hacia la nave
  const dot = a.vx * ux + a.vy * uy;
  if (dot < 0) {
    a.vx -= 2 * dot * ux;
    a.vy -= 2 * dot * uy;
  }
  a.vx += ux * 60;   // empujón extra hacia fuera
  a.vy += uy * 60;

  // Separar de la nave para no re-colisionar en el siguiente frame
  const gap = ship.radius + a.radius * 0.82 + 4;
  a.x = ship.x + ux * gap;
  a.y = ship.y + uy * gap;

  ship.shieldTime = Math.max(ship.shieldTime - SHIELD_HIT_COST, 0);
  explode((ship.x + a.x) / 2, (ship.y + a.y) / 2, 5, '0,255,0');
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin con C (disponible en cualquier estado)
  if (skinLabelTimer > 0) skinLabelTimer -= dt;
  if (pressed('KeyC')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    skinLabelTimer = 1.5;
    saveSkin();
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerups.forEach(p => p.update(dt));
    powerups  = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a instanceof ShootingStar ? 12 : a.size * 5);
        newAsteroids.push(...a.split());
        if (!(a instanceof ShootingStar) && Math.random() < DROP_CHANCE)
          // Tres tipos de ítem con la misma probabilidad (1/3 cada uno)
          powerups.push(new PowerUp(a.x, a.y, ['speed', 'triple', 'shield'][Math.floor(Math.random() * 3)]));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide (con escudo activo, el impacto se desvía en vez de matar)
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldTime > 0) {
          deflectAsteroid(a);
        } else {
          killShip();
          break;
        }
      }
    }
  }

  // Nave vs power-up (recoger reinicia el timer del efecto correspondiente)
  if (!ship.dead) {
    for (const p of powerups) {
      if (dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        if      (p.type === 'triple') ship.tripleShot = TRIPLE_TIME;
        else if (p.type === 'shield') ship.shieldTime = SHIELD_TIME;
        else                          ship.speedBoost = BOOST_TIME;
      }
    }
  }

  // Aparición periódica de la estrella fugaz (máx. una viva)
  starTimer -= dt;
  if (starTimer <= 0) {
    if (!asteroids.some(a => a instanceof ShootingStar))
      asteroids.push(new ShootingStar());
    starTimer = rand(8, 16);
  }

  // Nivel completado (la estrella fugaz no bloquea el avance)
  if (asteroids.every(a => a instanceof ShootingStar)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * 0.45, skin.verts[0][1] * 0.45);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * 0.45, skin.verts[i][1] * 0.45);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Rótulo transitorio al cambiar de skin con C
  if (skinLabelTimer > 0) {
    ctx.fillStyle = SKINS[skinIndex].color;
    ctx.font      = '13px monospace';
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, W / 2, 46);
  }

  drawEffectBars();
}

function drawEffectBar(label, frac, color, border, rectY) {
  const w = 120;
  ctx.fillStyle   = color;
  ctx.font        = '11px monospace';
  ctx.textAlign   = 'left';
  ctx.fillText(label, 14, rectY - 8);
  ctx.strokeStyle = border;
  ctx.lineWidth   = 1;
  ctx.strokeRect(14, rectY, w, 7);
  ctx.fillRect(15, rectY + 1, (w - 2) * frac, 5);
}

function drawEffectBars() {
  if (state !== 'playing') return;
  const bars = [];
  if (ship.speedBoost > 0)
    bars.push({ label: 'VELOCIDAD', frac: Math.max(ship.speedBoost / BOOST_TIME, 0),
                color: '#0ff', border: 'rgba(0,255,255,0.5)' });
  if (ship.tripleShot > 0)
    bars.push({ label: 'TRIPLE',    frac: Math.max(ship.tripleShot / TRIPLE_TIME, 0),
                color: '#f0f', border: 'rgba(255,0,255,0.5)' });
  if (ship.shieldTime > 0)
    bars.push({ label: 'ESCUDO',    frac: Math.max(ship.shieldTime / SHIELD_TIME, 0),
                color: '#0f0', border: 'rgba(0,255,0,0.5)' });
  // Barras apiladas hacia arriba desde abajo-izquierda
  let rectY = H - 20;
  for (const b of bars) {
    drawEffectBar(b.label, b.frac, b.color, b.border, rectY);
    rectY -= 26;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
