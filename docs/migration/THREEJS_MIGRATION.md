# Migration Guide: Three.js to 9th.js

## Overview

This guide helps you migrate your Three.js applications to 9th.js, a lightweight, modern 3D graphics library. While both libraries share WebGL as their rendering foundation, they have different API designs, performance characteristics, and architectural approaches.

## Key Differences

### Architecture Philosophy
- **Three.js**: Comprehensive feature-rich library with extensive ecosystem
- **9th.js**: Lightweight, focused library with minimal overhead
- **Three.js**: Object-oriented with deep inheritance hierarchies
- **9th.js**: Simpler, more functional approach with explicit APIs

### Bundle Size
- **Three.js**: ~500KB+ (full library)
- **9th.js**: ~50-80KB (core functionality)

### Learning Curve
- **Three.js**: Steep learning curve due to extensive features
- **9th.js**: Gentle learning curve with intuitive API

## Detailed Comparison Table

| Feature | Three.js | 9th.js | Notes |
|---------|----------|--------|-------|
| **Core Engine** | `WebGLRenderer` | `Engine` + `Renderer` | 9th.js separates engine initialization from rendering |
| **Scene Management** | `THREE.Scene()` | `Scene()` | Similar functionality, different method names |
| **Camera** | `PerspectiveCamera`, `OrthographicCamera` | `PerspectiveCamera`, `OrthographicCamera` | Same class names, different API methods |
| **Geometry** | `BoxGeometry`, `SphereGeometry` | `BoxGeometry`, `SphereGeometry` | Same class names, different constructors |
| **Materials** | `MeshBasicMaterial`, `MeshPhongMaterial` | `BasicMaterial`, `PhongMaterial` | Simplified naming without "Mesh" prefix |
| **Lighting** | `AmbientLight`, `DirectionalLight` | `AmbientLight`, `DirectionalLight` | Same class names, different method names |
| **Math Utils** | `THREE.MathUtils` (various classes) | `Vec3`, `Color`, `MathUtils` | 9th.js uses simpler utility functions |
| **Animation** | `AnimationMixer`, `KeyframeTrack` | Manual animation loop | 9th.js favors manual animation control |
| **Loaders** | `TextureLoader`, `GLTFLoader`, etc. | `TextureLoader`, `JSONLoader` | More limited loader options |
| **Controls** | `OrbitControls`, etc. | Custom implementation required | No built-in controls |
| **Shaders** | `ShaderMaterial` | `Material` base class | Simplified shader system |

## API Mapping Guide

### Core Classes

#### Initialization
```javascript
// Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// 9th.js
const engine = new Engine(canvas, { antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new Renderer(canvas);
```

#### Object Creation
```javascript
// Three.js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 9th.js
const geometry = new BoxGeometry(1, 1, 1);
const material = new BasicMaterial({ color: '#ff0000' });
const cube = new Mesh(geometry);
cube.material = material;
scene.add(cube);
```

### Geometry Classes

#### BoxGeometry
```javascript
// Three.js
const geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);

// 9th.js
const geometry = new BoxGeometry(width, height, depth);
// Note: 9th.js doesn't support segment parameters
```

#### SphereGeometry
```javascript
// Three.js
const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);

// 9th.js
const geometry = new SphereGeometry(radius, widthSegments, heightSegments);
// Note: 9th.js doesn't support start/length parameters
```

#### Custom Geometry
```javascript
// Three.js
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setIndex(indices);

// 9th.js
// 9th.js doesn't have BufferGeometry - use built-in geometries or loaders
```

### Material Classes

#### BasicMaterial
```javascript
// Three.js
const material = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.5
});

// 9th.js
const material = new BasicMaterial({
  color: '#ff0000',
  transparent: true,
  opacity: 0.5
});
```

#### PhongMaterial
```javascript
// Three.js
const material = new THREE.MeshPhongMaterial({
  color: 0xff0000,
  shininess: 30,
  specular: 0xffffff,
  emissive: 0x000000
});

// 9th.js
const material = new PhongMaterial({
  color: '#ff0000',
  shininess: 30,
  specular: '#ffffff'
});
// Note: 9th.js doesn't support emissive property
```

