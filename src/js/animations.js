import { gsap } from "gsap";

export function initWallIntro() {
  gsap.from(".site-header > *, .site-footer > *, .list-panel__head, .list-panel__row", {
    opacity: 0,
    y: -12,
    duration: 0.6,
    stagger: 0.03,
    ease: "power2.out",
  });

  gsap.from(".tile, .artist-spotlight, .wall-caption, .wall-bio", {
    opacity: 0,
    y: 24,
    duration: 0.7,
    stagger: 0.06,
    delay: 0.15,
    ease: "power3.out",
  });
}

export function initHorizontalWheelScroll() {
  const wall = document.querySelector(".wall");
  if (!wall) return;

  wall.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      wall.scrollLeft += event.deltaY;
    },
    { passive: false }
  );
}
