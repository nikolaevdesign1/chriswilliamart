// Mirrors the .work-hero CSS rules exactly, so the reveal-transition's
// target rect matches where the real hero image will actually sit —
// keep the two in sync if you change one.
export function workHeroRect() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(vw * 0.46, 520);
  const height = width * (896 / 610);
  return {
    left: (vw - width) / 2,
    top: vh * 0.12,
    width,
    height,
  };
}
