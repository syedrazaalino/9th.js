# Mesh Class and Geometry Management System

The Mesh class provides a comprehensive solution for 3D rendering that combines BufferGeometry with materials, including advanced features like geometry caching, mesh optimization, Level of Detail (LOD) support, and efficient draw call batching.

## Core Features

### 1. **Mesh Class (`Mesh.js`)**
The main mesh class that combines geometry and materials for rendering:

```javascript
import { Mesh, MeshConfig, BufferGeometry, Material } from './Mesh.js';

// Create mesh configuration
const config = new MeshConfig();
config.castShadows = true;
config.receiveShadows = true;
config.frustumCulled = true;

// Create mesh
const mesh = new Mesh(geometry, material, config);
```

#### Key Properties:
- **geometry**: BufferGeometry instance for vertex data
- **material**: Material instance for rendering properties
- **visible**: Toggle mesh visibility
- **renderOrder**: Override rendering order
- **castShadows**: Enable shadow casting
- **receiveShadows**: Enable shadow receiving
- **frustumCulled**: Enable frustum culling optimization

### 2. **Geometry Caching (`GeometryCache`)**
Efficient resource management with LRU (Least Recently Used) caching:

```javascript
import { MeshBuilder } from './Mesh.js';

// Create cached mesh
const mesh = MeshBuilder.createCachedMesh(
  'cube_geometry_v1',
  () => createCubeGeometry(gl),
  material
);

// Access global geometry cache
const cacheStats = Mesh.geometryCache.getStats();
console.log('Cache utilization:', cacheStats.utilization);
```

#### Features:
- **Automatic caching** based on geometry properties
- **LRU eviction** when cache limit reached
- **Cache statistics** for performance monitoring
- **Configurable cache size** (default: 1000 geometries)

### 3. **Mesh Optimization (`MeshOptimizer`)**
Performance improvements through vertex optimization and reindexing:

```javascript
import { MeshBuilder } from './Mesh.js';

// Create optimized mesh
const optimizedMesh = MeshBuilder.createOptimizedMesh(
  geometry,
  material,
  2  // optimization level (0-3)
);
```

#### Optimization Techniques:
- **Duplicate vertex removal**
- **Index buffer optimization** for cache locality
- **Automatic LOD generation**
- **Configurable optimization levels**

### 4. **Level of Detail (LOD) System**
Automatic geometry switching based on camera distance:

```javascript
import { MeshBuilder, LODLevel } from './Mesh.js';

// Create LOD mesh
const lodMesh = MeshBuilder.createLODMesh(
  baseGeometry,
  baseMaterial,
  [0, 50, 100, 200, 500],  // LOD switch distances
  [material1, material2, material3, material4, material5]  // optional materials per LOD
);

// Manual LOD control
lodMesh.setAutoLOD(false);
lodMesh.updateLOD(75);  // Force LOD level 1
```

#### LOD Features:
- **Automatic LOD switching** based on camera distance
- **Custom LOD distances** configuration
- **Per-LOD materials** for progressive detail reduction
- **Manual LOD override** when needed

### 5. **Draw Call Batching (`DrawCallBatcher`)**
Efficient rendering by grouping meshes with similar materials:

```javascript
import { Mesh } from './Mesh.js';

// Add mesh to global batcher
Mesh.globalBatcher.addToBatch(mesh, material);

// Get batches for rendering
const batches = Mesh.globalBatcher.getBatches();

for (const batch of batches) {
  // Render all meshes in batch with same material
  for (const mesh of batch.meshes) {
    mesh.render(gl, batch.material);
  }
}
```

#### Batching Benefits:
- **Reduced draw calls** by grouping similar materials
- **Automatic material grouping** based on shader and blending
- **Performance statistics** for optimization analysis
- **Batch-level rendering** for efficient state changes

## Usage Examples

### Basic Mesh Creation

