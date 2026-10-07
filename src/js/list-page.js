import gsap from "gsap";
import { halls, artistLine, artistFacts } from "../data/halls.js";
import { showRipple, moveRipple, hideRipple } from "./ripple.js";
import { navigate, url } from "./router.js";
import { smoothScroll, stepScroll } from "./smooth-scroll.js";

let root, rows, activeHallId;
let preview, previewImg, previewMoveX, previewMoveY;
let lightbox, lightboxImg, lightboxCaption;

function flattenWorks() {
  const list = [];
  halls.forEach((hall) => {
    hall.works.forEach((work) => list.push({ hall, work }));
  });
  return list;
}

function renderRows(list) {
  const container = root.querySelector(".list-panel__rows");
  container.innerHTML = list
    .map(
      ({ hall, work }, index) => `
        <li class="list-panel__row" data-hall-id="${hall.id}" data-work-id="${work.id}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <span>${work.title}</span>
          <button type="button" class="list-panel__author">${hall.artist.name}</button>
        </li>
      `
    )
    .join("");
}

// A small preview of the hovered work that follows the cursor, independent
// of which hall is showing in the right-hand showcase, restores the
// floating position:absolute preview from the earlier design.
function ensurePreview() {
  if (preview) return;
  preview = document.createElement("div");
  preview.className = "list-hover-preview";
  previewImg = document.createElement("img");
  previewImg.alt = "";
  previewImg.draggable = false;
  preview.appendChild(previewImg);
  document.body.appendChild(preview);
  gsap.set(preview, { xPercent: -50, yPercent: -100, opacity: 0 });
  previewMoveX = gsap.quickTo(preview, "x", { duration: 0.35, ease: "power3.out" });
  previewMoveY = gsap.quickTo(preview, "y", { duration: 0.35, ease: "power3.out" });
}

function showPreview(work, event) {
  ensurePreview();
  previewImg.src = work.thumb;
  preview.style.setProperty("--aspect", work.aspect);
  previewMoveX(event.clientX);
  previewMoveY(event.clientY - 24);
  gsap.to(preview, { opacity: 1, duration: 0.25, ease: "power2.out" });
}

function movePreview(event) {
  if (!preview) return;
  previewMoveX(event.clientX);
  previewMoveY(event.clientY - 24);
}

function hidePreview() {
  if (!preview) return;
  gsap.to(preview, { opacity: 0, duration: 0.2, ease: "power2.out" });
}

// Instant, non-animated hide, used when the list is being torn down
// entirely (route change), so the floating preview can never survive past
// it even if a mouseleave was missed on the way out.
function killPreview() {
  if (!preview) return;
  gsap.killTweensOf(preview);
  gsap.set(preview, { opacity: 0 });
}

