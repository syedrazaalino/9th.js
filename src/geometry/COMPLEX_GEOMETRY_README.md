# Complex Geometry System

This directory contains advanced 3D geometry modules including Bezier curves, splines, parametric surfaces, and NURBS surfaces.

## Modules

### BezierCurve.js
Comprehensive Bezier curve handling with evaluation, derivatives, and tessellation capabilities.

**Key Features:**
- Polynomial and rational Bezier curves
- Evaluation methods with derivative calculations
- Curve tessellation for rendering
- Surface of revolution generation
- Extrusion along paths
- Closest point finding
- Curve subdivision
- Integration with BufferGeometry

**Usage:**
```javascript
import { BezierCurve } from './geometry/BezierCurve.js';

// Create a cubic Bezier curve
const points = [
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(2, -1, 0),
    new Vector3(3, 0, 0)
];

const curve = new BezierCurve(points);

// Evaluate point and first derivative
const point = curve.evaluate(0.5);
const derivatives = curve.evaluate(0.5, 2); // Returns [point, first_deriv, second_deriv]

// Generate tessellated geometry
const geometry = curve.tessellate(50);

// Create surface of revolution
const surface = curve.revolve(2 * Math.PI, 30);
```

### Spline.js
Comprehensive cubic spline handling with various spline types, derivatives, and tessellation capabilities.

**Key Features:**
- Linear, quadratic, cubic splines
- Catmull-Rom, Hermite, and B-splines
- Multiple spline types with tension control
- Curve tessellation and surface sweeping
- Automatic tangent calculation
- Curve conversion between types

**Usage:**
```javascript
import { Spline } from './geometry/Spline.js';

// Create a Catmull-Rom spline
const points = [
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(2, -1, 0),
    new Vector3(3, 0, 0),
    new Vector3(4, 2, 0)
];

const spline = new Spline(points, 'catmull-rom', 0.5);

// Evaluate with derivatives
const point = spline.evaluate(0.5);
const derivatives = spline.evaluate(0.5, 2);

// Generate tessellated geometry
const geometry = spline.tessellate(100);

// Sweep profile along spline path
const profile = new BezierCurve([/* profile points */]);
const sweptSurface = spline.sweep(profile, 50);
```

### ParametricSurface.js
Custom parametric surface handling with evaluation, derivatives, and tessellation capabilities.

**Key Features:**
- Custom surface functions
- Partial derivative calculations
- Surface normal and curvature computation
- Adaptive tessellation based on curvature
- Surface area and volume calculation
- Ray intersection testing
- Path sampling along parameters

**Usage:**
```javascript
import { ParametricSurface } from './geometry/ParametricSurface.js';

// Define a custom surface function
const surfaceFunction = (u, v) => {
    const x = Math.cos(u) * Math.cos(v);
    const y = Math.sin(u) * Math.cos(v);
    const z = Math.sin(v);
    return new Vector3(x, y, z);
};

const surface = new ParametricSurface(surfaceFunction, [0, 2*Math.PI], [0, Math.PI]);

// Evaluate surface point
const point = surface.evaluate(0.5, 0.25);

// Compute geometric properties
const normal = surface.computeNormal(0.5, 0.25);
const curvatures = surface.computeCurvatures(0.5, 0.25);

// Generate tessellated geometry
const geometry = surface.tessellate(50, 30);

// Use predefined surfaces
const sphere = ParametricSurface.createSphere(1);
const torus = ParametricSurface.createTorus(2, 1);
```

### NURBSSurface.js
Comprehensive NURBS (Non-Uniform Rational B-Spline) surface generation with control point handling, knot vector management, evaluation, derivatives, and tessellation.

**Key Features:**
- Non-uniform rational B-spline surfaces
- Control point and knot vector manipulation
- Surface evaluation with derivatives
- Surface trimming and knot insertion
- Surface transformation and deformation
- Adaptive tessellation
- Rational and non-rational surfaces

**Usage:**
```javascript
import { NURBSSurface } from './geometry/NURBSSurface.js';

// Create control points grid
const controlPoints = [];
for (let v = 0; v <= 3; v++) {
    const row = [];
    for (let u = 0; u <= 3; u++) {
        const x = u - 1.5;
        const y = v - 1.5;
        const z = Math.sin(x) * Math.cos(y);
        row.push(new Vector3(x, y, z));
    }
    controlPoints.push(row);
}

// Create NURBS surface
const surface = new NURBSSurface(controlPoints);

// Evaluate surface point
const point = surface.evaluate(0.5, 0.5);

// Compute derivatives
const derivatives = surface.evaluate(0.5, 0.5, 2);

// Generate tessellated geometry
const geometry = surface.tessellate(20, 20);

// Use predefined NURBS surfaces
const plane = NURBSSurface.createPlane(2, 2);
const sphere = NURBSSurface.createSphere(1);
const torus = NURBSSurface.createTorus(2, 1);

// Surface manipulation
const trimmed = surface.trim([0.25, 0.75], [0.25, 0.75]);
const withKnot = surface.insertKnot('u', 0.5);
const transformed = surface.transform(matrix4);
```

## TypeScript Support

All modules include comprehensive TypeScript type definitions located in `/types/geometry/`:

- `bezier-curve.d.ts` - BezierCurve type definitions
- `spline.d.ts` - Spline type definitions  
- `parametric-surface.d.ts` - ParametricSurface type definitions
- `nurbs-surface.d.ts` - NURBSSurface type definitions

## Integration with BufferGeometry

All modules integrate seamlessly with the BufferGeometry system:

- `tessellate()` methods return BufferGeometry instances
- Proper vertex, normal, UV, and index data generation
- Adaptive tessellation based on surface curvature
- Efficient caching for repeated evaluations

## Performance Features

- **Caching**: Built-in evaluation caching for repeated queries
- **Adaptive Tessellation**: Dynamic subdivision based on geometric complexity
- **Memory Optimization**: Efficient storage and reuse of computed values
- **Batch Processing**: Vectorized operations where possible

## Mathematical Foundation

The modules implement robust mathematical algorithms:

- **Bernstein Polynomials**: For Bezier curve evaluation
- **B-spline Basis Functions**: For NURBS surface computation
- **Finite Difference Methods**: For derivative approximations
- **Newton-Raphson Methods**: For closest point finding
- **Curvature-based Tessellation**: For optimal surface subdivision

## Examples

See the `examples/` directory for complete usage examples and demonstrations of all geometry modules.
