// ── Garden Canvas component — full render pipeline ──────────
// Supports pan (drag), zoom (scroll), rotate, tile click

import { useRef, useEffect, useCallback, useState } from "react";
import {
  RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, Move, Hand, Droplets,
} from "lucide-react";
import { useGarden } from "@/hooks/useGarden";
import { useGardenStore } from "@/stores/gardenStore";
import { useWeather } from "@/hooks/useWeather";
import { useSeason } from "@/hooks/useSeason";
import { useDayNight } from "@/hooks/useDayNight";
import { WateringAnimation } from "@/components/mood/WateringAnimation";
import { renderTileLayers } from "@/lib/canvas/tilelayer";
import {
  drawSkyGradient,
  lerpSkyColors,
  createWeatherState,
  renderWeather,
  drawCelestials,
} from "@/lib/canvas/weather";
import { applyDayNightOverlay } from "@/lib/canvas/daynight";
import { spawnSeasonParticle, drawSeasonParticle } from "@/lib/canvas/seasons";
import type { SeasonParticle } from "@/lib/canvas/seasons";
import { gridToScreen, getCanvasOrigin, screenToGrid } from "@/lib/canvas/renderer";
import { createAnimal, updateAnimal, drawAnimal } from "@/lib/canvas/animals";
import type { AnimalInstance } from "@/lib/canvas/animals";
import { drawFireflies, drawShootingStar, drawFloatingMotes, drawRainbow } from "@/lib/canvas/events";
import { getTileLabel } from "@/lib/mood";
import { ACCENT_COLOURS } from "@/types/user";
import type { GardenTile, ViewDirection, CottageStyle, Season, DayPhase } from "@/types/garden";
import type { WeatherType } from "@/types/mood";
import "@/styles/canvas.css";

/* ── Cottage style options ─────────────────────────────────── */
const COTTAGE_OPTIONS: { value: CottageStyle; label: string }[] = [
  { value: 'wood', label: 'Wood' },
  { value: 'stone', label: 'Stone' },
  { value: 'brick', label: 'Brick' },
];

interface GardenCanvasProps {
  selectedTileId?: string | null;
  onTileClick?: (col: number, row: number, tileId: string | null) => void;
}

