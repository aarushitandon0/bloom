// ── Insights & Wrapped calculations ─────────────────────────

import type { MoodEntry, MoodType } from '@/types/mood';

export interface MoodCount {
  mood: MoodType;
  count: number;
  percent: number;
}

export interface GardenNumbers {
  totalTiles: number;
  uniqueDays: number;
  topMood: MoodType | null;
  topMoodPercent: number;
  moodCounts: MoodCount[];
  happiestMonth: string | null;
  longestCalmStreak: number;
  rarestMood: MoodType | null;
  totalNotes: number;
  growingSince: string | null;
}

export interface WrappedData {
  summary: string;
  topMood: MoodType | null;
  topMoodCount: number;
  rarestMood: MoodType | null;
  totalTiles: number;
  totalDays: number;
}

export interface DayInsights {
  date: string;
  entries: MoodEntry[];
  dominantMood: MoodType | null;
  moodCounts: MoodCount[];
  avgIntensity: number;
  notes: string[];
}

/**
 * Compute "Garden in Numbers" stats from all entries.
 */
export function computeGardenNumbers(entries: MoodEntry[]): GardenNumbers {
  if (entries.length === 0) {
    return {
      totalTiles: 0,
      uniqueDays: 0,
      topMood: null,
      topMoodPercent: 0,
      moodCounts: [],
      happiestMonth: null,
      longestCalmStreak: 0,
      rarestMood: null,
      totalNotes: 0,
      growingSince: null,
    };
  }

  // Unique days
  const uniqueDays = new Set(entries.map((e) => e.logged_date)).size;

  // Count moods
  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.mood_type] = (counts[e.mood_type] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topMood = sorted[0]?.[0] as MoodType ?? null;
  const topMoodPercent = sorted[0]
    ? Math.round((sorted[0][1] / entries.length) * 100)
    : 0;
  const rarestMood = sorted[sorted.length - 1]?.[0] as MoodType ?? null;

  const moodCounts: MoodCount[] = sorted.map(([mood, count]) => ({
    mood: mood as MoodType,
    count,
    percent: Math.round((count / entries.length) * 100),
  }));

  // Happiest month
  const monthCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.mood_type === 'happy') {
      const month = e.logged_date.slice(0, 7);
      monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    }
  }
  const happiestMonth = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Longest calm streak
  const peaceful = new Set<MoodType>(['calm', 'neutral', 'happy']);
  const byTime = [...entries].sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );
  let longestCalmStreak = 0;
  let run = 0;
  for (const e of byTime) {
    if (peaceful.has(e.mood_type)) {
      run++;
      longestCalmStreak = Math.max(longestCalmStreak, run);
    } else {
      run = 0;
    }
  }

  const totalNotes = entries.filter((e) => e.note && e.note.trim().length > 0).length;
  const growingSince = byTime[0]?.logged_date ?? null;

  return {
    totalTiles: entries.length,
    uniqueDays,
    topMood,
    topMoodPercent,
    moodCounts,
    happiestMonth,
    longestCalmStreak,
    rarestMood,
    totalNotes,
    growingSince,
  };
}

/**
 * Compute Wrapped summary for all entries.
 */
export function computeWrapped(entries: MoodEntry[]): WrappedData | null {
  if (entries.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.mood_type] = (counts[e.mood_type] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topMood = sorted[0]?.[0] as MoodType ?? null;
  const topMoodCount = sorted[0]?.[1] ?? 0;
  const rarestMood = sorted[sorted.length - 1]?.[0] as MoodType ?? null;
  const uniqueDays = new Set(entries.map((e) => e.logged_date));

  // Build a cozy narrative
  const summaryParts: string[] = [];
  if (topMood) {
    summaryParts.push(
      `your garden has been feeling mostly ${topMood} — ${topMoodCount} logs and counting.`
    );
  }
  if (rarestMood && rarestMood !== topMood) {
    summaryParts.push(
      `${rarestMood} moments were rare but precious.`
    );
  }
  summaryParts.push(
    `you've planted ${entries.length} tile${entries.length !== 1 ? 's' : ''} across ${uniqueDays.size} day${uniqueDays.size !== 1 ? 's' : ''}.`
  );

  return {
    summary: summaryParts.join(' '),
    topMood,
    topMoodCount,
    rarestMood,
    totalTiles: entries.length,
    totalDays: uniqueDays.size,
  };
}

/**
 * Compute insights for a single day.
 */
export function computeDayInsights(
  entries: MoodEntry[],
  dateStr: string,
): DayInsights {
  const dayEntries = entries.filter((e) => e.logged_date === dateStr);

  if (dayEntries.length === 0) {
    return {
      date: dateStr,
      entries: [],
      dominantMood: null,
      moodCounts: [],
      avgIntensity: 0,
      notes: [],
    };
  }

  const counts: Record<string, number> = {};
  for (const e of dayEntries) {
    counts[e.mood_type] = (counts[e.mood_type] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominantMood = sorted[0]?.[0] as MoodType ?? null;

  const moodCounts: MoodCount[] = sorted.map(([mood, count]) => ({
    mood: mood as MoodType,
    count,
    percent: Math.round((count / dayEntries.length) * 100),
  }));

  const avgIntensity =
    dayEntries.reduce((sum, e) => sum + e.intensity, 0) / dayEntries.length;

  const notes = dayEntries
    .filter((e) => e.note && e.note.trim().length > 0)
    .map((e) => e.note!);

  return {
    date: dateStr,
    entries: dayEntries,
    dominantMood,
    moodCounts,
    avgIntensity: Math.round(avgIntensity * 10) / 10,
    notes,
  };
}
