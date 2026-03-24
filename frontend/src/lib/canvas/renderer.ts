// ── Core isometric renderer ─────────────────────────────────

import type { GardenTile, ViewDirection, Position } from '@/types/garden';
import { TILE_W, TILE_H, TILE_DEPTH } from './sprites';

/**
 * Convert grid (col, row) to screen (x, y) pixel position
 * for isometric 2:1 cabinet projection.
 */
export function gridToScreen(
  col: number,
  row: number,
  originX: number,
  originY: number,
  viewDirection: ViewDirection = 0,
  gridSize: number = 4,
): { x: number; y: number } {
  const { c, r } = rotateCoords(col, row, viewDirection, gridSize);
  const x = originX + (c - r) * (TILE_W / 2);
  const y = originY + (c + r) * (TILE_H / 2);
  return { x, y };
}

export function screenToGrid(
  px: number,
  py: number,
  originX: number,
  originY: number,
  viewDirection: ViewDirection = 0,
  gridSize: number = 4,
): Position {
  const relX = px - originX;
  const relY = py - originY;
  const c = (relX / (TILE_W / 2) + relY / (TILE_H / 2)) / 2;
  const r = (relY / (TILE_H / 2) - relX / (TILE_W / 2)) / 2;
  return reverseRotateCoords(Math.floor(c), Math.floor(r), viewDirection, gridSize);
}

function rotateCoords(
  col: number, row: number, dir: ViewDirection, gridSize: number,
): { c: number; r: number } {
  const max = gridSize - 1;
  switch (dir) {
    case 0: return { c: col, r: row };
    case 1: return { c: row, r: max - col };
    case 2: return { c: max - col, r: max - row };
    case 3: return { c: max - row, r: col };
  }
}

function reverseRotateCoords(
  c: number, r: number, dir: ViewDirection, gridSize: number,
): Position {
  const max = gridSize - 1;
  switch (dir) {
    case 0: return { col: c, row: r };
    case 1: return { col: max - r, row: c };
    case 2: return { col: max - c, row: max - r };
    case 3: return { col: r, row: max - c };
  }
}

export function sortForRendering(
  tiles: GardenTile[], viewDirection: ViewDirection, gridSize: number,
): GardenTile[] {
  return [...tiles].sort((a, b) => {
    const ar = rotateCoords(a.grid_col, a.grid_row, viewDirection, gridSize);
    const br = rotateCoords(b.grid_col, b.grid_row, viewDirection, gridSize);
    return (ar.c + ar.r) - (br.c + br.r);
  });
}

export function getCanvasOrigin(
  canvasWidth: number, canvasHeight: number, gridSize: number,
): { x: number; y: number } {
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2 - (gridSize * TILE_H) / 2 + TILE_DEPTH,
  };
}

/* ────────────────────────────────────────────────────────────
   Isometric shape drawing — these are the building blocks
   for the entire garden scene
   ──────────────────────────────────────────────────────────── */

/** Flat isometric diamond */
export function drawIsoDiamond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  fillColor: string,
  strokeColor: string = 'rgba(61,47,36,0.08)',
) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/** Isometric cube with three visible faces */
export function drawIsoCube(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  topColor: string, leftColor: string, rightColor: string,
) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const d = TILE_DEPTH;

  // Top face
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  // Left face
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x, y + hh + d);
  ctx.lineTo(x - hw, y + d);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();

  // Right face
  ctx.beginPath();
  ctx.moveTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x, y + hh + d);
  ctx.lineTo(x + hw, y + d);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
}

/* ────────────────────────────────────────────────────────────
   Detailed plant drawing — real pixel-art style plants,
   flowers, mushrooms, trees per mood and variant
   ──────────────────────────────────────────────────────────── */

