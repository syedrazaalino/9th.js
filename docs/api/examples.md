# 9th.js API Reference Examples

This file demonstrates the comprehensive API documentation structure with detailed examples for all major classes and methods.

## Engine Class

The `Engine` class is the main application controller for 9th.js. It manages the entire 3D application lifecycle.

### Constructor

```typescript
new Engine(canvas: HTMLCanvasElement, config?: EngineConfig): Engine
```

Creates a new engine instance.

**Parameters:**
- `canvas` - The HTML canvas element to render to
- `config` - Optional engine configuration object

**Example:**
```typescript
// Basic initialization
const engine = new Engine(canvasElement);

// Advanced initialization with custom config
const engine = new Engine(canvasElement, {
  antialias: true,
  alpha: false,
  depth: true,
  powerPreference: 'high-performance',
  renderer: {
    maxLights: 8,
    shadowMapSize: 2048,
    enableCulling: true
  }
});
```

### Properties

#### `isRunning: boolean` (read-only)

Whether the engine is currently running.

**Example:**
```typescript
if (engine.isRunning) {
  console.log('Engine is active');
}
```

#### `canvas: HTMLCanvasElement` (read-only)

The canvas element used by the engine.

**Example:**
```typescript
engine.canvas.style.backgroundColor = 'black';
```

#### `renderer: WebGLRenderer` (read-only)

The WebGL renderer instance.

**Example:**
```typescript
const renderer = engine.renderer;
renderer.shadowMap.enabled = true;
```

### Methods

#### `start(): void`

Starts the engine's render loop.

**Example:**
```typescript
engine.start();
```

#### `stop(): void`

Stops the engine's render loop.

**Example:**
```typescript
engine.stop();
console.log('Engine stopped:', !engine.isRunning);
```

#### `setCamera(camera: Camera): void`

Sets the active camera for rendering.

**Parameters:**
- `camera` - The camera to set as active

**Example:**
```typescript
const camera = new PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
engine.setCamera(camera);
```

#### `resize(width: number, height: number): void`

Resizes the engine to new dimensions.

**Parameters:**
- `width` - New canvas width in pixels
- `height` - New canvas height in pixels

**Example:**
```typescript
// Handle window resize
window.addEventListener('resize', () => {
  engine.resize(window.innerWidth, window.innerHeight);
});
```

#### `getPerformance(): PerformanceStats`

Returns current performance metrics.

**Returns:**
Performance statistics including FPS, render times, and object counts.

**Example:**
```typescript
const stats = engine.getPerformance();
console.log(`FPS: ${stats.fps}`);
console.log(`Draw calls: ${stats.drawCalls}`);
console.log(`Triangles: ${stats.triangles}`);
```

#### `dispose(): void`

Disposes of the engine and cleans up all resources.

**Example:**
```typescript
// Clean up when done
engine.dispose();
```

### Events

The engine emits several events during its lifecycle:

```typescript
// Start event
engine.on('started', () => {
  console.log('Engine render loop started');
});

// Stop event
engine.on('stopped', () => {
  console.log('Engine render loop stopped');
});

// Error event
engine.on('error', (error) => {
  console.error('Engine error:', error);
});

// Resize event
engine.on('resized', (data) => {
  console.log(`Canvas resized: ${data.width}x${data.height}`);
});
```

### Configuration

#### `EngineConfig` interface

```typescript
interface EngineConfig {
  antialias?: boolean;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
  preserveDrawingBuffer?: boolean;
  renderer?: Partial<WebGLRenderer['options']>;
}
```

**Example:**
```typescript
const config: EngineConfig = {
  antialias: true,      // Enable anti-aliasing
  alpha: false,         // Opaque background
  depth: true,          // Enable depth buffer
  stencil: false,       // No stencil buffer
  powerPreference: 'high-performance',
  renderer: {
    maxLights: 8,
    shadowMapSize: 2048,
    enableCulling: true
  }
};
```

### Complete Example

