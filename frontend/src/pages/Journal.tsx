// ── Journal page — storybook diary ──────────────────────────

import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Feather, BookOpen, ChevronDown,
  X, Droplets, Sparkles, Send, Pencil, Check, Trash2, Bookmark, BookmarkCheck,
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoodLog } from '@/hooks/useMoodLog';
import { MOOD_OPTIONS } from '@/types/mood';
import type { MoodEntry, MoodType, Intensity, WeatherType } from '@/types/mood';
import { getTileLabel, getWeatherLabel } from '@/lib/mood';
import '@/styles/journal.css';

/* ── Mood colour lookup ───────────────────────────────────── */
const MOOD_COLORS: Record<MoodType, string> = {
  happy: '#E8C84A', calm: '#8BAF7A', sad: '#9AB0C4', stressed: '#4A3F5C',
  excited: '#D4876A', neutral: '#3D2F24', grateful: '#C4956A', tired: '#B89AB8',
  anxious: '#B0896E', hopeful: '#7ABFAF', angry: '#C46A5A',
  loved: '#C48A9A', confused: '#9A8AB8', proud: '#D4A84A',
};

/* ── Tiny SVG mood icons (no emoji) ────────────────────────── */
function MoodIcon({ mood, size = 20 }: { mood: MoodType; size?: number }) {
  const s = size;
  const c = MOOD_COLORS[mood];
  switch (mood) {
    case 'happy':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="13" r="1.5" fill={c}/><circle cx="21" cy="13" r="1.5" fill={c}/><path d="M10 19c2 3 10 3 12 0" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'calm':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M10 14h4M18 14h4" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M12 20c1.5 1.5 6.5 1.5 8 0" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'sad':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="13" r="1.5" fill={c}/><circle cx="21" cy="13" r="1.5" fill={c}/><path d="M11 22c2-3 8-3 10 0" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'stressed':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M9 11l5 3M23 11l-5 3" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="15" r="1.5" fill={c}/><circle cx="21" cy="15" r="1.5" fill={c}/><path d="M11 21h10" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'excited':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M9 12c1-2 4-2 5 0M18 12c1-2 4-2 5 0" stroke={c} strokeWidth="2" strokeLinecap="round"/><ellipse cx="16" cy="21" rx="4" ry="3" stroke={c} strokeWidth="2"/></svg>);
    case 'neutral':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="14" r="1.5" fill={c}/><circle cx="21" cy="14" r="1.5" fill={c}/><path d="M11 20h10" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'grateful':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="13" r="1.5" fill={c}/><circle cx="21" cy="13" r="1.5" fill={c}/><path d="M10 19c2 3 10 3 12 0" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M16 6l1.5 3 3-.5-2 2.5 1 3-3-1.5L13.5 14l1-3-2-2.5 3 .5z" fill={c} opacity="0.3"/></svg>);
    case 'tired':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M9 14h5M18 14h5" stroke={c} strokeWidth="2" strokeLinecap="round"/><ellipse cx="16" cy="21" rx="3" ry="2" stroke={c} strokeWidth="2"/></svg>);
    case 'anxious':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="12" r="2.5" stroke={c} strokeWidth="1.5" fill="none"/><circle cx="21" cy="12" r="2.5" stroke={c} strokeWidth="1.5" fill="none"/><circle cx="11" cy="12" r="1" fill={c}/><circle cx="21" cy="12" r="1" fill={c}/><path d="M11 21c1-0.5 2-1 5-1s4 0.5 5 1" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/></svg>);
    case 'hopeful':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="13" r="1.5" fill={c}/><circle cx="21" cy="13" r="1.5" fill={c}/><path d="M11 19c2 2.5 8 2.5 10 0" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M16 5l1 2h2l-1.5 1.5.5 2L16 9.5 14 10.5l.5-2L13 7h2z" fill={c} opacity="0.4"/></svg>);
    case 'angry':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M8 11l5 2M24 11l-5 2" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="15" r="1.5" fill={c}/><circle cx="21" cy="15" r="1.5" fill={c}/><path d="M11 22c2-2.5 8-2.5 10 0" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'loved':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><path d="M8 12c0-2 2-4 4-2s-4 5-4 5-4-3-4-5 2-2 4 0z" fill={c} opacity="0.5" transform="translate(2,-1)"/><path d="M18 12c0-2 2-4 4-2s-4 5-4 5-4-3-4-5 2-2 4 0z" fill={c} opacity="0.5" transform="translate(2,-1)"/><path d="M11 20c2 2.5 8 2.5 10 0" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>);
    case 'confused':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="13" r="1.5" fill={c}/><circle cx="21" cy="13" r="1.5" fill={c}/><path d="M11 20c1 1 3-1 5 0s3-1 5 0" stroke={c} strokeWidth="2" strokeLinecap="round"/><text x="23" y="9" fill={c} fontSize="8" fontWeight="bold">?</text></svg>);
    case 'proud':
      return (<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke={c} strokeWidth="2"/><circle cx="11" cy="14" r="1.5" fill={c}/><circle cx="21" cy="14" r="1.5" fill={c}/><path d="M10 19c2 3 10 3 12 0" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M10 7l2-3 4 2 4-2 2 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/></svg>);
    default: return null;
  }
}

