// ── Mood -> Plant & Weather mapping ─────────────────────────

import type { MoodType, Intensity, TileType, WeatherType } from '@/types/mood';

/**
 * Derive the tile variant from mood + intensity.
 *   1-2 = sprout, 3 = standard, 4-5 = bloom
 */
export function getTileVariant(mood: MoodType, intensity: Intensity): TileType {
  if (intensity <= 2) return `${mood}_sprout` as TileType;
  if (intensity === 3) return `${mood}_standard` as TileType;
  return `${mood}_bloom` as TileType;
}

/**
 * Map mood to the weather it produces in the garden.
 */
export function getWeatherForMood(mood: MoodType): WeatherType {
  const map: Record<MoodType, WeatherType> = {
    happy:    'sunny',
    calm:     'snowy',
    sad:      'rain',
    stressed: 'thunder',
    excited:  'windy',
    neutral:  'overcast',
    grateful: 'heat_shimmer',
    tired:    'foggy',
    anxious:  'windy',
    hopeful:  'sunny',
    angry:    'thunder',
    loved:    'heat_shimmer',
    confused: 'foggy',
    proud:    'sunny',
  };
  return map[mood];
}

/** Human-readable label for a weather type */
export function getWeatherLabel(weather: WeatherType): string {
  const labels: Record<WeatherType, string> = {
    sunny:        'Sunny',
    rain:         'Rain',
    thunder:      'Thunderstorm',
    windy:        'Windy',
    foggy:        'Foggy',
    snowy:        'Soft Snow',
    heat_shimmer: 'Warm Shimmer',
    overcast:     'Overcast',
  };
  return labels[weather];
}

/** Human-readable label for a tile type */
export function getTileLabel(tileType: string): string {
  const labels: Record<string, string> = {
    happy_sprout:      'Tiny Sunflower Seedling',
    happy_standard:    'Sunflower',
    happy_bloom:       'Full Bloom Sunflower',
    calm_sprout:       'Tiny Fern',
    calm_standard:     'Lily Pad',
    calm_bloom:        'Moss Patch',
    sad_sprout:        'Small Mushroom',
    sad_standard:      'Mushroom',
    sad_bloom:         'Rain Puddle Mushroom',
    stressed_sprout:   'Tiny Cactus',
    stressed_standard: 'Cactus',
    stressed_bloom:    'Thorny Bush',
    excited_sprout:    'Tulip Bud',
    excited_standard:  'Tulip',
    excited_bloom:     'Tulip Garden',
    neutral_sprout:    'Grass Patch',
    neutral_standard:  'Clover',
    neutral_bloom:     'Clover Cluster',
    grateful_sprout:   'Rose Bud',
    grateful_standard: 'Rose',
    grateful_bloom:    'Rose Garden',
    tired_sprout:      'Wilted Sprout',
    tired_standard:    'Wilted Flower',
    tired_bloom:       'Moonflower',
    anxious_sprout:    'Trembling Bud',
    anxious_standard:  'Fidget Fern',
    anxious_bloom:     'Tangle Vine',
    hopeful_sprout:    'Morning Bud',
    hopeful_standard:  'Daisy',
    hopeful_bloom:     'Sunlit Daisy',
    angry_sprout:      'Thorn Sprout',
    angry_standard:    'Fire Weed',
    angry_bloom:       'Blazing Thistle',
    loved_sprout:      'Heart Seed',
    loved_standard:    'Peony',
    loved_bloom:       'Full Peony',
    confused_sprout:   'Spiral Shoot',
    confused_standard: 'Puzzle Vine',
    confused_bloom:    'Whirlwind Bloom',
    proud_sprout:      'Crown Bud',
    proud_standard:    'Foxglove',
    proud_bloom:       'Golden Foxglove',
  };
  return labels[tileType] ?? tileType;
}
