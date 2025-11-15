# Migration Guide: Three.js to Ninth.js

This guide helps you migrate from Three.js to Ninth.js, highlighting key differences, equivalent features, and best practices for making the transition smooth and efficient.

## Overview of Differences

| Aspect | Three.js | Ninth.js |
|--------|----------|----------|
| **Module System** | UMD/ES6 modules | ES6 modules only |
| **Rendering** | WebGL1/2 | WebGL2 optimized |
| **Event System** | Minimal custom events | Comprehensive event system |
| **TypeScript** | Basic support | Full TypeScript definitions |
| **Performance** | General purpose | High-performance focus |
| **API Design** | Class-based only | Functional + Class-based |

## Basic Setup Migration

### Three.js Basic Setup

```javascript
// three.js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();
```

### Ninth.js Equivalent

```javascript
// ninth.js
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, BoxGeometry, BasicMaterial } from 'ninthjs';

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new BoxGeometry();
const material = new BasicMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// Enhanced with event system
renderer.on('frame', (deltaTime) => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
});

// Or use built-in animation loop
renderer.animate(scene);
```

## Core Classes Migration

### Scene

**Three.js:**
```javascript
const scene = new THREE.Scene();
scene.add(object);
scene.remove(object);
scene.children; // Array of all children
```

**Ninth.js:**
```javascript
const scene = new Scene();
scene.add(object);
scene.remove(object);
scene.children; // Optimized array
// Additional features:
scene.getObjectByName('myObject');
scene.traverse((child) => console.log(child));
scene.cullObjects([camera]); // Optimize rendering
```

### Camera

**Three.js:**
```javascript
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.rotation.set(0, 0, 0);
camera.lookAt(0, 0, 0);
```

**Ninth.js:**
```javascript
const camera = new PerspectiveCamera(75, width/height, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.rotation.set(0, 0, 0);
// Enhanced methods:
camera.lookAt(0, 0, 0);
camera.updateMatrix();
camera.frustum; // Access clipping frustum
```

### Renderer

**Three.js:**
```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 1);
renderer.render(scene, camera);
```

**Ninth.js:**
```javascript
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setClearColor(0x000000, 1);
// Enhanced features:
renderer.render(scene, camera);
// Event system integration:
renderer.on('frame', (delta) => {}); // Frame callback
renderer.on('error', (error) => {}); // Error handling
```

## Geometry Migration

### Basic Geometries

| Three.js | Ninth.js | Notes |
|----------|----------|-------|
| `BoxGeometry` | `BoxGeometry` | Same parameters |
| `SphereGeometry` | `SphereGeometry` | Same parameters |
| `PlaneGeometry` | `PlaneGeometry` | Same parameters |
| `CylinderGeometry` | `CylinderGeometry` | Same parameters |
| `ConeGeometry` | `ConeGeometry` | Same parameters |
| `TorusGeometry` | `TorusGeometry` | Same parameters |

### Geometry Creation

**Three.js:**
```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
```

**Ninth.js:**
```javascript
const geometry = new BoxGeometry({
    width: 1,
    height: 1,
    depth: 1,
    widthSegments: 2,
    heightSegments: 2,
    depthSegments: 2
});
```

### BufferGeometry

**Three.js:**
```javascript
const positions = new Float32Array([
    -1, -1,  0,
     1, -1,  0,
     0,  1,  0
]);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

**Ninth.js:**
```javascript
const positions = new Float32Array([
    -1, -1,  0,
     1, -1,  0,
     0,  1,  0
]);

