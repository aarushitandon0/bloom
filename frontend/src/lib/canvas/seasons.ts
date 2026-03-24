// ── Seasonal overlay particles + tile tints ─────────────────

import type { Season, Hemisphere } from '@/types/garden';

/**
 * Determine the current real-world season from date + hemisphere.
 */
export function getCurrentSeason(hemisphere: Hemisphere = 'north'): Season {
  const month = new Date().getMonth(); // 0-indexed

  const northernSeasons: Season[] = [
    'winter', 'winter',  // Jan, Feb
    'spring', 'spring', 'spring', // Mar, Apr, May
    'summer', 'summer', 'summer', // Jun, Jul, Aug
    'autumn', 'autumn', 'autumn', // Sep, Oct, Nov
    'winter',                      // Dec
  ];

  const season = northernSeasons[month];

  if (hemisphere === 'south') {
    const flip: Record<Season, Season> = {
      spring: 'autumn',
      summer: 'winter',
      autumn: 'spring',
      winter: 'summer',
    };
    return flip[season];
  }

  return season;
}

/**
 * Season particle system — blossom petals, leaves, snow.
 */
export interface SeasonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function spawnSeasonParticle(
  season: Season,
  width: number,
): SeasonParticle | null {
  switch (season) {
    case 'spring':
      return {
        x: Math.random() * width,
        y: -10,
        vx: 15 + Math.random() * 20,
        vy: 30 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 1 + Math.random() * 2,
        size: 4 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.3,
        life: 0,
        maxLife: 8 + Math.random() * 4,
      };
    case 'autumn':
      return {
        x: Math.random() * width,
        y: -10,
        vx: 10 + Math.random() * 15,
        vy: 25 + Math.random() * 15,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.5 + Math.random() * 1.5,
        size: 5 + Math.random() * 4,
        opacity: 0.7 + Math.random() * 0.2,
        life: 0,
        maxLife: 10 + Math.random() * 5,
      };
    case 'winter':
      // Winter uses weather.ts snowflakes instead
      return null;
    case 'summer':
      // Summer has shimmer — subtle
      return {
        x: Math.random() * width,
        y: Math.random() * 100,
        vx: 0,
        vy: -3,
        rotation: 0,
        rotationSpeed: 0,
        size: 2,
        opacity: 0.15 + Math.random() * 0.1,
        life: 0,
        maxLife: 5,
      };
  }
}

export function drawSeasonParticle(
  ctx: CanvasRenderingContext2D,
  p: SeasonParticle,
  season: Season,
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.opacity * (1 - p.life / p.maxLife);

  switch (season) {
    case 'spring':
      // Pink petal
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#F4B8C8';
      ctx.fill();
      break;
    case 'autumn':
      // Orange/red leaf
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? '#D4876A' : '#C4A860';
      ctx.fill();
      break;
    case 'summer':
      // Golden shimmer dot
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#E8C84A';
      ctx.fill();
      break;
  }

  ctx.restore();
}
