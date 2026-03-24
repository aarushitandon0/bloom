// ── Tile layer rendering — beautiful isometric garden ────────

import type { GardenTile, ViewDirection, Season, CottageStyle, DayPhase } from '@/types/garden';
import {
  gridToScreen,
  sortForRendering,
  getCanvasOrigin,
  drawIsoCube,
  drawIsoDiamond,
  drawPlantPlaceholder,
  getCottageFootprint,
} from './renderer';
import { TILE_W } from './sprites';

/* ────────────────────────────────────────────────────────────
   COLOUR PALETTES
   ──────────────────────────────────────────────────────────── */

const SEASON_GROUND: Record<Season, { top: string; left: string; right: string; accent: string }> = {
  spring: { top: '#95D07A', left: '#6AAE50', right: '#5A9A44', accent: '#C8E8A0' },
  summer: { top: '#7FAF6A', left: '#5E8E48', right: '#4E7E3E', accent: '#A8D488' },
  autumn: { top: '#C4A860', left: '#A08840', right: '#907838', accent: '#D4B870' },
  winter: { top: '#E0E4EA', left: '#C0C6D0', right: '#B0B6C0', accent: '#E8ECF4' },
};

const COTTAGE_COLORS: Record<CottageStyle, {
  roofTop: string; roofSide: string;
  wallFront: string; wallSide: string;
  door: string; doorFrame: string;
  windowGlass: string; windowFrame: string;
  chimney: string; chimneyTop: string;
}> = {
  wood: {
    roofTop: '#A87A4A', roofSide: '#8A6238',
    wallFront: '#E8D4B4', wallSide: '#D4BC98',
    door: '#8B6238', doorFrame: '#6B4A28',
    windowGlass: '#D4E8F8', windowFrame: '#8B6238',
    chimney: '#9A7850', chimneyTop: '#6B4A28',
  },
  stone: {
    roofTop: '#7A7A88', roofSide: '#6A6A78',
    wallFront: '#D4CCC0', wallSide: '#C0B8AC',
    door: '#6B5A40', doorFrame: '#5A4A30',
    windowGlass: '#C8DCF0', windowFrame: '#6A6A78',
    chimney: '#8A8A94', chimneyTop: '#6A6A78',
  },
  brick: {
    roofTop: '#B85A4A', roofSide: '#9A4A3A',
    wallFront: '#D89A7A', wallSide: '#C48868',
    door: '#6B4A28', doorFrame: '#4A3018',
    windowGlass: '#D4E8F8', windowFrame: '#8A5A3A',
    chimney: '#C46A5A', chimneyTop: '#8A4A3A',
  },
};

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  tiles: GardenTile[];
  gridSize: number;
  viewDirection: ViewDirection;
  season: Season;
  cottageStyle: CottageStyle;
  dayPhase?: DayPhase;
  time?: number;
  selectedTileId?: string;
  hoverTile?: { col: number; row: number };
  /** Tile IDs currently being watered — triggers sparkle & grow burst */
  wateredTiles?: Set<string>;
}

/* ────────────────────────────────────────────────────────────
   MAIN RENDER
   ──────────────────────────────────────────────────────────── */

// Persistent random texture map so grass details don't flicker
let _groundDetails: Map<string, { flowers: { dx: number; dy: number; color: string; size: number }[]; tufts: { dx: number; dy: number; angle: number }[] }> | null = null;
let _groundGridSize = -1;

function ensureGroundDetails(gridSize: number, _season: Season) {
  if (_groundDetails && _groundGridSize === gridSize) return;
  _groundGridSize = gridSize;
  _groundDetails = new Map();
  for (let c = 0; c < gridSize; c++) {
    for (let r = 0; r < gridSize; r++) {
      const flowers: { dx: number; dy: number; color: string; size: number }[] = [];
      const tufts: { dx: number; dy: number; angle: number }[] = [];
      const hash = c * 7 + r * 13;
      // 1-3 grass tufts per tile
      const tCount = 1 + (hash % 3);
      for (let i = 0; i < tCount; i++) {
        tufts.push({
          dx: ((hash * (i + 1) * 17) % 40) - 20,
          dy: ((hash * (i + 1) * 23) % 16) - 8,
          angle: ((hash * (i + 1) * 11) % 30 - 15) * 0.02,
        });
      }
      // 0-2 tiny flowers on some tiles
      if (hash % 4 < 2) {
        const fCount = 1 + (hash % 2);
        const flowerColors = ['#F8BBD0', '#FFE082', '#B39DDB', '#80DEEA', '#FFAB91', '#C8E6C9'];
        for (let i = 0; i < fCount; i++) {
          flowers.push({
            dx: ((hash * (i + 3) * 19) % 36) - 18,
            dy: ((hash * (i + 3) * 29) % 14) - 7,
            color: flowerColors[(hash + i * 3) % flowerColors.length],
            size: 1.5 + ((hash * (i + 1)) % 15) / 10,
          });
        }
      }
      _groundDetails.set(`${c},${r}`, { flowers, tufts });
    }
  }
}

