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

// Only Chromium renders an SVG filter inside backdrop-filter. Safari and
// Firefox accept the property and draw nothing, so there the same bend is
// applied as an ordinary filter on the field itself.
const backdropLens = () => Boolean(navigator.userAgentData);

export function initLens(root, field) {
  if (!root) return;

  const svg = el("svg", { class: "lens-defs", "aria-hidden": "true", focusable: "false" });
  const defs = el("defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);

  const layout = backdropLens() ? backdropBands(root, defs) : fieldFilter(field, defs);
  if (!layout) return;

  layout();
  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(layout, 150);
  });
}

// Each band's size: the lens itself, and the deeper strip it samples from.
// The red channel reaches past the band's inner edge at the rim, so the
// sampled strip is a little deeper than the lens.
function bandSize(side, w, h) {
  const band = Math.round((SIDES[side].vertical ? h : w) * BAND);
  return { band, depth: Math.ceil(band * (1 + CHROMA)) + 4 };
}

// A map value of 1 means "shift by scale/2", and the map encodes a
// full-band bend as 1, so the scale is twice the band.
function setScales(displacements, band) {
  displacements.forEach((d) => d.setAttribute("scale", (2 * band * Number(d.dataset.amount)).toFixed(2)));
}

// Chromium: four fixed strips over the edges, each bending what lies
// behind it. Being on top, they bend the hover ripple canvas too.
function backdropBands(root, defs) {
  const sides = Object.keys(SIDES).map((side) => {
    const strip = document.createElement("span");
    strip.className = `field-lens__band field-lens__band--${side}`;
    strip.style.backdropFilter = `url("#lens-${side}")`;
    root.appendChild(strip);
    const built = buildFilter(`lens-${side}`);
    defs.appendChild(built.filter);
    return { side, strip, ...built };
  });

  return () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    sides.forEach(({ side, strip, filter, image, displacements }) => {
      const { vertical } = SIDES[side];
      const { band, depth } = bandSize(side, w, h);
      // A backdrop can only be sampled inside its own element.
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
      setScales(displacements, band);
    });
  };
}

// Safari and Firefox: one filter on the field, in which every primitive is
// confined to its band's rectangle, so the middle of the screen is passed
// through untouched and only the edges are worked on. Sides are drawn
// left, right, then top and bottom over them, as the strips stack in
// Chromium.
function fieldFilter(field, defs) {
  if (!field) return null;

  const filter = el("filter", {
    id: "lens-field",
    x: "0",
    y: "0",
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const merge = el("feMerge");
  merge.appendChild(el("feMergeNode", { in: "SourceGraphic" }));

  const sides = Object.keys(SIDES).map((side) => {
    const image = el("feImage", { preserveAspectRatio: "none", result: `map-${side}` });
    filter.appendChild(image);
    const channels = [
      ["r", "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", 1 + CHROMA],
      ["g", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", 1],
      ["b", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", 1 - CHROMA],
    ];
    const primitives = [image];
    const displacements = channels.map(([name, matrix, amount]) => {
      const m = el("feColorMatrix", { in: "SourceGraphic", type: "matrix", values: matrix, result: `${side}-c-${name}` });
      const d = el("feDisplacementMap", {
        in: `${side}-c-${name}`,
        in2: `map-${side}`,
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: `${side}-d-${name}`,
      });
      d.dataset.amount = amount;
      filter.append(m, d);
      primitives.push(m, d);
      return d;
    });
    const rg = el("feBlend", { in: `${side}-d-r`, in2: `${side}-d-g`, mode: "screen", result: `${side}-rg` });
    const rgb = el("feBlend", { in: `${side}-rg`, in2: `${side}-d-b`, mode: "screen", result: `${side}-out` });
    filter.append(rg, rgb);
    primitives.push(rg, rgb);
    merge.appendChild(el("feMergeNode", { in: `${side}-out` }));
    return { side, image, primitives, displacements };
  });

  filter.appendChild(merge);
  defs.appendChild(filter);
  field.style.filter = 'url("#lens-field")';

  return () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    filter.setAttribute("width", w);
    filter.setAttribute("height", h);

    sides.forEach(({ side, image, primitives, displacements }) => {
      const { vertical, outerAtStart } = SIDES[side];
      const { band, depth } = bandSize(side, w, h);
      // The band's rectangle, held 2px short of the screen corners along its
      // length: the "no shift" map value is a hair off centre, and at the
      // very ends that hair sampled past the field, the thin coloured curl
      // the strips avoid by overhanging. The crossing band covers the gap.
      const rect = vertical
        ? { x: 2, y: outerAtStart ? 0 : h - depth, width: w - 4, height: depth }
        : { x: outerAtStart ? 0 : w - depth, y: 2, width: depth, height: h - 4 };
      primitives.forEach((p) => Object.entries(rect).forEach(([k, v]) => p.setAttribute(k, v)));
      image.setAttribute("href", buildMap(side, band, depth));
      setScales(displacements, band);
    });
  };
}
