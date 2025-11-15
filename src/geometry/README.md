# Geometry Primitives

This module provides comprehensive implementations of basic 3D geometry primitives with proper UV mapping, normals, tangents, and performance optimizations.

## Features

- **Proper UV Mapping**: Each geometry includes correct texture coordinate mapping for seamless texturing
- **Accurate Normals**: Computed normals for proper lighting and shading
- **Tangent Generation**: Tangent vectors for normal mapping support
- **Performance Optimizations**: Efficient algorithms with appropriate data structures
- **Flexible Parameters**: Customizable segments and dimensions
- **Specialized Variants**: Different orientations and shapes for each primitive type

## Available Geometries

### BoxGeometry

A box/cube geometry with 6 faces and proper UV mapping.

```javascript
import { BoxGeometry } from './primitives.js';

const box = new BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
```

**Parameters:**
- `width`: Box width (default: 1)
- `height`: Box height (default: 1) 
- `depth`: Box depth (default: 1)
- `widthSegments`: Number of width subdivisions (default: 1)
- `heightSegments`: Number of height subdivisions (default: 1)
- `depthSegments`: Number of depth subdivisions (default: 1)

**Features:**
- Subdivided faces for smooth rendering
- Proper UV mapping for each face
- Seamed UV coordinates to avoid texture artifacts

### SphereGeometry

A sphere geometry using spherical coordinate mapping.

```javascript
import { SphereGeometry } from './primitives.js';

const sphere = new SphereGeometry(radius, widthSegments, heightSegments);
```

**Parameters:**
- `radius`: Sphere radius (default: 1)
- `widthSegments`: Number of longitudinal segments (default: 32)
- `heightSegments`: Number of latitudinal segments (default: 16)

**Features:**
- UV mapping using spherical coordinates
- Seam handling for proper texture mapping
- Normal vectors pointing outward from center
- Optimized vertex count for smooth appearance

### PlaneGeometry

A flat plane geometry lying on the XY plane.

```javascript
import { PlaneGeometry } from './primitives.js';

const plane = new PlaneGeometry(width, height, widthSegments, heightSegments);
```

**Parameters:**
- `width`: Plane width (default: 1)
- `height`: Plane height (default: 1)
- `widthSegments`: Number of width subdivisions (default: 1)
- `heightSegments`: Number of height subdivisions (default: 1)

**Features:**
- UV mapping from 0 to 1 across the plane
- Customizable orientation methods

**Special Methods:**
- `PlaneGeometry.createXZPlane()`: Creates plane lying on XZ plane
- `PlaneGeometry.createYZPlane()`: Creates plane lying on YZ plane

### CylinderGeometry

A cylinder (or conical frustum) with optional top and bottom caps.

```javascript
import { CylinderGeometry } from './primitives.js';

const cylinder = new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
```

**Parameters:**
- `radiusTop`: Top radius (default: 1)
- `radiusBottom`: Bottom radius (default: 1)
- `height`: Cylinder height (default: 1)
- `radialSegments`: Number of radial segments (default: 8)
- `heightSegments`: Number of height subdivisions (default: 1)
- `openEnded`: Whether to include caps (default: false)

**Features:**
- Supports both cylinders and cones (when radiusTop = 0)
- Proper side normal calculation considering slope
- UV mapping along height and circumference
- Optional caps for closed geometry

### ConeGeometry

A cone geometry with proper apex and base handling.

```javascript
import { ConeGeometry } from './primitives.js';

const cone = new ConeGeometry(radius, height, radialSegments, heightSegments, openEnded);
```

**Parameters:**
- `radius`: Base radius (default: 1)
- `height`: Cone height (default: 1)
- `radialSegments`: Number of radial segments (default: 8)
- `heightSegments`: Number of height subdivisions (default: 1)
- `openEnded`: Whether to include base cap (default: false)

**Features:**
- Fan triangulation from apex to base ring
- Proper normal calculation for conical surface
- UV mapping optimized for cone shape
- Support for pyramids via `ConeGeometry.createPyramid()`

**Special Methods:**
- `ConeGeometry.createPyramid()`: Creates a pyramid with rectangular base
- `ConeGeometry.createTruncatedCone()`: Creates a truncated cone

### CircleGeometry

A circular geometry supporting full circles, arcs, and rings.

```javascript
import { CircleGeometry } from './primitives.js';

const circle = new CircleGeometry(radius, segments, thetaStart, thetaLength);
```

**Parameters:**
- `radius`: Circle radius (default: 1)
- `segments`: Number of segments (default: 32)
- `thetaStart`: Starting angle in radians (default: 0)
- `thetaLength`: Total angle in radians (default: 2π)

**Features:**
- Triangle fan construction for efficient rendering
- UV mapping using circular coordinates
- Support for partial circles and arcs

**Special Methods:**
- `CircleGeometry.createSemicircle()`: Creates a half-circle
- `CircleGeometry.createRing()`: Creates an annulus (ring)
- `CircleGeometry.createArc()`: Creates a circular arc
- `CircleGeometry.createEllipse()`: Creates an ellipse

