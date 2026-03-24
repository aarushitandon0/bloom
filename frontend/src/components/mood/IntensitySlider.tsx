// ── Intensity slider component ──────────────────────────────

import type { Intensity } from '@/types/mood';

interface IntensitySliderProps {
  value: Intensity;
  onChange: (value: Intensity) => void;
  color?: string;
}

const labels = ['just a little', 'a bit', 'moderately', 'quite a lot', 'very much'];

export function IntensitySlider({ value, onChange, color = 'var(--latte)' }: IntensitySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-display text-ink/60">intensity</span>
        <span className="text-sm font-display text-ink/80">{labels[value - 1]}</span>
      </div>

      <div className="flex items-center gap-2">
        {([1, 2, 3, 4, 5] as Intensity[]).map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className="flex-1 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: level <= value ? color : 'var(--cream)',
              opacity: level <= value ? 0.6 + (level / 5) * 0.4 : 1,
              border: `1px solid ${level <= value ? color : 'rgba(61,47,36,0.1)'}`,
            }}
          />
        ))}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-between px-1">
        {([1, 2, 3, 4, 5] as Intensity[]).map((level) => (
          <div
            key={level}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: level <= value ? color : 'rgba(61,47,36,0.15)',
              transform: level === value ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
