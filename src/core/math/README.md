# 9th.js Core Math Library

A comprehensive mathematical library for the 9th.js framework, providing efficient and feature-rich classes for vectors, matrices, quaternions, and colors.

## Features

- **Vector Classes**: 2D, 3D, and 4D vector support with comprehensive operations
- **Matrix Classes**: 3x3 and 4x4 matrices for transformations and linear algebra
- **Quaternion Class**: Gimbal-lock-free rotation representation
- **Color Class**: Multi-color space support (RGB, HSL, HSV, CMYK, Hex)
- **MathUtils**: Utility functions for common mathematical operations
- **Performance Optimized**: Efficient algorithms with minimal allocations
- **ES6 Modules**: Modern JavaScript with full TypeScript compatibility

## Installation

```bash
npm install 9th.js
```

## Quick Start

```javascript
import { Vector3, Matrix4, Quaternion, Color, MathUtils } from '9th.js';

// Create a 3D position
const position = new Vector3(10, 20, 5);

// Create a rotation quaternion
const rotation = Quaternion.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);

// Create a transformation matrix
const matrix = Matrix4.translation(1, 2, 3)
  .multiply(Matrix4.rotationFromQuaternion(rotation))
  .multiply(Matrix4.scale(2, 2, 2));

// Create a color
const color = Color.fromHSL(0.5, 0.8, 0.6);

// Perform calculations
const distance = position.length();
const normalized = position.clone().normalize();
const transformed = matrix.multiplyVector3(position);

// Utility functions
const angle = MathUtils.degToRad(45);
const clamped = MathUtils.clamp(15, 0, 10);
```

## API Reference

### Vector Classes

#### Vector2

```javascript
const v = new Vector2(x, y);

// Basic operations
v.set(3, 4);
v.copy(otherVector);
v.add(vector);
v.subtract(vector);
v.multiplyScalar(2);
v.normalize();

// Vector-specific operations
const length = v.length();
const dot = v.dot(otherVector);
const angle = v.angle();
const distance = v.distanceTo(otherVector);

// Static methods
const v1 = Vector2.unitX;
const v2 = Vector2.distance(vectorA, vectorB);
const result = Vector2.lerp(vecA, vecB, alpha);
```

#### Vector3

```javascript
const v = new Vector3(x, y, z);

// 3D operations
v.cross(vector); // Cross product
v.setFromSpherical(radius, phi, theta);
v.applyQuaternion(quaternion);
v.projectOnVector(targetVector);
v.reflect(normal);

// Direction vectors
const up = Vector3.up;
const forward = Vector3.forward;
const right = Vector3.right;
```

#### Vector4

```javascript
const v = new Vector4(x, y, z, w);

// Homogeneous coordinates
v.toVector3(); // Convert to 3D
const homogeneousPoint = Vector4.homogeneousPoint3D;
const homogeneousDirection = Vector4.homogeneousDirection3D;
```

### Matrix Classes

#### Matrix3

```javascript
const m = new Matrix3();

// Transform matrices
m.makeRotation(angle);
m.makeScale(sx, sy);
m.makeTranslation(tx, ty);

// Operations
const determinant = m.determinant();
m.invert();
m.transpose();
const result = m.multiplyVector3(vector);
const identity = Matrix3.identity;
```

#### Matrix4

```javascript
const m = new Matrix4();

// Create transformation matrices
const rotation = Matrix4.rotationFromAxisAngle(axis, angle);
const scale = Matrix4.scale(x, y, z);
const translation = Matrix4.translation(x, y, z);

// Camera matrices
const view = Matrix4.lookAt(eye, target, up);
const projection = Matrix4.perspective(fov, aspect, near, far);
const orthographic = Matrix4.orthographic(left, right, top, bottom, near, far);

// Extract components
const rotation3x3 = matrix.extractRotation();
const translation = matrix.extractTranslation();
const scale = matrix.extractScaling();
```

### Quaternion

```javascript
const q = new Quaternion(x, y, z, w);

// Create from rotations
q.setFromAxisAngle(axis, angle);
q.setFromEuler(euler);
q.setFromRotationMatrix(matrix4);
q.setFromDirection(direction, up);

// Operations
q.multiply(otherQuaternion);
q.slerp(targetQuaternion, t); // Spherical interpolation
q.conjugate();
q.normalize();

// Apply rotation to vectors
const rotatedVector = q.applyToVector3(vector);
```

