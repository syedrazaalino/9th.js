# Object3D Class Reference

The Object3D class is the base class for all objects in the Ninth.js scene graph. It provides transformation, hierarchy, and rendering capabilities for all 3D objects.

## Constructor

```javascript
const object = new Object3D();
```

**Parameters:** None - The Object3D constructor takes no parameters.

## Properties

### Transform Properties

#### `position`

3D position vector of the object in world space.

**Type:** `Vector3`  
**Default:** `{x: 0, y: 0, z: 0}`

**Example:**
```javascript
object.position.set(10, 5, -3);
object.position.x = 10;
object.position.y = 5;
object.position.z = -3;

console.log(object.position); // Vector3 {x: 10, y: 5, z: -3}
```

#### `rotation`

Euler rotation angles in radians.

**Type:** `Euler`  
**Default:** `{x: 0, y: 0, z: 0, order: 'XYZ'}`

**Example:**
```javascript
object.rotation.set(0, Math.PI / 4, 0); // 45 degrees Y-axis
object.rotation.x = Math.PI / 6; // 30 degrees X-axis

// Rotation order affects the final rotation
object.rotation.order = 'ZYX'; // Z first, then Y, then X
```

#### `scale`

Scale factors for each axis.

**Type:** `Vector3`  
**Default:** `{x: 1, y: 1, z: 1}`

**Example:**
```javascript
object.scale.set(2, 2, 2); // Double size
object.scale.set(0.5, 1, 2); // Half X, normal Y, double Z

// Uniform scaling
object.scale.multiplyScalar(1.5); // Scale by 1.5
```

#### `quaternion`

Quaternion representing the object's rotation.

**Type:** `Quaternion`  
**Default:** Identity quaternion

**Example:**
```javascript
// Convert Euler rotation to quaternion
const euler = new Euler(0, Math.PI / 4, 0);
object.quaternion.setFromEuler(euler);

// Spherical interpolation between rotations
const quaternion1 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
const quaternion2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
object.quaternion.slerp(quaternion1, 0.5); // Halfway between
```

### Hierarchy Properties

#### `parent`

The parent object in the scene graph.

**Type:** `Object3D|null`  
**Default:** `null`

**Example:**
```javascript
const parent = new Object3D();
const child = new Object3D();

parent.add(child);
console.log(child.parent === parent); // true

child.parent = null; // Remove from parent
```

#### `children`

Array of child objects.

**Type:** `Array<Object3D>`  
**Default:** `[]`

**Example:**
```javascript
console.log(parent.children.length); // Number of children
parent.children.forEach(child => {
    console.log('Child:', child.name);
});
```

#### `matrix`

Local transformation matrix.

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
object.updateMatrix();
const localMatrix = object.matrix;

console.log('Local matrix:', localMatrix.elements);
```

#### `matrixWorld`

World transformation matrix (includes parent's transformations).

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
object.updateMatrixWorld();
const worldMatrix = object.matrixWorld;

// Transform point from local to world space
const localPoint = new Vector3(1, 0, 0);
const worldPoint = localPoint.applyMatrix4(worldMatrix);
```

#### `matrixWorldNeedsUpdate`

Flag indicating if world matrix needs updating.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
object.matrixWorldNeedsUpdate = true; // Force world matrix update
```

### Visibility and Rendering Properties

#### `visible`

Whether the object and its children are visible.

**Type:** `boolean`  
**Default:** `true`

**Example:**
```javascript
object.visible = false; // Hide object and children
object.visible = true; // Show object and children
```

#### `castShadow`

Whether this object casts shadows.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
object.castShadow = true; // Enable shadow casting

// Check if shadows are supported
if (renderer.shadowMap.enabled) {
    object.castShadow = true;
}
```

#### `receiveShadow`

Whether this object receives shadows.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
const ground = new Object3D();
ground.receiveShadow = true; // Enable shadow receiving
scene.add(ground);
```

#### `frustumCulled`

Whether this object is frustum culled.

**Type:** `boolean`  
**Default:** `true`

**Example:**
```javascript
object.frustumCulled = false; // Disable frustum culling for this object

