import "./styles/main.css";
import { onRoute, navigate, start } from "./js/router.js";
import { initField, pauseField, resumeField } from "./js/field.js";
import { initRipple, showRipple, moveRipple, hideRipple } from "./js/ripple.js";
import { renderWork } from "./js/work-view.js";
import { initListPage, teardownListPage } from "./js/list-page.js";
import { initMobileGallery } from "./js/mobile-gallery.js";
import { initCursor } from "./js/cursor.js";
import { initPreloader } from "./js/preloader.js";
import { initSound, playOpen, playClose } from "./js/sound.js";
import { revealText, initTextHover } from "./js/type-reveal.js";
import { smoothScroll } from "./js/smooth-scroll.js";

const fieldRoot = document.getElementById("view-field");
const workRoot = document.getElementById("view-work");
const listRoot = document.getElementById("view-list");
const mobileRoot = document.getElementById("view-mobile");

const isMobile = () => window.matchMedia("(max-width: 720px)").matches;

const waterRoot = document.getElementById("field-water");

initCursor();
initSound();
initTextHover();
initRipple();
// The work popup scrolls on the same inertia as everything else.
smoothScroll(workRoot, { axis: "y" });
initField(fieldRoot, {
  onHover: (tile, hall, work, event) => {
    showRipple(tile, work.image);
    if (event) moveRipple(tile, event);
  },
  onLeave: (tile) => hideRipple(tile),
  onClick: (tile, hall, work) => {
    hideRipple(tile);
    navigate("work", { hallId: hall.id, workId: work.id });
  },
});

let listInitialized = false;
let currentRoute = null;

function hideAllViews() {
  fieldRoot.hidden = true;
  workRoot.hidden = true;
  listRoot.hidden = true;
  mobileRoot.hidden = true;
  waterRoot.hidden = true;
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
// A transition only advances while the page is being composited. If the tab
// is backgrounded for the whole run, the element stays rendered at its start
// value — invisible — even though opacity:1 is already the specified value.
// setTimeout is not tied to the compositor, so once the run is due to be over
// we drop the transition and pin the end state outright.
function settle(el, duration) {
  setTimeout(() => {
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.transform = "none";
  }, duration * 1000 + 120);
}

function fadeIn(el, duration = 0.4) {
  el.style.transition = "none";
  el.style.opacity = "0";
  void el.offsetHeight;
  el.style.transition = `opacity ${duration}s ease`;
  el.style.opacity = "1";
  settle(el, duration);
}

// The work view opens as a popup now — a short scale-up from just under full
// size, rather than the old morph that flew the artwork into place.
function popIn(el, duration = 0.45) {
  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.transform = "scale(0.965)";
  void el.offsetHeight;
  el.style.transition = `opacity ${duration}s ease, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1)`;
  el.style.opacity = "1";
  el.style.transform = "scale(1)";
  settle(el, duration);
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
    waterRoot.hidden = false;
    resumeField();
    fadeIn(fieldRoot);
    fieldRoot.querySelectorAll(".field-label__name").forEach((name, i) => {
      revealText(name, { delay: 0.12 + i * 0.015 });
    });
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
    revealText(listRoot.querySelector(".list-showcase__name"), { delay: 0.12 });
  }
  setActiveNav("list");
  currentRoute = "list";
}

function renderWorkRoute({ hallId, workId }) {
  hideAllViews();
  workRoot.hidden = false;
  renderWork(workRoot, hallId, workId);
  popIn(workRoot);
  playOpen();
  revealText(workRoot.querySelector(".work-info__title"), { delay: 0.18 });
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

// Click-to-go-back is scoped to the popup's first screen, and skips the
// artwork itself — exactly the area where the cursor reads "back to gallery",
// so the clickable region and the affordance can't disagree.
workRoot.addEventListener("click", (event) => {
  if (!event.target.closest(".work-layout")) return;
  if (event.target.closest(".work-hero")) return;
  playClose();
  navigate("field");
});
