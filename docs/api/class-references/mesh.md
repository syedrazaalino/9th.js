# Mesh Class Reference

The Mesh class represents a geometric object that can be rendered in 3D space. It combines geometry and material to create visual objects.

## Constructor

```javascript
const mesh = new Mesh(geometry, material);
```

**Parameters:**
- `geometry` (Geometry): The geometry that defines the mesh's shape
- `material` (Material): The material that defines the mesh's appearance

**Example:**
```javascript
import { Mesh, BoxGeometry, StandardMaterial } from 'ninthjs';

const geometry = new BoxGeometry(1, 1, 1);
const material = new StandardMaterial({ color: 0x00ff00 });
const cube = new Mesh(geometry, material);

scene.add(cube);
```

## Properties

### Core Properties

#### `geometry`

The geometry of the mesh.

**Type:** `Geometry`  
**Default:** Required parameter

**Example:**
```javascript
// Change geometry
cube.geometry = new SphereGeometry(0.5);
cube.geometry.needsUpdate = true;

// Access geometry properties
console.log('Vertex count:', cube.geometry.attributes.position.count);
console.log('Bounding box:', cube.geometry.boundingBox);
```

#### `material`

The material of the mesh.

**Type:** `Material`  
**Default:** Required parameter

**Example:**
```javascript
// Change material
cube.material = new PhongMaterial({ color: 0xff0000 });

// Access material properties
console.log('Material color:', cube.material.color);
console.log('Material type:', cube.material.type);

// Material animations
cube.material.color.setHex(0x00ff00); // Animate color
```

#### `skeleton`

The skeleton for skinned meshes.

**Type:** `Skeleton|null`  
**Default:** `null`

**Example:**
```javascript
if (mesh.skeleton) {
    console.log('Skinned mesh with', mesh.skeleton.bones.length, 'bones');
    
    // Update bone positions
    mesh.skeleton.pose();
}
```

#### `bones`

Array of bones for skinned meshes.

**Type:** `Array<Object3D>`  
**Default:** `[]`

**Example:**
```javascript
const skinnedMesh = new Mesh(skinnedGeometry, skinMaterial);
console.log('Bones:', skinnedMesh.bones.length);

skinnedMesh.bones.forEach((bone, index) => {
    console.log(`Bone ${index}:`, bone.name);
});
```

### Rendering Properties

#### `isMesh`

Identifies this object as a Mesh.

**Type:** `boolean`  
**Default:** `true`

**Example:**
```javascript
if (object.isMesh) {
    console.log('This is a mesh object');
}
```

#### `castShadow`

Whether this mesh casts shadows.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
// Enable shadow casting
cube.castShadow = true;

// Check if shadows are enabled globally
if (renderer.shadowMap.enabled) {
    cube.castShadow = true;
}

// Disable for performance
const simpleObject = new Mesh(geometry, material);
simpleObject.castShadow = false; // No shadow calculations
```

#### `receiveShadow`

Whether this mesh receives shadows.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
// Ground receives shadows
const ground = new Mesh(planeGeometry, groundMaterial);
ground.receiveShadow = true;

// Building receives shadows from other objects
const building = new Mesh(buildingGeometry, buildingMaterial);
building.receiveShadow = true;

// Disable for better performance on non-shadowed surfaces
const uiElement = new Mesh(planeGeometry, transparentMaterial);
uiElement.receiveShadow = false;
```

#### `frustumCulled`

Whether this mesh is frustum culled.

**Type:** `boolean`  
**Default:** `true`

**Example:**
```javascript
// Disable culling for always-visible objects
const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
skybox.frustumCulled = false;

// Disable for very large objects that might be partially culled
const mountain = new Mesh(mountainGeometry, mountainMaterial);
mountain.frustumCulled = false;

// Performance consideration
const manySmallObjects = [];
manySmallObjects.forEach(obj => {
    obj.frustumCulled = true; // Keep default for performance
});
```

#### `raycastable`

Whether this mesh can be raycasted.

**Type:** `boolean`  
**Default:** `true`

**Example:**
```javascript
// Disable raycasting for performance on non-interactive objects
const backgroundObjects = new Mesh(backgroundGeometry, backgroundMaterial);
backgroundObjects.raycastable = false;

// Enable for interactive objects
const clickableObjects = new Mesh(interactiveGeometry, interactiveMaterial);
clickableObjects.raycastable = true;
```

### Animation Properties

#### `morphTargetInfluences`

Array of influences for morph targets.

**Type:** `Array<number>`  
**Default:** `[]`

