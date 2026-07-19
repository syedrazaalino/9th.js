# Changelog

## [1.0.1] - 2026-07-19

### Fixed
- Restored full `Engine` API (enable/disable features, performance metrics, debug mode, pause/resume, error handling). 1.0.0 had temporarily shipped a reduced Engine during a build workaround.

## [1.0.0] - 2026-07-19

Foundation release toward Three.js API parity.

### Added
- `BufferGeometry.fromArrays`, optional WebGL context, `setAttribute`, `ensureGPU`
- Primitive → BufferGeometry bridge (`GeometryUtils`, Mesh auto-convert)
- Three.js-shaped `Object3D` (`position.set`, `add`/`remove`/`children`, `traverse`, `updateMatrixWorld`)
- `Scene.children` getter; multi-object `scene.add(...)`
- Public `Engine` export; `Renderer` alias for `WebGLRenderer`
- `WebGLRenderer.setPixelRatio`, `getSize`, improved `setClearColor`
- Lights accept Three.js `(color, intensity)` constructor order
- `MeshStandardMaterial.initShader(gl)` for real WebGL compilation
- Canonical example: `examples/hello-cube.html`
- GitHub Actions CI (build + verify-exports + parity unit tests)
- Parity unit tests: `tests/unit/core/Object3D.parity.test.ts`

### Fixed
- Package `types` / `exports` aligned to `dist/esm/index.d.ts`
- Removed install-time `os`/`cpu` restrictions
- `VERSION` / homepage / repository URLs synced to `syedrazaalino/9th.js`
- Stub light re-exports from `directional.ts` removed from public API
- Cross-platform `clean` via `rimraf`; `verify-exports` on `prepublishOnly`

### Changed
- Honest README: documents working APIs vs experimental modules
- ROADMAP rewritten as phased Three.js parity plan
- Hand-written broken `types/` folder no longer published (generated `dist` declarations used)

### Honest status
- Physics, full post-processing pipelines, and WebXR remain experimental / incomplete
- Not a drop-in Three.js replacement; migration guide lists verified mappings only

## [0.1.26] - 2025-11-15

Previous npm release (pre-parity foundation work).
