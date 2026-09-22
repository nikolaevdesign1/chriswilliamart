// Inertial scrolling for a single container.
//
// Same easing the field camera uses — position chases a target by a fixed
// fraction each frame — so a slider and the infinite field decelerate
// identically instead of one gliding while the other snaps.
//
// Deliberately not a scroll-hijacking library: this only intercepts the
// wheel, still drives real scrollLeft/scrollTop, and leaves scrollbars,
// keyboard scrolling and touch momentum alone.

const DEFAULT_SMOOTHING = 0.085;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function smoothScroll(el, { axis = "y", smoothing = DEFAULT_SMOOTHING, multiplier = 1 } = {}) {
  if (!el) return () => {};

  const horizontal = axis === "x";
  const read = () => (horizontal ? el.scrollLeft : el.scrollTop);
  const write = (value) => {
    if (horizontal) el.scrollLeft = value;
    else el.scrollTop = value;
  };
  const limit = () =>
    horizontal ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;

  let target = read();
  let current = target;
  let rafId = null;

  function tick() {
    current += (target - current) * smoothing;

    // Sub-pixel drift would keep the loop alive forever for no visible gain.
    if (Math.abs(target - current) < 0.4) {
      current = target;
      write(current);
      rafId = null;
      return;
    }

    write(current);
    rafId = requestAnimationFrame(tick);
  }

  function onWheel(event) {
    // A horizontal strip should also answer a plain vertical wheel, so take
    // whichever axis the user actually pushed hardest.
    const delta = horizontal
      ? Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY
      : event.deltaY;

    if (!delta) return;

    const max = limit();
    if (max <= 0) return; // nothing to scroll

    // Resync before starting: something else (a route render, a jump to top,
    // a scrollbar drag) may have moved the element since the last run.
    if (rafId === null) current = target = read();

    const next = clamp(target + delta * multiplier, 0, max);

    // Always consume the wheel for a container we own, including the tail of
    // an overscroll. Letting it fall through at the ends handed the leftover
    // delta to an ancestor, which could scroll the layout sideways and slide
    // the whole list out of alignment.
    event.preventDefault();
    if (next === target) return;

    target = next;
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  el.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    el.removeEventListener("wheel", onWheel);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
