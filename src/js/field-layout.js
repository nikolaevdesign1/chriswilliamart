export const CELL_W = 2200;
export const CELL_H = 1500;
export const GRID_COLS = 3;
export const GRID_ROWS = 3;
export const WORLD_W = CELL_W * GRID_COLS;
export const WORLD_H = CELL_H * GRID_ROWS;

const COLUMN_X = [140, 620, 1100, 1580];
const TILE_W = 340;
const TALL_H = 480;
const SHORT_H = 260;

// Deterministic scatter of a hall's works inside its cell, in the same loose
// masonry rhythm as the original wall layout.
export function layoutWorks(works) {
  return works.map((work, index) => {
    const col = index % COLUMN_X.length;
    const isTall = index % 2 === 0;
    const x = COLUMN_X[col];
    const y = 120 + (col % 2 === 0 ? 0 : 220) + Math.floor(index / COLUMN_X.length) * 560;
    return {
      work,
      x,
      y,
      w: TILE_W,
      h: isTall ? TALL_H : SHORT_H,
    };
  });
}

export function labelPosition() {
  return { x: 140, y: 1160 };
}