// Useful for very large objects or objects that should always be visible
const skybox = new Object3D();
skybox.frustumCulled = false; // Always render skybox
```

### ID and Name Properties

#### `id`

Unique identifier for the object.

**Type:** `number`  
**Default:** Auto-generated unique ID

**Example:**
```javascript
console.log(object.id); // Unique numeric ID
```

#### `uuid`

Universally unique identifier.

**Type:** `string`  
**Default:** Auto-generated UUID

**Example:**
```javascript
console.log(object.uuid); // String UUID like '550e8400-e29b-41d4-a716-446655440000'
```

#### `name`

Optional name for the object.

**Type:** `string`  
**Default:** `''`

**Example:**
```javascript
object.name = 'player_character';
const foundObject = scene.getObjectByName('player_character');
console.log(foundObject === object); // true
```

#### `type`

The object's type name.

**Type:** `string`  
**Default:** `'Object3D'`

**Example:**
```javascript
console.log(object.type); // 'Object3D'
console.log(mesh.type);   // 'Mesh'
console.log(light.type);  // 'Light'
```

## Methods

### Hierarchy Management

#### `add(object)`

Add an object as a child of this object.

**Parameters:**
- `object` (Object3D): Object to add as child

**Returns:** `Object3D` - The added object

**Example:**
```javascript
const parent = new Object3D();
const child = new Object3D();
child.name = 'child_object';

parent.add(child);
console.log(parent.children.length); // 1
console.log(child.parent === parent); // true
```

#### `remove(object)`

Remove a child object from this object.

**Parameters:**
- `object` (Object3D): Object to remove

**Returns:** `Object3D` - The removed object

**Example:**
```javascript
parent.remove(child);
console.log(parent.children.length); // 0
console.log(child.parent); // null
```

#### `getObjectByName(name)`

Find a child object by name.

**Parameters:**
- `name` (string): Name of the object to find

**Returns:** `Object3D|null` - Found object or null

**Example:**
```javascript
const child1 = new Object3D();
child1.name = 'child1';
parent.add(child1);

const found = parent.getObjectByName('child1');
console.log(found === child1); // true
```

#### `getObjectById(id)`

Find a child object by ID.

**Parameters:**
- `id` (number): ID of the object to find

**Returns:** `Object3D|null` - Found object or null

**Example:**
```javascript
const found = parent.getObjectById(child.id);
console.log(found === child); // true
```

#### `traverse(callback)`

Traverse the object hierarchy, calling callback on each object.

**Parameters:**
- `callback` (Function): Function to call on each object

**Example:**
```javascript
parent.traverse((object) => {
    console.log('Object:', object.name || object.id);
});

// Traverse visible objects only
parent.traverseVisible((object) => {
    if (object.visible) {
        console.log('Visible object:', object.name);
    }
});
```

#### `traverseAndModify(callback)`

Traverse and modify objects during traversal.

**Parameters:**
- `callback` (Function): Function to call on each object, can return modifications

**Example:**
```javascript
parent.traverseAndModify((object) => {
    // Enable shadows for all meshes
    if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
    }
    
    // Or return a new object
    return object;
});
```

### Transform Operations

#### `updateMatrix()`

Update the local transformation matrix.

**Example:**
```javascript
// Modify transforms
object.position.set(10, 0, 0);
object.rotation.set(0, Math.PI / 4, 0);

// Update matrix
object.updateMatrix();

console.log('Matrix updated:', object.matrix);
```

#### `updateMatrixWorld(force)`

Update the world transformation matrix.

**Parameters:**
- `force` (boolean, optional): Force update even if not needed (default: false)

**Example:**
```javascript
object.updateMatrix();
object.updateMatrixWorld();

