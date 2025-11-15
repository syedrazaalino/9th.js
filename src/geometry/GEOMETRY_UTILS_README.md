# Geometry Utilities

A comprehensive collection of geometry processing utilities for 3D applications, featuring optimization algorithms, spatial partitioning, UV unwrapping, and performance tools.

## Features

- **Geometry Merging**: Combine multiple geometries efficiently
- **Geometry Cloning**: Deep copy geometries with proper memory management
- **Geometry Optimization**: Remove duplicate vertices and optimize memory usage
- **Normal & Tangent Calculations**: Compute vertex normals and tangents for lighting
- **UV Unwrapping**: Planar, cylindrical, and spherical UV mapping
- **Spatial Partitioning**: Octree-based spatial partitioning for performance
- **Level of Detail (LOD)**: Automatic LOD generation for performance optimization
- **Geometry Analysis**: Statistics and performance profiling tools

## API Reference

### Core Utilities

#### `calculateBoundingBox(geometry)`
Calculate the bounding box for a geometry.

**Parameters:**
- `geometry` - Geometry object with vertices array

**Returns:** Object with `min`, `max`, `center`, and `size` properties

```javascript
const box = new BoxGeometry(2, 2, 2);
const bounds = calculateBoundingBox(box);
console.log(bounds.center); // { x: 0, y: 0, z: 0 }
console.log(bounds.size);   // { x: 2, y: 2, z: 2 }
```

#### `cloneGeometry(geometry)`
Create a deep copy of a geometry.

**Parameters:**
- `geometry` - Source geometry to clone

**Returns:** New geometry with copied data

```javascript
const original = new BoxGeometry(1, 1, 1);
const cloned = cloneGeometry(original);
// Modifications to cloned won't affect original
```

### Geometry Operations

#### `mergeGeometries(geometries)`
Merge multiple geometries into a single geometry.

**Parameters:**
- `geometries` - Array of geometries to merge

**Returns:** Single merged geometry

```javascript
const box1 = new BoxGeometry(1, 1, 1);
const box2 = new BoxGeometry(1, 1, 1);
translateGeometry(box2, 2, 0, 0);
const merged = mergeGeometries([box1, box2]);
```

#### `optimizeGeometry(geometry, tolerance = 1e-6)`
Remove duplicate vertices and optimize geometry.

**Parameters:**
- `geometry` - Geometry to optimize
- `tolerance` - Merging tolerance (default: 1e-6)

**Returns:** Optimized geometry with fewer vertices

```javascript
const box = new BoxGeometry(1, 1, 1);
const optimized = optimizeGeometry(box, 0.001);
```

### Normals and Lighting

#### `calculateNormals(geometry)`
Calculate vertex normals for proper lighting.

**Parameters:**
- `geometry` - Geometry object with vertices and optional indices

**Returns:** Float32Array of normalized normals

```javascript
const plane = new PlaneGeometry(2, 2);
const normals = calculateNormals(plane);
```

#### `calculateTangents(geometry)`
Calculate tangent vectors for normal mapping.

**Parameters:**
- `geometry` - Geometry with vertices, normals, and UVs

**Returns:** Float32Array of tangents (x, y, z, w format)

```javascript
const sphere = new SphereGeometry(1, 8, 6);
sphere.uvs = unwrapUVs(sphere, 'spherical');
const tangents = calculateTangents(sphere);
```

### UV Mapping

#### `unwrapUVs(geometry, method = 'planar')`
Generate UV coordinates for texture mapping.

**Parameters:**
- `geometry` - Geometry to unwrap
- `method` - Unwrapping method: 'planar', 'cylindrical', or 'spherical'

**Returns:** Float32Array of UV coordinates

```javascript
const box = new BoxGeometry(2, 2, 2);

// Planar projection (default)
const planarUVs = unwrapUVs(box, 'planar');

// Cylindrical unwrapping
const cylinderUVs = unwrapUVs(box, 'cylindrical');

// Spherical unwrapping
const sphereUVs = unwrapUVs(box, 'spherical');
```

### Spatial Partitioning

#### `SpatialPartition` class
Octree-based spatial partitioning for efficient collision detection and rendering optimization.

**Constructor:**
```javascript
new SpatialPartition(bounds, maxObjects = 10, maxLevels = 5, level = 0)
```

**Methods:**
- `clear()` - Remove all objects from the partition
- `split()` - Subdivide the partition into 8 octants
- `insert(object)` - Add an object to the partition
- `retrieve(returnObjects, object)` - Get objects that might intersect with the given object

```javascript
const partition = createSpatialPartition(geometry, 4, 3);

// Add objects for spatial queries
partition.insert({
  bounds: { min: {x: 0, y: 0, z: 0}, max: {x: 1, y: 1, z: 1} },
  data: 'myObject'
});

// Retrieve potentially colliding objects
const nearby = [];
partition.retrieve(nearby, { bounds: { min: {x: 0.5, y: 0.5, z: 0.5}, max: {x: 1.5, y: 1.5, z: 1.5} } });
```

#### `createSpatialPartition(geometry, maxObjects = 10, maxLevels = 5)`
Create a spatial partition for a geometry.

**Parameters:**
- `geometry` - Source geometry
- `maxObjects` - Maximum objects per partition node
- `maxLevels` - Maximum partition depth

**Returns:** SpatialPartition instance

### Performance Optimization

#### `generateLOD(geometry, levels = 3)`
Generate Level of Detail variations for performance optimization.

**Parameters:**
- `geometry` - Source geometry
- `levels` - Number of LOD levels to generate

