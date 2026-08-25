import { artworks } from "./artworks-data.js";

export function renderArtworkList() {
  const container = document.querySelector(".list-panel__rows");
  if (!container) return;

  container.innerHTML = artworks
    .map((work, index) => {
      const cells = `
        <span>${String(index + 1).padStart(2, "0")}</span>
        <span>${work.title}</span>
        <span>${work.artist}</span>
      `;
      return `<li class="list-panel__row">${work.href ? `<a href="${work.href}">${cells}</a>` : cells}</li>`;
    })
    .join("");
}
