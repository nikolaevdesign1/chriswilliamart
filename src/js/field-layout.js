export const CELL_W = 2000;
export const CELL_H = 1300;
export const GRID_COLS = 3;
export const GRID_ROWS = 3;
export const WORLD_W = CELL_W * GRID_COLS;
export const WORLD_H = CELL_H * GRID_ROWS;

const COLUMN_X = [80, 560, 1040, 1520];
const TILE_W = 400;
const TALL_H = 560;
const SHORT_H = 320;
const ROW_GAP = 40;
const SLOTS = COLUMN_X.length * 2; // 2 rows per column — fills the cell densely

// Densely fills a hall's cell with its works, cycling through the list
// (repeating works if there are fewer than SLOTS) so no cell is left with
// large empty gaps.
export function layoutWorks(works) {
  const slots = [];
  for (let i = 0; i < SLOTS; i++) {
    const col = i % COLUMN_X.length;
    const row = Math.floor(i / COLUMN_X.length);
    const isTall = (col + row) % 2 === 0;
    const x = COLUMN_X[col];
    const y = 280 + row * (TALL_H + ROW_GAP);
    slots.push({
      work: works[i % works.length],
      x,
      y,
      w: TILE_W,
      h: isTall ? TALL_H : SHORT_H,
    });
  }
  return slots;
}

export function labelPosition() {
  return { x: 80, y: 60 };
}