/* ── Decorative petal corner SVG ───────────────────────────── */
function PetalCorner({ className }: { className?: string }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M4 44C4 28 12 12 44 4" stroke="var(--sage)" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
      <circle cx="44" cy="4" r="3" fill="var(--sage)" opacity="0.12" />
      <circle cx="36" cy="10" r="2" fill="var(--gold)" opacity="0.10" />
      <circle cx="28" cy="18" r="1.5" fill="var(--terra)" opacity="0.08" />
      <path d="M42 6c-3 1-4 4-2 6s5 1 6-2-1-5-4-4z" fill="var(--sage)" opacity="0.08" />
    </svg>
  );
}

/* ── Intensity dots ────────────────────────────────────────── */
function IntensityDots({ value, color, size = 4 }: { value: number; color: string; size?: number }) {
  return (
    <div className="j-intensity-dots">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="j-intensity-dot"
          style={{
            width: size, height: size,
            backgroundColor: i <= value ? color : 'rgba(61,47,36,0.1)',
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ENTRY DETAIL MODAL
   ══════════════════════════════════════════════════════════════ */

function EntryDetail({
  entry,
  onClose,
  onUpdate,
  onDelete,
  isPinned,
  onTogglePin,
}: {
  entry: MoodEntry;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<MoodEntry>) => void;
  onDelete: (id: string) => void;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
}) {
  const moodOpt = MOOD_OPTIONS.find((m) => m.type === entry.mood_type);
  const moodColor = MOOD_COLORS[entry.mood_type];
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editable fields
  const [editMood, setEditMood] = useState<MoodType>(entry.mood_type);
  const [editIntensity, setEditIntensity] = useState<Intensity>(entry.intensity);
  const [editNote, setEditNote] = useState(entry.note ?? '');

  const editColor = MOOD_COLORS[editMood];
  const editOption = MOOD_OPTIONS.find((m) => m.type === editMood);

  const handleSave = () => {
    onUpdate(entry.id, {
      mood_type: editMood,
      intensity: editIntensity,
      note: editNote.trim() || null,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditMood(entry.mood_type);
    setEditIntensity(entry.intensity);
    setEditNote(entry.note ?? '');
    setIsEditing(false);
  };

  return (
    <motion.div
      className="j-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="j-detail-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative petals */}
        <PetalCorner className="j-detail-petal j-detail-petal--tr" />

        {/* Handle bar */}
        <div className="j-detail-handle-row">
          <div className="j-detail-handle" />
        </div>

        {/* Header */}
        <div className="j-detail-header">
          <div className="j-detail-header-left">
            <div className="j-detail-mood-ring" style={{ borderColor: isEditing ? editColor : moodColor }}>
              <MoodIcon mood={isEditing ? editMood : entry.mood_type} size={28} />
            </div>
            <div>
              <h2 className="j-detail-mood-name" style={{ color: isEditing ? editColor : moodColor }}>
                {isEditing ? editOption?.label : moodOpt?.label}
              </h2>
              <p className="j-detail-time">
                {format(parseISO(entry.logged_at), 'EEEE, MMMM d · h:mm a')}
              </p>
            </div>
          </div>
          <div className="j-detail-header-right">
            {!isEditing && (
              <button
                onClick={() => onTogglePin(entry.id)}
                className={`j-pin-btn ${isPinned ? 'j-pin-btn--active' : ''}`}
                title={isPinned ? 'Unpin entry' : 'Pin entry'}
              >
                {isPinned ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            )}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="j-detail-edit-btn">
                <Pencil size={14} />
                <span>edit</span>
              </button>
            ) : (
              <button onClick={onClose} className="j-detail-close-btn">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── View mode ──────────── */}
        {!isEditing && (
          <div className="j-detail-body">
            {/* Intensity */}
            <div className="j-detail-field">
              <span className="j-detail-field-label">intensity</span>
              <div className="j-detail-field-row">
                <IntensityDots value={entry.intensity} color={moodColor} size={6} />
                <span className="j-detail-field-value">
                  {['a bit', 'a little', 'moderate', 'quite', 'very'][entry.intensity - 1]}
                </span>
              </div>
            </div>

            {/* Tile & Weather */}
            <div className="j-detail-meta-row">
              <div className="j-detail-meta-chip">
                <Sparkles size={11} />
                <span>{getTileLabel(entry.tile_type)}</span>
              </div>
              <div className="j-detail-meta-chip">
                <Droplets size={11} />
                <span>{getWeatherLabel(entry.weather_type as WeatherType)}</span>
              </div>
            </div>

            {/* Note */}
            {entry.note ? (
              <div className="j-detail-note-container">
                <Feather size={13} className="j-detail-note-icon" />
                <p className="j-detail-note">{entry.note}</p>
              </div>
            ) : (
              <div className="j-detail-note-empty">
                <Feather size={16} />
                <p>no note written — tap edit to add one</p>
              </div>
            )}

            {/* Delete */}
            {confirmDelete ? (
              <div className="j-delete-confirm">
                <p className="j-delete-confirm-text">delete this entry?</p>
                <div className="j-delete-confirm-actions">
                  <button
                    className="j-delete-confirm-yes"
                    onClick={() => { onDelete(entry.id); onClose(); }}
                  >
                    yes, delete
                  </button>
                  <button
                    className="j-delete-confirm-no"
                    onClick={() => setConfirmDelete(false)}
                  >
                    cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="j-delete-btn"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={13} />
                <span>delete entry</span>
              </button>
            )}

            {/* Close button */}
            <button onClick={onClose} className="j-detail-done-btn">
              done
            </button>
          </div>
        )}

        {/* ── Edit mode ──────────── */}
        {isEditing && (
          <motion.div
            className="j-detail-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Mood selector */}
            <div className="j-detail-field">
              <span className="j-detail-field-label">how were you feeling?</span>
              <div className="j-edit-mood-grid">
                {MOOD_OPTIONS.map((m) => {
                  const isSelected = editMood === m.type;
                  return (
                    <button
                      key={m.type}
                      onClick={() => setEditMood(m.type)}
                      className={`j-edit-mood-btn ${isSelected ? 'j-edit-mood-btn--active' : ''}`}
                      style={{
                        borderColor: isSelected ? MOOD_COLORS[m.type] : 'transparent',
                        color: MOOD_COLORS[m.type],
                      }}
                    >
                      <MoodIcon mood={m.type} size={20} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity slider */}
            <div className="j-detail-field">
              <div className="j-edit-intensity-header">
                <span className="j-detail-field-label">intensity</span>
                <span className="j-edit-intensity-word" style={{ color: editColor }}>
                  {['a bit', 'a little', 'moderate', 'quite', 'very'][editIntensity - 1]}
                </span>
              </div>
              <input
                type="range"
                min={1} max={5} step={1}
                value={editIntensity}
                onChange={(e) => setEditIntensity(Number(e.target.value) as Intensity)}
                className="intensity-slider"
                style={{
                  '--slider-color': editColor,
                  '--slider-progress': `${((editIntensity - 1) / 4) * 100}%`,
                } as React.CSSProperties}
              />
              <div className="j-edit-intensity-ticks">
                {[1, 2, 3, 4, 5].map((v) => (
                  <div key={v} className="j-edit-tick" style={{
                    backgroundColor: v <= editIntensity ? editColor : 'rgba(61,47,36,0.12)',
                  }} />
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="j-detail-field">
              <span className="j-detail-field-label">your thoughts</span>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="what was on your mind..."
                className="j-edit-note"
              />
              <span className="j-edit-char-count">{editNote.length}/500</span>
            </div>

            {/* Action buttons */}
            <div className="j-edit-actions">
              <button onClick={handleCancel} className="j-edit-cancel-btn">cancel</button>
              <button onClick={handleSave} className="j-edit-save-btn" style={{ backgroundColor: editColor }}>
                <Check size={14} />
                <span>save</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEW ENTRY COMPOSER
   ══════════════════════════════════════════════════════════════ */

function NewEntryComposer({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (mood: MoodType, intensity: Intensity, note: string | null) => Promise<void>;
}) {
  const [mood, setMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<Intensity>(3);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const moodColor = mood ? MOOD_COLORS[mood] : 'var(--latte)';

  const handleSend = async () => {
    if (!mood || submitting) return;
    setSubmitting(true);
    await onSubmit(mood, intensity, note.trim() || null);
    setSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      className="j-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="j-detail-sheet j-composer-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <PetalCorner className="j-detail-petal j-detail-petal--tr" />

        <div className="j-detail-handle-row">
          <div className="j-detail-handle" />
        </div>

        <div className="j-composer-header">
          <Feather size={18} className="j-composer-icon" />
          <h2 className="j-composer-title">new entry</h2>
          <button onClick={onClose} className="j-detail-close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="j-detail-body">
          {/* Mood grid */}
          <div className="j-detail-field">
            <span className="j-detail-field-label">how are you feeling right now?</span>
            <div className="j-edit-mood-grid">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = mood === m.type;
                return (
                  <button
                    key={m.type}
                    onClick={() => setMood(m.type)}
                    className={`j-edit-mood-btn ${isSelected ? 'j-edit-mood-btn--active' : ''}`}
                    style={{
                      borderColor: isSelected ? MOOD_COLORS[m.type] : 'transparent',
                      color: MOOD_COLORS[m.type],
                    }}
                  >
                    <MoodIcon mood={m.type} size={20} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {mood && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* Intensity */}
              <div className="j-detail-field">
                <div className="j-edit-intensity-header">
                  <span className="j-detail-field-label">intensity</span>
                  <span className="j-edit-intensity-word" style={{ color: moodColor }}>
                    {['a bit', 'a little', 'moderate', 'quite', 'very'][intensity - 1]}
                  </span>
                </div>
                <input
                  type="range"
                  min={1} max={5} step={1}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value) as Intensity)}
                  className="intensity-slider"
                  style={{
                    '--slider-color': moodColor,
                    '--slider-progress': `${((intensity - 1) / 4) * 100}%`,
                  } as React.CSSProperties}
                />
                <div className="j-edit-intensity-ticks">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div key={v} className="j-edit-tick" style={{
                      backgroundColor: v <= intensity ? moodColor : 'rgba(61,47,36,0.12)',
                    }} />
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="j-detail-field">
                <span className="j-detail-field-label">write your thoughts</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="dear journal..."
                  className="j-edit-note"
                  autoFocus
                />
                <span className="j-edit-char-count">{note.length}/500</span>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={submitting}
                className="j-composer-submit"
                style={{ backgroundColor: moodColor }}
              >
                <Sparkles size={15} />
                <span>{submitting ? 'planting...' : 'plant & write'}</span>
                <Send size={14} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN JOURNAL PAGE
   ══════════════════════════════════════════════════════════════ */

export default function Journal() {
  const navigate = useNavigate();
  const { entries, log, updateEntry, deleteEntry } = useMoodLog();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('bloom-pinned-entries') ?? '[]'))
  );

  const handleTogglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('bloom-pinned-entries', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteEntry(id);
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem('bloom-pinned-entries', JSON.stringify([...next]));
      return next;
    });
  }, [deleteEntry]);

  const grouped = useMemo(() => {
    const filtered = search
      ? entries.filter(
          (e) =>
            e.note?.toLowerCase().includes(search.toLowerCase()) ||
            e.mood_type.includes(search.toLowerCase()),
        )
      : entries;

    const groups = new Map<string, typeof entries>();
    for (const entry of filtered) {
      const key = entry.logged_date;
      const arr = groups.get(key) ?? [];
      arr.push(entry);
      groups.set(key, arr);
    }
    // Sort each day: pinned first, then by time desc
    groups.forEach((dayEntries, key) => {
      groups.set(key, [...dayEntries].sort((a, b) => {
        const aPin = pinnedIds.has(a.id) ? 0 : 1;
        const bPin = pinnedIds.has(b.id) ? 0 : 1;
        if (aPin !== bPin) return aPin - bPin;
        return b.logged_at.localeCompare(a.logged_at);
      }));
    });
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [entries, search, pinnedIds]);

  const openEntry = useMemo(
    () => (openEntryId ? entries.find((e) => e.id === openEntryId) ?? null : null),
    [entries, openEntryId],
  );

  const handleUpdate = useCallback(
    (id: string, updates: Partial<MoodEntry>) => {
      updateEntry(id, updates);
    },
    [updateEntry],
  );

  const handleNewEntry = useCallback(
    async (mood: MoodType, intensity: Intensity, note: string | null) => {
      await log(mood, intensity, note);
    },
    [log],
  );

  function formatDayLabel(dateStr: string) {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'today';
    if (isYesterday(d)) return 'yesterday';
    return format(d, 'EEEE, MMMM d');
  }

  function getDayMoodSummary(dayEntries: MoodEntry[]) {
    const counts: Record<string, number> = {};
    for (const e of dayEntries) counts[e.mood_type] = (counts[e.mood_type] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([m]) => m as MoodType);
  }

  return (
    <div className="j-page">
      {/* ── Decorative background ──────────────────── */}
      <div className="j-bg">
        <div className="j-bg-leaf j-bg-leaf--1" />
        <div className="j-bg-leaf j-bg-leaf--2" />
        <div className="j-bg-leaf j-bg-leaf--3" />
      </div>

      {/* ── Header ────────────────────────────────── */}
      <header className="j-header">
        <div className="j-header-top">
          <button onClick={() => navigate('/')} className="j-back-btn" aria-label="Back">
            <ArrowLeft size={20} />
          </button>

          <div className="j-header-title">
            <BookOpen size={18} className="j-header-book" />
            <div>
              <h1 className="j-title">my journal</h1>
              <p className="j-subtitle">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="j-search-toggle"
            aria-label="Search"
          >
            {searchOpen ? <X size={17} /> : <Search size={17} />}
          </button>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="j-search-bar">
                <Search size={14} className="j-search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="search your thoughts..."
                  className="j-search-input"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch('')} className="j-search-clear">
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Entries list ─────────────────────────── */}
      <div className="j-body">
        {grouped.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="j-empty"
          >
            <div className="j-empty-icon-ring">
              <Feather size={28} />
            </div>
            <p className="j-empty-title">
              {search ? 'no entries match' : 'your journal is waiting'}
            </p>
            <p className="j-empty-sub">
              {search ? 'try different words' : 'plant your first mood to start writing your story'}
            </p>
            {!search && (
              <button onClick={() => setShowComposer(true)} className="j-empty-cta">
                <Plus size={14} />
                <span>write first entry</span>
              </button>
            )}
          </motion.div>
        )}

        {grouped.map(([dateStr, dayEntries], gi) => {
          const topMoods = getDayMoodSummary(dayEntries);
          return (
            <motion.section
              key={dateStr}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.04 }}
              className="j-day-section"
            >
              {/* Day header */}
              <div className="j-day-header">
                <div className="j-day-header-left">
                  <div className="j-day-dot-cluster">
                    {topMoods.map((m, i) => (
                      <span key={m} className="j-day-dot" style={{ backgroundColor: MOOD_COLORS[m], zIndex: 3 - i }} />
                    ))}
                  </div>
                  <div>
                    <h2 className="j-day-label">{formatDayLabel(dateStr)}</h2>
                    <span className="j-day-count">
                      {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                </div>
                <span className="j-day-date">{format(parseISO(dateStr), 'MMM d')}</span>
              </div>

              {/* Day's entries */}
              <div className="j-day-entries">
                {dayEntries.map((entry, i) => {
                  const opt = MOOD_OPTIONS.find((m) => m.type === entry.mood_type);
                  const color = MOOD_COLORS[entry.mood_type];
                  return (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.04 + i * 0.03 }}
                      onClick={() => setOpenEntryId(entry.id)}
                      className="j-entry-card"
                    >
                      {/* Left accent line */}
                      <div className="j-entry-accent" style={{ backgroundColor: color }} />

                      <div className="j-entry-content">
                        <div className="j-entry-top-row">
                          <MoodIcon mood={entry.mood_type} size={18} />
                          <span className="j-entry-mood" style={{ color }}>
                            {opt?.label}
                          </span>
                          <IntensityDots value={entry.intensity} color={color} />
                          {pinnedIds.has(entry.id) && (
                            <BookmarkCheck size={12} className="j-entry-pin-badge" />
                          )}
                          <span className="j-entry-time">
                            {format(parseISO(entry.logged_at), 'h:mm a')}
                          </span>
                        </div>

                        {entry.note && (
                          <p className="j-entry-note">
                            {entry.note.length > 100 ? entry.note.slice(0, 100) + '...' : entry.note}
                          </p>
                        )}

                        <div className="j-entry-meta">
                          <span>{getTileLabel(entry.tile_type)}</span>
                          <span className="j-entry-meta-dot" />
                          <span>{getWeatherLabel(entry.weather_type as WeatherType)}</span>
                        </div>
                      </div>

                      <ChevronDown size={14} className="j-entry-chevron" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}

        {/* Bottom spacer */}
        <div className="h-28" />
      </div>

      {/* ── FAB: New entry ───────────────────────── */}
      <motion.button
        className="j-fab"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowComposer(true)}
      >
        <Plus size={20} />
        <span>new entry</span>
      </motion.button>

      {/* ── Entry detail modal ───────────────────── */}
      <AnimatePresence>
        {openEntry && (
          <EntryDetail
            key={openEntry.id}
            entry={openEntry}
            onClose={() => setOpenEntryId(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isPinned={pinnedIds.has(openEntry.id)}
            onTogglePin={handleTogglePin}
          />
        )}
      </AnimatePresence>

      {/* ── New entry composer ───────────────────── */}
      <AnimatePresence>
        {showComposer && (
          <NewEntryComposer
            onClose={() => setShowComposer(false)}
            onSubmit={handleNewEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