## Data Structure

Each geometry provides the following typed arrays:

```javascript
{
  vertices: Float32Array,     // Vertex positions (x, y, z)
  normals: Float32Array,      // Vertex normals (x, y, z)
  uvs: Float32Array,          // Texture coordinates (u, v)
  indices: Uint16Array | Uint32Array, // Triangle indices
  tangents?: Float32Array     // Tangent vectors for normal mapping (x, y, z, w)
}
```

## Utility Functions

### Factory Function

Create geometries with a single function call:

```javascript
import { createGeometry } from './primitives.js';

const sphere = createGeometry('sphere', { radius: 2, widthSegments: 64, heightSegments: 32 });
```

### Geometry Information

Get detailed information about any geometry:

```javascript
import { getGeometryInfo } from './primitives.js';

const info = getGeometryInfo(sphere);
console.log(info);
// {
//   type: 'SphereGeometry',
//   vertexCount: 2114,
//   triangleCount: 4224,
//   hasTangents: true,
//   indexType: 'Uint16Array',
//   memoryUsage: 33760
// }
```

### Common Utility Methods

Each geometry provides these utility methods:

```javascript
const vertexCount = geometry.getVertexCount();
const triangleCount = geometry.getTriangleCount();

// Geometry-specific methods:
if (geometry instanceof BoxGeometry) {
  const dimensions = geometry.getDimensions(); // { width, height, depth }
}

if (geometry instanceof SphereGeometry) {
  const radius = geometry.getRadius();
}

if (geometry instanceof CylinderGeometry) {
  const height = geometry.getHeight();
  const dimensions = geometry.getDimensions();
}
```

## Performance Considerations

1. **Index Type Selection**: Automatically chooses between Uint16Array and Uint32Array based on vertex count
2. **Memory Efficiency**: Uses typed arrays for optimal GPU upload and rendering
3. **Segment Optimization**: Minimum segment counts prevent degenerate geometry
4. **Tangent Generation**: Orthonormalized tangents prevent shading artifacts

## Usage Examples

### Basic Scene Setup

```javascript
import { Scene, Mesh } from '../core/mesh.js';
import { BoxGeometry, SphereGeometry, PlaneGeometry } from './primitives.js';

// Create a scene
const scene = new Scene();

// Add a box
const boxGeometry = new BoxGeometry(2, 2, 2);
const boxMesh = new Mesh(boxGeometry);
scene.add(boxMesh);

// Add a sphere
const sphereGeometry = new SphereGeometry(1.5, 32, 16);
const sphereMesh = new Mesh(sphereGeometry);
sphereMesh.position.set(3, 0, 0);
scene.add(sphereMesh);

// Add a ground plane
const planeGeometry = new PlaneGeometry(10, 10);
const planeMesh = new Mesh(planeGeometry);
planeMesh.position.set(0, -2, 0);
scene.add(planeMesh);
```

### Textured Materials

```javascript
import { BasicMaterial } from '../materials/basic.js';

// Create textured geometry
const texturedSphere = new SphereGeometry(1, 64, 32);

// Apply material with texture
const material = new BasicMaterial({
  texture: 'earth_texture.jpg'
});

const sphereMesh = new Mesh(texturedSphere);
sphereMesh.material = material;
```

### Performance-Optimized Rendering

```javascript
// For high-performance rendering, use appropriate segment counts
const highQualitySphere = new SphereGeometry(1, 64, 32); // High detail
const lowQualitySphere = new SphereGeometry(1, 16, 8);   // Lower detail

// Use distance-based LOD (Level of Detail)
function createSphereForDistance(distance) {
  if (distance < 10) return new SphereGeometry(1, 64, 32); // Close - high detail
  if (distance < 50) return new SphereGeometry(1, 32, 16); // Medium - medium detail
  return new SphereGeometry(1, 16, 8);                      // Far - low detail
}
```

## API Reference

### Constructor Parameters Summary

| Geometry | Parameters | Defaults |
|----------|------------|----------|
| BoxGeometry | width, height, depth, widthSeg, heightSeg, depthSeg | 1,1,1,1,1,1 |
| SphereGeometry | radius, widthSeg, heightSeg | 1, 32, 16 |
| PlaneGeometry | width, height, widthSeg, heightSeg | 1, 1, 1, 1 |
| CylinderGeometry | radiusTop, radiusBottom, height, radialSeg, heightSeg, openEnded | 1,1,1,8,1,false |
| ConeGeometry | radius, height, radialSeg, heightSeg, openEnded | 1,1,8,1,false |
| CircleGeometry | radius, segments, thetaStart, thetaLength | 1, 32, 0, 2π |

### Memory Usage Guidelines

| Geometry Type | Typical Vertex Count | Memory Usage |
|---------------|---------------------|--------------|
| Low detail (game objects) | 100-1000 | 10-50 KB |
| Medium detail (general use) | 1000-10000 | 50-500 KB |
| High detail (close-up objects) | 10000+ | 500+ KB |

Choose appropriate segment counts based on your performance requirements and viewing distance.