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

// Geometry bridge utilities
export {
  isPrimitiveGeometry,
  toBufferGeometry,
  normalizeGeometry,
  installPrimitiveBridge
} from './GeometryUtils.js';

// Install toBufferGeometry on primitives
import { BoxGeometry } from './BoxGeometry.js';
import { SphereGeometry } from './SphereGeometry.js';
import { PlaneGeometry } from './PlaneGeometry.js';
import { CylinderGeometry } from './CylinderGeometry.js';
import { ConeGeometry } from './ConeGeometry.js';
import { CircleGeometry } from './CircleGeometry.js';
import { installPrimitiveBridge } from './GeometryUtils.js';

[
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  CircleGeometry
].forEach(installPrimitiveBridge);