/**
 * @class Ray
 * @description A 3D ray defined by an origin and a (normalized) direction.
 * @author 9th.js Team
 * @version 1.0.0
 *
 * Provides Three.js-compatible Ray helpers: at(t), distanceToPoint,
 * closestPointToPoint, intersectsSphere/Box/Triangle, and applyMatrix4.
 *
 * Note: the rest of the engine also exports a minimal Ray from
 * src/extras/helpers.js. This is the full-featured version used by
 * Raycaster and is the canonical implementation going forward.
 */
import { Vector3 } from './math/Vector3.js';

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();
const _v4 = new Vector3();

/**
 * Coerce any {x, y, z}-like value (plain object, Vec3, etc.) into a real
 * Vector3 instance. Avoids breakage when callers pass simplified vectors
 * or duck-typed literals. If the input is already a Vector3 it is returned
 * unchanged.
 */
function _toVec3(v) {
  if (v instanceof Vector3) return v;
  if (v && typeof v === 'object') {
    return new Vector3(v.x || 0, v.y || 0, v.z || 0);
  }
  return new Vector3();
}

export class Ray {
  constructor(origin = new Vector3(), direction = new Vector3(0, 0, -1)) {
    this.origin = _toVec3(origin).clone();
    this.direction = _toVec3(direction).clone().normalize();
  }

  /**
   * Set origin and direction. Direction is normalized.
   * Accepts any {x,y,z}-like input.
   */
  set(origin, direction) {
    this.origin.copy(_toVec3(origin));
    this.direction.copy(_toVec3(direction)).normalize();
    return this;
  }

  copy(ray) {
    this.origin.copy(ray.origin);
    this.direction.copy(ray.direction);
    return this;
  }

  clone() {
    return new Ray(this.origin, this.direction);
  }

  /**
   * Get a point along the ray at parameter t.
   * Returns a new Vector3 unless `target` is provided.
   */
  at(t, target = new Vector3()) {
    return target.copy(this.direction).multiplyScalar(t).add(this.origin);
  }

  /**
   * Signed distance from origin to point projected onto the ray.
   * (Negative if the projection lies behind the origin.)
   */
  distanceToPoint(point) {
    return Math.sqrt(this.distanceSqToPoint(point));
  }

  /**
   * Squared distance from a point to the ray.
   */
  distanceSqToPoint(point) {
    _v1.subVectors(point, this.origin);
    const projectionDirection = _v1.dot(this.direction);

    // point is behind the ray
    if (projectionDirection < 0) {
      return _v1.lengthSq();
    }

    _v2.copy(this.direction).multiplyScalar(projectionDirection).add(this.origin);
    return _v1.subVectors(point, _v2).lengthSq();
  }

  /**
   * Closest point on the ray to a given point.
   * Returns the ray origin if the point is behind the ray.
   */
  closestPointToPoint(point, target = new Vector3()) {
    _v1.subVectors(point, this.origin);
    const projectionDirection = _v1.dot(this.direction);

    if (projectionDirection < 0) {
      return target.copy(this.origin);
    }

    _v2.copy(this.direction).multiplyScalar(projectionDirection).add(this.origin);
    return target.copy(_v2);
  }

