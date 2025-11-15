# MTL Loader

Advanced MTL (Material Template Library) file loader with comprehensive format support, material creation, and texture handling.

## Features

### Complete MTL Format Support
- **Material Colors**: Ka (ambient), Kd (diffuse), Ks (specular), Ke (emissive)
- **Material Properties**: Ns (shininess), d/Tr (transparency), Ni (optical density)
- **Illumination Models**: Support for all 10 standard illumination models (illum)
- **Texture Maps**: 
  - map_Ka (ambient map)
  - map_Kd (diffuse map)
  - map_Ks (specular map)
  - map_Ke (emissive map)
  - map_bump/bump (bump map)
  - disp (displacement map)
  - map_d (alpha map)
- **Texture Options**: BlendU/V, offset, scale, clamp, resolution

### Advanced Features
- **Material Type Selection**: Automatic material type selection based on illumination model
- **Texture Path Resolution**: Proper texture path handling and resolution
- **Material Library Management**: Support for multiple material libraries
- **Progress Tracking**: Real-time loading progress
- **Error Handling**: Robust error recovery with detailed reporting
- **Statistics**: Comprehensive loading statistics

### Material Types
- **MeshLambertMaterial**: For illumination models 0-1 (no specular highlights)
- **MeshPhongMaterial**: For illumination models 2+ (with specular highlights)
- **Proper Transparency**: Full transparency support with alpha maps
- **Emission**: Emissive color and emissive maps

## Usage

### Basic Usage

```javascript
import { MTLLoader } from './loaders/MTLLoader.js';
import { TextureLoader } from './loaders/TextureLoader.js';

// Create texture loader
const textureLoader = new TextureLoader();

// Create MTL loader
const mtlLoader = new MTLLoader({ textureLoader });

// Load materials
async function loadMaterials() {
  try {
    const materials = await mtlLoader.load('model.mtl');
    
    // Use materials
    materials.forEach((material, name) => {
      console.log(`Loaded material: ${name}`, material);
    });
    
    return materials;
  } catch (error) {
    console.error('Failed to load materials:', error);
  }
}

loadMaterials();
```

### With Progress Tracking

```javascript
const mtlLoader = new MTLLoader({ textureLoader });

// Add progress listener
mtlLoader.addProgressListener('main', (progress) => {
  console.log(`${progress.phase}: ${progress.percentage.toFixed(1)}%`);
});

// Load with options
const materials = await mtlLoader.load('model.mtl', {
  crossOrigin: 'anonymous',
  debug: false
});
```

### Get Specific Materials

```javascript
// Load materials
await mtlLoader.load('model.mtl');

// Get specific material
const woodMaterial = mtlLoader.getMaterial('model.mtl', 'Wood');

// Get all materials from library
const allMaterials = mtlLoader.getMaterials('model.mtl');

// Get list of loaded libraries
const libraries = mtlLoader.getMaterialLibraryNames();
console.log('Loaded libraries:', libraries);
```

### Create Materials from Scratch

```javascript
import { MaterialCreator } from './loaders/MTLLoader.js';

const creator = new MaterialCreator(textureLoader);

// Parse MTL text
await creator.parse(mtlText);

// Create material objects
const materials = creator.createMaterials();
```

### Material Library Management

```javascript
// Load multiple material libraries
const library1 = await mtlLoader.load('materials1.mtl');
const library2 = await mtlLoader.load('materials2.mtl');

// Check what materials are available
mtlLoader.getMaterialLibraryNames().forEach(libName => {
  const materials = mtlLoader.getMaterials(libName);
  console.log(`${libName}: ${materials.size} materials`);
});

// Clear all libraries when done
mtlLoader.clearMaterialLibraries();
```

## MTL File Format

### Basic Material Definition

```mtl
# Material definition
newmtl MaterialName

# Colors (RGB, values 0-1)
Ka 0.2 0.2 0.2      # Ambient color
Kd 0.8 0.8 0.8      # Diffuse color
Ks 0.5 0.5 0.5      # Specular color
Ke 0.0 0.0 0.0      # Emissive color

# Material properties
Ns 10.0             # Specular exponent (shininess)
d 1.0               # Dissolve (transparency)
Ni 1.0              # Optical density
illum 2             # Illumination model
```

### Texture Mapping

