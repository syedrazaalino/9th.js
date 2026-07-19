/**
 * Geometry utilities — bridge primitive geometries to BufferGeometry
 */

import { BufferGeometry, VertexAttribute } from '../core/BufferGeometry.js';

/**
 * Detect array-based primitive geometries (BoxGeometry, SphereGeometry, etc.)
 * @param {*} geometry
 * @returns {boolean}
 */
export function isPrimitiveGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') return false;
  if (geometry instanceof BufferGeometry) return false;
  if (typeof geometry.getAttribute === 'function' && geometry.attributes instanceof Map) {
    return false;
  }
  return Array.isArray(geometry.vertices) ||
    geometry.vertices instanceof Float32Array ||
    Array.isArray(geometry.positions) ||
    geometry.positions instanceof Float32Array;
}

/**
 * Convert a primitive geometry (vertices/normals/uvs/indices) into BufferGeometry.
 * @param {object} primitive
 * @param {WebGLRenderingContext|null} gl
 * @returns {BufferGeometry}
 */
export function toBufferGeometry(primitive, gl = null) {
  if (!primitive) {
    throw new Error('Cannot convert null geometry');
  }

  if (primitive instanceof BufferGeometry) {
    if (gl) primitive.ensureGPU(gl);
    return primitive;
  }

  if (typeof primitive.toBufferGeometry === 'function') {
    const converted = primitive.toBufferGeometry(gl);
    if (gl && converted.ensureGPU) converted.ensureGPU(gl);
    return converted;
  }

  const positions = toFloat32(
    primitive.vertices || primitive.positions || []
  );
  const normals = toFloat32(primitive.normals || []);
  const uvs = toFloat32(primitive.uvs || primitive.uv || []);
  const indices = toIndexArray(primitive.indices || []);

  return BufferGeometry.fromArrays(
    { positions, normals, uvs, indices },
    gl
  );
}

/**
 * Normalize any geometry input for Mesh usage.
 * @param {*} geometry
 * @param {WebGLRenderingContext|null} gl
 * @returns {BufferGeometry|*}
 */
export function normalizeGeometry(geometry, gl = null) {
  if (!geometry) return geometry;
  if (geometry instanceof BufferGeometry) {
    if (gl) geometry.ensureGPU(gl);
    return geometry;
  }
  if (isPrimitiveGeometry(geometry)) {
    return toBufferGeometry(geometry, gl);
  }
  return geometry;
}

function toFloat32(data) {
  if (data instanceof Float32Array) return data;
  if (Array.isArray(data)) {
    if (data.length === 0) return new Float32Array(0);
    if (typeof data[0] === 'number') return new Float32Array(data);
    // Nested [[x,y,z], ...]
    const flat = [];
    for (const item of data) {
      if (Array.isArray(item) || item instanceof Float32Array) {
        flat.push(...item);
      } else if (item && typeof item === 'object' && 'x' in item) {
        flat.push(item.x, item.y, item.z !== undefined ? item.z : 0);
      } else {
        flat.push(item);
      }
    }
    return new Float32Array(flat);
  }
  return new Float32Array(0);
}

function toIndexArray(data) {
  if (data instanceof Uint16Array || data instanceof Uint32Array) return data;
  if (!data || data.length === 0) return null;
  const arr = Array.isArray(data) ? data : Array.from(data);
  const max = arr.reduce((m, v) => (v > m ? v : m), 0);
  return max > 65535 ? new Uint32Array(arr) : new Uint16Array(arr);
}

/**
 * Attach toBufferGeometry() onto a primitive geometry class prototype.
 * @param {Function} GeometryClass
 */
export function installPrimitiveBridge(GeometryClass) {
  if (!GeometryClass || GeometryClass.prototype.toBufferGeometry) return;
  GeometryClass.prototype.toBufferGeometry = function (gl = null) {
    return toBufferGeometry(this, gl);
  };
}