**Example:**
```javascript
console.log('Morph targets:', mesh.morphTargetInfluences.length);

// Animate morph target
mesh.morphTargetInfluences[0] = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;

// Multiple morph targets
for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
    mesh.morphTargetInfluences[i] = Math.random(); // Random morph
}
```

#### `morphTargetDictionary`

Dictionary mapping morph target names to indices.

**Type:** `Object`  
**Default:** `{}`

**Example:**
```javascript
console.log('Morph targets available:', Object.keys(mesh.morphTargetDictionary));

// Access morph target by name
const smileIndex = mesh.morphTargetDictionary['smile'];
if (smileIndex !== undefined) {
    mesh.morphTargetInfluences[smileIndex] = 1.0;
}
```

#### `morphTargets`

Array of morph targets.

**Type:** `Array<Object>`  
**Default:** `[]`

**Example:**
```javascript
console.log('Morph targets count:', mesh.morphTargets.length);

// Each morph target contains relative positions, normals, etc.
mesh.morphTargets.forEach((target, index) => {
    console.log(`Morph target ${index}:`, target.name);
});
```

### Interaction Properties

#### `userData`

User-defined data attached to this mesh.

**Type:** `Object`  
**Default:** `{}`

**Example:**
```javascript
// Store custom data
mesh.userData = {
    health: 100,
    damage: 10,
    collectible: true,
    customId: 'enemy_001'
};

// Access user data
console.log('Health:', mesh.userData.health);
mesh.userData.health -= 10;

// Store complex data
mesh.userData.interactions = {
    onClick: () => console.log('Clicked!'),
    onHover: () => console.log('Hovered!'),
    metadata: {
        spawnTime: Date.now(),
        lastInteraction: null
    }
};
```

## Methods

### Geometry Operations

#### `updateGeometry()`

Update the mesh's geometry.

**Example:**
```javascript
// After modifying geometry attributes
mesh.geometry.attributes.position.needsUpdate = true;
mesh.updateGeometry();

// Call after geometry modifications
if (mesh.geometry.boundingSphere === null) {
    mesh.geometry.computeBoundingSphere();
    mesh.updateGeometry();
}
```

#### `computeBoundingBox()`

Compute and update the bounding box.

**Example:**
```javascript
mesh.computeBoundingBox();
console.log('Bounding box:', mesh.geometry.boundingBox);
```

#### `computeBoundingSphere()`

Compute and update the bounding sphere.

**Example:**
```javascript
mesh.computeBoundingSphere();
console.log('Bounding sphere:', mesh.geometry.boundingSphere);

// Useful for culling and intersection tests
const distance = camera.position.distanceTo(mesh.position);
if (distance > mesh.geometry.boundingSphere.radius * 2) {
    mesh.visible = false; // Too far to see
}
```

### Material Operations

#### `cloneMaterial()`

Clone the mesh's material for independent material instance.

**Returns:** `Material` - Cloned material

**Example:**
```javascript
// Create independent material instance
const materialClone = mesh.cloneMaterial();
materialClone.color.setHex(0x0000ff); // Only affects this mesh
mesh.material = materialClone;

// Useful for per-mesh material customization
```

#### `updateMaterial()`

Update the mesh's material.

**Example:**
```javascript
// After material property changes
mesh.material.color.setHex(0xff0000);
mesh.material.needsUpdate = true;
mesh.updateMaterial();
```

### Animation Methods

#### `animateMorph(targetName, value, duration)`

Animate a morph target to a specific value.

**Parameters:**
- `targetName` (string): Name of the morph target
- `value` (number): Target value (0-1)
- `duration` (number): Animation duration in milliseconds

**Example:**
```javascript
// Animate facial expression
mesh.animateMorph('smile', 1.0, 1000); // Smile over 1 second

mesh.animateMorph('blink', 0.0, 200); // Blink quickly

// Complex animation sequence
function animateExpression(expression) {
    const targets = {
        smile: expression === 'happy' ? 1.0 : 0.0,
        sad: expression === 'sad' ? 1.0 : 0.0,
        angry: expression === 'angry' ? 1.0 : 0.0
    };
    
    Object.keys(targets).forEach(name => {
        if (mesh.morphTargetDictionary[name] !== undefined) {
            mesh.animateMorph(name, targets[name], 500);
        }
    });
}
```

#### `poseSkeleton()`

Pose the mesh's skeleton.

**Example:**
```javascript
if (mesh.skeleton) {
    mesh.poseSkeleton();
    
    // Update bone transformations
    mesh.skeleton.calculateInverses();
}
```

### Interaction Methods