### Light Classes

#### AmbientLight
```javascript
// Three.js
const light = new THREE.AmbientLight(0x404040, intensity);

// 9th.js
const light = new AmbientLight(intensity, '#404040');
```

#### DirectionalLight
```javascript
// Three.js
const light = new THREE.DirectionalLight(0xffffff, intensity);
light.position.set(1, 1, 1);
light.target.position.set(0, 0, 0);

// 9th.js
const light = new DirectionalLight(intensity, '#ffffff', { x: 1, y: 1, z: 1 });
light.setDirection(x, y, z); // Note: This sets the light's direction, not position
```

### Transform Properties

#### Position
```javascript
// Three.js
object.position.set(x, y, z);
// or
object.position.x = x;
object.position.y = y;
object.position.z = z;

// 9th.js
object.setPosition(x, y, z);
// Note: No direct property access for position
```

#### Rotation
```javascript
// Three.js
object.rotation.set(x, y, z);
// or
object.rotation.x = x;
object.rotation.y = y;
object.rotation.z = z;

// 9th.js
object.setRotation(x, y, z);
// Note: Rotation is in radians, not degrees
```

#### Scale
```javascript
// Three.js
object.scale.set(x, y, z);
// or
object.scale.x = x;
object.scale.y = y;
object.scale.z = z;

// 9th.js
object.setScale(x, y, z);
// Note: No direct property access for scale
```

### Scene Methods

```javascript
// Three.js
scene.add(object);
scene.remove(object);
scene.children; // Array of all children

// 9th.js
scene.add(object);
scene.remove(object);
scene.getObjects(); // Returns array of all objects
scene.clear(); // Remove all objects
scene.setBackground(color);
scene.getBackground();
```

## Code Conversion Examples

### Example 1: Basic Scene Setup

#### Three.js Version
```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x222222);

document.body.appendChild(renderer.domElement);

// Create cube
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({ color: 0x4488ff });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  
  renderer.render(scene, camera);
}

camera.position.z = 5;
animate();
```

#### 9th.js Version
```javascript
import { Engine, Scene, Renderer, PerspectiveCamera, BoxGeometry, PhongMaterial, Mesh, AmbientLight, DirectionalLight } from '9th.js';

const canvas = document.getElementById('canvas');
const engine = new Engine(canvas, { antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Renderer(canvas);

scene.setBackground('#222222');

// Create cube
const geometry = new BoxGeometry(2, 2, 2);
const material = new PhongMaterial({ color: '#4488ff' });
const cube = new Mesh(geometry);
cube.material = material;
scene.add(cube);

// Add lighting
const ambientLight = new AmbientLight(0.3, '#404040');
scene.add(ambientLight);

const directionalLight = new DirectionalLight(1, '#ffffff');
directionalLight.setDirection(-1, -1, -1);
scene.add(directionalLight);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  const time = performance.now() * 0.001;
  cube.setRotation(time, time, 0);
  
  camera.setPosition(0, 0, 5);
  
  renderer.render(scene, camera);
}

animate();
```

### Example 2: Interactive Camera Controls

#### Three.js Version (with OrbitControls)
```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Create objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x4488ff });

for (let i = 0; i < 10; i++) {
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  );
  scene.add(cube);
}

function animate() {
  requestAnimationFrame(animate);
  
  controls.update();
  
  renderer.render(scene, camera);
}

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### 9th.js Version (manual controls)
```javascript
import { Engine, Scene, Renderer, PerspectiveCamera, BoxGeometry, BasicMaterial, Mesh, MathUtils } from '9th.js';

