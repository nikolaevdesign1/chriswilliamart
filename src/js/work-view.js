import { findWork } from "../data/halls.js";
import { deriveSpecs } from "./work-specs.js";
import { navigate } from "./router.js";

export function renderWork(root, hallId, workId) {
  const found = findWork(hallId, workId);
  if (!found) {
    root.innerHTML = `<div class="work-layout"><p class="work-info__bio">Work not found.</p></div>`;
    return;
  }

  const { hall, work } = found;
  const specs = deriveSpecs(work);
  const more = hall.works.filter((w) => w.id !== work.id).slice(0, 4);

  // #view-work is a scroll container now (for the detail section below the
  // fold) — reset it, or workHeroRect()'s viewport-relative math would be
  // off by whatever the page was previously scrolled to.
  root.scrollTop = 0;

  root.innerHTML = `
    <div class="work-layout" data-cursor-label="back to gallery" data-cursor-blob="${work.image}">
      <figure class="work-hero" data-cursor-label="">
        <img src="${work.image}" alt="${work.title}" />
      </figure>
      <div class="work-info">
        <div class="work-info__row">
          <h1 class="work-info__title">${work.title}</h1>
          <p class="work-info__year">${work.year}</p>
        </div>
        <div class="work-info__row">
          <p class="work-info__bio">${hall.artist.bio}</p>
          <p class="work-info__credit">By ${hall.artist.name}</p>
        </div>
      </div>
      <p class="work-scroll-hint">scroll</p>
    </div>

    <section class="work-detail">
      <div class="work-detail__mockup">
        <div class="work-detail__frame">
          <img src="${work.image}" alt="${work.title}" />
        </div>
      </div>

      <div class="work-detail__meta">
        <dl class="work-specs">
          <div class="work-specs__row"><dt>Medium</dt><dd>${specs.medium}</dd></div>
          <div class="work-specs__row"><dt>Dimensions</dt><dd>${specs.dimensions}</dd></div>
          <div class="work-specs__row"><dt>Year</dt><dd>${work.year}</dd></div>
          <div class="work-specs__row"><dt>Edition</dt><dd>${specs.edition}</dd></div>
        </dl>
        <p class="work-detail__note">${specs.note}</p>
      </div>

      ${
        more.length
          ? `
      <div class="work-detail__more">
        <h2 class="work-detail__more-title">More from ${hall.artist.name}</h2>
        <div class="work-detail__more-grid">
          ${more
            .map(
              (w) => `
            <a class="work-detail__more-item" href="/work/${hall.id}/${w.id}" data-hall-id="${hall.id}" data-work-id="${w.id}">
              <img src="${w.image}" alt="${w.title}" />
              <span>${w.title}</span>
            </a>
          `
            )
            .join("")}
        </div>
      </div>`
          : ""
      }
    </section>
  `;

  const hero = root.querySelector(".work-hero");
  hero.style.opacity = "0";
  requestAnimationFrame(() => {
    hero.style.transition = "opacity 0.3s ease";
    hero.style.opacity = "1";
  });

  root.querySelectorAll(".work-detail__more-item").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      root.scrollTo({ top: 0, behavior: "instant" });
      navigate("work", { hallId: link.dataset.hallId, workId: link.dataset.workId });
    });
  });
}
