import "./styles/main.css";
import gsap from "gsap";
import { onRoute, navigate, start, url } from "./js/router.js";
import { initField, pauseField, resumeField, loadFieldImages } from "./js/field.js";
import { initRipple, showRipple, moveRipple, hideRipple } from "./js/ripple.js";
import { renderWork } from "./js/work-view.js";
import { initListPage, teardownListPage } from "./js/list-page.js";
import { initMobileGallery } from "./js/mobile-gallery.js";
import { initCursor } from "./js/cursor.js";
import { initPreloader, isPreloading, onIntro } from "./js/preloader.js";
import { initLens } from "./js/lens.js";
import { initCookieBanner } from "./js/cookie-banner.js";
import { initSound, playOpen, playClose } from "./js/sound.js";
import { revealText, initTextHover } from "./js/type-reveal.js";
import { smoothScroll } from "./js/smooth-scroll.js";
import { initAbout, enterAbout } from "./js/about-view.js";
import { findWork, halls } from "./data/halls.js";

const fieldRoot = document.getElementById("view-field");
const workRoot = document.getElementById("view-work");
const listRoot = document.getElementById("view-list");
const mobileRoot = document.getElementById("view-mobile");
const aboutRoot = document.getElementById("view-about");
const contactsRoot = document.getElementById("view-contacts");
const notFoundRoot = document.getElementById("view-notfound");
const allViews = [fieldRoot, workRoot, listRoot, mobileRoot, aboutRoot, contactsRoot, notFoundRoot];

const isMobile = () => window.matchMedia("(max-width: 720px)").matches;

const waterRoot = document.getElementById("field-water");

initCursor();
initSound();
initTextHover();
initRipple();
// The lens is built the first time the field is shown: drawing its
// displacement maps is the costliest thing at start-up on a phone, and a
// phone never shows the field.
let lensReady = false;
function ensureLens() {
  if (lensReady) return;
  lensReady = true;
  initLens(waterRoot);
}
// The work popup scrolls on the same inertia as everything else.
smoothScroll(workRoot, { axis: "y" });
// Once the work page scrolls past its first screen, the header and footer get
// a solid backing so the story text doesn't run underneath them.
workRoot.addEventListener(
  "scroll",
  () => document.body.classList.toggle("chrome-solid", workRoot.scrollTop > 24),
  { passive: true }
);
initAbout(aboutRoot);
initField(fieldRoot, {
  onHover: (tile, hall, work, event) => {
    showRipple(tile, work.thumb);
    if (event) moveRipple(tile, event);
  },
  onLeave: (tile) => hideRipple(tile),
  onClick: (tile, hall, work) => {
    hideRipple(tile);
    navigate("work", { hallId: hall.id, workId: work.id });
  },
});

// The tab title and description follow the route, so each section, and
// each work, reads as its own page in the tab bar, history and bookmarks.
const SITE = "Chris Williams Art Gallery";
const DEFAULT_TITLE = document.title;
const metaDescription = document.querySelector('meta[name="description"]');
const DEFAULT_DESCRIPTION = metaDescription?.content ?? "";

function setPageMeta(title, description = DEFAULT_DESCRIPTION) {
  document.title = title;
  metaDescription?.setAttribute("content", description);
}

let listInitialized = false;
let currentRoute = null;

function hideAllViews() {
  allViews.forEach((view) => (view.hidden = true));
  document.body.classList.remove("chrome-solid");
  waterRoot.hidden = true;
  pauseField();
  // Leaving the list route entirely, kill any floating preview/lightbox
  // it left open rather than relying on hover events that can be missed.
  if (currentRoute === "list") teardownListPage();
}

// The work detail page has no toggle of its own, its "back" affordance
// returns to the field, so the Field link stays the one shown as active.
function setActiveNav(routeName) {
  document.querySelectorAll("[data-nav-field]").forEach((el) => el.classList.toggle("is-active", routeName === "field"));
  document.querySelectorAll("[data-nav-list]").forEach((el) => el.classList.toggle("is-active", routeName === "list"));
  document.querySelectorAll("[data-nav]").forEach((el) => el.classList.toggle("is-active", el.dataset.nav === routeName));
}

