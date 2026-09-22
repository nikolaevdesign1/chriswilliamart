// Procedurally synthesised audio — no asset files. The ambient bed and every
// interaction sound are built from oscillators and noise, so the whole
// soundtrack costs a few hundred bytes of JS instead of megabytes of MP3.

const STORAGE_KEY = "cw-sound-muted";

// Two open voicings — fifths and ninths, no thirds — that the pad drifts
// between. Deliberately unresolved, so it reads as room tone rather than as
// music you start following.
const VOICINGS = [
  [73.42, 110.0, 164.81, 246.94],
  [65.41, 98.0, 146.83, 220.0],
];

const VOICE_SHAPE = [
  { type: "sine", gain: 0.55, lfo: 0.037 },
  { type: "sine", gain: 0.38, lfo: 0.051 },
  { type: "triangle", gain: 0.13, lfo: 0.029 },
  { type: "sine", gain: 0.07, lfo: 0.043 },
];

const PAD_LEVEL = 0.16;
const CHORD_HOLD = 26;
const CHORD_GLIDE = 9;

let ctx = null;
let padBus = null;
let oscillators = [];
let chordIndex = 0;
let chordTimer = null;
let started = false;
let muted = false;
let toggleEl = null;

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* private mode — the preference just won't persist */
  }
}

function ensureContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// A short burst of noise, reused for both the air layer and click transients.
function noiseBuffer(seconds = 2) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function buildPad() {
  if (padBus || !ctx) return;

  padBus = ctx.createGain();
  padBus.gain.value = 0;
  padBus.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 520;
  filter.Q.value = 0.4;
  filter.connect(padBus);

  VOICE_SHAPE.forEach((shape, i) => {
    const osc = ctx.createOscillator();
    osc.type = shape.type;
    osc.frequency.value = VOICINGS[0][i];
    // A few cents off so the voices beat slowly against each other rather
    // than sitting perfectly still.
    osc.detune.value = (Math.random() - 0.5) * 14;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = shape.gain;

    // Each voice breathes on its own slow cycle, so the texture keeps
    // shifting without ever arriving anywhere.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = shape.lfo;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = shape.gain * 0.45;
    lfo.connect(lfoDepth);
    lfoDepth.connect(voiceGain.gain);

    osc.connect(voiceGain);
    voiceGain.connect(filter);
    osc.start();
    lfo.start();
    oscillators.push(osc);
  });

  // A barely-there layer of filtered noise — the "air" of a large room. It
  // keeps the pad from sounding like four bare oscillators.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(3);
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "lowpass";
  airFilter.frequency.value = 380;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.05;
  const airLfo = ctx.createOscillator();
  airLfo.frequency.value = 0.021;
  const airLfoDepth = ctx.createGain();
  airLfoDepth.gain.value = 0.03;
  airLfo.connect(airLfoDepth);
  airLfoDepth.connect(airGain.gain);
  air.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(padBus);
  air.start();
  airLfo.start();

  scheduleChordDrift();
}

// Glide between the two voicings on a long cycle, so the bed evolves over
// minutes instead of looping audibly.
function scheduleChordDrift() {
  clearInterval(chordTimer);
  chordTimer = setInterval(() => {
    if (!ctx || muted) return;
    chordIndex = (chordIndex + 1) % VOICINGS.length;
    const chord = VOICINGS[chordIndex];
    oscillators.forEach((osc, i) => {
      osc.frequency.setTargetAtTime(chord[i], ctx.currentTime, CHORD_GLIDE / 3);
    });
  }, CHORD_HOLD * 1000);
}

function fadePad(to, seconds = 1.6) {
  if (!padBus || !ctx) return;
  const now = ctx.currentTime;
  padBus.gain.cancelScheduledValues(now);
  padBus.gain.setValueAtTime(padBus.gain.value, now);
  padBus.gain.linearRampToValueAtTime(to, now + seconds);
}

function canPlay() {
  return !muted && ctx && ctx.state === "running";
}

function envelope(peak, attack, release) {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
  gain.connect(ctx.destination);
  return { gain, now, end: now + attack + release };
}

