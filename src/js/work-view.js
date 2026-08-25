import { findWork } from "../data/halls.js";

export function renderWork(root, hallId, workId) {
  const found = findWork(hallId, workId);
  if (!found) {
    root.innerHTML = `<div class="work-layout"><p class="work-info__bio">Work not found.</p></div>`;
    return;
  }

  const { hall, work } = found;

  root.innerHTML = `
    <div class="work-layout">
      <figure class="work-hero">
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
    </div>
  `;

  const hero = root.querySelector(".work-hero");
  hero.style.opacity = "0";
  requestAnimationFrame(() => {
    hero.style.transition = "opacity 0.3s ease";
    hero.style.opacity = "1";
  });
}