export function renderTileLayers(opts: RenderOptions) {
  const { ctx, canvasWidth, canvasHeight, tiles, gridSize, viewDirection, season, cottageStyle, dayPhase, time, selectedTileId, hoverTile, wateredTiles } = opts;

  const origin = getCanvasOrigin(canvasWidth, canvasHeight, gridSize);
  const ground = SEASON_GROUND[season];
  const cottage = getCottageFootprint(gridSize);
  const isNight = dayPhase === 'night';
  const t = time ?? 0;

  ensureGroundDetails(gridSize, season);

  // 1. Ground tiles with texture
  for (let c = 0; c < gridSize; c++) {
    for (let r = 0; r < gridSize; r++) {
      const screen = gridToScreen(c, r, origin.x, origin.y, viewDirection, gridSize);

      // Slight colour variation per tile
      const hash = c * 7 + r * 13;
      const shade = (hash % 10 - 5) * 0.008;
      const top = adjustBrightness(ground.top, shade);
      const left = adjustBrightness(ground.left, shade * 0.5);
      const right = adjustBrightness(ground.right, shade * 0.5);

      drawIsoCube(ctx, screen.x, screen.y, top, left, right);

      // Ground texture details
      const details = _groundDetails?.get(`${c},${r}`);
      if (details && season !== 'winter') {
        for (const t of details.tufts) {
          drawTinyGrass(ctx, screen.x + t.dx, screen.y + t.dy, ground.accent, t.angle);
        }
        if (season === 'spring' || season === 'summer') {
          for (const f of details.flowers) {
            drawTinyFlower(ctx, screen.x + f.dx, screen.y + f.dy, f.color, f.size);
          }
        }
      }
      if (season === 'winter' && details) {
        for (const t of details.tufts) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(screen.x + t.dx, screen.y + t.dy - 1, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  // 2. Path stones
  drawGardenPath(ctx, origin, viewDirection, gridSize, season);

  // 3. Fence
  drawFencePerimeter(ctx, origin, viewDirection, gridSize, season);

  // 4. Cottage
  renderCottage(ctx, origin, viewDirection, gridSize, cottageStyle, isNight, season, time ?? 0);

  // 5. Demo garden elements when empty
  if (tiles.length === 0) {
    drawDemoGarden(ctx, origin, viewDirection, gridSize, season, time ?? 0);
  }

  // 6. Plant tiles
  const sorted = sortForRendering(tiles, viewDirection, gridSize);
  for (const tile of sorted) {
    if (tile.is_decoration) continue;
    const screen = gridToScreen(tile.grid_col, tile.grid_row, origin.x, origin.y, viewDirection, gridSize);
    const key = `${tile.grid_col},${tile.grid_row}`;
    if (!cottage.has(key)) {
      drawPlantPlaceholder(ctx, screen.x, screen.y, tile.tile_type);
    }
  }

  // 7. Decoration tiles
  for (const tile of sorted) {
    if (!tile.is_decoration) continue;
    const screen = gridToScreen(tile.grid_col, tile.grid_row, origin.x, origin.y, viewDirection, gridSize);
    drawDecoration(ctx, screen.x, screen.y, tile.tile_type, isNight, time ?? 0);
  }

  // 7b. Watered-tile water-drop sparkle overlay
  if (wateredTiles && wateredTiles.size > 0) {
    for (const tile of tiles) {
      if (!wateredTiles.has(tile.id)) continue;
      const screen = gridToScreen(tile.grid_col, tile.grid_row, origin.x, origin.y, viewDirection, gridSize);
      drawWaterSparkle(ctx, screen.x, screen.y, t);
    }
  }

  // 8. Hover highlight
  if (hoverTile && hoverTile.col >= 0 && hoverTile.col < gridSize && hoverTile.row >= 0 && hoverTile.row < gridSize) {
    const hs = gridToScreen(hoverTile.col, hoverTile.row, origin.x, origin.y, viewDirection, gridSize);
    const hw = TILE_W / 2;
    const hh = 16; // TILE_H / 2
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(hs.x, hs.y - hh);
    ctx.lineTo(hs.x + hw, hs.y);
    ctx.lineTo(hs.x, hs.y + hh);
    ctx.lineTo(hs.x - hw, hs.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 9. Selection ring
  if (selectedTileId) {
    const selTile = tiles.find((tt) => tt.id === selectedTileId);
    if (selTile) {
      const ss = gridToScreen(selTile.grid_col, selTile.grid_row, origin.x, origin.y, viewDirection, gridSize);
      const hw = TILE_W / 2;
      const hh = 16;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save();
      ctx.globalAlpha = 0.3 + pulse * 0.4;
      ctx.strokeStyle = '#E8C84A';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y - hh - 2);
      ctx.lineTo(ss.x + hw + 2, ss.y);
      ctx.lineTo(ss.x, ss.y + hh + 2);
      ctx.lineTo(ss.x - hw - 2, ss.y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

/* ────────────────────────────────────────────────────────────
   WATER SPARKLE — plays on a tile for 3 s after watering
   ──────────────────────────────────────────────────────────── */

/**
 * Animated water-drop burst + rising sparkles drawn on top of a plant.
 * Called every frame for tiles in the `wateredTiles` set.
 */
function drawWaterSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
) {
  // 8 water drops radiating outward in a burst pattern
  const drops = 8;
  for (let i = 0; i < drops; i++) {
    const angle = (i / drops) * Math.PI * 2;
    // Each drop oscillates with a phase offset so they pulse
    const phase = (time * 2.5 + i * 0.4) % (Math.PI * 2);
    const radius = 6 + Math.sin(phase) * 5;
    const alpha = 0.5 + 0.4 * Math.cos(phase);
    const dropX = x + Math.cos(angle) * radius;
    const dropY = y - 10 + Math.sin(angle) * radius * 0.5; // flatten vertically (iso look)

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = '#7EC8E3';
    ctx.beginPath();
    // Tiny teardrop shape
    ctx.arc(dropX, dropY, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rising droplets
  for (let i = 0; i < 5; i++) {
    const phase = (time * 3 + i * 0.7) % 1;         // 0 → 1 rise cycle
    const offsetX = (i - 2) * 5;
    const riseY = y - 10 - phase * 28;               // rise 28px over the cycle
    const alpha = phase < 0.6 ? phase / 0.6 : (1 - phase) / 0.4; // fade in, fade out

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha) * 0.85;
    ctx.fillStyle = '#A8D8EA';
    ctx.beginPath();
    ctx.moveTo(x + offsetX, riseY + 2.5);
    ctx.bezierCurveTo(
      x + offsetX - 2, riseY + 1,
      x + offsetX - 2, riseY - 2,
      x + offsetX, riseY - 3,
    );
    ctx.bezierCurveTo(
      x + offsetX + 2, riseY - 2,
      x + offsetX + 2, riseY + 1,
      x + offsetX, riseY + 2.5,
    );
    ctx.fill();
    ctx.restore();
  }

  // Central grow-burst ring
  const burstPhase = (Math.sin(time * 4) + 1) / 2;
  const burstR = 4 + burstPhase * 14;
  const burstAlpha = (1 - burstPhase) * 0.5;
  ctx.save();
  ctx.globalAlpha = Math.max(0, burstAlpha);
  ctx.strokeStyle = '#7EC8E3';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y - 8, burstR, burstR * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Sparkle stars above the plant
  const stars = [
    { ox: -8, oy: -30 }, { ox: 8, oy: -34 }, { ox: 0, oy: -26 },
    { ox: -12, oy: -22 }, { ox: 13, oy: -20 },
  ];
  for (let i = 0; i < stars.length; i++) {
    const { ox, oy } = stars[i];
    const p = (time * 2.8 + i * 0.6) % (Math.PI * 2);
    const alpha = 0.4 + 0.5 * Math.abs(Math.sin(p));
    const sz = 1.5 + Math.abs(Math.sin(p)) * 1.8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E8F8FF';
    ctx.beginPath();
    // 4-point star
    const sx = x + ox, sy = y + oy;
    ctx.moveTo(sx, sy - sz);
    ctx.quadraticCurveTo(sx + sz * 0.3, sy - sz * 0.3, sx + sz, sy);
    ctx.quadraticCurveTo(sx + sz * 0.3, sy + sz * 0.3, sx, sy + sz);
    ctx.quadraticCurveTo(sx - sz * 0.3, sy + sz * 0.3, sx - sz, sy);
    ctx.quadraticCurveTo(sx - sz * 0.3, sy - sz * 0.3, sx, sy - sz);
    ctx.fill();
    ctx.restore();
  }
}

/* ────────────────────────────────────────────────────────────
   GROUND TEXTURE HELPERS
   ──────────────────────────────────────────────────────────── */

function drawTinyGrass(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-1.5, -3.5, -0.5, -5);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(1, -4, 1.5, -4.5);
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0, -5, 0.2, -6);
  ctx.stroke();
  ctx.restore();
}

function drawTinyFlower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) {
  ctx.save();
  // Stem
  ctx.strokeStyle = '#6AAE50';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - size * 2);
  ctx.stroke();
  // Petals
  const petals = 4;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * size * 0.5, y - size * 2 + Math.sin(a) * size * 0.5, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  // Center
  ctx.beginPath();
  ctx.arc(x, y - size * 2, size * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD54F';
  ctx.fill();
  ctx.restore();
}

function adjustBrightness(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + Math.round(amount * 255)));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + Math.round(amount * 255)));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + Math.round(amount * 255)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/* ────────────────────────────────────────────────────────────
   GARDEN PATH — stepping stones from cottage
   ──────────────────────────────────────────────────────────── */

function drawGardenPath(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  viewDirection: ViewDirection,
  gridSize: number,
  _season: Season,
) {
  const pathColor = _season === 'winter' ? '#C8C0B8' : '#C4B8A0';
  const shadowColor = _season === 'winter' ? '#B0AAA4' : '#A89880';
  // Small stepping stones from cottage area
  const stones = [
    { col: 2, row: 1 },
    { col: 3, row: 1 },
    { col: 3, row: 2 },
  ];
  for (const s of stones) {
    if (s.col >= gridSize || s.row >= gridSize) continue;
    const screen = gridToScreen(s.col, s.row, origin.x, origin.y, viewDirection, gridSize);
    ctx.save();
    ctx.globalAlpha = 0.5;
    // Stone shape — flattened ellipse on tile
    ctx.beginPath();
    ctx.ellipse(screen.x - 4, screen.y - 1, 5, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = pathColor;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(screen.x + 5, screen.y + 1, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = shadowColor;
    ctx.fill();
    ctx.restore();
  }
}

/* ────────────────────────────────────────────────────────────
   FENCE — wooden fence with horizontal rails
   ──────────────────────────────────────────────────────────── */

function drawFencePerimeter(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  viewDirection: ViewDirection,
  gridSize: number,
  season: Season,
) {
  const postColor = season === 'winter' ? '#B0A090' : '#9A7A50';
  const railColor = season === 'winter' ? '#C0B0A0' : '#B8956A';

  // Draw fence posts and rails around perimeter
  // Top edge (r=0)
  for (let c = 0; c < gridSize; c++) {
    const screen = gridToScreen(c, 0, origin.x, origin.y, viewDirection, gridSize);
    drawFencePost(ctx, screen.x - TILE_W / 2, screen.y, postColor);
    if (c < gridSize - 1) {
      const next = gridToScreen(c + 1, 0, origin.x, origin.y, viewDirection, gridSize);
      drawFenceRail(ctx, screen.x - TILE_W / 2, screen.y, next.x - TILE_W / 2, next.y, railColor);
    }
  }
  // Right edge (c = gridSize-1)
  for (let r = 0; r < gridSize; r++) {
    const screen = gridToScreen(gridSize - 1, r, origin.x, origin.y, viewDirection, gridSize);
    drawFencePost(ctx, screen.x + TILE_W / 2, screen.y, postColor);
    if (r < gridSize - 1) {
      const next = gridToScreen(gridSize - 1, r + 1, origin.x, origin.y, viewDirection, gridSize);
      drawFenceRail(ctx, screen.x + TILE_W / 2, screen.y, next.x + TILE_W / 2, next.y, railColor);
    }
  }
  // Bottom edge (r = gridSize-1)
  for (let c = gridSize - 1; c >= 0; c--) {
    const screen = gridToScreen(c, gridSize - 1, origin.x, origin.y, viewDirection, gridSize);
    drawFencePost(ctx, screen.x + TILE_W / 2, screen.y, postColor);
  }
  // Left edge (c=0)
  for (let r = gridSize - 1; r >= 0; r--) {
    const screen = gridToScreen(0, r, origin.x, origin.y, viewDirection, gridSize);
    drawFencePost(ctx, screen.x - TILE_W / 2, screen.y, postColor);
    if (r > 0) {
      const next = gridToScreen(0, r - 1, origin.x, origin.y, viewDirection, gridSize);
      drawFenceRail(ctx, screen.x - TILE_W / 2, screen.y, next.x - TILE_W / 2, next.y, railColor);
    }
  }
}

function drawFencePost(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  // Post shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Post body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 2);
  ctx.lineTo(x - 2, y - 14);
  ctx.lineTo(x, y - 17); // pointed top
  ctx.lineTo(x + 2, y - 14);
  ctx.lineTo(x + 2, y + 2);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x - 1.5, y - 13, 1.2, 14);
  ctx.restore();
}

function drawFenceRail(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // Upper rail
  ctx.beginPath();
  ctx.moveTo(x1, y1 - 10);
  ctx.lineTo(x2, y2 - 10);
  ctx.stroke();
  // Lower rail
  ctx.beginPath();
  ctx.moveTo(x1, y1 - 5);
  ctx.lineTo(x2, y2 - 5);
  ctx.stroke();
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   COTTAGE — detailed isometric cottage
   ──────────────────────────────────────────────────────────── */

function renderCottage(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  viewDirection: ViewDirection,
  gridSize: number,
  style: CottageStyle,
  isNight: boolean,
  season: Season,
  time: number,
) {
  const colors = COTTAGE_COLORS[style];
  const screen = gridToScreen(1, 0, origin.x, origin.y, viewDirection, gridSize);
  const cx = screen.x;
  const cy = screen.y;

  // Dimensions
  const wallW = 44;
  const wallH = 28;
  const roofOverhang = 6;
  const roofH = 20;

  ctx.save();

  // ── Shadow under cottage
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, wallW * 0.7, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Front wall (isometric)
  const wallTop = cy - wallH;
  ctx.beginPath();
  ctx.moveTo(cx - wallW / 2, wallTop);
  ctx.lineTo(cx + wallW / 2, wallTop);
  ctx.lineTo(cx + wallW / 2, cy);
  ctx.lineTo(cx - wallW / 2, cy);
  ctx.closePath();
  ctx.fillStyle = colors.wallFront;
  ctx.fill();

  // Wall texture — horizontal lines for wood/brick
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.3;
  for (let ly = wallTop + 4; ly < cy; ly += 4) {
    ctx.beginPath();
    ctx.moveTo(cx - wallW / 2 + 1, ly);
    ctx.lineTo(cx + wallW / 2 - 1, ly);
    ctx.stroke();
  }
  if (style === 'brick') {
    for (let ly = wallTop + 4; ly < cy; ly += 4) {
      const offset = ((ly - wallTop) / 4) % 2 === 0 ? 0 : 5;
      for (let lx = cx - wallW / 2 + offset; lx < cx + wallW / 2; lx += 10) {
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + 4);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // ── Side wall (isometric depth)
  const sideW = 18;
  ctx.beginPath();
  ctx.moveTo(cx + wallW / 2, wallTop);
  ctx.lineTo(cx + wallW / 2 + sideW, wallTop + sideW / 2);
  ctx.lineTo(cx + wallW / 2 + sideW, cy + sideW / 2);
  ctx.lineTo(cx + wallW / 2, cy);
  ctx.closePath();
  ctx.fillStyle = colors.wallSide;
  ctx.fill();

  // ── Door
  const doorW = 10;
  const doorH = 16;
  const doorX = cx - 6;
  const doorY = cy - doorH;
  // Door frame
  ctx.fillStyle = colors.doorFrame;
  ctx.fillRect(doorX - 1.5, doorY - 1, doorW + 3, doorH + 1);
  // Door body
  ctx.fillStyle = colors.door;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  // Door panels
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(doorX + 1.5, doorY + 2, doorW - 3, doorH * 0.35);
  ctx.strokeRect(doorX + 1.5, doorY + doorH * 0.45, doorW - 3, doorH * 0.45);
  // Door knob
  ctx.beginPath();
  ctx.arc(doorX + doorW - 2.5, doorY + doorH / 2, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#E8C84A';
  ctx.fill();
  // Door arch
  ctx.beginPath();
  ctx.arc(doorX + doorW / 2, doorY, doorW / 2, Math.PI, 0);
  ctx.fillStyle = colors.doorFrame;
  ctx.fill();

  // ── Windows
  const drawWindow = (wx: number, wy: number, ww: number, wh: number) => {
    ctx.fillStyle = colors.windowFrame;
    ctx.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
    ctx.fillStyle = isNight ? '#FFE8A0' : colors.windowGlass;
    ctx.fillRect(wx, wy, ww, wh);
    // Cross panes
    ctx.strokeStyle = colors.windowFrame;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    // Night glow
    if (isNight) {
      ctx.save();
      const glow = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww * 1.5);
      glow.addColorStop(0, 'rgba(255,232,160,0.25)');
      glow.addColorStop(1, 'rgba(255,232,160,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(wx + ww / 2, wy + wh / 2, ww * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Curtain hint
    if (!isNight) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(wx + 1, wy + 1, ww / 3, wh - 2);
      ctx.restore();
    }
  };

  drawWindow(cx - wallW / 2 + 5, wallTop + 6, 8, 8);
  drawWindow(cx + wallW / 2 - 14, wallTop + 6, 8, 8);

  // ── Roof — pitched with overhang
  const roofTopY = wallTop - roofH;
  const roofPeakX = cx + sideW / 2;
  // Front roof face
  ctx.beginPath();
  ctx.moveTo(cx - wallW / 2 - roofOverhang, wallTop);
  ctx.lineTo(roofPeakX, roofTopY);
  ctx.lineTo(cx + wallW / 2 + roofOverhang, wallTop);
  ctx.closePath();
  ctx.fillStyle = colors.roofTop;
  ctx.fill();
  // Right roof face
  ctx.beginPath();
  ctx.moveTo(cx + wallW / 2 + roofOverhang, wallTop);
  ctx.lineTo(roofPeakX, roofTopY);
  ctx.lineTo(cx + wallW / 2 + sideW + roofOverhang / 2, wallTop + sideW / 2);
  ctx.lineTo(cx + wallW / 2 + sideW, wallTop + sideW / 2);
  ctx.closePath();
  ctx.fillStyle = colors.roofSide;
  ctx.fill();

  // Roof tile lines
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.4;
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const ly = wallTop - roofH * (1 - t);
    const lx1 = cx - wallW / 2 - roofOverhang + (roofPeakX - (cx - wallW / 2 - roofOverhang)) * (1 - t);
    const lx2 = cx + wallW / 2 + roofOverhang - (cx + wallW / 2 + roofOverhang - roofPeakX) * (1 - t);
    ctx.beginPath();
    ctx.moveTo(lx1, ly + (wallTop - ly) * t);
    ctx.lineTo(lx2, ly + (wallTop - ly) * t);
    ctx.stroke();
  }
  ctx.restore();

  // ── Chimney
  const chimX = cx + wallW / 4;
  const chimW = 6;
  const chimH = 14;
  const chimY = roofTopY - 2;
  ctx.fillStyle = colors.chimney;
  ctx.fillRect(chimX - chimW / 2, chimY, chimW, chimH);
  ctx.fillStyle = colors.chimneyTop;
  ctx.fillRect(chimX - chimW / 2 - 1, chimY - 2, chimW + 2, 3);

  // Smoke puffs
  ctx.save();
  ctx.globalAlpha = 0.2;
  const t = time;
  for (let i = 0; i < 3; i++) {
    const puffY = chimY - 6 - i * 8 - ((t * 12 + i * 3) % 20);
    const puffX = chimX + Math.sin(t * 0.8 + i) * 4;
    const puffR = 3 + i * 1.5;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
    ctx.fillStyle = '#D8D0C8';
    ctx.fill();
  }
  ctx.restore();

  // ── Flower box under left window
  if (season !== 'winter') {
    const fbx = cx - wallW / 2 + 5;
    const fby = wallTop + 15;
    ctx.fillStyle = '#8B6238';
    ctx.fillRect(fbx - 1, fby, 10, 3);
    // Tiny flowers in box
    const boxFlowers = ['#F48FB1', '#FF8A65', '#CE93D8'];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(fbx + 1 + i * 3.5, fby - 2 - i % 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = boxFlowers[i];
      ctx.fill();
    }
    // Leaves
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(fbx + 1, fby - 1, 2, 1, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(fbx + 8, fby - 1, 2, 1, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Welcome mat
  ctx.fillStyle = '#C4A070';
  ctx.beginPath();
  ctx.ellipse(doorX + doorW / 2, cy + 2, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   DEMO GARDEN — shown when no plants are placed yet
   ──────────────────────────────────────────────────────────── */

function drawDemoGarden(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  viewDirection: ViewDirection,
  gridSize: number,
  _season: Season,
  time: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(time * 1.2) * 0.1;

  // Draw a few placeholder guide elements to show it's a garden
  const guidePositions = [
    { col: 2, row: 2 }, { col: 3, row: 2 }, { col: 2, row: 3 },
  ];
  for (const pos of guidePositions) {
    if (pos.col >= gridSize || pos.row >= gridSize) continue;
    const screen = gridToScreen(pos.col, pos.row, origin.x, origin.y, viewDirection, gridSize);
    // Gentle pulsing dotted circle — "plant here"
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(139,195,74,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Tiny seed
    ctx.fillStyle = '#8D6E63';
    ctx.beginPath();
    ctx.ellipse(screen.x, screen.y, 2.5, 1.8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Sparkle
    const sparkleAlpha = 0.3 + Math.sin(time * 2 + pos.col + pos.row) * 0.2;
    ctx.globalAlpha = sparkleAlpha;
    ctx.fillStyle = '#FFD54F';
    const sz = 2;
    ctx.beginPath();
    ctx.moveTo(screen.x + 6, screen.y - 8 - sz);
    ctx.quadraticCurveTo(screen.x + 6 + sz * 0.3, screen.y - 8 - sz * 0.3, screen.x + 6 + sz, screen.y - 8);
    ctx.quadraticCurveTo(screen.x + 6 + sz * 0.3, screen.y - 8 + sz * 0.3, screen.x + 6, screen.y - 8 + sz);
    ctx.quadraticCurveTo(screen.x + 6 - sz * 0.3, screen.y - 8 + sz * 0.3, screen.x + 6 - sz, screen.y - 8);
    ctx.quadraticCurveTo(screen.x + 6 - sz * 0.3, screen.y - 8 - sz * 0.3, screen.x + 6, screen.y - 8 - sz);
    ctx.fill();
    ctx.restore();
  }

  // "Log a mood to grow your garden" text hint
  const centerScreen = gridToScreen(
    Math.floor(gridSize / 2), Math.floor(gridSize / 2),
    origin.x, origin.y, viewDirection, gridSize,
  );
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#5A4E3A';
  ctx.font = '11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('log a mood to grow your garden', centerScreen.x, centerScreen.y + 20);

  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   DECORATIONS — bench, birdbath, lantern, etc.
   ──────────────────────────────────────────────────────────── */

function drawDecoration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileType: string,
  isNight: boolean,
  time: number,
) {
  ctx.save();
  switch (tileType) {
    case 'bench':
      drawBench(ctx, x, y);
      break;
    case 'birdbath':
      drawBirdbath(ctx, x, y, time);
      break;
    case 'lantern':
      drawLantern(ctx, x, y, isNight, time);
      break;
    case 'wishing_well':
      drawWishingWell(ctx, x, y);
      break;
    case 'stone_path':
      drawStonePath(ctx, x, y);
      break;
    default:
      drawIsoDiamond(ctx, x, y, '#C4B8A0');
      break;
  }
  ctx.restore();
}

function drawBench(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const wood = '#B8956A';
  const dark = '#8B6238';
  // Legs
  ctx.fillStyle = dark;
  ctx.fillRect(x - 10, y - 4, 2, 6);
  ctx.fillRect(x + 8, y - 4, 2, 6);
  // Seat
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 6);
  ctx.lineTo(x + 12, y - 6);
  ctx.lineTo(x + 10, y - 4);
  ctx.lineTo(x - 10, y - 4);
  ctx.closePath();
  ctx.fill();
  // Back
  ctx.fillStyle = wood;
  ctx.fillRect(x - 10, y - 14, 2, 9);
  ctx.fillRect(x + 8, y - 14, 2, 9);
  // Back rail
  ctx.strokeStyle = wood;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 12);
  ctx.lineTo(x + 10, y - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 9);
  ctx.lineTo(x + 10, y - 9);
  ctx.stroke();
}

function drawBirdbath(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  // Base
  ctx.fillStyle = '#A0A0A4';
  ctx.fillRect(x - 3, y - 2, 6, 4);
  // Pillar
  ctx.fillStyle = '#B0B0B8';
  ctx.fillRect(x - 2, y - 10, 4, 10);
  // Bowl
  ctx.beginPath();
  ctx.ellipse(x, y - 10, 10, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#C0C0C8';
  ctx.fill();
  // Water
  ctx.beginPath();
  ctx.ellipse(x, y - 10.5, 8, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,180,220,0.5)';
  ctx.fill();
  // Water ripple
  ctx.beginPath();
  ctx.ellipse(x + Math.sin(time * 2) * 2, y - 10.5, 3 + Math.sin(time * 1.5), 1.2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, isNight: boolean, time: number) {
  // Post
  ctx.fillStyle = '#5A5A60';
  ctx.fillRect(x - 1.5, y - 4, 3, 8);
  // Lamp housing
  ctx.fillStyle = '#4A4A50';
  ctx.fillRect(x - 4, y - 14, 8, 10);
  // Cap
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 14);
  ctx.lineTo(x, y - 18);
  ctx.lineTo(x + 5, y - 14);
  ctx.closePath();
  ctx.fillStyle = '#4A4A50';
  ctx.fill();
  // Glass panels
  const glassColor = isNight ? '#FFE082' : '#E8E0D0';
  ctx.fillStyle = glassColor;
  ctx.fillRect(x - 3, y - 13, 6, 8);
  // Night glow
  if (isNight) {
    ctx.save();
    const flicker = 0.85 + Math.sin(time * 8) * 0.15;
    const glow = ctx.createRadialGradient(x, y - 9, 0, x, y - 9, 20);
    glow.addColorStop(0, `rgba(255,224,130,${0.4 * flicker})`);
    glow.addColorStop(1, 'rgba(255,224,130,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 9, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWishingWell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Base — stone circle
  ctx.fillStyle = '#A0A0A4';
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888890';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 10, 5, 0, 0, Math.PI);
  ctx.fill();
  // Inner opening
  ctx.fillStyle = '#2A2A30';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pillars
  ctx.fillStyle = '#A87A4A';
  ctx.fillRect(x - 8, y - 18, 2.5, 18);
  ctx.fillRect(x + 5.5, y - 18, 2.5, 18);
  // Roof beam
  ctx.fillStyle = '#8B6238';
  ctx.fillRect(x - 9, y - 19, 18, 2.5);
  // Tiny roof
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 19);
  ctx.lineTo(x, y - 24);
  ctx.lineTo(x + 10, y - 19);
  ctx.closePath();
  ctx.fillStyle = '#A87A4A';
  ctx.fill();
  // Bucket
  ctx.fillStyle = '#8B6238';
  ctx.fillRect(x - 2, y - 10, 4, 4);
  ctx.strokeStyle = '#6B5228';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x - 2, y - 10, 4, 4);
}

function drawStonePath(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const stones = [
    { dx: -5, dy: -1, rx: 5, ry: 2.5 },
    { dx: 4, dy: 1, rx: 4, ry: 2 },
    { dx: -1, dy: 3, rx: 3.5, ry: 1.8 },
  ];
  for (const s of stones) {
    ctx.beginPath();
    ctx.ellipse(x + s.dx, y + s.dy, s.rx, s.ry, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#C4B8A0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}