```javascript
import { Mesh, MeshConfig, BufferGeometry } from './Mesh.js';

// Create WebGL context
const gl = canvas.getContext('webgl');

// Create geometry
const geometry = createCubeGeometry(gl);

// Create material
const material = new PhongMaterial(shader);
material.setProperty('uDiffuse', [1.0, 0.5, 0.5]);

// Create mesh configuration
const config = new MeshConfig();
config.castShadows = true;
config.receiveShadows = true;
config.layer = 1;
config.priority = 10;

// Create mesh
const mesh = new Mesh(geometry, material, config);
mesh.setPosition(0, 0, 0);
mesh.setScale(2, 2, 2);
```

### LOD Implementation

```javascript
import { MeshBuilder } from './Mesh.js';

// Create base high-detail geometry
const highDetailGeometry = createSphereGeometry(gl, 32);

// Create materials for each LOD level
const materials = [
  new PhongMaterial(detailedShader),    // Level 0: Full detail
  new PhongMaterial(mediumShader),     // Level 1: Medium detail
  new PhongMaterial(simpleShader),     // Level 2: Low detail
  new BasicMaterial(basicShader)       // Level 3: Minimal detail
];

// Set different properties for each level
materials.forEach((material, index) => {
  const brightness = 1.0 - (index * 0.2);
  material.setProperty('uDiffuse', [brightness, brightness, brightness]);
});

// Create LOD mesh
const lodDistances = [0, 50, 100, 200];
const lodMesh = MeshBuilder.createLODMesh(
  highDetailGeometry,
  materials[0],
  lodDistances,
  materials
);

lodMesh.setAutoLOD(true);
```

### Performance Optimization

```javascript
import { MeshBuilder } from './Mesh.js';

// Create cached geometry for frequently used objects
const cachedCube = MeshBuilder.createCachedMesh(
  'cube_1x1x1',
  () => createCubeGeometry(gl),
  cubeMaterial
);

// Create optimized mesh for complex geometry
const complexGeometry = generateTerrainGeometry(gl);
const optimizedTerrain = MeshBuilder.createOptimizedMesh(
  complexGeometry,
  terrainMaterial,
  3  // Maximum optimization
);

// Enable frustum culling for performance
optimizedTerrain.frustumCulled = true;
optimizedTerrain.setBoundingSphere({ center: { x: 0, y: 0, z: 0 }, radius: 500 });
```

### Scene-Level Rendering with Batching

```javascript
class SceneRenderer {
  constructor() {
    this.meshes = [];
    this.batcher = new Mesh.globalBatcher.constructor();
  }

  addMesh(mesh) {
    this.meshes.push(mesh);
    this.batcher.addToBatch(mesh, mesh.getMaterial());
  }

  render(gl, camera) {
    // Update all meshes
    for (const mesh of this.meshes) {
      mesh.update(16.67, camera); // 60 FPS timestep
    }

    // Render by batches for efficiency
    const batches = this.batcher.getBatches();
    
    for (const batch of batches) {
      // Set up render state once per batch
      batch.material.apply(gl);
      
      // Render all meshes in batch
      for (const mesh of batch.meshes) {
        mesh.render(gl, batch.material);
      }
    }
  }

  getPerformanceStats() {
    return {
      totalMeshes: this.meshes.length,
      totalBatches: this.batcher.getStats(),
      cacheStats: Mesh.geometryCache.getStats()
    };
  }
}
```

## Advanced Features

### Custom LOD Levels

```javascript
import { LODLevel } from './Mesh.js';

// Create custom LOD configuration
const lodLevel1 = new LODLevel(50, mediumDetailGeometry, mediumMaterial);
const lodLevel2 = new LODLevel(100, lowDetailGeometry, lowMaterial);

// Add to mesh
mesh.addLODLevel(lodLevel1);
mesh.addLODLevel(lodLevel2);

// Set custom LOD distances
mesh.setLODDistances([0, 75, 150, 300]);
```

### Mesh Cloning and Sharing

```javascript
// Clone mesh for multiple instances
const mesh1 = new Mesh(geometry, material, config);
const mesh2 = mesh1.clone();

// Set different positions
mesh1.setPosition(-10, 0, 0);
mesh2.setPosition(10, 0, 0);

// Share geometry between meshes (memory efficient)
const sharedGeometry = createCubeGeometry(gl);
const mesh3 = new Mesh(sharedGeometry, material1, config);
const mesh4 = new Mesh(sharedGeometry, material2, config);
```

