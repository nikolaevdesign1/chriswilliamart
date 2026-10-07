// Procedurally synthesised audio, no asset files. The ambient bed and every
// interaction sound are built from oscillators and noise, so the whole
// soundtrack costs a few hundred bytes of JS instead of megabytes of MP3.

const STORAGE_KEY = "cw-sound-muted";

// Two open voicings, fifths and ninths, no thirds, that the pad drifts
// between. Deliberately unresolved, so it reads as room tone rather than as
// music you start following. Pitched an octave and more above the old bed:
// the low drone read as heavy; up here it sits as light air in the room.
const VOICINGS = [
  [220.0, 329.63, 493.88, 659.25],
  [196.0, 293.66, 440.0, 587.33],
];

const VOICE_SHAPE = [
  { type: "sine", gain: 0.42, lfo: 0.037 },
  { type: "sine", gain: 0.3, lfo: 0.051 },
  { type: "sine", gain: 0.16, lfo: 0.029 },
  { type: "sine", gain: 0.08, lfo: 0.043 },
];

const PAD_LEVEL = 0.09;
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

// Sound is on by default on every visit. Muting only lasts for the current
// tab: it used to live in localStorage, so a single click on the toggle kept
// the site silent on every later visit too.
function readMuted() {
  try {
    localStorage.removeItem(STORAGE_KEY); // drop the old, permanent setting
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(value) {
  try {
    sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* private mode, the preference just won't persist */
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
  filter.frequency.value = 1500;
  filter.Q.value = 0.3;
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

  // A barely-there layer of filtered noise, the "air" of a large room. It
  // keeps the pad from sounding like four bare oscillators.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(3);
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 2400;
  airFilter.Q.value = 0.5;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.035;
  const airLfo = ctx.createOscillator();
  airLfo.frequency.value = 0.021;
  const airLfoDepth = ctx.createGain();
  airLfoDepth.gain.value = 0.02;
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

/** Main interaction sound: a soft, short tap, felt more than heard. */
export function playClick() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.16, 0.003, 0.1);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const f0 = jitter(1150);
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.62, now + 0.07);
  osc.connect(gain);
  osc.start(now);
  osc.stop(end);
}

/** Hover tick, a faint glint that sits well under the click. */
export function playHover() {
  if (!canPlay()) return;
  const { gain, now, end } = envelope(0.04, 0.002, 0.04);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(jitter(2600, 0.06), now);
  osc.connect(gain);
  osc.start(now);
  osc.stop(end);
}

// A small bell: two sines a fifth apart with a slow tail.
function chime(freqs, peak, release) {
  const { gain, now, end } = envelope(peak, 0.012, release);
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 1 : 0.5;
    osc.connect(g);
    g.connect(gain);
    osc.start(now + i * 0.06);
    osc.stop(end);
  });
}

/** Opening a work: a soft rising two-note chime. */
export function playOpen() {
  if (!canPlay()) return;
  chime([659.25, 987.77], 0.11, 0.9);
}

/** Going back: the same chime, falling. */
export function playClose() {
  if (!canPlay()) return;
  chime([987.77, 659.25], 0.09, 0.7);
}

function syncToggle() {
  if (!toggleEl) return;
  toggleEl.classList.toggle("is-muted", muted);
  // Sound is on but the browser hasn't let it start yet: the meter must not
  // claim audio is playing while the room is silent.
  toggleEl.classList.toggle("is-waiting", !muted && (!ctx || ctx.state !== "running"));
  toggleEl.setAttribute("aria-pressed", muted ? "true" : "false");
  toggleEl.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
}

let suspendTimer = null;

function setMuted(next) {
  muted = next;
  writeMuted(muted);
  syncToggle();
  clearTimeout(suspendTimer);
  if (muted) {
    fadePad(0, 0.4);
    // After the fade, stop the audio engine outright. A gain of zero should
    // already be silent, but suspending guarantees nothing at all keeps
    // playing, the pad, its air layer, a click still ringing out.
    suspendTimer = setTimeout(() => {
      if (muted && ctx && ctx.state === "running") ctx.suspend();
    }, 450);
  } else {
    ensureContext(); // resumes a suspended context
    buildPad();
    fadePad(PAD_LEVEL, 2.2);
  }
}

// Sound starts at once wherever the browser allows it. Most block audio
// until the visitor's first real gesture (click, tap, key), scrolling and
// mouse movement don't count, so the pad is built and asked to play on load,
// and every kind of gesture retries until it actually runs.
const GESTURES = ["pointerdown", "mousedown", "touchstart", "touchend", "keydown", "click"];

function tryStart() {
  if (muted || !ctx) return;
  if (ctx.state !== "running") ctx.resume().catch(() => {});
}

function startNow() {
  if (muted) return;
  if (!ensureContext()) return;
  buildPad();
  ctx.onstatechange = () => {
    syncToggle();
    if (ctx.state === "running" && !started && !muted) {
      started = true;
      fadePad(PAD_LEVEL, 3);
      GESTURES.forEach((type) => window.removeEventListener(type, tryStart, true));
    }
  };
  ctx.onstatechange();
  GESTURES.forEach((type) => window.addEventListener(type, tryStart, true));
}

const CLICKABLE = "a, button, .field-tile, .list-panel__row, .list-tile, .m-work";

export function initSound() {
  muted = readMuted();
  toggleEl = document.querySelector("[data-sound-toggle]");
  syncToggle();

  toggleEl?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    // "On" but still blocked by the browser: the visitor is pressing it to
    // hear something, so this click starts the sound. Toggling here used to
    // mute it at the very moment the browser finally allowed audio.
    if (!muted && ctx?.state !== "running") {
      startNow();
      tryStart();
      return;
    }
    setMuted(!muted);
    if (!muted) startNow();
  });

  startNow();

  // Delegated rather than wired per control. The sound toggle is excluded , 
  // it has its own feedback: the meter starting or freezing.
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-sound-toggle]")) return;
    if (event.target.closest(CLICKABLE)) playClick();
  });

  document.addEventListener("mouseover", (event) => {
    if (event.target.closest("[data-sound-toggle]")) return;
    const hit = event.target.closest(CLICKABLE);
    // `mouseover` bubbles from children too, only sound the first entry into
    // a given control, not every internal element it passes over.
    if (hit && !hit.contains(event.relatedTarget)) playHover();
  });
}
