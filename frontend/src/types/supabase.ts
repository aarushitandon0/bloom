// ── Supabase generated types placeholder ──────────────────
// Run: npx supabase gen types typescript --project-id <id> --schema public > src/types/supabase.ts
// This file will be overwritten by the generator.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          garden_name: string;
          cottage_style: string;
          accent_colour: string;
          hemisphere: string;
          is_public: boolean;
          current_streak: number;
          longest_streak: number;
          highest_streak_unlocked: number;
          total_tiles: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          logged_at: string;
          logged_date: string;
          mood_type: string;
          intensity: number;
          note: string | null;
          tile_type: string;
          weather_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      garden_tiles: {
        Row: {
          id: string;
          user_id: string;
          mood_entry_id: string | null;
          tile_type: string;
          grid_col: number;
          grid_row: number;
          is_decoration: boolean;
          placed_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      unlocked_items: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          unlocked_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      kindness_events: {
        Row: {
          id: string;
          sender_id: string | null;
          recipient_id: string;
          event_type: string;
          note_text: string | null;
          target_tile_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      co_gardens: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      co_garden_invites: {
        Row: {
          id: string;
          inviter_id: string;
          invite_code: string;
          accepted: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      pattern_toasts_seen: {
        Row: {
          id: string;
          user_id: string;
          pattern_id: string;
          seen_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
}