```typescript
class EngineDemo {
  private engine: Engine;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private cubes: Mesh[] = [];
  
  constructor(canvas: HTMLCanvasElement) {
    this.initialize(canvas);
    this.setupEventHandlers();
    this.createScene();
    this.start();
  }
  
  private initialize(canvas: HTMLCanvasElement): void {
    // Create engine with configuration
    this.engine = new Engine(canvas, {
      antialias: true,
      alpha: false,
      renderer: {
        maxLights: 4,
        enableCulling: true
      }
    });
    
    // Setup performance monitoring
    this.engine.on('error', (error) => {
      console.error('Engine error:', error);
    });
  }
  
  private setupEventHandlers(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize(window.innerWidth, window.innerHeight);
    });
    
    // Performance logging
    setInterval(() => {
      const stats = this.engine.getPerformance();
      console.log(`FPS: ${stats.fps}, Draw calls: ${stats.drawCalls}`);
    }, 1000);
  }
  
  private createScene(): void {
    // Create scene
    this.scene = new Scene();
    
    // Setup lighting
    const ambientLight = new AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Create camera
    this.camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 5;
    this.engine.setCamera(this.camera);
    
    // Create animated cubes
    for (let i = 0; i < 10; i++) {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new StandardMaterial({
        color: new Color().setHSL(i / 10, 0.8, 0.5)
      });
      
      const cube = new Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      
      this.cubes.push(cube);
      this.scene.add(cube);
    }
  }
  
  private start(): void {
    // Add cube rotation animation
    let time = 0;
    
    const animate = (deltaTime: number) => {
      time += deltaTime;
      
      // Rotate cubes
      this.cubes.forEach((cube, index) => {
        cube.rotation.x += 0.01 + index * 0.001;
        cube.rotation.y += 0.02 + index * 0.001;
        cube.position.y += Math.sin(time + index) * 0.001;
      });
    };
    
    // Start engine with custom animation
    this.engine.on('update', animate);
    this.engine.start();
  }
  
  public stop(): void {
    this.engine.stop();
  }
  
  public dispose(): void {
    this.engine.dispose();
  }
}

// Usage
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const demo = new EngineDemo(canvas);

// Handle page unload
window.addEventListener('beforeunload', () => {
  demo.dispose();
});
```

## Scene Class

The `Scene` class acts as a container for all 3D objects, cameras, and lights.

### Constructor

```typescript
new Scene(): Scene
```

Creates a new scene instance.

**Example:**
```typescript
const scene = new Scene();
```

### Properties

#### `background: Color | Texture | null`

The scene's background color or texture.

**Example:**
```typescript
// Solid color background
scene.background = new Color(0x87ceeb); // Sky blue

// Texture background
scene.background = texture;

// No background (transparent)
scene.background = null;
```

#### `fog: Fog | null`

Scene fog settings.

**Example:**
```typescript
// Exponential fog
scene.fog = new Fog(0xffffff, 1, 100);
```

#### `objects: Object3D[]` (read-only)

All objects in the scene.

**Example:**
```typescript
console.log(`Scene contains ${scene.objects.length} objects`);
```

#### `lights: Light[]` (read-only)

All lights in the scene.

**Example:**
```typescript
const lightCount = scene.lights.length;
console.log(`Scene has ${lightCount} lights`);
```

### Methods

#### `add(object: Object3D): void`

Adds an object to the scene.

**Parameters:**
- `object` - The object to add

**Example:**
```typescript
const mesh = new Mesh(geometry, material);
scene.add(mesh);
```

#### `remove(object: Object3D): void`

Removes an object from the scene.

**Parameters:**
- `object` - The object to remove

**Example:**
```typescript
scene.remove(mesh);
```

#### `getObjectByName(name: string): Object3D | null`

Finds an object by name.

**Parameters:**
- `name` - The name to search for

**Returns:**
The found object or null if not found.

**Example:**
```typescript
const player = scene.getObjectByName('player');
if (player) {
  console.log('Found player object');
}
```

#### `getObjectsByProperty(property: string, value: any): Object3D[]`

Finds objects with a specific property value.

**Parameters:**
- `property` - Property name to check
- `value` - Property value to match

**Returns:**
Array of matching objects.

**Example:**
```typescript
const visibleObjects = scene.getObjectsByProperty('visible', true);
```

#### `traverse(callback: (object: Object3D) => void): void`

Traverses all objects in the scene.

**Parameters:**
- `callback` - Function to call for each object

**Example:**
```typescript
scene.traverse((object) => {
  if (object instanceof Mesh) {
    console.log(`Found mesh: ${object.name}`);
  }
});
```

#### `update(deltaTime: number): void`

Updates all objects in the scene.

**Parameters:**
- `deltaTime` - Time since last update in seconds

**Example:**
```typescript
function animate() {
  const deltaTime = clock.getDelta();
  scene.update(deltaTime);
  requestAnimationFrame(animate);
}
```

### Events

```typescript
// Object added
scene.on('objectAdded', (object) => {
  console.log('Object added:', object.name);
});

// Object removed
scene.on('objectRemoved', (object) => {
  console.log('Object removed:', object.name);
});

// Scene updated
scene.on('updated', () => {
  console.log('Scene updated');
});
```

## Mesh Class

The `Mesh` class represents a 3D object with geometry and material.

### Constructor

```typescript
new Mesh(geometry: BufferGeometry, material: Material): Mesh
```

Creates a new mesh instance.

**Parameters:**
- `geometry` - The geometry for the mesh
- `material` - The material for the mesh

**Example:**
```typescript
const geometry = new BoxGeometry(1, 1, 1);
const material = new StandardMaterial({ color: 0x00ff00 });
const mesh = new Mesh(geometry, material);
```

