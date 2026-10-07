// Sized close to a typical viewport so the default camera position (see
// field.js) always lands on a well-populated view of at least one hall,
// rather than a mostly-empty crop of an oversized cell.
export const CELL_W = 1680;
export const CELL_H = 1300;
// One hall per artist, laid out as a single row that the field repeats in
// every direction. Each repeat above is shifted ROW_SHIFT halls sideways, so
// with seven halls every one of a hall's eight neighbours is a different
// artist. A plain 3×3 wrap can't do that: on a 3×3 torus every cell borders
// every other, so the two halls it had to repeat always landed next door.
export const GRID_COLS = 7;
export const GRID_ROWS = 1;
export const ROW_SHIFT = 3;
export const WORLD_W = CELL_W * GRID_COLS;
export const WORLD_H = CELL_H * GRID_ROWS;

const MARGIN = 80;
// Keeps tiles clear of the artist name/bio, which always renders at (80, 60).
const LABEL_ZONE = { x: 0, y: 0, w: 620, h: 220 };
const GAP = 140;
// Bounds for a tile's long side. The short side follows from the work's own
// proportions, so the tile is the painting's true shape at a random size.
const MIN_LONG = 260;
const MAX_LONG = 460;
const SLOT_COUNT = 6;
const RANDOM_ATTEMPTS = 120;
const GRID_STEP = 30;

// Deterministic per-hall PRNG so a hall's scatter layout stays put across
// reloads (and across the multiple cells a repeated hall lands in) instead
// of reshuffling every render.
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlaps(a, b, gap) {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isFree(candidate, placed) {
  if (overlaps(candidate, LABEL_ZONE, 40)) return false;
  return !placed.some((p) => overlaps(candidate, p, GAP));
}

// Finds a spot for one tile: random sampling first (cheap, and what gives
// the layout its organic feel), then, if a tight cell makes every random
// guess collide, an exhaustive grid scan so we always find a genuinely
// free spot instead of ever reusing the same fallback coordinate for two
// tiles (which used to stack them exactly on top of each other).
function findSpot(w, h, placed, rng, areaW, areaH) {
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const candidate = {
      x: MARGIN + rng() * Math.max(0, areaW - w),
      y: MARGIN + rng() * Math.max(0, areaH - h),
      w,
      h,
    };
    if (isFree(candidate, placed)) return candidate;
  }

  const xs = shuffle(
    Array.from({ length: Math.max(1, Math.floor((areaW - w) / GRID_STEP) + 1) }, (_, i) => MARGIN + i * GRID_STEP),
    rng
  );
  const ys = shuffle(
    Array.from({ length: Math.max(1, Math.floor((areaH - h) / GRID_STEP) + 1) }, (_, i) => MARGIN + i * GRID_STEP),
    rng
  );
  for (const y of ys) {
    for (const x of xs) {
      const candidate = { x, y, w, h };
      if (isFree(candidate, placed)) return candidate;
    }
  }

  return null;
}

// Scatters works at random (but seeded) positions/sizes instead of a strict
// grid, gives the field an organic, non-uniform feel while guaranteeing no
// visual overlap between tiles or with the artist label.
export function layoutWorks(works, hallId) {
  const rng = mulberry32(hashSeed(hallId || "hall"));
  const areaW = CELL_W - MARGIN * 2;
  const areaH = CELL_H - MARGIN * 2;
  const placed = [];

  // Never more tiles than the hall has works, so nothing repeats in a room.
  for (let i = 0; i < Math.min(SLOT_COUNT, works.length); i++) {
    const work = works[i];
    const aspect = work.aspect || 0.75;
    let long = MIN_LONG + rng() * (MAX_LONG - MIN_LONG);
    let w = aspect >= 1 ? long : long * aspect;
    let h = aspect >= 1 ? long / aspect : long;

    let rect = findSpot(w, h, placed, rng, areaW, areaH);
    // The cell is genuinely packed, shrink the tile a bit and retry rather
    // than ever falling back to a fixed, potentially colliding coordinate.
    while (!rect && long > MIN_LONG * 0.5) {
      long *= 0.85;
      w *= 0.85;
      h *= 0.85;
      rect = findSpot(w, h, placed, rng, areaW, areaH);
    }
    if (!rect) continue;

    placed.push({ work, ...rect });
  }

  return placed;
}

export function labelPosition() {
  return { x: 80, y: 60 };
}
