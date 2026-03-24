// ── useWeather hook ─────────────────────────────────────────

import { useEffect } from 'react';
import { useWeatherStore } from '@/stores/weatherStore';
import { useMoodStore } from '@/stores/moodStore';

/**
 * Derives weather from the latest mood log and keeps the
 * weather store transition ticking.
 */
export function useWeather() {
  const entries = useMoodStore((s) => s.entries);
  const { current, target, progress, isTransitioning, transitionTo, tick } = useWeatherStore();

  // Set weather from latest entry on mount
  useEffect(() => {
    if (entries.length > 0) {
      const latest = entries[0]; // newest first
      transitionTo(latest.weather_type as Parameters<typeof transitionTo>[0]);
    }
  }, [entries, transitionTo]);

  // Tick the transition
  useEffect(() => {
    if (!isTransitioning) return;

    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      tick(delta);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isTransitioning, tick]);

  return { current, target, progress, isTransitioning };
}
