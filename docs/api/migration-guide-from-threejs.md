# Migrating from Three.js to 9th.js

Verified mappings for **9th.js 1.0.0**. Prefer these over older aspirational docs.

## Quick mapping

| Three.js | 9th.js |
|----------|--------|
| `WebGLRenderer` | `WebGLRenderer` (alias: `Renderer`) |
| `Scene` | `Scene` |
| `PerspectiveCamera` | `PerspectiveCamera` |
| `BoxGeometry` | `BoxGeometry` (auto → BufferGeometry) |
| `MeshBasicMaterial` | `MeshBasicMaterial` |
| `MeshStandardMaterial` | `MeshStandardMaterial` |
| `Mesh` | `Mesh` |
| `AmbientLight` / `DirectionalLight` | Same names; `(color, intensity)` order |
| `OrbitControls` | `OrbitControls` from `9th.js` |
| `GLTFLoader` | `GLTFLoader` |

## Patterns that work

```js
mesh.position.set(x, y, z);
scene.add(mesh);
camera.aspect = w / h;
camera.updateProjectionMatrix();
renderer.setSize(w, h);
renderer.render(scene, camera);
```

## Differences

- Some materials need WebGL context before first draw (`initShader` is called automatically from `Mesh.render` / `Material.apply`)
- Physics, post-processing, and advanced PBR features are experimental — check demos before relying on them
- Not every Three.js property exists (`outputEncoding`, full `Fog` API, etc.)

## Suggested migration steps

1. Swap imports to `9th.js`
2. Start with `MeshBasicMaterial` scenes
3. Add lights + `MeshStandardMaterial` once unlit path is stable
4. Port loaders and controls last
