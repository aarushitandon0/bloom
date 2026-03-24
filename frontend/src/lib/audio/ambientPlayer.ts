// ── Web Audio API ambient player ─────────────────────────────

import type { WeatherType } from '@/types/mood';
import { SOUND_MAP } from './soundMap';

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
let currentWeather: WeatherType | null = null;
const bufferCache = new Map<string, AudioBuffer>();

const CROSSFADE_DURATION = 3; // seconds

/**
 * Get or create the AudioContext.
 * MUST be called inside a user gesture (tap/click) the first time.
 */
export function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Check if audio context has been initialized.
 */
export function isAudioReady(): boolean {
  return audioCtx !== null && audioCtx.state === 'running';
}

/**
 * Load an audio file into a buffer (cached).
 */
async function loadBuffer(url: string): Promise<AudioBuffer> {
  if (bufferCache.has(url)) return bufferCache.get(url)!;

  const ctx = getAudioCtx();
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(url, audioBuffer);
    return audioBuffer;
  } catch {
    throw new Error(`Failed to load audio: ${url}`);
  }
}

/**
 * Crossfade to a new weather sound.
 */
export async function crossfadeTo(
  weather: WeatherType,
  volume: number = 0.3,
): Promise<void> {
  if (weather === currentWeather) return;

  const ctx = getAudioCtx();
  const soundUrl = SOUND_MAP[weather];

  // Fade out current
  if (currentGain && currentSource) {
    const oldGain = currentGain;
    const oldSource = currentSource;
    oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + CROSSFADE_DURATION);
    setTimeout(() => {
      try { oldSource.stop(); } catch { /* already stopped */ }
    }, CROSSFADE_DURATION * 1000 + 100);
  }

  currentWeather = weather;

  if (!soundUrl) {
    currentSource = null;
    currentGain = null;
    return;
  }

  try {
    const buffer = await loadBuffer(soundUrl);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + CROSSFADE_DURATION);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    currentSource = source;
    currentGain = gain;
  } catch {
    // Sound file not available — fail silently
  }
}

/**
 * Set master volume.
 */
export function setVolume(volume: number) {
  if (currentGain) {
    const ctx = getAudioCtx();
    currentGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
  }
}

/**
 * Mute / unmute.
 */
export function setMuted(muted: boolean, volume: number = 0.3) {
  if (currentGain) {
    const ctx = getAudioCtx();
    currentGain.gain.linearRampToValueAtTime(
      muted ? 0 : volume,
      ctx.currentTime + 0.3
    );
  }
}

/**
 * Stop all audio.
 */
export function stopAll() {
  try {
    currentSource?.stop();
  } catch { /* ok */ }
  currentSource = null;
  currentGain = null;
  currentWeather = null;
}