// Full-image lightbox opened by clicking a row (clicking the author name
// switches the showcase instead, see initListPage).
function ensureLightbox() {
  if (lightbox) return;
  lightbox = document.createElement("div");
  lightbox.className = "list-lightbox";
  lightbox.innerHTML = `
    <button type="button" class="list-lightbox__close" data-cursor-label="close">close</button>
    <img class="list-lightbox__img" alt="" draggable="false" />
    <p class="list-lightbox__caption"></p>
  `;
  document.body.appendChild(lightbox);
  lightboxImg = lightbox.querySelector(".list-lightbox__img");
  lightboxCaption = lightbox.querySelector(".list-lightbox__caption");
  gsap.set(lightbox, { opacity: 0 });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.querySelector(".list-lightbox__close").addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

function openLightbox(work, hall) {
  ensureLightbox();
  hidePreview();
  lightboxImg.src = work.image;
  lightboxImg.alt = work.title;
  lightboxCaption.textContent = `${work.title}, ${hall.artist.name}`;
  lightbox.classList.add("is-open");
  gsap.to(lightbox, { opacity: 1, duration: 0.35, ease: "power2.out" });
}

function closeLightbox() {
  if (!lightbox || !lightbox.classList.contains("is-open")) return;
  gsap.to(lightbox, {
    opacity: 0,
    duration: 0.25,
    ease: "power2.out",
    onComplete: () => lightbox.classList.remove("is-open"),
  });
}

function killLightbox() {
  if (!lightbox) return;
  gsap.killTweensOf(lightbox);
  gsap.set(lightbox, { opacity: 0 });
  lightbox.classList.remove("is-open");
}

// Called from app.js whenever the list route is left, so a floating
// preview or an open lightbox never lingers over whatever view comes next.
export function teardownListPage() {
  killPreview();
  killLightbox();
}

function showHall(hallId, focusWorkId) {
  const hall = halls.find((h) => h.id === hallId);
  if (!hall) return;
  activeHallId = hallId;

  const name = root.querySelector(".list-showcase__name");
  const bio = root.querySelector(".list-showcase__bio");
  name.textContent = hall.artist.name;
  bio.textContent = hall.artist.bio;
  root.querySelector(".list-showcase__meta").textContent = `${artistLine(hall.artist)} · ${hall.artist.movement}`;
  // A short fact sheet; the full one lives on each work's page.
  root.querySelector(".list-showcase__facts").innerHTML = artistFacts(hall)
    .filter(([label]) => ["Born", "Lives in", "With the gallery"].includes(label))
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  const track = root.querySelector(".list-showcase__track");
  track.innerHTML = "";
  hall.works.forEach((work) => {
    const tile = document.createElement("a");
    tile.className = "list-tile";
    tile.href = url(`/work/${hall.id}/${work.id}`);
    tile.classList.toggle("is-focused", work.id === focusWorkId);
    // The strip is a fixed height, so the painting's own proportions decide
    // each tile's width, nothing gets cropped to a generic 3:4.
    tile.style.aspectRatio = work.aspect;
    tile.draggable = false;
    tile.addEventListener("dragstart", (event) => event.preventDefault());

    const img = document.createElement("img");
    img.src = work.thumb;
    img.alt = work.title;
    img.decoding = "async";
    img.draggable = false;
    tile.appendChild(img);

    tile.addEventListener("mouseenter", () => showRipple(tile, work.thumb));
    tile.addEventListener("mousemove", (event) => moveRipple(tile, event));
    tile.addEventListener("mouseleave", () => hideRipple(tile));
    tile.addEventListener("click", (event) => {
      event.preventDefault();
      hideRipple(tile);
      navigate("work", { hallId: hall.id, workId: work.id });
    });

    track.appendChild(tile);
  });
}

function highlightRow(hallId, workId) {
  root.querySelectorAll(".list-panel__row").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.hallId === hallId && row.dataset.workId === workId);
  });
}

export function initListPage(rootEl) {
  root = rootEl;
  const list = flattenWorks();
  renderRows(list);
  rows = [...root.querySelectorAll(".list-panel__row")];

  rows.forEach((row, index) => {
    const { hallId, workId } = row.dataset;
    const { hall, work } = list[index];

    row.addEventListener("mouseenter", (event) => showPreview(work, event));
    row.addEventListener("mousemove", movePreview);
    row.addEventListener("mouseleave", hidePreview);

    // Clicking the row opens a full-image popup; clicking the author name
    // switches the showcase instead (handled by its own listener below).
    row.addEventListener("click", (event) => {
      if (event.target.closest(".list-panel__author")) return;
      openLightbox(work, hall);
    });

    row.querySelector(".list-panel__author").addEventListener("click", () => {
      hidePreview();
      highlightRow(hallId, workId);
      showHall(hallId, workId);
    });
  });

  // Safety net: a fast pointer move can leave a row without another one
  // catching the hover, so make sure the preview always dies once the
  // cursor leaves the whole rows list.
  root.querySelector(".list-panel__rows").addEventListener("mouseleave", hidePreview);

  // Both panes glide to a stop on the same easing as the field camera, so the
  // list doesn't feel like a different site from the gallery.
  smoothScroll(root.querySelector(".list-panel"), { axis: "y" });
  stepScroll(root.querySelector(".list-showcase__strip"), { itemSelector: ".list-tile" });

  const first = list[0];
  showHall(first.hall.id, first.work.id);
  highlightRow(first.hall.id, first.work.id);
}
