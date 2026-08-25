import "./styles/main.css";
import { onRoute, navigate, start } from "./js/router.js";
import { initField, pauseField, resumeField } from "./js/field.js";
import { initRipple, showRipple, moveRipple, hideRipple, revealTransition } from "./js/ripple.js";
import { renderWork } from "./js/work-view.js";
import { designRect, WORK_HERO_BOX } from "./js/design-canvas.js";
import { initCursor } from "./js/cursor.js";

const fieldRoot = document.getElementById("view-field");
const workRoot = document.getElementById("view-work");

initCursor();
initRipple();
initField(fieldRoot, {
  onHover: (tile, hall, work, event) => {
    showRipple(tile, work.image);
    if (event) moveRipple(tile, event);
  },
  onLeave: (tile) => hideRipple(tile),
  onClick: (tile, hall, work) => {
    const target = designRect(WORK_HERO_BOX.x, WORK_HERO_BOX.y, WORK_HERO_BOX.w, WORK_HERO_BOX.h);
    revealTransition(tile, work.image, target, () => {
      navigate("work", { hallId: hall.id, workId: work.id });
    });
  },
});

onRoute("field", () => {
  workRoot.hidden = true;
  fieldRoot.hidden = false;
  resumeField();
});

onRoute("work", ({ hallId, workId }) => {
  fieldRoot.hidden = true;
  workRoot.hidden = false;
  pauseField();
  renderWork(workRoot, hallId, workId);
});

start();

document.querySelectorAll("[data-nav-field]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("field");
  });
});