### Color

```javascript
const color = new Color(r, g, b);

// Create from different color spaces
color.setHex('#FF0000');
color.setHSL(h, s, l);
color.setHSV(h, s, v);
color.setCMYK(c, m, y, k);

// Color space conversions
const hex = color.getHex();
const hsl = color.getHSL();
const hsv = color.getHSV();
const cmyk = color.toCMYK();

// Color operations
color.lerp(otherColor, t);
color.multiply(otherColor);
color.invert();
color.clamp();

// Preset colors
const red = Color.red;
const white = Color.white;
const transparent = new Color(1, 1, 1, 0);
```

### MathUtils

```javascript
// Angle conversions
const radians = MathUtils.degToRad(180);
const degrees = MathUtils.radToDeg(Math.PI);

// Interpolation
const value = MathUtils.lerp(a, b, t);
const smooth = MathUtils.smoothstep(edge0, edge1, x);
const barycentric = MathUtils.barycentric(a, b, c, u, v);

// Clamping and ranges
const clamped = MathUtils.clamp(value, min, max);
const approx = MathUtils.approxEqual(a, b);

// Random numbers
const random = MathUtils.random(min, max);
const normal = MathUtils.randomNormal(mean, stdDev);

// Color conversions
const hex = MathUtils.rgbToHex(r, g, b);
const rgb = MathUtils.hexToRgb('#FF0000');

// Number theory
const gcd = MathUtils.gcd(a, b);
const lcm = MathUtils.lcm(a, b);
const prime = MathUtils.isPrime(n);
const comb = MathUtils.combination(n, k);
```

## Constants

```javascript
import { CONSTANTS, VECTORS, MATRICES, COLORS } from '9th.js';

// Mathematical constants
console.log(CONSTANTS.PI);
console.log(CONSTANTS.E);
console.log(CONSTANTS.PHI);

// Pre-constructed vectors
const up = VECTORS.UP;
const right = VECTORS.RIGHT;
const identity3 = MATRICES.IDENTITY3;

// Preset colors
const red = COLORS.RED;
const white = COLORS.WHITE;
```

## Performance Tips

### Vector Operations

```javascript
// ✅ Good: Reuse vectors when possible
const temp = new Vector3();
for (let i = 0; i < 1000; i++) {
    temp.set(0, i, 0);
    result.add(temp);
}

// ❌ Avoid: Creating new vectors in loops
for (let i = 0; i < 1000; i++) {
    result.add(new Vector3(0, i, 0)); // Creates 1000 new vectors
}
```

### Matrix Operations

```javascript
// ✅ Good: Chain operations
const matrix = Matrix4.translation(x, y, z)
    .multiply(Matrix4.rotationFromQuaternion(quat))
    .multiply(Matrix4.scale(sx, sy, sz));

// ❌ Avoid: Separate operations
const t = new Matrix4().makeTranslation(x, y, z);
const r = new Matrix4().makeRotationFromQuaternion(quat);
const s = new Matrix4().makeScale(sx, sy, sz);
const matrix = t.multiply(r).multiply(s);
```

### Quaternion Operations

```javascript
// ✅ Good: Use quaternions for rotations
const q1 = Quaternion.fromAxisAngle(axis, angle1);
const q2 = Quaternion.fromAxisAngle(axis, angle2);
q1.multiply(q2); // Combines rotations

// ❌ Avoid: Euler angles for complex rotations
// Subject to gimbal lock
```

## Browser Compatibility

- **Modern Browsers**: Full ES6+ support
- **Legacy Browsers**: Use Babel for transpilation
- **Mobile**: Optimized for mobile devices

## Testing

Run the comprehensive test suite:

```bash
node src/core/math/test.js
```

The tests cover:
- Basic operations for all classes
- Mathematical correctness
- Edge cases and boundary conditions
- Performance characteristics
- Cross-class interactions

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## Changelog

### v1.0.0
- Initial release
- Vector2, Vector3, Vector4 classes
- Matrix3, Matrix4 classes  
- Quaternion class
- Color class with multi-color space support
- MathUtils utilities
- Comprehensive test suite
- Performance optimizations