const geometry = new BufferGeometry();
geometry.setAttribute('position', new BufferAttribute(positions, 3));
// Additional features:
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
geometry.computeBoundingBox();
```

## Material Migration

### Basic Materials

| Three.js | Ninth.js | Migration Notes |
|----------|----------|-----------------|
| `MeshBasicMaterial` | `BasicMaterial` | Same parameters |
| `MeshLambertMaterial` | `LambertMaterial` | Same parameters |
| `MeshPhongMaterial` | `PhongMaterial` | Same parameters |
| `MeshStandardMaterial` | `StandardMaterial` | PBR material |
| `MeshPhysicalMaterial` | `PhysicalMaterial` | Enhanced PBR |

### Material Usage

**Three.js:**
```javascript
const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5
});
```

**Ninth.js:**
```javascript
const material = new StandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5,
    envMap: environmentTexture,
    normalMap: normalTexture
});
// Enhanced features:
material.on('property-changed', (prop, oldVal, newVal) => {
    console.log(`Material property ${prop} changed`);
});
```

### Shader Materials

**Three.js:**
```javascript
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    uniforms: {
        time: { value: 0 }
    }
});
```

**Ninth.js:**
```javascript
const material = new ShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    uniforms: {
        time: { value: 0 }
    },
    transparent: true,
    depthTest: true
});
// Enhanced features:
material.setUniform('time', 1.0);
material.compile(renderer); // Pre-compile for performance
```

## Lighting Migration

### Basic Lighting

| Three.js | Ninth.js | Notes |
|----------|----------|-------|
| `AmbientLight` | `AmbientLight` | Same API |
| `DirectionalLight` | `DirectionalLight` | Same API |
| `PointLight` | `PointLight` | Same API |
| `SpotLight` | `SpotLight` | Same API |
| `HemisphereLight` | `HemisphereLight` | Same API |

### Lighting Setup

**Three.js:**
```javascript
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);
```

**Ninth.js:**
```javascript
const ambientLight = new AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
// Enhanced features:
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.mapSize.width = 2048;
```

## Texture Migration

### Texture Loading

**Three.js:**
```javascript
const loader = new THREE.TextureLoader();
const texture = loader.load('texture.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(2, 2);
```

**Ninth.js:**
```javascript
import { TextureLoader } from 'ninthjs';

const loader = new TextureLoader();
const texture = await loader.loadAsync('texture.jpg');
texture.wrapS = TextureLoader.RepeatWrapping;
texture.wrapT = TextureLoader.RepeatWrapping;
texture.repeat.set(2, 2);
// Enhanced features:
texture.generateMipmaps = true;
texture.anisotropy = 8;
texture.premultiplyAlpha = false;
```

### Texture Creation

**Three.js:**
```javascript
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const texture = new THREE.CanvasTexture(canvas);
```

**Ninth.js:**
```javascript
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const texture = new CanvasTexture(canvas);
// Enhanced features:
texture.update();
texture.dispose();
```

## Animation Migration

### Basic Animation Loop

**Three.js:**
```javascript
function animate() {
    requestAnimationFrame(animate);
    
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}
animate();
```

**Ninth.js:**
```javascript
// Using event system
renderer.on('frame', (deltaTime) => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
});

// Or using built-in animation
renderer.animate(scene, (deltaTime) => {
    // Custom animation logic
});
```

### Keyframe Animation

**Three.js:**
```javascript
const mixer = new THREE.AnimationMixer(object);
const action = mixer.clipAction(animationClip);
action.play();

function animate() {
    requestAnimationFrame(animate);
    mixer.update(deltaTime);
    renderer.render(scene, camera);
}
animate();
```

**Ninth.js:**
```javascript
const animator = new Animator(object);
animator.play(animationClip);

renderer.on('frame', (deltaTime) => {
    animator.update(deltaTime);
    renderer.render(scene, camera);
});
// Enhanced features:
animator.setSpeed(1.0);
animator.pause();
animator.resume();
```

## Controls Migration

### OrbitControls

**Three.js:**
```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
```

**Ninth.js:**
```javascript
import { OrbitControls } from 'ninthjs';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// Enhanced features:
controls.on('change', () => {
    camera.updateProjectionMatrix();
});