  /**
   * Apply a 4x4 matrix to the ray (origin is transformed as a point,
   * direction is transformed as a direction and re-normalized).
   * Returns `this`.
   *
   * `matrix` may be either a Matrix4 instance (with `.elements`)
   * or a plain Float32Array(16) / Array(16) as used by Object3D.worldMatrix.
   */
  applyMatrix4(matrix) {
    const e = (matrix && matrix.elements) ? matrix.elements : matrix;
    if (!e || e.length < 16) return this;

    // Transform origin as a point (with perspective divide)
    const ox = this.origin.x, oy = this.origin.y, oz = this.origin.z;
    let w = e[3] * ox + e[7] * oy + e[11] * oz + e[15];
    if (w === 0) w = 1;
    this.origin.set(
      (e[0] * ox + e[4] * oy + e[8]  * oz + e[12]) / w,
      (e[1] * ox + e[5] * oy + e[9]  * oz + e[13]) / w,
      (e[2] * ox + e[6] * oy + e[10] * oz + e[14]) / w
    );

    // Transform direction as a direction (ignore translation, w=0, then normalize)
    const dx = this.direction.x, dy = this.direction.y, dz = this.direction.z;
    this.direction.set(
      e[0] * dx + e[4] * dy + e[8]  * dz,
      e[1] * dx + e[5] * dy + e[9]  * dz,
      e[2] * dx + e[6] * dy + e[10] * dz
    ).normalize();

    return this;
  }

  /**
   * Ray-sphere intersection test.
   * @param {{center: Vector3|{x,y,z}, radius: number}} sphere
   * @param {Vector3} [target] - optional target for the hit point
   * @returns {number|null} distance along ray, or null if no hit
   */
  intersectsSphere(sphere, target) {
    const center = sphere.center;
    const radius = sphere.radius;
    _v1.subVectors(center, this.origin);
    const tca = _v1.dot(this.direction);
    const d2 = _v1.lengthSq() - tca * tca;
    const radius2 = radius * radius;

    if (d2 > radius2) return null;

    const thc = Math.sqrt(radius2 - d2);
    let t = tca - thc;

    // if t is negative, ray starts inside sphere — use the far intersection
    if (t < 0) t = tca + thc;
    if (t < 0) return null;

    if (target) this.at(t, target);
    return t;
  }

  /**
   * Ray-AABB intersection test (slab method).
   * @param {{min: Vector3|{x,y,z}, max: Vector3|{x,y,z}}} box
   * @param {Vector3} [target] - optional target for the entry hit point
   * @returns {number|null} distance along ray to entry point, or null
   */
  intersectsBox(box, target) {
    const min = box.min, max = box.max;
    const invDirX = 1 / this.direction.x;
    const invDirY = 1 / this.direction.y;
    const invDirZ = 1 / this.direction.z;

    let tmin, tmax, tymin, tymax, tzmin, tzmax;

    if (invDirX >= 0) {
      tmin = (min.x - this.origin.x) * invDirX;
      tmax = (max.x - this.origin.x) * invDirX;
    } else {
      tmin = (max.x - this.origin.x) * invDirX;
      tmax = (min.x - this.origin.x) * invDirX;
    }

    if (invDirY >= 0) {
      tymin = (min.y - this.origin.y) * invDirY;
      tymax = (max.y - this.origin.y) * invDirY;
    } else {
      tymin = (max.y - this.origin.y) * invDirY;
      tymax = (min.y - this.origin.y) * invDirY;
    }

    if (tmin > tymax || tymin > tmax) return null;
    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    if (invDirZ >= 0) {
      tzmin = (min.z - this.origin.z) * invDirZ;
      tzmax = (max.z - this.origin.z) * invDirZ;
    } else {
      tzmin = (max.z - this.origin.z) * invDirZ;
      tzmax = (min.z - this.origin.z) * invDirZ;
    }

    if (tmin > tzmax || tzmin > tmax) return null;
    if (tzmin > tmin) tmin = tzmin;
    if (tzmax < tmax) tmax = tzmax;

    // tmin < 0 means origin is inside the box — use tmax (exit point)
    let t = tmin;
    if (t < 0) t = tmax;
    if (t < 0) return null;

    if (target) this.at(t, target);
    return t;
  }

