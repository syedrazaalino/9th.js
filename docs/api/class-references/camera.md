# Camera Class Reference

The Camera class is the base class for all cameras in Ninth.js. It provides the projection and view matrices needed to render a 3D scene from a specific viewpoint.

## Constructor

```javascript
const camera = new Camera();
```

**Parameters:** None - The Camera constructor takes no parameters.

**Example:**
```javascript
const camera = new Camera();
scene.add(camera);
```

## Properties

### Projection Properties

#### `projectionMatrix`

The camera's projection matrix.

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
console.log('Projection matrix:', camera.projectionMatrix.elements);

// Update projection matrix (usually automatic)
camera.updateProjectionMatrix();
```

#### `projectionMatrixInverse`

The inverse of the projection matrix.

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
console.log('Inverse projection matrix:', camera.projectionMatrixInverse.elements);

// Useful for converting screen coordinates to world space
const screenToWorld = (screenX, screenY, depth) => {
    const vector = new Vector3(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1,
        depth
    );
    
    vector.applyMatrix4(camera.projectionMatrixInverse);
    return vector;
};
```

#### `near`

Distance to the near clipping plane.

**Type:** `number`  
**Default:** `0.1`

**Example:**
```javascript
camera.near = 0.01; // Very close near plane
camera.near = 100;  // Far near plane for architectural visualization

// Update projection matrix after changing near
camera.updateProjectionMatrix();
```

#### `far`

Distance to the far clipping plane.

**Type:** `number`  
**Default:** `2000`

**Example:**
```javascript
camera.far = 1000;   // Standard distance
camera.far = 10000;  // Very far for space scenes

// Large near/far ratios can cause precision issues
camera.near = 0.1;
camera.far = 1000;   // 10000:1 ratio is reasonable
camera.far = 100000; // 1000000:1 ratio may cause z-fighting
```

### View Properties

#### `matrix`

The camera's view matrix (inverse of world matrix).

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
// The view matrix represents the camera's transformation
camera.updateMatrix();
console.log('View matrix:', camera.matrix.elements);

// The view matrix is the inverse of the camera's world matrix
const worldMatrix = camera.matrixWorld;
const viewMatrix = camera.matrix; // Should be inverse of worldMatrix
```

#### `matrixWorld`

The camera's world transformation matrix.

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
camera.updateMatrixWorld();
console.log('World matrix:', camera.matrixWorld.elements);

// Transform objects to camera space
const worldPoint = new Vector3(10, 0, 0);
const cameraSpacePoint = worldPoint.clone().applyMatrix4(camera.matrixWorld);
```

#### `quaternion`

The camera's rotation as a quaternion.

**Type:** `Quaternion`  
**Default:** Identity quaternion

**Example:**
```javascript
const camera = new Camera();
// The camera looks down the -Z axis in local space
camera.lookAt(0, 0, -10); // Now looking at a point 10 units away

console.log('Camera quaternion:', camera.quaternion);
// Points the camera in the direction of its -Z axis
```

### Position and Orientation

#### `position`

Camera position in world space.

**Type:** `Vector3`  
**Default:** `{x: 0, y: 0, z: 0}`

**Example:**
```javascript
camera.position.set(0, 5, 10); // 5 units up, 10 units back
camera.position.x = 0;
camera.position.y = 5;
camera.position.z = 10;

// Typical camera positions for different scenarios
// Ground level view
camera.position.set(0, 1.7, 0);

// Aerial view
camera.position.set(0, 100, 0);

// First-person view
camera.position.set(player.position.x, player.position.y + 1.7, player.position.z);
```

#### `up`

The camera's up direction vector.

**Type:** `Vector3`  
**Default:** `{x: 0, y: 1, z: 0}` (Y-axis up)

**Example:**
```javascript
// Standard Y-up coordinate system
camera.up.set(0, 1, 0);

// Z-up coordinate system (used in some 3D software)
camera.up.set(0, 0, 1);

// X-up coordinate system
camera.up.set(1, 0, 0);

// Custom up vector for special cases
camera.up.set(0, 1, 0.1); // Slightly tilted up
```

#### `target`

Point the camera looks at.

**Type:** `Vector3`  
**Default:** `{x: 0, y: 0, z: 0}`

**Example:**
```javascript
camera.target.set(0, 0, 0); // Look at origin
camera.target.set(player.position.x, player.position.y, player.position.z);

// Smooth camera following
const target = new Vector3(0, 0, 0);
const lerpFactor = 0.1;

function updateCamera() {
    camera.target.lerp(player.position, lerpFactor);
    camera.lookAt(camera.target);
}
```

### Frustum Properties

