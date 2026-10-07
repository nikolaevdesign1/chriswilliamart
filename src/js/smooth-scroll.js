// Inertial scrolling for a single container.
//
// Same easing the field camera uses, position chases a target by a fixed
// fraction each frame, so a slider and the infinite field decelerate
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
    current += (target - current) * (reducedMotion() ? 1 : smoothing);

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

// Item-by-item scrolling for a strip: each wheel gesture moves exactly one
// item and lands it flush with the start edge, so a work is either in view
// or gone, never left hanging half cut off.
//
// Each step is a long timed glide with a soft ease-out rather than the
// per-frame chase above: it leaves quickly and takes its time settling.
//
// Trackpads send a long stream of small deltas for one swipe, so deltas are
// summed until they clearly mean "next", and further input is ignored for a
// moment after each step. A new step mid-glide starts from wherever the strip
// is, so quick repeated flicks chain without a jolt.
const STEP_THRESHOLD = 30;
const STEP_COOLDOWN = 450;
const STEP_DURATION = 1.25;

const easeOutQuart = (t) => 1 - (1 - t) ** 4;

export function stepScroll(el, { itemSelector, duration = STEP_DURATION } = {}) {
  if (!el) return () => {};

  let target = el.scrollLeft;
  let from = target;
  let startedAt = 0;
  let rafId = null;
  let acc = 0;
  let lockedUntil = 0;

  const items = () => [...el.querySelectorAll(itemSelector)];
  const limit = () => el.scrollWidth - el.clientWidth;

  // Item positions measured from the first item, i.e. in scrollLeft terms , 
  // offsetLeft alone is relative to whatever the offset parent happens to be.
  const positions = (list) => list.map((item) => item.offsetLeft - list[0].offsetLeft);

  function tick(now) {
    const t = reducedMotion() ? 1 : Math.min((now - startedAt) / (duration * 1000), 1);
    el.scrollLeft = from + (target - from) * easeOutQuart(t);
    if (t < 1) rafId = requestAnimationFrame(tick);
    else rafId = null;
  }

  // Index of the item the strip is heading to (or resting on).
  function currentIndex(stops) {
    let best = 0;
    stops.forEach((x, i) => {
      if (Math.abs(x - target) < Math.abs(stops[best] - target)) best = i;
    });
    return best;
  }

  function step(direction) {
    const list = items();
    if (!list.length) return;
    // Idle: something else (a new hall, a drag) may have moved the strip.
    if (rafId === null) target = el.scrollLeft;
    const max = limit();
    // Past the last reachable stop every later item maps to the end.
    const stops = positions(list).map((x) => Math.min(x, max));
    const index = Math.min(Math.max(currentIndex(stops) + direction, 0), list.length - 1);
    if (stops[index] === target) return;
    from = el.scrollLeft;
    target = stops[index];
    startedAt = performance.now();
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function onWheel(event) {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    event.preventDefault();
    if (!delta) return;
    const now = performance.now();
    if (now < lockedUntil) {
      acc = 0;
      return;
    }
    acc += delta;
    if (Math.abs(acc) < STEP_THRESHOLD) return;
    step(Math.sign(acc));
    acc = 0;
    lockedUntil = now + STEP_COOLDOWN;
  }

  el.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    el.removeEventListener("wheel", onWheel);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
