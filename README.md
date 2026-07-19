# 9th.js

A WebGL 3D library for the web, inspired by Three.js.

[![npm](https://img.shields.io/npm/v/9th.js.svg)](https://www.npmjs.com/package/9th.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/syedrazaalino/9th.js/blob/master/LICENSE)

Build interactive 3D scenes with a familiar scene-graph API (`Scene`, `Mesh`, `PerspectiveCamera`, lights, materials). Core rendering works today; advanced modules (physics, particles, post-FX) are experimental.

## Install

```bash
npm install 9th.js
```

```bash
yarn add 9th.js
# or
pnpm add 9th.js
```

## Hello cube (ESM)

```js
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh
} from '9th.js';

const canvas = document.querySelector('#canvas');
const renderer = new WebGLRenderer({ canvas, antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const cube = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshBasicMaterial({ color: '#4fc3f7' })
);
scene.add(cube);

function frame() {
  requestAnimationFrame(frame);
  cube.rotation.y += 0.01;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
frame();
```

## Lit cube + OrbitControls

```js
import {
  WebGLRenderer, Scene, PerspectiveCamera,
  BoxGeometry, MeshStandardMaterial, Mesh,
  AmbientLight, DirectionalLight, OrbitControls
} from '9th.js';

const canvas = document.querySelector('#canvas');
const renderer = new WebGLRenderer({ canvas, antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(2, 2, 4);

scene.add(new AmbientLight(0xffffff, 0.35));
const sun = new DirectionalLight(0xffffff, 1.2);
sun.position.set(3, 5, 2);
scene.add(sun);

const cube = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: '#4fc3f7', metalness: 0.2, roughness: 0.4 })
);
scene.add(cube);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;

function frame() {
  requestAnimationFrame(frame);
  cube.rotation.y += 0.01;
  controls.update();
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
frame();
```

## CDN (UMD)

```html
<script src="https://unpkg.com/9th.js@1.0.3/dist/umd/9th.umd.min.js"></script>
<script>
  // Global name depends on build — prefer ESM for apps
</script>
```

Or via jsDelivr: `https://cdn.jsdelivr.net/npm/9th.js@1.0.3/dist/umd/9th.umd.min.js`

## What’s included

| Area | Status |
|------|--------|
| Scene graph, cameras, primitives → `BufferGeometry` | Working |
| `MeshBasicMaterial` / `MeshStandardMaterial` + lights | Working (lit path) |
| `OrbitControls` | Working |
| `Engine` helper | Working |
| Loaders (GLTF, OBJ, …) | Improving — GLTF scene wiring fixed in 1.0.3 |
| Post-processing / particles / physics | Experimental |

Not a drop-in Three.js replacement yet. See the [roadmap](https://github.com/syedrazaalino/9th.js/blob/master/ROADMAP.md) and [migration notes](https://github.com/syedrazaalino/9th.js/blob/master/docs/api/migration-guide-from-threejs.md).

## Examples & source

- Repo: [github.com/syedrazaalino/9th.js](https://github.com/syedrazaalino/9th.js)
- Hello cube: [examples/hello-cube.html](https://github.com/syedrazaalino/9th.js/blob/master/examples/hello-cube.html)
- Lit + orbit: [examples/lit-cube.html](https://github.com/syedrazaalino/9th.js/blob/master/examples/lit-cube.html)

## License

MIT — [digitalcloud](https://digitalcloud.no)