#### `frustum`

The camera's view frustum (for culling).

**Type:** `Frustum`  
**Default:** New frustum instance

**Example:**
```javascript
// Check if an object is visible in the camera frustum
const frustum = camera.frustum;
const object = new Object3D();
object.updateMatrixWorld();

if (frustum.intersectsObject(object)) {
    console.log('Object is visible');
}

// Get frustum planes for custom culling
const planes = frustum.planes;
console.log('Number of frustum planes:', planes.length);
```

#### `viewMatrix`

Explicit view matrix (same as matrix property).

**Type:** `Matrix4`  
**Default:** Identity matrix

**Example:**
```javascript
console.log('View matrix:', camera.viewMatrix.elements);

// Should be the same as camera.matrix
console.log(camera.viewMatrix === camera.matrix); // true
```

### ID and Metadata

#### `id`

Unique identifier for the camera.

**Type:** `number`  
**Default:** Auto-generated unique ID

**Example:**
```javascript
console.log('Camera ID:', camera.id);
```

#### `uuid`

Universally unique identifier.

**Type:** `string`  
**Default:** Auto-generated UUID

**Example:**
```javascript
console.log('Camera UUID:', camera.uuid);
```

#### `name`

Optional name for the camera.

**Type:** `string`  
**Default:** `''`

**Example:**
```javascript
camera.name = 'main_camera';
camera.name = 'debug_camera';
camera.name = 'player_camera';

// Find camera by name
const mainCamera = scene.getObjectByName('main_camera');
```

## Methods

### Matrix Operations

#### `updateMatrix()`

Update the camera's view matrix.

**Example:**
```javascript
// Modify camera transform
camera.position.set(10, 5, 0);
camera.lookAt(0, 0, 0);

// Update view matrix
camera.updateMatrix();

console.log('View matrix updated');
```

#### `updateMatrixWorld(force)`

Update the camera's world matrix.

**Parameters:**
- `force` (boolean, optional): Force update even if not needed (default: false)

**Example:**
```javascript
// Update world matrix after parent transforms
camera.updateMatrixWorld(true);
```

#### `updateProjectionMatrix()`

Update the camera's projection matrix.

**Example:**
```javascript
// After changing projection parameters
camera.near = 0.1;
camera.far = 1000;
camera.updateProjectionMatrix();

console.log('Projection matrix updated');
```

#### `updateCameraMatrix()`

Update both view and projection matrices.

**Example:**
```javascript
// Update all camera matrices
camera.updateCameraMatrix();

// Equivalent to calling:
camera.updateMatrix();
camera.updateProjectionMatrix();
camera.updateMatrixWorld();
```

### View and Projection

#### `getWorldPosition(target)`

Get the camera's world position.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const cameraPos = new Vector3();
camera.getWorldPosition(cameraPos);

console.log('Camera world position:', cameraPos);
```

#### `lookAt(vector, up)`

Make the camera look at a target position.

**Parameters:**
- `vector` (Vector3): Position to look at
- `up` (Vector3, optional): Up direction

**Example:**
```javascript
// Look at origin
camera.lookAt(0, 0, 0);

// Look at a specific point
camera.lookAt(player.position);

// Look at with custom up vector
camera.lookAt(0, 0, 0, 0, 0, 1); // Z-up
```

#### `getWorldDirection(target)`

Get the camera's forward direction in world space.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const forward = new Vector3();
camera.getWorldDirection(forward);

console.log('Camera forward direction:', forward);
// This points in the direction the camera is looking
```

#### `getWorldRight(target)`

Get the camera's right direction in world space.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const right = new Vector3();
camera.getWorldRight(right);

console.log('Camera right direction:', right);
```

#### `getWorldUp(target)`

Get the camera's up direction in world space.

**Parameters:**
- `target` (Vector3): Vector to store result

**Returns:** `Vector3` - The target vector

**Example:**
```javascript
const up = new Vector3();
camera.getWorldUp(up);

console.log('Camera up direction:', up);
```

### Projection Operations

#### `setFov(fov)`

Set the camera's field of view.

**Parameters:**
- `fov` (number): Field of view in degrees

**Example:**
```javascript
camera.setFov(75); // Wide angle
camera.setFov(30); // Telephoto
camera.setFov(120); // Fish-eye effect
```

#### `getFov()`

Get the camera's field of view.

**Returns:** `number` - Field of view in degrees

**Example:**
```javascript
console.log('Current FOV:', camera.getFov());
```

#### `setAspect(aspect)`

Set the camera's aspect ratio.

**Parameters:**
- `aspect` (number): Aspect ratio (width / height)

**Example:**
```javascript
camera.setAspect(window.innerWidth / window.innerHeight);
camera.updateProjectionMatrix();

