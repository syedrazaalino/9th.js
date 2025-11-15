# Getting Started with 9th.js

This guide will help you get started with 9th.js, a modern 3D JavaScript library for creating interactive graphics and visualizations.

## Installation

### NPM

```bash
npm install 9th.js
```

### CDN

```html
<script src="https://unpkg.com/9th.js/dist/9th.js"></script>
```

### ES Modules

```typescript
import { Engine, Scene, PerspectiveCamera } from '9th.js';
```

## Your First 3D Scene

Let's create a simple 3D scene with a rotating cube:

```typescript
import { Engine, Scene, PerspectiveCamera, BoxGeometry, StandardMaterial, DirectionalLight, AmbientLight } from '9th.js';

// Get canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Initialize engine
const engine = new Engine(canvas);

// Create scene
const scene = new Scene();

// Setup lighting
const ambientLight = new AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create camera
const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
camera.position.z = 5;
engine.setCamera(camera);

// Create geometry and material
const geometry = new BoxGeometry(1, 1, 1);
const material = new StandardMaterial({ color: 0x00ff00 });

// Create mesh
const cube = new Mesh(geometry, material);
scene.add(cube);

// Animation loop
let time = 0;
function animate() {
  time += 0.01;
  
  // Rotate cube
  cube.rotation.x = time;
  cube.rotation.y = time * 0.5;
  
  requestAnimationFrame(animate);
}

// Start rendering
engine.start();
```

### HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>9th.js Getting Started</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## Understanding the Core Components

### Engine

The `Engine` class is the heart of 9th.js. It initializes the WebGL context and manages the render loop.

```typescript
const engine = new Engine(canvas, {
  antialias: true,      // Enable anti-aliasing
  alpha: false,         // Alpha blending
  depth: true,          // Depth buffer
  powerPreference: 'high-performance'
});
```

### Scene

The `Scene` class acts as a container for all 3D objects, cameras, and lights.

```typescript
const scene = new Scene();

// Add objects
scene.add(mesh);

// Add lights
scene.add(light);

// Add cameras
scene.add(camera);
```

### Camera

Cameras define how the 3D world is projected to the screen.

```typescript
// Perspective camera
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);

// Orthographic camera
const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
```

### Geometry

Geometry classes define the shape of 3D objects.

```typescript
// Common geometries
const box = new BoxGeometry(1, 1, 1);
const sphere = new SphereGeometry(1, 32, 16);
const plane = new PlaneGeometry(10, 10);
```

### Materials

Materials control how objects are rendered.

```typescript
// Basic unlit material
const basic = new BasicMaterial({ color: 0xff0000 });

// Phong shaded material
const phong = new PhongMaterial({
  color: 0xff0000,
  specular: 0x111111,
  shininess: 30
});

// PBR standard material
const standard = new StandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5
});
```

## Basic Operations

### Object Transformation

```typescript
// Position
mesh.position.set(0, 0, 0);
mesh.position.x = 1;
mesh.position.y = 2;
mesh.position.z = 3;

// Rotation (in radians)
mesh.rotation.set(0, Math.PI / 4, 0);

// Scale
mesh.scale.set(1, 1, 1);
mesh.scale.x = 2; // Double size on X axis
```

### Animation

```typescript
// Simple animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update object
  cube.rotation.y += 0.01;
  
  // Render
  engine.render();
}

// Start animation
animate();
```

### Lighting

```typescript
// Ambient light - overall scene lighting
const ambientLight = new AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Directional light - like the sun
const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Point light - like a light bulb
const pointLight = new PointLight(0xffffff, 1);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);
```

## Common Tasks

### Resizing the Window

```typescript
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  engine.resize(width, height);
}

window.addEventListener('resize', onWindowResize);
```

### Loading Textures

```typescript
const textureLoader = new TextureLoader();
textureLoader.load('texture.jpg', (texture) => {
  material.map = texture;
  material.needsUpdate = true;
});

// Async loading
const texture = await textureLoader.loadAsync('texture.jpg');
```

### Loading 3D Models

```typescript
const loader = new GLTFLoader();
loader.load('model.gltf', (gltf) => {
  scene.add(gltf.scene);
  
  // Access animations
  if (gltf.animations.length > 0) {
    const mixer = new AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }
});
```

### Mouse Controls

```typescript
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = true;

// Update controls in animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  engine.render();
}
```

## Performance Optimization

### Use Object Pooling

```typescript
// Reuse objects instead of creating new ones
class ObjectPool {
  private pool: Mesh[] = [];
  
  get(): Mesh {
    return this.pool.pop() || new Mesh();
  }
  
  release(mesh: Mesh): void {
    this.pool.push(mesh);
  }
}
```

### Enable Frustum Culling

```typescript
// Enable automatic culling of objects outside camera view
scene.enable('frustum_culling', true);
```

### Use Instancing for Multiple Objects

```typescript
const instanced = new InstancedMesh(geometry, material, 1000);

// Set transforms for each instance
for (let i = 0; i < 1000; i++) {
  instanced.setMatrixAt(i, matrix);
}
```

## Next Steps

Now that you have the basics, explore these topics:

- **[Core Concepts](core-concepts.md)** - Deep dive into 9th.js architecture
- **[Rendering Guide](rendering.md)** - Advanced rendering techniques
- **[Animation System](animation.md)** - Creating complex animations
- **[Materials Guide](materials.md)** - Working with materials and shaders
- **[Lighting Guide](lighting.md)** - Advanced lighting techniques

## Examples

Check out the [examples directory](../examples/) for complete working demos:

- [basic.html](../examples/basic.html) - Simple rotating cube
- [webgl-renderer-demo.html](../examples/webgl-renderer-demo.html) - WebGL rendering showcase
- [animation-system-demo.html](../examples/animation-system-demo.html) - Animation examples

## Troubleshooting

### Common Issues

**WebGL Context Lost**
```typescript
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.log('WebGL context lost');
  // Stop rendering
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Recreate resources
  engine = new Engine(canvas);
});
```

**Performance Issues**
```typescript
// Check performance
const performance = engine.getPerformance();
console.log(`FPS: ${performance.fps}`);

// Enable optimizations
engine.enable('frustum_culling', true);
engine.enable('pixel_ratio', false); // Disable device pixel ratio for better performance
```

**Memory Leaks**
```typescript
// Always dispose of resources when no longer needed
geometry.dispose();
material.dispose();
texture.dispose();

// Clean up engine
engine.dispose();
```