/** Colour palette per mood */
const MOOD_PALETTES: Record<string, { primary: string; secondary: string; accent: string; stem: string }> = {
  happy:    { primary: '#FFD54F', secondary: '#FFF176', accent: '#FF8A65', stem: '#66BB6A' },
  calm:     { primary: '#81C784', secondary: '#A5D6A7', accent: '#4DB6AC', stem: '#388E3C' },
  sad:      { primary: '#90CAF9', secondary: '#64B5F6', accent: '#7986CB', stem: '#78909C' },
  stressed: { primary: '#CE93D8', secondary: '#BA68C8', accent: '#7E57C2', stem: '#6D4C7A' },
  excited:  { primary: '#FF8A65', secondary: '#FFAB91', accent: '#FFD54F', stem: '#4CAF50' },
  neutral:  { primary: '#BCAAA4', secondary: '#D7CCC8', accent: '#A1887F', stem: '#8D6E63' },
  grateful: { primary: '#F48FB1', secondary: '#F8BBD0', accent: '#CE93D8', stem: '#66BB6A' },
  tired:    { primary: '#B39DDB', secondary: '#9FA8DA', accent: '#7986CB', stem: '#78909C' },
  anxious:  { primary: '#C9A882', secondary: '#B0896E', accent: '#D4B896', stem: '#8B7355' },
  hopeful:  { primary: '#7ABFAF', secondary: '#A3D9CC', accent: '#5DA899', stem: '#4A8B7A' },
  angry:    { primary: '#C46A5A', secondary: '#D4877A', accent: '#E8A090', stem: '#8B4A3A' },
  loved:    { primary: '#C48A9A', secondary: '#D4A0B0', accent: '#E8B8C4', stem: '#8B5A6A' },
  confused: { primary: '#9A8AB8', secondary: '#B8A8D0', accent: '#C4B8DC', stem: '#6A5A8B' },
  proud:    { primary: '#D4A84A', secondary: '#E8C86A', accent: '#F0D88A', stem: '#8B7A2A' },
};

/** Draw a detailed plant with proper botanical appearance */
export function drawPlantPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileType: string,
) {
  const mood = tileType.split('_')[0];
  const variant = tileType.split('_').slice(1).join('_');
  const pal = MOOD_PALETTES[mood] ?? MOOD_PALETTES.calm;

  ctx.save();
  switch (variant) {
    case 'sprout':
      drawSprout(ctx, x, y, pal);
      break;
    case 'standard':
      drawStandardPlant(ctx, x, y, pal, mood);
      break;
    case 'bloom':
      drawBloomPlant(ctx, x, y, pal, mood);
      break;
    default:
      drawSprout(ctx, x, y, pal);
  }
  ctx.restore();
}

/* ── Sprout — small emerging seedling ─────────────────────── */
function drawSprout(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  pal: { primary: string; secondary: string; accent: string; stem: string },
) {
  // Soil mound
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8D6E63';
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();

  // Stem
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.quadraticCurveTo(x + 2, y - 6, x + 1, y - 12);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Left leaf
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.quadraticCurveTo(x - 7, y - 12, x - 3, y - 9);
  ctx.fillStyle = pal.primary;
  ctx.fill();
  drawLeafShape(ctx, x - 1, y - 8, 5, 3, -0.4, pal.primary);

  // Right leaf
  drawLeafShape(ctx, x + 1, y - 10, 5, 3, 0.3, pal.secondary);

  // Tiny sparkle
  drawSparkle(ctx, x + 3, y - 14, 2, pal.accent);
}

/* ── Standard — medium flowering plant ────────────────────── */
function drawStandardPlant(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  pal: { primary: string; secondary: string; accent: string; stem: string },
  mood: string,
) {
  // Grass tufts around base
  drawGrassTuft(ctx, x - 6, y + 3, pal.stem);
  drawGrassTuft(ctx, x + 5, y + 2, pal.stem);

  // Main stem
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.quadraticCurveTo(x - 1, y - 8, x, y - 18);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Side branch left
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 8);
  ctx.quadraticCurveTo(x - 10, y - 14, x - 8, y - 12);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Side branch right
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 12);
  ctx.quadraticCurveTo(x + 9, y - 17, x + 7, y - 15);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Leaves
  drawLeafShape(ctx, x - 8, y - 13, 7, 4, -0.6, pal.primary);
  drawLeafShape(ctx, x + 7, y - 16, 7, 4, 0.5, pal.secondary);
  drawLeafShape(ctx, x - 3, y - 6, 5, 3, -0.3, pal.primary);

  // Flower/feature per mood
  if (mood === 'happy' || mood === 'grateful') {
    drawFlower(ctx, x, y - 20, 5, pal);
    drawFlower(ctx, x - 7, y - 14, 3.5, pal);
  } else if (mood === 'calm' || mood === 'neutral') {
    drawRoundBush(ctx, x, y - 18, 7, pal);
  } else if (mood === 'sad') {
    drawDroopingPlant(ctx, x, y - 18, pal);
  } else if (mood === 'stressed') {
    drawThornyPlant(ctx, x, y - 18, pal);
  } else if (mood === 'excited') {
    drawBurstFlower(ctx, x, y - 20, 6, pal);
  } else if (mood === 'tired') {
    drawDroopyMushroom(ctx, x, y - 14, pal);
  }
}

