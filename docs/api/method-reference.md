# Method Reference

This document provides a comprehensive reference of all methods across the Ninth.js library with practical examples.

## Table of Contents

- [Core Methods](#core-methods)
- [Scene Methods](#scene-methods)
- [Object3D Methods](#object3d-methods)
- [Mesh Methods](#mesh-methods)
- [Material Methods](#material-methods)
- [Geometry Methods](#geometry-methods)
- [Camera Methods](#camera-methods)
- [Light Methods](#light-methods)
- [Renderer Methods](#renderer-methods)
- [Texture Methods](#texture-methods)
- [Animation Methods](#animation-methods)
- [Physics Methods](#physics-methods)
- [Loader Methods](#loader-methods)

## Core Methods

### Object3D Methods

#### `addChild(object)`
Add a child object to this object.

**Parameters:**
- `object: Object3D` - Object to add as child

**Returns:** `Object3D` - The added child

**Example:**
```javascript
const parent = new Object3D();
const child = new Object3D();

parent.addChild(child);
console.log(child.parent === parent); // true

// Add with position
const child2 = new Object3D();
child2.position.set(5, 0, 0);
parent.addChild(child2);
```

#### `removeChild(object)`
Remove a child object from this object.

**Parameters:**
- `object: Object3D` - Object to remove

**Returns:** `Object3D` - The removed child

**Example:**
```javascript
parent.removeChild(child);
console.log(child.parent); // null

// Remove specific child
parent.children.forEach(child => {
    if (child.name === 'enemy') {
        parent.removeChild(child);
    }
});
```

#### `removeFromParent()`
Remove this object from its parent.

**Example:**
```javascript
child.removeFromParent();
console.log(child.parent); // null
```

#### `getChildByName(name, recursive = false)`
Get child object by name.

**Parameters:**
- `name: string` - Name to search for
- `recursive: boolean = false` - Search recursively

**Returns:** `Object3D | null` - Found child or null

**Example:**
```javascript
// Direct child only
const child = parent.getChildByName('player');

// Recursive search
const descendant = parent.getChildByName('weapon', true);
```

#### `getChildrenByType(type)`
Get all children of a specific type.

**Parameters:**
- `type: Function` - Type/constructor to filter by

**Returns:** `Object3D[]` - Array of matching children

**Example:**
```javascript
const meshes = parent.getChildrenByType(Mesh);
const lights = parent.getChildrenByType(Light);
const cameras = parent.getChildrenByType(Camera);
```

#### `traverse(callback)`
Traverse all descendant objects.

**Parameters:**
- `callback: (object: Object3D) => void` - Callback function

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
```

#### `traverseVisible(callback)`
Traverse only visible objects.

**Parameters:**
- `callback: (object: Object3D) => void` - Callback function

**Example:**
```javascript
// Update only visible objects
scene.traverseVisible((object) => {
    if (object.userData.requiresUpdate) {
        object.updateMatrixWorld();
    }
});
```

#### `lookAt(target)`
Make object look at a target position.

**Parameters:**
- `target: Vector3 | Object3D` - Target position or object

**Example:**
```javascript
// Look at position
object.lookAt(new Vector3(10, 0, 5));

// Look at object
object.lookAt(targetObject);

// Look at world position of child
object.lookAt(object.getWorldPosition(new Vector3()));
```

#### `rotateOnAxis(axis, angle)`
Rotate object around axis.

**Parameters:**
- `axis: Vector3` - Rotation axis
- `angle: number` - Rotation angle in radians

**Example:**
```javascript
// Rotate around Y axis
object.rotateOnAxis(new Vector3(0, 1, 0), Math.PI / 2);

// Rotate around world X axis
const worldAxis = new Vector3(1, 0, 0);
object.rotateOnAxis(worldAxis, Math.PI);
```

#### `rotateX(angle)`
Rotate around X axis.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
object.rotateX(Math.PI / 2); // 90 degrees
```

#### `rotateY(angle)`
Rotate around Y axis.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
object.rotateY(Math.PI); // 180 degrees
```

#### `rotateZ(angle)`
Rotate around Z axis.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
object.rotateZ(Math.PI / 4); // 45 degrees
```

#### `translateOnAxis(axis, distance)`
Translate object along axis.

**Parameters:**
- `axis: Vector3` - Translation axis
- `distance: number` - Translation distance

**Example:**
```javascript
// Move forward in local space
object.translateOnAxis(new Vector3(0, 0, -1), 5);

// Move up in world space
object.translateOnAxis(new Vector3(0, 1, 0), 10);
```

#### `translateX(distance)`
Translate along X axis.

**Parameters:**
- `distance: number` - Translation distance

**Example:**
```javascript
object.translateX(5); // Move 5 units right
```

#### `translateY(distance)`
Translate along Y axis.

**Parameters:**
- `distance: number` - Translation distance

**Example:**
```javascript
object.translateY(10); // Move 10 units up
```

#### `translateZ(distance)`
Translate along Z axis.

**Parameters:**
- `distance: number` - Translation distance

**Example:**
```javascript
object.translateZ(-5); // Move 5 units forward
```

#### `getWorldPosition(target)`
Get world position of object.

**Parameters:**
- `target: Vector3` - Vector to store result

**Returns:** `Vector3` - World position

**Example:**
```javascript
const worldPos = new Vector3();
object.getWorldPosition(worldPos);
console.log(worldPos);
```

#### `getWorldQuaternion(target)`
Get world quaternion rotation.

**Parameters:**
- `target: Quaternion` - Quaternion to store result

**Returns:** `Quaternion` - World rotation

**Example:**
```javascript
const worldQuat = new Quaternion();
object.getWorldQuaternion(worldQuat);
```

#### `getWorldScale(target)`
Get world scale.

**Parameters:**
- `target: Vector3` - Vector to store result

**Returns:** `Vector3` - World scale

**Example:**
```javascript
const worldScale = new Vector3();
object.getWorldScale(worldScale);
```

#### `getWorldDirection(target)`
Get world forward direction.

**Parameters:**
- `target: Vector3` - Vector to store result

**Returns:** `Vector3` - Forward direction

**Example:**
```javascript
const forward = new Vector3();
object.getWorldDirection(forward);
// forward now points in object's forward direction
```

#### `updateMatrix()`
Update local transformation matrix.

**Example:**
```javascript
// Modify transform
object.position.set(5, 0, 0);
object.rotation.y = Math.PI / 2;
object.scale.set(2, 1, 2);

// Update matrix
object.updateMatrix();

// Matrix is now updated
console.log(object.matrix);
```

#### `updateMatrixWorld(force = false)`
Update world transformation matrix.

**Parameters:**
- `force: boolean = false` - Force update even if not marked

**Example:**
```javascript
// Force update
object.updateMatrixWorld(true);

// After modifying hierarchy
child.updateMatrixWorld();
```

#### `updateWorldMatrix(updateParents = false, updateChildren = false)`
Update world matrix with hierarchy options.

**Parameters:**
- `updateParents: boolean = false` - Update parent matrices
- `updateChildren: boolean = false` - Update child matrices

**Example:**
```javascript
// Update only this object and children
object.updateWorldMatrix(false, true);

// Update parents and this object
object.updateWorldMatrix(true, false);

// Update entire hierarchy
object.updateWorldMatrix(true, true);
```

#### `copy(source, recursive = true)`
Copy object properties from another object.

**Parameters:**
- `source: Object3D` - Source object to copy from
- `recursive: boolean = true` - Copy children recursively

**Returns:** `Object3D` - This object

**Example:**
```javascript
const source = new Object3D();
source.position.set(5, 0, 0);
source.name = 'source';

const target = new Object3D();
target.copy(source);

console.log(target.position); // Vector3(5, 0, 0)
console.log(target.name); // 'source'
```

#### `clone(recursive = true)`
Clone this object.

**Parameters:**
- `recursive: boolean = true` - Clone children recursively

**Returns:** `Object3D` - Cloned object

**Example:**
```javascript
const clone = object.clone(true);

// Modify clone without affecting original
clone.position.set(10, 0, 0);
clone.name = 'clone';
```

#### `dispose()`
Clean up object resources.

**Example:**
```javascript
// Dispose object and children
object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
        if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
        } else {
            child.material.dispose();
        }
    }
});

// Remove from scene
if (object.parent) {
    object.parent.removeChild(object);
}
```

#### `getObjectByProperty(property, value)`
Find object by property value.

**Parameters:**
- `property: string` - Property name
- `value: any` - Property value

**Returns:** `Object3D | null` - Found object or null

**Example:**
```javascript
// Find first camera
const camera = scene.getObjectByProperty('isCamera', true);

// Find object with specific UUID
const object = scene.getObjectByProperty('uuid', '550e8400-e29b-41d4-a716-446655440000');
```

#### `getObjectsByProperty(property, value)`
Find all objects by property value.

**Parameters:**
- `property: string` - Property name
- `value: any` - Property value

**Returns:** `Object3D[]` - Array of matching objects

**Example:**
```javascript
// Find all objects that cast shadows
const shadowCasters = scene.getObjectsByProperty('castShadow', true);

// Find all objects with specific tag
const players = scene.getObjectsByProperty('userData.type', 'player');
```

### Scene Methods

#### `addObject(object, name?)`
Add object to scene.

**Parameters:**
- `object: Object3D` - Object to add
- `name?: string` - Optional name

**Returns:** `Object3D` - Added object

**Example:**
```javascript
const cube = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
scene.addObject(cube, 'player-cube');

// Add with auto-generated name
scene.addObject(cube);
console.log(cube.name); // 'Object_1' or similar
```

#### `removeObject(objectOrId)`
Remove object from scene.

**Parameters:**
- `objectOrId: Object3D | number` - Object or object ID

**Returns:** `boolean` - True if removed

**Example:**
```javascript
// Remove by reference
scene.removeObject(cube);

// Remove by ID
scene.removeObject(cube.id);

// Remove by name
const enemy = scene.getObjectByName('enemy');
if (enemy) scene.removeObject(enemy);
```

#### `getObjectByName(name)`
Find object by name.

**Parameters:**
- `name: string` - Object name

**Returns:** `Object3D | null` - Found object or null

**Example:**
```javascript
const player = scene.getObjectByName('player');
if (player) {
    player.position.set(0, 0, 10);
}
```

#### `getObjectById(id)`
Find object by ID.

**Parameters:**
- `id: number` - Object ID

**Returns:** `Object3D | null` - Found object or null

**Example:**
```javascript
const object = scene.getObjectById(42);
if (object) {
    object.visible = false;
}
```

#### `findObjectsByType(type)`
Find all objects of specific type.

**Parameters:**
- `type: Function` - Type/constructor

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

#### `addCamera(camera)`
Add camera to scene.

**Parameters:**
- `camera: Camera` - Camera to add

**Example:**
```javascript
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);
scene.addCamera(camera);
```

#### `removeCamera(camera)`
Remove camera from scene.

**Parameters:**
- `camera: Camera` - Camera to remove

**Example:**
```javascript
scene.removeCamera(camera);
```

#### `setActiveCamera(camera)`
Set active camera for rendering.

**Parameters:**
- `camera: Camera` - Camera to make active

**Example:**
```javascript
const camera1 = new PerspectiveCamera(75, 16/9, 0.1, 1000);
const camera2 = new OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);

scene.addCamera(camera1);
scene.addCamera(camera2);
scene.setActiveCamera(camera1);
```

#### `addLight(light)`
Add light to scene.

**Parameters:**
- `light: Light` - Light to add

**Example:**
```javascript
const ambientLight = new AmbientLight(0xffffff, 0.2);
const directionalLight = new DirectionalLight(0xffffff, 1);

scene.addLight(ambientLight);
scene.addLight(directionalLight);
```

#### `removeLight(light)`
Remove light from scene.

**Parameters:**
- `light: Light` - Light to remove

**Example:**
```javascript
scene.removeLight(directionalLight);
```

#### `render(renderer, camera?)`
Render scene.

**Parameters:**
- `renderer: WebGLRenderer` - Renderer to use
- `camera?: Camera` - Optional camera override

**Example:**
```javascript
// Render with active camera
scene.render(renderer);

// Render with specific camera
scene.render(renderer, camera);

// In animation loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    scene.update(deltaTime);
    scene.render(renderer);
}
```

#### `update(deltaTime)`
Update scene and all objects.

**Parameters:**
- `deltaTime: number` - Time elapsed since last update

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

#### `setBackground(color)`
Set scene background.

**Parameters:**
- `color: Color | Texture | null` - Background color, texture, or null

**Example:**
```javascript
// Set color background
scene.setBackground(new Color('#87CEEB')); // Sky blue
scene.setBackground(0xFF0000); // Red

// Set texture background
scene.setBackground(environmentTexture);

// Transparent background
scene.setBackground(null);
```

#### `setFog(fog)`
Set scene fog.

**Parameters:**
- `fog: FogSettings | null` - Fog settings or null

**Example:**
```javascript
scene.setFog({
    enabled: true,
    color: new Color('#CCCCCC'),
    near: 10,
    far: 200,
    type: 'linear'
});

// Disable fog
scene.setFog(null);
```

#### `setAmbientLight(color, intensity)`
Set ambient lighting.

**Parameters:**
- `color: Color` - Ambient light color
- `intensity: number` - Light intensity

**Example:**
```javascript
scene.setAmbientLight(new Color(0x404040), 0.3);

// Warm ambient light
scene.setAmbientLight(new Color(0xFFA500), 0.2);
```

### Mesh Methods

#### `raycast(raycaster, intersects)`
Perform raycasting against mesh.

**Parameters:**
- `raycaster: Raycaster` - Raycaster instance
- `intersects: Intersection[]` - Intersections array

**Example:**
```javascript
// Custom raycasting
const raycaster = new Raycaster();
const mouse = new Vector2();
const intersects = [];

// Set mouse position (normalized device coordinates)
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

// Cast ray
raycaster.setFromCamera(mouse, camera);
raycaster.intersectObject(mesh, intersects);

console.log(`Hit ${intersects.length} objects`);
if (intersects.length > 0) {
    console.log('First hit:', intersects[0]);
}
```

### Material Methods

#### `setProperty(name, value)`
Set material property.

**Parameters:**
- `name: string` - Property name
- `value: any` - Property value

**Example:**
```javascript
// Set basic properties
material.setProperty('color', new Color(1, 0, 0));
material.setProperty('opacity', 0.8);
material.setProperty('transparent', true);

// Set PBR properties
material.setProperty('metalness', 0.8);
material.setProperty('roughness', 0.2);
```

#### `getProperty(name)`
Get material property.

**Parameters:**
- `name: string` - Property name

**Returns:** `any` - Property value or undefined

**Example:**
```javascript
const color = material.getProperty('color');
const opacity = material.getProperty('opacity');
const custom = material.getProperty('customProperty');
```

#### `setProperties(properties)`
Set multiple properties.

**Parameters:**
- `properties: Object` - Property name-value pairs

**Example:**
```javascript
material.setProperties({
    color: '#FF0000',
    opacity: 0.8,
    transparent: true,
    metalness: 0.5,
    roughness: 0.3
});
```

#### `setTexture(name, texture, unit?)`
Set material texture.

**Parameters:**
- `name: string` - Texture name/uniform name
- `texture: Texture` - Texture object
- `unit?: number` - Texture unit

**Example:**
```javascript
// Set diffuse texture
material.setTexture('diffuse', textureLoader.load('diffuse.jpg'), 0);

// Set normal texture
material.setTexture('normal', normalTexture, 1);

// Set without specifying unit (auto-assign)
material.setTexture('emissive', emissiveTexture);
```

#### `getTexture(name)`
Get material texture.

**Parameters:**
- `name: string` - Texture name

**Returns:** `TextureBinding | null` - Texture binding or null

**Example:**
```javascript
const textureBinding = material.getTexture('diffuse');
if (textureBinding) {
    console.log(`Texture unit: ${textureBinding.unit}`);
}
```

#### `hasTexture(name)`
Check if material has texture.

**Parameters:**
- `name: string` - Texture name

**Returns:** `boolean` - True if texture exists

**Example:**
```javascript
if (material.hasTexture('normal')) {
    console.log('Material has normal map');
}
```

#### `clone()`
Clone material.

**Returns:** `Material` - Cloned material

**Example:**
```javascript
const clonedMaterial = material.clone();
clonedMaterial.setProperty('color', new Color(0, 1, 0));
```

#### `dispose()`
Clean up material resources.

**Example:**
```javascript
material.dispose();

// Clean up textures
material.textures.forEach((binding, name) => {
    binding.texture.dispose();
});
```

### Geometry Methods

#### `addAttribute(name, attribute)`
Add vertex attribute.

**Parameters:**
- `name: string` - Attribute name
- `attribute: BufferAttribute` - Attribute data

**Example:**
```javascript
// Create position attribute
const positions = new Float32Array([
    0, 0, 0,   // Vertex 1
    1, 0, 0,   // Vertex 2
    0, 1, 0    // Vertex 3
]);

const positionAttribute = new BufferAttribute(positions, 3);
geometry.addAttribute('position', positionAttribute);

// Add normal attribute
const normals = new Float32Array([
    0, 0, 1,   // Normal for all vertices
    0, 0, 1,
    0, 0, 1
]);

const normalAttribute = new BufferAttribute(normals, 3);
geometry.addAttribute('normal', normalAttribute);
```

#### `removeAttribute(name)`
Remove vertex attribute.

**Parameters:**
- `name: string` - Attribute name

**Example:**
```javascript
geometry.removeAttribute('color');

// Check if attribute exists
if (geometry.hasAttribute('normal')) {
    console.log('Geometry has normals');
}
```

#### `getAttribute(name)`
Get vertex attribute.

**Parameters:**
- `name: string` - Attribute name

**Returns:** `BufferAttribute | null` - Attribute or null

**Example:**
```javascript
const positionAttr = geometry.getAttribute('position');
if (positionAttr) {
    console.log(`Position count: ${positionAttr.count}`);
    console.log(`Position array:`, positionAttr.array);
}
```

#### `hasAttribute(name)`
Check if geometry has attribute.

**Parameters:**
- `name: string` - Attribute name

**Returns:** `boolean` - True if attribute exists

**Example:**
```javascript
const hasPositions = geometry.hasAttribute('position');
const hasNormals = geometry.hasAttribute('normal');
const hasUVs = geometry.hasAttribute('uv');
```

#### `setIndex(index)`
Set index buffer.

**Parameters:**
- `index: BufferAttribute` - Index attribute

**Example:**
```javascript
// Create indexed geometry
const indices = new Uint16Array([
    0, 1, 2,    // First triangle
    2, 3, 0     // Second triangle
]);

const indexAttribute = new BufferAttribute(indices, 1);
geometry.setIndex(indexAttribute);
```

#### `computeBoundingBox()`
Compute geometry bounding box.

**Example:**
```javascript
geometry.computeBoundingBox();

const bbox = geometry.boundingBox;
console.log(`Bounding box: min=${bbox.min.toArray()}, max=${bbox.max.toArray()}`);

// Bounding box is now available for frustum culling
```

#### `computeBoundingSphere()`
Compute geometry bounding sphere.

**Example:**
```javascript
geometry.computeBoundingSphere();

const sphere = geometry.boundingSphere;
console.log(`Bounding sphere: center=${sphere.center.toArray()}, radius=${sphere.radius}`);
```

#### `merge(geometry)`
Merge another geometry.

**Parameters:**
- `geometry: BufferGeometry` - Geometry to merge

**Example:**
```javascript
const boxGeometry = new BoxGeometry(1, 1, 1);
const sphereGeometry = new SphereGeometry(0.5, 8, 6);

boxGeometry.merge(sphereGeometry);
```

#### `mergeVertices(tolerance?)`
Merge duplicate vertices.

**Parameters:**
- `tolerance: number = 1e-4` - Vertex merging tolerance

**Returns:** `BufferGeometry` - Optimized geometry

**Example:**
```javascript
const optimized = geometry.mergeVertices(1e-5);
console.log(`Optimized: ${optimized.attributes.position.count} vertices`);
```

#### `computeVertexNormals()`
Recompute vertex normals.

**Example:**
```javascript
// After deforming geometry
geometry.computeVertexNormals();

// Normals are updated for proper lighting
```

#### `center()`
Center geometry at origin.

**Example:**
```javascript
geometry.center();

// Geometry is now centered at (0, 0, 0)
```

#### `normalizeNormals()`
Normalize all normals.

**Example:**
```javascript
geometry.normalizeNormals();

// All normals are unit length
```

#### `setDrawRange(start, count)`
Set draw range for partial rendering.

**Parameters:**
- `start: number` - Start index
- `count: number` - Number of elements to draw

**Example:**
```javascript
// Draw only first 100 vertices
geometry.setDrawRange(0, 100);

// Draw vertices 50-100
geometry.setDrawRange(50, 50);
```

#### `applyMatrix4(matrix)`
Apply transformation matrix to geometry.

**Parameters:**
- `matrix: Matrix4` - Transformation matrix

**Example:**
```javascript
// Scale geometry
const scaleMatrix = new Matrix4().makeScale(2, 2, 2);
geometry.applyMatrix4(scaleMatrix);

// Translate geometry
const translateMatrix = new Matrix4().makeTranslation(10, 0, 0);
geometry.applyMatrix4(translateMatrix);
```

#### `clone()`
Clone geometry.

**Returns:** `BufferGeometry` - Cloned geometry

**Example:**
```javascript
const clonedGeometry = geometry.clone();
```

#### `dispose()`
Clean up geometry resources.

**Example:**
```javascript
geometry.dispose();

// Free GPU buffer memory
```

### Camera Methods

#### `lookAt(target)`
Make camera look at target.

**Parameters:**
- `target: Vector3 | Object3D` - Look target

**Example:**
```javascript
// Look at position
camera.lookAt(new Vector3(10, 0, 0));

// Look at object
camera.lookAt(targetObject);

// Look at world position
const worldPos = new Vector3();
camera.lookAt(camera.getWorldPosition(worldPos));
```

#### `updateMatrix()`
Update camera view matrix.

**Example:**
```javascript
camera.updateMatrix();
console.log(camera.matrix); // View matrix
```

#### `updateProjectionMatrix()`
Update camera projection matrix.

**Example:**
```javascript
// After changing camera parameters
camera.fov = 60;
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
```

#### `updateMatrixWorld(force?)`
Update camera world matrix.

**Parameters:**
- `force: boolean = false` - Force update

**Example:**
```javascript
camera.updateMatrixWorld(true);
console.log(camera.matrixWorld);
```

#### `getWorldPosition(target)`
Get camera world position.

**Parameters:**
- `target: Vector3` - Vector to store result

**Returns:** `Vector3` - World position

**Example:**
```javascript
const worldPos = new Vector3();
camera.getWorldPosition(worldPos);
```

#### `getWorldDirection(target)`
Get camera forward direction.

**Parameters:**
- `target: Vector3` - Vector to store result

**Returns:** `Vector3` - Forward direction

**Example:**
```javascript
const forward = new Vector3();
camera.getWorldDirection(forward);
```

#### `clone()`
Clone camera.

**Returns:** `Camera` - Cloned camera

**Example:**
```javascript
const clonedCamera = camera.clone();
clonedCamera.position.set(10, 0, 0);
```

### Light Methods

#### `lookAt(target)`
Point light at target.

**Parameters:**
- `target: Vector3 | Object3D` - Look target

**Example:**
```javascript
// Point spotlight at target
spotLight.lookAt(targetObject);

// Point directional light
directionalLight.lookAt(new Vector3(0, 0, 0));
```

### Renderer Methods

#### `render(scene, camera)`
Render a scene.

**Parameters:**
- `scene: Scene` - Scene to render
- `camera: Camera` - Camera to render from

**Example:**
```javascript
// Basic rendering
renderer.render(scene, camera);

// In animation loop
function animate() {
    requestAnimationFrame(animate);
    scene.update(deltaTime);
    renderer.render(scene, camera);
}
```

#### `setSize(width, height)`
Set renderer size.

**Parameters:**
- `width: number` - Width in pixels
- `height: number` - Height in pixels

**Example:**
```javascript
// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
```

#### `setPixelRatio(ratio)`
Set device pixel ratio.

**Parameters:**
- `ratio: number` - Pixel ratio

**Example:**
```javascript
// For high-DPI displays
renderer.setPixelRatio(window.devicePixelRatio);

// For performance on mobile
renderer.setPixelRatio(1);
```

#### `setClearColor(color, alpha?)`
Set clear color.

**Parameters:**
- `color: Color | number` - Clear color
- `alpha?: number` - Clear alpha

**Example:**
```javascript
// Set background color
renderer.setClearColor(0x87CEEB); // Sky blue
renderer.setClearColor('#FF0000'); // Red

// Set with alpha
renderer.setClearColor(0x000000, 0.5); // Semi-transparent clear
```

#### `clear(color?, depth?, stencil?)`
Clear framebuffer.

**Parameters:**
- `color?: boolean` - Clear color buffer
- `depth?: boolean` - Clear depth buffer
- `stencil?: boolean` - Clear stencil buffer

**Example:**
```javascript
// Clear all buffers
renderer.clear();

// Clear only color
renderer.clear(true, false, false);

// Manual clearing for custom effects
renderer.autoClear = false;
renderer.clear(true, true, true);
```

#### `compileShader(source, type)`
Compile GLSL shader.

**Parameters:**
- `source: string` - Shader source code
- `type: number` - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)

**Returns:** `WebGLShader` - Compiled shader

**Example:**
```javascript
const vertexShader = `
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const compiledShader = renderer.compileShader(vertexShader, gl.VERTEX_SHADER);
```

#### `createProgram(vertexShader, fragmentShader)`
Create shader program.

**Parameters:**
- `vertexShader: WebGLShader` - Vertex shader
- `fragmentShader: WebGLShader` - Fragment shader

**Returns:** `WebGLProgram` - Linked program

**Example:**
```javascript
const vertexShader = renderer.compileShader(vertexSource, gl.VERTEX_SHADER);
const fragmentShader = renderer.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
const program = renderer.createProgram(vertexShader, fragmentShader);
```

#### `getContext()`
Get WebGL context.

**Returns:** `WebGLRenderingContext`

**Example:**
```javascript
const gl = renderer.getContext();
console.log(`WebGL Version: ${gl.getParameter(gl.VERSION)}`);
console.log(`GPU: ${gl.getParameter(gl.RENDERER)}`);
```

#### `getCapabilities()`
Get GPU capabilities.

**Returns:** `WebGLCapabilities`

**Example:**
```javascript
const caps = renderer.getCapabilities();
console.log(`Max texture size: ${caps.maxTextureSize}`);
console.log(`Max vertex attributes: ${caps.maxVertexAttribs}`);
console.log(`Extensions: ${caps.extensions.join(', ')}`);
```

#### `checkError()`
Check for WebGL errors.

**Returns:** `string[]` - Array of error messages

**Example:**
```javascript
// Check after rendering
const errors = renderer.checkError();
if (errors.length > 0) {
    console.error('WebGL Errors:', errors);
}
```

#### `readPixels(x, y, width, height, format?, type?)`
Read pixels from framebuffer.

**Parameters:**
- `x: number` - X position
- `y: number` - Y position
- `width: number` - Width
- `height: number` - Height
- `format?: number` - Pixel format
- `type?: number` - Data type

**Returns:** `Uint8Array` - Pixel data

**Example:**
```javascript
// Read single pixel
const pixel = renderer.readPixels(100, 100, 1, 1);
console.log(`Pixel color: R=${pixel[0]}, G=${pixel[1]}, B=${pixel[2]}, A=${pixel[3]}`);

// Read region
const pixels = renderer.readPixels(0, 0, canvas.width, canvas.height);
```

### Texture Methods

#### `needsUpdate`
Mark texture for GPU upload.

**Example:**
```javascript
// After modifying texture data
texture.needsUpdate = true;
```

#### `dispose()`
Clean up texture resources.

**Example:**
```javascript
texture.dispose();
```

#### `updateMatrix()`
Update texture transformation matrix.

**Example:**
```javascript
texture.offset.set(0.5, 0.5);
texture.rotation = Math.PI / 2;
texture.updateMatrix();
```

### Animation Methods

#### `update(deltaTime)`
Update animation mixer.

**Parameters:**
- `deltaTime: number` - Time delta in seconds

**Example:**
```javascript
const clock = new Clock();

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    mixer.update(deltaTime);
    renderer.render(scene, camera);
}
```

#### `clipAction(clip, root?)`
Create animation action.

**Parameters:**
- `clip: AnimationClip` - Animation clip
- `root?: Object3D` - Root object

**Returns:** `AnimationAction` - Animation action

**Example:**
```javascript
const walkClip = model.animations.find(clip => clip.name === 'walk');
const walkAction = mixer.clipAction(walkClip);
walkAction.play();
```

#### `stopAllAction()`
Stop all animation actions.

**Example:**
```javascript
mixer.stopAllAction();
```

#### `uncacheClip(clip)`
Remove clip from cache.

**Parameters:**
- `clip: AnimationClip` - Animation clip

**Example:**
```javascript
mixer.uncacheClip(walkClip);
```

### AnimationAction Methods

#### `play()`
Start playing animation.

**Example:**
```javascript
action.play();
```

#### `stop()`
Stop playing animation.

**Example:**
```javascript
action.stop();
```

#### `pause()`
Pause animation.

**Example:**
```javascript
action.pause();
```

#### `resume()`
Resume paused animation.

**Example:**
```javascript
action.resume();
```

#### `reset()`
Reset animation to beginning.

**Example:**
```javascript
action.reset();
```

#### `setLoop(loop, repetitions)`
Set animation loop mode.

**Parameters:**
- `loop: LoopMode` - Loop mode
- `repetitions?: number` - Number of repetitions

**Example:**
```javascript
action.setLoop('LoopOnce');       // Play once
action.setLoop('LoopRepeat');     // Loop forever
action.setLoop('LoopPingPong', 5); // Ping-pong 5 times
```

#### `setEffectiveWeight(weight)`
Set animation weight.

**Parameters:**
- `weight: number` - Weight (0-1)

**Example:**
```javascript
action.setEffectiveWeight(0.5); // 50% influence
```

#### `fadeIn(duration)`
Fade in animation.

**Parameters:**
- `duration: number` - Fade duration in seconds

**Example:**
```javascript
action.fadeIn(1.0); // 1 second fade in
```

#### `fadeOut(duration)`
Fade out animation.

**Parameters:**
- `duration: number` - Fade duration in seconds

**Example:**
```javascript
action.fadeOut(0.5); // 0.5 second fade out
```

### Loader Methods

#### `load(url, onLoad, onProgress, onError)`
Load resource.

**Parameters:**
- `url: string` - Resource URL
- `onLoad: Function` - Load success callback
- `onProgress: Function` - Progress callback
- `onError: Function` - Error callback

**Example:**
```javascript
const loader = new GLTFLoader();

loader.load(
    'model.glb',
    (gltf) => {
        console.log('Model loaded:', gltf);
        scene.addObject(gltf.scene);
    },
    (progress) => {
        console.log('Loading progress:', progress.loaded / progress.total * 100 + '%');
    },
    (error) => {
        console.error('Error loading model:', error);
    }
);
```

#### `loadAsync(url)`
Load resource asynchronously.

**Parameters:**
- `url: string` - Resource URL

**Returns:** `Promise` - Promise that resolves with loaded resource

**Example:**
```javascript
const loader = new GLTFLoader();

try {
    const gltf = await loader.loadAsync('model.glb');
    scene.addObject(gltf.scene);
} catch (error) {
    console.error('Error loading model:', error);
}
```

#### `parse(json)`
Parse JSON data.

**Parameters:**
- `json: Object | string` - JSON data

**Example:**
```javascript
const jsonData = await fetch('model.json').then(r => r.json());
const geometry = loader.parse(jsonData);
```

#### `setCrossOrigin(crossOrigin)`
Set CORS mode.

**Parameters:**
- `crossOrigin: string` - CORS mode

**Example:**
```javascript
loader.setCrossOrigin('anonymous');
```

#### `setPath(path)`
Set base path.

**Parameters:**
- `path: string` - Base path for relative URLs

**Example:**
```javascript
loader.setPath('/models/');
loader.load('character.glb', onLoad);
```

## Event System Methods

### EventEmitter Methods

#### `on(event, listener, options?)`
Add event listener.

**Parameters:**
- `event: string` - Event name
- `listener: Function` - Event handler
- `options?: Object` - Listener options

**Returns:** `Function` - Unsubscribe function

**Example:**
```javascript
// Add listener
const unsubscribe = scene.on('objectAdded', (data) => {
    console.log('Object added:', data.object.name);
});

// Or use returned function
unsubscribe();
```

#### `once(event, listener, options?)`
Add one-time event listener.

**Parameters:**
- `event: string` - Event name
- `listener: Function` - Event handler
- `options?: Object` - Listener options

**Returns:** `Function` - Unsubscribe function

**Example:**
```javascript
scene.once('loadComplete', (data) => {
    console.log('First load completed!');
});
```

#### `off(event, listener)`
Remove event listener.

**Parameters:**
- `event: string` - Event name
- `listener: Function` - Event handler

**Example:**
```javascript
function handleObjectAdded(data) {
    console.log('Object added:', data.object.name);
}

scene.on('objectAdded', handleObjectAdded);
// Later...
scene.off('objectAdded', handleObjectAdded);
```

#### `emit(event, data?)`
Emit event.

**Parameters:**
- `event: string` - Event name
- `data?: any` - Event data

**Example:**
```javascript
scene.emit('customEvent', { message: 'Hello' });
scene.emit('objectAdded', { object: cube });
```

#### `removeAllListeners(event?)`
Remove all listeners.

**Parameters:**
- `event?: string` - Event name (optional)

**Example:**
```javascript
// Remove all listeners for specific event
scene.removeAllListeners('objectAdded');

// Remove all listeners
scene.removeAllListeners();
```

## Utility Methods

### Vector3 Methods

#### `set(x, y, z)`
Set vector components.

**Parameters:**
- `x: number` - X component
- `y: number` - Y component  
- `z: number` - Z component

**Example:**
```javascript
const vector = new Vector3();
vector.set(10, 5, 0);
```

#### `copy(v)`
Copy from another vector.

**Parameters:**
- `v: Vector3` - Source vector

**Example:**
```javascript
const source = new Vector3(10, 5, 0);
const target = new Vector3();
target.copy(source);
```

#### `add(v)`
Add vector.

**Parameters:**
- `v: Vector3` - Vector to add

**Example:**
```javascript
const vector = new Vector3(1, 0, 0);
vector.add(new Vector3(2, 3, 4)); // Now (3, 3, 4)
```

#### `sub(v)`
Subtract vector.

**Parameters:**
- `v: Vector3` - Vector to subtract

**Example:**
```javascript
const vector = new Vector3(5, 3, 1);
vector.sub(new Vector3(2, 1, 0)); // Now (3, 2, 1)
```

#### `multiplyScalar(s)`
Multiply by scalar.

**Parameters:**
- `s: number` - Scalar value

**Example:**
```javascript
const vector = new Vector3(1, 2, 3);
vector.multiplyScalar(2); // Now (2, 4, 6)
```

#### `length()`
Get vector length.

**Returns:** `number` - Vector length

**Example:**
```javascript
const vector = new Vector3(3, 4, 0);
const length = vector.length(); // 5
```

#### `distanceTo(v)`
Get distance to another vector.

**Parameters:**
- `v: Vector3` - Target vector

**Returns:** `number` - Distance

**Example:**
```javascript
const v1 = new Vector3(0, 0, 0);
const v2 = new Vector3(3, 4, 0);
const distance = v1.distanceTo(v2); // 5
```

#### `normalize()`
Normalize vector (make length 1).

**Example:**
```javascript
const vector = new Vector3(10, 0, 0);
vector.normalize(); // Now (1, 0, 0)
```

#### `cross(v)`
Cross product.

**Parameters:**
- `v: Vector3` - Other vector

**Returns:** `Vector3` - Cross product result

**Example:**
```javascript
const v1 = new Vector3(1, 0, 0);
const v2 = new Vector3(0, 1, 0);
const cross = v1.cross(v2); // (0, 0, 1)
```

#### `dot(v)`
Dot product.

**Parameters:**
- `v: Vector3` - Other vector

**Returns:** `number` - Dot product

**Example:**
```javascript
const v1 = new Vector3(1, 2, 3);
const v2 = new Vector3(4, 5, 6);
const dot = v1.dot(v2); // 32
```

### Matrix4 Methods

#### `identity()`
Set to identity matrix.

**Example:**
```javascript
const matrix = new Matrix4();
matrix.identity();
```

#### `multiply(m)`
Multiply by matrix.

**Parameters:**
- `m: Matrix4` - Matrix to multiply by

**Example:**
```javascript
const m1 = new Matrix4().makeRotationY(Math.PI / 2);
const m2 = new Matrix4().makeTranslation(10, 0, 0);
m1.multiply(m2);
```

#### `multiplyScalar(s)`
Multiply by scalar.

**Parameters:**
- `s: number` - Scalar value

**Example:**
```javascript
const matrix = new Matrix4();
matrix.multiplyScalar(2);
```

#### `determinant()`
Get matrix determinant.

**Returns:** `number` - Determinant

**Example:**
```javascript
const matrix = new Matrix4();
const det = matrix.determinant();
```

#### `invert()`
Invert matrix.

**Example:**
```javascript
const matrix = new Matrix4();
matrix.invert();
```

#### `transpose()`
Transpose matrix.

**Example:**
```javascript
const matrix = new Matrix4();
matrix.transpose();
```

#### `compose(position, quaternion, scale)`
Compose transformation.

**Parameters:**
- `position: Vector3` - Position
- `quaternion: Quaternion` - Rotation
- `scale: Vector3` - Scale

**Example:**
```javascript
const matrix = new Matrix4();
const position = new Vector3(10, 0, 0);
const quaternion = new Quaternion();
const scale = new Vector3(2, 1, 1);

matrix.compose(position, quaternion, scale);
```

#### `decompose(position, quaternion, scale)`
Decompose matrix.

**Parameters:**
- `position: Vector3` - Position output
- `quaternion: Quaternion` - Rotation output
- `scale: Vector3` - Scale output

**Example:**
```javascript
const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3();

matrix.decompose(position, quaternion, scale);
```

#### `makeRotationX(angle)`
Make X rotation matrix.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
const matrix = new Matrix4();
matrix.makeRotationX(Math.PI / 2);
```

#### `makeRotationY(angle)`
Make Y rotation matrix.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
const matrix = new Matrix4();
matrix.makeRotationY(Math.PI);
```

#### `makeRotationZ(angle)`
Make Z rotation matrix.

**Parameters:**
- `angle: number` - Angle in radians

**Example:**
```javascript
const matrix = new Matrix4();
matrix.makeRotationZ(Math.PI / 4);
```

#### `makeTranslation(x, y, z)`
Make translation matrix.

**Parameters:**
- `x: number` - X translation
- `y: number` - Y translation
- `z: number` - Z translation

**Example:**
```javascript
const matrix = new Matrix4();
matrix.makeTranslation(10, 5, 0);
```

#### `makeScale(x, y, z)`
Make scale matrix.

**Parameters:**
- `x: number` - X scale
- `y: number` - Y scale
- `z: number` - Z scale

**Example:**
```javascript
const matrix = new Matrix4();
matrix.makeScale(2, 1, 2);
```

This comprehensive method reference covers all major methods across the Ninth.js library with practical examples for each function. Each method includes parameter descriptions, return values, and real-world usage examples to help developers understand how to use the library effectively.