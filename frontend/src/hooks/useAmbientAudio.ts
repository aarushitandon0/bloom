// ── useAmbientAudio hook ────────────────────────────────────

import { useEffect } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { useWeatherStore } from '@/stores/weatherStore';

/**
 * Plays/crossfades ambient sound when weather changes.
 */
export function useAmbientAudio() {
  const audioReady = useAudioStore((s) => s.audioReady);
  const targetWeather = useWeatherStore((s) => s.target);
  const requestCrossfade = useAudioStore((s) => s.requestCrossfade);

  useEffect(() => {
    if (audioReady) {
      requestCrossfade(targetWeather);
    }
  }, [audioReady, targetWeather, requestCrossfade]);
}
