import { findWork, workNumber, artistLine, artistFacts } from "../data/halls.js";
import { deriveSpecs, workDimensions } from "./work-specs.js";
import { navigate, url } from "./router.js";
import { revealText } from "./type-reveal.js";
import { showRipple, moveRipple, hideRipple } from "./ripple.js";

// The presentation page for one work: the painting as large as the screen
// allows, then its title and story, then the same painting hung at true
// scale in three rooms, then the rest of the artist's hall.

// Rooms are real photographs (CC0, StockSnap; old frames retouched out of
// three of them), each measured once so a painting can be hung at true
// scale: how many image pixels make a centimetre on the wall, where the
// floor meets the wall, where the wall's centre is, and how tall the
// furniture under the picture stands. Coordinates are in the photo's own
// pixels.
const roomPhotos = import.meta.glob("../assets/img/rooms/*.jpg", { eager: true, import: "default" });
const roomPhoto = (name) => roomPhotos[`../assets/img/rooms/${name}.jpg`];

const ROOMS = [
  {
    id: "living",
    name: "Living room",
    note: "Above a two-seat sofa",
    width: 960,
    height: 638,
    pxPerCm: 2.18, // from the sofa back (85 cm) and a wall socket at 30 cm
    floorY: 532,
    centerX: 482,
    furnitureCm: 85,
    frame: "walnut",
  },
  {
    id: "dining",
    name: "Dining room",
    note: "Over the dining table",
    width: 960,
    height: 640,
    pxPerCm: 3.3, // from the chair backs (45 cm wide, 85 cm tall)
    floorY: 805,
    centerX: 467,
    furnitureCm: 85,
    frame: "oak",
  },
  {
    id: "studio",
    name: "Studio",
    note: "Above a writing desk",
    width: 960,
    height: 640,
    pxPerCm: 3.1, // from the desk (75 cm tall, 140 cm wide)
    floorY: 685,
    centerX: 472,
    furnitureCm: 95, // desk plus the sprig of eucalyptus on it
    frame: "none",
  },
];

// Standard hang: picture centre at 150 cm, and at least 25 cm clear of
// whatever stands beneath it.
const EYE_LINE_CM = 150;
const CLEARANCE_CM = 25;

function roomMarkup(room, work, heightCm) {
  const center = Math.max(EYE_LINE_CM, room.furnitureCm + CLEARANCE_CM + heightCm / 2);
  // Everything as a share of the photo, so the composite scales with it.
  const centerY = room.floorY - center * room.pxPerCm;
  const style = [
    `--photo:url("${roomPhoto(room.id)}")`,
    `--ratio:${room.width / room.height}`,
    `--cx:${((room.centerX / room.width) * 100).toFixed(3)}%`,
    `--cy:${((centerY / room.height) * 100).toFixed(3)}%`,
    `--art-h:${((heightCm * room.pxPerCm) / room.height) * 100}cqh`,
    // one centimetre on that wall, for frame widths and shadows
    `--cm:${((room.pxPerCm / room.height) * 100).toFixed(4)}cqh`,
  ].join(";");

  return `
    <figure class="room room--${room.id}" style='${style}'>
      <div class="room__stage">
        <div class="room__art room__art--${room.frame}">
          <img src="${work.image}" alt="${work.title} shown in a ${room.name.toLowerCase()}" loading="lazy" />
        </div>
      </div>
      <figcaption class="room__caption">
        <span>${room.name}</span>
        <span>${room.note}</span>
      </figcaption>
    </figure>
  `;
}

let observer = null;

