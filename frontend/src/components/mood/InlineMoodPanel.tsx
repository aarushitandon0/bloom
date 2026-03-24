// ── Inline mood panel — sits below the garden canvas ────────

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Sparkles, Pencil, Droplets, Lock } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { useMoodLog } from '@/hooks/useMoodLog';
import { useGardenStore } from '@/stores/gardenStore';
import { MOOD_OPTIONS } from '@/types/mood';
import type { MoodType, Intensity, TileType } from '@/types/mood';
import type { GardenTile } from '@/types/garden';
import { getTileLabel } from '@/lib/mood';
import { PlantPreview } from './PlantPreview';
import { WateringAnimation } from './WateringAnimation';
import '@/styles/canvas.css';

/* ── Tiny SVG mood icons (no emoji) ────────────────────────── */
function MoodMiniIcon({ mood, size = 24 }: { mood: MoodType; size?: number }) {
  const s = size;
  switch (mood) {
    case 'happy':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="13" r="1.5" fill="currentColor" />
          <circle cx="21" cy="13" r="1.5" fill="currentColor" />
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'calm':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 20c1.5 1.5 6.5 1.5 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'sad':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="13" r="1.5" fill="currentColor" />
          <circle cx="21" cy="13" r="1.5" fill="currentColor" />
          <path d="M11 22c2-3 8-3 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'stressed':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M9 11l5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M23 11l-5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="11" cy="15" r="1.5" fill="currentColor" />
          <circle cx="21" cy="15" r="1.5" fill="currentColor" />
          <path d="M11 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'excited':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M9 12c1-2 4-2 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 12c1-2 4-2 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="16" cy="21" rx="4" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'neutral':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="14" r="1.5" fill="currentColor" />
          <circle cx="21" cy="14" r="1.5" fill="currentColor" />
          <path d="M11 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'grateful':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="13" r="1.5" fill="currentColor" />
          <circle cx="21" cy="13" r="1.5" fill="currentColor" />
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 6l1.5 3 3-.5-2 2.5 1 3-3-1.5L13.5 14l1-3-2-2.5 3 .5z" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'tired':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M9 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="16" cy="21" rx="3" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'anxious':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="11" cy="13" r="0.8" fill="currentColor" />
          <circle cx="21" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="21" cy="13" r="0.8" fill="currentColor" />
          <path d="M12 21c1.5-2 6.5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );
    case 'hopeful':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="14" r="1.5" fill="currentColor" />
          <circle cx="21" cy="14" r="1.5" fill="currentColor" />
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 5v4M14 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    case 'angry':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 10l6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 10l-6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="11" cy="15" r="1.5" fill="currentColor" />
          <circle cx="21" cy="15" r="1.5" fill="currentColor" />
          <path d="M11 22c2-2 8-2 10 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'loved':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M11 13c0-2 3-3 5-1 2-2 5-1 5 1 0 3-5 5-5 5s-5-2-5-5z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1" />
          <path d="M10 21c2 2 10 2 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'confused':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="14" r="1.5" fill="currentColor" />
          <circle cx="21" cy="14" r="1.5" fill="currentColor" />
          <path d="M12 20c1 1 3 0 4 1s3-1 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 7c1 1 1 3-1 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <circle cx="21.5" cy="11.5" r="0.6" fill="currentColor" opacity="0.5" />
        </svg>
      );
    case 'proud':
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="11" cy="13" r="1.5" fill="currentColor" />
          <circle cx="21" cy="13" r="1.5" fill="currentColor" />
          <path d="M10 19c2 3 10 3 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 6l3 2 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Main panel ─────────────────────────────────────────────── */

interface InlineMoodPanelProps {
  /** When user plants, this fires with the chosen tile grid position */
  onPlantRequest?: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  /** If set, the panel enters "edit" mode for this existing tile */
  editingTile?: GardenTile | null;
  /** Called after a successful edit so the parent can deselect */
  onEditDone?: () => void;
  /** Guest users — panel shows locked state instead of plant form */
  isGuest?: boolean;
  /** Called when a guest taps a protected action */
  onGuestAction?: () => void;
}

/** Parse "happy_bloom" → { mood: "happy", variant: "bloom" } */
function parseTileType(tt: string): { mood: MoodType; variant: string } | null {
  const parts = tt.split('_');
  if (parts.length < 2) return null;
  const variant = parts.pop()!;
  const mood = parts.join('_') as MoodType;
  if (!MOOD_OPTIONS.find((m) => m.type === mood)) return null;
  return { mood, variant };
}

export function InlineMoodPanel({
  onPlantRequest, expanded, onToggleExpand, editingTile, onEditDone, isGuest, onGuestAction,
}: InlineMoodPanelProps) {
  const { log } = useMoodLog();
  const updateTile = useGardenStore((s) => s.updateTile);
  const waterTile = useGardenStore((s) => s.waterTile);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<Intensity>(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWatering, setShowWatering] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!editingTile;

  // Only allow editing tiles planted today
  const isTodayTile = useMemo(() => {
    if (!editingTile) return false;
    try {
      return isToday(parseISO(editingTile.placed_at));
    } catch { return false; }
  }, [editingTile]);

  // Old tiles are view-only: can water but not change mood/intensity
  const isReadOnly = isEditMode && !isTodayTile;

  // Can this tile be watered? (only sprout → standard, standard → bloom)
  const canWater = useMemo(() => {
    if (!editingTile) return false;
    const variant = editingTile.tile_type.split('_').pop();
    return variant === 'sprout' || variant === 'standard';
  }, [editingTile]);

  const tileLabel = useMemo(() => {
    if (!editingTile) return '';
    return getTileLabel(editingTile.tile_type);
  }, [editingTile]);

  const tileGrowthLabel = useMemo(() => {
    if (!editingTile) return '';
    const variant = editingTile.tile_type.split('_').pop();
    if (variant === 'sprout') return 'seedling — water to grow';
    if (variant === 'standard') return 'growing — water to bloom';
    return 'fully bloomed';
  }, [editingTile]);

  // When editingTile changes, populate mood/intensity from the tile
  useEffect(() => {
    if (editingTile) {
      const parsed = parseTileType(editingTile.tile_type);
      if (parsed) {
        setSelectedMood(parsed.mood);
        // Derive intensity from variant
        const variantIntensity: Record<string, Intensity> = {
          sprout: 1, standard: 3, bloom: 5,
        };
        setIntensity(variantIntensity[parsed.variant] ?? 3);
      }
    }
  }, [editingTile]);

  const selectedOption = MOOD_OPTIONS.find((m) => m.type === selectedMood);

  // Scroll selected mood into view
  useEffect(() => {
    if (selectedMood && stripRef.current) {
      const idx = MOOD_OPTIONS.findIndex((m) => m.type === selectedMood);
      const child = stripRef.current.children[idx] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedMood]);

  const handleSubmit = async () => {
    if (!selectedMood || isSubmitting) return;
    setIsSubmitting(true);

    if (isEditMode && editingTile) {
      // ── Edit mode: update the tile's mood type ──
      const variant: string = intensity <= 2 ? 'sprout' : intensity <= 4 ? 'standard' : 'bloom';
      const newTileType: TileType = `${selectedMood}_${variant}` as TileType;
      await updateTile(editingTile.id, newTileType);
      setIsSubmitting(false);
      setSelectedMood(null);
      setNote('');
      setIntensity(3);
      onEditDone?.();
    } else {
      // ── Plant mode: log mood + plant a new tile ──
      setShowWatering(true);
      await log(selectedMood, intensity, note.trim() || null);

      setTimeout(() => {
        setShowWatering(false);
        setIsSubmitting(false);
        setSelectedMood(null);
        setNote('');
        setIntensity(3);
        onPlantRequest?.();
      }, 1800);
    }
  };

  const handleWateringComplete = () => {
    // Animation finished — no-op, reset is handled by the timeout above
  };

  return (
    <>
      <div className="mood-panel">
        {/* ── Drag handle + expand toggle ───────────── */}
        <button
          onClick={onToggleExpand}
          className="w-full flex flex-col items-center pt-1.5 pb-1 cursor-pointer bg-transparent focus:outline-none"
        >
          <div className="mood-panel-handle" />
          <div className="flex items-center gap-1 mt-1">
            {expanded
              ? <ChevronDown size={14} className="text-ink/30" />
              : <ChevronUp size={14} className="text-ink/30" />
            }
            <span className="text-sm text-ink/40 font-display font-semibold">
              {expanded
                ? 'collapse'
                : isGuest
                  ? 'sign in to plant'
                  : isReadOnly
                    ? 'view plant'
                    : isEditMode
                      ? 'edit plant'
                      : 'log a mood'
              }
            </span>
          </div>
        </button>

        {/* ── Mood strip (always visible) ───────────── */}
        <div className="px-2 pb-1">
          <div className="mood-strip" ref={stripRef}>
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood.type;
              return (
                <button
                  key={mood.type}
                  onClick={() => {
                    if (isReadOnly) return; // old tiles can't change mood
                    setSelectedMood(mood.type);
                    // Haptic feedback on mobile
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  disabled={isReadOnly}
                  className={`mood-chip ${isSelected ? 'selected' : ''}`}
                  style={{
                    color: mood.colour,
                    borderColor: isSelected ? mood.colour : 'transparent',
                    opacity: isReadOnly && !isSelected ? 0.35 : undefined,
                  }}
                >
                  <div className="mood-chip-icon">
                    <MoodMiniIcon mood={mood.type} size={isSelected ? 36 : 30} />
                  </div>
                  <span className="mood-chip-label">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Expanded details ──────────────────────── */}
        <AnimatePresence>
          {expanded && selectedMood && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* ── Read-only notice for old tiles ── */}
                {isReadOnly && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-latte/8 border border-latte/15">
                    <Lock size={13} className="text-ink/30 shrink-0" />
                    <span className="text-xs text-ink/40 font-display">
                      planted on {new Date(editingTile!.placed_at).toLocaleDateString()} — you can water but not change it
                    </span>
                  </div>
                )}

                {/* ── Intensity + Preview row ──── */}
                <div className="flex items-center gap-3">
                  {/* Intensity smooth slider */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-display text-ink/50">intensity</span>
                      <span className="text-xs font-display text-ink/70 font-semibold"
                            style={{ fontFamily: 'var(--font-journal)', fontSize: '0.85rem' }}>
                        {['a bit', 'a little', 'moderate', 'quite', 'very'][intensity - 1]}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={intensity}
                        onChange={(e) => { if (!isReadOnly) setIntensity(Number(e.target.value) as Intensity); }}
                        disabled={isReadOnly}
                        className="intensity-slider"
                        style={{
                          '--slider-color': selectedOption?.colour ?? 'var(--latte)',
                          '--slider-progress': `${((intensity - 1) / 4) * 100}%`,
                          opacity: isReadOnly ? 0.5 : undefined,
                        } as React.CSSProperties}
                      />
                      {/* Scale labels */}
                      <div className="flex justify-between px-[2px] mt-1.5">
                        <span className="text-[10px] text-ink/30 font-display">slightly</span>
                        <span className="text-[10px] text-ink/30 font-display">intensely</span>
                      </div>
                    </div>
                  </div>

                  {/* Plant preview */}
                  <div className="flex flex-col items-center">
                    <PlantPreview mood={selectedMood} intensity={intensity} />
                    <span className="text-[10px] text-ink/30 font-display mt-0.5">preview</span>
                  </div>
                </div>

                {/* ── Note ──── */}
                {!isReadOnly && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (selectedMood && !isSubmitting) handleSubmit();
                    }
                  }}
                  maxLength={280}
                  rows={2}
                  placeholder="what's on your mind... (optional)"
                  className="w-full bg-parchment/60 rounded-xl border border-latte/8 px-3 py-2.5
                             text-ink text-sm placeholder:text-ink/20
                             resize-none focus:outline-none focus:ring-1 focus:ring-sage/30
                             transition-all"
                  style={{ fontFamily: 'var(--font-journal)', fontSize: '0.95rem', lineHeight: '1.5' }}
                />
                )}

                {/* ── Submit ──── */}
                <div className="flex gap-2">
                  {isEditMode && canWater && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (!editingTile) return;
                        setShowWatering(true);
                        waterTile(editingTile.id);
                        setTimeout(() => {
                          setShowWatering(false);
                          onEditDone?.();
                        }, 1800);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5
                                 rounded-xl font-display font-bold text-sm
                                 bg-mist/20 text-mist border border-mist/30
                                 hover:bg-mist/30 transition-colors"
                    >
                      <Droplets size={15} />
                      <span>water</span>
                    </motion.button>
                  )}
                  {!isReadOnly && (
                  <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={isGuest ? onGuestAction : handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             rounded-xl font-display font-bold text-sm
                             bg-sage text-cream shadow-sm shadow-sage/20
                             hover:bg-sage/90 disabled:opacity-50 disabled:pointer-events-none
                             transition-colors"
                  style={selectedOption && !isGuest ? {
                    backgroundColor: selectedOption.colour,
                  } : undefined}
                >
                  {isGuest ? (
                    <>
                      <Sparkles size={15} />
                      <span>sign in to plant</span>
                    </>
                  ) : isEditMode ? (
                    <>
                      <Pencil size={15} />
                      <span>save changes</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>plant it</span>
                      <Send size={14} />
                    </>
                  )}
                </motion.button>
                  )}
                </div>

                {/* ── Tile growth info (edit mode) ──── */}
                {isEditMode && editingTile && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-ink/35 font-body">{tileLabel}</span>
                    <span className="text-xs text-ink/20">·</span>
                    <span className="text-xs font-body" style={{
                      color: canWater ? 'var(--mist)' : 'var(--sage)',
                    }}>{tileGrowthLabel}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quick-plant shortcut (collapsed, mood selected) ── */}
        <AnimatePresence>
          {!expanded && selectedMood && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2 flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value) as Intensity)}
                    className="intensity-slider intensity-slider--mini"
                    style={{
                      '--slider-color': selectedOption?.colour ?? 'var(--latte)',
                      '--slider-progress': `${((intensity - 1) / 4) * 100}%`,
                    } as React.CSSProperties}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onToggleExpand()}
                  className="text-xs font-display text-ink/40 underline underline-offset-2"
                >
                  more
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={isGuest ? onGuestAction : handleSubmit}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg font-display font-bold text-sm
                             text-cream shadow-sm transition-colors disabled:opacity-50"
                  style={{ backgroundColor: isGuest ? 'var(--latte)' : (selectedOption?.colour ?? 'var(--sage)') }}
                >
                  {isGuest ? 'sign in' : isEditMode ? 'save' : 'plant'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Watering overlay */}
      <WateringAnimation isPlaying={showWatering} onComplete={handleWateringComplete} />
    </>
  );
}
