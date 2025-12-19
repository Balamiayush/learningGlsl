import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#canvas');
const scene = new THREE.Scene();

const fov = 75;
const getCameraDistance = () =>
  window.innerHeight / (2 * Math.tan((fov * Math.PI) / 360));

const camera = new THREE.PerspectiveCamera(
  fov,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.z = getCameraDistance();

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

/* ---------------- IMG → PLANE ---------------- */

const imgs = document.querySelectorAll('img');
const planes = [];

imgs.forEach(img => {
  const rect = img.getBoundingClientRect();

  const texture = new THREE.TextureLoader().load(img.src);
  texture.minFilter = THREE.LinearFilter;

  const geometry = new THREE.PlaneGeometry(rect.width, rect.height);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(uTexture, vUv);
      }
    `,
  });

  const plane = new THREE.Mesh(geometry, material);

  /* 🔥 Convert DOM → Three.js coords */
  plane.position.x =
    rect.left + rect.width / 2 - window.innerWidth / 2;

  plane.position.y =
    -(rect.top + rect.height / 2 - window.innerHeight / 2);

  scene.add(plane);
  planes.push({ plane, img });
});

/* ---------------- SYNC ON SCROLL ---------------- */

window.addEventListener('scroll', () => {
  planes.forEach(({ plane, img }) => {
    const rect = img.getBoundingClientRect();

    plane.position.x =
      rect.left + rect.width / 2 - window.innerWidth / 2;

    plane.position.y =
      -(rect.top + rect.height / 2 - window.innerHeight / 2);
  });
});

/* ---------------- RESIZE ---------------- */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.z = getCameraDistance();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- CONTROLS ---------------- */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---------------- RENDER ---------------- */

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
