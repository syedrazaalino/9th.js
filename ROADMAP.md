# Roadmap

Product direction for **9th.js** — what we’re shipping next on the library itself.

## Done (1.0.x)

- Scene graph, cameras, meshes, primitives → `BufferGeometry`
- Unlit and lit materials (`MeshBasicMaterial`, `MeshStandardMaterial` + lights)
- `OrbitControls`
- GLTF scene wiring (meshes, materials, nodes)
- ESM / UMD builds, typings, CI, npm package

## Next

1. **Hardening** — matrix edge cases, groups, fog/background, layers
2. **Shadows** — directional shadow maps with a verified demo
3. **Loaders** — more GLTF coverage (skins, animations), OBJ polish
4. **Animation** — clip / mixer path with examples
5. **Effects** — post-FX and particles marked clearly and demoed

## Later

- Smaller publish size / better tree-shaking
- WebGPU backend
- WebXR
- Editor / tooling

## Notes

Physics, full post-processing, and XR modules exist in the tree but are still experimental until they have stable demos and docs.
