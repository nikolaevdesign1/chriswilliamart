import * as THREE from "three";
import gsap from "gsap";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uTexSize;
  uniform vec2 uPlaneSize;
  varying vec2 vUv;

  // Maps the plane's 0..1 UV onto a centered, cropped window of the texture,
  // matching CSS object-fit:cover instead of stretching the whole image.
  vec2 coverUv(vec2 uv) {
    float texAspect = uTexSize.x / uTexSize.y;
    float planeAspect = uPlaneSize.x / uPlaneSize.y;
    vec2 scale = vec2(1.0);
    if (texAspect > planeAspect) {
      scale.x = planeAspect / texAspect;
    } else {
      scale.y = texAspect / planeAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 dir = vUv - uMouse;
    float dist = length(dir);
    float ripple = sin(dist * 40.0 - uTime * 6.0) * 0.015 * uHover * smoothstep(0.55, 0.0, dist);
    vec2 rippleDir = normalize(dir + 0.0001);

    float r = texture2D(uTexture, coverUv(vUv + rippleDir * ripple * 1.4)).r;
    float g = texture2D(uTexture, coverUv(vUv + rippleDir * ripple)).g;
    float b = texture2D(uTexture, coverUv(vUv + rippleDir * ripple * 0.6)).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

let renderer, scene, camera, mesh, canvas;
let textureCache = new Map();
let activeTile = null;
// What the pointer is on *right now*. Tracked separately from activeTile,
// which lags behind during the fade-out — a texture finishing mid-fade must
// not resurrect a plane the pointer has already left.
let hoverIntent = null;
let followTile = false;
let needsClear = false;
let clock = new THREE.Clock();
let rafId = null;

// A field tile is bigger than its picture now — it also carries the caption
// underneath. The ripple plane has to track the picture, not the whole tile.
function frameOf(tile) {
  return tile.querySelector("[data-ripple-frame]") || tile;
}

// Each entry tracks whether its texture has actually decoded yet. The DOM
// <img> being complete says nothing about this: TextureLoader runs its own
// load, so the texture can still be empty on a tile that looks fully painted.
function loadTexture(src) {
  const existing = textureCache.get(src);
  if (existing) return existing;

  const record = { texture: null, ready: false, waiting: [] };
  textureCache.set(src, record);

  record.texture = new THREE.TextureLoader().load(src, () => {
    record.ready = true;
    record.waiting.splice(0).forEach((fn) => fn());
  });
  record.texture.generateMipmaps = false;
  record.texture.minFilter = THREE.LinearFilter;
  record.texture.magFilter = THREE.LinearFilter;
  return record;
}

function whenReady(record, fn) {
  if (record.ready) fn();
  else record.waiting.push(fn);
}

function setTexture(texture) {
  mesh.material.uniforms.uTexture.value = texture;
  if (texture.image?.naturalWidth) {
    mesh.material.uniforms.uTexSize.value.set(texture.image.naturalWidth, texture.image.naturalHeight);
  }
}

function setCameraSize(w, h) {
  camera.left = 0;
  camera.right = w;
  camera.top = h;
  camera.bottom = 0;
  camera.updateProjectionMatrix();
}

export function initRipple() {
  canvas = document.createElement("canvas");
  canvas.className = "ripple-canvas";
  document.body.appendChild(canvas);

  // No antialiasing: the plane is an axis-aligned rectangle, so MSAA buys
  // nothing visually and costs a full-screen resolve every frame.
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, 0.1, 1000);
  camera.position.z = 10;

  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTexture: { value: null },
      uHover: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTexSize: { value: new THREE.Vector2(1, 1) },
      uPlaneSize: { value: new THREE.Vector2(1, 1) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    setCameraSize(window.innerWidth, window.innerHeight);
  });

  const loop = () => {
    // Nothing is hovering: skip the draw entirely rather than re-rendering an
    // empty full-screen scene 60 times a second. One extra pass after the
    // mesh goes away clears whatever frame was left on the canvas.
    if (mesh.visible || needsClear) {
      mesh.material.uniforms.uTime.value = clock.getElapsedTime();
      // Keep the plane glued to its tile every frame — during a field pan
      // the tile keeps moving but stops sending it mousemove events (they
      // get redirected once pointer capture kicks in), so relying on
      // mousemove alone lets the plane drift away from the tile underneath.
      if (followTile && mesh.visible && activeTile && activeTile.isConnected) {
        placeMesh(frameOf(activeTile).getBoundingClientRect());
      }
      renderer.render(scene, camera);
      needsClear = mesh.visible;
    }
    rafId = requestAnimationFrame(loop);
  };
  loop();
}

function placeMesh(rect) {
  // The camera uses the standard top>bottom convention (world Y grows upward),
  // so DOM Y (grows downward) has to be flipped when placing the mesh.
  const centerY = window.innerHeight - (rect.top + rect.height / 2);
  mesh.position.set(rect.left + rect.width / 2, centerY, 0);
  mesh.scale.set(rect.width, rect.height, 1);
  mesh.material.uniforms.uPlaneSize.value.set(rect.width, rect.height);
}

export function showRipple(tile, imageSrc) {
  if (activeTile && activeTile !== tile) {
    gsap.killTweensOf(mesh.material.uniforms.uHover);
  }

  hoverIntent = tile;
  activeTile = tile;
  followTile = true;

  const record = loadTexture(imageSrc);

  // Showing the plane before its texture has decoded paints a solid black
  // rectangle over the artwork: the shader samples an unbound texture as
  // (0,0,0) and forces alpha to 1. So wait for the pixels. At uHover 0 the
  // plane is identical to the <img> underneath anyway, so deferring it by a
  // few frames is invisible — whereas showing it early is not.
  whenReady(record, () => {
    if (hoverIntent !== tile) return; // pointer already moved on
    setTexture(record.texture);
    placeMesh(frameOf(tile).getBoundingClientRect());
    mesh.visible = true;
    gsap.to(mesh.material.uniforms.uHover, { value: 1, duration: 0.5, ease: "power2.out" });
  });
}

export function moveRipple(tile, event) {
  if (tile !== activeTile) return;
  const rect = frameOf(tile).getBoundingClientRect();
  placeMesh(rect);
  const u = (event.clientX - rect.left) / rect.width;
  const v = 1 - (event.clientY - rect.top) / rect.height;
  mesh.material.uniforms.uMouse.value.set(u, v);
}

export function hideRipple(tile) {
  if (tile !== activeTile) return;
  if (hoverIntent === tile) hoverIntent = null;
  gsap.to(mesh.material.uniforms.uHover, {
    value: 0,
    duration: 0.4,
    ease: "power2.out",
    onComplete: () => {
      if (activeTile === tile) {
        mesh.visible = false;
        activeTile = null;
        followTile = false;
      }
    },
  });
}
