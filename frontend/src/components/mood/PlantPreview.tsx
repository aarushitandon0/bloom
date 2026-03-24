// ── Plant preview component ─────────────────────────────────

import { useRef, useEffect } from 'react';
import type { MoodType, Intensity } from '@/types/mood';
import { getTileVariant } from '@/lib/mood';
import { drawIsoCube, drawPlantPlaceholder } from '@/lib/canvas/renderer';

interface PlantPreviewProps {
  mood: MoodType | null;
  intensity: Intensity;
}

export function PlantPreview({ mood, intensity }: PlantPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mood) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 64 * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, 80, 64);

    // Draw a small ground tile
    drawIsoCube(ctx, 40, 36, '#A8D48A', '#7AAF5A', '#6B9A4E');

    // Draw the plant
    const tileType = getTileVariant(mood, intensity);
    drawPlantPlaceholder(ctx, 40, 36, tileType);
  }, [mood, intensity]);

  if (!mood) {
    return (
      <div className="w-20 h-16 rounded-xl bg-cream/50 flex items-center justify-center">
        <span className="text-xs text-ink/30">tile</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-20 h-16"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
