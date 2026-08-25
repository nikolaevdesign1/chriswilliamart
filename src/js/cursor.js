import gsap from "gsap";

const GROW_SELECTOR = ".site-nav__link, .site-logo, .view-toggle__btn, .site-footer__credit a";

export function initCursor() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.innerHTML = '<span class="cursor-dot__inner"></span>';
  document.body.appendChild(dot);

  gsap.set(dot, { xPercent: -50, yPercent: -50 });
  const moveX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3.out" });
  const moveY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3.out" });

  window.addEventListener("mousemove", (event) => {
    moveX(event.clientX);
    moveY(event.clientY);
  });

  document.addEventListener("mouseover", (event) => {
    dot.classList.toggle("cursor-dot--grow", !!event.target.closest(GROW_SELECTOR));
  });

  window.addEventListener("mouseleave", () => dot.classList.add("cursor-dot--hidden"));
  window.addEventListener("mouseenter", () => dot.classList.remove("cursor-dot--hidden"));
}