export function renderWork(root, hallId, workId) {
  const found = findWork(hallId, workId);
  if (!found) {
    root.innerHTML = `<div class="work-layout"><p class="work-story__text">Work not found.</p></div>`;
    return;
  }

  const { hall, work } = found;
  const specs = deriveSpecs(work);
  const more = hall.works.filter((w) => w.id !== work.id);

  // #view-work is its own scroll container, start every work at the top.
  root.scrollTop = 0;

  root.innerHTML = `
    <div class="work-layout" data-cursor-label="back to the gallery">
      <figure class="work-hero">
        <img src="${work.image}" alt="${work.title}" />
      </figure>
    </div>

    <section class="work-story" data-reveal>
      <p class="work-story__eyebrow">${workNumber(hall.id, work.id)} / ${hall.artist.name}</p>
      <h1 class="work-info__title">${work.title}</h1>
      <div class="work-story__body">
        <dl class="work-specs">
          <div class="work-specs__row"><dt>Artist</dt><dd>${hall.artist.name}, ${artistLine(hall.artist).split(", ")[1]}</dd></div>
          <div class="work-specs__row"><dt>Date</dt><dd>${work.date}</dd></div>
          <div class="work-specs__row"><dt>Year</dt><dd>${work.year}</dd></div>
          <div class="work-specs__row"><dt>Medium</dt><dd>${hall.artist.medium}</dd></div>
          <div class="work-specs__row"><dt>Dimensions</dt><dd data-dimensions>${specs.heightCm} cm high</dd></div>
          <div class="work-specs__row"><dt>Edition</dt><dd>${specs.edition}</dd></div>
        </dl>
        <div class="work-story__text">
          <p>${work.text}</p>
          <p>${hall.artist.statement}</p>
        </div>
      </div>
    </section>

    <section class="work-artist" data-reveal>
      <div class="work-section-head">
        <h2 class="work-section-head__title">${hall.artist.name}</h2>
        <p class="work-section-head__note">${artistLine(hall.artist)} · ${hall.artist.movement}</p>
      </div>
      <div class="work-story__body">
        <dl class="work-specs">
          ${artistFacts(hall)
            .map(([label, value]) => `<div class="work-specs__row"><dt>${label}</dt><dd>${value}</dd></div>`)
            .join("")}
        </dl>
        <div class="work-artist__text">
          <blockquote class="work-artist__quote">“${hall.artist.quote}”</blockquote>
          <p>${hall.artist.bio}</p>
        </div>
      </div>
    </section>

    <section class="work-rooms" data-reveal>
      <div class="work-section-head">
        <h2 class="work-section-head__title">On the wall</h2>
        <p class="work-section-head__note">Shown at its real size, ${specs.heightCm} cm high, in three rooms.</p>
      </div>
      <div class="work-rooms__list">
        ${ROOMS.map((room) => roomMarkup(room, work, specs.heightCm)).join("")}
      </div>
    </section>

    ${
      more.length
        ? `
    <section class="work-more" data-reveal>
      <div class="work-section-head">
        <h2 class="work-section-head__title">More from ${hall.artist.name}</h2>
        <p class="work-section-head__note">${more.length} more ${more.length === 1 ? "work" : "works"} in this hall.</p>
      </div>
      <div class="work-more__grid">
        ${more
          .map(
            (w) => `
          <a class="work-detail__more-item" href="${url(`/work/${hall.id}/${w.id}`)}" data-hall-id="${hall.id}" data-work-id="${w.id}">
            <span class="work-detail__more-frame" style="aspect-ratio:${w.aspect}" data-ripple-frame><img src="${w.thumb}" alt="${w.title}" loading="lazy" /></span>
            <span class="work-detail__more-meta">
              <em>${workNumber(hall.id, w.id)}</em>
              <span>${w.title}</span>
              <em>${w.year}</em>
            </span>
          </a>
        `
          )
          .join("")}
      </div>
    </section>`
        : ""
    }
  `;

  const hero = root.querySelector(".work-hero");
  const heroImg = hero.querySelector("img");
  hero.style.opacity = "0";
  requestAnimationFrame(() => {
    hero.style.transition = "opacity 0.9s cubic-bezier(0.45, 0, 0.15, 1) 0.15s";
    hero.style.opacity = "1";
  });

  // Width follows from the painting's own proportions once they're known.
  const setDimensions = () => {
    if (!heroImg.naturalWidth) return;
    const aspect = heroImg.naturalWidth / heroImg.naturalHeight;
    root.querySelector("[data-dimensions]").textContent = workDimensions(specs.heightCm, aspect);
  };
  if (heroImg.complete) setDimensions();
  else heroImg.addEventListener("load", setDimensions, { once: true });

  // Sections rise in as they reach the screen; the title scrambles in.
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        entry.target.classList.add("is-visible");
        const title = entry.target.querySelector(".work-info__title, .work-section-head__title");
        if (title) revealText(title, { delay: 0.1 });
      });
    },
    { root, rootMargin: "0px 0px -15% 0px" }
  );
  root.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

  root.querySelectorAll(".work-detail__more-item").forEach((link) => {
    // Same water ripple as the field and the list strip.
    const thumbSrc = link.querySelector("img").getAttribute("src");
    link.addEventListener("mouseenter", () => showRipple(link, thumbSrc));
    link.addEventListener("mousemove", (event) => moveRipple(link, event));
    link.addEventListener("mouseleave", () => hideRipple(link));
    link.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideRipple(link);
      navigate("work", { hallId: link.dataset.hallId, workId: link.dataset.workId });
    });
  });
}
