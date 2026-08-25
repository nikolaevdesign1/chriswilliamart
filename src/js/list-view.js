import { artworks } from "./artworks-data.js";

export function renderArtworkList() {
  const container = document.querySelector(".list-panel__rows");
  if (!container) return;

  container.innerHTML = artworks
    .map(
      (work, index) => `
        <li class="list-panel__row">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <span>${work.title}</span>
          <span>${work.artist}</span>
        </li>
      `
    )
    .join("");
}