export function GardenCanvas({ selectedTileId, onTileClick }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const weatherStateRef = useRef(createWeatherState());
  const lastTimeRef = useRef(performance.now());
  const globalTimeRef = useRef(0);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const [zoom, setZoom] = useState(1);
  const [tileTooltip, setTileTooltip] = useState<{ x: number; y: number; label: string } | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showWatering, setShowWatering] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didMoveRef = useRef(false);

  const seasonParticlesRef = useRef<SeasonParticle[]>([]);
  const seasonSpawnTimerRef = useRef(0);
  const animalsRef = useRef<AnimalInstance[]>([]);
  const animalsInitRef = useRef(false);
  const rainbowOpacityRef = useRef(0);
  const prevWeatherRef = useRef<string | null>(null);
  const hoverTileRef = useRef<{ col: number; row: number } | null>(null);

  // ── Tile drag-to-reposition state (editor mode only) ──
  const dragTileRef = useRef<{ id: string; startCol: number; startRow: number } | null>(null);
  const dragGhostRef = useRef<{ col: number; row: number } | null>(null);

  const selectedTileIdRef = useRef(selectedTileId);
  selectedTileIdRef.current = selectedTileId;

  const tilesRef = useRef<GardenTile[]>([]);
  const gridSizeRef = useRef(4);
  const viewDirRef = useRef<ViewDirection>(0);
  const cottageStyleRef = useRef<CottageStyle>("wood");
  const weatherCurrentRef = useRef<WeatherType>("sunny");
  const weatherTargetRef = useRef<WeatherType>("sunny");
  const weatherProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const seasonRef = useRef<Season>("spring");
  const dayPhaseRef = useRef<DayPhase>("day");
  const wateredTilesRef = useRef<Set<string>>(new Set());

  const { tiles, gridSize, viewDirection, cottageStyle, isEditorMode, rotateView, toggleEditor } = useGarden();
  const wateredTiles = useGardenStore((s) => s.wateredTiles);
  const moveTile = useGardenStore((s) => s.moveTile);
  const waterTile = useGardenStore((s) => s.waterTile);
  const { current, target, progress, isTransitioning } = useWeather();
  const season = useSeason();
  const dayPhase = useDayNight();

  tilesRef.current = tiles;
  gridSizeRef.current = gridSize;
  viewDirRef.current = viewDirection;
  cottageStyleRef.current = cottageStyle;
  weatherCurrentRef.current = current;
  weatherTargetRef.current = target;
  weatherProgressRef.current = progress;
  isTransitioningRef.current = isTransitioning;
  seasonRef.current = season;
  dayPhaseRef.current = dayPhase;
  wateredTilesRef.current = wateredTiles;

  if (!animalsInitRef.current) {
    animalsInitRef.current = true;
    const animalTypes: Array<"bird" | "bunny" | "butterfly" | "cat"> = ["bird", "bunny", "butterfly", "cat"];
    for (const type of animalTypes) {
      animalsRef.current.push(createAnimal(type, {
        col: 1 + Math.random() * (gridSize - 2),
        row: 1 + Math.random() * (gridSize - 2),
      }));
    }
  }

  const getOrigin = useCallback((w: number, h: number) => {
    const base = getCanvasOrigin(w, h, gridSizeRef.current);
    return { x: base.x + panRef.current.x, y: base.y + panRef.current.y };
  }, []);

  const screenToTile = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const z = zoomRef.current;
    const cx = rect.width / 2, cy = rect.height / 2;
    const ux = (px - cx) / z + cx;
    const uy = (py - cy) / z + cy;
    const origin = getOrigin(rect.width, rect.height);
    return screenToGrid(ux, uy, origin.x, origin.y, viewDirRef.current, gridSizeRef.current);
  }, [getOrigin]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    didMoveRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: panRef.current.x, panY: panRef.current.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // If in editor mode, check if we're clicking on an existing tile to drag it
    if (useGardenStore.getState().isEditorMode) {
      const gs = gridSizeRef.current;
      const tile = screenToTile(e.clientX, e.clientY);
      if (tile && tile.col >= 0 && tile.col < gs && tile.row >= 0 && tile.row < gs) {
        const existing = tilesRef.current.find((t) => t.grid_col === tile.col && t.grid_row === tile.row);
        if (existing) {
          dragTileRef.current = { id: existing.id, startCol: existing.grid_col, startRow: existing.grid_row };
          dragGhostRef.current = { col: tile.col, row: tile.row };
          return; // Don't start pan when dragging a tile
        }
      }
    }
  }, [screenToTile]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const gs = gridSizeRef.current;
    const tile = screenToTile(e.clientX, e.clientY);
    if (tile && tile.col >= 0 && tile.col < gs && tile.row >= 0 && tile.row < gs) {
      hoverTileRef.current = tile;

      // If dragging a tile in editor mode, update the ghost position
      if (dragTileRef.current && isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMoveRef.current = true;
        dragGhostRef.current = { col: tile.col, row: tile.row };
        return; // Don't pan while dragging a tile
      }

      const placed = tilesRef.current.find((t) => t.grid_col === tile.col && t.grid_row === tile.row);
      if (placed) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setTileTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: getTileLabel(placed.tile_type) });
        }
      } else { setTileTooltip(null); }
    } else { hoverTileRef.current = null; setTileTooltip(null); }
    if (!isDraggingRef.current) return;
    if (dragTileRef.current) return; // Don't pan while dragging a tile
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMoveRef.current = true;
    panRef.current = { x: dragStartRef.current.panX + dx / zoomRef.current, y: dragStartRef.current.panY + dy / zoomRef.current };
  }, [screenToTile]);

  const onTileClickRef = useRef(onTileClick);
  onTileClickRef.current = onTileClick;

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = false;

    // ── Tile drag complete (editor mode) ──
    if (dragTileRef.current) {
      const gs = gridSizeRef.current;
      const dropTile = screenToTile(e.clientX, e.clientY);
      if (dropTile && didMoveRef.current &&
          dropTile.col >= 0 && dropTile.col < gs && dropTile.row >= 0 && dropTile.row < gs) {
        // Check the target cell is empty
        const occupied = tilesRef.current.find(
          (t) => t.grid_col === dropTile.col && t.grid_row === dropTile.row && t.id !== dragTileRef.current!.id,
        );
        if (!occupied) {
          moveTile(dragTileRef.current.id, dropTile.col, dropTile.row);
        }
      }
      dragTileRef.current = null;
      dragGhostRef.current = null;
      return;
    }

    if (!didMoveRef.current && onTileClickRef.current) {
      const gs = gridSizeRef.current;
      const tile = screenToTile(e.clientX, e.clientY);
      if (tile && tile.col >= 0 && tile.col < gs && tile.row >= 0 && tile.row < gs) {
        const existing = tilesRef.current.find((t) => t.grid_col === tile.col && t.grid_row === tile.row);
        onTileClickRef.current(tile.col, tile.row, existing?.id ?? null);
      }
    }
  }, [screenToTile, moveTile]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const nz = Math.min(2.5, Math.max(0.5, zoomRef.current + delta));
    zoomRef.current = nz; setZoom(nz);
  }, []);

  const zoomIn = useCallback(() => { const nz = Math.min(2.5, zoomRef.current + 0.2); zoomRef.current = nz; setZoom(nz); }, []);
  const zoomOut = useCallback(() => { const nz = Math.max(0.5, zoomRef.current - 0.2); zoomRef.current = nz; setZoom(nz); }, []);
  const resetView = useCallback(() => { panRef.current = { x: 0, y: 0 }; zoomRef.current = 1; setZoom(1); }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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

    const _tiles = tilesRef.current;
    const _gridSize = gridSizeRef.current;
    const _viewDirection = viewDirRef.current;
    const _cottageStyle = cottageStyleRef.current;
    const _current = weatherCurrentRef.current;
    const _target = weatherTargetRef.current;
    const _progress = weatherProgressRef.current;
    const _isTransitioning = isTransitioningRef.current;
    const _season = seasonRef.current;
    const _dayPhase = dayPhaseRef.current;
    const _selectedTileId = selectedTileIdRef.current;

    if (_isTransitioning) { lerpSkyColors(ctx, w, h, _current, _target, _progress, _dayPhase); }
    else { drawSkyGradient(ctx, w, h, _current, _dayPhase); }

    const activeWeather = _isTransitioning ? _target : _current;
    drawCelestials(ctx, w, h, activeWeather, _dayPhase, time);
    drawFloatingMotes(ctx, w, h, time, _dayPhase);

    ctx.save();
    const cxC = w / 2, cyC = h / 2;
    ctx.translate(cxC, cyC);
    ctx.scale(zoomRef.current, zoomRef.current);
    ctx.translate(-cxC, -cyC);

    renderTileLayers({
      ctx, canvasWidth: w, canvasHeight: h,
      tiles: _tiles, gridSize: _gridSize, viewDirection: _viewDirection,
      season: _season, cottageStyle: _cottageStyle,
      dayPhase: _dayPhase, time,
      selectedTileId: _selectedTileId ?? undefined,
      hoverTile: hoverTileRef.current ?? undefined,
      wateredTiles: wateredTilesRef.current,
    });

    const origin = getOrigin(w, h);
    const occupiedTiles = new Set(_tiles.map((t) => `${t.grid_col},${t.grid_row}`));
    for (const animal of animalsRef.current) {
      updateAnimal(animal, delta, _gridSize, occupiedTiles);
      const screen = gridToScreen(animal.state.position.col, animal.state.position.row, origin.x, origin.y, _viewDirection, _gridSize);
      drawAnimal(ctx, animal, screen.x, screen.y);
    }

    seasonSpawnTimerRef.current += delta;
    if (seasonSpawnTimerRef.current > 0.2 && seasonParticlesRef.current.length < 30) {
      seasonSpawnTimerRef.current = 0;
      const particle = spawnSeasonParticle(_season, w);
      if (particle) seasonParticlesRef.current.push(particle);
    }
    for (let i = seasonParticlesRef.current.length - 1; i >= 0; i--) {
      const p = seasonParticlesRef.current[i];
      p.x += p.vx * delta; p.y += p.vy * delta;
      p.rotation += p.rotationSpeed * delta; p.life += delta;
      if (p.life > p.maxLife || p.y > h + 20) { seasonParticlesRef.current.splice(i, 1); continue; }
      drawSeasonParticle(ctx, p, _season);
    }

    ctx.restore();

    renderWeather(ctx, weatherStateRef.current, activeWeather, w, h, delta, _isTransitioning ? _progress : 1.0);
    drawFireflies(ctx, w, h, time, _dayPhase);
    drawShootingStar(ctx, w, h, delta, _dayPhase);
    if (prevWeatherRef.current === "rain" && activeWeather !== "rain" && activeWeather !== "thunder") {
      rainbowOpacityRef.current = 1;
    }
    prevWeatherRef.current = activeWeather;
    if (rainbowOpacityRef.current > 0) {
      drawRainbow(ctx, w, h, rainbowOpacityRef.current);
      rainbowOpacityRef.current -= delta * 0.05;
    }
    applyDayNightOverlay(ctx, w, h, _dayPhase);
  }, [getOrigin]);

  useEffect(() => {
    let animId: number;
    const loop = () => { render(); animId = requestAnimationFrame(loop); };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener("wheel", prevent, { passive: false });
    return () => canvas.removeEventListener("wheel", prevent);
  }, []);

  // ── Water selected tile shortcut ──
  const handleWaterSelected = useCallback(() => {
    const sid = selectedTileIdRef.current;
    if (!sid) return;
    const tile = tilesRef.current.find((t) => t.id === sid);
    if (!tile) return;
    // Show the watering animation
    setShowWatering(true);
    // Water the tile (sprout→standard→bloom; bloom stays bloom but gets sparkle)
    waterTile(sid);
    setTimeout(() => setShowWatering(false), 2200);
  }, [waterTile]);

  // ── Cottage / accent helpers ──
  const setCottageStyle = useGardenStore((s) => s.setCottageStyle);
  const currentCottage = cottageStyle;

  return (
    <div className="garden-viewport">
      <canvas
        ref={canvasRef}
        className={`garden-canvas ${isEditorMode ? "garden-canvas--editor" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onPointerLeave={() => setTileTooltip(null)}
      />
      {tileTooltip && (
        <div className="tile-tooltip" style={{ left: tileTooltip.x, top: tileTooltip.y }}>
          {tileTooltip.label}
        </div>
      )}

      {/* ── Left controls (rotate, zoom, editor, water) ── */}
      <div className="garden-controls">
        <div className="garden-controls-row">
          <button onClick={() => rotateView("ccw")} className="ctrl-btn" title="Rotate left"><RotateCcw size={14} /></button>
          <button onClick={() => rotateView("cw")} className="ctrl-btn" title="Rotate right"><RotateCw size={14} /></button>
        </div>
        <div className="garden-controls-row">
          <button onClick={zoomOut} className="ctrl-btn" title="Zoom out"><ZoomOut size={14} /></button>
          <button onClick={zoomIn} className="ctrl-btn" title="Zoom in"><ZoomIn size={14} /></button>
        </div>
        <div className="garden-controls-row">
          <button onClick={resetView} className="ctrl-btn" title="Reset view"><Maximize2 size={14} /></button>
          <button onClick={toggleEditor} className={`ctrl-btn ${isEditorMode ? "active" : ""}`} title={isEditorMode ? "Exit editor" : "Rearrange tiles"}>
            {isEditorMode ? <Hand size={14} /> : <Move size={14} />}
          </button>
        </div>
        <div className="garden-controls-row">
          <button
            onClick={handleWaterSelected}
            className="ctrl-btn"
            title="Water selected plant"
          >
            <Droplets size={14} />
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

      {/* ── Right side: customize garden toolbar ── */}
      <div className="garden-customize-toolbar">
        <button
          onClick={() => setShowCustomize((v) => !v)}
          className={`ctrl-btn ${showCustomize ? 'active' : ''}`}
          title="Customize garden"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20a8 8 0 0 0 8-8 4 4 0 0 0-4-4H8a4 4 0 0 0-4 4 8 8 0 0 0 8 8z" />
            <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="10" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="13.5" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {showCustomize && (
          <div className="garden-customize-panel">
            <span className="garden-customize-label">cottage</span>
            <div className="garden-customize-options">
              {COTTAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCottageStyle(opt.value)}
                  className={`garden-customize-opt ${currentCottage === opt.value ? 'active' : ''}`}
                  title={opt.label}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="garden-customize-label" style={{ marginTop: '0.5rem' }}>accent</span>
            <div className="garden-customize-colours">
              {ACCENT_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    // Update accent via auth store if available
                    import('@/stores/authStore').then(({ useAuthStore }) => {
                      useAuthStore.getState().updateProfile({ accent_colour: c });
                    });
                  }}
                  className="garden-colour-dot"
                  style={{ backgroundColor: c }}
                  title={`Accent ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Editor mode indicator ── */}
      {isEditorMode && (
        <div className="garden-editor-badge">
          <Move size={12} />
          <span>drag tiles to move</span>
        </div>
      )}

      {/* ── Watering animation overlay ── */}
      <WateringAnimation isPlaying={showWatering} onComplete={() => setShowWatering(false)} />
    </div>
  );
}
