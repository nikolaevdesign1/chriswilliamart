import gsap from "gsap";

// The whole preloader is one number: real load progress, riding under the
// pointer. At 100% it lets go and the page behind rises out of the distance.

// Even a fully cached load counts up visibly rather than flashing 100%.
const MIN_DURATION = 900;
// How quickly the shown number chases the real one, per frame, so it glides
// between jumps instead of stepping file by file.
const COUNT_EASE = 0.08;

const root = document.getElementById("preloader");
let done = !root;
const introCallbacks = [];

/** True until the intro has started, views skip their own entry fade then. */
export function isPreloading() {
  return !done;
}

/** Runs `fn` as the intro starts (or right away if it already has). */
export function onIntro(fn) {
  if (done) fn();
  else introCallbacks.push(fn);
}

// The view on screen behind the preloader, whichever route loaded first.
function activeView() {
  return document.querySelector("main > :not([hidden])");
}

function intro() {
  done = true;
  const view = activeView();
  const chrome = document.querySelectorAll(".site-header > *, .site-footer > *");

  const tl = gsap.timeline();
  tl.to(root.querySelector(".preloader__percent"), { opacity: 0, duration: 0.25, ease: "power1.out" })
    .to(root, { opacity: 0, duration: 0.9, ease: "power2.inOut", onComplete: () => root.remove() }, 0.1);

  // "From far away": the view starts small and faint and comes forward,
  // decelerating the whole way so it settles instead of landing. With
  // reduced motion it only fades.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (view && reduced) {
    tl.fromTo(view, { opacity: 0 }, { opacity: 1, duration: 0.4, clearProps: "opacity" }, 0.1);
  } else if (view) {
    tl.fromTo(
      view,
      { scale: 0.55, opacity: 0, transformOrigin: "50% 50%" },
      {
        scale: 1,
        opacity: 1,
        duration: 2.2,
        ease: "expo.out",
        clearProps: "transform,opacity",
      },
      0.15
    );
  }
  // clearProps hands each element back to its stylesheet afterwards. The logo
  // has its own CSS opacity transition for hover, which fought the tween and
  // could leave it stuck at 0, invisible on every page from then on.
  tl.from(chrome, { opacity: 0, y: -8, duration: 0.8, stagger: 0.05, ease: "power2.out", clearProps: "opacity,transform" }, 0.9);

  introCallbacks.splice(0).forEach((fn) => fn());
}

export function initPreloader() {
  if (!root) return;

  const percent = root.querySelector(".preloader__percent");
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  // Anchored at the screen centre in CSS and offset from there, so it starts
  // centred whatever the window size was at load; on touch it stays put.
  gsap.set(percent, { xPercent: -50, yPercent: -50 });
  if (!coarse) {
    const moveX = gsap.quickTo(percent, "x", { duration: 0.35, ease: "power3.out" });
    const moveY = gsap.quickTo(percent, "y", { duration: 0.35, ease: "power3.out" });
    const follow = (event) => {
      moveX(event.clientX - window.innerWidth / 2);
      moveY(event.clientY - window.innerHeight / 2);
    };
    window.addEventListener("pointermove", follow);
    onIntro(() => window.removeEventListener("pointermove", follow));
  }

  // Only what the first screen shows: each view marks those images
  // data-critical (the field's opening tiles, a work's hero, the first artist
  // on a phone). Everything else loads after the intro, so the wait is a
  // second or two even on a slow connection.
  const images = [...document.querySelectorAll("main > :not([hidden]) img[data-critical]")];
  const total = images.length;
  let loaded = 0;
  let shown = 0;
  const startTime = performance.now();

  const count = () => (loaded += 1);
  images.forEach((img) => {
    if (img.complete && img.naturalWidth) {
      count();
      return;
    }
    // A broken image still counts as done, so the intro can never stall.
    img.addEventListener("load", count, { once: true });
    img.addEventListener("error", count, { once: true });
  });

  const tick = () => {
    const real = total ? loaded / total : 1;
    // Time caps the number too, so a cached load still takes MIN_DURATION.
    const paced = Math.min(real, (performance.now() - startTime) / MIN_DURATION);
    // Eased, with a floor on each step so the last few percent don't crawl.
    shown = Math.min(paced, shown + Math.max((paced - shown) * COUNT_EASE, 0.006));
    percent.textContent = `${Math.floor(shown * 100)}%`;

    if (shown >= 1) intro();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