#### `intersectsRay(ray)`

Check if the mesh intersects with a ray.

**Parameters:**
- `ray` (Ray): Ray to test against

**Returns:** `boolean` - True if the ray intersects the mesh

**Example:**
```javascript
const ray = new Ray(camera.position, direction);
if (mesh.intersectsRay(ray)) {
    console.log('Ray hit the mesh!');
}
```

#### `intersectsBox(box)`

Check if the mesh intersects with a bounding box.

**Parameters:**
- `box` (Box3): Bounding box to test against

**Returns:** `boolean` - True if the mesh intersects the box

**Example:**
```javascript
const testBox = new Box3(
    new Vector3(-5, -5, -5),
    new Vector3(5, 5, 5)
);

if (mesh.intersectsBox(testBox)) {
    console.log('Mesh intersects test box');
}
```

#### `intersectsSphere(sphere)`

Check if the mesh intersects with a bounding sphere.

**Parameters:**
- `sphere` (Sphere): Bounding sphere to test against

**Returns:** `boolean` - True if the mesh intersects the sphere

**Example:**
```javascript
const testSphere = new Sphere(mesh.position, 10);
if (mesh.intersectsSphere(testSphere)) {
    console.log('Mesh intersects test sphere');
}
```

### Utility Methods

#### `toJSON(meta)`

Convert mesh to JSON format.

**Parameters:**
- `meta` (Object): Metadata object

**Returns:** `Object` - JSON representation

**Example:**
```javascript
const json = mesh.toJSON();
console.log(JSON.stringify(json, null, 2));
```

#### `copy(source)`

Copy another mesh.

**Parameters:**
- `source` (Mesh): Mesh to copy from

**Returns:** `Mesh` - This mesh

**Example:**
```javascript
const sourceMesh = new Mesh(sourceGeometry, sourceMaterial);
sourceMesh.position.set(10, 0, 0);

const targetMesh = new Mesh(targetGeometry, targetMaterial);
targetMesh.copy(sourceMesh);

console.log('Positions match:', targetMesh.position.equals(sourceMesh.position));
```

#### `clone(recursive)`

Clone this mesh.

**Parameters:**
- `recursive` (boolean): Whether to clone children (default: true)

**Returns:** `Mesh` - Cloned mesh

**Example:**
```javascript
const clonedMesh = mesh.clone(true);
scene.add(clonedMesh);

console.log('Original and clone have different IDs:', 
    mesh.id !== clonedMesh.id);
```

## Events

The Mesh class inherits from Object3D and adds mesh-specific events:

### `material-changed`

Emitted when the mesh's material changes.

**Event Data:**
- `mesh` (Mesh): The mesh whose material changed
- `oldMaterial` (Material): The previous material
- `newMaterial` (Material): The new material

**Example:**
```javascript
mesh.on('material-changed', (event) => {
    console.log('Material changed from', event.oldMaterial.type, 'to', event.newMaterial.type);
});
```

### `geometry-changed`

Emitted when the mesh's geometry changes.

**Event Data:**
- `mesh` (Mesh): The mesh whose geometry changed
- `oldGeometry` (Geometry): The previous geometry
- `newGeometry` (Geometry): The new geometry

**Example:**
```javascript
mesh.on('geometry-changed', (event) => {
    console.log('Geometry changed');
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
});
```

### `morph-target-changed`

Emitted when morph target influences change.

**Event Data:**
- `mesh` (Mesh): The mesh
- `influences` (Array): Array of influence values

**Example:**
```javascript
mesh.on('morph-target-changed', (event) => {
    console.log('Morph influences updated:', event.influences);
});
```

## Usage Examples

### Basic Mesh Creation

```javascript
import { Mesh, BoxGeometry, StandardMaterial } from 'ninthjs';

// Create a simple cube
const geometry = new BoxGeometry(1, 1, 1);
const material = new StandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5
});

const cube = new Mesh(geometry, material);
cube.position.set(0, 0, 0);
cube.castShadow = true;
cube.receiveShadow = true;

scene.add(cube);
```

### Animated Mesh

```javascript
// Create an animated mesh
const geometry = new BoxGeometry(2, 2, 2);
const material = new StandardMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 1.0
});

const cube = new Mesh(geometry, material);
scene.add(cube);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    // Scale animation
    const scale = 1 + Math.sin(Date.now() * 0.001) * 0.2;
    cube.scale.set(scale, scale, scale);
    
    // Color animation
    const hue = (Date.now() * 0.1) % 360;
    material.color.setHSL(hue / 360, 0.8, 0.5);
    
    renderer.render(scene, camera);
}
```

