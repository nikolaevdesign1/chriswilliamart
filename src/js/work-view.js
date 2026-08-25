import { findWork } from "../data/halls.js";
import { navigate } from "./router.js";

export function renderWork(root, hallId, workId) {
  const found = findWork(hallId, workId);
  if (!found) {
    root.innerHTML = `<p class="abs text-label" style="--x:24;--y:521">Work not found — <a href="/" data-back>back to gallery</a></p>`;
    root.querySelector("[data-back]").addEventListener("click", (e) => {
      e.preventDefault();
      navigate("field");
    });
    return;
  }

  const { hall, work } = found;

  root.innerHTML = `
    <a class="abs text-label" href="/" data-back style="--x:1815;--y:106">back to gallery</a>

    <figure class="tile work-hero" style="--x:655;--y:92;--w:610;--h:896">
      <img src="${work.image}" alt="${work.title}" />
    </figure>

    <h1 class="abs text-heading" style="--x:24;--y:521">${work.title}</h1>
    <p class="abs text-heading abs--right" style="--x:24;--y:521">${work.year}</p>

    <p class="abs abs--w text-copy" style="--x:24;--y:575;--w:453">${hall.artist.bio}</p>
    <p class="abs text-label abs--right" style="--x:24;--y:575">By ${hall.artist.name}</p>
  `;

  root.querySelector("[data-back]").addEventListener("click", (event) => {
    event.preventDefault();
    navigate("field");
  });

  const hero = root.querySelector(".work-hero");
  hero.style.opacity = "0";
  requestAnimationFrame(() => {
    hero.style.transition = "opacity 0.3s ease";
    hero.style.opacity = "1";
  });
}
