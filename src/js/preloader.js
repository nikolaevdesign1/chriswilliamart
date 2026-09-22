import { halls } from "../data/halls.js";
import { revealText } from "./type-reveal.js";

const GREETING = "Welcome to Chris Williams Art Gallery";
const MIN_DURATION = 2800;

export function initPreloader() {
  const root = document.getElementById("preloader");
  if (!root) return;

  const headline = root.querySelector(".preloader__headline");
  const fill = root.querySelector(".preloader__bar-fill");
  const percent = root.querySelector(".preloader__percent");

  // Paced so the greeting finishes landing just under the minimum hold — a
  // fast cached load shouldn't cut the sentence off mid-word.
  revealText(headline, { text: GREETING, stagger: 0.055, duration: 0.5 });

  const images = halls.flatMap((hall) => hall.works.map((work) => work.image));
  let loaded = 0;
  const total = images.length;
  const startTime = performance.now();

  function updateProgress() {
    const pct = total ? Math.round((loaded / total) * 100) : 100;
    fill.style.width = `${pct}%`;
    percent.textContent = `${pct}%`;
    if (loaded >= total) requestFinish();
  }

  function requestFinish() {
    const remaining = Math.max(0, MIN_DURATION - (performance.now() - startTime));
    setTimeout(finish, remaining);
  }

  function finish() {
    root.style.transition = "opacity 0.6s ease";
    root.style.opacity = "0";
    setTimeout(() => root.remove(), 650);
  }

  if (total === 0) {
    requestFinish();
    return;
  }

  images.forEach((src) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded += 1;
      updateProgress();
    };
    img.src = src;
  });

  updateProgress();
}