// Handle window resize
window.addEventListener('resize', () => {
    camera.setAspect(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
```

#### `getAspect()`

Get the camera's aspect ratio.

**Returns:** `number` - Aspect ratio

**Example:**
```javascript
console.log('Current aspect ratio:', camera.getAspect());
```

### World Space Conversions

#### `localToWorld(vector)`

Convert a local coordinate to world coordinate.

**Parameters:**
- `vector` (Vector3): Local coordinate to convert

**Returns:** `Vector3` - World coordinate

**Example:**
```javascript
const localPoint = new Vector3(0, 0, -10); // 10 units in front of camera
const worldPoint = camera.localToWorld(localPoint);

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
const localPoint = camera.worldToLocal(worldPoint);

console.log('World:', worldPoint);
console.log('Local:', localPoint);
```

#### `screenToWorld(x, y, z)`

Convert screen coordinates to world coordinates.

**Parameters:**
- `x` (number): Screen X coordinate
- `y` (number): Screen Y coordinate
- `z` (number): Depth (0 = near plane, 1 = far plane)

**Returns:** `Vector3` - World coordinate

**Example:**
```javascript
// Convert mouse position to world space
const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

const worldPos = camera.screenToWorld(mouseX, mouseY, 0.5);
console.log('Mouse world position:', worldPos);
```

#### `worldToScreen(vector)`

Convert world coordinates to screen coordinates.

**Parameters:**
- `vector` (Vector3): World coordinate to convert

**Returns:** `Vector3` - Screen coordinate

**Example:**
```javascript
const worldPos = new Vector3(10, 0, 0);
const screenPos = camera.worldToScreen(worldPos);

console.log('World:', worldPos);
console.log('Screen:', screenPos);
// screenPos.x and screenPos.y are in screen coordinates
```

### Ray Casting

#### `generateRay(origin, direction)`

Generate a ray from the camera.

**Parameters:**
- `origin` (Vector3): Ray origin
- `direction` (Vector3): Ray direction

**Returns:** `Ray` - Generated ray

**Example:**
```javascript
const rayOrigin = camera.position.clone();
const rayDirection = new Vector3(0, 0, -1);
camera.getWorldDirection(rayDirection);

const ray = camera.generateRay(rayOrigin, rayDirection);

// Use ray for intersection testing
const raycaster = new Raycaster();
raycaster.ray.copy(ray);
const intersects = raycaster.intersectObjects(scene.children);
```

#### `getRayFromScreen(x, y)`

Get a ray from the camera through a screen point.

**Parameters:**
- `x` (number): Screen X coordinate (normalized -1 to 1)
- `y` (number): Screen Y coordinate (normalized -1 to 1)

**Returns:** `Ray` - Ray from camera through screen point

**Example:**
```javascript
// Get ray through mouse position
const mouse = new Vector2(
    (mouseX / window.innerWidth) * 2 - 1,
    -(mouseY / window.innerHeight) * 2 + 1
);

const ray = camera.getRayFromScreen(mouse.x, mouse.y);
```

### Utility Methods

#### `toJSON(meta)`

Convert camera to JSON format.

**Parameters:**
- `meta` (Object): Metadata object

**Returns:** `Object` - JSON representation

**Example:**
```javascript
const json = camera.toJSON();
console.log(JSON.stringify(json, null, 2));
```

#### `copy(source)`

Copy another camera.

**Parameters:**
- `source` (Camera): Camera to copy from

**Returns:** `Camera` - This camera

**Example:**
```javascript
const sourceCamera = new Camera();
sourceCamera.position.set(10, 5, 0);

const targetCamera = new Camera();
targetCamera.copy(sourceCamera);

console.log('Target camera position:', targetCamera.position);
```

#### `clone()`

Clone this camera.

**Returns:** `Camera` - Cloned camera

**Example:**
```javascript
const clonedCamera = camera.clone();
scene.add(clonedCamera);

console.log('Original ID:', camera.id);
console.log('Cloned ID:', clonedCamera.id);
```

## PerspectiveCamera

Extends Camera to provide perspective projection.

### Constructor

```javascript
const perspectiveCamera = new PerspectiveCamera(fov, aspect, near, far);
```

**Parameters:**
- `fov` (number): Field of view in degrees (default: 50)
- `aspect` (number): Aspect ratio (default: 1)
- `near` (number): Near clipping plane (default: 0.1)
- `far` (number): Far clipping plane (default: 2000)

**Example:**
```javascript
const camera = new PerspectiveCamera(
    75,                           // 75 degree field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                          // Near plane
    1000                          // Far plane
);
```

### Perspective-Specific Methods

#### `setFov(fov)`

Set the field of view.

**Parameters:**
- `fov` (number): Field of view in degrees

**Example:**
```javascript
camera.setFov(90); // Wide-angle lens
camera.setFov(30); // Telephoto lens
camera.updateProjectionMatrix();
```

#### `getFov()`

Get the field of view.

**Returns:** `number` - Field of view in degrees

**Example:**
```javascript
console.log('Current FOV:', camera.getFov());
```

## OrthographicCamera

Extends Camera to provide orthographic projection.

### Constructor

```javascript
const orthographicCamera = new OrthographicCamera(left, right, top, bottom, near, far);
```

**Parameters:**
- `left` (number): Left frustum plane
- `right` (number): Right frustum plane
- `top` (number): Top frustum plane
- `bottom` (number): Bottom frustum plane
- `near` (number): Near clipping plane (default: 0.1)
- `far` (number): Far clipping plane (default: 2000)

**Example:**
```javascript
const camera = new OrthographicCamera(
    -10,   // Left
    10,    // Right
    10,    // Top
    -10,   // Bottom
    0.1,   // Near
    1000   // Far
);
```

### Orthographic-Specific Methods

#### `updateOrtho()`

Update the orthographic projection matrix.

**Example:**
```javascript
// Modify frustum planes
camera.left = -20;
camera.right = 20;
camera.top = 15;
camera.bottom = -15;

// Update projection
camera.updateOrtho();
camera.updateProjectionMatrix();
```

#### `setSize(width, height)`

Set the orthographic camera size.

**Parameters:**
- `width` (number): Viewport width
- `height` (number): Viewport height

**Example:**
```javascript
camera.setSize(window.innerWidth, window.innerHeight);
camera.updateProjectionMatrix();
```

## Usage Examples

### Basic Camera Setup

```javascript
// Create a perspective camera
const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Position the camera
camera.position.set(0, 2, 5);

// Make it look at the origin
camera.lookAt(0, 0, 0);

// Add to scene
scene.add(camera);
```

### First-Person Camera

```javascript
class FirstPersonCamera extends PerspectiveCamera {
    constructor() {
        super(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.moveSpeed = 0.1;
        this.lookSpeed = 0.002;
        
        this.setupControls();
    }
    
    setupControls() {
        // Mouse look
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === canvas) {
                this.rotation.y -= event.movementX * this.lookSpeed;
                this.rotation.x -= event.movementY * this.lookSpeed;
                
                // Clamp vertical rotation
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            }
        });
        
        // Keyboard movement
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward(this.moveSpeed);
                    break;
                case 'KeyS':
                    this.moveForward(-this.moveSpeed);
                    break;
                case 'KeyA':
                    this.moveRight(-this.moveSpeed);
                    break;
                case 'KeyD':
                    this.moveRight(this.moveSpeed);
                    break;
            }
        });
    }
    
    moveForward(distance) {
        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        forward.multiplyScalar(distance);
        this.position.add(forward);
    }
    
    moveRight(distance) {
        const right = new Vector3(1, 0, 0);
        right.applyQuaternion(this.quaternion);
        right.multiplyScalar(distance);
        this.position.add(right);
    }
}