const canvas = document.getElementById('canvas');
const engine = new Engine(canvas, { antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Renderer(canvas);

// Manual camera control state
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let cameraAngle = 0;
let cameraHeight = 0;
let cameraDistance = 10;

// Create objects
const geometry = new BoxGeometry(1, 1, 1);
const material = new BasicMaterial({ color: '#4488ff' });

for (let i = 0; i < 10; i++) {
  const cube = new Mesh(geometry);
  cube.material = material;
  cube.setPosition(
    MathUtils.random(-10, 10),
    MathUtils.random(-10, 10),
    MathUtils.random(-10, 10)
  );
  scene.add(cube);
}

// Mouse controls
canvas.addEventListener('mousedown', (event) => {
  isMouseDown = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
  if (!isMouseDown) return;
  
  const deltaX = event.clientX - lastMouseX;
  const deltaY = event.clientY - lastMouseY;
  
  cameraAngle -= deltaX * 0.01;
  cameraHeight = MathUtils.clamp(cameraHeight - deltaY * 0.01, -Math.PI/2 + 0.1, Math.PI/2 - 0.1);
  
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraDistance = MathUtils.clamp(cameraDistance + event.deltaY * 0.01, 3, 50);
});

function animate() {
  requestAnimationFrame(animate);
  
  // Update camera position based on controls
  camera.setPosition(
    cameraDistance * Math.cos(cameraAngle) * Math.cos(cameraHeight),
    cameraDistance * Math.sin(cameraHeight),
    cameraDistance * Math.sin(cameraAngle) * Math.cos(cameraHeight)
  );
  
  const target = { x: 0, y: 0, z: 0 };
  camera.lookAt(target.x, target.y, target.z);
  
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
```

### Example 3: Loading Textures

#### Three.js Version
```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const texture = loader.load('texture.jpg', (loadedTexture) => {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.MeshBasicMaterial({ map: loadedTexture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  
  animate();
});

texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
```

#### 9th.js Version
```javascript
import { Engine, Scene, Renderer, PerspectiveCamera, BoxGeometry, Mesh, TextureLoader } from '9th.js';

const canvas = document.getElementById('canvas');
const engine = new Engine(canvas, { antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Renderer(canvas);

const loader = new TextureLoader();

loader.load('texture.jpg', (loadedTexture) => {
  // Note: 9th.js TextureLoader may have different callback signature
  const geometry = new BoxGeometry(2, 2, 2);
  // 9th.js may not support texture mapping in BasicMaterial
  const material = new BasicMaterial({ color: '#ffffff' });
  const cube = new Mesh(geometry);
  cube.material = material;
  scene.add(cube);
  
  animate();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
```

## Common Patterns Translation

### Pattern 1: Object Creation and Manipulation

#### Three.js Pattern
```javascript
// Create and modify objects
const objects = [];

for (let i = 0; i < 10; i++) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x4488ff })
  );
  
  mesh.position.x = i * 2;
  mesh.position.y = 0;
  mesh.position.z = 0;
  
  mesh.rotation.x = Math.random() * Math.PI;
  mesh.rotation.y = Math.random() * Math.PI;
  
  mesh.scale.set(1, 1, 1);
  
  mesh.visible = true;
  
  scene.add(mesh);
  objects.push(mesh);
}

// Animation
function updateObjects() {
  objects.forEach(obj => {
    obj.rotation.x += 0.01;
    obj.position.y = Math.sin(Date.now() * 0.001) * 2;
  });
}
```

#### 9th.js Pattern
```javascript
// Create and modify objects
const objects = [];

for (let i = 0; i < 10; i++) {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1));
  mesh.material = new BasicMaterial({ color: '#4488ff' });
  
  mesh.setPosition(i * 2, 0, 0);
  mesh.setRotation(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.setScale(1, 1, 1);
  
  mesh.visible = true;
  
  scene.add(mesh);
  objects.push(mesh);
}

// Animation
function updateObjects() {
  const time = performance.now() * 0.001;
  objects.forEach(obj => {
    const rotation = obj.rotation;
    obj.setRotation(rotation.x + 0.01, rotation.y + 0.01, rotation.z);
    obj.setPosition(obj.position.x, Math.sin(time) * 2, obj.position.z);
  });
}
```

### Pattern 2: Event Handling

#### Three.js Pattern
```javascript
renderer.domElement.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(scene.children);
  
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    // Handle click
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### 9th.js Pattern
```javascript
canvas.addEventListener('click', (event) => {
  const mouse = {
    x: (event.clientX / window.innerWidth) * 2 - 1,
    y: -(event.clientY / window.innerHeight) * 2 + 1
  };
  
  // Manual raycasting implementation would be needed
  // 9th.js doesn't have built-in raycasting
  
  const objects = scene.getObjects();
  const clickedObject = findClickedObject(mouse, objects, camera);
  
  if (clickedObject) {
    // Handle click
  }
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Helper function for raycasting
function findClickedObject(mouse, objects, camera) {
  // Implement manual raycasting logic
  // This is a simplified example
  for (const obj of objects) {
    // Check if mouse position is within object's bounds
    const objScreenPosition = worldToScreen(obj.position, camera);
    const distance = Math.sqrt(
      Math.pow(mouse.x - objScreenPosition.x, 2) + 
      Math.pow(mouse.y - objScreenPosition.y, 2)
    );
    
    if (distance < 0.1) { // Threshold for clicking
      return obj;
    }
  }
  return null;
}
```

### Pattern 3: Performance Optimization

#### Three.js Pattern
```javascript
// Use instanced meshes for better performance
const InstancedMesh = THREE.InstancedMesh;
const Matrix4 = THREE.Matrix4;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x4488ff });

const count = 1000;
const mesh = new InstancedMesh(geometry, material, count);

const matrix = new Matrix4();
const position = new THREE.Vector3();

for (let i = 0; i < count; i++) {
  position.set(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100
  );
  
  matrix.setPosition(position);
  mesh.setMatrixAt(i, matrix);
}

scene.add(mesh);

// Update only changed instances
function updateInstances() {
  mesh.instanceMatrix.needsUpdate = true;
}
```

#### 9th.js Pattern
```javascript
// 9th.js doesn't have built-in instancing
// Use regular meshes for better performance with smaller counts

const objects = [];
const geometry = new BoxGeometry(1, 1, 1);
const material = new BasicMaterial({ color: '#4488ff' });

const count = 100; // Reduced count due to lack of instancing
for (let i = 0; i < count; i++) {
  const mesh = new Mesh(geometry);
  mesh.material = material;
  mesh.setPosition(
    MathUtils.random(-50, 50),
    MathUtils.random(-50, 50),
    MathUtils.random(-50, 50)
  );
  
  scene.add(mesh);
  objects.push(mesh);
}

// Batch updates for better performance
function batchUpdate() {
  const time = performance.now() * 0.001;
  for (let i = 0; i < objects.length; i++) {
    const mesh = objects[i];
    const offset = i * 0.1;
    mesh.setRotation(time + offset, time * 1.2 + offset, 0);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Canvas Not Rendering
**Problem**: Black screen or no visible content

**Three.js Solutions**:
- Check if camera position is correct
- Verify scene has objects
- Ensure renderer size matches canvas

**9th.js Solutions**:
```javascript
// Check engine initialization
const engine = new Engine(canvas, { antialias: true });
if (!engine) {
  console.error('Failed to initialize engine');
  return;
}

// Verify scene setup
const scene = new Scene();
const objects = scene.getObjects();
console.log('Objects in scene:', objects.length);

// Check camera position
camera.setPosition(0, 0, 5);
camera.lookAt(0, 0, 0);

// Verify renderer
renderer.render(scene, camera);
```

#### Issue 2: Incorrect Rotation Angles
**Problem**: Objects rotating too fast/slow or in wrong direction

**Diagnosis**:
- Three.js uses degrees in some contexts
- 9th.js always uses radians

**Solution**:
```javascript
// Convert degrees to radians
const degrees = 45;
const radians = degrees * (Math.PI / 180);

// Three.js
object.rotation.x = THREE.MathUtils.degToRad(degrees);

// 9th.js
object.setRotation(radians, radians, radians);
```

#### Issue 3: Material Not Applied
**Problem**: Objects appear with default material

**Three.js Solutions**:
```javascript
// Ensure material is properly assigned
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

**9th.js Solutions**:
```javascript
// 9th.js requires setting material as property
const mesh = new Mesh(geometry);
mesh.material = material; // Must explicitly set material
scene.add(mesh);

// Verify material properties
if (!mesh.material) {
  console.error('Material not set');
  return;
}
```

#### Issue 4: Performance Issues
**Problem**: Low FPS or stuttering

**Three.js Optimizations**:
- Use `requestAnimationFrame` properly
- Implement frustum culling
- Use `InstancedMesh` for many objects

**9th.js Optimizations**:
```javascript
// Minimize object count (9th.js is designed for smaller scenes)
const MAX_OBJECTS = 50;

// Use simpler materials
const material = new BasicMaterial({ color: '#ff0000' }); // Better performance than Phong

// Implement manual frustum culling
function isInView(object, camera) {
  const objPos = object.position;
  const camPos = camera.position;
  const distance = Math.sqrt(
    Math.pow(objPos.x - camPos.x, 2) +
    Math.pow(objPos.y - camPos.y, 2) +
    Math.pow(objPos.z - camPos.z, 2)
  );
  
  return distance < 100; // Adjust based on your scene
}

// Batch updates
function updateScene() {
  const objects = scene.getObjects();
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (isInView(obj, camera)) {
      // Update only visible objects
      obj.setRotation(obj.rotation.x + 0.01, obj.rotation.y, obj.rotation.z);
    }
  }
}
```

#### Issue 5: Event Handling Problems
**Problem**: Mouse/keyboard events not working

**Three.js Solutions**:
- Use `OrbitControls` or similar built-in controls
- Event listeners on `renderer.domElement`

**9th.js Solutions**:
```javascript
// Manual event handling
let isMouseDown = false;

canvas.addEventListener('mousedown', (event) => {
  isMouseDown = true;
  handleMouseDown(event);
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
  if (isMouseDown) {
    handleMouseDrag(event);
  }
});

function handleMouseDown(event) {
  // Convert mouse coordinates
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  // Convert to normalized device coordinates
  const normalizedX = (mouseX / canvas.width) * 2 - 1;
  const normalizedY = -(mouseY / canvas.height) * 2 + 1;
  
  console.log('Mouse clicked at:', normalizedX, normalizedY);
}
```

### Migration Checklist

Before migrating your Three.js application:

- [ ] **Understand 9th.js limitations**
  - No built-in controls (implement manually)
  - Limited material options
  - No advanced lighting features
  - Smaller ecosystem

- [ ] **Update imports**
  ```javascript
  // From
  import * as THREE from 'three';
  
  // To
  import { Engine, Scene, Renderer, ... } from '9th.js';
  ```

- [ ] **Replace initialization code**
  - Use `Engine` instead of `WebGLRenderer` directly
  - Create separate `Renderer` instance

- [ ] **Update geometry creation**
  - Check constructor parameter differences
  - Remove unsupported segment parameters

- [ ] **Update material usage**
  - Remove "Mesh" prefix from material names
  - Update property names (e.g., `color: '#ff0000'` instead of `color: 0xff0000`)

- [ ] **Update transform methods**
  - Use `setPosition()`, `setRotation()`, `setScale()` methods
  - Remember rotation is in radians

- [ ] **Implement manual features**
  - Camera controls
  - Raycasting
  - Performance optimizations

- [ ] **Test thoroughly**
  - Compare visual output
  - Check performance
  - Verify all interactions work

### Performance Considerations

**9th.js Advantages**:
- Smaller bundle size
- Faster startup time
- Lower memory footprint
- Simpler debugging

**Three.js Advantages**:
- Better performance for complex scenes
- More optimization features
- Advanced rendering techniques
- Hardware acceleration features

**Migration Strategy**:
1. Start with simple scenes
2. Test performance with similar content
3. Implement custom features as needed
4. Optimize for 9th.js limitations

### Getting Help

**Resources**:
- [9th.js API Documentation](../API.md)
- [9th.js Examples](../../examples/)
- Three.js migration community discussions

**Common Support Topics**:
- Performance optimization
- Missing features implementation
- Custom shader creation
- Loading specific asset types

---

*This migration guide is a living document. As 9th.js evolves, some information may become outdated. Always refer to the latest API documentation for the most current information.*