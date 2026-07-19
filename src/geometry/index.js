/**
 * Geometry module index
 * Exports all comprehensive geometry primitives
 */

export { BoxGeometry } from './BoxGeometry.js';
export { SphereGeometry } from './SphereGeometry.js';
export { PlaneGeometry } from './PlaneGeometry.js';
export { CylinderGeometry } from './CylinderGeometry.js';
export { ConeGeometry } from './ConeGeometry.js';
export { CircleGeometry } from './CircleGeometry.js';

// Complex geometry modules
export { BezierCurve } from './BezierCurve.js';
export { Spline } from './Spline.js';
export { ParametricSurface } from './ParametricSurface.js';
export { NURBSSurface } from './NURBSSurface.js';

// Original geometry processing utilities (LOD, spatial partition, optimize, etc.)
export {
  calculateBoundingBox,
  cloneGeometry,
  mergeGeometries,
  optimizeGeometry,
  calculateNormals,
  calculateTangents,
  unwrapUVs,
  SpatialPartition,
  createSpatialPartition,
  generateLOD,
  createBoundingSphere,
  analyzeGeometry,
  calculateSurfaceArea,
  GeometryProfiler
} from './GeometryUtils.js';

// Primitive → BufferGeometry bridge for Mesh rendering
export {
  isPrimitiveGeometry,
  toBufferGeometry,
  normalizeGeometry,
  installPrimitiveBridge
} from './PrimitiveBridge.js';

import { BoxGeometry } from './BoxGeometry.js';
import { SphereGeometry } from './SphereGeometry.js';
import { PlaneGeometry } from './PlaneGeometry.js';
import { CylinderGeometry } from './CylinderGeometry.js';
import { ConeGeometry } from './ConeGeometry.js';
import { CircleGeometry } from './CircleGeometry.js';
import { installPrimitiveBridge } from './PrimitiveBridge.js';

[
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  CircleGeometry
].forEach(installPrimitiveBridge);
