# GLTFLoader.js - Comprehensive GLTF 2.0 Support

A complete GLTF 2.0 loader for the 9th.js 3D graphics library with full support for animations, skinned meshes, PBR materials, cameras, lights, and both JSON (.gltf) and binary (.glb) formats.

## Features

### ✅ Core GLTF 2.0 Support
- **Scene Hierarchy**: Complete node tree with transforms (translation, rotation, scale, matrices)
- **Mesh Data**: Position, normal, UV, color, and custom attributes
- **Materials**: PBR materials with metallic-roughness workflow
- **Animations**: Keyframe tracks for transforms and morph targets
- **Cameras**: Perspective and orthographic camera support
- **Lights**: Directional, point, spot, and ambient lights (KHR_lights_punctual)
- **Skinned Meshes**: Bone hierarchies and skinning data

### ✅ Format Support
- **JSON GLTF (.gltf)**: Standard JSON format with external resources
- **Binary GLB (.glb)**: Single-file binary format
- **Data URIs**: Embedded base64 resources
- **External Resources**: Automatic loading of buffers and images

### ✅ Material System
- **PBR Materials**: MeshStandardMaterial with metallic/roughness workflow
- **Material Maps**: Base color, normal, emissive, occlusion, metallic-roughness
- **Alpha Modes**: Opaque, blend, and mask transparency
- **Double Sided**: Material side control
- **Extensions**: 
  - KHR_materials_pbrSpecularGlossiness
  - KHR_materials_unlit
  - KHR_materials_clearcoat
  - KHR_texture_transform

### ✅ Animation System
- **Keyframe Tracks**: Vector, quaternion, and number keyframes
- **Animation Mixing**: Multiple animation playback and blending
- **Target Types**: Translation, rotation, scale, and morph weights
- **Animation Clips**: Named animation sequences
- **Playback Controls**: Play, pause, loop, speed control

### ✅ Resource Management
- **Caching**: Texture, material, and node caching
- **Loading Manager**: Progress tracking and error handling
- **Memory Management**: Efficient buffer and resource disposal
- **Cross-origin**: CORS support for external resources

## Usage

### Basic Usage

```javascript
import { GLTFLoader } from './loaders/GLTFLoader.js';

// Create loader
const loader = new GLTFLoader();

// Load GLTF file
loader.load('model.gltf', (gltf) => {
    // Add scene to your scene
    scene.add(gltf.scene);
    
    // Access animations
    const mixer = new AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
});

// Or with progress callback
loader.load('model.gltf', 
    (gltf) => { /* loaded */ },
    (progress) => { console.log('Loading:', (progress.loaded / progress.total * 100) + '%'); },
    (error) => { console.error('Error:', error); }
);
```

### Parse JSON String

```javascript
const gltfString = `{
    "asset": { "version": "2.0" },
    "scenes": [{ "nodes": [0] }],
    "nodes": [{ "mesh": 0 }],
    "meshes": [{ "primitives": [] }]
}`;

loader.parse(gltfString, (gltf) => {
    scene.add(gltf.scene);
});
```

### Parse Binary GLB

```javascript
fetch('model.glb')
    .then(response => response.arrayBuffer())
    .then(glbData => {
        loader.parseBinary(glbData, (gltf) => {
            scene.add(gltf.scene);
        });
    });
```

### Configuration

```javascript
const loader = new GLTFLoader();

// Configure loader
loader.config.flipY = false;
loader.config.parseBinary = true;
loader.config.animations = true;
loader.config.materials = true;
loader.config.cameras = true;
loader.config.lights = true;
loader.config.skins = true;
```

### Accessing GLTF Data

```javascript
loader.load('model.gltf', (asset) => {
    // Scene hierarchy
    console.log('Scene:', asset.scene);
    console.log('Nodes:', asset.nodes);
    console.log('Meshes:', asset.meshes);
    
    // Materials and textures
    console.log('Materials:', asset.materials);
    console.log('Textures:', asset.textures);
    
    // Animations
    console.log('Animations:', asset.animations);
    asset.animations.forEach(clip => {
        console.log(`Animation: ${clip.name}, Duration: ${clip.duration}`);
    });
    
    // Cameras and lights
    console.log('Cameras:', asset.cameras);
    console.log('Lights:', asset.lights);
    
    // Raw GLTF data
    console.log('Asset info:', asset.asset);
});
```

### Animation Playback

```javascript
loader.load('animated_model.gltf', (asset) => {
    scene.add(asset.scene);
    
    // Create animation mixer
    const mixer = new AnimationMixer(asset.scene);
    
    // Play all animations
    asset.animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.play();
    });
    
    // Update animation in render loop
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        renderer.render(scene, camera);
    }
    animate();
});
```

### Working with Materials

```javascript
loader.load('model.gltf', (asset) => {
    asset.materials.forEach(material => {
        // Override material properties
        material.roughness = 0.5;
        material.metalness = 0.8;
        material.color = [1, 0.5, 0];
        
        // Enable shadows
        material.needsUpdate = true;
    });
    
    scene.add(asset.scene);
});
```

### Custom Extension Support

```javascript
// Register custom extension
loader.registerExtension('CUSTOM_extension', (extensionData, object) => {
    // Handle custom extension data
    console.log('Custom extension:', extensionData);
});

// Load model with extensions
loader.load('model_with_extensions.gltf', (asset) => {
    // Extensions will be automatically processed
});
```

## GLTF 2.0 Features Supported

