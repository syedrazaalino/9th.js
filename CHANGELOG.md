# Changelog

## [1.0.6] - 2026-07-20

### Added
- `Raycaster` + `Mesh.raycast` for pointer picking
- `InstancedMesh` for batched instance draws
- `RenderTarget` + `WebGLRenderer.setRenderTarget` / `readRenderTargetPixels`
- Post-processing (`EffectComposer` and passes), tween system, game loop helpers
- WebGPU renderer preview module (clear/init path; WebGL remains the production path)
- Object3D quaternion + Euler sync; engine FPS smoothing

### Changed
- Expanded public exports for materials, SpotLight, utils, and new subsystems
- VERSION stays on 1.x (additive release; not a breaking 2.0)

## [1.0.5] - 2026-07-19

### Fixed
- Mesh drawing: buffer `bind()` no longer skips rebinds (attributes were attached to the wrong VBO)
- Index buffer `getIndexType()` for `drawElements`
- Non-interleaved attribute offsets always start at 0
- Prefer WebGL1 for GLSL ES 1.00 materials; WebGL2 gets a default VAO
- CylinderGeometry cap index generation

### Added
- Example gallery with live demos + preview screenshots (`examples/`, `media/previews/`)
- Primitives, materials, and lights demos

## [1.0.4] - 2026-07-19

### Changed
- README rewritten around 9th.js itself (features, install, examples)
- npm package ships only runtime builds + README / LICENSE / CHANGELOG (no source maps, bundle analysis, or contributor docs)
- Roadmap reframed as product direction for 9th.js
- Removed Three.js migration guides from the repo

## [1.0.3] - 2026-07-19

### Added
- Lit `MeshStandardMaterial` path with scene lights
- `OrbitControls` demo (`examples/lit-cube.html`)
- GLTF scene/node/mesh wiring + `examples/gltf-triangle.html`

## [1.0.2] - 2026-07-19

### Fixed
- Restored full `GeometryUtils.js` (LOD, spatial partition, merge/optimize, normals/tangents, profiler). It had been accidentally overwritten in 1.0.0 by the primitive→BufferGeometry bridge; that bridge now lives in `PrimitiveBridge.js`.

## [1.0.1] - 2026-07-19

### Fixed
- Restored full `Engine` API (enable/disable features, performance metrics, debug mode, pause/resume, error handling). 1.0.0 had temporarily shipped a reduced Engine during a build workaround.

## [1.0.0] - 2026-07-19

Foundation release: scene graph, materials, lights, package health.

### Added
- `BufferGeometry.fromArrays`, optional WebGL context, `setAttribute`, `ensureGPU`
- Primitive → BufferGeometry bridge; Mesh auto-convert
- `Object3D` with `position.set`, `add`/`remove`/`children`, `traverse`, `updateMatrixWorld`
- `Scene.children` getter; multi-object `scene.add(...)`
- Public `Engine` export; `Renderer` alias for `WebGLRenderer`
- `WebGLRenderer.setPixelRatio`, `getSize`, improved `setClearColor`
- Lights accept `(color, intensity)` constructor order
- `MeshStandardMaterial.initShader(gl)` for real WebGL compilation
- Canonical example: `examples/hello-cube.html`
- GitHub Actions CI (build + verify-exports + unit tests)

### Fixed
- Package `types` / `exports` aligned to `dist/esm/index.d.ts`
- Removed install-time `os`/`cpu` restrictions
- `VERSION` / homepage / repository URLs synced to `syedrazaalino/9th.js`
- Cross-platform `clean` via `rimraf`; `verify-exports` on `prepublishOnly`

## [0.1.26] - 2025-11-15

Previous npm release.
