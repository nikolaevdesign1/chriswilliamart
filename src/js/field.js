import { halls, workNumber, artistLine } from "../data/halls.js";
import { url } from "./router.js";
import { CELL_W, CELL_H, GRID_COLS, GRID_ROWS, ROW_SHIFT, WORLD_W, WORLD_H, layoutWorks, labelPosition } from "./field-layout.js";

const SMOOTHING = 0.085;

let root, world;
let camera = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let dragging = false;
let didDrag = false;
let suppressClick = false;
let startPos = { x: 0, y: 0 };
let last = { x: 0, y: 0 };
let rafId = null;
const DRAG_THRESHOLD = 6;
let onTileHover = null;
let onTileLeave = null;
let onTileClick = null;
let hoveredTile = null;
// World positions are read once at build time. Parsing them back out of each
// node's inline style every frame forced a style read per element per frame.
let items = [];
let lastCamera = { x: NaN, y: NaN };

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function track(node, x, y) {
  items.push({ node, x, y, sx: NaN, sy: NaN });
}

function build() {
  world.innerHTML = "";
  items = [];
  // One cell per hall (see GRID_COLS); the slanted wrap in nearestCopy()
  // keeps any two copies of the same hall well apart.
  const cellCount = GRID_COLS * GRID_ROWS;
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const hall = halls[cellIndex % halls.length];
    const col = cellIndex % GRID_COLS;
    const row = Math.floor(cellIndex / GRID_COLS);
    const baseX = col * CELL_W;
    const baseY = row * CELL_H;

    const label = labelPosition();
    const heading = document.createElement("div");
    heading.className = "field-label";
    heading.style.setProperty("--x", baseX + label.x);
    heading.style.setProperty("--y", baseY + label.y);
    heading.innerHTML = `
      <p class="field-label__name">${hall.artist.name}</p>
      <p class="field-label__meta"><span>${artistLine(hall.artist)}</span><span>${hall.artist.movement}</span></p>
      <p class="field-label__bio">${hall.artist.bio}</p>`;
    world.appendChild(heading);
    track(heading, baseX + label.x, baseY + label.y);

    const works = layoutWorks(hall.works, hall.id);

    // The very first cell's content sets where the camera starts, computed
    // from the actual placed tiles (their bounding-box centroid) rather than
    // a guessed ratio of the cell size, so the opening view is guaranteed to
    // land on real content regardless of cell size or scatter tuning.
    if (cellIndex === 0 && works.length) {
      const minX = Math.min(...works.map((w) => w.x));
      const maxX = Math.max(...works.map((w) => w.x + w.w));
      const minY = Math.min(...works.map((w) => w.y));
      const maxY = Math.max(...works.map((w) => w.y + w.h));
      const focus = { x: baseX + (minX + maxX) / 2, y: baseY + (minY + maxY) / 2 };
      camera = { ...focus };
      target = { ...focus };
    }

    works.forEach(({ work, x, y, w, h }) => {
      const tile = document.createElement("a");
      tile.className = "field-tile";
      tile.href = url(`/work/${hall.id}/${work.id}`);
      tile.dataset.hallId = hall.id;
      tile.dataset.workId = work.id;
      tile.style.setProperty("--x", baseX + x);
      tile.style.setProperty("--y", baseY + y);
      tile.style.setProperty("--w", w);
      tile.style.setProperty("--h", h);

      // Catalogue number above the picture, title and artist below it. The
      // picture keeps its own clipped frame so neither line is cut off, and
      // so the ripple plane, which tracks [data-ripple-frame], covers the
      // artwork rather than the text.
      const num = document.createElement("span");
      num.className = "field-tile__num";
      num.textContent = workNumber(hall.id, work.id);
      tile.appendChild(num);

      const frame = document.createElement("span");
      frame.className = "field-tile__frame";
      frame.dataset.rippleFrame = "";

      const img = document.createElement("img");
      // Not loaded yet: loadFieldImages() starts with the tiles on screen.
      img.dataset.src = work.thumb;
      img.alt = work.title;
      img.decoding = "async";
      img.draggable = false;
      frame.appendChild(img);
      tile.appendChild(frame);

      const caption = document.createElement("span");
      caption.className = "field-tile__caption";
      caption.innerHTML = `
        <span class="field-tile__title">${work.title}</span>
        <span class="field-tile__artist">${hall.artist.name}</span>
      `;
      tile.appendChild(caption);

      tile.draggable = false;
      tile.addEventListener("dragstart", (event) => event.preventDefault());
      tile.addEventListener("mouseenter", () => {
        hoveredTile = tile;
        onTileHover?.(tile, hall, work);
      });
      tile.addEventListener("mousemove", (event) => onTileHover?.(tile, hall, work, event));
      tile.addEventListener("mouseleave", () => {
        if (hoveredTile === tile) hoveredTile = null;
        onTileLeave?.(tile);
      });
      tile.addEventListener("click", (event) => {
        event.preventDefault();
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        onTileClick?.(tile, hall, work);
      });

      world.appendChild(tile);
      track(tile, baseX + x, baseY + y);

      // Keyboard: tabbing onto a tile that's off-screen glides the camera
      // over to it, so the focused work is always the one in view.
      tile.addEventListener("focus", () => {
        const rect = tile.getBoundingClientRect();
        const center = screenCenter();
        target.x += rect.left + rect.width / 2 - center.x;
        target.y += rect.top + rect.height / 2 - center.y;
      });
    });
  }
}

function screenCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function tick() {
  camera.x += (target.x - camera.x) * SMOOTHING;
  camera.y += (target.y - camera.y) * SMOOTHING;

  // Settled: the camera is within a hundredth of a pixel of where it was
  // last frame, so nothing on screen would change. Skip the whole pass.
  if (Math.abs(camera.x - lastCamera.x) < 0.01 && Math.abs(camera.y - lastCamera.y) < 0.01) {
    rafId = requestAnimationFrame(tick);
    return;
  }
  lastCamera = { ...camera };

  const center = screenCenter();
  for (const item of items) {
    const { dx, dy } = nearestCopy(item.x - camera.x, item.y - camera.y);
    // --x/--y are each tile's top-left corner (per field-layout.js), not a
    // center point, so the screen position is a direct offset, no w/h
    // subtraction here, or every tile renders shifted up-left by half its
    // own size (label elements have no --w/--h, so they never had this
    // shift, which is what made them collide with tiles below them).
    const screenX = Math.round(center.x + dx);
    const screenY = Math.round(center.y + dy);
    // Rounded to whole pixels, so during a slow glide most tiles land on the
    // same pixel two frames running, and writing an identical transform
    // still costs a style recalc.
    if (screenX === item.sx && screenY === item.sy) continue;
    item.sx = screenX;
    item.sy = screenY;
    item.node.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
  }

  rafId = requestAnimationFrame(tick);
}

// Every item repeats on a slanted lattice: a full row to the side, or one
// row up and ROW_SHIFT halls across. Pick the copy closest to the camera,
// measured in cells so both axes count alike.
function nearestCopy(rx, ry) {
  const k0 = Math.round(ry / WORLD_H);
  let best = null;
  for (let k = k0 - 1; k <= k0 + 1; k++) {
    const dy = ry - k * WORLD_H;
    const dx = wrapCentered(rx + k * ROW_SHIFT * CELL_W, WORLD_W);
    const score = Math.max(Math.abs(dx) / CELL_W, Math.abs(dy) / CELL_H);
    if (!best || score < best.score) best = { dx, dy, score };
  }
  return best;
}

function wrapCentered(value, size) {
  return wrap(value + size / 2, size) - size / 2;
}

