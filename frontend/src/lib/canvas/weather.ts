// ── Weather particle systems + sky celestial objects ────────

import type { WeatherType } from '@/types/mood';
import type { DayPhase } from '@/types/garden';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface WeatherState {
  particles: Particle[];
  lastSpawn: number;
  lightningFlash: number;
  lightningCooldown: number;
}

const MAX_PARTICLES = 200;

// Persistent cloud shapes so they don't regenerate every frame
interface CloudShape {
  x: number;
  baseY: number;
  width: number;
  height: number;
  speed: number;
  circles: { dx: number; dy: number; r: number }[];
  opacity: number;
}
let _cloudShapes: CloudShape[] | null = null;
let _cloudWeather: WeatherType | null = null;

// Persistent star positions
interface StarPoint { x: number; y: number; size: number; twinkleSpeed: number; phase: number; }
let _stars: StarPoint[] | null = null;

export function createWeatherState(): WeatherState {
  return { particles: [], lastSpawn: 0, lightningFlash: 0, lightningCooldown: 0 };
}

/* ────────────────────────────────────────────────────────────
   CELESTIAL OBJECTS — sun, moon, stars, clouds
   ──────────────────────────────────────────────────────────── */

/** Glowing sun with animated rays */
function drawSun(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, time: number) {
  ctx.save();
  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 3.5);
  glow.addColorStop(0, 'rgba(255,236,179,0.6)');
  glow.addColorStop(0.4, 'rgba(255,213,79,0.2)');
  glow.addColorStop(1, 'rgba(255,213,79,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Animated rays
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.15);
  const rayCount = 12;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const innerR = radius * 1.15;
    const outerR = radius * 1.6 + Math.sin(time * 2 + i) * radius * 0.3;
    const halfWidth = Math.PI / rayCount * 0.35;
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle - halfWidth) * innerR,
      Math.sin(angle - halfWidth) * innerR,
    );
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.lineTo(
      Math.cos(angle + halfWidth) * innerR,
      Math.sin(angle + halfWidth) * innerR,
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,236,179,0.35)';
    ctx.fill();
  }
  ctx.restore();

  // Sun body
  const bodyGrad = ctx.createRadialGradient(cx - radius * 0.15, cy - radius * 0.15, 0, cx, cy, radius);
  bodyGrad.addColorStop(0, '#FFF9C4');
  bodyGrad.addColorStop(0.6, '#FFD54F');
  bodyGrad.addColorStop(1, '#FFB300');
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Cute face — two closed-eye arcs and a smile
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  // Left eye
  ctx.beginPath();
  ctx.arc(cx - radius * 0.28, cy - radius * 0.1, radius * 0.13, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  // Right eye
  ctx.beginPath();
  ctx.arc(cx + radius * 0.28, cy - radius * 0.1, radius * 0.13, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  // Smile
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.05, radius * 0.3, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Blush
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FF8A65';
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.45, cy + radius * 0.15, radius * 0.14, radius * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + radius * 0.45, cy + radius * 0.15, radius * 0.14, radius * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Crescent moon with glow */
function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, time: number) {
  ctx.save();
  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 3);
  glow.addColorStop(0, 'rgba(224,224,255,0.25)');
  glow.addColorStop(0.5, 'rgba(200,200,240,0.08)');
  glow.addColorStop(1, 'rgba(200,200,240,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 3, 0, Math.PI * 2);
  ctx.fill();

  // Moon body
  const bodyGrad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius);
  bodyGrad.addColorStop(0, '#FFF8E1');
  bodyGrad.addColorStop(0.7, '#F5E6CA');
  bodyGrad.addColorStop(1, '#E8D5B0');
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Crescent shadow
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + radius * 0.4, cy - radius * 0.15, radius * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Crater details
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#B0A080';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.25, cy + radius * 0.2, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - radius * 0.45, cy - radius * 0.3, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - radius * 0.1, cy - radius * 0.1, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Sleeping face on the lit crescent area
  ctx.strokeStyle = '#9E8E70';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  const faceCx = cx - radius * 0.2;
  const faceCy = cy;
  // Closed eye
  ctx.beginPath();
  ctx.arc(faceCx - radius * 0.12, faceCy - radius * 0.08, radius * 0.08, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  // Smile
  ctx.beginPath();
  ctx.arc(faceCx - radius * 0.08, faceCy + radius * 0.12, radius * 0.12, Math.PI * 0.2, Math.PI * 0.7);
  ctx.stroke();

  // Zzz
  ctx.globalAlpha = 0.4 + Math.sin(time * 1.5) * 0.2;
  ctx.font = `${radius * 0.3}px sans-serif`;
  ctx.fillStyle = '#D0C8FF';
  ctx.fillText('z', cx + radius * 0.7, cy - radius * 0.4 + Math.sin(time * 1.2) * 3);
  ctx.font = `${radius * 0.22}px sans-serif`;
  ctx.fillText('z', cx + radius * 1.0, cy - radius * 0.7 + Math.sin(time * 1.4) * 2);
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Twinkling stars for night sky */
function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  if (!_stars) {
    _stars = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      _stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.55,
        size: 0.5 + Math.random() * 1.8,
        twinkleSpeed: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  for (const s of _stars) {
    const brightness = 0.3 + 0.7 * ((Math.sin(time * s.twinkleSpeed + s.phase) + 1) / 2);
    ctx.save();
    ctx.globalAlpha = brightness * 0.8;
    ctx.fillStyle = '#FFF8E1';

    // Four-pointed sparkle
    const sz = s.size;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - sz);
    ctx.quadraticCurveTo(s.x + sz * 0.2, s.y - sz * 0.2, s.x + sz, s.y);
    ctx.quadraticCurveTo(s.x + sz * 0.2, s.y + sz * 0.2, s.x, s.y + sz);
    ctx.quadraticCurveTo(s.x - sz * 0.2, s.y + sz * 0.2, s.x - sz, s.y);
    ctx.quadraticCurveTo(s.x - sz * 0.2, s.y - sz * 0.2, s.x, s.y - sz);
    ctx.fill();
    ctx.restore();
  }
}

/** Fluffy drifting clouds */
function ensureClouds(weather: WeatherType, width: number, height: number) {
  if (_cloudShapes && _cloudWeather === weather) return;
  _cloudWeather = weather;
  _cloudShapes = [];

  let count = 0;
  let opRange = [0.4, 0.7];
  switch (weather) {
    case 'sunny':       count = 3; opRange = [0.35, 0.55]; break;
    case 'overcast':    count = 7; opRange = [0.6, 0.85]; break;
    case 'rain':        count = 6; opRange = [0.55, 0.75]; break;
    case 'thunder':     count = 8; opRange = [0.7, 0.9]; break;
    case 'foggy':       count = 5; opRange = [0.4, 0.6]; break;
    case 'windy':       count = 4; opRange = [0.35, 0.5]; break;
    case 'snowy':       count = 5; opRange = [0.5, 0.7]; break;
    case 'heat_shimmer': count = 1; opRange = [0.2, 0.3]; break;
    default:            count = 3; break;
  }

  for (let i = 0; i < count; i++) {
    const cw = 60 + Math.random() * 80;
    const ch = 20 + Math.random() * 15;
    const circles: CloudShape['circles'] = [];
    const numCircles = 4 + Math.floor(Math.random() * 4);
    for (let j = 0; j < numCircles; j++) {
      circles.push({
        dx: (j / (numCircles - 1) - 0.5) * cw * 0.8 + (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * ch * 0.4 - ch * 0.1,
        r: ch * 0.4 + Math.random() * ch * 0.35,
      });
    }
    _cloudShapes.push({
      x: Math.random() * (width + 200) - 100,
      baseY: 20 + Math.random() * height * 0.25,
      width: cw,
      height: ch,
      speed: 6 + Math.random() * 12,
      circles,
      opacity: opRange[0] + Math.random() * (opRange[1] - opRange[0]),
    });
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, width: number, height: number, weather: WeatherType, time: number, isDark: boolean) {
  ensureClouds(weather, width, height);
  if (!_cloudShapes) return;

  for (const cloud of _cloudShapes) {
    const cx = ((cloud.x + cloud.speed * time) % (width + 200)) - 100;
    const cy = cloud.baseY + Math.sin(time * 0.3 + cloud.x) * 3;

    ctx.save();
    ctx.globalAlpha = cloud.opacity;

    const cloudColor = isDark
      ? 'rgba(60,55,80,0.85)'
      : weather === 'thunder'
        ? '#6A5F7C'
        : weather === 'rain'
          ? '#AAA8B8'
          : '#FFFFFF';

    for (const c of cloud.circles) {
      ctx.beginPath();
      ctx.arc(cx + c.dx, cy + c.dy, c.r, 0, Math.PI * 2);
      ctx.fillStyle = cloudColor;
      ctx.fill();
    }
    // Highlight on top
    if (!isDark && weather !== 'thunder') {
      ctx.globalAlpha = cloud.opacity * 0.3;
      for (const c of cloud.circles) {
        ctx.beginPath();
        ctx.arc(cx + c.dx, cy + c.dy - c.r * 0.2, c.r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/** Lightning flash effect */
function drawLightningFlash(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = intensity * 0.5;
  ctx.fillStyle = '#E8E0FF';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Draw a lightning bolt */
function drawLightningBolt(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // Only show occasionally
  const period = Math.floor(time * 0.3);
  if (period % 7 !== 0) return;
  const frac = (time * 0.3) - period;
  if (frac > 0.15) return;

  const startX = width * 0.3 + Math.sin(period) * width * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.7 * (1 - frac / 0.15);
  ctx.strokeStyle = '#E8E0FF';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let px = startX;
  let py = 0;
  ctx.moveTo(px, py);
  const segments = 6;
  for (let i = 0; i < segments; i++) {
    px += (Math.random() - 0.5) * 40;
    py += height * 0.12 + Math.random() * 20;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   RENDER CELESTIALS — called from drawSkyGradient
   ──────────────────────────────────────────────────────────── */

export function drawCelestials(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: WeatherType,
  dayPhase: DayPhase,
  time: number,
) {
  const isNight = dayPhase === 'night';
  const isDusk = dayPhase === 'dusk';
  const isDawn = dayPhase === 'dawn';

  // Stars (night only)
  if (isNight) {
    drawStars(ctx, width, height, time);
  }

  // Moon (night and dusk)
  if (isNight || isDusk) {
    const moonR = Math.min(width, height) * 0.045;
    const moonX = width * 0.78;
    const moonY = height * 0.12;
    drawMoon(ctx, moonX, moonY, moonR, time);
  }

  // Sun (day and dawn, unless heavy overcast/rain)
  if (!isNight && !isDusk && weather !== 'thunder' && weather !== 'overcast') {
    const sunR = Math.min(width, height) * 0.055;
    const sunX = width * 0.18;
    const sunY = isDawn ? height * 0.25 : height * 0.12;
    const sunOpacity = weather === 'rain' || weather === 'foggy' ? 0.3 : 1;
    ctx.save();
    ctx.globalAlpha = sunOpacity;
    drawSun(ctx, sunX, sunY, sunR, time);
    ctx.restore();
  }

  // Clouds
  drawClouds(ctx, width, height, weather, time, isNight);

  // Lightning
  if (weather === 'thunder') {
    drawLightningBolt(ctx, width, height, time);
  }
}


/* ────────────────────────────────────────────────────────────
   WEATHER PARTICLES
   ──────────────────────────────────────────────────────────── */

export function renderWeather(
  ctx: CanvasRenderingContext2D,
  state: WeatherState,
  weather: WeatherType,
  width: number,
  height: number,
  deltaTime: number,
  opacity: number = 1.0,
) {
  // Lightning flash decay
  if (state.lightningFlash > 0) {
    state.lightningFlash -= deltaTime * 4;
    drawLightningFlash(ctx, width, height, state.lightningFlash);
  }
  // Trigger new flashes for thunder
  if (weather === 'thunder') {
    state.lightningCooldown -= deltaTime;
    if (state.lightningCooldown <= 0 && Math.random() < 0.01) {
      state.lightningFlash = 1;
      state.lightningCooldown = 3 + Math.random() * 6;
    }
  }

  // Spawn new particles
  const spawnRate = getSpawnRate(weather);
  state.lastSpawn += deltaTime;
  if (state.lastSpawn > spawnRate && state.particles.length < MAX_PARTICLES) {
    state.lastSpawn = 0;
    const p = spawnParticle(weather, width, height);
    if (p) state.particles.push(p);
  }

  // Update existing
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.life += deltaTime;

    if (p.life > p.maxLife || p.y > height + 20 || p.x < -20 || p.x > width + 20) {
      state.particles.splice(i, 1);
      continue;
    }

    const lifeRatio = p.life / p.maxLife;
    const fadeOpacity = lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1;

    ctx.globalAlpha = p.opacity * fadeOpacity * opacity;
    drawParticle(ctx, p, weather);
  }

  ctx.globalAlpha = 1.0;
}

function getSpawnRate(weather: WeatherType): number {
  switch (weather) {
    case 'rain':         return 0.02;
    case 'thunder':      return 0.01;
    case 'snowy':        return 0.06;
    case 'windy':        return 0.05;
    case 'foggy':        return 0.1;
    case 'heat_shimmer': return 0.08;
    case 'sunny':        return 0.12;
    case 'overcast':     return 0.5;
    default:             return 0.1;
  }
}

function spawnParticle(weather: WeatherType, w: number, h: number): Particle | null {
  switch (weather) {
    case 'rain':
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: -10,
        vx: -30,
        vy: 400 + Math.random() * 100,
        size: 1 + Math.random(),
        opacity: 0.4 + Math.random() * 0.3,
        life: 0,
        maxLife: 1.5,
      };
    case 'thunder':
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: -10,
        vx: -40,
        vy: 500 + Math.random() * 150,
        size: 1.5 + Math.random(),
        opacity: 0.5 + Math.random() * 0.3,
        life: 0,
        maxLife: 1.2,
      };
    case 'snowy':
      return {
        x: Math.random() * w,
        y: -10,
        vx: Math.random() * 20 - 10,
        vy: 30 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        opacity: 0.5 + Math.random() * 0.3,
        life: 0,
        maxLife: 8,
      };
    case 'windy':
      return {
        x: -10,
        y: Math.random() * h,
        vx: 200 + Math.random() * 100,
        vy: -20 + Math.random() * 40,
        size: 1,
        opacity: 0.2 + Math.random() * 0.2,
        life: 0,
        maxLife: 2,
      };
    case 'foggy':
      return {
        x: Math.random() * w,
        y: h * 0.3 + Math.random() * h * 0.5,
        vx: 5 + Math.random() * 10,
        vy: Math.random() * 4 - 2,
        size: 40 + Math.random() * 60,
        opacity: 0.06 + Math.random() * 0.06,
        life: 0,
        maxLife: 10,
      };
    case 'heat_shimmer':
      return {
        x: Math.random() * w,
        y: h * 0.6 + Math.random() * h * 0.3,
        vx: 0,
        vy: -15 - Math.random() * 10,
        size: 3,
        opacity: 0.3 + Math.random() * 0.3,
        life: 0,
        maxLife: 3,
      };
    case 'sunny':
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        vx: 0,
        vy: -8 - Math.random() * 5,
        size: 2 + Math.random() * 2,
        opacity: 0.15 + Math.random() * 0.15,
        life: 0,
        maxLife: 4,
      };
    default:
      return null;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, weather: WeatherType) {
  switch (weather) {
    case 'rain':
    case 'thunder':
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.01, p.y + p.vy * 0.015);
      ctx.strokeStyle = weather === 'thunder' ? '#A0A8D0' : '#9AB0C4';
      ctx.lineWidth = p.size;
      ctx.stroke();
      // Splash at bottom
      if (p.life > p.maxLife * 0.9) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + p.size, 0, Math.PI, true);
        ctx.strokeStyle = 'rgba(154,176,196,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      break;
    case 'snowy': {
      // Snowflake with branches
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 0.6;
      const arms = 6;
      for (let i = 0; i < arms; i++) {
        const angle = (i / arms) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * p.size, Math.sin(angle) * p.size);
        ctx.stroke();
        // Tiny branch
        const bx = Math.cos(angle) * p.size * 0.6;
        const by = Math.sin(angle) * p.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(angle + 0.5) * p.size * 0.3, by + Math.sin(angle + 0.5) * p.size * 0.3);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'windy':
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.bezierCurveTo(p.x + 5, p.y - 2, p.x + 10, p.y + 2, p.x + 18, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      break;
    case 'foggy':
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      break;
    case 'heat_shimmer':
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(p.life * 4) * 3, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232,200,74,0.35)';
      ctx.fill();
      break;
    case 'sunny': {
      // Golden motes
      ctx.beginPath();
      const sz = p.size;
      ctx.moveTo(p.x, p.y - sz);
      ctx.quadraticCurveTo(p.x + sz * 0.3, p.y - sz * 0.3, p.x + sz, p.y);
      ctx.quadraticCurveTo(p.x + sz * 0.3, p.y + sz * 0.3, p.x, p.y + sz);
      ctx.quadraticCurveTo(p.x - sz * 0.3, p.y + sz * 0.3, p.x - sz, p.y);
      ctx.quadraticCurveTo(p.x - sz * 0.3, p.y - sz * 0.3, p.x, p.y - sz);
      ctx.fillStyle = '#FFE082';
      ctx.fill();
      break;
    }
    default:
      break;
  }
}


/* ────────────────────────────────────────────────────────────
   SKY GRADIENT — now day-phase aware
   ──────────────────────────────────────────────────────────── */

// Day-phase tint colors applied on top of weather gradients
const DAY_PHASE_TINTS: Record<DayPhase, { top: string; mid: string; bottom: string; strength: number }> = {
  dawn:  { top: '#FF9E6B', mid: '#FFD4A8', bottom: '#FFECD2', strength: 0.35 },
  day:   { top: '#6EC6FF', mid: '#A8DEFF', bottom: '#FFF8EE', strength: 0.0 },   // no tint
  dusk:  { top: '#6B3FA0', mid: '#D4708A', bottom: '#FFB88C', strength: 0.38 },
  night: { top: '#0C1445', mid: '#162050', bottom: '#1E2A5A', strength: 0.55 },
};

export function drawSkyGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: WeatherType,
  dayPhase: DayPhase = 'day',
) {
  const colors = getSkyColors(weather);
  const tint = DAY_PHASE_TINTS[dayPhase];

  const top    = tint.strength > 0 ? lerpColor(colors.top, tint.top, tint.strength) : colors.top;
  const mid    = tint.strength > 0 ? lerpColor(colors.mid, tint.mid, tint.strength) : colors.mid;
  const bottom = tint.strength > 0 ? lerpColor(colors.bottom, tint.bottom, tint.strength) : colors.bottom;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.6, mid);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function getSkyColors(weather: WeatherType): { top: string; mid: string; bottom: string } {
  switch (weather) {
    case 'sunny':        return { top: '#8ECEF8', mid: '#C0E4FC', bottom: '#F7F0E6' };
    case 'rain':         return { top: '#7A94A8', mid: '#9BB5C6', bottom: '#C9D8E0' };
    case 'thunder':      return { top: '#4A3F5C', mid: '#6A5F7C', bottom: '#8A7F9C' };
    case 'windy':        return { top: '#92C4E8', mid: '#C0DCF0', bottom: '#EAF0F4' };
    case 'foggy':        return { top: '#B8C0CC', mid: '#D0D6DC', bottom: '#E8E4DE' };
    case 'snowy':        return { top: '#C9DFF0', mid: '#DCE8F0', bottom: '#F0EDE6' };
    case 'heat_shimmer': return { top: '#E0A850', mid: '#F0D080', bottom: '#FFF4E0' };
    case 'overcast':     return { top: '#A0AEB8', mid: '#BCC6CE', bottom: '#DCD8D0' };
    default:             return { top: '#8ECEF8', mid: '#C0E4FC', bottom: '#F7F0E6' };
  }
}

export function lerpSkyColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fromWeather: WeatherType,
  toWeather: WeatherType,
  progress: number,
  dayPhase: DayPhase = 'day',
) {
  const from = getSkyColors(fromWeather);
  const to = getSkyColors(toWeather);
  const tint = DAY_PHASE_TINTS[dayPhase];

  let topColor = lerpColor(from.top, to.top, progress);
  let midColor = lerpColor(from.mid, to.mid, progress);
  let bottomColor = lerpColor(from.bottom, to.bottom, progress);

  // Apply day-phase tint
  if (tint.strength > 0) {
    topColor = lerpColor(topColor, tint.top, tint.strength);
    midColor = lerpColor(midColor, tint.mid, tint.strength);
    bottomColor = lerpColor(bottomColor, tint.bottom, tint.strength);
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.6, midColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}
