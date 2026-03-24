// ── Emoji picker component ──────────────────────────────────
// Uses hand-drawn SVG icons instead of emoji characters.

import { motion } from 'framer-motion';
import type { MoodType } from '@/types/mood';
import { MOOD_OPTIONS } from '@/types/mood';

interface EmojiPickerProps {
  selected: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

/** Hand-drawn style SVG icon per mood (no emoji) */
function MoodIcon({ mood, size = 32 }: { mood: MoodType; size?: number }) {
  const s = size;

  switch (mood) {
    case 'happy':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="13" r="1.5" fill="currentColor"/>
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'calm':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 20c1.5 1.5 6.5 1.5 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'sad':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="13" r="1.5" fill="currentColor"/>
          <path d="M11 22c2-3 8-3 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 11l-1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'stressed':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 11l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M23 11l-5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="11" cy="15" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="15" r="1.5" fill="currentColor"/>
          <path d="M11 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'excited':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 12c1-2 4-2 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 12c1-2 4-2 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx="16" cy="21" rx="4" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M6 8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M26 8l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'neutral':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="11" cy="14" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="14" r="1.5" fill="currentColor"/>
          <path d="M11 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'grateful':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="13" r="1.5" fill="currentColor"/>
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 6l1.5 3 3-.5-2 2.5 1 3-3-1.5L13.5 14l1-3-2-2.5 3 .5z" fill="currentColor" opacity="0.3"/>
        </svg>
      );
    case 'tired':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx="16" cy="21" rx="3" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M22 8l2-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <path d="M24 7l1.5-0.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
          <path d="M26 6.5l1 0" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {MOOD_OPTIONS.map((mood) => {
        const isSelected = selected === mood.type;
        return (
          <motion.button
            key={mood.type}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onSelect(mood.type)}
            className={`
              flex flex-col items-center gap-1.5 p-3 rounded-2xl
              transition-all duration-300
              ${isSelected
                ? 'bg-cream shadow-md ring-2'
                : 'bg-transparent hover:bg-cream/60'
              }
            `}
            style={{
              color: mood.colour,
              ['--tw-ring-color' as string]: isSelected ? mood.colour : 'transparent',
            }}
          >
            <div className={`
              w-12 h-12 flex items-center justify-center rounded-xl
              ${isSelected ? 'animate-glow-ring' : ''}
            `}>
              <MoodIcon mood={mood.type} size={36} />
            </div>
            <span className="text-xs font-display font-semibold text-ink/70">
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
