// ── Home page — garden + inline mood panel ──────────────────

import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, Settings as SettingsIcon, Flower2, Leaf, Sparkles, Camera, Users, Globe, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { GardenCanvas } from '@/components/garden/GardenCanvas';
import { AnimalCare } from '@/components/garden/AnimalCare';
import { InlineMoodPanel } from '@/components/mood/InlineMoodPanel';
import { WeatherIndicator } from '@/components/weather/WeatherIndicator';
import { AudioToggle } from '@/components/audio/AudioToggle';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { Toast } from '@/components/ui/Toast';
import { GuestGate } from '@/components/ui/GuestGate';
import { useAuthStore } from '@/stores/authStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { useGardenStore } from '@/stores/gardenStore';
import { useMoodStore } from '@/stores/moodStore';
import { useDayNight } from '@/hooks/useDayNight';
import { MOOD_OPTIONS } from '@/types/mood';
import { shareOrDownload, generateShareCard } from '@/lib/shareCard';
import type { MoodType } from '@/types/mood';

/* ── Mood quotes (no emoji — text only) ──────────────────── */
const MOOD_QUOTES: Record<MoodType, string[]> = {
  happy:    ['you are radiant today', 'let this joy bloom freely', 'your happiness is contagious'],
  calm:     ['rest in this stillness', 'you deserve this calm', 'breathe. you are safe here'],
  excited:  ['something beautiful is growing', 'channel this spark into your garden', 'your energy lights up the world'],
  grateful: ['you notice the small wonders', 'abundance lives in your heart', 'gratitude is a superpower'],
  stressed: ['one breath at a time', 'this feeling will pass, like clouds', 'you are stronger than you know'],
  sad:      ['it\'s okay to feel this way', 'even rainy days water the garden', 'you are held, even now'],
  neutral:  ['still waters run deep', 'today is a quiet kind of good', 'peace lives in the in-between'],
  tired:    ['rest is productive too', 'be gentle with yourself today', 'small steps still move forward'],
  anxious:  ['ground yourself, you are safe', 'this storm will pass', 'breathe in courage, breathe out worry'],
  hopeful:  ['brighter days are ahead', 'your hope lights the way', 'keep planting seeds of possibility'],
  angry:    ['feel it, then release it', 'your fire can be fuel', 'even thorns protect something beautiful'],
  loved:    ['you are deeply cherished', 'love is your garden\'s sunlight', 'you radiate warmth'],
  confused: ['clarity will come with time', 'it\'s okay not to know yet', 'every tangled path still leads forward'],
  proud:    ['you earned this glow', 'stand tall like your tallest bloom', 'celebrate how far you\'ve come'],
};

