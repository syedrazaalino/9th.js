# 9th.js

A WebGL 3D library for the web, inspired by Three.js. Version **1.0.0**.

[![npm](https://img.shields.io/npm/v/9th.js.svg)](https://www.npmjs.com/package/9th.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

```bash
npm install 9th.js
```

## Hello cube

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

Open [`examples/hello-cube.html`](examples/hello-cube.html) after `npm run build`.

## What works today

| Area | Status |
|------|--------|
| Scene graph (`Object3D`, `Scene`, `Mesh`) | Working — Three.js-style `position.set`, `add`/`children`, `traverse` |
| Cameras | `PerspectiveCamera`, `OrthographicCamera` |
| Geometries | Box, Sphere, Plane, Cylinder, Cone, Circle → auto-converted to `BufferGeometry` |
| Materials | `MeshBasicMaterial` (unlit), `MeshStandardMaterial` (PBR shaders, lighting uniforms) |
| Lights | Ambient, Directional, Point, Spot |
| Renderer | `WebGLRenderer` / `Renderer` alias, `setSize`, `setPixelRatio`, `render` |
| Controls | `OrbitControls` |
| Loaders | GLTF, OBJ/MTL, STL, PLY, Texture, Draco (use with BufferGeometry meshes) |
| Engine helper | `Engine` — optional canvas + scene + loop wrapper |
| Post-processing / particles / physics | Present as modules; treat as experimental until demos are verified |

This is **not** a drop-in Three.js replacement yet. APIs are converging (see [ROADMAP.md](ROADMAP.md) and [docs/api/migration-guide-from-threejs.md](docs/api/migration-guide-from-threejs.md)).

## Build

```bash
npm install
npm run build
npm run verify-exports
```

## License

MIT — [digitalcloud](https://digitalcloud.no)
