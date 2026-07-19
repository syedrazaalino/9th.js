#!/usr/bin/env node
/**
 * Post-build smoke test against dist/esm/main.js
 */

// Browser globals expected by some library modules at import time
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
  Engine,
  VERSION,
  isPrimitiveGeometry,
  toBufferGeometry
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

assert(VERSION === '1.0.0', `VERSION is ${VERSION}`);

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

const box = new BoxGeometry(1, 1, 1);
assert(isPrimitiveGeometry(box), 'isPrimitiveGeometry');
const geo = toBufferGeometry(box, null);
assert(geo instanceof BufferGeometry, 'toBufferGeometry');
assert(geo.getAttribute('position'), 'position attribute');

const mesh = new Mesh(box, new MeshBasicMaterial({ color: '#ff0000' }));
assert(mesh.geometry instanceof BufferGeometry, 'Mesh auto-convert');

assert(typeof WebGLRenderer === 'function', 'WebGLRenderer export');
assert(typeof PerspectiveCamera === 'function', 'PerspectiveCamera export');
assert(typeof Engine === 'function', 'Engine export');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nSmoke test passed');