  /**
   * Ray-triangle intersection (Möller–Trumbore).
   *
   * @param {Vector3} a - triangle vertex A
   * @param {Vector3} b - triangle vertex B
   * @param {Vector3} c - triangle vertex C
   * @param {boolean} [backfaceCulling=false]
   * @param {{point?: Vector3, uv?: {x,y}}} [target] - optional targets for outputs
   * @returns {number|null} distance along ray, or null if no hit
   */
  intersectsTriangle(a, b, c, backfaceCulling = false, target) {
    const EPS = 1e-10;

    _v1.subVectors(b, a); // edge1
    _v2.subVectors(c, a); // edge2

    _v3.crossVectors(this.direction, _v2); // h
    const det = _v1.dot(_v3);

    if (backfaceCulling) {
      if (det < EPS) return null;
      _v4.subVectors(this.origin, a); // s
      const u = _v4.dot(_v3);
      if (u < 0 || u > det) return null;

      const q = _v4.cross(_v1); // note: Vector3.cross mutates in place
      // recompute q as v4 × v1 (Vector3.cross does this.cross(that) which is _v4.cross(_v1) -> mutates _v4)
      const v = this.direction.dot(_v4); // _v4 is now s × edge1
      if (v < 0 || u + v > det) return null;

      const t = _v2.dot(_v4) / det;
      if (t < EPS) return null;

      if (target && target.point) this.at(t, target.point);
      return t;
    } else {
      // parallel
      if (det > -EPS && det < EPS) return null;

      const invDet = 1 / det;
      _v4.subVectors(this.origin, a); // s
      const u = invDet * _v4.dot(_v3);
      if (u < 0 || u > 1) return null;

      const q = _v4.cross(_v1); // q = s × edge1 (mutates _v4)
      const v = invDet * this.direction.dot(_v4);
      if (v < 0 || u + v > 1) return null;

      const t = invDet * _v2.dot(_v4);
      if (t < EPS) return null;

      if (target && target.point) this.at(t, target.point);
      // barycentric (u, v) are also recoverable for UV interpolation by the caller
      if (target) {
        target.baryU = u;
        target.baryV = v;
      }
      return t;
    }
  }
}

/**
 * Return the typed-array data backing a geometry attribute.
 *
 * Works against the BufferGeometry API where attribute data may be stored
 * under `.array`, `._cpuData`, or inside a GPU buffer accessible via
 * `.buffer.getData()`. Returns null if not found.
 */
function _getAttrArray(geometry, name) {
  if (!geometry) return null;
  let attr;
  if (typeof geometry.getAttribute === 'function') {
    attr = geometry.getAttribute(name);
  } else if (geometry.attributes && geometry.attributes.get) {
    attr = geometry.attributes.get(name);
  } else if (geometry.attributes) {
    attr = geometry.attributes[name] || null;
  }
  if (!attr) return null;
  if (attr.array) return attr.array;
  if (attr._cpuData) return attr._cpuData;
  if (attr.buffer && typeof attr.buffer.getData === 'function') {
    const data = attr.buffer.getData();
    if (data) return data;
  }
  return null;
}

function _getIndexArray(geometry) {
  if (!geometry) return null;
  const ib = (typeof geometry.getIndexBuffer === 'function')
    ? geometry.getIndexBuffer()
    : (geometry.indexBuffer || null);
  if (!ib) return null;
  if (typeof ib.getData === 'function') {
    const data = ib.getData();
    if (data) return data;
  }
  if (ib.array) return ib.array;
  return null;
}

/**
 * Extract Float32Array(16) elements from either a Matrix4 instance
 * or a plain Float32Array (as produced by Object3D.composeTRS / worldMatrix).
 */
function _mat4Elements(matrix) {
  if (!matrix) return null;
  if (matrix.elements) return matrix.elements;
  if (matrix.length === 16) return matrix;
  return null;
}

/**
 * Invert a 4x4 matrix given as a 16-element column-major array.
 * Returns a fresh Float32Array(16). If matrix is singular, returns identity.
 */
