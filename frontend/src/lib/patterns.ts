// ── Mood pattern detection (soft toasts) ────────────────────

import type { MoodEntry } from '@/types/mood';

export interface PatternResult {
  id: string;
  message: string;
}

/**
 * Detect mood patterns from the user's log history.
 * Returns all matching patterns — caller is responsible
 * for checking 48h cooldown via pattern_toasts_seen table.
 */
export function detectPatterns(
  entries: MoodEntry[],
  totalTiles: number,
): PatternResult[] {
  const results: PatternResult[] = [];
  if (entries.length === 0) return results;

  // Sort newest first
  const sorted = [...entries].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );

  // Morning calm: last 5 morning logs (6-11am) all calm/peaceful
  const morningLogs = sorted.filter((e) => {
    const h = new Date(e.logged_at).getHours();
    return h >= 6 && h < 11;
  });
  if (morningLogs.length >= 5) {
    const last5 = morningLogs.slice(0, 5);
    if (last5.every((e) => e.mood_type === 'calm' || e.mood_type === 'neutral')) {
      results.push({
        id: 'morning_calm',
        message: "you've been calm every morning this week",
      });
    }
  }

  // Evening glow: last 5 evening logs (6-10pm) all happy
  const eveningLogs = sorted.filter((e) => {
    const h = new Date(e.logged_at).getHours();
    return h >= 18 && h < 22;
  });
  if (eveningLogs.length >= 5) {
    const last5 = eveningLogs.slice(0, 5);
    if (last5.every((e) => e.mood_type === 'happy')) {
      results.push({
        id: 'evening_glow',
        message: 'your evenings have been glowing lately',
      });
    }
  }

  // Stress cloud: last 6 logs all stressed/anxious
  if (sorted.length >= 6) {
    const last6 = sorted.slice(0, 6);
    if (last6.every((e) => e.mood_type === 'stressed')) {
      results.push({
        id: 'stress_cloud',
        message: "it's been a stormy few logs. be gentle with yourself",
      });
    }
  }

  // Full day: 5+ different mood types logged today
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = sorted.filter((e) => e.logged_date === today);
  const uniqueMoods = new Set(todayLogs.map((e) => e.mood_type));
  if (uniqueMoods.size >= 5) {
    results.push({
      id: 'full_day',
      message: 'what a full day of feelings',
    });
  }

  // Long peace: 20+ consecutive logs all calm/neutral/happy
  if (sorted.length >= 20) {
    const peaceful = new Set(['calm', 'neutral', 'happy']);
    let run = 0;
    for (const e of sorted) {
      if (peaceful.has(e.mood_type)) run++;
      else break;
    }
    if (run >= 20) {
      results.push({
        id: 'long_peace',
        message: 'your garden has been so peaceful lately',
      });
    }
  }

  // Garden hug: 8+ consecutive logs all sad/tired
  if (sorted.length >= 8) {
    let run = 0;
    for (const e of sorted) {
      if (e.mood_type === 'sad' || e.mood_type === 'tired') run++;
      else break;
    }
    if (run >= 8) {
      results.push({
        id: 'garden_hug',
        message: 'your garden is sending you a hug',
      });
    }
  }

  // 100th tile
  if (totalTiles === 100) {
    results.push({
      id: '100th_tile',
      message: '100 feelings planted. your garden is thriving',
    });
  }

  return results;
}
