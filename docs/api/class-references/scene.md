# Scene Class Reference

The `Scene` class is the container for all 3D objects and manages the scene graph, rendering pipeline, and object lifecycle.

## Constructor

```javascript
new Scene()
```

Creates a new empty scene with default settings.

## Properties

### `root: Object3D`
- **Description**: Scene graph root object
- **Type**: `Object3D`
- **Read-only**: Yes
- **Usage**: All objects in the scene are descendants of this root

```javascript
const scene = new Scene();
console.log(scene.root.name); // "Scene Root"
```

### `objects: Map<number, Object3D>`
- **Description**: Registry of all objects by ID
- **Type**: `Map<number, Object3D>`
- **Read-only**: Yes
- **Usage**: Internal registry for fast object lookup by ID

### `objectsByName: Map<string, Object3D>`
- **Description**: Registry of all objects by name
- **Type**: `Map<string, Object3D>`
- **Read-only**: Yes
- **Usage**: Fast object lookup by name

### `cameras: Camera[]`
- **Description**: Array of all cameras in the scene
- **Type**: `Camera[]`
- **Usage**: Store multiple cameras for different views

```javascript
const scene = new Scene();
scene.cameras.push(camera1, camera2, camera3);
```

### `activeCamera: Camera | null`
- **Description**: Currently active camera for rendering
- **Type**: `Camera | null`
- **Default**: `null`
- **Usage**: Set via `setActiveCamera()` method

### `lights: Light[]`
- **Description**: Array of all lights in the scene
- **Type**: `Light[]`
- **Usage**: Scene lighting management

```javascript
// Add lights to scene
scene.lights.push(ambientLight, directionalLight, pointLight);
```

### `background: { r: number, g: number, b: number, a: number }`
- **Description**: Scene background color with RGBA values
- **Type**: `Object`
- **Default**: `{ r: 0.05, g: 0.05, b: 0.05, a: 1.0 }`
- **Range**: Each channel should be between 0.0 and 1.0

```javascript
// Set background to sky blue
scene.background = { r: 0.5, g: 0.7, b: 1.0, a: 1.0 };

// Or use helper methods
scene.setBackground('#87CEEB');
```

### `ambientLight: { intensity: number, color: { r: number, g: number, b: number } }`
- **Description**: Global ambient lighting settings
- **Type**: `Object`
- **Default**: `{ intensity: 0.2, color: { r: 1, g: 1, b: 1 } }`

```javascript
// Set warm ambient light
scene.ambientLight = {
    intensity: 0.3,
    color: { r: 1.0, g: 0.95, b: 0.8 }
};
```

### `fog: FogSettings`
- **Description**: Fog configuration for atmospheric effects
- **Type**: `Object`
- **Properties**:
  - `enabled: boolean` - Enable/disable fog
  - `color: { r: number, g: number, b: number }` - Fog color
  - `near: number` - Distance where fog starts
  - `far: number` - Distance where fog is at full density

```javascript
scene.fog = {
    enabled: true,
    color: { r: 0.5, g: 0.5, b: 0.6 },
    near: 50,
    far: 200
};
```

### `clock: Clock`
- **Description**: Animation timing information
- **Type**: `Object`
- **Properties**:
  - `time: number` - Current time in seconds
  - `deltaTime: number` - Time elapsed since last frame
  - `lastTime: number` - Previous frame time

```javascript
// Access timing information
const currentTime = scene.clock.time;
const deltaTime = scene.clock.deltaTime;
```

### `paused: boolean`
- **Description**: Animation pause state
- **Type**: `boolean`
- **Default**: `false`

```javascript
// Pause animation
scene.paused = true;

// Resume animation
scene.paused = false;
```

### `autoUpdate: boolean`
- **Description**: Automatically update scene objects
- **Type**: `boolean`
- **Default**: `true`

```javascript
scene.autoUpdate = false; // Manual updates only
```

### `autoRender: boolean`
- **Description**: Automatically render scene when updated
- **Type**: `boolean`
- **Default**: `true`

```javascript
scene.autoRender = false; // Manual rendering only
```

### `metrics: SceneMetrics`
- **Description**: Performance metrics for debugging and optimization
- **Type**: `Object`
- **Properties**:
  - `renderCalls: number` - Number of render calls this frame
  - `trianglesRendered: number` - Triangles rendered this frame
  - `objectsVisible: number` - Objects visible this frame
  - `updateTime: number` - Update time in milliseconds
  - `renderTime: number` - Render time in milliseconds

