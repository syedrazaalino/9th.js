# 9th.js examples

Live demos of what the library can render today.

## Gallery

Open the interactive gallery (needs a local server + build):

```bash
npm run build
npx serve .
# then visit /examples/
```

Or open each demo below after building.

## Verified demos

| Preview | Demo | Shows |
|---------|------|--------|
| [Open](./hello-cube.html) | **Hello cube** | Scene, camera, `BoxGeometry`, `MeshBasicMaterial` |
| [Open](./lit-cube.html) | **Lit cube + orbit** | `MeshStandardMaterial`, lights, `OrbitControls` |
| [Open](./primitives.html) | **Primitives** | Box, sphere, cylinder, cone, plane |
| [Open](./materials.html) | **Materials** | Metalness / roughness PBR row |
| [Open](./lights.html) | **Lights** | Ambient + directional + colored point lights |
| [Open](./gltf-triangle.html) | **GLTF** | `GLTFLoader` → renderable mesh |

Gallery hub: [index.html](./index.html)

## Note

Older folders under `examples/` (tutorials, games, showcase, …) are historical and may not use the current 9th.js build. Prefer the verified demos above.
