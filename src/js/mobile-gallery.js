import { halls } from "../data/halls.js";
import { navigate } from "./router.js";

let root;
let built = false;

// Mobile has no room for the infinite pannable field, so below the
// breakpoint the whole gallery becomes one horizontal, swipe-snapped strip
// of halls, each with its own horizontal strip of works — no vertical
// scroll anywhere, matched entirely with CSS scroll-snap (no drag physics
// to reimplement for touch).
export function initMobileGallery(rootEl) {
  root = rootEl;
  if (built) return;
  built = true;

  root.innerHTML = halls
    .map(
      (hall) => `
        <section class="mobile-hall" data-hall-id="${hall.id}">
          <header class="mobile-hall__header">
            <h2>${hall.artist.name}</h2>
            <p>${hall.artist.bio}</p>
          </header>
          <div class="mobile-hall__strip">
            ${hall.works
              .map(
                (work) => `
                  <a class="mobile-hall__tile" href="/work/${hall.id}/${work.id}" data-hall-id="${hall.id}" data-work-id="${work.id}">
                    <img src="${work.image}" alt="${work.title}" draggable="false" />
                    <span>${work.title}</span>
                  </a>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");

  root.querySelectorAll(".mobile-hall__tile").forEach((tile) => {
    tile.draggable = false;
    tile.addEventListener("dragstart", (event) => event.preventDefault());
    tile.addEventListener("click", (event) => {
      event.preventDefault();
      navigate("work", { hallId: tile.dataset.hallId, workId: tile.dataset.workId });
    });
  });
}
