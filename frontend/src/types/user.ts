// ── User domain types ──────────────────────────────────────

import type { CottageStyle, Hemisphere } from './garden';

export interface UserProfile {
  id: string;
  garden_name: string;
  cottage_style: CottageStyle;
  accent_colour: string;
  hemisphere: Hemisphere;
  is_public: boolean;
  current_streak: number;
  longest_streak: number;
  highest_streak_unlocked: number;
  total_tiles: number;
  created_at: string;
  updated_at: string;
}

export interface UnlockedItem {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
}

export interface KindnessEvent {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  event_type: 'water' | 'flower' | 'note';
  note_text: string | null;
  target_tile_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const ACCENT_COLOURS = [
  '#8BAF7A', // sage
  '#C4956A', // latte
  '#B89AB8', // mauve
  '#D4876A', // terra
  '#9AB0C4', // mist
  '#E8C84A', // gold
  '#7ABFAF', // teal
  '#C48A9A', // rose
] as const;
