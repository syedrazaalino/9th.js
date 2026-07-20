# 9th.js

A WebGL library for building interactive 3D scenes in the browser.

[![npm](https://img.shields.io/npm/v/9th.js.svg)](https://www.npmjs.com/package/9th.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/syedrazaalino/9th.js/blob/master/LICENSE)

**9th.js** gives you a scene graph, cameras, meshes, lights, materials, loaders, and controls — so you can render 3D content with a clear, object-oriented API and ship it to the web.

Maintained by [digitalcloud](https://digitalcloud.no).

## Features

- **Scene graph** — `Scene`, `Object3D`, `Mesh`, hierarchy, transforms (Euler + quaternion)
- **Cameras** — perspective and orthographic
- **Geometry** — box, sphere, plane, and more → `BufferGeometry`
- **Materials** — unlit and PBR (`MeshBasicMaterial`, `MeshStandardMaterial`, and related)
- **Lights** — ambient, directional, point, spot
- **Picking** — `Raycaster` + `Mesh.raycast`
- **Instancing** — `InstancedMesh` for batched draws
- **Render targets** — offscreen `RenderTarget` + composer-friendly renderer APIs
- **Extras** — post-processing passes, tween helpers, game-loop utilities (experimental WebGPU preview)
- **Controls** — `OrbitControls` for explore / inspect UIs
- **Loaders** — GLTF, OBJ, and related asset pipelines
- **Engine helper** — optional loop, pause/resume, and performance hooks
- **Builds** — ESM + UMD, TypeScript typings on npm

## Install

```bash
npm install 9th.js
```

```bash
yarn add 9th.js
pnpm add 9th.js
```

## Quick start

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

## Lit scene + orbit

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

scene.add(new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: '#4fc3f7', metalness: 0.2, roughness: 0.4 })
));

const controls = new OrbitControls(camera, canvas);

function frame() {
  requestAnimationFrame(frame);
  controls.update();
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}
frame();
```

## CDN

```html
<script src="https://unpkg.com/9th.js@1.0.6/dist/umd/9th.umd.min.js"></script>
```

Also on jsDelivr: `https://cdn.jsdelivr.net/npm/9th.js@1.0.6/dist/umd/9th.umd.min.js`

## Examples

Live gallery (after `npm run build`, serve the repo root):

**[examples/](https://github.com/syedrazaalino/9th.js/tree/master/examples)** → open `examples/index.html`

### Previews

| Hello cube | Lit + orbit |
|:---:|:---:|
| ![Hello cube](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/hello-cube.png) | ![Lit cube](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/lit-cube.png) |
| Unlit `MeshBasicMaterial` | PBR + lights + `OrbitControls` |

| Primitives | Materials |
|:---:|:---:|
| ![Primitives](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/primitives.png) | ![Materials](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/materials.png) |
| Box, sphere, cylinder, cone | Metalness / roughness row |

| Lights | GLTF |
|:---:|:---:|
| ![Lights](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/lights.png) | ![GLTF](https://raw.githubusercontent.com/syedrazaalino/9th.js/master/media/previews/gltf-triangle.png) |
| Ambient + directional + points | `GLTFLoader` → scene |

```bash
npm run build
npx serve .
# open http://localhost:3000/examples/
```

## Docs & roadmap

- [Getting started](https://github.com/syedrazaalino/9th.js/blob/master/docs/guides/getting-started.md)
- [API overview](https://github.com/syedrazaalino/9th.js/blob/master/docs/api/README.md)
- [Roadmap](https://github.com/syedrazaalino/9th.js/blob/master/ROADMAP.md)
- [Changelog](https://github.com/syedrazaalino/9th.js/blob/master/CHANGELOG.md)

## License

MIT © [digitalcloud](https://digitalcloud.no)