export default function Home() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const isGuest = useAuthStore((s) => s.isGuest);
  const signOut = useAuthStore((s) => s.signOut);
  const currentWeather = useWeatherStore((s) => s.target);
  const tiles = useGardenStore((s) => s.tiles);
  const entries = useMoodStore((s) => s.entries);
  const dayPhase = useDayNight();
  const gardenContainerRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [guestGateOpen, setGuestGateOpen] = useState(false);

  // Latest mood for the floating badge + quote
  const latestMood = useMemo(() => {
    if (entries.length === 0) return null;
    const latest = entries[0];
    const option = MOOD_OPTIONS.find((m) => m.type === latest.mood_type);
    return option ? { label: option.label, colour: option.colour, type: latest.mood_type as MoodType, loggedAt: latest.logged_at } : null;
  }, [entries]);

  // Pick a stable-per-mood quote (changes when mood changes)
  const quote = useMemo(() => {
    if (!latestMood) return null;
    const list = MOOD_QUOTES[latestMood.type];
    // use entry count as seed for variety without random re-renders
    return list[entries.length % list.length];
  }, [latestMood, entries.length]);

  const [moodExpanded, setMoodExpanded] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  // Derive the selected tile object for the edit panel
  const selectedTile = useMemo(
    () => (selectedTileId ? tiles.find((t) => t.id === selectedTileId) ?? null : null),
    [selectedTileId, tiles],
  );

  const handleTileClick = useCallback((_col: number, _row: number, tileId: string | null) => {
    // If clicking same tile, deselect
    if (tileId && tileId === selectedTileId) {
      setSelectedTileId(null);
    } else {
      setSelectedTileId(tileId);
      // When selecting an existing tile, expand the panel for editing
      if (tileId) {
        if (isGuest) {
          setGuestGateOpen(true);
        } else {
          setMoodExpanded(true);
        }
      }
    }
    // If no tile exists, expand mood panel to encourage planting
    if (!tileId && !moodExpanded) {
      if (isGuest) {
        setGuestGateOpen(true);
      } else {
        setMoodExpanded(true);
      }
    }
  }, [selectedTileId, moodExpanded, isGuest]);

  const handlePlantRequest = useCallback(() => {
    setSelectedTileId(null);
    setMoodExpanded(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!gardenContainerRef.current || sharing) return;
    setSharing(true);
    try {
      const blob = await generateShareCard(gardenContainerRef.current, profile?.garden_name ?? 'my garden');
      await shareOrDownload(blob, profile?.garden_name ?? 'my garden');
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setSharing(false);
    }
  }, [sharing, profile?.garden_name]);

  // Greeting based on time of day
  const greeting = dayPhase === 'dawn'
    ? 'good morning'
    : dayPhase === 'day'
      ? 'good afternoon'
      : dayPhase === 'dusk'
        ? 'good evening'
        : 'good night';

  return (
    <div className="relative h-dvh w-full flex flex-col overflow-hidden bg-parchment">

      {/* ── Top bar ─────────────────────────────────── */}
      <header className="home-header relative z-30 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="home-flower-icon"
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flower2 size={22} className="text-sage drop-shadow-sm" />
          </motion.div>
          <div>
            <p className="text-sm text-ink/40 leading-none tracking-wide" style={{ fontFamily: 'var(--font-journal)' }}>
              {greeting}
            </p>
            <h1 className="text-2xl text-ink font-semibold tracking-normal leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              {isGuest ? 'guest garden' : (profile?.garden_name ?? 'my garden')}
            </h1>
          </div>
          {isGuest && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setGuestGateOpen(true)}
              className="ml-1 px-2.5 py-1 rounded-full text-xs font-display font-bold
                         bg-latte/15 text-latte border border-latte/25
                         hover:bg-latte/25 transition-colors"
            >
              guest
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div title="Your logging streak">
            <StreakBadge />
          </div>
          <div className="home-indicator-pill" title="Current weather" aria-label="Weather indicator">
            <WeatherIndicator weather={currentWeather} size={16} />
          </div>
          <div title="Toggle ambient sound">
            <AudioToggle />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            disabled={sharing}
            className="home-share-btn"
            title="Save garden snapshot"
            aria-label="Save garden snapshot"
          >
            <Camera size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (window.confirm('are you sure you want to sign out?')) {
                signOut();
              }
            }}
            className="home-share-btn"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </header>

      {/* ── Garden canvas (fills remaining space) ──── */}
      <div className="flex-1 relative min-h-0" ref={gardenContainerRef}>
        <GardenCanvas
          selectedTileId={selectedTileId}
          onTileClick={handleTileClick}
        />

        {/* ── Animal care panel (top-left of garden) ── */}
        <AnimalCare />

        {/* ── Current mood badge (top-left of garden) ── */}
        {latestMood && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="current-mood-badge"
          >
            <span
              className="current-mood-dot"
              style={{ background: latestMood.colour }}
            />
            <span className="current-mood-label">
              feeling {latestMood.label.toLowerCase()}
            </span>
          </motion.div>
        )}

        {/* ── Mood quote pill — above mood panel, not overlapping garden ── */}
        <AnimatePresence mode="wait">
          {quote && (
            <motion.div
              key={quote}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="mood-quote-strip"
            >
              <span className="mood-quote-text">{quote}</span>
              {latestMood?.loggedAt && (
                <span className="mood-quote-ago">
                  · {formatDistanceToNow(new Date(latestMood.loggedAt), { addSuffix: true })}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Garden size indicator (top-right) ── */}
        <div className="garden-size-badge">
          <Leaf size={12} />
          <span>{tiles.length} plant{tiles.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Inline mood panel (bottom) ─────────────── */}
      <InlineMoodPanel
        expanded={moodExpanded}
        onToggleExpand={() => {
          if (isGuest) {
            setGuestGateOpen(true);
          } else {
            setMoodExpanded((v) => !v);
          }
        }}
        onPlantRequest={handlePlantRequest}
        editingTile={selectedTile}
        onEditDone={() => setSelectedTileId(null)}
        isGuest={isGuest}
        onGuestAction={() => setGuestGateOpen(true)}
      />

      {/* ── Bottom nav bar ──────────────────────────── */}
      <nav className="home-nav relative z-30 flex items-center justify-around px-2 py-1.5" role="navigation" aria-label="Main navigation">
        <NavBtn icon={<BookOpen size={17} />} label="Journal" onClick={() => navigate('/journal')} />
        <NavBtn icon={<Sparkles size={17} />} label="Garden" active />
        <NavBtn icon={<Globe size={17} />} label="World" onClick={() => navigate('/world')} />
        <NavBtn icon={<BarChart3 size={17} />} label="Reflect" onClick={() => navigate('/insights')} />
        <NavBtn icon={<Users size={17} />} label="Friends" onClick={() => navigate('/shared-garden')} />
        <NavBtn icon={<SettingsIcon size={17} />} label="Settings" onClick={() => navigate('/settings')} />
      </nav>

      {/* ── Toast layer ─────────────────────────────── */}
      <Toast />

      {/* ── Guest gate ──────────────────────────────── */}
      <GuestGate
        isOpen={guestGateOpen}
        onClose={() => setGuestGateOpen(false)}
        action="grow your garden"
      />
    </div>
  );
}

/* ── Bottom nav button ──────────────────────────────────────── */

function NavBtn({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`home-nav-btn ${active ? 'home-nav-btn--active' : ''}`}
    >
      <span className="home-nav-icon">{icon}</span>
      <span className="home-nav-label">{label}</span>
    </button>
  );
}