### Interactive Mesh

```javascript
// Create an interactive mesh
const geometry = new SphereGeometry(1, 32, 16);
const material = new StandardMaterial({
    color: 0x0000ff,
    emissive: 0x000000
});

const sphere = new Mesh(geometry, material);
sphere.name = 'interactive_sphere';
sphere.userData = {
    clickable: true,
    highlightColor: 0x00ffff,
    originalColor: 0x0000ff
};

scene.add(sphere);

// Raycaster for interaction
const raycaster = new Raycaster();
const mouse = new Vector2();

// Mouse move event
canvas.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sphere]);
    
    if (intersects.length > 0 && sphere.userData.clickable) {
        // Highlight on hover
        sphere.material.emissive.setHex(sphere.userData.highlightColor);
        canvas.style.cursor = 'pointer';
    } else {
        // Remove highlight
        sphere.material.emissive.setHex(sphere.userData.originalColor);
        canvas.style.cursor = 'default';
    }
});

// Click event
canvas.addEventListener('click', (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sphere]);
    
    if (intersects.length > 0) {
        // Handle click
        console.log('Sphere clicked!');
        
        // Add click animation
        sphere.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
            sphere.scale.set(1, 1, 1);
        }, 200);
        
        // Emit custom event
        sphere.emit('clicked', { mesh: sphere, ray: intersects[0].ray });
    }
});
```

### Instanced Mesh

```javascript
// Create many instances of the same mesh
const geometry = new BoxGeometry(0.5, 0.5, 0.5);
const material = new StandardMaterial({ color: 0x00ff00 });

// Create instanced mesh
const count = 1000;
const instancedMesh = new InstancedMesh(geometry, material, count);

// Set up instance matrices
const dummy = new Object3D();
for (let i = 0; i < count; i++) {
    // Random position
    dummy.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 10,
        (Math.random() - 0.5) * 100
    );
    
    // Random rotation
    dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    
    // Random scale
    const scale = Math.random() * 2 + 0.5;
    dummy.scale.set(scale, scale, scale);
    
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
}

// Set instance colors
const colors = [];
for (let i = 0; i < count; i++) {
    colors[i] = new Color(Math.random(), Math.random(), Math.random());
}
instancedMesh.setColorAt(0, colors);

scene.add(instancedMesh);

// Animate instances
function animateInstances() {
    const dummy = new Object3D();
    
    for (let i = 0; i < count; i++) {
        instancedMesh.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        // Animate position
        dummy.position.y += 0.01;
        if (dummy.position.y > 20) {
            dummy.position.y = 0;
        }
        
        // Animate rotation
        dummy.rotation.x += 0.01;
        dummy.rotation.y += 0.01;
        
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
}
```

### Morph Target Animation

```javascript
// Create geometry with morph targets
const geometry = new BoxGeometry(2, 2, 2, 10, 10, 10);

// Create morph targets
const morphAttributes = {
    position: [],
    normal: []
};

// Morph target 1: Stretch in X direction
const stretchX = geometry.clone();
stretchX.scale.x = 2;
const stretchPositions = stretchX.attributes.position.array;
morphAttributes.position.push(stretchPositions);

// Morph target 2: Twist
const twist = geometry.clone();
const twistPositions = twist.attributes.position.array;
for (let i = 0; i < twistPositions.length; i += 3) {
    const y = twistPositions[i + 1];
    const angle = y * 0.5;
    const x = twistPositions[i];
    const z = twistPositions[i + 2];
    
    // Apply twist rotation
    twistPositions[i] = x * Math.cos(angle) - z * Math.sin(angle);
    twistPositions[i + 2] = x * Math.sin(angle) + z * Math.cos(angle);
}
morphAttributes.position.push(twistPositions);

// Apply morph targets to geometry
geometry.morphAttributes = morphAttributes;
geometry.morphTargets = [
    { name: 'stretch_x' },
    { name: 'twist' }
];

const material = new StandardMaterial({
    color: 0x00ff00,
    morphTargets: true
});

const morphMesh = new Mesh(geometry, material);
scene.add(morphMesh);

// Animate morph targets
function animateMorph() {
    const time = Date.now() * 0.001;
    
    // Animate stretch
    morphMesh.morphTargetInfluences[0] = Math.sin(time * 2) * 0.5 + 0.5;
    
    // Animate twist
    morphMesh.morphTargetInfluences[1] = Math.cos(time * 1.5) * 0.3 + 0.3;
    
    // Or animate both simultaneously
    morphMesh.morphTargetInfluences[0] = (Math.sin(time) + 1) * 0.5;
    morphMesh.morphTargetInfluences[1] = (Math.cos(time * 1.3) + 1) * 0.5;
}
```

