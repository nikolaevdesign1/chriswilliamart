import gsap from "gsap";
import { halls } from "../data/halls.js";

const SCATTER_COUNT = 18;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function initPreloader() {
  const root = document.getElementById("preloader");
  if (!root) return;

  const images = halls.flatMap((hall) => hall.works.map((work) => work.image));
  const scatterPool = [...images].sort(() => Math.random() - 0.5).slice(0, SCATTER_COUNT);

  const scatter = root.querySelector(".preloader__scatter");
  const fill = root.querySelector(".preloader__bar-fill");
  const percent = root.querySelector(".preloader__percent");

  const figures = scatterPool.map((src) => {
    const w = randomBetween(120, 220);
    const h = w * randomBetween(0.7, 1.4);
    const fig = document.createElement("figure");
    fig.className = "preloader__item";
    fig.style.left = `${randomBetween(2, 88)}%`;
    fig.style.top = `${randomBetween(8, 82)}%`;
    fig.style.width = `${w}px`;
    fig.style.height = `${h}px`;
    fig.style.setProperty("--r", `${randomBetween(-18, 18)}deg`);
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    fig.appendChild(img);
    scatter.appendChild(fig);
    return fig;
  });

  gsap.set(figures, { opacity: 0, scale: 0.6 });
  gsap.to(figures, {
    opacity: 1,
    scale: 1,
    duration: 0.7,
    stagger: { each: 0.09, from: "random" },
    ease: "back.out(1.7)",
  });

  let loaded = 0;
  const total = images.length;

  function updateProgress() {
    const pct = total ? Math.round((loaded / total) * 100) : 100;
    fill.style.width = `${pct}%`;
    percent.textContent = `${pct}%`;
    if (loaded >= total) finish();
  }

  function finish() {
    gsap.to(root, {
      opacity: 0,
      duration: 0.6,
      delay: 0.2,
      ease: "power2.out",
      onComplete: () => root.remove(),
    });
  }

  if (total === 0) {
    finish();
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
