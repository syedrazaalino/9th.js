# Roadmap — Three.js API parity

9th.js aims for practical Three.js-compatible APIs for common WebGL apps. Full feature parity with Three.js r1xx+ is a long-term goal, shipped in versions.

## Shipped in 1.0.0

- Working hello-cube path: BoxGeometry → Mesh → WebGLRenderer
- Object3D / Scene / Camera Three.js-shaped basics
- Package/exports/types health + CI

## Next (1.1 – 1.x)

1. **Scene graph hardening** — matrixWorld edge cases, layers, Groups, fog/background Three-compat
2. **Renderer + materials** — verified lit MeshStandardMaterial with scene lights; minimal shadow maps
3. **Loaders** — GLTF/OBJ → renderable Mesh trees with verified demos
4. **Animation + OrbitControls** — mixer clip path + controls smoke tests
5. **Effects** — Bloom/FXAA pipeline demo; particles demo; physics either integrated or clearly marked optional

## Later (2.0+)

- WebGPU backend
- WebXR productization
- Visual editor / tooling
- Size budgets and broader browser matrix

## Non-goals (for now)

- Claiming drop-in replacement for every Three.js example
- Shipping unfinished physics/XR as production-ready
