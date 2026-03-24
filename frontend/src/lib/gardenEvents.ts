// ── Special garden event trigger logic ───────────────────────

import type { MoodEntry } from '@/types/mood';
import type { DayPhase } from '@/types/garden';

export type GardenEventType =
  | 'fireflies'
  | 'cottage_light'
  | 'rainbow'
  | 'golden_flower'
  | 'shooting_star'
  | 'lightning_flash';

export interface ActiveEvent {
  type: GardenEventType;
  duration: number; // ms
}

/**
 * Compute which special events should be active right now.
 * All derived client-side — no extra DB columns.
 */
export function getActiveEvents(
  entries: MoodEntry[],
  dayPhase: DayPhase,
  currentWeather: string,
): ActiveEvent[] {
  const events: ActiveEvent[] = [];
  const sorted = [...entries].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );

  // Fireflies: night AND last 10 logs are calm/happy
  if (dayPhase === 'night' && sorted.length >= 10) {
    const last10 = sorted.slice(0, 10);
    const peaceful = new Set(['calm', 'happy']);
    if (last10.every((e) => peaceful.has(e.mood_type))) {
      events.push({ type: 'fireflies', duration: -1 }); // continuous
    }
  }

  // Rainbow: previous log was sad AND current (latest) is happy
  if (sorted.length >= 2 && sorted[0].mood_type === 'happy' && sorted[1].mood_type === 'sad') {
    events.push({ type: 'rainbow', duration: 60_000 });
  }

  // Golden flower: 7 consecutive calendar days each containing >= 1 happy log
  const happyDays = new Set(
    sorted.filter((e) => e.mood_type === 'happy').map((e) => e.logged_date)
  );
  if (happyDays.size >= 7) {
    // Check if the most recent 7 distinct dates with happy logs are consecutive
    const sortedDays = [...happyDays].sort().reverse();
    let consecutive = 1;
    for (let i = 1; i < sortedDays.length && consecutive < 7; i++) {
      const diff = daysBetween(sortedDays[i - 1], sortedDays[i]);
      if (diff === 1) consecutive++;
      else break;
    }
    if (consecutive >= 7) {
      events.push({ type: 'golden_flower', duration: -1 });
    }
  }

  // Shooting star: 23:45 - 00:15 local time
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  if ((hour === 23 && min >= 45) || (hour === 0 && min <= 15)) {
    events.push({ type: 'shooting_star', duration: 3_000 });
  }

  // Lightning flash: during thunderstorm weather
  if (currentWeather === 'thunder') {
    events.push({ type: 'lightning_flash', duration: 80 });
  }

  return events;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(Math.round((a - b) / (1000 * 60 * 60 * 24)));
}
