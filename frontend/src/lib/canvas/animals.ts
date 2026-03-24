// ── Animal sprite animation + pathfinding ───────────────────

import type { AnimalState, Position } from '@/types/garden';

const ANIMAL_SPEED = 0.5; // tiles per second
const IDLE_DURATION = 2;  // seconds before moving again
const FRAME_RATE = 8;     // fps for sprite animation

export interface AnimalInstance {
  state: AnimalState;
  target: Position | null;
  idleTimer: number;
  frameTimer: number;
}

/**
 * Create a new animal at a position.
 */
export function createAnimal(
  type: AnimalState['type'],
  position: Position,
): AnimalInstance {
  return {
    state: {
      type,
      position,
      frame: 0,
      direction: 'right',
      state: 'idle',
    },
    target: null,
    idleTimer: Math.random() * IDLE_DURATION,
    frameTimer: 0,
  };
}

/**
 * Update an animal's state for one frame.
 */
export function updateAnimal(
  animal: AnimalInstance,
  deltaTime: number,
  gridSize: number,
  occupiedTiles: Set<string>,
): void {
  // Frame animation
  animal.frameTimer += deltaTime;
  if (animal.frameTimer >= 1 / FRAME_RATE) {
    animal.frameTimer = 0;
    animal.state.frame = (animal.state.frame + 1) % 4;
  }

  if (animal.state.state === 'idle') {
    animal.idleTimer -= deltaTime;
    if (animal.idleTimer <= 0) {
      // Pick a new target
      animal.target = pickRandomTarget(animal.state.position, gridSize, occupiedTiles);
      if (animal.target) {
        animal.state.state = 'walking';
        animal.state.direction = animal.target.col > animal.state.position.col ? 'right' : 'left';
      } else {
        animal.idleTimer = IDLE_DURATION;
      }
    }
    return;
  }

  if (animal.state.state === 'walking' && animal.target) {
    const dx = animal.target.col - animal.state.position.col;
    const dy = animal.target.row - animal.state.position.row;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.1) {
      animal.state.position = { ...animal.target };
      animal.target = null;
      animal.state.state = 'idle';
      animal.idleTimer = IDLE_DURATION + Math.random() * 2;
    } else {
      const step = ANIMAL_SPEED * deltaTime;
      const newCol = animal.state.position.col + (dx / dist) * step;
      const newRow = animal.state.position.row + (dy / dist) * step;
      // Clamp to grid bounds so animals never leave the garden
      animal.state.position.col = Math.max(0, Math.min(gridSize - 1, newCol));
      animal.state.position.row = Math.max(0, Math.min(gridSize - 1, newRow));
    }
  }
}

