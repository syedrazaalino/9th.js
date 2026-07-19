/**
 * Object3D / Scene / geometry parity tests aligned with current implementation
 */
import { Object3D } from '../../../src/core/Object3D.js';
import { Scene } from '../../../src/core/Scene.js';
import { Mesh } from '../../../src/core/Mesh.js';
import { BoxGeometry } from '../../../src/geometry/BoxGeometry.js';
import { BufferGeometry } from '../../../src/core/BufferGeometry.js';
import { toBufferGeometry, isPrimitiveGeometry } from '../../../src/geometry/GeometryUtils.js';

describe('Object3D Three.js-shaped API', () => {
  test('position.set updates coordinates and dirties matrix', () => {
    const obj = new Object3D();
    obj.position.set(1, 2, 3);
    expect(obj.position.x).toBe(1);
    expect(obj.position.y).toBe(2);
    expect(obj.position.z).toBe(3);
    expect(obj.localMatrixDirty).toBe(true);
  });

  test('add / remove / children hierarchy', () => {
    const parent = new Object3D();
    const child = new Object3D();
    parent.add(child);
    expect(parent.children).toContain(child);
    expect(child.parent).toBe(parent);
    parent.remove(child);
    expect(parent.children).not.toContain(child);
    expect(child.parent).toBeNull();
  });

  test('traverse visits self and descendants', () => {
    const root = new Object3D();
    const a = new Object3D();
    const b = new Object3D();
    root.add(a);
    a.add(b);
    const names = [];
    root.traverse((o) => names.push(o));
    expect(names).toEqual([root, a, b]);
  });
});

describe('Scene children', () => {
  test('scene.add populates children', () => {
    const scene = new Scene();
    const obj = new Object3D();
    scene.add(obj);
    expect(scene.children).toContain(obj);
  });
});

describe('Geometry bridge', () => {
  test('BoxGeometry is detected as primitive', () => {
    const box = new BoxGeometry(1, 1, 1);
    expect(isPrimitiveGeometry(box)).toBe(true);
  });

  test('toBufferGeometry converts without WebGL context', () => {
    const box = new BoxGeometry(1, 1, 1);
    const geo = toBufferGeometry(box, null);
    expect(geo).toBeInstanceOf(BufferGeometry);
    expect(geo.getAttribute('position')).toBeTruthy();
    expect(geo.vertexCount).toBeGreaterThan(0);
  });

  test('Mesh auto-converts BoxGeometry', () => {
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), null);
    expect(mesh.geometry).toBeInstanceOf(BufferGeometry);
  });
});
