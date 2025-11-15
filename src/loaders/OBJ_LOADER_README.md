# OBJ Loader

Advanced OBJ file loader with comprehensive format support, progress tracking, and error handling.

## Features

### Complete OBJ Format Support
- **Vertex Positions**: Support for v, v/w, v//vn, and v/w/vn vertex reference formats
- **Vertex Normals**: vn command support with proper normal computation
- **Texture Coordinates**: vt command support with automatic V-flipping option
- **Faces**: Full polygon support with automatic triangulation
- **Groups**: g command support for mesh segmentation
- **Objects**: o command support for multiple objects per file
- **Smoothing Groups**: s command support for smooth shading
- **Material Usage**: usemtl command for material assignment
- **Material Libraries**: mtllib command for external material references

### Advanced Features
- **Progress Tracking**: Real-time parsing progress with line-by-line updates
- **Error Handling**: Robust error recovery with detailed error reporting
- **Normal Computation**: Automatic vertex normal calculation when normals not provided
- **Bounding Box**: Optional bounding box computation
- **Statistics**: Comprehensive parsing statistics
- **Debug Mode**: Optional debug logging for troubleshooting

### Performance Optimizations
- **Efficient Parsing**: Stream-based line parsing with minimal memory overhead
- **Shared Vertices**: Proper vertex sharing to reduce memory usage
- **BufferGeometry**: Direct BufferGeometry creation for optimal WebGL performance

## Usage

### Basic Usage

```javascript
import { OBJLoader } from './loaders/OBJLoader.js';
import { TextureLoader } from './loaders/TextureLoader.js';

// Create loader instance
const objLoader = new OBJLoader();

// Load OBJ file
async function loadModel() {
  try {
    const geometries = await objLoader.load('model.obj');
    
    geometries.forEach(geometry => {
      const mesh = new Mesh(geometry, material);
      scene.add(mesh);
    });
    
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
  }
}

loadModel();
```

### With Progress Tracking

```javascript
const objLoader = new OBJLoader();

// Add progress listener
objLoader.addProgressListener('main', (progress) => {
  console.log(`${progress.phase}: ${progress.percentage.toFixed(1)}%`);
});

// Load with options
const geometries = await objLoader.load('model.obj', {
  computeNormals: true,        // Compute normals if not in file
  computeBoundingBox: true,    // Compute bounding box
  flipY: true,                 // Flip V coordinates
  debug: false                 // Enable debug logging
});
```

### With Material Library

```javascript
import { MTLLoader } from './loaders/MTLLoader.js';
import { TextureLoader } from './loaders/TextureLoader.js';

// Create loaders
const textureLoader = new TextureLoader();
const mtlLoader = new MTLLoader({ textureLoader });
const objLoader = new OBJLoader();

// Link OBJ loader to MTL loader
objLoader.setMaterialLibrary(mtlLoader);

// Load materials first
const materials = await mtlLoader.load('model.mtl');

// Then load OBJ file
const geometries = await objLoader.load('model.obj');

// Apply materials to geometries
geometries.forEach(geometry => {
  const materialName = geometry.userData.material;
  const material = materials.get(materialName);
  
  if (material) {
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
  } else {
    const mesh = new Mesh(geometry, defaultMaterial);
    scene.add(mesh);
  }
});
```

### Parse OBJ Text

```javascript
// Parse OBJ data from string
const objText = `
# Simple cube
v 1 1 1
v -1 1 1
v -1 -1 1
v 1 -1 1
v 1 1 -1
v -1 1 -1
v -1 -1 -1
v 1 -1 -1

f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`;

const geometries = await objLoader.parse(objText);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `manager` | LoadingManager | - | Loading manager for resource management |
| `debug` | boolean | false | Enable debug logging |
| `computeNormals` | boolean | true | Compute normals if not provided |
| `computeBoundingBox` | boolean | true | Compute bounding box |
| `flipY` | boolean | false | Flip V texture coordinates |

## Progress Tracking

The OBJ loader provides detailed progress information during parsing:

```javascript
objLoader.addProgressListener('myLoader', (progress) => {
  console.log(`Phase: ${progress.phase}`);
  console.log(`Line: ${progress.lineNumber}/${progress.totalLines}`);
  console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
});
```

**Progress Phases:**
- `parsing`: Currently parsing OBJ lines
- `building`: Building BufferGeometry objects
- `complete`: Parsing finished

## Statistics

Get detailed parsing statistics:

```javascript
const stats = objLoader.getStats();
console.log(stats);
// {
//   vertices: 1234,
//   faces: 567,
//   groups: 3,
//   objects: 1,
//   parseTime: 156.7
// }
```

## Error Handling

The OBJ loader includes comprehensive error handling:

```javascript
try {
  const geometries = await objLoader.load('model.obj');
} catch (error) {
  console.error('OBJ loading failed:', error);
  // Handle error appropriately
}
```

**Common Error Types:**
- Invalid vertex definitions
- Missing texture coordinates
- Malformed faces
- File not found (404)
- Network errors

## Supported OBJ Features

### Vertex Data
- `v x y z` - Vertex position
- `v x y z w` - Vertex position with homogeneous coordinate
- `vn x y z` - Vertex normal
- `vt u` - Texture coordinate (U)
- `vt u v` - Texture coordinate (U, V)
- `vt u v w` - Texture coordinate (U, V, W)

### Faces
- `f v1 v2 v3` - Triangle
- `f v1/vt1 v2/vt2 v3/vt3` - Triangle with texture coordinates
- `f v1//vn1 v2//vn2 v3//vn3` - Triangle with normals
- `f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3` - Triangle with texture and normals
- Polygons (automatically triangulated)

