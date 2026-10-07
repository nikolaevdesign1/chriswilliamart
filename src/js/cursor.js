import gsap from "gsap";

const GROW_SELECTOR =
  ".site-nav__link, .site-logo, .view-toggle__btn, .site-footer__credit a, .list-panel__author, .cookie-banner__btn, .contacts__label, .about-outro__link";

export function initCursor() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  dot.innerHTML = '<span class="cursor-dot__inner"><span class="cursor-dot__label"></span></span>';
  document.body.appendChild(dot);
  const label = dot.querySelector(".cursor-dot__label");

  gsap.set(dot, { xPercent: -50, yPercent: -50 });
  const moveX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3.out" });
  const moveY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3.out" });

  let lastX = -1;
  let lastY = -1;

  function applyState(el) {
    const labelTarget = el?.closest("[data-cursor-label]");
    // An empty label is an explicit opt-out, used to punch holes in a
    // labelled region (the artwork inside the popup's first screen).
    const labelText = labelTarget?.dataset.cursorLabel;
    if (labelText) {
      label.textContent = labelText;
      dot.classList.add("cursor-dot--label");
      dot.classList.remove("cursor-dot--grow");
      return;
    }
    dot.classList.remove("cursor-dot--label");
    dot.classList.toggle("cursor-dot--grow", !!el?.closest(GROW_SELECTOR));
  }

  window.addEventListener("mousemove", (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    moveX(event.clientX);
    moveY(event.clientY);
  });

  document.addEventListener("mouseover", (event) => applyState(event.target));

  // Scrolling moves content under a stationary cursor without firing
  // mouseover, so the label would otherwise stay stuck from wherever the
  // pointer last entered, re-test what's actually under it.
  window.addEventListener(
    "scroll",
    () => {
      if (lastX < 0) return;
      applyState(document.elementFromPoint(lastX, lastY));
    },
    { capture: true, passive: true }
  );

  window.addEventListener("mouseleave", () => dot.classList.add("cursor-dot--hidden"));
  window.addEventListener("mouseenter", () => dot.classList.remove("cursor-dot--hidden"));
}