function pickRandomTarget(
  current: Position,
  gridSize: number,
  _occupied: Set<string>,
): Position | null {
  const candidates: Position[] = [];
  const offsets = [
    { col: -1, row: 0 }, { col: 1, row: 0 },
    { col: 0, row: -1 }, { col: 0, row: 1 },
    { col: -1, row: -1 }, { col: 1, row: 1 },
    { col: -1, row: 1 }, { col: 1, row: -1 },
  ];

  for (const off of offsets) {
    const nc = Math.round(current.col) + off.col;
    const nr = Math.round(current.row) + off.row;
    // Keep animals strictly inside the garden (1 tile margin from edge)
    if (nc >= 0 && nc < gridSize && nr >= 0 && nr < gridSize) {
      candidates.push({ col: nc, row: nr });
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Draw an animal placeholder on the canvas.
 * Each animal type gets a unique cute detailed drawing.
 */
export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  animal: AnimalInstance,
  screenX: number,
  screenY: number,
) {
  ctx.save();
  ctx.translate(screenX, screenY - 6);
  const flip = animal.state.direction === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  switch (animal.state.type) {
    case 'bird':
      drawBird(ctx, animal);
      break;
    case 'bunny':
      drawBunny(ctx, animal);
      break;
    case 'hedgehog':
      drawHedgehog(ctx);
      break;
    case 'butterfly':
      drawButterfly(ctx, animal);
      break;
    case 'cat':
      drawCat(ctx, animal);
      break;
  }

  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, animal: AnimalInstance) {
  const hop = animal.state.state === 'walking' ? Math.sin(animal.frameTimer * 20) * 1.5 : 0;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, -2 + hop, 5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#C4944A';
  ctx.fill();
  // Breast
  ctx.beginPath();
  ctx.ellipse(2, -1 + hop, 3, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E8C48A';
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(4, -5 + hop, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#C4944A';
  ctx.fill();
  // Eye
  ctx.beginPath();
  ctx.arc(5, -5.5 + hop, 0.8, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5.2, -5.8 + hop, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF';
  ctx.fill();
  // Beak
  ctx.beginPath();
  ctx.moveTo(7, -5 + hop);
  ctx.lineTo(9, -4.5 + hop);
  ctx.lineTo(7, -4 + hop);
  ctx.closePath();
  ctx.fillStyle = '#FF8F00';
  ctx.fill();
  // Wing
  ctx.beginPath();
  ctx.ellipse(-2, -3 + hop, 3.5, 2.5, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#A87A3A';
  ctx.fill();
  // Tail
  ctx.beginPath();
  ctx.moveTo(-5, -3 + hop);
  ctx.lineTo(-8, -6 + hop);
  ctx.lineTo(-7, -2 + hop);
  ctx.closePath();
  ctx.fillStyle = '#A87A3A';
  ctx.fill();
  // Legs
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(1, 2 + hop);
  ctx.lineTo(1, 4);
  ctx.lineTo(3, 4);
  ctx.moveTo(-1, 2 + hop);
  ctx.lineTo(-1, 4);
  ctx.lineTo(1, 4);
  ctx.stroke();
}

function drawBunny(ctx: CanvasRenderingContext2D, animal: AnimalInstance) {
  const bounce = animal.state.state === 'walking' ? Math.abs(Math.sin(animal.frameTimer * 15)) * 3 : 0;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, -1 - bounce, 5.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E8DCD0';
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(4, -5 - bounce, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#E8DCD0';
  ctx.fill();
  // Ears
  ctx.beginPath();
  ctx.ellipse(2, -12 - bounce, 2, 5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#E8DCD0';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(2.5, -12 - bounce, 1, 3.5, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, -11 - bounce, 2, 4.5, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#E8DCD0';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5.3, -11 - bounce, 1, 3, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  // Eye
  ctx.beginPath();
  ctx.arc(5.5, -5.5 - bounce, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#3D2F24';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5.8, -5.8 - bounce, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF';
  ctx.fill();
  // Nose
  ctx.beginPath();
  ctx.ellipse(7, -4 - bounce, 1, 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  // Fluffy tail
  ctx.beginPath();
  ctx.arc(-5.5, -1 - bounce, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
}

function drawHedgehog(ctx: CanvasRenderingContext2D) {
  // Spines
  const spineColors = ['#6B5030', '#8B7355', '#5A4020'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI - Math.PI * 0.1;
    const sx = Math.cos(angle) * 3;
    const sy = Math.sin(angle) * 3 - 3;
    const ex = Math.cos(angle) * 8;
    const ey = Math.sin(angle) * 6 - 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = spineColors[i % spineColors.length];
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  // Body
  ctx.beginPath();
  ctx.ellipse(0, -2, 6, 4.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#B09070';
  ctx.fill();
  // Face
  ctx.beginPath();
  ctx.ellipse(5, -2, 3.5, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#D4BC98';
  ctx.fill();
  // Eye
  ctx.beginPath();
  ctx.arc(6, -3, 0.8, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fill();
  // Nose
  ctx.beginPath();
  ctx.arc(8, -1.5, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#3D2F24';
  ctx.fill();
  // Feet
  ctx.fillStyle = '#D4BC98';
  ctx.beginPath();
  ctx.ellipse(-2, 2, 2, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3, 2, 2, 1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawButterfly(ctx: CanvasRenderingContext2D, animal: AnimalInstance) {
  const wingAngle = Math.sin(animal.frameTimer * 25) * 0.4;
  const floatY = Math.sin(animal.frameTimer * 10) * 2;
  ctx.translate(0, floatY - 8);
  // Wings
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.beginPath();
  ctx.ellipse(-4, -2, 4.5, 3, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(184,154,184,0.75)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-3, 1.5, 3, 2, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(206,147,216,0.65)';
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(-wingAngle);
  ctx.beginPath();
  ctx.ellipse(4, -2, 4.5, 3, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(184,154,184,0.75)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3, 1.5, 3, 2, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(206,147,216,0.65)';
  ctx.fill();
  ctx.restore();
  // Wing pattern dots
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(-3.5, -1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3.5, -1.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 1, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3D2F24';
  ctx.fill();
  // Antennae
  ctx.strokeStyle = '#3D2F24';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(-2, -7, -3, -8);
  ctx.moveTo(0, -3);
  ctx.quadraticCurveTo(2, -7, 3, -8);
  ctx.stroke();
  ctx.fillStyle = '#3D2F24';
  ctx.beginPath();
  ctx.arc(-3, -8, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -8, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCat(ctx: CanvasRenderingContext2D, animal: AnimalInstance) {
  const tailWag = Math.sin(animal.frameTimer * 6) * 0.3;
  // Tail
  ctx.save();
  ctx.translate(-6, -3);
  ctx.rotate(tailWag);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-4, -8, -2, -12);
  ctx.strokeStyle = '#E8A860';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  // Body
  ctx.beginPath();
  ctx.ellipse(0, -1, 6, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E8A860';
  ctx.fill();
  // Stripes
  ctx.strokeStyle = 'rgba(180,120,60,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -4); ctx.lineTo(-1, 2);
  ctx.moveTo(1, -4); ctx.lineTo(2, 2);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(5, -4, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#E8A860';
  ctx.fill();
  // Ears
  ctx.beginPath();
  ctx.moveTo(3, -7);
  ctx.lineTo(2, -11);
  ctx.lineTo(5, -8);
  ctx.closePath();
  ctx.fillStyle = '#E8A860';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7, -7);
  ctx.lineTo(8, -11);
  ctx.lineTo(5, -8);
  ctx.closePath();
  ctx.fillStyle = '#E8A860';
  ctx.fill();
  // Inner ears
  ctx.beginPath();
  ctx.moveTo(3.3, -7.5);
  ctx.lineTo(2.8, -10);
  ctx.lineTo(4.5, -8);
  ctx.closePath();
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6.7, -7.5);
  ctx.lineTo(7.2, -10);
  ctx.lineTo(5.5, -8);
  ctx.closePath();
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  // Eyes
  ctx.beginPath();
  ctx.ellipse(4, -4.5, 1, 1.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7CB342';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -4.5, 0.4, 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6.5, -4.5, 1, 1.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#7CB342';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6.5, -4.5, 0.4, 1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1A1A1A';
  ctx.fill();
  // Nose
  ctx.beginPath();
  ctx.moveTo(5.3, -3.2);
  ctx.lineTo(4.8, -2.5);
  ctx.lineTo(5.8, -2.5);
  ctx.closePath();
  ctx.fillStyle = '#F4B8C8';
  ctx.fill();
  // Whiskers
  ctx.strokeStyle = 'rgba(60,50,40,0.3)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(3, -3); ctx.lineTo(-1, -3.5);
  ctx.moveTo(3, -2.5); ctx.lineTo(-1, -1.5);
  ctx.moveTo(7.5, -3); ctx.lineTo(11, -3.5);
  ctx.moveTo(7.5, -2.5); ctx.lineTo(11, -1.5);
  ctx.stroke();
}