```mtl
# Diffuse texture map
map_Kd texture.png

# Ambient texture map with options
map_Ka ambient_texture.png -blendu on -blendv on -offset 0 0 -scale 1 1

# Specular map
map_Ks specular_map.png

# Emissive map
map_Ke emissive_map.png

# Bump map
map_bump normal_map.png

# Alpha map
map_d alpha_map.png

# Displacement map
disp displacement_map.png
```

### Texture Options

| Option | Description | Example |
|--------|-------------|---------|
| `-blendu on/off` | Blend U direction | `-blendu on` |
| `-blendv on/off` | Blend V direction | `-blendv on` |
| `-offset u v` | Texture offset | `-offset 0.1 0.2` |
| `-scale u v` | Texture scale | `-scale 2 2` |
| `-clamp on/off` | Clamp to edge | `-clamp on` |
| `-resolution value` | Texture resolution | `-resolution 256` |

### Illumination Models

| Model | Description | Material Type |
|-------|-------------|---------------|
| 0 | Color on, ambient on | MeshLambertMaterial |
| 1 | Color on, ambient on, specular off | MeshLambertMaterial |
| 2 | Color on, ambient on, specular on | MeshPhongMaterial |
| 3 | Color on, ambient on, specular on, ray trace on | MeshPhongMaterial |
| 4 | + Reflection on | MeshPhongMaterial |
| 5 | + Transparency on | MeshPhongMaterial |
| 6 | + Reflection on, transparency on | MeshPhongMaterial |
| 7 | + Fresnel on | MeshPhongMaterial |
| 8 | + Reflection on, fresnel on | MeshPhongMaterial |
| 9 | + Full fresnel | MeshPhongMaterial |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `textureLoader` | TextureLoader | - | Required: Texture loader for texture files |
| `manager` | LoadingManager | - | Loading manager for resource management |
| `debug` | boolean | false | Enable debug logging |
| `crossOrigin` | string | 'anonymous' | CORS policy for texture loading |
| `withCredentials` | boolean | false | Include credentials in requests |

## Material Creation

The MTL loader automatically selects the appropriate material type based on the illumination model:

```javascript
// Lambert materials for basic lighting
const lambertMaterial = new MeshLambertMaterial({
  color: 0xffffff,
  ambient: 0x333333
});

// Phong materials for specular highlights
const phongMaterial = new MeshPhongMaterial({
  color: 0xffffff,
  ambient: 0x333333,
  specular: 0x808080,
  shininess: 10
});

// Transparent materials
const transparentMaterial = new MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5
});

// Materials with emission
const emissiveMaterial = new MeshPhongMaterial({
  color: 0xffffff,
  emissive: 0xff0000  // Red emission
});
```

## Texture Handling

### Texture Path Resolution

```javascript
// Texture paths are resolved relative to the MTL file
// Example structure:
// models/
//   ├── model.mtl
//   ├── textures/
//   │   ├── diffuse.png
//   │   └── normal.png

// In MTL file:
map_Kd textures/diffuse.png  // Correctly resolved
map_bump textures/normal.png // Correctly resolved
```

### Texture Loading Options

```javascript
const textureLoader = new TextureLoader({
  crossOrigin: 'anonymous',
  withCredentials: false,
  timeout: 30000,
  maxRetries: 3
});

const mtlLoader = new MTLLoader({
  textureLoader,
  crossOrigin: 'anonymous'
});
```

### Failed Texture Handling

```javascript
// Textures that fail to load don't stop material creation
mtlLoader.load('materials.mtl').then(materials => {
  materials.forEach((material, name) => {
    console.log(`Material: ${name}`);
    
    // Check which textures loaded successfully
    if (material.map) {
      console.log('Diffuse map: loaded');
    }
    
    if (material.bumpMap) {
      console.log('Bump map: loaded');
    }
    
    if (!material.map) {
      console.log('Diffuse map: failed to load');
    }
  });
});
```

## Progress Tracking

```javascript
mtlLoader.addProgressListener('materials', (progress) => {
  switch (progress.phase) {
    case 'parsing':
      console.log(`Parsing MTL: ${progress.percentage.toFixed(1)}%`);
      break;
    case 'complete':
      console.log('MTL loading complete');
      break;
  }
});
```

## Statistics