const worldPosition = new Vector3();
object.getWorldPosition(worldPosition);
console.log('World position:', worldPosition);
```

#### `updateMatrixWorld(force)`

Update world transformation matrix recursively.

**Parameters:**
- `force` (boolean, optional): Force update even if not needed (default: false)

**Example:**
```javascript
// Update all child matrices
parent.updateMatrixWorld(true);

// Or update only when needed
if (parent.matrixWorldNeedsUpdate) {
    parent.updateMatrixWorld();
}
```

#### `applyMatrix4(matrix)`

Apply a transformation matrix to this object.

**Parameters:**
- `matrix` (Matrix4): Matrix to apply

**Example:**
```javascript
const matrix = new Matrix4();
matrix.set(
    1, 0, 0, 10,  // X axis + translation
    0, 1, 0,  0,  // Y axis
    0, 0, 1,  0,  // Z axis
    0, 0, 0,  1   // Homogeneous coordinate
);

object.applyMatrix4(matrix); // Adds translation
```

#### `applyMatrix3(matrix)`

Apply a 3x3 matrix to this object's transformation.

**Parameters:**
- `matrix` (Matrix3): Matrix to apply

**Example:**
```javascript
const matrix3 = new Matrix3();
matrix3.set(
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
);

object.applyMatrix3(matrix3);
```

### Position and Rotation

#### `getWorldPosition(target)`

Get the world position of this object.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const worldPos = new Vector3();
object.getWorldPosition(worldPos);

console.log('World position:', worldPos);
// or
const position = object.getWorldPosition(new Vector3());
```

#### `getLocalPosition(target)`

Get the local position of this object.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const localPos = new Vector3();
object.getLocalPosition(localPos);
console.log('Local position:', localPos);
```

#### `getWorldQuaternion(target)`

Get the world rotation quaternion of this object.

**Parameters:**
- `target` (Quaternion): Quaternion to store result

**Returns:** `Quaternion` - The target quaternion

**Example:**
```javascript
const worldQuat = new Quaternion();
object.getWorldQuaternion(worldQuat);
console.log('World rotation:', worldQuat);
```

#### `getWorldScale(target)`

Get the world scale of this object.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const worldScale = new Vector3();
object.getWorldScale(worldScale);
console.log('World scale:', worldScale);
```

#### `getWorldDirection(target)`

Get the forward direction of this object in world space.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const direction = new Vector3();
object.getWorldDirection(direction);

console.log('Forward direction:', direction);
// Points in the object's -Z direction in local space
```

#### `lookAt(vector)`

Make this object look at a target position.

**Parameters:**
- `vector` (Vector3): Position to look at

**Example:**
```javascript
const target = new Vector3(0, 0, 0);
object.lookAt(target);

// With optional up vector
object.lookAt(0, 0, 0, 0, 1, 0);
```

#### `rotateX(angle)`

Rotate the object around the X-axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Example:**
```javascript
object.rotateX(Math.PI / 4); // 45 degrees around X
```

#### `rotateY(angle)`

Rotate the object around the Y-axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Example:**
```javascript
object.rotateY(Math.PI / 2); // 90 degrees around Y
```

#### `rotateZ(angle)`

Rotate the object around the Z-axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Example:**
```javascript
object.rotateZ(Math.PI); // 180 degrees around Z
```

#### `rotateOnAxis(axis, angle)`

Rotate the object around an arbitrary axis.

**Parameters:**
- `axis` (Vector3): Rotation axis
- `angle` (number): Rotation angle in radians

**Example:**
```javascript
const axis = new Vector3(1, 1, 0).normalize();
object.rotateOnAxis(axis, Math.PI / 4);
```

### Transformation Creation

#### `clone(recursive)`

Clone this object.

**Parameters:**
- `recursive` (boolean): Whether to clone children (default: true)

**Returns:** `Object3D` - Cloned object

**Example:**
```javascript
const cloned = object.clone(true); // Deep clone with children
const shallowClone = object.clone(false); // Shallow clone

