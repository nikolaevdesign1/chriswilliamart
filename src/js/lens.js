// Glass-lens edges for the field: a band along every edge of the screen
// where the view bends as if seen through the rim of a thick lens, with a
// little colour split right at the edge.
//
// Replaces the old animated-turbulence "water". That filter regenerated
// fractal noise every frame over four strips and was the main cost while
// panning. This one is a single static displacement map: the browser only
// re-samples the backdrop, it never has to invent new noise.

const SVG_NS = "http://www.w3.org/2000/svg";

// Share of the viewport each band covers, of the width for the side bands,
// of the height for the top and bottom ones.
const BAND = 0.08;
// How far apart red and blue land at the very edge, as a share of the bend.
const CHROMA = 0.07;
// How far each band runs past the screen along its length. The "no shift"
// map value is a hair off 0.5 (see buildMap), so the band's very first and
// last rows sample a fraction of a pixel outside it, empty backdrop, which
// showed as a thin blue curl in the corners. Pushed off-screen, it's gone.
const OVERHANG = 6;
// Map resolution along the band. The map is 8-bit, so this only has to be
// fine enough that neighbouring columns differ by less than a pixel of bend.
const MAP_STEPS = 512;

// Circular lens profile. t = 0 at the inner edge of the band (flat, zero
// slope, no visible seam into the undistorted middle), t = 1 at the screen
// edge, where the bend is strongest.
function sag(t) {
  const c = Math.min(Math.max(t, 0), 1);
  return 1 - Math.sqrt(1 - c * c);
}

const SIDES = {
  left: { vertical: false, outerAtStart: true },
  right: { vertical: false, outerAtStart: false },
  top: { vertical: true, outerAtStart: true },
  bottom: { vertical: true, outerAtStart: false },
};

// Encodes the bend as a 1px strip for feDisplacementMap, running across the
// band. Red carries the horizontal shift and green the vertical one (0.5 =
// none); the channel that doesn't apply stays at 0.5.
function buildMap(side, band, depth) {
  const { vertical, outerAtStart } = SIDES[side];
  const canvas = document.createElement("canvas");
  canvas.width = vertical ? 1 : MAP_STEPS;
  canvas.height = vertical ? MAP_STEPS : 1;
  const g = canvas.getContext("2d");
  const data = g.createImageData(canvas.width, canvas.height);

  for (let i = 0; i < MAP_STEPS; i++) {
    const p = ((i + 0.5) / MAP_STEPS) * depth; // px from the element's start
    // Distance into the band from its inner edge, 0..1.
    const t = outerAtStart ? (band - p) / band : (p - (depth - band)) / band;
    const bend = t > 0 ? sag(t) : 0;
    // Sample toward the middle of the screen, which is what makes the rim
    // fold the neighbouring content back on itself.
    const value = outerAtStart ? 0.5 + bend / 2 : 0.5 - bend / 2;
    // "No shift" has no exact 8-bit value: 128 is a hair over 0.5, 127 a
    // hair under, so every channel still moves a fraction of a pixel. At the
    // band's inner edge that fraction pointed out of the element, the last
    // row sampled empty backdrop, and the unequal channel scales left a thin
    // blue line across the screen. Round the flat zone toward the inside.
    const byte = bend > 0 ? Math.round(value * 255) : outerAtStart ? 127 : 128;
    const o = i * 4;
    data.data[o] = vertical ? 127 : byte;
    data.data[o + 1] = vertical ? byte : 127;
    data.data[o + 2] = 128;
    data.data[o + 3] = 255;
  }

  g.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// One filter per side. Each colour channel is displaced by a slightly
// different amount and the three are added back together, real glass bends
// wavelengths unequally, so the fringes appear only where the bend is.
function buildFilter(id) {
  const filter = el("filter", {
    id,
    x: "0",
    y: "0",
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const image = el("feImage", { preserveAspectRatio: "none", result: "map" });
  filter.appendChild(image);

  const channels = [
    ["r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", 1 + CHROMA],
    ["g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", 1],
    ["b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", 1 - CHROMA],
  ];
  const displacements = channels.map(([name, matrix, amount]) => {
    filter.appendChild(el("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: matrix, result: `c-${name}` }));
    const d = el("feDisplacementMap", {
      in: `c-${name}`,
      in2: "map",
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: `d-${name}`,
    });
    d.dataset.amount = amount;
    filter.appendChild(d);
    return d;
  });
  // Screen over disjoint channels is plain addition.
  filter.appendChild(el("feBlend", { in: "d-r", in2: "d-g", mode: "screen", result: "rg" }));
  filter.appendChild(el("feBlend", { in: "rg", in2: "d-b", mode: "screen" }));

  return { filter, image, displacements };
}

export function initLens(root) {
  if (!root) return;

  const svg = el("svg", { class: "lens-defs", "aria-hidden": "true", focusable: "false" });
  const defs = el("defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);

  const sides = Object.keys(SIDES).map((side) => {
    const strip = document.createElement("span");
    strip.className = `field-lens__band field-lens__band--${side}`;
    strip.style.backdropFilter = `url("#lens-${side}")`;
    strip.style.webkitBackdropFilter = `url("#lens-${side}")`;
    root.appendChild(strip);
    const built = buildFilter(`lens-${side}`);
    defs.appendChild(built.filter);
    return { side, strip, ...built };
  });

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    sides.forEach(({ side, strip, filter, image, displacements }) => {
      const { vertical } = SIDES[side];
      const band = Math.round((vertical ? h : w) * BAND);
      // The red channel reaches past the band's inner edge at the rim, and a
      // backdrop can only be sampled inside its own element, so the element
      // is a little deeper than the lens itself.
      const depth = Math.ceil(band * (1 + CHROMA)) + 4;
      const width = vertical ? w + OVERHANG * 2 : depth;
      const height = vertical ? depth : h + OVERHANG * 2;

      strip.style.width = `${width}px`;
      strip.style.height = `${height}px`;
      if (vertical) strip.style.left = `${-OVERHANG}px`;
      else strip.style.top = `${-OVERHANG}px`;
      filter.setAttribute("width", width);
      filter.setAttribute("height", height);
      image.setAttribute("x", 0);
      image.setAttribute("y", 0);
      image.setAttribute("width", width);
      image.setAttribute("height", height);
      image.setAttribute("href", buildMap(side, band, depth));
      // A map value of 1 means "shift by scale/2", and the map encodes a
      // full-band bend as 1, so the scale is twice the band.
      displacements.forEach((d) => d.setAttribute("scale", (2 * band * Number(d.dataset.amount)).toFixed(2)));
    });
  }

  layout();
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(layout, 150);
  });
}
