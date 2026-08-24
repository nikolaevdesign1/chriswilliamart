import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initHeroIntro() {
  gsap.from(".hero__title, .hero__subtitle", {
    opacity: 0,
    y: 24,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
  });
}
