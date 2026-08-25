// Mirrors the --u CSS custom property: 1 design px (on the 1920x1080 canvas) in real screen px.
export function designUnit() {
  return window.innerHeight / 1080;
}

export function designRect(x, y, w, h) {
  const u = designUnit();
  return { left: x * u, top: y * u, width: w * u, height: h * u };
}

export const WORK_HERO_BOX = { x: 655, y: 92, w: 610, h: 896 };
