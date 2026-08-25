import { gsap } from "gsap";

export function initWallIntro() {
  gsap.from(".site-header > *, .site-footer > *, .list-panel__head, .list-panel__row", {
    opacity: 0,
    y: -12,
    duration: 0.6,
    stagger: 0.03,
    ease: "power2.out",
  });
}

export function initStageIntro() {
  gsap.from(".site-header > *, .site-footer > *", {
    opacity: 0,
    y: -12,
    duration: 0.6,
    stagger: 0.05,
    ease: "power2.out",
  });

  gsap.from(".abs, .tile", {
    opacity: 0,
    y: 16,
    duration: 0.6,
    stagger: 0.05,
    delay: 0.1,
    ease: "power3.out",
  });
}

export function initScatterIntro() {
  gsap.from(".welcome-copy", {
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
  });

  gsap.from(".scatter", {
    opacity: 0,
    scale: 0.8,
    duration: 0.8,
    stagger: 0.08,
    delay: 0.2,
    ease: "back.out(1.6)",
  });
}