```javascript
const stats = mtlLoader.getStats();
console.log(stats);
// {
//   materials: 15,
//   parseTime: 45.2,
//   textureLoads: 8
// }
```

## Integration with OBJ Loader

```javascript
import { MTLLoader } from './loaders/MTLLoader.js';
import { OBJLoader } from './loaders/OBJLoader.js';
import { TextureLoader } from './loaders/TextureLoader.js';

async function loadModelWithMaterials(objPath, mtlPath) {
  // Create loaders
  const textureLoader = new TextureLoader();
  const mtlLoader = new MTLLoader({ textureLoader });
  const objLoader = new OBJLoader();
  
  // Link OBJ loader to MTL loader
  objLoader.setMaterialLibrary(mtlLoader);
  
  // Load materials first
  console.log('Loading materials...');
  const materials = await mtlLoader.load(mtlPath);
  
  // Then load OBJ file
  console.log('Loading geometry...');
  const geometries = await objLoader.load(objPath);
  
  // Create meshes with materials
  const model = new Group();
  
  geometries.forEach(geometry => {
    const materialName = geometry.userData.material;
    const material = materials.get(materialName) || defaultMaterial;
    
    const mesh = new Mesh(geometry, material);
    model.add(mesh);
  });
  
  return model;
}
```

## Error Handling

```javascript
try {
  const materials = await mtlLoader.load('model.mtl');
} catch (error) {
  console.error('MTL loading failed:', error);
  
  // Common error types:
  // - File not found (404)
  // - Invalid MTL format
  // - Texture loading failures
  // - Network errors
  
  switch (error.code) {
    case 'FILE_NOT_FOUND':
      console.error('MTL file not found');
      break;
    case 'PARSE_ERROR':
      console.error('Invalid MTL format');
      break;
    case 'TEXTURE_LOAD_FAILED':
      console.error('Failed to load texture');
      break;
  }
}
```

## Material Library Management

### Loading Multiple Libraries

```javascript
// Load various material libraries
const libraries = [
  'wood.mtl',
  'metal.mtl',
  'fabric.mtl',
  'plastic.mtl'
];

const allMaterials = new Map();

for (const libName of libraries) {
  try {
    const materials = await mtlLoader.load(libName);
    
    // Store with prefix to avoid name conflicts
    materials.forEach((material, name) => {
      allMaterials.set(`${libName}:${name}`, material);
    });
    
    console.log(`Loaded ${materials.size} materials from ${libName}`);
  } catch (error) {
    console.error(`Failed to load ${libName}:`, error);
  }
}
```

### Material Organization

```javascript
// Organize materials by type
const materialCategories = {
  wood: new Map(),
  metal: new Map(),
  fabric: new Map(),
  misc: new Map()
};

// Load materials into categories
mtlLoader.getMaterialLibraryNames().forEach(libName => {
  const materials = mtlLoader.getMaterials(libName);
  
  materials.forEach((material, name) => {
    if (name.toLowerCase().includes('wood')) {
      materialCategories.wood.set(name, material);
    } else if (name.toLowerCase().includes('metal')) {
      materialCategories.metal.set(name, material);
    } else {
      materialCategories.misc.set(name, material);
    }
  });
});
```

## Best Practices

### Performance

```javascript
// Reuse texture loader across multiple MTL loaders
const sharedTextureLoader = new TextureLoader({
  cacheSize: 200,  // Large cache for many materials
  crossOrigin: 'anonymous'
});

const mtlLoader1 = new MTLLoader({ textureLoader: sharedTextureLoader });
const mtlLoader2 = new MTLLoader({ textureLoader: sharedTextureLoader });
```

### Memory Management

```javascript
// Clean up when done
mtlLoader.clearMaterialLibraries();

// For individual materials
materials.forEach(material => {
  // Dispose textures
  if (material.map) material.map.dispose();
  if (material.specularMap) material.specularMap.dispose();
  if (material.ambientMap) material.ambientMap.dispose();
  if (material.bumpMap) material.bumpMap.dispose();
  if (material.normalMap) material.normalMap.dispose();
  if (material.emissiveMap) material.emissiveMap.dispose();
  
  // Dispose material
  material.dispose();
});
```

### Error Recovery