```javascript
// Monitor performance
console.log(`Render calls: ${scene.metrics.renderCalls}`);
console.log(`Triangles: ${scene.metrics.trianglesRendered}`);
```

### `frustumCulling: boolean`
- **Description**: Enable/disable frustum culling optimization
- **Type**: `boolean`
- **Default**: `true`

```javascript
scene.frustumCulling = true; // Enable frustum culling
```

### `distanceCulling: DistanceCullingSettings`
- **Description**: Distance-based culling configuration
- **Type**: `Object`
- **Properties**:
  - `enabled: boolean` - Enable distance culling
  - `maxDistance: number` - Maximum visible distance

```javascript
scene.distanceCulling = {
    enabled: true,
    maxDistance: 1000
};
```

## Methods

### `addObject(object, name?)`
Add an object to the scene.

**Parameters:**
- `object: Object3D` - Object to add
- `name?: string` - Optional name for the object

**Returns:** `Object3D` - The added object

**Example:**
```javascript
const cube = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
const scene = new Scene();

// Add with auto-generated name
scene.addObject(cube);

// Add with custom name
scene.addObject(cube, 'player-cube');

console.log(cube.name); // 'player-cube'
```

### `removeObject(objectOrId)`
Remove an object from the scene.

**Parameters:**
- `objectOrId: Object3D | number` - Object to remove or object ID

**Returns:** `boolean` - True if object was found and removed

**Example:**
```javascript
// Remove by reference
scene.removeObject(cube);

// Remove by ID
scene.removeObject(cube.id);

// Remove by name
const object = scene.getObjectByName('player-cube');
if (object) scene.removeObject(object);
```

### `getObjectByName(name)`
Get object from scene by name.

**Parameters:**
- `name: string` - Object name to search for

**Returns:** `Object3D | null` - Found object or null

**Example:**
```javascript
const player = scene.getObjectByName('player');
if (player) {
    player.position.set(10, 0, 0);
}
```

### `getObjectById(id)`
Get object from scene by ID.

**Parameters:**
- `id: number` - Object ID to search for

**Returns:** `Object3D | null` - Found object or null

**Example:**
```javascript
const object = scene.getObjectById(42);
if (object) {
    object.visible = false;
}
```

### `addCamera(camera)`
Add a camera to the scene.

**Parameters:**
- `camera: Camera` - Camera to add

**Example:**
```javascript
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
scene.addCamera(camera);
```

### `removeCamera(camera)`
Remove a camera from the scene.

**Parameters:**
- `camera: Camera` - Camera to remove

**Example:**
```javascript
scene.removeCamera(camera);
```

### `setActiveCamera(camera)`
Set the active camera for rendering.

**Parameters:**
- `camera: Camera` - Camera to make active

**Example:**
```javascript
const camera1 = new PerspectiveCamera(75, 16/9, 0.1, 1000);
const camera2 = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);

scene.addCamera(camera1);
scene.addCamera(camera2);
scene.setActiveCamera(camera1); // Use perspective camera
```

### `addLight(light)`
Add a light to the scene.

**Parameters:**
- `light: Light` - Light to add

**Example:**
```javascript
const ambientLight = new AmbientLight(0xffffff, 0.2);
const directionalLight = new DirectionalLight(0xffffff, 1);

scene.addLight(ambientLight);
scene.addLight(directionalLight);
```

### `removeLight(light)`
Remove a light from the scene.

**Parameters:**
- `light: Light` - Light to remove

**Example:**
```javascript
scene.removeLight(directionalLight);
```

### `render(renderer, camera?)`
Render the scene using a renderer and camera.

**Parameters:**
- `renderer: WebGLRenderer` - Renderer to use
- `camera?: Camera` - Optional camera override

**Example:**
```javascript
const renderer = new WebGLRenderer({ canvas: document.getElementById('canvas') });
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);
scene.addCamera(camera);

// Render using active camera
scene.render(renderer);

// Render using specific camera
scene.render(renderer, camera);
```

### `update(deltaTime)`
Update the scene and all its objects.

**Parameters:**
- `deltaTime: number` - Time elapsed since last update in seconds

