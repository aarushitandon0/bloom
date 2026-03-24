// ── World Map — explore anonymous gardens ──────────────────

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Heart, Flower2, X, MessageCircleHeart, TreePine, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore, KIND_PRESETS, type WorldGarden } from '@/stores/worldStore';
import { MOOD_OPTIONS } from '@/types/mood';
import '@/styles/world.css';

/* ── Mood-to-colour mapping ──────────────────────────────── */
const MOOD_COLOURS: Record<string, string> = {
  happy: '#E8B931', calm: '#8BAF7A', sad: '#8FA5B8',
  stressed: '#6B5B8A', excited: '#C4956A', neutral: '#5A4A3A',
  grateful: '#C4956A', tired: '#9B7FB8',
};

const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.type, m.label]),
);

/* ── Floating island component ───────────────────────────── */

function FloatingIsland({
  garden,
  isSelected,
  onSelect,
  index,
}: {
  garden: WorldGarden;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const moodCol = MOOD_COLOURS[garden.moodType] ?? '#8BAF7A';

  // Gentle floating animation offset
  const floatY = Math.sin(Date.now() / 2000 + index * 1.3) * 4;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.15 : 1,
        y: floatY,
      }}
      transition={{
        opacity: { delay: index * 0.08, duration: 0.4 },
        scale: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      onClick={onSelect}
      className="world-island"
      title={`${garden.gardenName} · feeling ${MOOD_LABELS[garden.moodType]?.toLowerCase() ?? garden.moodType} · ${garden.tileCount} plants`}
      aria-label={`Visit ${garden.gardenName}`}
      style={{
        left: `${garden.position.x * 100}%`,
        top: `${garden.position.y * 100}%`,
      }}
    >
      {/* Island base */}
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" className="world-island-svg">
        {/* Mood-tinted halo glow */}
        <circle cx="36" cy="30" r="32" fill={moodCol} opacity="0.08" />
        {/* Shadow */}
        <ellipse cx="36" cy="50" rx="28" ry="5" fill="rgba(61,47,36,0.06)" />
        {/* Ground mass */}
        <ellipse cx="36" cy="34" rx="30" ry="16" fill={`hsl(${garden.islandHue}, 35%, 82%)`} />
        <ellipse cx="36" cy="32" rx="28" ry="14" fill={`hsl(${garden.islandHue}, 40%, 88%)`} />
        {/* Grass top */}
        <ellipse cx="36" cy="30" rx="26" ry="10" fill={`hsl(${garden.islandHue > 100 ? 120 : 100}, 35%, 70%)`} />
        {/* Tiny trees based on tile count */}
        {garden.tileCount > 5 && <circle cx="22" cy="24" r="5" fill={`hsl(120,40%,55%)`} />}
        {garden.tileCount > 5 && <rect x="23" y="24" width="2" height="6" rx="1" fill="#8B6B4A" />}
        {garden.tileCount > 10 && <circle cx="42" cy="22" r="6" fill={`hsl(130,45%,50%)`} />}
        {garden.tileCount > 10 && <rect x="43" y="22" width="2" height="7" rx="1" fill="#8B6B4A" />}
        {garden.tileCount > 20 && <circle cx="32" cy="20" r="7" fill={`hsl(110,50%,48%)`} />}
        {garden.tileCount > 20 && <rect x="33" y="20" width="2" height="8" rx="1" fill="#7A5C3A" />}
        {/* Tiny cottage */}
        <rect x="30" y="25" width="10" height="8" rx="1" fill="#F5E6D0" />
        <polygon points="28,25 36,18 44,25" fill="#D4836A" />
        <rect x="33" y="29" width="3" height="4" rx="0.5" fill="#8B6B4A" />
        {/* Mood glow dot */}
        <circle cx="36" cy="12" r="4" fill={moodCol} opacity="0.8" />
        <circle cx="36" cy="12" r="6" fill={moodCol} opacity="0.2" />
      </svg>

      {/* Label */}
      <span className="world-island-name">{garden.gardenName}</span>

      {/* Note count indicator */}
      {garden.kindNotes.length > 0 && (
        <span className="world-island-notes">
          <Heart size={8} />
          {garden.kindNotes.length}
        </span>
      )}
    </motion.button>
  );
}

/* ── Garden detail popover ───────────────────────────────── */