### Properties

#### `geometry: BufferGeometry`

The mesh's geometry.

**Example:**
```typescript
console.log('Mesh has', mesh.geometry.attributes.position.count, 'vertices');
```

#### `material: Material`

The mesh's material.

**Example:**
```typescript
mesh.material.color.set(0xff0000); // Change to red
```

#### `castShadow: boolean`

Whether the mesh casts shadows.

**Example:**
```typescript
mesh.castShadow = true;
```

#### `receiveShadow: boolean`

Whether the mesh receives shadows.

**Example:**
```typescript
mesh.receiveShadow = true;
```

### Inherited from Object3D

#### `position: Vector3`

The mesh's position.

**Example:**
```typescript
mesh.position.set(0, 5, 0); // Move to (0, 5, 0)
```

#### `rotation: Euler`

The mesh's rotation.

**Example:**
```typescript
mesh.rotation.set(0, Math.PI / 4, 0); // Rotate 45 degrees on Y
```

#### `scale: Vector3`

The mesh's scale.

**Example:**
```typescript
mesh.scale.set(2, 1, 2); // Stretch X and Z
```

### Methods

#### `dispose(): void`

Disposes of the mesh and its resources.

**Example:**
```typescript
mesh.dispose();
```

#### `clone(): Mesh`

Creates a copy of the mesh.

**Returns:**
A new mesh with the same geometry and material.

**Example:**
```typescript
const clone = mesh.clone();
scene.add(clone);
```

### Complete Mesh Example

```typescript
class MeshDemo {
  private scene: Scene;
  private mesh: Mesh;
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.createMesh();
  }
  
  private createMesh(): void {
    // Create geometry with custom attributes
    const geometry = new BoxGeometry(2, 2, 2);
    
    // Add vertex colors
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = Math.random();     // R
      colors[i + 1] = Math.random(); // G
      colors[i + 2] = Math.random(); // B
    }
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    
    // Create material with vertex colors
    const material = new StandardMaterial({
      vertexColors: true,
      roughness: 0.5,
      metalness: 0.1
    });
    
    // Create mesh
    this.mesh = new Mesh(geometry, material);
    this.mesh.name = 'demo-cube';
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Position mesh
    this.mesh.position.set(0, 1, 0);
    this.mesh.rotation.set(0, Math.PI / 4, 0);
    this.mesh.scale.set(1, 1.5, 1);
    
    // Add to scene
    this.scene.add(this.mesh);
    
    console.log('Created mesh:', this.mesh.name);
  }
  
  public animate(deltaTime: number): void {
    // Rotate mesh
    this.mesh.rotation.y += deltaTime;
    this.mesh.rotation.x += deltaTime * 0.5;
    
    // Pulse scale
    const scale = 1 + Math.sin(Date.now() * 0.001) * 0.2;
    this.mesh.scale.set(scale, scale * 1.5, scale);
  }
  
  public dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.dispose();
  }
}
```

## Vector3 Class

The `Vector3` class represents a 3D vector with x, y, z components.

### Constructor

```typescript
new Vector3(x?: number, y?: number, z?: number): Vector3
```

Creates a new vector.

**Parameters:**
- `x` - X component (default: 0)
- `y` - Y component (default: 0)
- `z` - Z component (default: 0)

**Example:**
```typescript
// Create vector from components
const v1 = new Vector3(1, 2, 3);

// Create from array
const v2 = new Vector3().fromArray([1, 2, 3]);

// Create from object
const v3 = new Vector3({ x: 1, y: 2, z: 3 });
```

### Static Methods

#### `Vector3.addVectors(a: Vector3, b: Vector3): Vector3`

Adds two vectors.

**Example:**
```typescript
const a = new Vector3(1, 2, 3);
const b = new Vector3(4, 5, 6);
const result = Vector3.addVectors(a, b);
// result = (5, 7, 9)
```

#### `Vector3.subVectors(a: Vector3, b: Vector3): Vector3`

Subtracts two vectors.

**Example:**
```typescript
const a = new Vector3(4, 5, 6);
const b = new Vector3(1, 2, 3);
const result = Vector3.subVectors(a, b);
// result = (3, 3, 3)
```

#### `Vector3.dot(a: Vector3, b: Vector3): number`

Calculates dot product.

**Example:**
```typescript
const a = new Vector3(1, 0, 0);
const b = new Vector3(0, 1, 0);
const dot = Vector3.dot(a, b); // dot = 0
```

#### `Vector3.cross(a: Vector3, b: Vector3): Vector3`

Calculates cross product.

**Example:**
```typescript
const a = new Vector3(1, 0, 0);
const b = new Vector3(0, 1, 0);
const cross = Vector3.cross(a, b); // cross = (0, 0, 1)
```

### Instance Methods

