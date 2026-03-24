// ── Weather store ───────────────────────────────────────────

import { create } from 'zustand';
import type { WeatherType } from '@/types/mood';

const TRANSITION_DURATION = 5000; // 5 seconds

interface WeatherState {
  current: WeatherType;
  target: WeatherType;
  progress: number; // 0.0 -> 1.0
  isTransitioning: boolean;

  transitionTo: (weather: WeatherType) => void;
  tick: (deltaMs: number) => void;
}

export const useWeatherStore = create<WeatherState>((set, get) => ({
  current: 'overcast',
  target: 'overcast',
  progress: 1.0,
  isTransitioning: false,

  transitionTo: (weather: WeatherType) => {
    const state = get();
    if (weather === state.target) return;

    set({
      current: state.target, // snap current to wherever we were heading
      target: weather,
      progress: 0,
      isTransitioning: true,
    });
  },

  tick: (deltaMs: number) => {
    const state = get();
    if (!state.isTransitioning) return;

    const newProgress = Math.min(1, state.progress + deltaMs / TRANSITION_DURATION);
    if (newProgress >= 1) {
      set({
        current: state.target,
        progress: 1,
        isTransitioning: false,
      });
    } else {
      set({ progress: newProgress });
    }
  },
}));