### Grouping and Objects
- `g groupname` - Group definition
- `o objectname` - Object definition
- `s group` - Smoothing group
- `s off` - Disable smoothing

### Materials
- `usemtl materialname` - Use material
- `mtllib filename` - Material library reference

## Best Practices

### Memory Management
```javascript
// Clear cache when done
objLoader.clearCache?.();

// Unload geometries when no longer needed
geometries.forEach(geometry => {
  geometry.dispose();
});
```

### Large Files
```javascript
// For large files, monitor progress
objLoader.addProgressListener('largeFile', (progress) => {
  updateProgressBar(progress.percentage);
  
  if (progress.phase === 'complete') {
    console.log(`Parsed ${progress.totalLines} lines in ${objLoader.getStats().parseTime}ms`);
  }
});
```

### Error Recovery
```javascript
const objLoader = new OBJLoader({
  debug: true  // Enable debug for troubleshooting
});

try {
  const geometries = await objLoader.load('model.obj');
} catch (error) {
  console.error('Detailed error info:', {
    message: error.message,
    stack: error.stack,
    stats: objLoader.getStats()
  });
}
```

## Integration with Three.js-style API

The OBJ loader is designed to work seamlessly with a Three.js-style rendering pipeline:

```javascript
import { OBJLoader } from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import { TextureLoader } from './loaders/TextureLoader.js';
import { Scene } from './core/Scene.js';
import { WebGLRenderer } from './core/WebGLRenderer.js';

// Setup
const scene = new Scene();
const renderer = new WebGLRenderer();

// Load model with materials
async function loadModelWithMaterials(objPath, mtlPath) {
  const textureLoader = new TextureLoader();
  const mtlLoader = new MTLLoader({ textureLoader });
  const objLoader = new OBJLoader({ mtlLoader });
  
  // Load materials
  const materials = await mtlLoader.load(mtlPath);
  
  // Load geometry
  const geometries = await objLoader.load(objPath);
  
  // Create meshes
  const group = new THREE.Group();
  
  geometries.forEach(geometry => {
    const materialName = geometry.userData.material;
    const material = materials.get(materialName) || defaultMaterial;
    
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
  });
  
  scene.add(group);
  return group;
}
```

## Browser Compatibility

The OBJ loader uses modern JavaScript features:
- ES6 Classes
- Promises
- ArrayBuffer and TypedArrays
- Arrow functions
- Destructuring

**Browser Support:**
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 79+

## Performance Considerations

### Large Models
- Progress tracking adds minimal overhead
- Line-by-line parsing is memory efficient
- Vertex sharing reduces memory usage

### File Size
- Text-based OBJ files can be large
- Consider gzip compression on server
- Binary formats may be more efficient for very large models

### Texture Loading
- Texture paths are resolved relative to MTL file
- Texture loading is asynchronous
- Failed texture loads don't stop model loading

## Troubleshooting

### Common Issues

**Issue**: No textures visible
```javascript
// Check texture paths
objLoader.setDebug(true);  // Enable debug logging

// Ensure texture loader is configured
const textureLoader = new TextureLoader({
  crossOrigin: 'anonymous'
});
```

**Issue**: Incorrect normals
```javascript
// Force normal computation
const objLoader = new OBJLoader({
  computeNormals: true
});
```

**Issue**: Progress not updating
```javascript
// Ensure progress listeners are added
objLoader.addProgressListener('test', (progress) => {
  console.log(progress);
});
```

**Issue**: Memory leaks
```javascript
// Always dispose geometries
geometries.forEach(geometry => geometry.dispose());

// Clear cache when appropriate
objLoader.clearCache?.();
```

## API Reference

### OBJLoader

**Constructor**
```javascript
new OBJLoader(options = {})
```

**Methods**
- `load(url, options)` - Load OBJ file from URL
- `parse(text, options)` - Parse OBJ text content
- `addProgressListener(key, callback)` - Add progress listener
- `removeProgressListener(key)` - Remove progress listener
- `setMaterialLibrary(mtlLoader)` - Set material library loader
- `getStats()` - Get parse statistics

### OBJLoaderProgress

**Methods**
- `addListener(key, callback)` - Add progress listener
- `removeListener(key)` - Remove progress listener
- `update(phase, lineNumber, totalLines)` - Update progress
- `complete()` - Mark as complete

## Examples

See the following examples in the repository:
- `examples/obj-loader-example.js` - Basic OBJ loading
- `examples/obj-with-materials-example.js` - OBJ with MTL files
- `examples/progress-tracking-example.js` - Progress tracking demo

## License

This OBJ loader is part of the 3D rendering library and is available under the same license as the main project.