```javascript
async function loadMaterialsWithFallback(primaryPath, fallbackPath) {
  try {
    return await mtlLoader.load(primaryPath);
  } catch (error) {
    console.warn(`Failed to load ${primaryPath}, trying fallback...`);
    
    try {
      return await mtlLoader.load(fallbackPath);
    } catch (fallbackError) {
      console.error('Both primary and fallback failed');
      throw fallbackError;
    }
  }
}
```

## Advanced Usage

### Custom Material Creation

```javascript
import { MaterialCreator } from './loaders/MTLLoader.js';

const creator = new MaterialCreator(textureLoader);

// Parse MTL
await creator.parse(mtlText);

// Create materials
const materials = creator.createMaterials();

// Modify materials before use
materials.forEach((material, name) => {
  // Override specific properties
  material.side = THREE.DoubleSide;
  material.transparent = true;
  material.opacity = 0.9;
  
  // Add custom properties
  material.userData = {
    category: 'environment',
    roughness: material.shininess / 100,
    metalness: material.specular.length > 0 ? 0.8 : 0.0
  };
});
```

### Batch Processing

```javascript
async function loadMultipleMaterialLibraries(urls) {
  const results = [];
  
  const progressListener = (progress) => {
    updateProgressBar(progress.percentage);
  };
  
  mtlLoader.addProgressListener('batch', progressListener);
  
  for (const url of urls) {
    try {
      const materials = await mtlLoader.load(url);
      results.push({ url, materials, success: true });
    } catch (error) {
      results.push({ url, error, success: false });
    }
  }
  
  mtlLoader.removeProgressListener('batch');
  
  return results;
}
```

## Troubleshooting

### Common Issues

**Issue**: Textures not loading
```javascript
// Check CORS configuration
const mtlLoader = new MTLLoader({
  textureLoader: new TextureLoader({
    crossOrigin: 'anonymous'
  })
});

// Verify texture paths
mtlLoader.setDebug(true);
```

**Issue**: Materials look flat
```javascript
// Check illumination model
// Models 0-1 produce Lambert shading (no specular)
// Models 2+ produce Phong shading (with specular)

// Force Phong material
materials.forEach(material => {
  if (material instanceof MeshLambertMaterial) {
    material.needsUpdate = true;
  }
});
```

**Issue**: Transparent materials not working
```javascript
// Ensure transparency is enabled
materials.forEach(material => {
  if (material.transparent) {
    material.opacity = 1.0 - material.transparency;
    material.transparent = true;
    material.depthWrite = false;  // For proper transparency
  }
});
```

**Issue**: High memory usage
```javascript
// Limit texture cache
const textureLoader = new TextureLoader({
  cacheSize: 50  // Smaller cache
});

// Clear unused materials
mtlLoader.clearMaterialLibraries();
```

## API Reference

### MTLLoader

**Constructor**
```javascript
new MTLLoader(options = {})
```

**Methods**
- `load(url, options)` - Load MTL file from URL
- `parse(text, options)` - Parse MTL text content
- `loadMaterialLibrary(name, url)` - Load named material library
- `getMaterial(libraryName, materialName)` - Get specific material
- `getMaterials(libraryName)` - Get all materials from library
- `getMaterialLibraryNames()` - Get loaded library names
- `clearMaterialLibraries()` - Clear all loaded libraries
- `setTextureLoader(textureLoader)` - Set texture loader
- `setCrossOrigin(policy)` - Set CORS policy
- `setWithCredentials(flag)` - Set credentials flag
- `addProgressListener(key, callback)` - Add progress listener
- `removeProgressListener(key)` - Remove progress listener
- `getStats()` - Get loading statistics

### MaterialCreator

**Constructor**
```javascript
new MaterialCreator(textureLoader, options = {})
```

**Methods**
- `load(mtlText)` - Load materials from MTL text
- `parse(text)` - Parse MTL text content
- `createMaterials()` - Create material objects

## Examples

See the following examples in the repository:
- `examples/mtl-loader-example.js` - Basic MTL loading
- `examples/obj-mtl-example.js` - OBJ with MTL integration
- `examples/material-library-example.js` - Multiple material libraries

## Browser Compatibility

The MTL loader uses modern JavaScript features:
- ES6 Classes
- Promises
- Async/Await
- Map and Set
- Arrow functions

**Browser Support:**
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 79+

## License

This MTL loader is part of the 3D rendering library and is available under the same license as the main project.
