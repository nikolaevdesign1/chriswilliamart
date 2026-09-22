// Letters rise into place from below their own baseline, fast and staggered,
// instead of being typed character by character.
//
// Driven by plain CSS transitions rather than a JS tween: the end state is a
// real style value the moment it's set, so a throttled or backgrounded tab
// can only ever skip the motion — it can never leave text stuck invisible.

const CHAR_DURATION = 0.42;

function splitInto(el, text) {
  el.textContent = "";
  const chars = [];

  text.split(" ").forEach((word, wordIndex, words) => {
    const wordEl = document.createElement("span");
    wordEl.className = "reveal-word";

    [...word].forEach((char) => {
      const mask = document.createElement("span");
      mask.className = "reveal-char";
      const inner = document.createElement("span");
      inner.className = "reveal-char__inner";
      inner.textContent = char;
      mask.appendChild(inner);
      wordEl.appendChild(mask);
      chars.push(inner);
    });

    el.appendChild(wordEl);
    if (wordIndex < words.length - 1) el.appendChild(document.createTextNode(" "));
  });

  return chars;
}

// Splits only when the text is actually new. Per-letter inline-blocks measure
// slightly differently from a normal text run, so re-splitting the same label
// on every hover changed its width and nudged its neighbours — the menu
// visibly jumped. Reusing the existing spans keeps the box identical.
function ensureSplit(el, source) {
  if (el.dataset.revealSplit === "1" && el.dataset.revealText === source) {
    return [...el.querySelectorAll(".reveal-char__inner")];
  }
  const chars = splitInto(el, source);
  el.dataset.revealText = source;
  el.dataset.revealSplit = "1";
  return chars;
}

/** Pre-splits labels now, so even their first hover can't shift the layout. */
export function prepareText(scope = document) {
  if (!scope) return;
  scope.querySelectorAll(HOVER_SELECTOR).forEach((el) => {
    ensureSplit(el, el.dataset.revealText ?? el.textContent);
  });
}

/**
 * Splits `el`'s text (or `text`, if given) into characters and floats them up.
 * Returns the total time the run will take, so callers can chain off it.
 */
export function revealText(el, { text, stagger = 0.022, delay = 0, duration = CHAR_DURATION } = {}) {
  if (!el) return 0;

  const source = text ?? el.dataset.revealText ?? el.textContent;
  const chars = ensureSplit(el, source);

  chars.forEach((char) => {
    char.style.transition = "none";
    char.style.transform = "translateY(110%)";
    char.style.opacity = "0";
  });

  // Commit the start state before switching to the end state, or the browser
  // collapses both writes into one frame and skips the transition entirely.
  void el.offsetHeight;

  chars.forEach((char, i) => {
    const charDelay = (delay + i * stagger).toFixed(3);
    char.style.transition = `transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${charDelay}s, opacity ${(
      duration * 0.6
    ).toFixed(3)}s ease ${charDelay}s`;
    char.style.transform = "translateY(0)";
    char.style.opacity = "1";
  });

  const total = delay + chars.length * stagger + duration;
  settle(chars, total);
  return total;
}

// A transition only advances while the page is actually being composited, so
// a tab that is backgrounded across the whole run can leave the text frozen
// at its start value — invisible — even though the end value is already the
// specified one. setTimeout keeps running regardless, so once the run is due
// to be over we drop the transition and pin the end state: the next paint
// then shows finished text instead of resuming a stale animation.
function settle(chars, totalSeconds) {
  setTimeout(() => {
    chars.forEach((char) => {
      char.style.transition = "none";
      char.style.transform = "translateY(0)";
      char.style.opacity = "1";
    });
  }, totalSeconds * 1000 + 120);
}

// Text that replays the same rising-letter motion when you point at it, so
// hovering a label feels like the page re-typing it rather than just changing
// colour. Delegated, because most of these elements are built at runtime.
const HOVER_SELECTOR = [
  ".site-nav__link",
  ".view-toggle__btn",
  ".site-footer__credit a",
  ".list-panel__author",
  ".list-panel__row > span:nth-child(2)",
  ".field-tile__title",
  ".work-detail__more-item span",
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
    const total = revealText(el, { stagger: 0.016, duration: 0.34 });
    setTimeout(() => delete el.dataset.revealBusy, total * 1000 + 60);
  });
}

/** Reveals several elements in sequence, each starting after the last. */
export function revealSequence(elements, { stagger = 0.022, gap = 0.08, delay = 0 } = {}) {
  let cursor = delay;
  elements.filter(Boolean).forEach((el) => {
    const spent = revealText(el, { stagger, delay: cursor });
    cursor = spent - CHAR_DURATION + gap;
  });
  return cursor;
}