### Performance Monitoring

```javascript
// Get mesh performance statistics
const stats = mesh.getRenderStats();
console.log('Draw calls:', stats.drawCalls);
console.log('Triangles rendered:', stats.triangles);
console.log('Vertices processed:', stats.vertices);

// Reset statistics each frame
mesh.resetRenderStats();

// Monitor global performance
const globalStats = {
  geometryCache: Mesh.geometryCache.getStats(),
  batcherStats: Mesh.globalBatcher.getStats()
};
```

## Configuration Options

### MeshConfig

```javascript
const config = new MeshConfig();

// Shadow settings
config.castShadows = true;        // Enable shadow casting
config.receiveShadows = true;     // Enable shadow receiving

// Culling settings
config.frustumCulled = true;      // Enable frustum culling
config.layer = 0;                 // Render layer for selective rendering
config.priority = 0;              // Render priority within layer

// Geometry optimization
config.boundingSphere = null;     // Custom bounding sphere
config.boundingBox = null;        // Custom bounding box

// Material settings
config.vertexColors = false;      // Enable vertex colors
config.flatShading = false;       // Enable flat shading
```

### Optimization Levels

- **Level 0**: No optimization (fastest creation, largest memory)
- **Level 1**: Basic optimization (duplicate removal)
- **Level 2**: Moderate optimization (index buffer optimization)
- **Level 3**: Maximum optimization (all optimizations + LOD generation)

## Best Practices

### 1. **Memory Management**
```javascript
// Use caching for frequently created geometries
const cachedGeometry = MeshBuilder.createCachedMesh(
  'frequently_used_key',
  () => expensiveGeometryCreation(),
  material
);

// Dispose meshes when no longer needed
mesh.dispose();  // Clean up geometry and materials
```

### 2. **Performance Optimization**
```javascript
// Enable frustum culling for large scenes
mesh.frustumCulled = true;

// Use LOD for distant objects
if (mesh.getCameraDistance(camera) > 100) {
  mesh.setAutoLOD(true);
}

// Batch similar materials for efficient rendering
Mesh.globalBatcher.addToBatch(mesh, mesh.getMaterial());
```

### 3. **Level of Detail**
```javascript
// Use appropriate LOD distances for your scene scale
const lodDistances = [0, 50, 100, 200, 500];  // Good for typical game scenes

// Provide materials for each LOD level to control visual quality
const lodMaterials = [highQualityMat, mediumMat, lowMat, basicMat, ultraLowMat];
```

### 4. **Render Order Management**
```javascript
// Set render order for transparency sorting
transparentMesh.renderOrder = 1;
opaqueMesh.renderOrder = 0;

// Use layers for selective rendering
uiLayerMesh.layer = 100;  // UI layer
worldMesh.layer = 0;      // World layer
```

## Integration with Existing Systems

The Mesh class is designed to integrate seamlessly with the existing WebGL renderer:

```javascript
// In your render loop
for (const mesh of scene.meshes) {
  if (mesh.visible && !mesh.shouldCull(frustum)) {
    mesh.render(gl, camera);
  }
}

// Or use the optimized batched rendering
const batches = Mesh.globalBatcher.getBatches();
for (const batch of batches) {
  batch.material.apply(gl);
  for (const mesh of batch.meshes) {
    if (mesh.visible) {
      mesh.render(gl, batch.material);
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **High memory usage**: Enable geometry caching and dispose unused meshes
2. **Poor performance**: Enable LOD and frustum culling, use draw call batching
3. **Incorrect rendering order**: Set appropriate renderOrder values
4. **Missing shadows**: Ensure castShadows and receiveShadows are properly configured

### Performance Tips

- Use geometry caching for frequently created objects
- Enable automatic LOD for distant objects
- Use frustum culling for large scenes
- Batch draw calls by material for efficiency
- Monitor performance statistics regularly
- Dispose meshes and geometries when no longer needed

The Mesh class and geometry management system provides a comprehensive solution for efficient 3D rendering in WebGL applications, balancing performance, memory usage, and ease of use.