# Core Concepts

Understanding the core concepts of 9th.js will help you build more efficient and complex 3D applications. This guide covers the fundamental architecture and concepts that power 9th.js.

## Architecture Overview

9th.js follows a scene graph architecture where all 3D objects are organized in a hierarchical tree structure. The main components are:

- **Engine** - Main application controller
- **Scene** - Container for all 3D objects
- **Camera** - Defines the viewing perspective
- **Renderer** - WebGL rendering system
- **Object3D** - Base class for all 3D objects

## Scene Graph

The scene graph is a tree structure that organizes all objects in 3D space. Each object can have children and inherits transformations from its parent.

```typescript
const scene = new Scene();
const parent = new Mesh();
const child = new Mesh();

// Setup hierarchy
scene.add(parent);
parent.add(child);

// Child inherits parent's transformations
parent.position.set(10, 0, 0);
child.position.set(0, 5, 0); // Relative to parent

// World position: (10, 5, 0)
```

### Benefits of Scene Graph

1. **Hierarchical Transforms** - Child objects inherit parent transformations
2. **Efficient Culling** - Objects can be culled as groups
3. **Organized Structure** - Logical grouping of related objects
4. **Animation Systems** - Easy to animate groups of objects

## Object3D System

`Object3D` is the base class for all objects that can exist in 3D space. It provides:

### Transformations

```typescript
const object = new Object3D();

// Position
object.position.set(x, y, z);  // Vector3
object.position.x = 10;
object.position.y = 5;
object.position.z = -3;

// Rotation
object.rotation.set(x, y, z);  // Euler angles in radians
object.rotation.x = Math.PI / 4;
object.rotation.y = Math.PI / 2;
object.rotation.z = 0;

// Scale
object.scale.set(x, y, z);
object.scale.x = 1.5; // Stretch X axis
object.scale.y = 2;   // Stretch Y axis
object.scale.z = 1;   // No change to Z

// Quaternion rotation (avoiding gimbal lock)
const quaternion = new Quaternion();
quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
object.setRotationFromQuaternion(quaternion);
```

### World vs Local Space

```typescript
// Local space - relative to parent
object.position.set(5, 0, 0);

// World space - absolute position
object.positionWorld.set(10, 0, 0);

// Transform between spaces
const worldPosition = object.position.clone();
object.parent.worldToLocal(worldPosition);

const localPosition = worldPosition.clone();
object.worldToLocal(localPosition);
```

### Object Visibility and Layers

```typescript
// Show/hide object
object.visible = true;
object.visible = false;

// Layer system (0-31)
object.layers.set(1);        // Object on layer 1
object.layers.enable(2);     // Enable layer 2
object.layers.disable(3);    // Disable layer 3

// Check if object is on a layer
object.layers.test(camera.layers); // Is object visible by camera?
```

## Coordinate Systems

9th.js uses a right-handed coordinate system:

- **X** - Right (+X)
- **Y** - Up (+Y)
- **Z** - Forward/Backward (+Z is towards viewer)

### Default Orientations

```typescript
// Camera looking down -Z axis
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// Objects at origin
const object = new Object3D();
object.position.set(0, 0, 0); // Center of world

// Light from above
const light = new DirectionalLight();
light.position.set(0, 10, 0); // Above the scene
light.target.position.set(0, 0, 0); // Looking at center
```

## Rendering Pipeline

The rendering pipeline processes objects through several stages:

### 1. Update Phase

```typescript
// Animation updates
function update(deltaTime) {
  // Update scene graph
  scene.update(deltaTime);
  
  // Update animations
  mixer.update(deltaTime);
  
  // Update particle systems
  particleSystem.update(deltaTime);
  
  // Update custom logic
  customObject.update(deltaTime);
}
```

### 2. Culling Phase

Objects are culled if they are:
- Not visible (object.visible = false)
- Outside camera frustum
- Too far away (distance culling)
- Occluded by other objects (occlusion culling)
- On different layers than camera

```typescript
// Enable/disable culling
engine.enable('frustum_culling', true);
engine.enable('distance_culling', true);
engine.enable('occlusion_culling', false);

// Set culling distances
engine.setMaxDistance(1000); // Maximum render distance
```

