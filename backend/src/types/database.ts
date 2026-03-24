// ── Database types — generated from Supabase schema ─────────
// Keep in sync with supabase/migrations/*.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow;
        Insert: Partial<UserProfileRow> & { id: string };
        Update: Partial<UserProfileRow>;
        Relationships: [];
      };
      mood_entries: {
        Row: MoodEntryRow;
        Insert: Omit<MoodEntryRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<MoodEntryRow>;
        Relationships: [];
      };
      garden_tiles: {
        Row: GardenTileRow;
        Insert: Omit<GardenTileRow, 'id' | 'placed_at'>;
        Update: Partial<GardenTileRow>;
        Relationships: [];
      };
      unlocked_items: {
        Row: UnlockedItemRow;
        Insert: Omit<UnlockedItemRow, 'id' | 'unlocked_at'>;
        Update: Partial<UnlockedItemRow>;
        Relationships: [];
      };
      kindness_events: {
        Row: KindnessEventRow;
        Insert: Omit<KindnessEventRow, 'id' | 'created_at' | 'is_read'>;
        Update: Partial<KindnessEventRow>;
        Relationships: [];
      };
      co_gardens: {
        Row: CoGardenRow;
        Insert: Omit<CoGardenRow, 'id' | 'created_at'>;
        Update: Partial<CoGardenRow>;
        Relationships: [];
      };
      co_garden_invites: {
        Row: CoGardenInviteRow;
        Insert: Omit<CoGardenInviteRow, 'id' | 'created_at'>;
        Update: Partial<CoGardenInviteRow>;
        Relationships: [];
      };
      pattern_history: {
        Row: PatternHistoryRow;
        Insert: Omit<PatternHistoryRow, 'id'>;
        Update: Partial<PatternHistoryRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Row types ─────────────────────────────────────────────────

interface UserProfileRow {
  id: string;
  garden_name: string;
  cottage_style: 'wood' | 'stone' | 'brick';
  accent_colour: string;
  hemisphere: 'north' | 'south';
  is_public: boolean;
  current_streak: number;
  longest_streak: number;
  highest_streak_unlocked: number;
  total_tiles: number;
  created_at: string;
  updated_at: string;
}

interface MoodEntryRow {
  id: string;
  user_id: string;
  logged_at: string;
  logged_date: string;
  mood_type: MoodType;
  intensity: number;
  note: string | null;
  tile_type: string;
  weather_type: WeatherType;
  created_at: string;
  updated_at: string;
}

interface GardenTileRow {
  id: string;
  user_id: string;
  mood_entry_id: string | null;
  tile_type: string;
  grid_col: number;
  grid_row: number;
  is_decoration: boolean;
  water_count: number;
  placed_at: string;
}

interface UnlockedItemRow {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
}

interface KindnessEventRow {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  event_type: 'water' | 'flower' | 'note';
  note_text: string | null;
  target_tile_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface CoGardenRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: 'active' | 'ended';
  created_at: string;
}

interface CoGardenInviteRow {
  id: string;
  inviter_id: string;
  invite_code: string;
  accepted: boolean;
  created_at: string;
}

interface PatternHistoryRow {
  id: string;
  user_id: string;
  pattern_id: string;
  detected_at: string;
}

export type MoodType =
  | 'happy' | 'calm' | 'sad' | 'stressed'
  | 'excited' | 'neutral' | 'grateful' | 'tired';

export type WeatherType =
  | 'sunny' | 'rain' | 'thunder' | 'windy'
  | 'foggy' | 'snowy' | 'heat_shimmer' | 'overcast';

// Convenience row types
export type UserProfile   = UserProfileRow;
export type MoodEntry     = MoodEntryRow;
export type GardenTile    = GardenTileRow;
export type KindnessEvent = KindnessEventRow;
export type CoGarden      = CoGardenRow;
