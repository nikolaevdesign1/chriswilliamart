import "./styles/main.css";
import { onRoute, navigate, start } from "./js/router.js";
import { initField, pauseField, resumeField } from "./js/field.js";
import { initRipple, showRipple, moveRipple, hideRipple, revealTransition } from "./js/ripple.js";
import { renderWork } from "./js/work-view.js";
import { initListPage, teardownListPage } from "./js/list-page.js";
import { initMobileGallery } from "./js/mobile-gallery.js";
import { workHeroRect } from "./js/design-canvas.js";
import { initCursor } from "./js/cursor.js";
import { initPreloader } from "./js/preloader.js";

const fieldRoot = document.getElementById("view-field");
const workRoot = document.getElementById("view-work");
const listRoot = document.getElementById("view-list");
const mobileRoot = document.getElementById("view-mobile");

const isMobile = () => window.matchMedia("(max-width: 720px)").matches;

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
let currentRoute = null;

function hideAllViews() {
  fieldRoot.hidden = true;
  workRoot.hidden = true;
  listRoot.hidden = true;
  mobileRoot.hidden = true;
  pauseField();
  // Leaving the list route entirely — kill any floating preview/lightbox
  // it left open rather than relying on hover events that can be missed.
  if (currentRoute === "list") teardownListPage();
}

// The work detail page has no toggle of its own — its "back" affordance
// returns to the field, so the Field link stays the one shown as active.
function setActiveNav(routeName) {
  document.querySelectorAll("[data-nav-field]").forEach((el) => el.classList.toggle("is-active", routeName === "field"));
  document.querySelectorAll("[data-nav-list]").forEach((el) => el.classList.toggle("is-active", routeName === "list"));
}

// Fades a view in on entry so switching Field/List reads as one continuous
// page rather than a hard cut (which otherwise looks identical to a full
// page reload). Plain CSS transition, not a JS-driven tween: the target
// opacity is a real style value the instant we set it, so even if the
// transition itself never gets to play, the view is still fully visible —
// it just skips the fade instead of ever being stuck hidden.
function fadeIn(el, duration = 0.4) {
  el.style.transition = "none";
  el.style.opacity = "0";
  void el.offsetHeight;
  el.style.transition = `opacity ${duration}s ease`;
  el.style.opacity = "1";
}

// Below the mobile breakpoint, both Field and List routes show the same
// swipeable hall/works slider instead of the infinite field or the desktop
// list layout — panning a 2D field doesn't translate to touch.
function renderField() {
  hideAllViews();
  if (isMobile()) {
    initMobileGallery(mobileRoot);
    mobileRoot.hidden = false;
  } else {
    fieldRoot.hidden = false;
    resumeField();
    fadeIn(fieldRoot);
  }
  setActiveNav("field");
  currentRoute = "field";
}

function renderList() {
  hideAllViews();
  if (isMobile()) {
    initMobileGallery(mobileRoot);
    mobileRoot.hidden = false;
  } else {
    listRoot.hidden = false;
    if (!listInitialized) {
      initListPage(listRoot);
      listInitialized = true;
    }
    fadeIn(listRoot);
  }
  setActiveNav("list");
  currentRoute = "list";
}

function renderWorkRoute({ hallId, workId }) {
  hideAllViews();
  workRoot.hidden = false;
  renderWork(workRoot, hallId, workId);
  setActiveNav("field");
  currentRoute = "work";
}

onRoute("field", renderField);
onRoute("list", renderList);
onRoute("work", renderWorkRoute);

// A resize can cross the mobile breakpoint (e.g. rotating a tablet) —
// re-render the current route so field/list swap to/from the mobile
// slider live instead of getting stuck in whichever mode the page loaded in.
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentRoute === "field") renderField();
    else if (currentRoute === "list") renderList();
  }, 200);
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
