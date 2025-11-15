# 3D Format Loaders Documentation

This documentation covers the implementation of three advanced 3D format loaders: STLLoader, PLYLoader, and EnhancedJSONLoader. Each loader provides comprehensive support for parsing 3D model files with advanced features including compression, material handling, and geometry optimization.

## Table of Contents

- [STLLoader](#stlloader)
- [PLYLoader](#plyloader)
- [EnhancedJSONLoader](#enhancedjsonloader)
- [Common Features](#common-features)
- [Usage Examples](#usage-examples)

---

## STLLoader

The STLLoader handles STL (STereoLithography) format files, supporting both ASCII and binary variants commonly used in CAD applications and 3D printing.

### Features

- **Dual Format Support**: Automatically detects and parses both ASCII and binary STL formats
- **Material Assignment**: Support for single and multi-material assignments
- **Normal Calculation**: Automatic normal vector calculation for proper lighting
- **Geometry Optimization**: Vertex merging and index optimization
- **Worker Support**: Optional Web Worker parsing for large files
- **Inline Parsing**: Support for parsing from strings and ArrayBuffers

### Basic Usage

```javascript
import { STLLoader } from './loaders/STLLoader.js';

// Create loader instance
const loader = new STLLoader();

// Load STL file
loader.load('model.stl', (geometry) => {
    console.log('Loaded STL geometry:', geometry);
    // Add to scene, apply material, etc.
});

// Advanced usage with material
const material = new MeshLambertMaterial({ color: 0x00ff00 });
loader.setMaterial(material).load('model.stl', (geometry) => {
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
});
```

### API Methods

#### `load(url, onLoad, onProgress, onError)`
Load STL file from URL with callbacks for progress and completion.

#### `loadAsync(url)`
Asynchronously load STL file and return Promise.

#### `setMaterial(material)`
Assign material to the loaded geometry.

#### `setMaterials(materials)`
Assign array of materials for multi-material support.

#### `setUseWorker(useWorker)`
Enable/disable Web Worker parsing for performance.

#### `parseText(text)`
Parse ASCII STL from string.

#### `parseBinary(buffer)`
Parse binary STL from ArrayBuffer.

### File Format Details

**ASCII STL Format:**
- Header starts with "solid"
- Uses text-based vertex and normal definitions
- Human-readable format

**Binary STL Format:**
- 80-byte header (ignored)
- 4-byte triangle count
- Triangle data: normal (12 bytes) + 3 vertices (36 bytes) + 2-byte attribute
- More compact and faster to parse

---

## PLYLoader

The PLYLoader handles PLY (Polygon File Format) files, a flexible format that supports various data types and properties commonly used in 3D scanning and scientific applications.

### Features

- **Format Detection**: Automatic ASCII/binary format detection
- **Property Parsing**: Comprehensive parsing of vertex and face properties
- **Data Type Support**: Full support for all PLY data types (char, uchar, short, ushort, int, uint, float, double)
- **Material Support**: Texture coordinate and color property handling
- **Face Triangulation**: Automatic triangulation of polygonal faces
- **Custom Properties**: Full access to all custom properties in PLY files
- **Encoding Support**: Configurable text encoding

### Basic Usage

```javascript
import { PLYLoader } from './loaders/PLYLoader.js';

const loader = new PLYLoader();

// Load PLY file with custom options
loader.setEncoding('utf-8').load('model.ply', (geometry) => {
    console.log('Loaded PLY geometry:', geometry);
    console.log('Custom properties:', geometry.properties);
});

// Load with material and texture support
loader.setMaterial(material).load('scanned_model.ply', (geometry) => {
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
});
```

### API Methods

#### `load(url, onLoad, onProgress, onError)`
Load PLY file from URL.

#### `loadAsync(url)`
Asynchronously load PLY file and return Promise.

#### `setEncoding(encoding)`
Set text encoding (default: 'utf-8').

#### `parseText(text)`
Parse PLY from string content.

### Supported PLY Properties

**Standard Vertex Properties:**
- Position: `x`, `y`, `z`
- Normal: `nx`, `ny`, `nz`
- Texture: `s`, `t`
- Color: `red`, `green`, `blue`, `alpha`

**Face Properties:**
- Vertex indices (handled automatically)
- Custom face properties supported

### File Format Details

**PLY Header Structure:**
```
format ascii/binary_little_endian 1.0
element vertex <count>
property <type> <name>
...
element face <count>
property <type> name>
...
end_header
```

**Data Types:**
- `char`, `uchar`: 8-bit signed/unsigned integers
- `short`, `ushort`: 16-bit signed/unsigned integers  
- `int`, `uint`: 32-bit signed/unsigned integers
- `float`, `double`: 32-bit/64-bit floating point

---

## EnhancedJSONLoader

The EnhancedJSONLoader provides advanced JSON format support with compression, material handling, and geometry optimization for efficient 3D data storage and transmission.

### Features

- **Compression Support**: Quantized, delta-encoded, and octahedral compression
- **Material System**: Full material and texture support
- **Animation Support**: Morph targets and skeletal animations
- **Geometry Optimization**: Automatic vertex merging and index optimization
- **Property Extraction**: Support for custom user properties
- **Skinning Support**: Vertex skinning and bone influences
- **LOD Support**: Level-of-detail geometry variants

### Basic Usage

```javascript
import { EnhancedJSONLoader } from './loaders/JSONLoader.js';

const loader = new EnhancedJSONLoader();

// Load compressed JSON model
loader.load('model.json', (geometry) => {
    console.log('Loaded JSON geometry:', geometry);
});

// Advanced usage with texture path and options
loader.setTexturePath('./textures/')
    .setOptions({
        parseColors: true,
        parseMorphTargets: true,
        parseAnimations: true
    })
    .load('animated_model.json', (result) => {
        const mesh = new Mesh(result.geometry, result.materials);
        if (result.animations) {
            // Setup animation mixer
            const mixer = new AnimationMixer(mesh);
            result.animations.forEach(clip => {
                mixer.clipAction(clip).play();
            });
        }
        scene.add(mesh);
    });
```

### API Methods

#### `load(url, onLoad, onProgress, onError)`
Load JSON file from URL.

#### `loadAsync(url)`
Asynchronously load JSON file and return Promise.

#### `setOptions(options)`
Configure parsing options:
- `parseIndices`: Enable index parsing (default: true)
- `parseUvs`: Enable UV coordinate parsing (default: true)
- `parseNormals`: Enable normal vector parsing (default: true)
- `parseColors`: Enable vertex color parsing (default: false)
- `parseTangents`: Enable tangent vector parsing (default: false)
- `parseMorphTargets`: Enable morph target parsing (default: false)
- `parseAnimations`: Enable animation parsing (default: false)

#### `setTexturePath(path)`
Set base path for resolving relative texture paths.

#### `setMaterial(material)`
Assign material to loaded geometry.

#### `setMaterials(materials)`
Assign array of materials.

#### `parseText(text)`
Parse JSON from string content.

### JSON Format Structure

```json
{
  "metadata": {
    "version": 1,
    "type": "Geometry",
    "generator": "EnhancedJSONLoader"
  },
  "geometry": {
    "vertices": [ /* vertex positions */ ],
    "indices": [ /* triangle indices */ ],
    "normals": [ /* normal vectors */ ],
    "uvs": [ /* texture coordinates */ ],
    "colors": [ /* vertex colors */ ],
    "vertexCompression": {
      "type": "quantized|delta",
      "quantizationBits": 16,
      "min": [minX, minY, minZ],
      "scale": [scaleX, scaleY, scaleZ]
    }
  },
  "materials": [ /* material definitions */ ],
  "animations": [ /* animation clips */ ],
  "morphTargets": { /* morph target definitions */ },
  "skin": { /* skinning data */ },
  "boundingBox": { /* calculated bounds */ }
}
```

### Compression Types

**Quantized Compression:**
- Reduces precision for size optimization
- Maintains bounding box for reconstruction
- Configurable bit depth

**Delta Encoding:**
- Stores differences between consecutive vertices
- Efficient for smooth surfaces
- Requires sequential processing

**Octahedral Normals:**
- Special encoding for normal vectors
- 50% size reduction vs. standard 3-float storage
- Maintains visual quality

---

## Common Features

All three loaders share common functionality:

### Material Handling

```javascript
// Single material
loader.setMaterial(new MeshLambertMaterial({ color: 0x00ff00 }));

// Multiple materials
const materials = [
    new MeshBasicMaterial({ color: 0xff0000 }),
    new MeshLambertMaterial({ color: 0x00ff00 }),
    new MeshPhongMaterial({ color: 0x0000ff })
];
loader.setMaterials(materials);
```

### Progress Tracking

```javascript
loader.load('model.stl', 
    (geometry) => console.log('Loaded!', geometry),
    (event) => {
        const percent = (event.loaded / event.total) * 100;
        console.log(`Loading: ${percent.toFixed(1)}%`);
    },
    (error) => console.error('Error:', error)
);
```

### Error Handling

```javascript
try {
    loader.load('model.stl', (geometry) => {
        // Success handling
    });
} catch (error) {
    console.error('Loader initialization error:', error);
}
```

---

## Usage Examples

### Complete Scene Setup

```javascript
import { STLLoader, PLYLoader, EnhancedJSONLoader } from './loaders/index.js';
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three.js';

// Initialize scene
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer();

// Load different formats
function loadModel(loader, url, material) {
    loader.setMaterial(material).load(url, (geometry) => {
        const mesh = new Mesh(geometry, material);
        scene.add(mesh);
    }, (progress) => {
        console.log(`Loading ${url}: ${(progress.loaded/progress.total*100).toFixed(1)}%`);
    }, (error) => {
        console.error(`Failed to load ${url}:`, error);
    });
}

// Example usage
const material = new MeshLambertMaterial({ color: 0x888888 });

// Load STL
const stlLoader = new STLLoader();
loadModel(stlLoader, 'models/part.stl', material);

// Load PLY
const plyLoader = new PLYLoader();
loadModel(plyLoader, 'models/scan.ply', material);

// Load JSON
const jsonLoader = new EnhancedJSONLoader();
loadModel(jsonLoader, 'models/character.json', material);
```

### Performance Optimization

```javascript
// For large files, use workers
stlLoader.setUseWorker(true).load('large_model.stl', callback);

// For repeated loading, use caching
plyLoader.setCacheEnabled(true).load('common_model.ply', callback);

// For memory optimization, disable unused features
jsonLoader.setOptions({
    parseColors: false,
    parseTangents: false
}).load('simple_model.json', callback);
```

---

## Integration Notes

### With Three.js
These loaders return geometry objects compatible with Three.js Mesh construction:

```javascript
const geometry = loader.loadSync('model.stl');
const mesh = new Mesh(geometry, material);
scene.add(mesh);
```

### Custom Formats
Extend the JSONLoader for custom formats by implementing the `_parseJSONGeometry` method.

### Browser Compatibility
All loaders support modern browsers with File API and WebGL support. For older browsers, consider using polyfills.

### Performance Tips
1. Use binary formats when possible
2. Enable worker parsing for files > 1MB
3. Disable unused parsing options
4. Implement geometry caching for repeated loads
5. Consider compression for network transmission

---

This implementation provides comprehensive 3D format support with modern optimization features suitable for both production environments and development workflows.