**Returns:** Array of LOD objects with distance and geometry

```javascript
const sphere = new SphereGeometry(1, 16, 12);
const lodLevels = generateLOD(sphere, 4);

lodLevels.forEach((level, index) => {
  console.log(`LOD ${index}: Distance ${level.distance}, Vertices: ${level.geometry.vertices.length / 3}`);
});
```

#### `createBoundingSphere(geometry)`
Create a bounding sphere for frustum culling.

**Parameters:**
- `geometry` - Geometry to analyze

**Returns:** Object with center and radius properties

```javascript
const sphere = createBoundingSphere(geometry);
```

### Analysis and Profiling

#### `analyzeGeometry(geometry)`
Get comprehensive statistics about a geometry.

**Parameters:**
- `geometry` - Geometry to analyze

**Returns:** Object with statistics

```javascript
const stats = analyzeGeometry(geometry);
console.log({
  vertexCount: stats.vertexCount,
  triangleCount: stats.triangleCount,
  surfaceArea: stats.surfaceArea,
  memoryUsage: stats.memoryUsage
});
```

#### `GeometryProfiler` class
Performance profiling for geometry operations.

**Constructor:**
```javascript
new GeometryProfiler()
```

**Methods:**
- `startOperation(name)` - Start timing an operation
- `endOperation(operation)` - End timing an operation
- `getReport()` - Get profiling report
- `clear()` - Clear all profiling data

```javascript
const profiler = new GeometryProfiler();

// Profile an operation
const op = profiler.startOperation('Geometry Merging');
const merged = mergeGeometries([box1, box2]);
profiler.endOperation(op);

// Get report
const report = profiler.getReport();
console.log(report);
```

## Usage Examples

### Basic Geometry Processing

```javascript
import { BoxGeometry, PlaneGeometry } from './primitives.js';
import {
  cloneGeometry,
  mergeGeometries,
  optimizeGeometry,
  calculateNormals
} from './GeometryUtils.js';

// Create geometries
const box = new BoxGeometry(1, 1, 1);
const plane = new PlaneGeometry(2, 2);

// Clone and modify
const boxCopy = cloneGeometry(box);
translateGeometry(boxCopy, 0, 1, 0);

// Merge geometries
const merged = mergeGeometries([box, boxCopy]);

// Optimize
const optimized = optimizeGeometry(merged);

// Calculate normals
const normals = calculateNormals(optimized);
```

### Advanced Spatial Partitioning

```javascript
import { createSpatialPartition } from './GeometryUtils.js';

// Create spatial partition
const partition = createSpatialPartition(geometry, 10, 4);

// Add scene objects
scene.objects.forEach(obj => {
  partition.insert({
    bounds: calculateBoundingBox(obj),
    mesh: obj
  });
});

// Query nearby objects
function getNearbyObjects(position, radius) {
  const queryBounds = {
    min: { x: position.x - radius, y: position.y - radius, z: position.z - radius },
    max: { x: position.x + radius, y: position.y + radius, z: position.z + radius }
  };
  
  const nearby = [];
  partition.retrieve(nearby, { bounds: queryBounds });
  return nearby.map(obj => obj.mesh);
}
```

### LOD Implementation

```javascript
import { generateLOD } from './GeometryUtils.js';

class LODMesh {
  constructor(geometry) {
    this.levels = generateLOD(geometry, 4);
    this.currentLevel = 0;
  }

  updateLOD(cameraPosition) {
    const distance = this.getDistanceToCamera(cameraPosition);
    
    for (let i = 0; i < this.levels.length; i++) {
      if (distance < this.levels[i].distance) {
        this.currentLevel = i;
        break;
      }
    }
  }

  getCurrentGeometry() {
    return this.levels[this.currentLevel].geometry;
  }
}
```

### Performance Monitoring

```javascript
import { GeometryProfiler } from './GeometryUtils.js';

class PerformanceManager {
  constructor() {
    this.profiler = new GeometryProfiler();
  }

  profileGeometryOperation(name, operation) {
    const op = this.profiler.startOperation(name);
    const result = operation();
    this.profiler.endOperation(op);
    return result;
  }

  getPerformanceReport() {
    return this.profiler.getReport();
  }
}

// Usage
const perfManager = new PerformanceManager();
const merged = perfManager.profileGeometryOperation('Merge', () => {
  return mergeGeometries([box1, box2, box3]);
});

console.log(perfManager.getPerformanceReport());
```

## Best Practices

1. **Memory Management**: Always clone geometries when you need to modify them without affecting originals
2. **Optimization**: Use `optimizeGeometry` after merging or complex operations to reduce memory usage
3. **Spatial Partitioning**: Implement spatial partitioning for scenes with many objects
4. **LOD**: Use LOD generation for distant objects to improve rendering performance
5. **Normals**: Calculate normals after any geometry modifications that affect vertices
6. **Tangents**: Calculate tangents only when needed for normal mapping
7. **Profiling**: Use `GeometryProfiler` to monitor performance bottlenecks

## Performance Considerations

- **Optimization**: Geometry optimization can significantly reduce memory usage for complex models
- **Spatial Partitioning**: Reduces collision detection complexity from O(n²) to O(log n)
- **LOD**: Automatically switches to lower-detail models based on distance
- **Culling**: Use bounding spheres and spatial partitioning for efficient frustum culling

## Browser Compatibility

All utilities use standard Web APIs and Float32Array, ensuring compatibility with modern browsers. For Internet Explorer support, consider using polyfills for Float32Array and performance.now().

## License

MIT License - feel free to use in your projects!