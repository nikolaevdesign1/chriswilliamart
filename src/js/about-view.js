import { revealText } from "./type-reveal.js";
import { smoothScroll } from "./smooth-scroll.js";

// The about view: the gallery's history, year by year. Each entry scrambles
// its year in as it reaches the screen, and does so again on every visit.

let root = null;
let observer = null;

export function initAbout(el) {
  root = el;
  if (!root) return;
  smoothScroll(root, { axis: "y" });

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        observer.unobserve(item);
        item.classList.add("is-visible");
        revealText(item.querySelector(".about-entry__year"));
        revealText(item.querySelector(".about-entry__title"), { delay: 0.08 });
      });
    },
    { root, rootMargin: "0px 0px -12% 0px" }
  );
}

/** Called each time the view is shown: back to the top, reveals replayed. */
export function enterAbout() {
  if (!root) return;
  root.scrollTop = 0;
  revealText(root.querySelector(".about-intro__eyebrow"), { delay: 0.3 });
  root.querySelectorAll("[data-about-entry]").forEach((item) => {
    item.classList.remove("is-visible");
    observer.unobserve(item);
    observer.observe(item);
  });
}