// A little pitch jitter on every hit, so a run of clicks never sounds like
// the same sample fired twice.
const jitter = (freq, amount = 0.04) => freq * (1 + (Math.random() - 0.5) * 2 * amount);

/** Main interaction sound: a warm wooden tick with a fast downward bend. */
export function playClick() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.13, 0.004, 0.19);

  const body = ctx.createOscillator();
  body.type = "triangle";
  const f0 = jitter(430);
  body.frequency.setValueAtTime(f0, now);
  body.frequency.exponentialRampToValueAtTime(f0 * 0.42, now + 0.13);

  const ring = ctx.createOscillator();
  ring.type = "sine";
  ring.frequency.setValueAtTime(f0 * 2.02, now);
  const ringGain = ctx.createGain();
  ringGain.gain.value = 0.3;
  ring.connect(ringGain);
  ringGain.connect(gain);

  // A short noise transient gives the attack a physical edge.
  const tap = ctx.createBufferSource();
  tap.buffer = noiseBuffer(0.05);
  const tapFilter = ctx.createBiquadFilter();
  tapFilter.type = "bandpass";
  tapFilter.frequency.value = 1900;
  const tapGain = ctx.createGain();
  tapGain.gain.setValueAtTime(0.5, now);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  tap.connect(tapFilter);
  tapFilter.connect(tapGain);
  tapGain.connect(gain);

  body.connect(gain);
  body.start(now);
  ring.start(now);
  tap.start(now);
  body.stop(end);
  ring.stop(end);
}

/** Hover tick — quieter and higher, meant to sit under the click. */
export function playHover() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.022, 0.003, 0.06);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(jitter(2100, 0.06), now);
  osc.connect(gain);
  osc.start(now);
  osc.stop(end);
}

/** Opening a work: a soft upward swell. */
export function playOpen() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.07, 0.05, 0.42);
  [1, 1.5].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300 * mult, now);
    osc.frequency.exponentialRampToValueAtTime(620 * mult, now + 0.34);
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 1 : 0.35;
    osc.connect(g);
    g.connect(gain);
    osc.start(now);
    osc.stop(end);
  });
}

/** Going back: the swell inverted. */
export function playClose() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.06, 0.03, 0.34);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.3);
  osc.connect(gain);
  osc.start(now);
  osc.stop(end);
}

function syncToggle() {
  if (!toggleEl) return;
  toggleEl.classList.toggle("is-muted", muted);
  toggleEl.setAttribute("aria-pressed", muted ? "true" : "false");
  toggleEl.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
}

function setMuted(next) {
  muted = next;
  writeMuted(muted);
  syncToggle();
  if (muted) {
    fadePad(0, 0.6);
  } else {
    ensureContext();
    buildPad();
    fadePad(PAD_LEVEL, 2.2);
  }
}

// Browsers refuse to start audio before a real gesture, so the pad waits for
// the first interaction rather than trying (and failing) on load.
function startOnFirstGesture() {
  if (started) return;
  started = true;
  if (muted) return;
  ensureContext();
  buildPad();
  fadePad(PAD_LEVEL, 3);
}

const CLICKABLE = "a, button, .field-tile, .list-panel__row, .list-tile, .mobile-hall__tile";

export function initSound() {
  muted = readMuted();
  toggleEl = document.querySelector("[data-sound-toggle]");
  syncToggle();

  toggleEl?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    started = true;
    setMuted(!muted);
  });

  window.addEventListener("pointerdown", startOnFirstGesture, { once: true });

  // Delegated rather than wired per control. The sound toggle is excluded —
  // it has its own feedback: the meter starting or freezing.
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-sound-toggle]")) return;
    if (event.target.closest(CLICKABLE)) playClick();
  });

  document.addEventListener("mouseover", (event) => {
    if (event.target.closest("[data-sound-toggle]")) return;
    const hit = event.target.closest(CLICKABLE);
    // `mouseover` bubbles from children too — only sound the first entry into
    // a given control, not every internal element it passes over.
    if (hit && !hit.contains(event.relatedTarget)) playHover();
  });
}