function onPointerDown(event) {
  // Stops the browser from starting a native image/link drag, without
  // this, holding down on a tile can pick it up as a drag-ghost instead of
  // panning the field.
  if (event.pointerType !== "touch") event.preventDefault();
  dragging = true;
  didDrag = false;
  last = { x: event.clientX, y: event.clientY };
  startPos = { x: event.clientX, y: event.clientY };
  velocity = { x: 0, y: 0 };
}

function onPointerMove(event) {
  if (!dragging) return;
  const dx = event.clientX - last.x;
  const dy = event.clientY - last.y;
  last = { x: event.clientX, y: event.clientY };
  target.x -= dx;
  target.y -= dy;
  velocity = { x: dx, y: dy };

  if (!didDrag) {
    const totalDx = event.clientX - startPos.x;
    const totalDy = event.clientY - startPos.y;
    if (Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD) {
      didDrag = true;
      try {
        root.setPointerCapture(event.pointerId);
      } catch {}
      root.classList.add("is-dragging");
      // Pointer capture redirects the tile's own mouse events to `root`,
      // so it would never otherwise get a mouseleave once a real drag starts.
      if (hoveredTile) {
        onTileLeave?.(hoveredTile);
        hoveredTile = null;
      }
    }
  }
}

function onPointerUp(event) {
  dragging = false;
  root.classList.remove("is-dragging");
  if (didDrag) {
    suppressClick = true;
    try {
      root.releasePointerCapture(event.pointerId);
    } catch {}
    flingDecay();
  }
}

function flingDecay() {
  const decay = () => {
    if (dragging) return;
    if (Math.abs(velocity.x) < 0.5 && Math.abs(velocity.y) < 0.5) return;
    velocity.x *= 0.92;
    velocity.y *= 0.92;
    target.x -= velocity.x;
    target.y -= velocity.y;
    requestAnimationFrame(decay);
  };
  requestAnimationFrame(decay);
}

function onWheel(event) {
  event.preventDefault();
  target.x += event.deltaX;
  target.y += event.deltaY;
}

export function initField(rootEl, handlers = {}) {
  root = rootEl;
  world = root.querySelector(".field-world");
  onTileHover = handlers.onHover;
  onTileLeave = handlers.onLeave;
  onTileClick = handlers.onClick;

  build();

  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerup", onPointerUp);
  root.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("wheel", onWheel, { passive: false });
  // Focusing a tile makes the browser scroll its clipped container to reveal
  // it, which would shift the whole field. The camera does that job instead.
  root.addEventListener("scroll", () => {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  });

  if (!rafId) tick();
}

export function pauseField() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

// Images load in two waves: the tiles on the opening screen right away (the
// preloader waits for those, marked data-critical), everything else once the
// browser is idle. Called when the field is first shown, so a phone, which
// never shows the field, never downloads its pictures.
let imagesStarted = false;

export function loadFieldImages() {
  if (imagesStarted) return;
  imagesStarted = true;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const rest = [];
  for (const item of items) {
    const img = item.node.querySelector("img[data-src]");
    if (!img) continue;
    const near = item.sx > -w * 0.25 && item.sx < w * 1.25 && item.sy > -h * 0.25 && item.sy < h * 1.25;
    if (near) {
      img.dataset.critical = "";
      img.fetchPriority = "high";
      img.src = img.dataset.src;
    } else rest.push(img);
  }
  const loadRest = () => rest.forEach((img) => (img.src = img.dataset.src));
  const idle = () =>
    "requestIdleCallback" in window ? requestIdleCallback(loadRest, { timeout: 2500 }) : setTimeout(loadRest, 800);
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

export function resumeField() {
  // The view was hidden, so a resize may have moved the screen center since
  // the last pass, force one full placement.
  lastCamera = { x: NaN, y: NaN };
  items.forEach((item) => (item.sx = item.sy = NaN));
  if (!rafId) tick();
}

export function getCamera() {
  return { ...camera };
}
