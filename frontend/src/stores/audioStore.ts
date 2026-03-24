// ── Audio store ─────────────────────────────────────────────

import { create } from 'zustand';
import type { WeatherType } from '@/types/mood';
import { crossfadeTo, setMuted, setVolume, getAudioCtx } from '@/lib/audio/ambientPlayer';

interface AudioState {
  isMuted: boolean;
  volume: number;
  currentWeather: WeatherType | null;
  audioReady: boolean;

  initAudio: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  requestCrossfade: (weather: WeatherType) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isMuted: localStorage.getItem('bloom_muted') === 'true',
  volume: parseFloat(localStorage.getItem('bloom_volume') ?? '0.3'),
  currentWeather: null,
  audioReady: false,

  initAudio: () => {
    try {
      getAudioCtx();
      set({ audioReady: true });
      localStorage.setItem('bloom_audio_init', 'true');

      // If there's a pending weather, start playing
      const state = get();
      if (state.currentWeather && !state.isMuted) {
        crossfadeTo(state.currentWeather, state.volume);
      }
    } catch {
      // Not in a user gesture context
    }
  },

  toggleMute: () => {
    const state = get();
    const newMuted = !state.isMuted;
    set({ isMuted: newMuted });
    localStorage.setItem('bloom_muted', String(newMuted));
    setMuted(newMuted, state.volume);
  },

  setVolume: (volume: number) => {
    set({ volume });
    localStorage.setItem('bloom_volume', String(volume));
    setVolume(volume);
  },

  requestCrossfade: (weather: WeatherType) => {
    const state = get();
    set({ currentWeather: weather });
    if (state.audioReady && !state.isMuted) {
      crossfadeTo(weather, state.volume);
    }
  },
}));