### Core
- ✅ Scene and node hierarchy
- ✅ Mesh primitives (points, lines, triangles)
- ✅ Vertex attributes (position, normal, uv, color, custom)
- ✅ Index buffers
- ✅ Morph targets
- ✅ Sparse accessors

### Materials
- ✅ PBR metallic-roughness
- ✅ PBR specular-glossiness
- ✅ Unlit materials
- ✅ Clearcoat materials
- ✅ Texture transforms
- ✅ Alpha modes (opaque, blend, mask)
- ✅ Double-sided materials
- ✅ Emissive materials

### Animations
- ✅ Node transform animations (TRS)
- ✅ Morph target animations
- ✅ Multiple animation clips
- ✅ Animation mixing and blending
- ✅ Playback controls

### Cameras
- ✅ Perspective cameras
- ✅ Orthographic cameras
- ✅ Camera parameters (FOV, aspect, near, far)

### Lights
- ✅ Directional lights
- ✅ Point lights
- ✅ Spot lights (inner/outer cone angles)
- ✅ Ambient lights
- ✅ Light intensity and color
- ✅ Light range and falloff

### Skinned Meshes
- ✅ Joint hierarchies
- ✅ Inverse bind matrices
- ✅ Skinning influences
- ✅ Bone animations

### File Formats
- ✅ JSON GLTF with external resources
- ✅ Binary GLB format
- ✅ Embedded data URIs
- ✅ Buffer compression support

## Error Handling

```javascript
loader.load('model.gltf', 
    (asset) => console.log('Loaded:', asset),
    (progress) => console.log('Progress:', progress),
    (error) => {
        console.error('Load failed:', error);
        // Handle specific error types
        if (error.message.includes('network')) {
            console.log('Network error - check CORS settings');
        } else if (error.message.includes('format')) {
            console.log('Invalid GLTF format');
        }
    }
);
```

## Performance Tips

1. **Enable Caching**: Materials and textures are automatically cached
2. **Use GLB Format**: Single-file binary format reduces HTTP requests
3. **Optimize Textures**: Compress textures before loading
4. **Batch Loads**: Load multiple models with a single loader instance
5. **Monitor Memory**: Dispose unused materials and textures

## Integration Example

```javascript
import { Scene } from '../core/Scene.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { AnimationMixer } from '../animation/AnimationMixer.js';

// Setup scene
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer();

// Create loader
const loader = new GLTFLoader();

// Load model with animations
loader.load('character.glb', 
    (asset) => {
        // Add scene
        scene.add(asset.scene);
        
        // Setup animations
        const mixer = new AnimationMixer(asset.scene);
        asset.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.play();
        });
        
        // Store mixer for animation updates
        asset.mixer = mixer;
        
        // Position camera to see model
        camera.position.z = 5;
    },
    (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
    },
    (error) => {
        console.error('Failed to load model:', error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update animations
    if (asset && asset.mixer) {
        const delta = clock.getDelta();
        asset.mixer.update(delta);
    }
    
    renderer.render(scene, camera);
}
animate();
```

## API Reference

### GLTFLoader

**Constructor**
```javascript
new GLTFLoader(manager?: LoadingManager)
```

**Methods**
- `load(url, onLoad?, onProgress?, onError?)` - Load GLTF/GLB file
- `parse(gltfString, onLoad?, onError?)` - Parse GLTF JSON string
- `parseBinary(glbData, onLoad?, onError?)` - Parse GLB binary data
- `registerExtension(name, handler)` - Register custom extension handler
- `setCrossOrigin(crossOrigin)` - Set CORS mode
- `setWithCredentials(enabled)` - Enable credentials
- `setPath(path)` - Set base path for resources

### GLTFAsset

**Properties**
- `scene` - Default scene Object3D
- `scenes` - Array of scene Object3D
- `nodes` - Array of node Object3D
- `meshes` - Array of mesh objects
- `materials` - Array of materials
- `textures` - Array of textures
- `images` - Array of images
- `animations` - Array of animation clips
- `cameras` - Array of cameras
- `lights` - Array of lights
- `skins` - Array of skin data
- `asset` - GLTF asset metadata

### Configuration

**GLTFLoaderConfig**
- `flipY` - Flip texture Y coordinate (default: true)
- `parseBinary` - Enable binary GLB parsing (default: true)
- `animations` - Enable animation parsing (default: true)
- `materials` - Enable material parsing (default: true)
- `cameras` - Enable camera parsing (default: true)
- `lights` - Enable light parsing (default: true)
- `skins` - Enable skin parsing (default: true)
- `extras` - Enable extras parsing (default: true)

## Supported GLTF Extensions

- ✅ `KHR_materials_pbrSpecularGlossiness` - Specular-glossiness PBR workflow
- ✅ `KHR_materials_unlit` - Unlit materials
- ✅ `KHR_materials_clearcoat` - Clearcoat material property
- ✅ `KHR_texture_transform` - Texture UV transforms
- ✅ `KHR_lights_punctual` - Punctual lights
- ✅ `KHR_materials_ior` - Index of refraction
- ✅ `KHR_materials_transmission` - Transmission materials
- ✅ `KHR_materials_volume` - Volume materials
- ✅ `KHR_materials_iridescence` - Iridescent materials

## Browser Compatibility

- ✅ Modern browsers with WebGL support
- ✅ ES6 modules
- ✅ Fetch API
- ✅ ArrayBuffer and TypedArray support
- ✅ Promise support

## License

MIT License - see LICENSE file for details.