// ── Friend Garden — visit someone's anonymous garden ───────

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, Send, Sparkles, Flower2, TreePine,
  RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, MessageCircleHeart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore, KIND_PRESETS } from '@/stores/worldStore';
import { MOOD_OPTIONS } from '@/types/mood';
import type { ViewDirection, Season } from '@/types/garden';
import {
  drawSkyGradient, createWeatherState, renderWeather, drawCelestials,
} from '@/lib/canvas/weather';
import { applyDayNightOverlay } from '@/lib/canvas/daynight';
import { renderTileLayers } from '@/lib/canvas/tilelayer';
import { gridToScreen, getCanvasOrigin, getGridSize } from '@/lib/canvas/renderer';
import { createAnimal, updateAnimal, drawAnimal, type AnimalInstance } from '@/lib/canvas/animals';
import { drawFireflies, drawFloatingMotes } from '@/lib/canvas/events';
import { spawnSeasonParticle, drawSeasonParticle, type SeasonParticle } from '@/lib/canvas/seasons';
import { getWeatherForMood } from '@/lib/mood';
import { useDayNight } from '@/hooks/useDayNight';
import '@/styles/canvas.css';
import '@/styles/world.css';

/* ── Mood colours ────────────────────────────────────────── */
const MOOD_COLOURS: Record<string, string> = {
  happy: '#E8B931', calm: '#8BAF7A', sad: '#8FA5B8',
  stressed: '#6B5B8A', excited: '#C4956A', neutral: '#5A4A3A',
  grateful: '#C4956A', tired: '#9B7FB8',
};

