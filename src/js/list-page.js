import { halls } from "../data/halls.js";
import { showRipple, moveRipple, hideRipple } from "./ripple.js";

function flattenWorks() {
  const rows = [];
  halls.forEach((hall) => {
    hall.works.forEach((work) => {
      rows.push({ hall, work });
    });
  });
  return rows;
}

function renderRows(rows) {
  const container = document.querySelector(".list-panel__rows");
  container.innerHTML = rows
    .map(
      ({ hall, work }, index) => `
        <li class="list-panel__row">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <span>${work.title}</span>
          <button type="button" class="list-panel__artist" data-hall-id="${hall.id}">${hall.artist.name}</button>
        </li>
      `
    )
    .join("");
}

function initPreview(rows) {
  const preview = document.querySelector(".list-preview");
  const img = preview.querySelector("img");
  const rowEls = document.querySelectorAll(".list-panel__row");

  rowEls.forEach((row, index) => {
    const { work } = rows[index];
    row.addEventListener("mouseenter", () => {
      img.src = work.image;
      preview.classList.add("is-visible");
    });
    row.addEventListener("mousemove", (event) => {
      preview.style.setProperty("--preview-y", `${event.clientY}px`);
    });
    row.addEventListener("mouseleave", () => {
      preview.classList.remove("is-visible");
    });
  });
}

function renderArtistPanel(hall) {
  const panel = document.querySelector(".artist-panel");
  panel.querySelector(".artist-panel__name").textContent = hall.artist.name;
  panel.querySelector(".artist-panel__bio").textContent = hall.artist.bio;

  const track = panel.querySelector(".artist-panel__track");
  track.innerHTML = "";
  hall.works.forEach((work) => {
    const tile = document.createElement("a");
    tile.className = "artist-tile";
    tile.href = `/work/${hall.id}/${work.id}`;

    const img = document.createElement("img");
    img.src = work.image;
    img.alt = work.title;
    img.draggable = false;
    tile.appendChild(img);

    tile.addEventListener("mouseenter", () => showRipple(tile, work.image));
    tile.addEventListener("mousemove", (event) => moveRipple(tile, event));
    tile.addEventListener("mouseleave", () => hideRipple(tile));

    track.appendChild(tile);
  });

  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("is-open"));
}

function closeArtistPanel() {
  const panel = document.querySelector(".artist-panel");
  panel.classList.remove("is-open");
  setTimeout(() => {
    panel.hidden = true;
  }, 300);
}

function initArtistPanel() {
  let openHallId = null;

  document.querySelectorAll(".list-panel__artist").forEach((button) => {
    button.addEventListener("click", () => {
      const hallId = button.dataset.hallId;
      if (hallId === openHallId) {
        closeArtistPanel();
        openHallId = null;
        return;
      }
      const hall = halls.find((h) => h.id === hallId);
      if (!hall) return;
      renderArtistPanel(hall);
      openHallId = hallId;
    });
  });

  document.querySelector(".artist-panel__close").addEventListener("click", () => {
    closeArtistPanel();
    openHallId = null;
  });
}

export function initListPage() {
  const rows = flattenWorks();
  renderRows(rows);
  initPreview(rows);
  initArtistPanel();
}
