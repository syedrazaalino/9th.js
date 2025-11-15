# 9th.js API Documentation

Welcome to the 9th.js API documentation. This comprehensive guide covers all classes, methods, properties, and utilities available in the 9th.js 3D graphics library.

## Overview

9th.js is a modern 3D JavaScript library for creating interactive graphics and visualizations in web browsers using WebGL. The library provides a comprehensive set of classes for 3D rendering, animation, geometry, materials, lighting, and more.

## Quick Start

### Installation

```bash
npm install 9th.js
```

### Basic Usage

```typescript
import { Engine, Scene, PerspectiveCamera, BoxGeometry, BasicMaterial } from '9th.js';

// Create engine
const engine = new Engine(canvas);

// Create scene
const scene = new Scene();

// Create camera
const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
camera.position.z = 5;
engine.setCamera(camera);

// Create geometry and material
const geometry = new BoxGeometry();
const material = new BasicMaterial({ color: 0x00ff00 });

// Create mesh
const mesh = new Mesh(geometry, material);
scene.add(mesh);

// Start rendering
engine.start();
```

## Documentation Structure

### Core API

- **[Engine](Engine.html)** - Main engine class for initializing and managing the 3D environment
- **[Scene](Scene.html)** - Container for all 3D objects and scene management
- **[Renderer](WebGLRenderer.html)** - WebGL rendering system
- **[Object3D](Object3D.html)** - Base class for all 3D objects

### Cameras

- **[Camera](Camera.html)** - Base camera class
- **[PerspectiveCamera](PerspectiveCamera.html)** - Perspective projection camera
- **[OrthographicCamera](OrthographicCamera.html)** - Orthographic projection camera

### Geometry

- **[BufferGeometry](BufferGeometry.html)** - Core geometry class with buffer attributes
- **[BoxGeometry](BoxGeometry.html)** - Box-shaped geometry
- **[SphereGeometry](SphereGeometry.html)** - Sphere-shaped geometry
- **[PlaneGeometry](PlaneGeometry.html)** - Flat plane geometry
- **[CylinderGeometry](CylinderGeometry.html)** - Cylinder-shaped geometry

### Materials

- **[Material](Material.html)** - Base material class
- **[BasicMaterial](BasicMaterial.html)** - Simple unlit material
- **[PhongMaterial](PhongMaterial.html)** - Phong shading material
- **[StandardMaterial](StandardMaterial.html)** - PBR standard material

### Lighting

- **[Light](Light.html)** - Base light class
- **[AmbientLight](AmbientLight.html)** - Ambient lighting
- **[DirectionalLight](DirectionalLight.html)** - Directional light source
- **[PointLight](PointLight.html)** - Point light source
- **[SpotLight](SpotLight.html)** - Spotlight with angle control

### Animation

- **[AnimationClip](AnimationClip.html)** - Animation data container
- **[AnimationMixer](AnimationMixer.html)** - Animation playback controller
- **[KeyframeTrack](KeyframeTrack.html)** - Keyframe animation tracks

### Math & Utilities

- **[Vector3](Vector3.html)** - 3D vector operations
- **[Color](Color.html)** - Color utilities
- **[Matrix4](Matrix4.html)** - 4x4 matrix operations
- **[Quaternion](Quaternion.html)** - Quaternion operations

### Loaders

- **[Loader](Loader.html)** - Base loader class
- **[TextureLoader](TextureLoader.html)** - Texture loading
- **[GLTFLoader](GLTFLoader.html)** - glTF format loader
- **[OBJLoader](OBJLoader.html)** - OBJ format loader

### Events

The library includes a comprehensive event system for handling interactions and lifecycle events:

```typescript
// Scene events
scene.on('objectAdded', (object) => {
  console.log('Object added:', object);
});

// Renderer events
renderer.on('contextLost', () => {
  console.log('WebGL context lost');
});

// Animation events
mixer.on('finished', (clip) => {
  console.log('Animation finished:', clip);
});
```

## Common Patterns

### Creating a Basic Scene

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const engine = new Engine(canvas);
const scene = new Scene();

// Add lighting
const ambientLight = new AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create and position camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
engine.setCamera(camera);

// Create content
const geometry = new BoxGeometry();
const material = new StandardMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
scene.add(cube);

// Start rendering
engine.start();
```

### Animation

```typescript
const mixer = new AnimationMixer(scene);
const track = new VectorKeyframeTrack('.position', [0, 1, 2], [
  0, 0, 0,  // start
  2, 2, 2,  // mid
  0, 0, 0   // end
]);
const clip = new AnimationClip('move', 2, [track]);
const action = mixer.clipAction(clip);
action.play();
```

### Loading Assets

```typescript
const loader = new GLTFLoader();
loader.load('model.gltf', (gltf) => {
  scene.add(gltf.scene);
});

const textureLoader = new TextureLoader();
const texture = await textureLoader.loadAsync('texture.jpg');
```

## Performance Tips

1. **Object Pooling** - Reuse objects when possible to reduce garbage collection
2. **Frustum Culling** - Enable frustum culling for large scenes
3. **Level of Detail** - Use LOD for complex models
4. **Texture Optimization** - Use appropriate texture formats and sizes
5. **Batch Rendering** - Use instancing for multiple similar objects

## Browser Compatibility

9th.js requires WebGL 1.0 or higher. The library has been tested on:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Examples

Explore the [examples directory](../examples/) for complete working demos:

- [Basic Demo](../examples/basic.html) - Getting started example
- [Advanced Demo](../examples/advanced.html) - Complex scene with multiple features
- [Animation Demo](../examples/animation-system-demo.html) - Animation system showcase
- [Material Demo](../examples/pbr-demo.html) - PBR materials demonstration

## Contributing

Please see our [Contributing Guide](../CONTRIBUTING.md) for information on contributing to the 9th.js library.

## License

This library is licensed under the MIT License. See [LICENSE](../LICENSE) for details.