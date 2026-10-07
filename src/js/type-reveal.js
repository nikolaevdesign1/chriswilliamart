// Scramble reveal: each letter flickers through random digits for a moment,
// then locks onto the real character, left to right, very fast. Reads as a
// machine resolving the text rather than as type sliding into place.
//
// Timings follow the reference the client picked: 0.2s of noise per letter,
// letters starting 0.02s apart.

const SCRAMBLE_CHARS = "0123456789";
const CHAR_DURATION = 0.2;
const CHAR_STAGGER = 0.02;
const FIRST_DELAY = 0.02;
// How often a scrambling letter swaps digits. Every frame is too busy to read
// as digits at all; this keeps the flicker legible.
const FLICKER_MS = 45;

const runs = new WeakMap();

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function splitInto(el, text) {
  el.textContent = "";
  const chars = [];

  // Screen readers get the whole text once; the per-letter spans that do
  // the animation are hidden from them, or a heading would be spelled out.
  const label = document.createElement("span");
  label.className = "visually-hidden";
  label.textContent = text;
  el.appendChild(label);

  text.split(" ").forEach((word, wordIndex, words) => {
    const wordEl = document.createElement("span");
    wordEl.className = "reveal-word";
    wordEl.setAttribute("aria-hidden", "true");

    [...word].forEach((char) => {
      const span = document.createElement("span");
      span.className = "reveal-char";
      span.textContent = char;
      span.dataset.char = char;
      wordEl.appendChild(span);
      chars.push(span);
    });

    el.appendChild(wordEl);
    if (wordIndex < words.length - 1) el.appendChild(document.createTextNode(" "));
  });

  return chars;
}

// Splits only when the text is actually new. Per-letter inline-blocks measure
// slightly differently from a normal text run, so re-splitting the same label
// on every hover changed its width and nudged its neighbours, the menu
// visibly jumped. Reusing the existing spans keeps the box identical.
function ensureSplit(el, source) {
  if (el.dataset.revealSplit === "1" && el.dataset.revealText === source && el.querySelector(".reveal-char")) {
    return [...el.querySelectorAll(".reveal-char")];
  }
  const chars = splitInto(el, source);
  el.dataset.revealText = source;
  el.dataset.revealSplit = "1";
  return chars;
}

// Pins every letter to the width of its real glyph, so a narrow "i" showing
// a wide "8" mid-scramble can't push the rest of the line around. Measured
// at reveal time rather than at split time: the element may have been hidden
// then, or the web font not yet loaded.
function pinWidths(chars) {
  chars.forEach((c) => {
    c.textContent = c.dataset.char;
    c.style.width = "";
  });
  const widths = chars.map((c) => c.getBoundingClientRect().width);
  if (widths.every((w) => w === 0)) return; // not laid out; leave natural
  chars.forEach((c, i) => (c.style.width = `${widths[i]}px`));
}

function finish(chars) {
  chars.forEach((c) => {
    c.textContent = c.dataset.char;
    c.style.visibility = "";
  });
}

/** Pre-splits labels now, so even their first hover can't shift the layout. */
export function prepareText(scope = document) {
  if (!scope) return;
  scope.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
    ensureSplit(el, el.dataset.revealText ?? el.textContent);
  });
}

/**
 * Splits `el`'s text (or `text`, if given) into letters and scrambles them in.
 * Returns the total time the run will take, so callers can chain off it.
 */
export function revealText(el, { text, stagger = CHAR_STAGGER, delay = 0, duration = CHAR_DURATION } = {}) {
  if (!el) return 0;

  // The remembered text only counts while the element is still split; if
  // something has since replaced its contents (the list swapping artists),
  // the new text wins.
  const stillSplit = el.dataset.revealSplit === "1" && el.querySelector(".reveal-char");
  const source = text ?? (stillSplit ? el.dataset.revealText : el.textContent);
  const chars = ensureSplit(el, source);

  // Reduced motion: no scramble, the text is simply there.
  if (reducedMotion()) {
    finish(chars);
    return 0;
  }

  pinWidths(chars);

  // A new run on the same element replaces the old one outright.
  const previous = runs.get(el);
  if (previous) {
    cancelAnimationFrame(previous.raf);
    clearTimeout(previous.fallback);
  }

  chars.forEach((c) => (c.style.visibility = "hidden"));

  const run = { raf: 0, fallback: 0 };
  runs.set(el, run);

  const start = performance.now();
  const lastSwap = new Array(chars.length).fill(-Infinity);

  const frame = (now) => {
    const t = (now - start) / 1000;
    let active = false;

    chars.forEach((c, i) => {
      const from = delay + FIRST_DELAY + i * stagger;
      const to = from + duration;
      if (t < from) {
        active = true;
        return;
      }
      if (t >= to) {
        if (c.style.visibility || c.textContent !== c.dataset.char) {
          c.textContent = c.dataset.char;
          c.style.visibility = "";
        }
        return;
      }
      active = true;
      c.style.visibility = "";
      if (now - lastSwap[i] >= FLICKER_MS) {
        lastSwap[i] = now;
        c.textContent = SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
    });

    if (active) run.raf = requestAnimationFrame(frame);
    else runs.delete(el);
  };
  run.raf = requestAnimationFrame(frame);

  const total = delay + FIRST_DELAY + Math.max(0, chars.length - 1) * stagger + duration;

  // rAF stops in a backgrounded tab. setTimeout doesn't, so once the run is
  // due to be over, pin the finished text, it can never be left hidden.
  run.fallback = setTimeout(() => {
    cancelAnimationFrame(run.raf);
    finish(chars);
    if (runs.get(el) === run) runs.delete(el);
  }, total * 1000 + 120);

  return total;
}

// Text that replays the scramble when you point at it. Delegated, because
// most of these elements are built at runtime.
const HOVER_SELECTOR = [
  ".site-nav__link",
  ".view-toggle__btn",
  ".site-footer__credit a",
  ".list-panel__author",
  ".list-panel__row > span:nth-child(2)",
  ".field-tile__title",
  ".work-detail__more-meta > span",
  ".contacts__label",
  ".about-outro__link",
].join(", ");

export function initTextHover() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  // The header and footer sit in a shared flow row, so any width change there
  // is immediately visible as a jump. Split them up front.
  prepareText(document.querySelector(".site-header"));
  prepareText(document.querySelector(".site-footer"));

  document.addEventListener("mouseover", (event) => {
    const el = event.target.closest(HOVER_SELECTOR);
    if (!el) return;
    // mouseover bubbles from the letter spans this very effect creates, so
    // without this the animation would retrigger itself forever.
    if (event.relatedTarget && el.contains(event.relatedTarget)) return;
    if (el.dataset.revealBusy === "1") return;

    el.dataset.revealBusy = "1";
    const total = revealText(el);
    setTimeout(() => delete el.dataset.revealBusy, total * 1000 + 60);
  });
}

/** Reveals several elements in sequence, each starting after the last. */
export function revealSequence(elements, { stagger = CHAR_STAGGER, gap = 0.08, delay = 0 } = {}) {
  let cursor = delay;
  elements.filter(Boolean).forEach((el) => {
    const spent = revealText(el, { stagger, delay: cursor });
    cursor = spent - CHAR_DURATION + gap;
  });
  return cursor;
}