**Example:**
```javascript
const clock = new Clock();

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    scene.update(deltaTime);
    renderer.render(scene, camera);
}
```

### `setBackground(color)`
Set the scene background color.

**Parameters:**
- `color: string | number | Color` - Color value

**Supported formats:**
- Hex string: `'#FF0000'` or `'#F00'`
- RGB string: `'rgb(255, 0, 0)'`
- Color object: `new Color(1, 0, 0)`
- Number: `0xFF0000`

**Example:**
```javascript
// Using hex string
scene.setBackground('#87CEEB');

// Using Color object
scene.setBackground(new Color(0.5, 0.7, 1.0));

// Using RGB string
scene.setBackground('rgb(135, 206, 235)');
```

### `setFog(fogSettings)`
Configure scene fog.

**Parameters:**
- `fogSettings: FogSettings` - Fog configuration

**Example:**
```javascript
scene.setFog({
    enabled: true,
    color: { r: 0.5, g: 0.6, b: 0.8 },
    near: 100,
    far: 500
});
```

### `setAmbientLight(color, intensity)`
Set ambient lighting.

**Parameters:**
- `color: Color` - Ambient light color
- `intensity: number` - Light intensity (0.0 to 2.0)

**Example:**
```javascript
scene.setAmbientLight(new Color(1.0, 0.95, 0.8), 0.3);
```

### `findObjectsByType(type)`
Find all objects of a specific type in the scene.

**Parameters:**
- `type: Function` - Object type/class constructor

**Returns:** `Object3D[]` - Array of matching objects

**Example:**
```javascript
// Find all meshes
const meshes = scene.findObjectsByType(Mesh);
console.log(`Found ${meshes.length} meshes`);

// Find all lights
const lights = scene.findObjectsByType(Light);
lights.forEach(light => {
    light.intensity = 0.5;
});
```

### `getObjectsByProperty(property, value)`
Find objects by property value.

**Parameters:**
- `property: string` - Property name to search
- `value: any` - Property value to match

**Returns:** `Object3D[]` - Array of matching objects

**Example:**
```javascript
// Find all objects that cast shadows
const shadowCasters = scene.getObjectsByProperty('castShadow', true);

// Find all objects with specific tag
const players = scene.getObjectsByProperty('tag', 'player');
```

### `traverse(callback)`
Traverse all objects in the scene graph.

**Parameters:**
- `callback: (object: Object3D) => void` - Callback function for each object

**Example:**
```javascript
// Hide all objects named 'test'
scene.traverse((object) => {
    if (object.name && object.name.startsWith('test')) {
        object.visible = false;
    }
});

// Count visible objects
let visibleCount = 0;
scene.traverse((object) => {
    if (object.visible !== false) {
        visibleCount++;
    }
});
console.log(`${visibleCount} visible objects`);
```

### `traverseVisible(callback)`
Traverse only visible objects in the scene graph.

**Parameters:**
- `callback: (object: Object3D) => void` - Callback function for each visible object

**Example:**
```javascript
// Update only visible objects
scene.traverseVisible((object) => {
    if (object.userData.requiresUpdate) {
        object.updateMatrixWorld();
    }
});
```

### `getObjectByProperty(property, value)`
Find first object with matching property value.

**Parameters:**
- `property: string` - Property name to search
- `value: any` - Property value to match

**Returns:** `Object3D | null` - First matching object or null

**Example:**
```javascript
// Find first camera
const camera = scene.getObjectByProperty('isCamera', true);

// Find object with specific UUID
const object = scene.getObjectByProperty('uuid', '550e8400-e29b-41d4-a716-446655440000');
```

### `dispose()`
Clean up all resources in the scene.

**Example:**
```javascript
// Dispose all objects and resources
scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
        } else {
            object.material.dispose();
        }
    }
});

scene.removeAllObjects();
```

### Event Methods

#### `emit(event, data?)`
Emit an event to all listeners.

**Parameters:**
- `event: string` - Event name
- `data?: any` - Event data

**Example:**
```javascript
// Emit custom event
scene.emit('customEvent', { message: 'Hello' });
```

#### `on(event, listener)`
Add event listener.

**Parameters:**
- `event: string` - Event name
- `listener: Function` - Event handler