console.log('Original children:', object.children.length);
console.log('Cloned children:', cloned.children.length);
```

#### `copy(source)`

Copy another object.

**Parameters:**
- `source` (Object3D): Object to copy from

**Returns:** `Object3D` - This object

**Example:**
```javascript
const source = new Object3D();
source.position.set(10, 5, 0);
source.name = 'source';

const target = new Object3D();
target.copy(source);

console.log('Target position:', target.position);
console.log('Target name:', target.name);
```

### Distance and Measurements

#### `getWorldDistance(target)`

Get the distance from this object to another object.

**Parameters:**
- `target` (Object3D): Target object

**Returns:** `number` - Distance in world units

**Example:**
```javascript
const distance = object.getWorldDistance(anotherObject);
console.log('Distance:', distance);
```

#### `localToWorld(vector)`

Convert a local coordinate to world coordinate.

**Parameters:**
- `vector` (Vector3): Local coordinate to convert

**Returns:** `Vector3` - World coordinate

**Example:**
```javascript
const localPoint = new Vector3(1, 0, 0);
const worldPoint = object.localToWorld(localPoint);

console.log('Local:', localPoint);
console.log('World:', worldPoint);
```

#### `worldToLocal(vector)`

Convert a world coordinate to local coordinate.

**Parameters:**
- `vector` (Vector3): World coordinate to convert

**Returns:** `Vector3` - Local coordinate

**Example:**
```javascript
const worldPoint = new Vector3(10, 0, 0);
const localPoint = object.worldToLocal(worldPoint);

console.log('World:', worldPoint);
console.log('Local:', localPoint);
```

### Raycasting

#### `raycast(raycaster, intersects)`

Perform ray casting against this object and its children.

**Parameters:**
- `raycaster` (Raycaster): Raycaster to use
- `intersects` (Array): Array to store intersections

**Example:**
```javascript
const raycaster = new Raycaster();
const ray = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, -1));
raycaster.ray.copy(ray);

const intersects = [];
object.raycast(raycaster, intersects);

console.log('Intersections:', intersects.length);
```

### Utility Methods

#### `onBeforeRender(renderer, scene, camera)`

Called before rendering this object.

**Parameters:**
- `renderer` (WebGLRenderer): Renderer
- `scene` (Scene): Scene
- `camera` (Camera): Camera

**Example:**
```javascript
object.onBeforeRender = function(renderer, scene, camera) {
    // Custom pre-render logic
    console.log('Rendering:', this.name);
};
```

#### `onAfterRender(renderer, scene, camera)`

Called after rendering this object.

**Parameters:**
- `renderer` (WebGLRenderer): Renderer
- `scene` (Scene): Scene
- `camera` (Camera): Camera

**Example:**
```javascript
object.onAfterRender = function(renderer, scene, camera) {
    // Custom post-render logic
    console.log('Rendered:', this.name);
};
```

#### `toJSON(meta)`

Convert object to JSON format.

**Parameters:**
- `meta` (Object): Metadata object

**Returns:** `Object` - JSON representation

**Example:**
```javascript
const json = object.toJSON();
console.log(JSON.stringify(json, null, 2));
```

## Events

Object3D inherits event handling capabilities and emits the following events:

### `transform-changed`

Emitted when the object's transformation changes.

**Event Data:**
- `object` (Object3D): The object that changed
- `property` (string): Which property changed ('position', 'rotation', 'scale')

**Example:**
```javascript
object.on('transform-changed', (event) => {
    console.log('Object transformed:', event.property);
});
```

### `added-to-scene`

Emitted when object is added to a scene.

**Event Data:**
- `object` (Object3D): The object that was added
- `scene` (Scene): The scene it was added to

**Example:**
```javascript
object.on('added-to-scene', (event) => {
    console.log('Object added to scene:', event.object.name);
});
```

### `removed-from-scene`

Emitted when object is removed from a scene.

**Event Data:**
- `object` (Object3D): The object that was removed
- `scene` (Scene): The scene it was removed from

**Example:**
```javascript
object.on('removed-from-scene', (event) => {
    console.log('Object removed from scene');
});
```

## Usage Examples

### Basic Object Hierarchy

```javascript
// Create a hierarchy
const root = new Object3D();
root.name = 'root';