function GardenPopover({
  garden,
  onClose,
  onSendNote,
  onVisit,
}: {
  garden: WorldGarden;
  onClose: () => void;
  onSendNote: (msg: string) => void;
  onVisit: () => void;
}) {
  const [customNote, setCustomNote] = useState('');
  const [sentFeedback, setSentFeedback] = useState(false);
  const moodCol = MOOD_COLOURS[garden.moodType] ?? '#8BAF7A';
  const moodLabel = MOOD_LABELS[garden.moodType] ?? garden.moodType;

  const handleSend = (msg: string) => {
    onSendNote(msg);
    setSentFeedback(true);
    setCustomNote('');
    setTimeout(() => setSentFeedback(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="world-popover"
    >
      {/* Close btn */}
      <button onClick={onClose} className="world-popover-close">
        <X size={16} />
      </button>

      {/* Header */}
      <div className="world-popover-header">
        <div className="world-popover-mood-dot" style={{ background: moodCol }} />
        <div>
          <h3 className="world-popover-title">{garden.gardenName}</h3>
          <p className="world-popover-subtitle">
            feeling <span style={{ color: moodCol, fontWeight: 600 }}>{moodLabel.toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="world-popover-stats">
        <div className="world-popover-stat">
          <Flower2 size={13} />
          <span>{garden.tileCount} plants</span>
        </div>
        <div className="world-popover-stat">
          <TreePine size={13} />
          <span>{garden.season}</span>
        </div>
        <div className="world-popover-stat">
          <Heart size={13} />
          <span>{garden.kindNotes.length} note{garden.kindNotes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Visit button */}
      <button className="visit-garden-btn" onClick={onVisit}>
        <Eye size={14} />
        <span>visit this garden</span>
      </button>

      {/* Kind notes received */}
      {garden.kindNotes.length > 0 && (
        <div className="world-popover-notes">
          <p className="world-popover-notes-label">kind notes left by visitors</p>
          {garden.kindNotes.slice(0, 3).map((n) => (
            <div key={n.id} className="world-popover-note">
              <MessageCircleHeart size={11} className="text-terra/50 flex-shrink-0 mt-0.5" />
              <span>{n.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Send a kind note */}
      <div className="world-popover-send">
        <p className="world-popover-send-label">
          <Sparkles size={12} /> leave a kind note
        </p>

        {/* Quick presets */}
        <div className="world-popover-presets">
          {KIND_PRESETS.slice(0, 4).map((msg) => (
            <button key={msg} className="world-preset-btn" onClick={() => handleSend(msg)}>
              {msg}
            </button>
          ))}
        </div>

        {/* Custom note */}
        <div className="world-popover-custom">
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="write something kind..."
            maxLength={120}
            className="world-custom-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customNote.trim()) handleSend(customNote.trim());
            }}
          />
          <button
            onClick={() => customNote.trim() && handleSend(customNote.trim())}
            disabled={!customNote.trim()}
            className="world-send-btn"
          >
            <Send size={14} />
          </button>
        </div>

        {/* Sent feedback */}
        <AnimatePresence>
          {sentFeedback && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="world-sent-msg"
            >
              <Heart size={11} /> note sent with love!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Decorative floating particles ───────────────────────── */

function FloatingParticles() {
  const particles = useMemo(() => {
    const p = [];
    for (let i = 0; i < 20; i++) {
      p.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        type: Math.random() > 0.6 ? 'star' : 'dot',
      });
    }
    return p;
  }, []);

  return (
    <div className="world-particles">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`world-particle world-particle--${p.type}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8],
            y: [0, -8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main WorldMap page ──────────────────────────────────── */

export default function WorldMap() {
  const navigate = useNavigate();
  const { gardens, selectedGardenId, isLoading, fetchGardens, selectGarden, sendKindNote } = useWorldStore();

  const selectedGarden = useMemo(
    () => gardens.find((g) => g.id === selectedGardenId) ?? null,
    [gardens, selectedGardenId],
  );

  // Animation frame for gentle island floating
  const [, setTick] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    fetchGardens();
  }, [fetchGardens]);

  // Gentle animation tick for floating islands
  useEffect(() => {
    const tick = () => {
      setTick((t) => t + 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleSendNote = useCallback((msg: string) => {
    if (selectedGardenId) sendKindNote(selectedGardenId, msg);
  }, [selectedGardenId, sendKindNote]);

  return (
    <div className="world-page">
      {/* Background gradient */}
      <div className="world-bg" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Header */}
      <header className="world-header">
        <button onClick={() => navigate('/')} className="world-back-btn" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="world-header-text">
          <h1 className="world-title">bloom world</h1>
          <p className="world-subtitle">
            {gardens.length} gardens blooming · explore anonymously
          </p>
        </div>
      </header>

      {/* Map area */}
      <div className="world-map-area">
        {isLoading ? (
          <div className="world-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={24} className="text-sage/50" />
            </motion.div>
            <p className="world-loading-text">discovering gardens...</p>
          </div>
        ) : (
          <div className="world-islands-container">
            {/* Soft cloud decorations */}
            <div className="world-cloud world-cloud--1" />
            <div className="world-cloud world-cloud--2" />
            <div className="world-cloud world-cloud--3" />

            {/* Garden islands */}
            {gardens.map((g, i) => (
              <FloatingIsland
                key={g.id}
                garden={g}
                isSelected={g.id === selectedGardenId}
                onSelect={() => selectGarden(g.id === selectedGardenId ? null : g.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Popover for selected garden */}
      <AnimatePresence>
        {selectedGarden && (
          <>
            <motion.div
              className="world-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => selectGarden(null)}
            />
            <GardenPopover
              garden={selectedGarden}
              onClose={() => selectGarden(null)}
              onSendNote={handleSendNote}
              onVisit={() => navigate(`/garden/${selectedGarden.id}`)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Footer hint */}
      <div className="world-footer">
        <p className="world-footer-text">
          <Heart size={11} /> all gardens are anonymous · spread kindness
        </p>
      </div>
    </div>
  );
}