export default function FriendGarden() {
  const navigate = useNavigate();
  const { gardenId } = useParams();
  const { gardens, fetchGardens, sendKindNote } = useWorldStore();
  const dayPhase = useDayNight();

  // Find the garden
  const garden = useMemo(
    () => gardens.find((g) => g.id === gardenId) ?? null,
    [gardens, gardenId],
  );

  useEffect(() => {
    if (gardens.length === 0) fetchGardens();
  }, [gardens.length, fetchGardens]);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewDirection, setViewDirection] = useState<ViewDirection>(0);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didMoveRef = useRef(false);
  const weatherStateRef = useRef(createWeatherState());
  const lastTimeRef = useRef(performance.now());
  const globalTimeRef = useRef(0);
  const animalsRef = useRef<AnimalInstance[]>([]);
  const animalsInitRef = useRef(false);
  const seasonParticlesRef = useRef<SeasonParticle[]>([]);
  const seasonSpawnRef = useRef(0);
  const viewDirRef = useRef<ViewDirection>(0);

  // Notes panel
  const [showNotes, setShowNotes] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [sentFeedback, setSentFeedback] = useState(false);

  // Derived
  const tiles = garden?.tiles ?? [];
  const gridSize = getGridSize(tiles.length);
  const season = (garden?.season ?? 'spring') as Season;
  const weather = garden ? getWeatherForMood(garden.moodType as any) : 'sunny' as const;
  const moodCol = MOOD_COLOURS[garden?.moodType ?? 'calm'] ?? '#8BAF7A';
  const moodLabel = MOOD_OPTIONS.find((m) => m.type === garden?.moodType)?.label ?? '';

  viewDirRef.current = viewDirection;

  // Init animals
  if (!animalsInitRef.current && tiles.length > 0) {
    animalsInitRef.current = true;
    const types: Array<'bird' | 'bunny' | 'butterfly' | 'cat'> = ['bird', 'bunny', 'butterfly', 'cat'];
    for (const type of types) {
      animalsRef.current.push(createAnimal(type, {
        col: 1 + Math.random() * (gridSize - 2),
        row: 1 + Math.random() * (gridSize - 2),
      }));
    }
  }

  /* ── Render loop ─────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || tiles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;
    globalTimeRef.current += delta;
    const time = globalTimeRef.current;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const _dir = viewDirRef.current;
    const _dayPhase = dayPhase;

    // 1. Sky
    drawSkyGradient(ctx, w, h, weather, _dayPhase);

    // 2. Celestials + motes
    drawCelestials(ctx, w, h, weather, _dayPhase, time);
    drawFloatingMotes(ctx, w, h, time, _dayPhase);

    // 3. Zoom + pan
    ctx.save();
    const cx = w / 2, cy = h / 2;
    ctx.translate(cx, cy);
    ctx.scale(zoomRef.current, zoomRef.current);
    ctx.translate(-cx, -cy);

    // 4. Tiles
    renderTileLayers({
      ctx, canvasWidth: w, canvasHeight: h,
      tiles, gridSize, viewDirection: _dir,
      season, cottageStyle: 'wood',
      dayPhase: _dayPhase, time,
    });

    // 5. Animals
    const base = getCanvasOrigin(w, h, gridSize);
    const origin = { x: base.x + panRef.current.x, y: base.y + panRef.current.y };
    const occupied = new Set(tiles.map((t) => `${t.grid_col},${t.grid_row}`));
    for (const animal of animalsRef.current) {
      updateAnimal(animal, delta, gridSize, occupied);
      const screen = gridToScreen(
        animal.state.position.col, animal.state.position.row,
        origin.x, origin.y, _dir, gridSize,
      );
      drawAnimal(ctx, animal, screen.x, screen.y);
    }

    // 6. Season particles
    seasonSpawnRef.current += delta;
    if (seasonSpawnRef.current > 0.2 && seasonParticlesRef.current.length < 30) {
      seasonSpawnRef.current = 0;
      const p = spawnSeasonParticle(season, w);
      if (p) seasonParticlesRef.current.push(p);
    }
    for (let i = seasonParticlesRef.current.length - 1; i >= 0; i--) {
      const p = seasonParticlesRef.current[i];
      p.x += p.vx * delta; p.y += p.vy * delta;
      p.rotation += p.rotationSpeed * delta; p.life += delta;
      if (p.life > p.maxLife || p.y > h + 20) {
        seasonParticlesRef.current.splice(i, 1);
        continue;
      }
      drawSeasonParticle(ctx, p, season);
    }

    ctx.restore();

    // 7. Weather particles
    renderWeather(ctx, weatherStateRef.current, weather, w, h, delta, 1.0);

    // 8. Events
    drawFireflies(ctx, w, h, time, _dayPhase);

    // 9. Day/night overlay
    applyDayNightOverlay(ctx, w, h, _dayPhase);
  }, [tiles, gridSize, season, weather, dayPhase]);

  useEffect(() => {
    let id: number;
    const loop = () => { render(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [render]);

  // Wheel zoom prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener('wheel', prevent, { passive: false });
    return () => canvas.removeEventListener('wheel', prevent);
  }, []);

  /* ── Pointer handlers (pan only, no editing) ── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    didMoveRef.current = false;
    dragStartRef.current = {
      x: e.clientX, y: e.clientY,
      panX: panRef.current.x, panY: panRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMoveRef.current = true;
    panRef.current = {
      x: dragStartRef.current.panX + dx / zoomRef.current,
      y: dragStartRef.current.panY + dy / zoomRef.current,
    };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const nz = Math.min(2.5, Math.max(0.5, zoomRef.current + delta));
    zoomRef.current = nz; setZoom(nz);
  }, []);

  const rotateView = useCallback((dir: 'cw' | 'ccw') => {
    setViewDirection((v) => ((v + (dir === 'cw' ? 1 : 3)) % 4) as ViewDirection);
  }, []);

  const handleSendNote = useCallback((msg: string) => {
    if (!gardenId) return;
    sendKindNote(gardenId, msg);
    setSentFeedback(true);
    setCustomNote('');
    setTimeout(() => setSentFeedback(false), 2000);
  }, [gardenId, sendKindNote]);

  /* ── Loading / not-found state ───────────────── */
  if (!garden) {
    return (
      <div className="min-h-dvh bg-parchment flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles size={24} className="text-sage/50" />
        </motion.div>
        <p style={{ fontFamily: 'var(--font-journal)' }} className="text-ink/35 mt-3 text-sm">
          finding this garden...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full flex flex-col overflow-hidden bg-parchment">

      {/* ── Header ──────────────────────────────────── */}
      <header className="visit-header relative z-30 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} className="world-back-btn" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-ink/40 leading-none tracking-wide" style={{ fontFamily: 'var(--font-journal)' }}>
              visiting
            </p>
            <h1 className="text-base text-ink font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              {garden.gardenName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mood pill */}
          <div className="visit-mood-pill" style={{ borderColor: `${moodCol}40` }}>
            <span className="visit-mood-dot" style={{ background: moodCol }} />
            <span className="visit-mood-text">{moodLabel.toLowerCase()}</span>
          </div>
          {/* Notes button */}
          <button className="visit-notes-btn" onClick={() => setShowNotes(true)}>
            <Heart size={14} />
            <span>{garden.kindNotes.length}</span>
          </button>
        </div>
      </header>

      {/* ── Garden canvas ───────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <div className="garden-viewport">
          <canvas
            ref={canvasRef}
            className="garden-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />

          {/* Controls */}
          <div className="garden-controls">
            <div className="garden-controls-row">
              <button onClick={() => rotateView('ccw')} className="ctrl-btn" title="Rotate left">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => rotateView('cw')} className="ctrl-btn" title="Rotate right">
                <RotateCw size={13} />
              </button>
            </div>
            <div className="garden-controls-row">
              <button onClick={() => { const nz = Math.max(0.5, zoomRef.current - 0.2); zoomRef.current = nz; setZoom(nz); }} className="ctrl-btn" title="Zoom out">
                <ZoomOut size={13} />
              </button>
              <button onClick={() => { const nz = Math.min(2.5, zoomRef.current + 0.2); zoomRef.current = nz; setZoom(nz); }} className="ctrl-btn" title="Zoom in">
                <ZoomIn size={13} />
              </button>
            </div>
            <div className="garden-controls-row">
              <button onClick={() => { panRef.current = { x: 0, y: 0 }; zoomRef.current = 1; setZoom(1); }} className="ctrl-btn" title="Reset view">
                <Maximize2 size={13} />
              </button>
            </div>
            {zoom !== 1 && (
              <div className="text-center">
                <span className="text-[11px] font-display text-ink/40 bg-cream/80 px-1.5 py-0.5 rounded-md">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats overlay */}
        <div className="visit-stats-overlay">
          <div className="visit-stat-chip">
            <Flower2 size={11} />
            <span>{tiles.length} plants</span>
          </div>
          <div className="visit-stat-chip">
            <TreePine size={11} />
            <span>{season}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom bar: leave a note CTA ────────────── */}
      <div className="visit-bottom-bar">
        <button className="visit-leave-note-btn" onClick={() => setShowNotes(true)}>
          <MessageCircleHeart size={16} />
          <span>leave a kind note</span>
        </button>
      </div>

      {/* ── Notes sheet ─────────────────────────────── */}
      <AnimatePresence>
        {showNotes && (
          <>
            <motion.div
              className="world-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotes(false)}
            />
            <motion.div
              className="world-popover"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <button onClick={() => setShowNotes(false)} className="world-popover-close">
                <span className="text-xs">✕</span>
              </button>

              <div className="world-popover-header">
                <div className="world-popover-mood-dot" style={{ background: moodCol }} />
                <div>
                  <h3 className="world-popover-title">{garden.gardenName}</h3>
                  <p className="world-popover-subtitle">
                    {garden.kindNotes.length} kind note{garden.kindNotes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Existing notes */}
              {garden.kindNotes.length > 0 && (
                <div className="world-popover-notes">
                  <p className="world-popover-notes-label">notes from visitors</p>
                  {garden.kindNotes.map((n) => (
                    <div key={n.id} className="world-popover-note">
                      <MessageCircleHeart size={11} className="text-terra/50 flex-shrink-0 mt-0.5" />
                      <span>{n.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Send section */}
              <div className="world-popover-send">
                <p className="world-popover-send-label">
                  <Sparkles size={12} /> leave a kind note
                </p>
                <div className="world-popover-presets">
                  {KIND_PRESETS.slice(0, 4).map((msg) => (
                    <button key={msg} className="world-preset-btn" onClick={() => handleSendNote(msg)}>
                      {msg}
                    </button>
                  ))}
                </div>
                <div className="world-popover-custom">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="write something kind..."
                    maxLength={120}
                    className="world-custom-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customNote.trim()) handleSendNote(customNote.trim());
                    }}
                  />
                  <button
                    onClick={() => customNote.trim() && handleSendNote(customNote.trim())}
                    disabled={!customNote.trim()}
                    className="world-send-btn"
                  >
                    <Send size={14} />
                  </button>
                </div>
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
