// ── Special garden events — fireflies, rainbow, shooting stars ──

import type { DayPhase } from '@/types/garden';

/* ────────────────────────────────────────────────────────────
   FIREFLIES — gentle glowing dots at night/dusk
   ──────────────────────────────────────────────────────────── */

interface Firefly {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
  size: number;
  brightness: number;
}

let _fireflies: Firefly[] | null = null;

function ensureFireflies(width: number, height: number) {
  if (_fireflies) return;
  _fireflies = [];
  const count = 12 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i++) {
    const bx = Math.random() * width;
    const by = height * 0.35 + Math.random() * height * 0.5;
    _fireflies.push({
      x: bx,
      y: by,
      baseX: bx,
      baseY: by,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 1.5,
      brightness: Math.random(),
    });
  }
}

export function drawFireflies(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  dayPhase: DayPhase,
) {
  if (dayPhase !== 'night' && dayPhase !== 'dusk') return;

  ensureFireflies(width, height);
  if (!_fireflies) return;

  for (const f of _fireflies) {
    f.x = f.baseX + Math.sin(time * f.speed + f.phase) * 20;
    f.y = f.baseY + Math.cos(time * f.speed * 0.7 + f.phase) * 12;
    f.brightness = 0.3 + 0.7 * ((Math.sin(time * 2.5 + f.phase) + 1) / 2);

    ctx.save();

    // Outer glow
    const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 6);
    glow.addColorStop(0, `rgba(200,230,100,${0.15 * f.brightness})`);
    glow.addColorStop(1, 'rgba(200,230,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size * 6, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.globalAlpha = f.brightness;
    ctx.fillStyle = '#E8F060';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ────────────────────────────────────────────────────────────
   RAINBOW — appears after rain clears
   ──────────────────────────────────────────────────────────── */

export function drawRainbow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number, // 0-1 fade in/out
) {
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity * 0.35;

  const cx = width * 0.5;
  const cy = height * 0.75;
  const radius = width * 0.5;

  const colors = [
    '#FF6B6B', '#FF9F43', '#FECA57',
    '#48DBFB', '#0ABDE3', '#A29BFE', '#6C5CE7',
  ];

  const bandWidth = radius * 0.04;

  for (let i = 0; i < colors.length; i++) {
    const r = radius - i * bandWidth * 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = bandWidth;
    ctx.stroke();
  }

  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   SHOOTING STAR — brief streak across night sky
   ──────────────────────────────────────────────────────────── */

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  tailLength: number;
}

let _shootingStar: ShootingStar | null = null;
let _shootingCooldown = 15 + Math.random() * 30;

export function drawShootingStar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  deltaTime: number,
  dayPhase: DayPhase,
) {
  if (dayPhase !== 'night') {
    _shootingStar = null;
    return;
  }

  // Cooldown before next star
  if (!_shootingStar) {
    _shootingCooldown -= deltaTime;
    if (_shootingCooldown <= 0) {
      _shootingStar = {
        x: Math.random() * width * 0.6 + width * 0.1,
        y: Math.random() * height * 0.15 + 5,
        vx: 250 + Math.random() * 150,
        vy: 80 + Math.random() * 60,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        tailLength: 40 + Math.random() * 30,
      };
      _shootingCooldown = 20 + Math.random() * 40;
    }
    return;
  }

  const s = _shootingStar;
  s.x += s.vx * deltaTime;
  s.y += s.vy * deltaTime;
  s.life += deltaTime;

  if (s.life >= s.maxLife) {
    _shootingStar = null;
    return;
  }

  const fadeIn = Math.min(1, s.life * 8);
  const fadeOut = 1 - Math.max(0, (s.life - s.maxLife * 0.6) / (s.maxLife * 0.4));
  const alpha = fadeIn * fadeOut;

  ctx.save();
  ctx.globalAlpha = alpha * 0.9;

  // Tail gradient
  const tailX = s.x - (s.vx / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.tailLength;
  const tailY = s.y - (s.vy / Math.sqrt(s.vx * s.vx + s.vy * s.vy)) * s.tailLength;

  const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.6, 'rgba(255,248,225,0.4)');
  grad.addColorStop(1, 'rgba(255,255,255,0.9)');

  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(s.x, s.y);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Bright head
  ctx.beginPath();
  ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Glow around head
  const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
  glow.addColorStop(0, 'rgba(255,248,225,0.5)');
  glow.addColorStop(1, 'rgba(255,248,225,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   AMBIENT FLOATING PARTICLES — dust motes, pollen
   ──────────────────────────────────────────────────────────── */

interface FloatingMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

let _motes: FloatingMote[] | null = null;

function ensureMotes(width: number, height: number) {
  if (_motes) return;
  _motes = [];
  for (let i = 0; i < 15; i++) {
    _motes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 8,
      vy: -3 - Math.random() * 5,
      size: 0.8 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

export function drawFloatingMotes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  dayPhase: DayPhase,
) {
  if (dayPhase === 'night') return; // Fireflies take over at night

  ensureMotes(width, height);
  if (!_motes) return;

  const color = dayPhase === 'dusk' ? '#FFD4A8' : dayPhase === 'dawn' ? '#FFE0B2' : '#FFF8E1';

  for (const m of _motes) {
    const px = ((m.x + m.vx * time + Math.sin(time * 0.5 + m.phase) * 15) % (width + 20)) - 10;
    const py = ((m.y + m.vy * time + Math.cos(time * 0.3 + m.phase) * 8) % (height + 20));

    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(time * 1.5 + m.phase) * 0.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py > 0 ? py : height + py, m.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
