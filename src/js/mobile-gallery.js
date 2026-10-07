import { halls, artistLine, workNumber } from "../data/halls.js";
import { navigate, url } from "./router.js";

// Mobile gallery, in two levels.
//
// 1. Artists, a vertical, snap-scrolling stack, one artist per screen.
// 2. Works, tap an artist and their works slide in as a horizontal,
//    snap-scrolling strip; a back button returns to the stack.
//
// Tapping a work opens its page as on desktop. The chosen artist is kept, so
// coming back from a work lands on that artist's strip, not the top of the list.

let root;
let built = false;
let openHallId = null;

function artistsMarkup() {
  return halls
    .map((hall, i) => {
      const cover = hall.works[0];
      return `
        <section class="m-artist" data-hall-id="${hall.id}">
          <p class="m-artist__index">${String(i + 1).padStart(2, "0")} / ${String(halls.length).padStart(2, "0")}</p>
          <h2 class="m-artist__name">${hall.artist.name}</h2>
          <p class="m-artist__meta">${artistLine(hall.artist)} · ${hall.artist.movement}</p>
          <button type="button" class="m-artist__cover" data-open-hall="${hall.id}" aria-label="Show works by ${hall.artist.name}">
            <img src="${cover.thumb}" alt="" decoding="async" draggable="false" />
          </button>
          <div class="m-artist__foot">
            <p class="m-artist__bio">${hall.artist.bio}</p>
            <button type="button" class="m-artist__open" data-open-hall="${hall.id}">
              ${hall.works.length} works <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      `;
    })
    .join("");
}

function worksMarkup(hall) {
  return `
    <header class="m-works__head">
      <button type="button" class="m-works__back" data-close-hall>
        <span aria-hidden="true">←</span> Artists
      </button>
      <p class="m-works__artist">${hall.artist.name}</p>
      <p class="m-works__count"><span data-works-current>1</span> / ${hall.works.length}</p>
    </header>
    <div class="m-works__strip">
      ${hall.works
        .map(
          (work) => `
        <a class="m-work" href="${url(`/work/${hall.id}/${work.id}`)}" data-hall-id="${hall.id}" data-work-id="${work.id}">
          <span class="m-work__frame">
            <img src="${work.thumb}" alt="${work.title}" decoding="async" draggable="false" />
          </span>
          <span class="m-work__caption">
            <em>${workNumber(hall.id, work.id)}</em>
            <span>${work.title}</span>
            <em>${work.year}</em>
          </span>
        </a>
      `
        )
        .join("")}
    </div>
  `;
}

function openHall(hallId) {
  const hall = halls.find((h) => h.id === hallId);
  if (!hall) return;
  openHallId = hallId;
  const panel = root.querySelector(".m-works");
  panel.innerHTML = worksMarkup(hall);
  root.classList.add("is-works");

  const strip = panel.querySelector(".m-works__strip");
  const counter = panel.querySelector("[data-works-current]");
  // Counter follows whichever slide is nearest the strip's left edge.
  strip.addEventListener(
    "scroll",
    () => {
      const slides = [...strip.children];
      const index = slides.reduce(
        (best, slide, i) =>
          Math.abs(slide.offsetLeft - strip.scrollLeft) < Math.abs(slides[best].offsetLeft - strip.scrollLeft) ? i : best,
        0
      );
      counter.textContent = index + 1;
    },
    { passive: true }
  );

  panel.querySelectorAll(".m-work").forEach((link) => {
    link.addEventListener("dragstart", (event) => event.preventDefault());
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("work", { hallId: link.dataset.hallId, workId: link.dataset.workId });
    });
  });
}

function closeHall() {
  openHallId = null;
  root.classList.remove("is-works");
}

export function initMobileGallery(rootEl) {
  root = rootEl;
  if (!built) {
    built = true;
    root.innerHTML = `
      <div class="m-artists">${artistsMarkup()}</div>
      <div class="m-works" aria-live="polite"></div>
    `;
    root.addEventListener("click", (event) => {
      const open = event.target.closest("[data-open-hall]");
      if (open) {
        openHall(open.dataset.openHall);
        return;
      }
      if (event.target.closest("[data-close-hall]")) closeHall();
    });
  }
  // Back from a work page: still on that artist's strip.
  if (openHallId) root.classList.add("is-works");
}