function _invertMat4(m) {
  const out = new Float32Array(16);

  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
    return out;
  }
  det = 1.0 / det;

  out[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * Transform a Vector3 as a point (with perspective divide).
 */
function _applyPoint(v, m, target) {
  const x = v.x, y = v.y, z = v.z;
  let w = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (w === 0) w = 1;
  target.set(
    (m[0] * x + m[4] * y + m[8]  * z + m[12]) / w,
    (m[1] * x + m[5] * y + m[9]  * z + m[13]) / w,
    (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
  );
  return target;
}

/**
 * Transform a Vector3 as a direction (no translation, no perspective divide).
 * The result is NOT normalized — caller decides.
 */
function _applyDirection(v, m, target) {
  const x = v.x, y = v.y, z = v.z;
  target.set(
    m[0] * x + m[4] * y + m[8]  * z,
    m[1] * x + m[5] * y + m[9]  * z,
    m[2] * x + m[6] * y + m[10] * z
  );
  return target;
}

// scratch vectors for triangle intersection
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _hitPoint = new Vector3();
const _localOrigin = new Vector3();
const _localDir = new Vector3();
const _worldPoint = new Vector3();
const _tmpTarget = { point: _hitPoint, baryU: 0, baryV: 0 };

/**
 * @class Raycaster
 * @description Three.js-compatible Raycaster for picking and intersection tests.
 *
 * Usage:
 *   const raycaster = new Raycaster();
 *   raycaster.setFromCamera(mouseCoords, camera); // NDC {x,y} or {x,y,z}
 *   const intersects = raycaster.intersectObjects(scene.children);
 *   // each intersection: { distance, point, object, face, uv, instanceId }
 *
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Raycaster {
  /**
   * @param {Vector3} [origin]
   * @param {Vector3} [direction]
   * @param {number} [near=0]
   * @param {number} [far=Infinity]
   */
  constructor(origin = new Vector3(), direction = new Vector3(0, 0, -1), near = 0, far = Infinity) {
    this.ray = new Ray(origin, direction);
    this.near = near;
    this.far = far;

    /**
     * Per-raycaster params passed into Mesh.raycast via the raycaster instance.
     * Mirrors the Three.js API surface.
     */
    this.params = {
      Mesh: {},
      Line: {},
      LOD: {},
      Points: { threshold: 1 },
      Sprite: {}
    };

    // Camera used by the most recent setFromCamera call (informational).
    this.camera = null;
  }

  /**
   * Set the ray's origin and direction. Direction is normalized.
   */
  set(origin, direction) {
    this.ray.set(origin, direction);
    return this;
  }

  /**
   * Configure the ray from normalized device coordinates and a camera.
   *
   * Accepts:
   *   - {x, y}        : 2D NDC (z implicitly 0 for origin on near plane)
   *   - {x, y, z}     : 3D NDC (z in [-1, 1])
   *   - Vector2 / Vector3-like anything with x,y
   *
   * Handles PerspectiveCamera AND OrthographicCamera.
   */
  setFromCamera(coords, camera) {
    this.camera = camera;
    if (!camera) {
      // Degenerate: just point down -Z from origin
      this.ray.origin.set(0, 0, 0);
      this.ray.direction.set(0, 0, -1);
      return this;
    }

    // Make sure matrices are up to date.
    if (typeof camera.updateMatrix === 'function') {
      camera.updateMatrix();
    } else if (typeof camera.updateMatrixWorld === 'function') {
      camera.updateMatrixWorld(true);
    }

    const isOrthographic = camera.isOrthographicCamera ||
      camera.projectionType === 'orthographic' ||
      camera.type === 'OrthographicCamera';

    const x = coords.x !== undefined ? coords.x : (coords[0] || 0);
    const y = coords.y !== undefined ? coords.y : (coords[1] || 0);
    const z = coords.z !== undefined ? coords.z : 0;

    if (isOrthographic) {
      // For orthographic: origin is unprojection of (x, y, -1) [near plane].
      // Direction is the camera's world-forward direction.
      const invVP = _invertMat4(camera.viewProjectionMatrix || _mulMat4(camera.projectionMatrix, camera.viewMatrix));
      const nearPoint = _unproject(x, y, -1, invVP);

      this.ray.origin.set(nearPoint.x, nearPoint.y, nearPoint.z);

      // Direction = camera world forward (-Z column of camera world matrix).
      // worldMatrix is Float32Array(16) column-major; column 2 is elements [2,6,10].
      const worldMatrix = _mat4Elements(camera.worldMatrix || camera.matrixWorld) || camera.matrix;
      this.ray.direction.set(
        -(worldMatrix[8]),
        -(worldMatrix[9]),
        -(worldMatrix[10])
      ).normalize();
    } else {
      // Perspective: origin = camera world position, direction = unproject(near) -> unproject(far).
      const invVP = _invertMat4(camera.viewProjectionMatrix || _mulMat4(camera.projectionMatrix, camera.viewMatrix));
      const nearPoint = _unproject(x, y, (z !== 0 ? z : -1), invVP);
      const farPoint  = _unproject(x, y, 1, invVP);

      // Origin = camera world position
      const worldMatrix = _mat4Elements(camera.worldMatrix || camera.matrixWorld) || camera.matrix;
      this.ray.origin.set(worldMatrix[12], worldMatrix[13], worldMatrix[14]);

      this.ray.direction.set(
        farPoint.x - nearPoint.x,
        farPoint.y - nearPoint.y,
        farPoint.z - nearPoint.z
      ).normalize();
    }

    return this;
  }

  /**
   * Intersect a single Object3D (potentially recursively).
   */
  intersectObject(object, recursive = true, intersects = []) {
    if (object === undefined || object === null) return intersects;

    _intersectObjectInternal(object, this, intersects, recursive);

    intersects.sort(_byDistance);
    return intersects;
  }

  /**
   * Intersect a list of Object3D instances (potentially recursively).
   */
  intersectObjects(objects, recursive = true, intersects = []) {
    if (!objects) return intersects;

    if (Array.isArray(objects)) {
      for (let i = 0, l = objects.length; i < l; i++) {
        _intersectObjectInternal(objects[i], this, intersects, recursive);
      }
    } else {
      // Allow a single non-array argument too
      _intersectObjectInternal(objects, this, intersects, recursive);
    }

    intersects.sort(_byDistance);
    return intersects;
  }
}

function _byDistance(a, b) {
  return a.distance - b.distance;
}

function _intersectObjectInternal(object, raycaster, intersects, recursive) {
  if (!object) return;
  if (object.visible === false) return;

  // Dispatch to the object's own raycast method if present (Mesh, Line, Points, etc.).
  if (typeof object.raycast === 'function') {
    object.raycast(raycaster, intersects);
  }

  if (recursive === true) {
    const children = object.children;
    if (children && children.length) {
      for (let i = 0, l = children.length; i < l; i++) {
        _intersectObjectInternal(children[i], raycaster, intersects, recursive);
      }
    }
  }
}

/**
 * Unproject NDC coordinates through a 4x4 inverse view-projection matrix.
 */
function _unproject(x, y, z, invMatrix) {
  const px = invMatrix[0]  * x + invMatrix[4]  * y + invMatrix[8]  * z + invMatrix[12];
  const py = invMatrix[1]  * x + invMatrix[5]  * y + invMatrix[9]  * z + invMatrix[13];
  const pz = invMatrix[2]  * x + invMatrix[6]  * y + invMatrix[10] * z + invMatrix[14];
  const pw = invMatrix[3]  * x + invMatrix[7]  * y + invMatrix[11] * z + invMatrix[15];

  // Perspective divide (guard against divide-by-zero)
  const w = (pw === 0) ? 1 : pw;
  return { x: px / w, y: py / w, z: pz / w };
}

/**
 * Multiply two 4x4 column-major matrices, returning a fresh Float32Array(16).
 */
function _mulMat4(a, b) {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  return out;
}

/**
 * Static helper: triangle-ray intersection using Möller–Trumbore.
 *
 * Returns null on miss. On hit returns:
 *   { distance, point, face: { a, b, c, normal }, uv, baryU, baryV }
 *
 * This is exposed as a static so Mesh.raycast (and any other caller) can use it
 * directly without needing a Raycaster instance.
 */
Raycaster.rayTriangle = function (rayOrigin, rayDirection, a, b, c, uvA, uvB, uvC, backfaceCulling = false) {
  const EPS = 1e-10;
  const edge1x = b.x - a.x, edge1y = b.y - a.y, edge1z = b.z - a.z;
  const edge2x = c.x - a.x, edge2y = c.y - a.y, edge2z = c.z - a.z;

  // h = direction × edge2
  const hx = rayDirection.y * edge2z - rayDirection.z * edge2y;
  const hy = rayDirection.z * edge2x - rayDirection.x * edge2z;
  const hz = rayDirection.x * edge2y - rayDirection.y * edge2x;

  // det = edge1 · h
  const det = edge1x * hx + edge1y * hy + edge1z * hz;

  if (backfaceCulling) {
    if (det < EPS) return null;
    const sx = rayOrigin.x - a.x, sy = rayOrigin.y - a.y, sz = rayOrigin.z - a.z;
    const u = sx * hx + sy * hy + sz * hz;
    if (u < 0 || u > det) return null;

    // q = s × edge1
    const qx = sy * edge1z - sz * edge1y;
    const qy = sz * edge1x - sx * edge1z;
    const qz = sx * edge1y - sy * edge1x;
    const v = (rayDirection.x * qx + rayDirection.y * qy + rayDirection.z * qz);
    if (v < 0 || u + v > det) return null;

    const t = (edge2x * qx + edge2y * qy + edge2z * qz) / det;
    if (t < EPS) return null;

    return _buildTriangleResult(rayOrigin, rayDirection, a, b, c, uvA, uvB, uvC,
      u / det, v / det, t);
  } else {
    if (det > -EPS && det < EPS) return null;

    const invDet = 1 / det;
    const sx = rayOrigin.x - a.x, sy = rayOrigin.y - a.y, sz = rayOrigin.z - a.z;
    const u = invDet * (sx * hx + sy * hy + sz * hz);
    if (u < 0 || u > 1) return null;

    // q = s × edge1
    const qx = sy * edge1z - sz * edge1y;
    const qy = sz * edge1x - sx * edge1z;
    const qz = sx * edge1y - sy * edge1x;
    const v = invDet * (rayDirection.x * qx + rayDirection.y * qy + rayDirection.z * qz);
    if (v < 0 || u + v > 1) return null;

    const t = invDet * (edge2x * qx + edge2y * qy + edge2z * qz);
    if (t < EPS) return null;

    return _buildTriangleResult(rayOrigin, rayDirection, a, b, c, uvA, uvB, uvC, u, v, t);
  }
};

function _buildTriangleResult(rayOrigin, rayDirection, a, b, c, uvA, uvB, uvC, u, v, t) {
  const w = 1 - u - v;

  const point = new Vector3(
    rayOrigin.x + rayDirection.x * t,
    rayOrigin.y + rayDirection.y * t,
    rayOrigin.z + rayDirection.z * t
  );

  // Face normal = normalize(edge1 × edge2)
  const e1x = b.x - a.x, e1y = b.y - a.y, e1z = b.z - a.z;
  const e2x = c.x - a.x, e2y = c.y - a.y, e2z = c.z - a.z;
  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;
  const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  const normal = new Vector3(nx / nlen, ny / nlen, nz / nlen);

  let uv = null;
  if (uvA && uvB && uvC) {
    uv = {
      x: w * uvA.x + u * uvB.x + v * uvC.x,
      y: w * uvA.y + u * uvB.y + v * uvC.y
    };
  }

  return {
    distance: t,
    point,
    face: {
      a: a._index !== undefined ? a._index : 0,
      b: b._index !== undefined ? b._index : 1,
      c: c._index !== undefined ? c._index : 2,
      normal
    },
    uv,
    baryU: u,
    baryV: v
  };
}

/**
 * Static helpers operating on plain sphere/box literals.
 */
Raycaster.intersectsSphere = function (ray, sphere, target) {
  return ray.intersectsSphere(sphere, target);
};

Raycaster.intersectsBox = function (ray, box, target) {
  return ray.intersectsBox(box, target);
};

/**
 * Mesh.raycast — brute-force triangle intersection.
 *
 * Transforms the ray into the mesh's local space, iterates every triangle
 * (using index buffer if available, otherwise treating positions as
 * non-indexed triangles), and pushes Three.js-compatible intersection
 * records into the `intersects` array.
 *
 * @this {import('./Mesh.js').Mesh}
 * @param {Raycaster} raycaster
 * @param {Array} intersects
 */
export function meshRaycast(raycaster, intersects) {
  const geometry = this.geometry || (this._rawGeometry && this._rawGeometry);
  if (!geometry) return;

  // Ensure world matrix is up to date.
  if (typeof this.updateMatrixWorld === 'function') {
    this.updateMatrixWorld();
  } else if (typeof this.updateMatrix === 'function') {
    this.updateMatrix();
  }

  const worldMatrix = _mat4Elements(this.worldMatrix || this.matrixWorld || this.matrix);
  if (!worldMatrix) return;

  // Local-space ray = world ray transformed by inverse(worldMatrix)
  const inverseMatrix = _invertMat4(worldMatrix);
  _applyPoint(raycaster.ray.origin, inverseMatrix, _localOrigin);
  _applyDirection(raycaster.ray.direction, inverseMatrix, _localDir);
  // Note: direction is NOT renormalized here so local `t` values are in the
  // same scale as world distances IF the mesh has no scaling. When the mesh
  // is scaled, we recover the true world distance by re-projecting the hit
  // point back into world space below.
  const localDirLen = _localDir.length();
  if (localDirLen === 0) return;
  _localDir.divideScalar(localDirLen);
  // Scale factor: world distance = local t * (localDir.length() before normalization)
  // We multiplied localDir by 1/len above so local t == local distance. To convert
  // to world-space distance, multiply by (|localDir_unnormalized|) — but since we
  // re-project the hit point back to world space, we don't actually need this.

  const positions = _getAttrArray(geometry, 'position');
  if (!positions || positions.length < 9) return;

  const uvs = _getAttrArray(geometry, 'uv');
  const indexArray = _getIndexArray(geometry);

  const near = raycaster.near;
  const far = raycaster.far;

  if (indexArray && indexArray.length >= 3) {
    const triCount = Math.floor(indexArray.length / 3);
    for (let i = 0; i < triCount; i++) {
      const i0 = indexArray[i * 3];
      const i1 = indexArray[i * 3 + 1];
      const i2 = indexArray[i * 3 + 2];

      _a.set(positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]);
      _b.set(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      _c.set(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      _a._index = i0; _b._index = i1; _c._index = i2;

      _testTriangle(this, _a, _b, _c, uvs, raycaster, _localOrigin, _localDir, near, far, intersects, worldMatrix, inverseMatrix, localDirLen, i);
    }
  } else {
    // Non-indexed geometry: positions are laid out as (v0a, v0b, v0c, v1a, v1b, v1c, ...)
    const triCount = Math.floor(positions.length / 9);
    for (let i = 0; i < triCount; i++) {
      const i0 = i * 3;
      const i1 = i * 3 + 1;
      const i2 = i * 3 + 2;

      _a.set(positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]);
      _b.set(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      _c.set(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      _a._index = i0; _b._index = i1; _c._index = i2;

      _testTriangle(this, _a, _b, _c, uvs, raycaster, _localOrigin, _localDir, near, far, intersects, worldMatrix, inverseMatrix, localDirLen, i);
    }
  }
}

function _testTriangle(mesh, a, b, c, uvs, raycaster, localOrigin, localDir, near, far, intersects, worldMatrix, inverseMatrix, localDirLen, faceIndex) {
  let uvA = null, uvB = null, uvC = null;
  if (uvs && uvs.length >= 6) {
    const aIdx = a._index, bIdx = b._index, cIdx = c._index;
    uvA = { x: uvs[aIdx * 2],     y: uvs[aIdx * 2 + 1] };
    uvB = { x: uvs[bIdx * 2],     y: uvs[bIdx * 2 + 1] };
    uvC = { x: uvs[cIdx * 2],     y: uvs[cIdx * 2 + 1] };
  }

  const hit = Raycaster.rayTriangle(localOrigin, localDir, a, b, c, uvA, uvB, uvC, false);
  if (!hit) return;

  // hit.distance is in local-space units (since localDir was normalized).
  // Convert back to world-space distance using the hit point.
  _hitPoint.set(hit.point.x, hit.point.y, hit.point.z);
  _applyPoint(_hitPoint, worldMatrix, _worldPoint);

  // World-space distance = distance from world ray origin to world hit point.
  const worldDx = _worldPoint.x - raycaster.ray.origin.x;
  const worldDy = _worldPoint.y - raycaster.ray.origin.y;
  const worldDz = _worldPoint.z - raycaster.ray.origin.z;
  const worldDistance = Math.sqrt(worldDx * worldDx + worldDy * worldDy + worldDz * worldDz);

  if (worldDistance < near || worldDistance > far) return;

  intersects.push({
    distance: worldDistance,
    point: _worldPoint.clone(),
    object: mesh,
    face: {
      a: a._index,
      b: b._index,
      c: c._index,
      normal: _transformNormal(hit.face.normal, worldMatrix)
    },
    uv: hit.uv ? { x: hit.uv.x, y: hit.uv.y } : null,
    instanceId: null,
    faceIndex: faceIndex
  });
}

/**
 * Transform a normal from local to world space using the inverse-transpose
 * of the upper-left 3x3 of the mesh world matrix. Since our meshes typically
 * have uniform scale, multiplying by worldMatrix's 3x3 and renormalizing is
 * good enough — but we use the mathematically correct inverse-transpose for
 * robustness.
 */
function _transformNormal(normal, worldMatrix) {
  const inv = _invertMat4(worldMatrix);
  // inverse-transpose of upper 3x3 = transpose of inverse upper 3x3
  // inv is column-major. inv[col*4+row] -> element at row,col.
  // inverse-transpose[i,j] = inv[j,i] = inv[i*4 + j]? Let's just take the 3x3 upper-left.
  // For column-major m, the upper-left 3x3 elements are m[0,1,2,4,5,6,8,9,10].
  // inv is the inverse; its transpose's upper 3x3 = invT where invT[i,j] = inv[j,i].
  // So for input normal (nx, ny, nz):
  //   result.x = inv[0]*nx + inv[1]*ny + inv[2]*nz   (column 0 of invT = row 0 of inv)
  //   result.y = inv[4]*nx + inv[5]*ny + inv[6]*nz
  //   result.z = inv[8]*nx + inv[9]*ny + inv[10]*nz
  const nx = normal.x, ny = normal.y, nz = normal.z;
  const rx = inv[0] * nx + inv[1] * ny + inv[2]  * nz;
  const ry = inv[4] * nx + inv[5] * ny + inv[6]  * nz;
  const rz = inv[8] * nx + inv[9] * ny + inv[10] * nz;
  const len = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
  return new Vector3(rx / len, ry / len, rz / len);
}