// Fades a view in on entry so switching Field/List reads as one continuous
// page rather than a hard cut (which otherwise looks identical to a full
// page reload). Plain CSS transition, not a JS-driven tween: the target
// opacity is a real style value the instant we set it, so even if the
// transition itself never gets to play, the view is still fully visible , 
// it just skips the fade instead of ever being stuck hidden.
// A transition only advances while the page is being composited. If the tab
// is backgrounded for the whole run, the element stays rendered at its start
// value, invisible, even though opacity:1 is already the specified value.
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

// The work view opens as a popup, a slow scale-up from just under full size.
// Ease-in-out rather than a sharp ease-out: it gathers speed instead of
// jumping at the first frame, which is what made it feel abrupt.
const OPEN_DURATION = 1.35;
const OPEN_EASE = "cubic-bezier(0.45, 0, 0.15, 1)";

function popIn(el, duration = OPEN_DURATION) {
  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.transform = "scale(0.94)";
  void el.offsetHeight;
  el.style.transition = `opacity ${duration * 0.8}s ${OPEN_EASE}, transform ${duration}s ${OPEN_EASE}`;
  el.style.opacity = "1";
  el.style.transform = "scale(1)";
  settle(el, duration);
}

// Below the mobile breakpoint, both Field and List routes show the same
// swipeable hall/works slider instead of the infinite field or the desktop
// list layout, panning a 2D field doesn't translate to touch.
// On the very first render the preloader is still up and runs the entry
// itself, so a view's own fade and text reveal wait for it.
function enter(el, fade, reveal) {
  if (isPreloading()) {
    onIntro(() => setTimeout(reveal, 700));
    return;
  }
  fade(el);
  reveal();
}

function renderField() {
  // Coming back from a work mirrors the slow opening instead of snapping.
  const fadeDuration = currentRoute === "work" ? OPEN_DURATION * 0.8 : 0.4;
  hideAllViews();
  if (isMobile()) {
    initMobileGallery(mobileRoot);
    mobileRoot.hidden = false;
  } else {
    fieldRoot.hidden = false;
    waterRoot.hidden = false;
    ensureLens();
    resumeField();
    loadFieldImages();
    enter(
      fieldRoot,
      (el) => fadeIn(el, fadeDuration),
      () =>
        fieldRoot.querySelectorAll(".field-label__name").forEach((name, i) => {
          revealText(name, { delay: 0.12 + i * 0.015 });
        })
    );
  }
  setActiveNav("field");
  currentRoute = "field";
  setPageMeta(DEFAULT_TITLE);
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
    enter(listRoot, fadeIn, () => revealText(listRoot.querySelector(".list-showcase__name"), { delay: 0.12 }));
  }
  setActiveNav("list");
  currentRoute = "list";
  setPageMeta(`Index of works | ${SITE}`);
}

function renderAbout() {
  hideAllViews();
  aboutRoot.hidden = false;
  enter(aboutRoot, (el) => fadeIn(el, 0.6), enterAbout);
  setActiveNav("about");
  currentRoute = "about";
  setPageMeta(
    `About | ${SITE}`,
    "Chris Williams Art Gallery has shown contemporary painting on Marlow Yard, Bethnal Green, since 2009. History of the gallery and its exhibitions."
  );
}

function renderContacts() {
  hideAllViews();
  contactsRoot.hidden = false;
  enter(contactsRoot, (el) => fadeIn(el, 0.6), () => {
    revealText(contactsRoot.querySelector(".contacts__label"), { delay: 0.15 });
    contactsRoot.querySelectorAll(".contacts-info__col > *").forEach((line, i) => {
      revealText(line, { delay: 0.3 + i * 0.05 });
    });
  });
  setActiveNav("contacts");
  currentRoute = "contacts";
  setPageMeta(
    `Contacts | ${SITE}`,
    "14 Marlow Yard, London E2 9AG. Open Wednesday to Saturday 11:00 to 18:00, Sunday 12:00 to 17:00. Admission free."
  );
}

