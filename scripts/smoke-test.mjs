#!/usr/bin/env node
/**
 * Post-build smoke test against dist/esm/main.js
 */

globalThis.WebGLRenderingContext = globalThis.WebGLRenderingContext || {
  FLOAT: 5126,
  STATIC_DRAW: 35044,
  DYNAMIC_DRAW: 35048,
  STREAM_DRAW: 35040,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  REPEAT: 10497,
  CLAMP_TO_EDGE: 33071,
  MIRRORED_REPEAT: 33648,
  NEAREST: 9728,
  LINEAR: 9729
};

const {
  Object3D,
  Scene,
  Mesh,
  BoxGeometry,
  BufferGeometry,
  WebGLRenderer,
  PerspectiveCamera,
  MeshBasicMaterial,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  OrbitControls,
  GLTFLoader,
  Engine,
  VERSION,
  Raycaster,
  InstancedMesh,
  RenderTarget,
  SpotLight,
  isPrimitiveGeometry,
  toBufferGeometry,
  calculateBoundingBox,
  generateLOD,
  GeometryProfiler
} = await import('../dist/esm/main.js');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

assert(VERSION === '1.0.6', `VERSION is ${VERSION}`);
assert(typeof Engine.prototype.enable === 'function', 'Engine.enable');
assert(typeof Engine.prototype.getPerformance === 'function', 'Engine.getPerformance');
assert(typeof Engine.prototype.pause === 'function', 'Engine.pause');
assert(typeof calculateBoundingBox === 'function', 'calculateBoundingBox');
assert(typeof generateLOD === 'function', 'generateLOD');
assert(typeof GeometryProfiler === 'function', 'GeometryProfiler');
assert(typeof OrbitControls === 'function', 'OrbitControls export');
assert(typeof GLTFLoader === 'function', 'GLTFLoader export');
assert(typeof MeshStandardMaterial === 'function', 'MeshStandardMaterial export');
assert(typeof Raycaster === 'function', 'Raycaster export');
assert(typeof InstancedMesh === 'function', 'InstancedMesh export');
assert(typeof RenderTarget === 'function', 'RenderTarget export');
assert(typeof SpotLight === 'function', 'SpotLight export');
assert(typeof Mesh.prototype.raycast === 'function', 'Mesh.raycast');
assert(typeof WebGLRenderer.prototype.setRenderTarget === 'function', 'WebGLRenderer.setRenderTarget');

const obj = new Object3D();
obj.position.set(1, 2, 3);
assert(obj.position.x === 1 && obj.position.y === 2 && obj.position.z === 3, 'position.set');

const parent = new Object3D();
const child = new Object3D();
parent.add(child);
assert(parent.children.includes(child) && child.parent === parent, 'hierarchy add');

const scene = new Scene();
scene.add(obj);
assert(scene.children.includes(obj), 'scene.children');

const ambient = new AmbientLight(0xffffff, 0.4);
const sun = new DirectionalLight(0xffffff, 1);
sun.position.set(3, 5, 2);
scene.add(ambient, sun);
assert(scene.getLights().length >= 2, 'scene.getLights registers lights');
assert(ambient.isLight && sun.isDirectionalLight, 'light flags');

const box = new BoxGeometry(1, 1, 1);
assert(isPrimitiveGeometry(box), 'isPrimitiveGeometry');
const geo = toBufferGeometry(box, null);
assert(geo instanceof BufferGeometry, 'toBufferGeometry');
assert(geo.getAttribute('position'), 'position attribute');

const mesh = new Mesh(box, new MeshBasicMaterial({ color: '#ff0000' }));
assert(mesh.geometry instanceof BufferGeometry, 'Mesh auto-convert');

const lit = new Mesh(box, new MeshStandardMaterial({ color: '#4fc3f7', metalness: 0.2, roughness: 0.5 }));
assert(lit.material.isMeshStandardMaterial, 'MeshStandardMaterial flag');

assert(typeof WebGLRenderer === 'function', 'WebGLRenderer export');
assert(typeof PerspectiveCamera === 'function', 'PerspectiveCamera export');
assert(typeof Engine === 'function', 'Engine export');

// Minimal embedded-buffer glTF triangle
const positions = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
const indices = new Uint16Array([0, 1, 2]);
const bin = new Uint8Array(positions.byteLength + indices.byteLength);
bin.set(new Uint8Array(positions.buffer), 0);
bin.set(new Uint8Array(indices.buffer), positions.byteLength);
const dataUri = 'data:application/octet-stream;base64,' + Buffer.from(bin).toString('base64');

const gltf = {
  asset: { version: '2.0' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{
    primitives: [{
      attributes: { POSITION: 0 },
      indices: 1,
      material: 0
    }]
  }],
  materials: [{
    pbrMetallicRoughness: {
      baseColorFactor: [0.3, 0.7, 1, 1],
      metallicFactor: 0,
      roughnessFactor: 1
    }
  }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', max: [0.5, 0.5, 0], min: [-0.5, -0.5, 0] },
    { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
    { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength }
  ],
  buffers: [{ byteLength: bin.byteLength, uri: dataUri }]
};

await new Promise((resolve, reject) => {
  const loader = new GLTFLoader();
  loader.parse(gltf, (asset) => {
    try {
      assert(asset.scene, 'gltf.scene');
      assert(asset.meshes.length === 1, 'gltf.meshes');
      assert(asset.meshes[0].geometry, 'gltf mesh.geometry promoted');
      assert(asset.meshes[0].material, 'gltf mesh.material');
      assert(asset.meshes[0].geometry.getAttribute('position'), 'gltf POSITION → position');
      assert(asset.scene.children.length >= 1, 'gltf scene has root node');
      const root = asset.scene.children[0];
      assert(root.children.some((c) => c.isMesh || c.geometry), 'gltf node has mesh child');
      resolve();
    } catch (e) {
      reject(e);
    }
  }, reject);
});

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nSmoke test passed');