/* ── Bloom — full, lush detailed plant ────────────────────── */
function drawBloomPlant(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  pal: { primary: string; secondary: string; accent: string; stem: string },
  mood: string,
) {
  // Rich grass base
  for (let i = -8; i <= 8; i += 4) {
    drawGrassTuft(ctx, x + i, y + 2 + Math.random() * 2, pal.stem);
  }

  // Thick main stem
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.bezierCurveTo(x - 2, y - 8, x + 2, y - 18, x, y - 28);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Multiple branches
  const branches = [
    { fromY: -6,  toX: -12, toY: -14 },
    { fromY: -10, toX: 11,  toY: -18 },
    { fromY: -16, toX: -9,  toY: -22 },
    { fromY: -20, toX: 8,   toY: -26 },
  ];
  for (const b of branches) {
    ctx.beginPath();
    ctx.moveTo(x, y + b.fromY);
    ctx.quadraticCurveTo(x + b.toX * 0.5, y + b.toY + 2, x + b.toX, y + b.toY);
    ctx.strokeStyle = pal.stem;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();
    drawLeafShape(ctx, x + b.toX, y + b.toY, 8, 5, b.toX > 0 ? 0.4 : -0.4, pal.primary);
  }

  // Lush leaf cluster
  drawLeafShape(ctx, x - 5, y - 10, 6, 4, -0.5, pal.secondary);
  drawLeafShape(ctx, x + 4, y - 14, 6, 4, 0.5, pal.primary);

  // Flowers — more for bloom variant
  if (mood === 'happy' || mood === 'grateful' || mood === 'excited') {
    drawFlower(ctx, x, y - 30, 7, pal);
    drawFlower(ctx, x - 10, y - 16, 4.5, pal);
    drawFlower(ctx, x + 9, y - 20, 5, pal);
    drawFlower(ctx, x - 6, y - 24, 3.5, pal);
  } else if (mood === 'calm') {
    drawRoundBush(ctx, x, y - 26, 10, pal);
    drawFlower(ctx, x - 6, y - 22, 3, pal);
    drawFlower(ctx, x + 5, y - 24, 3, pal);
  } else if (mood === 'sad') {
    drawWeepingWillow(ctx, x, y - 26, pal);
  } else if (mood === 'stressed') {
    drawThornyPlant(ctx, x, y - 26, pal);
    drawThornyPlant(ctx, x - 6, y - 18, pal);
  } else if (mood === 'neutral') {
    drawRoundBush(ctx, x, y - 26, 10, pal);
    drawRoundBush(ctx, x - 7, y - 18, 6, pal);
  } else if (mood === 'tired') {
    drawDroopyMushroom(ctx, x, y - 22, pal);
    drawDroopyMushroom(ctx, x + 8, y - 16, pal);
  }

  // Sparkles around bloom
  drawSparkle(ctx, x + 10, y - 32, 2.5, pal.accent);
  drawSparkle(ctx, x - 8, y - 28, 2, pal.accent);
  drawSparkle(ctx, x + 4, y - 34, 1.5, pal.accent);
}

/* ────────────────────────────────────────────────────────────
   Helper drawing functions
   ──────────────────────────────────────────────────────────── */

/** Draw a leaf shape with rotation */
function drawLeafShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  length: number, width: number,
  angle: number, color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, -length * 0.4, 0, -length);
  ctx.quadraticCurveTo(-width, -length * 0.4, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  // Leaf vein
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.lineTo(0, -length + 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

/** Tiny grass tuft */
function drawGrassTuft(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 2, y - 5, x - 1, y - 6);
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 1, y - 6, x + 2, y - 5);
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x, y - 7, x, y - 7);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** Multi-petal flower */
function drawFlower(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  pal: { primary: string; secondary: string; accent: string },
) {
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * size * 0.6;
    const py = cy + Math.sin(angle) * size * 0.6;
    ctx.beginPath();
    ctx.ellipse(px, py, size * 0.5, size * 0.3, angle, 0, Math.PI * 2);
    ctx.fillStyle = pal.primary;
    ctx.fill();
  }
  // Inner shadow ring
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = pal.secondary;
  ctx.fill();
  // Centre
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = pal.accent;
  ctx.fill();
}

/** Burst/star shaped flower (excited mood) */
function drawBurstFlower(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  pal: { primary: string; secondary: string; accent: string },
) {
  const points = 8;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.45;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = pal.primary;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = pal.accent;
  ctx.fill();
}

/** Round bush shape */
function drawRoundBush(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  pal: { primary: string; secondary: string },
) {
  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 2, size, size * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fill();
  // Main shape — three overlapping circles
  const offsets = [
    { dx: -size * 0.3, dy: 0, r: size * 0.7, c: pal.primary },
    { dx: size * 0.3, dy: -1, r: size * 0.65, c: pal.secondary },
    { dx: 0, dy: -size * 0.3, r: size * 0.75, c: pal.primary },
  ];
  for (const o of offsets) {
    ctx.beginPath();
    ctx.arc(cx + o.dx, cy + o.dy, o.r, 0, Math.PI * 2);
    ctx.fillStyle = o.c;
    ctx.fill();
  }
}