const child1 = new Object3D();
child1.name = 'child1';
child1.position.set(5, 0, 0);

const child2 = new Object3D();
child2.name = 'child2';
child2.position.set(-5, 0, 0);

// Build hierarchy
root.add(child1, child2);

const grandchild = new Object3D();
grandchild.name = 'grandchild';
child1.add(grandchild);

// Traverse the hierarchy
root.traverse((object) => {
    console.log(object.name || object.id);
    console.log('World position:', object.getWorldPosition(new Vector3()));
});
```

### Animation and Transforms

```javascript
const object = new Object3D();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate around local Y axis
    object.rotateY(0.01);
    
    // Scale pulse
    const scale = 1 + Math.sin(Date.now() * 0.001) * 0.2;
    object.scale.set(scale, scale, scale);
    
    // Update matrices
    object.updateMatrix();
}

animate();
```

### Object Picking

```javascript
// Using raycasting for object picking
const raycaster = new Raycaster();
const mouse = new Vector2();

// Convert mouse coordinates to normalized device coordinates
mouse.x = (mouseX / window.innerWidth) * 2 - 1;
mouse.y = -(mouseY / window.innerHeight) * 2 + 1;

raycaster.setFromCamera(mouse, camera);

// Raycast against all objects in scene
const intersects = [];
scene.raycast(raycaster, intersects);

if (intersects.length > 0) {
    const pickedObject = intersects[0].object;
    console.log('Picked object:', pickedObject.name);
    
    // Highlight the picked object
    pickedObject.material.emissive.setHex(0x333333);
}
```

### Camera Follow System

```javascript
// Camera that follows a target object
class CameraFollower extends Object3D {
    constructor(target, camera) {
        super();
        this.target = target;
        this.camera = camera;
        this.offset = new Vector3(0, 2, 5);
        this.lookAhead = new Vector3(0, 1, 0);
    }
    
    update() {
        // Get target world position
        const targetPosition = this.target.getWorldPosition(new Vector3());
        
        // Calculate desired camera position
        const desiredPosition = targetPosition.clone();
        desiredPosition.add(this.offset);
        
        // Smoothly move camera to desired position
        this.camera.position.lerp(desiredPosition, 0.1);
        
        // Look at target with look-ahead
        const lookTarget = targetPosition.clone();
        lookTarget.add(this.lookAhead);
        this.camera.lookAt(lookTarget);
    }
}
```

### LOD (Level of Detail) System

```javascript
// Simple LOD implementation
class LODObject extends Object3D {
    constructor() {
        super();
        this.levels = [];
        this.currentLevel = 0;
    }
    
    addLevel(object, distance) {
        this.levels.push({ object, distance });
        this.add(object);
    }
    
    update(camera) {
        const cameraPosition = camera.getWorldPosition(new Vector3());
        const objectPosition = this.getWorldPosition(new Vector3());
        
        const distance = cameraPosition.distanceTo(objectPosition);
        
        // Find appropriate level
        let bestLevel = 0;
        for (let i = 0; i < this.levels.length; i++) {
            if (distance >= this.levels[i].distance) {
                bestLevel = i;
            }
        }
        
        // Switch to appropriate level
        if (bestLevel !== this.currentLevel) {
            this.levels[this.currentLevel].object.visible = false;
            this.levels[bestLevel].object.visible = true;
            this.currentLevel = bestLevel;
        }
    }
}

// Usage
const lodObject = new LODObject();
lodObject.addLevel(highDetailMesh, 0);
lodObject.addLevel(mediumDetailMesh, 50);
lodObject.addLevel(lowDetailMesh, 100);

scene.add(lodObject);
```

The Object3D class provides the fundamental foundation for all 3D objects in Ninth.js, offering comprehensive transformation, hierarchy, and rendering management capabilities.