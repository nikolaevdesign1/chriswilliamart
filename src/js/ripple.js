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
  varying vec2 vUv;

  void main() {
    vec2 dir = vUv - uMouse;
    float dist = length(dir);
    float ripple = sin(dist * 40.0 - uTime * 6.0) * 0.015 * uHover * smoothstep(0.55, 0.0, dist);
    vec2 uv = vUv + normalize(dir + 0.0001) * ripple;

    float r = texture2D(uTexture, uv + normalize(dir + 0.0001) * ripple * 0.4).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - normalize(dir + 0.0001) * ripple * 0.4).b;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

let renderer, scene, camera, mesh, canvas;
let textureCache = new Map();
let activeTile = null;
let clock = new THREE.Clock();
let rafId = null;

function loadTexture(src) {
  if (textureCache.has(src)) return textureCache.get(src);
  const texture = new THREE.TextureLoader().load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(src, texture);
  return texture;
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

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
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
    mesh.material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
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
}

function restoreImage(tile) {
  const img = tile?.querySelector("img");
  if (img) img.style.opacity = "1";
}

export function showRipple(tile, imageSrc) {
  if (activeTile && activeTile !== tile) {
    gsap.killTweensOf(mesh.material.uniforms.uHover);
    restoreImage(activeTile);
  }

  const img = tile.querySelector("img");
  if (img) img.style.opacity = "0";

  const rect = tile.getBoundingClientRect();
  mesh.material.uniforms.uTexture.value = loadTexture(imageSrc);
  placeMesh(rect);
  mesh.visible = true;
  activeTile = tile;

  gsap.to(mesh.material.uniforms.uHover, { value: 1, duration: 0.5, ease: "power2.out" });
}

export function moveRipple(tile, event) {
  if (tile !== activeTile) return;
  const rect = tile.getBoundingClientRect();
  placeMesh(rect);
  const u = (event.clientX - rect.left) / rect.width;
  const v = 1 - (event.clientY - rect.top) / rect.height;
  mesh.material.uniforms.uMouse.value.set(u, v);
}

export function hideRipple(tile) {
  if (tile !== activeTile) return;
  gsap.to(mesh.material.uniforms.uHover, {
    value: 0,
    duration: 0.4,
    ease: "power2.out",
    onComplete: () => {
      if (activeTile === tile) {
        restoreImage(tile);
        mesh.visible = false;
        activeTile = null;
      }
    },
  });
}

export function revealTransition(tile, imageSrc, target, onDone) {
  const rect = tile.getBoundingClientRect();
  mesh.material.uniforms.uTexture.value = loadTexture(imageSrc);
  placeMesh(rect);
  mesh.visible = true;
  activeTile = tile;

  const proxy = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  const tl = gsap.timeline({
    onComplete: () => {
      onDone?.();
      mesh.visible = false;
      activeTile = null;
      mesh.material.uniforms.uHover.value = 0;
    },
  });

  tl.to(mesh.material.uniforms.uHover, { value: 1.6, duration: 0.35, ease: "power1.out" }, 0);
  tl.to(
    proxy,
    {
      left: target.left,
      top: target.top,
      width: target.width,
      height: target.height,
      duration: 0.7,
      ease: "power3.inOut",
      onUpdate: () => placeMesh(proxy),
    },
    0
  );
  tl.to(mesh.material.uniforms.uHover, { value: 0, duration: 0.35, ease: "power2.in" }, 0.35);
}

export function ripplePlaneRect() {
  return activeTile ? activeTile.getBoundingClientRect() : null;
}
