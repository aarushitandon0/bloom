// ── Mood store ──────────────────────────────────────────────

import { create } from 'zustand';
import { format } from 'date-fns';
import type { MoodEntry, NewMoodEntry, MoodType, Intensity } from '@/types/mood';
import { supabase } from '@/lib/supabase';
import { getTileVariant, getWeatherForMood } from '@/lib/mood';
import { useWeatherStore } from './weatherStore';
import { useGardenStore } from './gardenStore';
import { useAudioStore } from './audioStore';

interface MoodState {
  entries: MoodEntry[];
  isLoading: boolean;

  fetchEntries: (userId: string) => Promise<void>;
  submitLog: (
    userId: string,
    moodType: MoodType,
    intensity: Intensity,
    note: string | null,
  ) => Promise<MoodEntry | null>;
  updateEntry: (entryId: string, updates: Partial<NewMoodEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  isLoading: false,

  fetchEntries: async (userId: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false });

    if (!error && data) {
      set({ entries: data as unknown as MoodEntry[] });
    }
    set({ isLoading: false });
  },

  submitLog: async (userId, moodType, intensity, note) => {
    const now = new Date();
    const loggedAt = now.toISOString();
    const loggedDate = format(now, 'yyyy-MM-dd');
    const tileType = getTileVariant(moodType, intensity);
    const weatherType = getWeatherForMood(moodType);

    // Optimistic updates — immediate UI response
    useWeatherStore.getState().transitionTo(weatherType);
    useAudioStore.getState().requestCrossfade(weatherType);

    const newEntry: NewMoodEntry = {
      mood_type: moodType,
      intensity,
      note,
      logged_at: loggedAt,
      logged_date: loggedDate,
      tile_type: tileType,
      weather_type: weatherType,
    };

    // Try to insert to DB; fall back to local-only if Supabase isn't configured
    let entry: MoodEntry;
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({ user_id: userId, ...newEntry })
        .select()
        .single();

      if (error || !data) {
        // Supabase unavailable — create local entry
        entry = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          user_id: userId,
          ...newEntry,
          created_at: loggedAt,
          updated_at: loggedAt,
        };
      } else {
        entry = data as unknown as MoodEntry;
      }
    } catch {
      // Network / config error — create local entry
      entry = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user_id: userId,
        ...newEntry,
        created_at: loggedAt,
        updated_at: loggedAt,
      };
    }

    // Update local state
    set((state) => ({
      entries: [entry, ...state.entries],
    }));

    // Place tile in garden
    await useGardenStore.getState().placeTileForEntry(userId, entry);

    return entry;
  },

  updateEntry: async (entryId, updates) => {
    // Always update local state first
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
      ),
    }));

    // Try to persist
    try {
      await supabase
        .from('mood_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', entryId);
    } catch {
      // Supabase unavailable — change is already in local state
    }
  },

  deleteEntry: async (entryId) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
    }));
    try {
      await supabase.from('mood_entries').delete().eq('id', entryId);
    } catch {
      // local-only
    }
  },
}));