// Usage
const fpsCamera = new FirstPersonCamera();
scene.add(fpsCamera);
```

### Camera Switcher

```javascript
class CameraManager {
    constructor() {
        this.cameras = [];
        this.activeCamera = null;
        this.cameraIndex = 0;
    }
    
    addCamera(camera, name = null) {
        this.cameras.push({ camera, name });
        
        if (!this.activeCamera) {
            this.activeCamera = camera;
        }
    }
    
    switchCamera() {
        if (this.cameras.length === 0) return;
        
        this.cameraIndex = (this.cameraIndex + 1) % this.cameras.length;
        this.activeCamera = this.cameras[this.cameraIndex].camera;
        
        console.log('Switched to camera:', this.cameras[this.cameraIndex].name);
    }
    
    setCamera(index) {
        if (index >= 0 && index < this.cameras.length) {
            this.cameraIndex = index;
            this.activeCamera = this.cameras[index].camera;
        }
    }
    
    getActiveCamera() {
        return this.activeCamera;
    }
}

// Usage
const cameraManager = new CameraManager();
cameraManager.addCamera(mainCamera, 'Main Camera');
cameraManager.addCamera(overviewCamera, 'Overview Camera');
cameraManager.addCamera(followCamera, 'Follow Camera');

// Switch with spacebar
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        cameraManager.switchCamera();
    }
});

