// ── Weather -> sound file mapping ────────────────────────────

import type { WeatherType } from '@/types/mood';

export const SOUND_MAP: Record<WeatherType, string | null> = {
  sunny:        '/sounds/birds.mp3',
  rain:         '/sounds/rain.mp3',
  thunder:      '/sounds/thunder.mp3',
  windy:        '/sounds/wind.mp3',
  foggy:        '/sounds/snow-silence.mp3',
  snowy:        '/sounds/snow-silence.mp3',
  heat_shimmer: '/sounds/heat-shimmer.mp3',
  overcast:     null, // silent or very faint wind
};