### Skinned Mesh

```javascript
// Create skinned mesh with bones
const geometry = new CylinderGeometry(0.1, 0.5, 4, 8);
const boneCount = 5;
const bones = [];

for (let i = 0; i < boneCount; i++) {
    const bone = new Object3D();
    bone.position.y = (i - (boneCount - 1) / 2) * 2;
    bones.push(bone);
}

// Create bone hierarchy
for (let i = 0; i < boneCount; i++) {
    const bone = bones[i];
    if (i > 0) {
        bone.parent = bones[i - 1];
    }
    geometry.bones.push(bone);
}

// Create skeleton
const skeleton = new Skeleton(bones);

// Apply skin indices and weights
geometry.skinIndices = new Uint16Array(geometry.attributes.position.count * 4);
geometry.skinWeights = new Float32Array(geometry.attributes.position.count * 4);

// Skin the geometry
for (let i = 0; i < geometry.attributes.position.count; i++) {
    const skinIndex = i * 4;
    const skinWeight = i * 4;
    
    // Assign skin indices and weights
    geometry.skinIndices[skinIndex] = Math.floor(i / (geometry.attributes.position.count / boneCount));
    geometry.skinWeights[skinWeight] = 1.0;
    
    for (let j = 1; j < 4; j++) {
        geometry.skinIndices[skinIndex + j] = 0;
        geometry.skinWeights[skinWeight + j] = 0;
    }
}

const material = new StandardMaterial({
    color: 0x00ff00,
    skinning: true
});

const skinnedMesh = new Mesh(geometry, material);
skinnedMesh.add(bones[0]);
skinnedMesh.skeleton = skeleton;

scene.add(skinnedMesh);

// Animate skeleton
function animateSkeleton(time) {
    for (let i = 1; i < bones.length; i++) {
        bones[i].rotation.z = Math.sin(time * 2 + i) * 0.3;
    }
    
    skinnedMesh.skeleton.pose();
}
```

### Performance Optimization

```javascript
// Optimize mesh for different use cases
class OptimizedMesh extends Mesh {
    constructor(geometry, material, options = {}) {
        super(geometry, material);
        
        this.optimizationLevel = options.level || 'medium';
        this.applyOptimizations();
    }
    
    applyOptimizations() {
        switch (this.optimizationLevel) {
            case 'high':
                // Maximum performance
                this.castShadow = false;
                this.receiveShadow = false;
                this.frustumCulled = true;
                this.raycastable = false;
                
                // Use simpler material if possible
                if (this.material instanceof StandardMaterial) {
                    this.material.metalness = 0;
                    this.material.roughness = 1;
                }
                break;
                
            case 'medium':
                // Balanced performance
                this.castShadow = true;
                this.receiveShadow = true;
                this.frustumCulled = true;
                this.raycastable = true;
                break;
                
            case 'low':
                // Quality over performance
                this.castShadow = true;
                this.receiveShadow = true;
                this.frustumCulled = false; // Always visible
                this.raycastable = true;
                break;
        }
    }
    
    // Batch update for multiple meshes
    static batchUpdate(meshes) {
        const matrices = [];
        const geometries = new Set();
        
        meshes.forEach(mesh => {
            mesh.updateMatrix();
            matrices.push(mesh.matrix.clone());
            geometries.add(mesh.geometry);
        });
        
        // Update frustum culling
        const camera = renderer.getActiveCamera();
        meshes.forEach(mesh => {
            if (mesh.frustumCulled) {
                mesh.visible = camera.frustum.intersectsObject(mesh);
            }
        });
        
        return { matrices, geometries };
    }
}

// Usage
const optimizedCubes = [];
for (let i = 0; i < 1000; i++) {
    const cube = new OptimizedMesh(
        boxGeometry,
        new StandardMaterial({ color: 0x00ff00 }),
        { level: 'high' } // High performance
    );
    
    cube.position.set(
        (i % 10) * 2,
        Math.floor(i / 10) * 2,
        Math.floor(i / 100) * 2
    );
    
    scene.add(cube);
    optimizedCubes.push(cube);
}

// Batch update performance critical meshes
function updateMeshes() {
    OptimizedMesh.batchUpdate(optimizedCubes);
}
```

The Mesh class provides comprehensive functionality for creating and managing 3D objects in Ninth.js, with support for various material types, animations, and performance optimizations.