import { halls } from "../data/halls.js";
import { showRipple, moveRipple, hideRipple, revealTransition } from "./ripple.js";
import { navigate } from "./router.js";
import { workHeroRect } from "./design-canvas.js";

let root, rows, activeHallId;

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
          <span>${hall.artist.name}</span>
        </li>
      `
    )
    .join("");
}

function showHall(hallId, focusWorkId) {
  const hall = halls.find((h) => h.id === hallId);
  if (!hall) return;
  activeHallId = hallId;

  root.querySelector(".list-showcase__name").textContent = hall.artist.name;
  root.querySelector(".list-showcase__bio").textContent = hall.artist.bio;

  const track = root.querySelector(".list-showcase__track");
  track.innerHTML = "";
  hall.works.forEach((work) => {
    const tile = document.createElement("a");
    tile.className = "list-tile";
    tile.href = `/work/${hall.id}/${work.id}`;
    tile.classList.toggle("is-focused", work.id === focusWorkId);
    tile.draggable = false;
    tile.addEventListener("dragstart", (event) => event.preventDefault());

    const img = document.createElement("img");
    img.src = work.image;
    img.alt = work.title;
    img.draggable = false;
    tile.appendChild(img);

    tile.addEventListener("mouseenter", () => showRipple(tile, work.image));
    tile.addEventListener("mousemove", (event) => moveRipple(tile, event));
    tile.addEventListener("mouseleave", () => hideRipple(tile));
    tile.addEventListener("click", (event) => {
      event.preventDefault();
      const target = workHeroRect();
      revealTransition(tile, work.image, target, () => {
        navigate("work", { hallId: hall.id, workId: work.id });
      });
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

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      const { hallId, workId } = row.dataset;
      highlightRow(hallId, workId);
      if (hallId !== activeHallId) showHall(hallId, workId);
      else {
        root.querySelectorAll(".list-tile").forEach((tile) => {
          tile.classList.toggle("is-focused", tile.href.endsWith(`/${hallId}/${workId}`));
        });
      }
    });
  });

  const first = list[0];
  showHall(first.hall.id, first.work.id);
  highlightRow(first.hall.id, first.work.id);
}