renderer.on('frame', () => {
    controls.update();
    renderer.render(scene, camera);
});
```

### Custom Controls

**Three.js:**
```javascript
class CustomControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        // Custom implementation
    }
    
    update() {
        // Custom update logic
    }
}
```

**Ninth.js:**
```javascript
class CustomControls extends BaseControls {
    constructor(camera, domElement) {
        super(camera, domElement);
        // Built-in event handling
    }
    
    onPointerDown(event) {
        super.onPointerDown(event);
        // Custom logic
    }
    
    update() {
        super.update();
        // Enhanced with built-in methods
    }
}
```

## Performance Optimization Migration

### Object Management

**Three.js:**
```javascript
// Manual frustum culling
object.frustumCulled = true;
```

**Ninth.js:**
```javascript
// Automatic frustum culling
scene.enableFrustumCulling = true;
object.culled = false; // Override for specific objects

// Level of Detail (LOD)
object.lod = new LOD([
    { object: highDetailMesh, distance: 0 },
    { object: mediumDetailMesh, distance: 50 },
    { object: lowDetailMesh, distance: 100 }
]);
```

### Instanced Rendering

**Three.js:**
```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);

const dummy = new THREE.Object3D();
for (let i = 0; i < 1000; i++) {
    dummy.position.set(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
    );
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

scene.add(instancedMesh);
```

**Ninth.js:**
```javascript
const geometry = new BoxGeometry();
const material = new BasicMaterial({ color: 0x00ff00 });
const instancedMesh = new InstancedMesh(geometry, material, 1000);

const dummy = new Object3D();
for (let i = 0; i < 1000; i++) {
    dummy.position.set(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
    );
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

scene.add(instancedMesh);

// Enhanced features:
instancedMesh.instanceColor = true;
instancedMesh.frustumCulled = true;
```

## Post-Processing Migration

### Effect Composer

**Three.js:**
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass();
composer.addPass(bloomPass);

function animate() {
    requestAnimationFrame(animate);
    composer.render();
}
animate();
```

**Ninth.js:**
```javascript
import { EffectComposer, RenderPass, BloomPass } from 'ninthjs';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new BloomPass({
    strength: 0.5,
    radius: 0.4,
    threshold: 0.85
}));

renderer.on('frame', () => {
    composer.render();
});
```

## Event System Integration

### Adding Event Handling

**Three.js (Limited):**
```javascript
// No built-in event system - manual implementation needed
function addClickHandler(object, callback) {
    object.userData.clickHandler = callback;
}

function handleClick(event) {
    // Manual raycasting and event handling
}
```

**Ninth.js (Built-in):**
```javascript
// Comprehensive event system
object.on('click', (event) => {
    console.log('Object clicked:', event.intersection.point);
});

scene.on('object-added', (object) => {
    console.log('Object added:', object.name);
});

renderer.on('frame', (deltaTime) => {
    // Frame update logic
});
```

### Custom Events

**Ninth.js:**
```javascript
// Create custom event system
class MyApp {
    constructor() {
        this.eventBus = new EventBus();
    }
    
    init() {
        this.eventBus.on('load-complete', this.onLoadComplete.bind(this));
        this.eventBus.emit('load-start');
    }
    
    onLoadComplete() {
        console.log('Application loaded');
    }
}
```

## Common Migration Patterns

### 1. Geometry Updates

**Three.js:**
```javascript
geometry.attributes.position.needsUpdate = true;
geometry.computeVertexNormals();
```

**Ninth.js:**
```javascript
geometry.attributes.position.needsUpdate = true;
geometry.computeVertexNormals();
// Enhanced methods:
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
geometry.computeTangents();
```

### 2. Material Updates

**Three.js:**
```javascript
material.needsUpdate = true;
material.dispose();
```

**Ninth.js:**
```javascript
material.needsUpdate = true;
material.dispose();
// Enhanced event system:
material.on('property-changed', (prop, oldVal, newVal) => {
    // React to changes
});
```

### 3. Scene Graph Operations

**Three.js:**
```javascript
scene.traverse((child) => {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
    }
});
```

**Ninth.js:**
```javascript
scene.traverse((child) => {
    if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
    }
});
// Enhanced traversal:
scene.traverseVisible((child) => {
    // Only visible objects
});

scene.traverseAndModify((child) => {
    // Modify objects during traversal
    child.updateMatrix();
});
```

### 4. Camera Operations

**Three.js:**
```javascript
camera.updateProjectionMatrix();
camera.lookAt(0, 0, 0);
```

**Ninth.js:**
```javascript
camera.updateProjectionMatrix();
camera.lookAt(0, 0, 0);
// Enhanced camera features:
camera.frustum.setFromMatrix(camera.matrixWorld);
camera.updateViewMatrix();
```

## Migration Checklist

### Before Migration

- [ ] Identify all Three.js imports in your codebase
- [ ] List all custom geometries and materials
- [ ] Document any Three.js-specific workarounds
- [ ] Note performance-critical sections
- [ ] Backup current implementation

### During Migration

- [ ] Replace Three.js imports with Ninth.js imports
- [ ] Update constructor calls to match Ninth.js API
- [ ] Replace Three.js controls with Ninth.js equivalents
- [ ] Migrate custom shaders if any
- [ ] Update event handling system
- [ ] Test all visual outputs match expectations

### After Migration

- [ ] Performance testing and optimization
- [ ] Cross-browser compatibility testing
- [ ] Memory usage verification
- [ ] Update documentation and comments
- [ ] Remove Three.js dependencies from package.json

## Performance Considerations

### Benchmarking

**Ninth.js provides built-in performance monitoring:**

```javascript
// Enable performance monitoring
renderer.enableMetrics();

// Get performance statistics
console.log(renderer.getMetrics());
// {
//   frameTime: 16.67,
//   triangles: 1000,
//   drawCalls: 10,
//   geometries: 5,
//   materials: 3
// }
```

### Memory Management

**Enhanced disposal system:**

```javascript
// Automatic resource management
class ResourceManager {
    constructor() {
        this.textures = new Set();
        this.geometries = new Set();
        this.materials = new Set();
    }
    
    addTexture(texture) {
        this.textures.add(texture);
        texture.on('dispose', () => {
            this.textures.delete(texture);
        });
    }
    
    disposeAll() {
        this.textures.forEach(texture => texture.dispose());
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());
    }
}
```

## Breaking Changes and Limitations

### API Differences

1. **Constructor Parameters**: Some constructors accept objects instead of individual parameters
2. **Method Names**: Some method names have been standardized for consistency
3. **Property Access**: Some properties are now accessed through getters/setters
4. **Event System**: Custom event handling differs significantly

### Removed Features

1. **Legacy Browsers**: Ninth.js requires modern browsers (WebGL2)
2. **Global Access**: No global THREE namespace
3. **Non-ES6 Modules**: UMD builds are not supported

### New Features in Ninth.js

1. **Advanced Event System**: Comprehensive event handling
2. **Performance Monitoring**: Built-in metrics and profiling
3. **TypeScript Support**: Full type definitions
4. **Enhanced Materials**: Advanced PBR materials
5. **Optimized Rendering**: WebGL2-specific optimizations

## Support and Resources

### Getting Help

- Check the [comprehensive API reference](./comprehensive-api-reference.md)
- Review [usage examples](./usage-examples.md)
- Consult [WebGL troubleshooting](./webgl-troubleshooting.md)
- Use the built-in event system for debugging

### Migration Tools

Ninth.js provides several tools to help with migration:

```javascript
// Migration helper
import { migrateFromThree } from 'ninthjs/migration';

const scene = migrateFromThree(threeScene, {
    // Migration options
    preserveUserData: true,
    enableEventSystem: true,
    optimizePerformance: true
});
```

This migration guide provides a comprehensive overview of transitioning from Three.js to Ninth.js. The key benefits include improved performance, better type safety, enhanced event handling, and modern WebGL2 optimizations.