### 3. Render Phase

```typescript
// Render scene
renderer.render(scene, camera);
```

The renderer:
1. Clears the canvas
2. Sets up the camera matrices
3. Renders objects in order (opaque first, then transparent)
4. Applies post-processing effects
5. Presents to screen

## Memory Management

Proper memory management prevents memory leaks and performance issues.

### Disposing Objects

```typescript
// Always dispose geometry
geometry.dispose();

// Dispose materials
material.dispose();

// Dispose textures
texture.dispose();

// Dispose framebuffers
renderer.dispose();
```

### Resource Pooling

```typescript
class GeometryPool {
  private geometries: Map<string, BufferGeometry> = new Map();
  
  getBox(width: number, height: number, depth: number): BufferGeometry {
    const key = `${width}_${height}_${depth}`;
    
    if (!this.geometries.has(key)) {
      const geometry = new BoxGeometry(width, height, depth);
      this.geometries.set(key, geometry);
    }
    
    return this.geometries.get(key)!;
  }
}
```

### Garbage Collection Optimization

```typescript
// Reuse vectors instead of creating new ones
const tempVector = new Vector3();

function updateObject(object: Object3D) {
  // Bad - creates new vector each time
  object.position.add(new Vector3(1, 0, 0));
  
  // Good - reuses vector
  tempVector.set(1, 0, 0);
  object.position.add(tempVector);
}
```

## Performance Optimization

### Level of Detail (LOD)

```typescript
class LODObject extends Object3D {
  private lodLevels: LODLevel[] = [];
  
  constructor() {
    super();
    this.setupLOD();
  }
  
  private setupLOD() {
    // High detail
    const highDetail = new Mesh(new SphereGeometry(1, 32, 16), material);
    highDetail.userData.lodDistance = 0;
    this.add(highDetail);
    this.lodLevels.push({ object: highDetail, distance: 0 });
    
    // Medium detail
    const mediumDetail = new Mesh(new SphereGeometry(1, 16, 8), material);
    mediumDetail.userData.lodDistance = 50;
    this.add(mediumDetail);
    this.lodLevels.push({ object: mediumDetail, distance: 50 });
    
    // Low detail
    const lowDetail = new Mesh(new SphereGeometry(1, 8, 4), material);
    lowDetail.userData.lodDistance = 100;
    this.add(lowDetail);
    this.lodLevels.push({ object: lowDetail, distance: 100 });
  }
  
  updateLOD(camera: Camera) {
    const distance = this.position.distanceTo(camera.position);
    
    this.lodLevels.forEach(level => {
      level.object.visible = distance < level.distance;
    });
  }
}
```

### Instanced Rendering

```typescript
// Render many similar objects efficiently
const geometry = new BoxGeometry();
const material = new StandardMaterial({ color: 0x00ff00 });

// Create 1000 instances
const instanced = new InstancedMesh(geometry, material, 1000);

const matrix = new Matrix4();
const position = new Vector3();

for (let i = 0; i < 1000; i++) {
  // Random position
  position.set(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100
  );
  
  matrix.setPosition(position);
  instanced.setMatrixAt(i, matrix);
}

// Set color variations
const color = new Color();
for (let i = 0; i < 1000; i++) {
  color.setHSL(i / 1000, 1, 0.5);
  instanced.setColorAt(i, color);
}

scene.add(instanced);
```

### Occlusion Culling

```typescript
class OcclusionCuller {
  private visibleObjects: Set<Object3D> = new Set();
  
  update(scene: Scene, camera: Camera) {
    // Test each object for occlusion
    scene.traverse((object) => {
      if (this.isOccluded(object, camera)) {
        object.visible = false;
      } else {
        object.visible = true;
        this.visibleObjects.add(object);
      }
    });
  }
  
  private isOccluded(object: Object3D, camera: Camera): boolean {
    // Simple ray casting to test occlusion
    // In practice, use more sophisticated algorithms
    
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(0, 0), camera);
    
    // Cast ray from camera through object
    const intersects = raycaster.intersectObjects(this.visibleObjects);
    
    // Object is occluded if something closer blocks the view
    return intersects.length > 0;
  }
}
```