// 404: a short note plus one painting from the collection, picked at random,
// so a dead link still leads somewhere worth looking at.
function renderNotFound() {
  hideAllViews();
  notFoundRoot.hidden = false;
  const all = halls.flatMap((hall) => hall.works.map((work) => ({ hall, work })));
  const { hall, work } = all[Math.floor(Math.random() * all.length)];
  const link = notFoundRoot.querySelector("[data-notfound-work]");
  link.href = url(`/work/${hall.id}/${work.id}`);
  link.onclick = (event) => {
    event.preventDefault();
    navigate("work", { hallId: hall.id, workId: work.id });
  };
  const img = link.querySelector("img");
  img.src = work.thumb;
  img.alt = work.title;
  link.querySelector(".notfound__frame").style.aspectRatio = work.aspect;
  link.querySelector(".notfound__caption").textContent = `${work.title}, ${hall.artist.name}`;
  enter(notFoundRoot, (el) => fadeIn(el, 0.6), () => revealText(notFoundRoot.querySelector(".notfound__title"), { delay: 0.1 }));
  setActiveNav("notfound");
  currentRoute = "notfound";
  setPageMeta(`Page not found | ${SITE}`);
}

function renderWorkRoute({ hallId, workId }) {
  hideAllViews();
  workRoot.hidden = false;
  renderWork(workRoot, hallId, workId);
  enter(
    workRoot,
    (el) => {
      popIn(el);
      playOpen();
    },
    // The title sits below the fold now; work-view reveals it on scroll.
    () => {}
  );
  setActiveNav("field");
  currentRoute = "work";
  const found = findWork(hallId, workId);
  if (found) {
    setPageMeta(`${found.work.title} by ${found.hall.artist.name} | ${SITE}`, found.work.text);
  }
}

// Every route change is one page that never reloads, header, footer, sound
// and cursor carry straight through. The outgoing view fades away first, then
// the next one fades in, so there is never a hard cut between sections.
const LEAVE_DURATION = 0.32;
let leaveTimer = null;

function transition(render) {
  const outgoing = allViews.find((view) => !view.hidden);
  clearTimeout(leaveTimer);
  if (!outgoing || isPreloading()) {
    render();
    return;
  }
  // Leaving mid intro: the preloader's rise-in tween would keep writing
  // opacity and fight the fade-out.
  gsap.killTweensOf(outgoing);
  outgoing.style.transition = `opacity ${LEAVE_DURATION}s ease, transform ${LEAVE_DURATION}s ease`;
  outgoing.style.opacity = "0";
  outgoing.style.transform = "scale(0.985)";
  if (outgoing === fieldRoot) waterRoot.hidden = true;
  leaveTimer = setTimeout(() => {
    render();
    outgoing.style.transform = "";
    // A view with no entry fade of its own (the mobile slider, or the same
    // view re-rendered) would otherwise stay at the faded-out opacity.
    if (outgoing.style.opacity === "0") {
      outgoing.style.transition = `opacity ${LEAVE_DURATION}s ease`;
      outgoing.style.opacity = "";
    }
  }, LEAVE_DURATION * 1000);
}

onRoute("field", () => transition(renderField));
onRoute("list", () => transition(renderList));
onRoute("about", () => transition(renderAbout));
onRoute("contacts", () => transition(renderContacts));
onRoute("notfound", () => transition(renderNotFound));
onRoute("work", (params) => transition(() => renderWorkRoute(params)));

// A resize can cross the mobile breakpoint (e.g. rotating a tablet) , 
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
// Asked once the gallery has arrived, not on top of the loading screen.
onIntro(() => initCookieBanner({ delay: 1.8 }));

document.querySelectorAll("[data-nav-field]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("field");
  });
});

document.querySelectorAll("[data-nav]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(link.dataset.nav);
  });
});

document.querySelectorAll("[data-nav-list]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("list");
  });
});

// Click-to-go-back covers the popup's whole first screen, artwork included , 
// exactly the area where the cursor reads "back to the gallery" (and inverts
// over the painting), so the clickable region and the label can't disagree.
workRoot.addEventListener("click", (event) => {
  if (!event.target.closest(".work-layout")) return;
  playClose();
  navigate("field");
});