**Example:**
```javascript
// Listen for object addition
scene.on('objectAdded', (data) => {
    console.log(`Object added: ${data.object.name}`);
});

// Listen for frame updates
scene.on('frameUpdate', (deltaTime) => {
    // Custom update logic
});
```

#### `off(event, listener)`
Remove event listener.

**Parameters:**
- `event: string` - Event name
- `listener: Function` - Event handler to remove

**Example:**
```javascript
function handleObjectAdded(data) {
    console.log('Object added:', data.object.name);
}

scene.on('objectAdded', handleObjectAdded);
// ... later ...
scene.off('objectAdded', handleObjectAdded);
```

## Complete Usage Example

```javascript
// Create a scene
const scene = new Scene();

// Set background and ambient lighting
scene.setBackground('#87CEEB'); // Sky blue
scene.setAmbientLight(new Color(1.0, 0.95, 0.8), 0.3);

// Add fog for atmosphere
scene.setFog({
    enabled: true,
    color: { r: 0.5, g: 0.6, b: 0.8 },
    near: 100,
    far: 500
});

// Create and add objects
const cube = new Mesh(
    new BoxGeometry(2, 2, 2),
    new MeshStandardMaterial({ color: '#FF0000' })
);
cube.name = 'player-cube';
cube.position.set(0, 0, 0);
scene.addObject(cube);

const sphere = new Mesh(
    new SphereGeometry(1),
    new MeshPhongMaterial({ color: '#00FF00' })
);
sphere.name = 'enemy-sphere';
sphere.position.set(5, 0, 0);
scene.addObject(sphere);

// Add lights
const ambientLight = new AmbientLight(0xffffff, 0.2);
scene.addLight(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
scene.addLight(directionalLight);

// Add camera
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);
camera.position.set(0, 0, 5);
scene.addCamera(camera);
scene.setActiveCamera(camera);

// Add event listeners
scene.on('objectAdded', (data) => {
    console.log(`Added: ${data.object.name}`);
});

scene.on('frameUpdate', (deltaTime) => {
    // Rotate objects
    cube.rotation.y += deltaTime;
    sphere.rotation.x += deltaTime * 0.5;
});

// Find and manipulate objects
const allMeshes = scene.findObjectsByType(Mesh);
console.log(`Scene contains ${allMeshes.length} meshes`);

const player = scene.getObjectByName('player-cube');
if (player) {
    player.scale.set(1.5, 1.5, 1.5);
}

// Animation loop
const clock = new Clock();
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    scene.update(deltaTime);
    renderer.render(scene);
}
animate();
```

## Performance Tips

1. **Object Management**: Use `findObjectsByType()` instead of manual iteration for type-specific operations
2. **Culling**: Enable frustum and distance culling for better performance with large scenes
3. **Visibility**: Use `traverseVisible()` to update only visible objects
4. **Resource Management**: Call `dispose()` when removing objects to free GPU memory
5. **Event System**: Remove event listeners when no longer needed to prevent memory leaks

## Common Patterns

### Scene Setup Pattern
```javascript
// Standard scene setup
function setupScene() {
    const scene = new Scene();
    
    // Background and lighting
    scene.setBackground('#2C3E50');
    scene.setAmbientLight(new Color(1, 1, 1), 0.1);
    
    // Camera setup
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    scene.addCamera(camera);
    scene.setActiveCamera(camera);
    
    // Lighting
    const ambient = new AmbientLight(0xffffff, 0.2);
    const directional = new DirectionalLight(0xffffff, 1);
    directional.position.set(10, 10, 5);
    scene.addLight(ambient);
    scene.addLight(directional);
    
    return { scene, camera };
}
```

### Object Hierarchy Pattern
```javascript
// Create object hierarchy
const group = new Object3D();
group.name = 'player';

const body = new Mesh(new BoxGeometry(1, 2, 0.5), new MeshStandardMaterial());
body.name = 'body';
group.addChild(body);

const head = new Mesh(new SphereGeometry(0.5), new MeshStandardMaterial());
head.position.y = 1.5;
head.name = 'head';
group.addChild(head);

scene.addObject(group); // Add group to scene

// Find and modify child
const playerBody = scene.getObjectByName('player').getObjectByName('body');
playerBody.material.color.setHex(0xFF6B6B);
```

The Scene class is the foundation of all Ninth.js applications, providing a complete framework for 3D scene management, rendering, and animation.