// Render with active camera
function render() {
    const camera = cameraManager.getActiveCamera();
    renderer.render(scene, camera);
}
```

### Smooth Camera Follow

```javascript
class SmoothFollowCamera extends PerspectiveCamera {
    constructor(target, offset = new Vector3(0, 2, 5)) {
        super(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.target = target;
        this.offset = offset;
        this.lookAhead = new Vector3(0, 1, 0);
        this.smoothness = 0.1;
        
        // Initialize position
        this.position.copy(this.target.position).add(this.offset);
        this.lookAt(this.target.position);
    }
    
    update() {
        if (!this.target) return;
        
        // Calculate desired position
        const targetPosition = this.target.position.clone();
        const desiredPosition = targetPosition.clone().add(this.offset);
        
        // Apply smoothing
        this.position.lerp(desiredPosition, this.smoothness);
        
        // Calculate look-at target with look-ahead
        const lookTarget = targetPosition.clone();
        lookTarget.add(this.lookAhead);
        
        // Apply smoothing to rotation
        const currentLook = new Vector3();
        this.getWorldDirection(currentLook);
        
        const targetLook = lookTarget.clone().sub(this.position).normalize();
        const newLook = currentLook.lerp(targetLook, this.smoothness);
        
        // Update camera to look at smoothed direction
        const newTarget = this.position.clone().add(newLook);
        this.lookAt(newTarget);
    }
}

// Usage
const followCamera = new SmoothFollowCamera(player);
scene.add(followCamera);

// Update in animation loop
function animate() {
    requestAnimationFrame(animate);
    
    followCamera.update();
    renderer.render(scene, followCamera);
}
```

### Camera Shake Effect

```javascript
class CameraShake {
    constructor(camera) {
        this.camera = camera;
        this.originalPosition = camera.position.clone();
        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.shakeDecay = 0.8;
    }
    
    shake(intensity = 0.1, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    update(deltaTime) {
        if (this.shakeDuration > 0) {
            // Calculate shake offset
            const shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            const shakeZ = (Math.random() - 0.5) * 2 * this.shakeIntensity;
            
            // Apply shake
            this.camera.position.x = this.originalPosition.x + shakeX;
            this.camera.position.y = this.originalPosition.y + shakeY;
            this.camera.position.z = this.originalPosition.z + shakeZ;
            
            // Decay shake
            this.shakeDuration -= deltaTime;
            this.shakeIntensity *= this.shakeDecay;
            
            // Reset when shake ends
            if (this.shakeDuration <= 0) {
                this.camera.position.copy(this.originalPosition);
                this.shakeIntensity = 0;
            }
        }
    }
}

// Usage
const cameraShake = new CameraShake(camera);

// Trigger shake on explosion
function onExplosion() {
    cameraShake.shake(0.5, 1.0);
}

// Update shake in animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    cameraShake.update(deltaTime);
    
    renderer.render(scene, camera);
}
```

### Mini-Map Camera

```javascript
class MiniMapCamera extends OrthographicCamera {
    constructor(target, size = 200) {
        super(-size, size, size, -size, 1, 1000);
        
        this.target = target;
        this.height = 100; // Top-down view height
        this.size = size;
        
        // Position camera directly above target
        this.position.copy(this.target.position);
        this.position.y += this.height;
        
        // Look straight down
        this.lookAt(this.target.position);
        
        // Only render specific layers
        this.layers.set(0); // Ground layer
    }
    
    update() {
        if (!this.target) return;
        
        // Follow target
        this.position.x = this.target.position.x;
        this.position.z = this.target.position.z;
        
        // Always look down
        this.lookAt(this.target.position.x, 0, this.target.position.z);
    }
    
    setSize(size) {
        this.size = size;
        this.left = -size;
        this.right = size;
        this.top = size;
        this.bottom = -size;
        this.updateProjectionMatrix();
    }
}

// Usage
const miniMapCamera = new MiniMapCamera(player, 100);
scene.add(miniMapCamera);

// Render mini-map on screen overlay
function render() {
    // Main view
    renderer.render(scene, mainCamera);
    
    // Mini-map (render to different viewport or texture)
    const canvas = renderer.domElement;
    const miniMapViewport = {
        x: canvas.width - 200,
        y: 20,
        width: 180,
        height: 180
    };
    
    renderer.setViewport(miniMapViewport.x, miniMapViewport.y, miniMapViewport.width, miniMapViewport.height);
    renderer.render(scene, miniMapCamera);
    renderer.setViewport(0, 0, canvas.width, canvas.height);
}
```

The Camera class provides the foundation for all viewing perspectives in Ninth.js, with specialized subclasses for different projection types and use cases.