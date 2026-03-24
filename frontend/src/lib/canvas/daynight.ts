// ── Day/night sky overlay ───────────────────────────────────

import type { DayPhase } from '@/types/garden';

/**
 * Get the current day phase from local time.
 */
export function getDayPhase(): DayPhase {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const time = h + m / 60;

  if (time >= 5 && time < 7) return 'dawn';
  if (time >= 7 && time < 17) return 'day';
  if (time >= 17 && time < 19.5) return 'dusk';
  return 'night';
}

/**
 * Apply day/night tint overlay to canvas — richer colour treatment.
 */
export function applyDayNightOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: DayPhase,
) {
  if (phase === 'day') return; // No overlay during day

  ctx.save();

  switch (phase) {
    case 'dawn': {
      // Warm golden wash from the horizon
      const grad = ctx.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, 'rgba(255,200,140,0.12)');
      grad.addColorStop(0.5, 'rgba(255,180,120,0.06)');
      grad.addColorStop(1, 'rgba(255,160,100,0.02)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case 'dusk': {
      // Warm purple-orange gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(200,100,130,0.1)');
      grad.addColorStop(0.5, 'rgba(220,140,100,0.08)');
      grad.addColorStop(1, 'rgba(180,100,80,0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case 'night': {
      // Deep blue overlay with vignette
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.2,
        width / 2, height / 2, width * 0.8,
      );
      grad.addColorStop(0, 'rgba(25,20,40,0.18)');
      grad.addColorStop(1, 'rgba(20,15,35,0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      // Extra blue tint
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(40,35,65,0.15)';
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  ctx.restore();
}

/**
 * Get sky gradient adjustments for day phase.
 */
export function getDayPhaseSkyMod(phase: DayPhase): {
  topTint: string;
  bottomTint: string;
  opacity: number;
} {
  switch (phase) {
    case 'dawn':
      return { topTint: '#FFB088', bottomTint: '#E8D0C0', opacity: 0.3 };
    case 'day':
      return { topTint: 'transparent', bottomTint: 'transparent', opacity: 0 };
    case 'dusk':
      return { topTint: '#E8A060', bottomTint: '#C4789A', opacity: 0.25 };
    case 'night':
      return { topTint: '#1A1428', bottomTint: '#2A2233', opacity: 0.5 };
  }
}
