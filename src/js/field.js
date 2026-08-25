import { halls } from "../data/halls.js";
import { CELL_W, CELL_H, WORLD_W, WORLD_H, layoutWorks, labelPosition } from "./field-layout.js";

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

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function build() {
  world.innerHTML = "";
  halls.forEach((hall) => {
    const baseX = hall.cell.col * CELL_W;
    const baseY = hall.cell.row * CELL_H;

    const label = labelPosition();
    const heading = document.createElement("div");
    heading.className = "field-label";
    heading.style.setProperty("--x", baseX + label.x);
    heading.style.setProperty("--y", baseY + label.y);
    heading.innerHTML = `<p class="field-label__name">${hall.artist.name}</p><p class="field-label__bio">${hall.artist.bio}</p>`;
    world.appendChild(heading);

    layoutWorks(hall.works).forEach(({ work, x, y, w, h }) => {
      const tile = document.createElement("a");
      tile.className = "field-tile";
      tile.href = `/work/${hall.id}/${work.id}`;
      tile.dataset.hallId = hall.id;
      tile.dataset.workId = work.id;
      tile.style.setProperty("--x", baseX + x);
      tile.style.setProperty("--y", baseY + y);
      tile.style.setProperty("--w", w);
      tile.style.setProperty("--h", h);

      const img = document.createElement("img");
      img.src = work.image;
      img.alt = work.title;
      img.loading = "lazy";
      img.draggable = false;
      tile.appendChild(img);

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
    });
  });
}

function screenCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function tick() {
  camera.x += (target.x - camera.x) * SMOOTHING;
  camera.y += (target.y - camera.y) * SMOOTHING;

  const center = screenCenter();
  const nodes = world.children;
  for (const node of nodes) {
    const bx = parseFloat(node.style.getPropertyValue("--x"));
    const by = parseFloat(node.style.getPropertyValue("--y"));
    const w = parseFloat(node.style.getPropertyValue("--w")) || 0;
    const h = parseFloat(node.style.getPropertyValue("--h")) || 0;
    const dx = wrapCentered(bx - camera.x, WORLD_W);
    const dy = wrapCentered(by - camera.y, WORLD_H);
    const screenX = center.x + dx - w / 2;
    const screenY = center.y + dy - h / 2;
    node.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0)`;
  }

  rafId = requestAnimationFrame(tick);
}

function wrapCentered(value, size) {
  return wrap(value + size / 2, size) - size / 2;
}

function onPointerDown(event) {
  // Stops the browser from starting a native image/link drag — without
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

  if (!rafId) tick();
}

export function pauseField() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

export function resumeField() {
  if (!rafId) tick();
}

export function getCamera() {
  return { ...camera };
}
