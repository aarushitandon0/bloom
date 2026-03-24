// ── Mood domain types ──────────────────────────────────────

export type MoodType =
  | 'happy'
  | 'calm'
  | 'sad'
  | 'stressed'
  | 'excited'
  | 'neutral'
  | 'grateful'
  | 'tired'
  | 'anxious'
  | 'hopeful'
  | 'angry'
  | 'loved'
  | 'confused'
  | 'proud';

export type Intensity = 1 | 2 | 3 | 4 | 5;

export type WeatherType =
  | 'sunny'
  | 'rain'
  | 'thunder'
  | 'windy'
  | 'foggy'
  | 'snowy'
  | 'heat_shimmer'
  | 'overcast';

export type TileVariant = 'sprout' | 'standard' | 'bloom';

/** The full tile type key, e.g. "happy_bloom" */
export type TileType = `${MoodType}_${TileVariant}`;

export interface MoodEntry {
  id: string;
  user_id: string;
  logged_at: string;       // ISO UTC timestamp
  logged_date: string;     // YYYY-MM-DD local date
  mood_type: MoodType;
  intensity: Intensity;
  note: string | null;
  tile_type: TileType;
  weather_type: WeatherType;
  created_at: string;
  updated_at: string;
}

export interface NewMoodEntry {
  mood_type: MoodType;
  intensity: Intensity;
  note: string | null;
  logged_at: string;
  logged_date: string;
  tile_type: TileType;
  weather_type: WeatherType;
}

/** Mood descriptor for the emoji picker UI */
export interface MoodOption {
  type: MoodType;
  label: string;
  colour: string;           // CSS variable token
  weatherLabel: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { type: 'happy',    label: 'Happy',     colour: 'var(--gold)',      weatherLabel: 'Sunny' },
  { type: 'calm',     label: 'Calm',      colour: 'var(--sage)',      weatherLabel: 'Soft snow' },
  { type: 'sad',      label: 'Sad',       colour: 'var(--mist)',      weatherLabel: 'Rain' },
  { type: 'stressed', label: 'Stressed',  colour: 'var(--thunder)',   weatherLabel: 'Storm' },
  { type: 'excited',  label: 'Excited',   colour: 'var(--terra)',     weatherLabel: 'Windy' },
  { type: 'neutral',  label: 'Neutral',   colour: 'var(--ink)',       weatherLabel: 'Overcast' },
  { type: 'grateful', label: 'Grateful',  colour: 'var(--latte)',     weatherLabel: 'Warm shimmer' },
  { type: 'tired',    label: 'Tired',     colour: 'var(--mauve)',     weatherLabel: 'Foggy' },
  { type: 'anxious',  label: 'Anxious',   colour: '#B0896E',         weatherLabel: 'Gusty' },
  { type: 'hopeful',  label: 'Hopeful',   colour: '#7ABFAF',         weatherLabel: 'Dawn glow' },
  { type: 'angry',    label: 'Angry',     colour: '#C46A5A',         weatherLabel: 'Heat wave' },
  { type: 'loved',    label: 'Loved',     colour: '#C48A9A',         weatherLabel: 'Warm breeze' },
  { type: 'confused', label: 'Confused',  colour: '#9A8AB8',         weatherLabel: 'Misty' },
  { type: 'proud',    label: 'Proud',     colour: '#D4A84A',         weatherLabel: 'Clear sky' },
];
