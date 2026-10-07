// The WebGL ripple is the heaviest thing on the site (three.js), and nothing
// needs it until the visitor points at a picture. So this stub ships with the
// page and loads the real thing (ripple-gl.js) once the browser is idle after
// the intro. Calls made before that are no-ops; a hover that lands while it
// loads is replayed as soon as it's ready.

let gl = null;
let loading = null;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(pointer: fine)").matches;

function load() {
  if (!loading) {
    loading = import("./ripple-gl.js").then((mod) => {
      mod.initRipple();
      gl = mod;
      return mod;
    });
  }
  return loading;
}

export function initRipple() {
  // A hover effect: pointless on touch, and it is motion the visitor may
  // have asked not to see.
  if (reducedMotion() || !finePointer()) return;
  const go = () => load();
  if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 3000 });
  else setTimeout(go, 1500);
}

export function showRipple(tile, src) {
  if (gl) {
    gl.showRipple(tile, src);
    return;
  }
  if (!loading) return;
  loading.then((mod) => {
    if (tile.matches(":hover")) mod.showRipple(tile, src);
  });
}

export function moveRipple(tile, event) {
  gl?.moveRipple(tile, event);
}

export function hideRipple(tile) {
  gl?.hideRipple(tile);
}