#### `set(x: number, y: number, z: number): Vector3`

Sets vector components.

**Example:**
```typescript
const v = new Vector3();
v.set(1, 2, 3); // v = (1, 2, 3)
```

#### `copy(v: Vector3): Vector3`

Copies from another vector.

**Example:**
```typescript
const v1 = new Vector3(1, 2, 3);
const v2 = v1.copy();
v2.set(4, 5, 6); // v1 unchanged, v2 = (4, 5, 6)
```

#### `add(v: Vector3): Vector3`

Adds another vector.

**Example:**
```typescript
const v = new Vector3(1, 2, 3);
v.add(new Vector3(4, 5, 6)); // v = (5, 7, 9)
```

#### `subtract(v: Vector3): Vector3`

Subtracts another vector.

**Example:**
```typescript
const v = new Vector3(5, 7, 9);
v.subtract(new Vector3(4, 5, 6)); // v = (1, 2, 3)
```

#### `multiplyScalar(s: number): Vector3`

Multiplies by scalar.

**Example:**
```typescript
const v = new Vector3(1, 2, 3);
v.multiplyScalar(2); // v = (2, 4, 6)
```

#### `normalize(): Vector3`

Normalizes the vector (makes it unit length).

**Example:**
```typescript
const v = new Vector3(3, 4, 0);
v.normalize(); // v = (0.6, 0.8, 0)
```

#### `length(): number`

Returns vector length.

**Example:**
```typescript
const v = new Vector3(3, 4, 0);
const length = v.length(); // length = 5
```

#### `distanceTo(v: Vector3): number`

Calculates distance to another vector.

**Example:**
```typescript
const v1 = new Vector3(0, 0, 0);
const v2 = new Vector3(3, 4, 0);
const distance = v1.distanceTo(v2); // distance = 5
```

#### `lerp(v: Vector3, t: number): Vector3`

Linear interpolation.

**Example:**
```typescript
const v1 = new Vector3(0, 0, 0);
const v2 = new Vector3(10, 10, 0);
v1.lerp(v2, 0.5); // v1 = (5, 5, 0)
```

### Complete Vector3 Example

```typescript
class Vector3Demo {
  private vectors: Vector3[] = [];
  
  constructor() {
    this.demonstrateOperations();
  }
  
  private demonstrateOperations(): void {
    // Create vectors
    const position = new Vector3(0, 0, 0);
    const velocity = new Vector3(1, 2, 1);
    const acceleration = new Vector3(0.1, 0.05, 0.1);
    
    this.vectors.push(position, velocity, acceleration);
    
    console.log('Initial vectors:');
    this.vectors.forEach((v, i) => {
      console.log(`Vector ${i}: (${v.x}, ${v.y}, ${v.z})`);
    });
    
    // Physics simulation
    this.simulatePhysics();
    
    // Vector operations
    this.vectorOperations();
  }
  
  private simulatePhysics(): void {
    const position = this.vectors[0];
    const velocity = this.vectors[1];
    const acceleration = this.vectors[2];
    
    const dt = 0.016; // 60 FPS
    
    // Update velocity with acceleration
    velocity.add(acceleration.clone().multiplyScalar(dt));
    
    // Update position with velocity
    position.add(velocity.clone().multiplyScalar(dt));
    
    console.log('\nAfter physics simulation:');
    console.log(`Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
    console.log(`Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)})`);
  }
  
  private vectorOperations(): void {
    const a = new Vector3(1, 2, 3);
    const b = new Vector3(4, 5, 6);
    
    console.log('\nVector operations:');
    console.log(`Dot product: ${Vector3.dot(a, b)}`);
    console.log(`Cross product: (${Vector3.cross(a, b).x}, ${Vector3.cross(a, b).y}, ${Vector3.cross(a, b).z})`);
    console.log(`Distance between: ${a.distanceTo(b)}`);
    
    // Normalize and check length
    const normalized = a.clone().normalize();
    console.log(`Normalized (${normalized.x.toFixed(3)}, ${normalized.y.toFixed(3)}, ${normalized.z.toFixed(3)})`);
    console.log(`Length: ${normalized.length().toFixed(3)}`);
    
    // Lerp between vectors
    const lerped = a.clone().lerp(b, 0.5);
    console.log(`Lerp 50%: (${lerped.x.toFixed(1)}, ${lerped.y.toFixed(1)}, ${lerped.z.toFixed(1)})`);
  }
  
  public cleanup(): void {
    this.vectors = [];
  }
}

// Run demo
const demo = new Vector3Demo();
```

This example demonstrates the comprehensive API documentation format with:
- Detailed parameter descriptions
- Return value documentation
- Code examples for each method
- Complete usage examples
- Error handling and edge cases
- Performance considerations

The documentation structure follows modern API documentation standards and provides developers with all the information needed to effectively use the 9th.js library.