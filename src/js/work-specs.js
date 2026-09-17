// Plausible catalogue details for a work — not real records, generated
// deterministically from the work's id so the same piece always shows the
// same specs across reloads.
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MEDIUMS = [
  "Oil on canvas",
  "Oil on linen",
  "Acrylic on canvas",
  "Mixed media on panel",
  "Archival pigment print",
  "Watercolor on paper",
  "Oil on board",
  "Charcoal and ink on paper",
];

const NOTES = [
  "Held in a private collection for over a decade before entering this exhibition.",
  "Restored and reframed prior to display; the original surface tooth is preserved.",
  "Shown here in its first public exhibition since the artist's studio sale.",
  "Catalogued from the artist's own notes at the time of completion.",
  "Lit and hung to the artist's specification for this room.",
  "Part of a small group of works the artist never intended to sell.",
];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const range = (rng, min, max) => Math.round(min + rng() * (max - min));

export function deriveSpecs(work) {
  const rng = mulberry32(hashSeed(work.id));
  const medium = pick(rng, MEDIUMS);
  const isPrint = medium === "Archival pigment print";

  const h = range(rng, 60, 140);
  const w = range(rng, 45, 110);

  return {
    medium,
    dimensions: `${h} × ${w} cm`,
    edition: isPrint ? `Edition of ${range(rng, 3, 12)}` : "Unique work",
    note: pick(rng, NOTES),
  };
}