/** Drooping plant for sad mood */
function drawDroopingPlant(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  pal: { primary: string; secondary: string; stem: string },
) {
  // Drooping stem
  ctx.beginPath();
  ctx.moveTo(cx, cy + 4);
  ctx.quadraticCurveTo(cx + 3, cy - 2, cx + 6, cy + 1);
  ctx.strokeStyle = pal.stem;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Drooping head
  ctx.beginPath();
  ctx.arc(cx + 7, cy + 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = pal.primary;
  ctx.fill();
  // Teardrop
  ctx.beginPath();
  ctx.ellipse(cx + 9, cy + 6, 1.2, 2, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#90CAF9';
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Weeping willow for sad bloom */
function drawWeepingWillow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  pal: { primary: string; secondary: string; stem: string },
) {
  // Canopy drooping tendrils
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 3, cy);
    ctx.quadraticCurveTo(cx + i * 5, cy + 8, cx + i * 4, cy + 14);
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Round top
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = pal.secondary;
  ctx.fill();
}

/** Thorny/spiky plant for stressed */
function drawThornyPlant(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  pal: { primary: string; secondary: string; stem: string },
) {
  // Spiky shape
  const spikes = 6;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 7 : 3;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = pal.primary;
  ctx.fill();
  ctx.strokeStyle = pal.secondary;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

/** Droopy mushroom for tired */
function drawDroopyMushroom(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  pal: { primary: string; secondary: string; accent: string },
) {
  // Stem
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy + 6);
  ctx.lineTo(cx - 1, cy);
  ctx.lineTo(cx + 2, cy);
  ctx.lineTo(cx + 2, cy + 6);
  ctx.fillStyle = '#F5F0E8';
  ctx.fill();
  // Cap
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, 6, 4, 0, Math.PI, 0);
  ctx.fillStyle = pal.primary;
  ctx.fill();
  // Spots
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 3, 1.2, 0, Math.PI * 2);
  ctx.arc(cx + 2.5, cy - 2, 1, 0, Math.PI * 2);
  ctx.fillStyle = pal.secondary;
  ctx.fill();
}

/** Four-pointed sparkle */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, color: string,
) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.3, y - size * 0.3, x + size, y);
  ctx.quadraticCurveTo(x + size * 0.3, y + size * 0.3, x, y + size);
  ctx.quadraticCurveTo(x - size * 0.3, y + size * 0.3, x - size, y);
  ctx.quadraticCurveTo(x - size * 0.3, y - size * 0.3, x, y - size);
  ctx.fill();
  ctx.restore();
}

/* ────────────────────────────────────────────────────────────
   Grid sizing & placement helpers
   ──────────────────────────────────────────────────────────── */

export function getGridSize(totalTilesPlaced: number): number {
  // Garden grows as you log more moods — feels rewarding
  if (totalTilesPlaced <= 3)  return 4;   // tiny seedling garden
  if (totalTilesPlaced <= 8)  return 5;   // small patch
  if (totalTilesPlaced <= 16) return 6;   // cozy plot
  if (totalTilesPlaced <= 28) return 7;   // blooming garden
  if (totalTilesPlaced <= 45) return 8;   // flourishing meadow
  if (totalTilesPlaced <= 70) return 9;   // grand estate
  return 10;                               // legendary garden
}

export function getSpiralPositions(gridSize: number): Position[] {
  const centre = Math.floor(gridSize / 2);
  const positions: (Position & { dist: number })[] = [];
  for (let c = 0; c < gridSize; c++) {
    for (let r = 0; r < gridSize; r++) {
      positions.push({ col: c, row: r, dist: Math.abs(c - centre) + Math.abs(r - centre) });
    }
  }
  return positions.sort((a, b) => a.dist - b.dist);
}

export function getCottageFootprint(_gridSize: number): Set<string> {
  const positions = new Set<string>();
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 2; r++) {
      positions.add(`${c},${r}`);
    }
  }
  return positions;
}

/**
 * Left-to-right, top-to-bottom placement (date-ordered reading).
 * Skips the cottage footprint (cols 0-2, rows 0-1).
 */
export function getNextAvailablePosition(
  existingTiles: GardenTile[], gridSize: number,
): Position {
  const occupied = new Set(existingTiles.map((t) => `${t.grid_col},${t.grid_row}`));
  const cottage = getCottageFootprint(gridSize);
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const key = `${col},${row}`;
      if (!occupied.has(key) && !cottage.has(key)) return { col, row };
    }
  }
  return { col: gridSize - 1, row: gridSize - 1 };
}
