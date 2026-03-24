// ── Journal entry card ──────────────────────────────────────
// Full implementation in Phase 5

import { Card } from '@/components/ui/Card';
import { WeatherIndicator } from '@/components/weather/WeatherIndicator';
import type { MoodEntry, WeatherType } from '@/types/mood';
import { getTileLabel } from '@/lib/mood';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Pencil } from 'lucide-react';

interface JournalEntryProps {
  entry: MoodEntry;
  onEdit?: (entry: MoodEntry) => void;
}

function formatTimestamp(dateStr: string): string {
  const date = parseISO(dateStr);
  const time = format(date, 'h:mm a');
  if (isToday(date)) return `Today at ${time}`;
  if (isYesterday(date)) return `Yesterday at ${time}`;
  return `${format(date, 'MMM d')} at ${time}`;
}

export function JournalEntry({ entry, onEdit }: JournalEntryProps) {
  return (
    <Card padding="md" className="flex items-start gap-3">
      {/* Mood indicator */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'var(--cream)' }}
      >
        <WeatherIndicator weather={entry.weather_type as WeatherType} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-sm text-ink capitalize">
            {entry.mood_type}
          </span>

          {/* Intensity dots */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i <= entry.intensity ? 'var(--latte)' : 'rgba(61,47,36,0.12)',
                }}
              />
            ))}
          </div>

          <span className="text-xs text-ink/40 ml-auto">
            {formatTimestamp(entry.logged_at)}
          </span>
        </div>

        {/* Tile label */}
        <p className="text-xs text-ink/50 mb-1">
          {getTileLabel(entry.tile_type)}
        </p>

        {/* Note */}
        {entry.note && (
          <p className="text-sm text-ink/70 leading-relaxed">{entry.note}</p>
        )}
      </div>

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded-lg text-ink/30 hover:text-ink/60 hover:bg-cream transition-colors"
        >
          <Pencil size={14} />
        </button>
      )}
    </Card>
  );
}