## Event System

9th.js provides a comprehensive event system for handling interactions and lifecycle events.

### Event Types

```typescript
// Object events
object.on('added', (parent) => {
  console.log('Object added to scene');
});

object.on('removed', (parent) => {
  console.log('Object removed from scene');
});

object.on('transformChanged', () => {
  console.log('Object transform updated');
});

// Scene events
scene.on('objectAdded', (object) => {
  console.log('New object added:', object);
});

scene.on('objectRemoved', (object) => {
  console.log('Object removed:', object);
});

// Renderer events
renderer.on('contextLost', () => {
  console.log('WebGL context lost');
});

renderer.on('contextRestored', () => {
  console.log('WebGL context restored');
});

// Animation events
mixer.on('finished', (clip) => {
  console.log('Animation finished:', clip.name);
});
```

### Custom Events

```typescript
// Define custom event types
class GameObject extends Object3D {
  constructor() {
    super();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.on('collided', (otherObject) => {
      this.emit('damage', { amount: 10, source: otherObject });
    });
  }
  
  takeDamage(amount: number, source: Object3D) {
    this.emit('damage', { amount, source });
    
    if (this.health <= 0) {
      this.emit('destroyed', { reason: 'damage' });
    }
  }
}

// Listen for custom events
const player = new GameObject();
player.on('damage', (data) => {
  console.log(`Player took ${data.amount} damage from ${data.source}`);
});

player.on('destroyed', (data) => {
  console.log('Player destroyed:', data.reason);
  scene.remove(player);
});
```

## Debugging

### Performance Monitoring

```typescript
// Built-in performance monitoring
const performance = engine.getPerformance();
console.log(`FPS: ${performance.fps}`);
console.log(`Render time: ${performance.renderTime}ms`);
console.log(`Triangles: ${performance.triangles}`);
console.log(`Draw calls: ${performance.drawCalls}`);
```

### Debug Rendering

```typescript
// Enable debug mode
engine.setDebugMode(true);

// Show wireframes
material.wireframe = true;

// Show normals
const debugRenderer = new DebugRenderer(scene);
debugRenderer.showNormals = true;
debugRenderer.showBounds = true;
```

### Console Helpers

```typescript
// Object inspection helpers
console.log('Object position:', object.position);
console.log('Object world position:', object.getWorldPosition());
console.log('Object matrix:', object.matrix);

// Scene inspection
console.log('Scene objects:', scene.getAllObjects().length);
console.log('Scene lights:', scene.lights.length);
console.log('Scene cameras:', scene.cameras.length);
```

## Best Practices

### Code Organization

```typescript
// Use factories for object creation
class ObjectFactory {
  static createBox(color: number): Mesh {
    const geometry = new BoxGeometry();
    const material = new StandardMaterial({ color });
    return new Mesh(geometry, material);
  }
  
  static createSphere(radius: number): Mesh {
    const geometry = new SphereGeometry(radius);
    const material = new StandardMaterial({ color: 0x00ff00 });
    return new Mesh(geometry, material);
  }
}

// Use managers for complex systems
class LightManager {
  private lights: Light[] = [];
  
  add(light: Light): void {
    this.lights.push(light);
    scene.add(light);
  }
  
  update(): void {
    this.lights.forEach(light => light.update());
  }
}
```

### Error Handling

```typescript
// Robust resource loading
class SafeLoader {
  static async loadTexture(url: string): Promise<Texture> {
    try {
      const loader = new TextureLoader();
      return await loader.loadAsync(url);
    } catch (error) {
      console.error(`Failed to load texture: ${url}`, error);
      return this.createFallbackTexture();
    }
  }
  
  private static createFallbackTexture(): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, 1, 1);
    
    return new CanvasTexture(canvas);
  }
}
```

This completes the core concepts guide. Next, explore the [Rendering Guide](rendering.md) for advanced rendering techniques, or check out the [Examples](../examples/) for practical implementations.