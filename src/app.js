import "./styles/main.css";
import { onRoute, navigate, start } from "./js/router.js";
import { initField, pauseField, resumeField } from "./js/field.js";
import { initRipple, showRipple, moveRipple, hideRipple, revealTransition } from "./js/ripple.js";
import { renderWork } from "./js/work-view.js";
import { initListPage } from "./js/list-page.js";
import { workHeroRect } from "./js/design-canvas.js";
import { initCursor } from "./js/cursor.js";
import { initPreloader } from "./js/preloader.js";

const fieldRoot = document.getElementById("view-field");
const workRoot = document.getElementById("view-work");
const listRoot = document.getElementById("view-list");

initCursor();
initRipple();
initField(fieldRoot, {
  onHover: (tile, hall, work, event) => {
    showRipple(tile, work.image);
    if (event) moveRipple(tile, event);
  },
  onLeave: (tile) => hideRipple(tile),
  onClick: (tile, hall, work) => {
    const target = workHeroRect();
    revealTransition(tile, work.image, target, () => {
      navigate("work", { hallId: hall.id, workId: work.id });
    });
  },
});

let listInitialized = false;

function hideAllViews() {
  fieldRoot.hidden = true;
  workRoot.hidden = true;
  listRoot.hidden = true;
  pauseField();
}

onRoute("field", () => {
  hideAllViews();
  fieldRoot.hidden = false;
  resumeField();
});

onRoute("work", ({ hallId, workId }) => {
  hideAllViews();
  workRoot.hidden = false;
  renderWork(workRoot, hallId, workId);
});

onRoute("list", () => {
  hideAllViews();
  listRoot.hidden = false;
  if (!listInitialized) {
    initListPage(listRoot);
    listInitialized = true;
  }
});

start();
initPreloader();

document.querySelectorAll("[data-nav-field]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("field");
  });
});

document.querySelectorAll("[data-nav-list]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("list");
  });
});

workRoot.addEventListener("click", () => navigate("field"));
