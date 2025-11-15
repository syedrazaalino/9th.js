# BufferGeometry Class Reference

BufferGeometry is a highly optimized geometry class that uses WebGL buffers for efficient rendering. It stores geometry data in typed arrays for optimal performance and is the recommended geometry class for most use cases.

## Constructor

```javascript
const geometry = new BufferGeometry();
```

**Parameters:** None - The BufferGeometry constructor takes no parameters.

**Example:**
```javascript
import { BufferGeometry, BufferAttribute } from 'ninthjs';

const geometry = new BufferGeometry();

// Create vertex data
const vertices = new Float32Array([
    0, 0, 0,  // Vertex 1
    1, 0, 0,  // Vertex 2
    0, 1, 0   // Vertex 3
]);

// Create index data
const indices = new Uint16Array([0, 1, 2]);

// Add attributes
geometry.setAttribute('position', new BufferAttribute(vertices, 3));
geometry.setIndex(new BufferAttribute(indices, 1));

// Compute normals and bounds
geometry.computeVertexNormals();
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
```

## Properties

### Attribute Properties

#### `attributes`

Collection of all geometry attributes.

**Type:** `Object`  
**Default:** `{}`

**Example:**
```javascript
// Access attributes
console.log('Position attribute:', geometry.attributes.position);
console.log('Normal attribute:', geometry.attributes.normal);
console.log('UV attribute:', geometry.attributes.uv);

// Check if attribute exists
if (geometry.attributes.position) {
    console.log('Vertices:', geometry.attributes.position.count);
}
```

#### `index`

The index attribute for indexed geometry.

**Type:** `BufferAttribute|null`  
**Default:** `null`

**Example:**
```javascript
// Check if geometry is indexed
if (geometry.index) {
    console.log('Index count:', geometry.index.count);
    console.log('Index array:', geometry.index.array);
} else {
    console.log('Geometry is non-indexed');
}
```

#### `position`

Convenience property for the position attribute.

**Type:** `BufferAttribute|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.position) {
    const vertexCount = geometry.position.count;
    console.log('Vertex count:', vertexCount);
    
    // Access vertex data
    const x = geometry.position.getX(0);
    const y = geometry.position.getY(0);
    const z = geometry.position.getZ(0);
    
    console.log('First vertex:', x, y, z);
}
```

#### `normal`

Convenience property for the normal attribute.

**Type:** `BufferAttribute|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.normal) {
    console.log('Has normal data');
    
    // Get normal at vertex
    const normal = new Vector3();
    geometry.normal.getX(0, normal.x);
    geometry.normal.getY(0, normal.y);
    geometry.normal.getZ(0, normal.z);
}
```

#### `uv`

Convenience property for the UV coordinate attribute.

**Type:** `BufferAttribute|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.uv) {
    console.log('Has UV coordinates');
    
    // Get UV at vertex
    const u = geometry.uv.getX(0);
    const v = geometry.uv.getY(0);
    
    console.log('UV at vertex 0:', u, v);
}
```

#### `color`

Convenience property for the color attribute.

**Type:** `BufferAttribute|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.color) {
    console.log('Has vertex colors');
    
    // Get color at vertex
    const r = geometry.color.getX(0);
    const g = geometry.color.getY(0);
    const b = geometry.color.getZ(0);
    
    console.log('Color at vertex 0:', r, g, b);
}
```

### Geometric Properties

#### `morphAttributes`

Collection of morph target attributes.

**Type:** `Object`  
**Default:** `{}`

**Example:**
```javascript
// Add morph target
const morphPositions = new Float32Array([
    0, 0, 0.1,  // Morphed vertex 1
    0, 0, 0.1,  // Morphed vertex 2
    0, 0, 0.1   // Morphed vertex 3
]);

geometry.morphAttributes = geometry.morphAttributes || {};
geometry.morphAttributes.position = [
    new BufferAttribute(morphPositions, 3)
];

// Access morph targets
console.log('Morph targets:', Object.keys(geometry.morphAttributes));
```

#### `morphTargetsRelative`

Whether morph targets are relative to the base geometry.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
// Set morph targets to be relative
geometry.morphTargetsRelative = true;

// Now morph targets represent offsets from base positions
```

#### `groups`

Array of groups for multi-material geometry.

**Type:** `Array<Object>`  
**Default:** `[]`

**Example:**
```javascript
// Add a group for different material
geometry.addGroup(0, 6, 0); // start, count, materialIndex

// Access groups
geometry.groups.forEach((group, index) => {
    console.log(`Group ${index}:`, {
        start: group.start,
        count: group.count,
        materialIndex: group.materialIndex
    });
});
```

### Bounding Properties

#### `boundingBox`

The geometry's axis-aligned bounding box.

**Type:** `Box3|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.boundingBox) {
    console.log('Bounding box:', {
        min: geometry.boundingBox.min,
        max: geometry.boundingBox.max
    });
}
```

#### `boundingSphere`

The geometry's bounding sphere.

**Type:** `Sphere|null`  
**Default:** `null`

**Example:**
```javascript
if (geometry.boundingSphere) {
    console.log('Bounding sphere:', {
        center: geometry.boundingSphere.center,
        radius: geometry.boundingSphere.radius
    });
}
```

### Draw Properties

#### `drawRange`

The range of geometry to draw.

**Type:** `Object`  
**Default:** `{ start: 0, count: Infinity }`

**Example:**
```javascript
// Draw only first 100 triangles
geometry.drawRange.start = 0;
geometry.drawRange.count = 100;

// Gradually reveal geometry
function revealGeometry(progress) {
    geometry.drawRange.start = 0;
    geometry.drawRange.count = Math.floor(
        (geometry.index ? geometry.index.count : geometry.attributes.position.count) * progress
    );
}
```

#### `maxInstancedCount`

Maximum number of instances for InstancedMesh.

**Type:** `number`  
**Default:** `Infinity`

**Example:**
```javascript
// Limit instances for InstancedMesh
geometry.maxInstancedCount = 1000;
```

### Metadata Properties

#### `id`

Unique identifier for the geometry.

**Type:** `number`  
**Default:** Auto-generated unique ID

**Example:**
```javascript
console.log('Geometry ID:', geometry.id);
```

#### `uuid`

Universally unique identifier.

**Type:** `string`  
**Default:** Auto-generated UUID

**Example:**
```javascript
console.log('Geometry UUID:', geometry.uuid);
```

## Methods

### Attribute Management

#### `setAttribute(name, attribute)`

Set an attribute on the geometry.

**Parameters:**
- `name` (string): Attribute name
- `attribute` (BufferAttribute): Attribute to set

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Create position attribute
const positions = new Float32Array([
    -1, -1, 0,
     1, -1, 0,
     0,  1, 0
]);
geometry.setAttribute('position', new BufferAttribute(positions, 3));

// Create normal attribute
const normals = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1
]);
geometry.setAttribute('normal', new BufferAttribute(normals, 3));

// Create UV attribute
const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.5, 1
]);
geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
```

#### `getAttribute(name)`

Get an attribute from the geometry.

**Parameters:**
- `name` (string): Attribute name

**Returns:** `BufferAttribute|null` - The attribute

**Example:**
```javascript
const positionAttribute = geometry.getAttribute('position');
if (positionAttribute) {
    console.log('Position attribute found:', positionAttribute.count, 'vertices');
}
```

#### `deleteAttribute(name)`

Delete an attribute from the geometry.

**Parameters:**
- `name` (string): Attribute name

**Returns:** `BufferAttribute|null` - The deleted attribute

**Example:**
```javascript
// Delete normal attribute if not needed
const deleted = geometry.deleteAttribute('normal');
if (deleted) {
    console.log('Normal attribute deleted');
}
```

#### `setIndex(attribute)`

Set the index attribute for indexed geometry.

**Parameters:**
- `attribute` (BufferAttribute|null): Index attribute

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Create index for triangle
const indices = new Uint16Array([0, 1, 2]);
geometry.setIndex(new BufferAttribute(indices, 1));

// Remove index to make non-indexed geometry
geometry.setIndex(null);
```

#### `getIndex()`

Get the index attribute.

**Returns:** `BufferAttribute|null` - The index attribute

**Example:**
```javascript
const index = geometry.getIndex();
if (index) {
    console.log('Index count:', index.count);
}
```

### Group Management

#### `addGroup(start, count, materialIndex)`

Add a group for multi-material rendering.

**Parameters:**
- `start` (number): Start index for the group
- `count` (number): Number of elements in the group
- `materialIndex` (number): Material index for this group

**Example:**
```javascript
// Add group for first triangle
geometry.addGroup(0, 3, 0);

// Add group for second triangle
geometry.addGroup(3, 3, 1);

// Multiple materials example
const material1 = new StandardMaterial({ color: 0xff0000 });
const material2 = new StandardMaterial({ color: 0x00ff00 });
const mesh = new Mesh(geometry, [material1, material2]);
```

#### `clearGroups()`

Clear all groups from the geometry.

**Example:**
```javascript
geometry.clearGroups();
console.log('Groups cleared');
```

### Compute Methods

#### `computeVertexNormals()`

Compute vertex normals for the geometry.

**Example:**
```javascript
// Compute normals after creating geometry
geometry.computeVertexNormals();

console.log('Normals computed');
```

#### `computeBoundingBox()`

Compute the bounding box for the geometry.

**Example:**
```javascript
geometry.computeBoundingBox();
console.log('Bounding box:', geometry.boundingBox);

// Use bounding box for frustum culling
```

#### `computeBoundingSphere()`

Compute the bounding sphere for the geometry.

**Example:**
```javascript
geometry.computeBoundingSphere();
console.log('Bounding sphere radius:', geometry.boundingSphere.radius);

// Use bounding sphere for collision detection
```

#### `computeBoundingBoxes()`

Compute bounding boxes for each group.

**Example:**
```javascript
geometry.computeBoundingBoxes();
console.log('Bounding boxes per group:', geometry.boundingBoxes);
```

#### `computeBoundingSpheres()`

Compute bounding spheres for each group.

**Example:**
```javascript
geometry.computeBoundingSpheres();
console.log('Bounding spheres per group:', geometry.boundingSpheres);
```

### Transform Methods

#### `applyMatrix4(matrix)`

Apply a 4x4 transformation matrix to the geometry.

**Parameters:**
- `matrix` (Matrix4): Transformation matrix

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Create transformation matrix
const matrix = new Matrix4();
matrix.makeRotationY(Math.PI / 4); // Rotate 45 degrees around Y

// Apply transformation
geometry.applyMatrix4(matrix);

console.log('Geometry transformed');
```

#### `applyMatrix3(matrix)`

Apply a 3x3 transformation matrix to the geometry.

**Parameters:**
- `matrix` (Matrix3): Transformation matrix

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Create 3x3 transformation matrix
const matrix3 = new Matrix3();
matrix3.set(
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
);

geometry.applyMatrix3(matrix3);
```

#### `transformDirection(matrix)`

Transform the direction of normals using a matrix.

**Parameters:**
- `matrix` (Matrix4): Transformation matrix

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Apply rotation to normals only
const rotationMatrix = new Matrix4();
rotationMatrix.makeRotationY(Math.PI / 2);

geometry.transformDirection(rotationMatrix);
```

### Geometry Operations

#### `translate(x, y, z)`

Translate the geometry by the given offset.

**Parameters:**
- `x` (number): X offset
- `y` (number): Y offset  
- `z` (number): Z offset

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Move geometry to origin
geometry.translate(-0.5, -0.5, -0.5);

// Center geometry
const box = new Box3().setFromBufferAttribute(geometry.attributes.position);
const center = box.getCenter(new Vector3());
geometry.translate(-center.x, -center.y, -center.z);
```

#### `scale(x, y, z)`

Scale the geometry by the given factors.

**Parameters:**
- `x` (number): X scale factor
- `y` (number): Y scale factor
- `z` (number): Z scale factor

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Double the size
geometry.scale(2, 2, 2);

// Non-uniform scaling
geometry.scale(1, 2, 1); // Stretch in Y direction
```

#### `rotateX(angle)`

Rotate the geometry around the X axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Rotate 90 degrees around X axis
geometry.rotateX(Math.PI / 2);
```

#### `rotateY(angle)`

Rotate the geometry around the Y axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Rotate 45 degrees around Y axis
geometry.rotateY(Math.PI / 4);
```

#### `rotateZ(angle)`

Rotate the geometry around the Z axis.

**Parameters:**
- `angle` (number): Rotation angle in radians

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Rotate 180 degrees around Z axis
geometry.rotateZ(Math.PI);
```

### Morph Target Methods

#### `morphAttributes`

Get or set morph target attributes.

**Example:**
```javascript
// Add morph target
const morphGeometry = new SphereGeometry(1, 32, 16);
const originalPositions = morphGeometry.attributes.position.array;

// Create morphed positions
const morphPositions = originalPositions.slice();
for (let i = 1; i < morphPositions.length; i += 3) {
    morphPositions[i] += 0.5; // Push up in Y direction
}

// Add morph attribute
morphGeometry.morphAttributes.position = [
    new BufferAttribute(morphPositions, 3)
];

// Usage in Mesh
const material = new StandardMaterial({
    color: 0x00ff00,
    morphTargets: true
});

const morphMesh = new Mesh(morphGeometry, material);

// Animate morph target
function animateMorph() {
    morphMesh.morphTargetInfluences[0] = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
}
```

### Optimization Methods

#### `merge(geometry)`

Merge another geometry into this one.

**Parameters:**
- `geometry` (BufferGeometry): Geometry to merge

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
// Merge two geometries
const geometry1 = new BoxGeometry(1, 1, 1);
const geometry2 = new SphereGeometry(0.5, 16, 8);

geometry1.merge(geometry2);
console.log('Geometries merged');
```

#### `center()`

Center the geometry around the origin.

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
geometry.center();
console.log('Geometry centered');
```

#### `normalizeNormals()`

Normalize all normals to unit length.

**Example:**
```javascript
geometry.normalizeNormals();
console.log('Normals normalized');
```

### Utility Methods

#### `toNonIndexed()`

Convert indexed geometry to non-indexed geometry.

**Returns:** `BufferGeometry` - New non-indexed geometry

**Example:**
```javascript
const nonIndexedGeometry = geometry.toNonIndexed();
console.log('Converted to non-indexed');
```

#### `toIndexed()`

Convert non-indexed geometry to indexed geometry.

**Returns:** `BufferGeometry` - New indexed geometry

**Example:**
```javascript
const indexedGeometry = geometry.toIndexed();
console.log('Converted to indexed');
```

#### `copy(source)`

Copy another geometry.

**Parameters:**
- `source` (BufferGeometry): Geometry to copy from

**Returns:** `BufferGeometry` - This geometry

**Example:**
```javascript
const sourceGeometry = new SphereGeometry(1, 32, 16);
const copyGeometry = new BufferGeometry();
copyGeometry.copy(sourceGeometry);
```

#### `clone()`

Clone this geometry.

**Returns:** `BufferGeometry` - Cloned geometry

**Example:**
```javascript
const clonedGeometry = geometry.clone();
scene.add(new Mesh(clonedGeometry, material));
```

#### `toJSON(meta)`

Convert geometry to JSON format.

**Parameters:**
- `meta` (Object): Metadata object

**Returns:** `Object` - JSON representation

**Example:**
```javascript
const json = geometry.toJSON();
console.log(JSON.stringify(json, null, 2));
```

### GPU Buffer Methods

#### `getIndexBuffer()`

Get the WebGL index buffer.

**Returns:** `WebGLBuffer|null` - The index buffer

**Example:**
```javascript
const indexBuffer = geometry.getIndexBuffer();
if (indexBuffer) {
    console.log('Index buffer available');
}
```

#### `getAttributeBuffer(name)`

Get the WebGL buffer for an attribute.

**Parameters:**
- `name` (string): Attribute name

**Returns:** `WebGLBuffer|null` - The attribute buffer

**Example:**
```javascript
const positionBuffer = geometry.getAttributeBuffer('position');
if (positionBuffer) {
    console.log('Position buffer available');
}
```

## Usage Examples

### Creating a Custom BufferGeometry

```javascript
// Create a pyramid geometry
const geometry = new BufferGeometry();

// Define vertices (5 vertices for pyramid)
const vertices = new Float32Array([
    // Base square
    -1, 0, -1,   // Vertex 0
     1, 0, -1,   // Vertex 1
     1, 0,  1,   // Vertex 2
    -1, 0,  1,   // Vertex 3
    // Apex
     0, 2,  0    // Vertex 4
]);

// Define triangles
const indices = new Uint16Array([
    // Base (two triangles)
    0, 1, 2,
    0, 2, 3,
    
    // Sides
    0, 4, 1,
    1, 4, 2,
    2, 4, 3,
    3, 4, 0
]);

// Create attributes
const positionAttribute = new BufferAttribute(vertices, 3);
const indexAttribute = new BufferAttribute(indices, 1);

// Set attributes
geometry.setAttribute('position', positionAttribute);
geometry.setIndex(indexAttribute);

// Compute normals and bounds
geometry.computeVertexNormals();
geometry.computeBoundingBox();
geometry.computeBoundingSphere();

// Create mesh
const material = new StandardMaterial({ color: 0x00ff00 });
const pyramid = new Mesh(geometry, material);

scene.add(pyramid);
```

### Dynamic Geometry Updates

```javascript
// Create animated plane
const geometry = new BufferGeometry();

const width = 10;
const height = 10;
const widthSegments = 50;
const heightSegments = 50;

const vertices = new Float32Array((widthSegments + 1) * (heightSegments + 1) * 3);
const uvs = new Float32Array((widthSegments + 1) * (heightSegments + 1) * 2);

// Create grid
let vertexIndex = 0;
let uvIndex = 0;

for (let y = 0; y <= heightSegments; y++) {
    for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const v = y / heightSegments;
        
        vertices[vertexIndex] = (u - 0.5) * width;
        vertices[vertexIndex + 1] = 0; // Will be animated
        vertices[vertexIndex + 2] = (v - 0.5) * height;
        
        uvs[uvIndex] = u;
        uvs[uvIndex + 1] = v;
        
        vertexIndex += 3;
        uvIndex += 2;
    }
}

// Create indices
const indices = [];
for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
        const a = x + (widthSegments + 1) * y;
        const b = x + (widthSegments + 1) * (y + 1);
        const c = (x + 1) + (widthSegments + 1) * (y + 1);
        const d = (x + 1) + (widthSegments + 1) * y;
        
        // First triangle
        indices.push(a, b, d);
        // Second triangle
        indices.push(b, c, d);
    }
}

// Set attributes
geometry.setAttribute('position', new BufferAttribute(vertices, 3));
geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1));

// Animation function
function updateWaveGeometry(time) {
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        
        // Wave function
        const height = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 0.5;
        positionAttribute.setY(i, height);
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
}

// Animate
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    updateWaveGeometry(time);
    
    renderer.render(scene, camera);
}
```

### Instanced BufferGeometry

```javascript
// Create base geometry for instances
const baseGeometry = new BufferGeometry();

// Simple cube geometry
const vertices = new Float32Array([
    // Front face
    -1, -1,  1,
     1, -1,  1,
     1,  1,  1,
    -1,  1,  1,
    
    // Back face
    -1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
     1, -1, -1,
    
    // Top face
    -1,  1, -1,
    -1,  1,  1,
     1,  1,  1,
     1,  1, -1,
    
    // Bottom face
    -1, -1, -1,
     1, -1, -1,
     1, -1,  1,
    -1, -1,  1,
    
    // Right face
     1, -1, -1,
     1,  1, -1,
     1,  1,  1,
     1, -1,  1,
    
    // Left face
    -1, -1, -1,
    -1, -1,  1,
    -1,  1,  1,
    -1,  1, -1
]);

const indices = new Uint16Array([
    0,  1,  2,    0,  2,  3,    // front
    4,  5,  6,    4,  6,  7,    // back
    8,  9,  10,   8,  10, 11,   // top
    12, 13, 14,   12, 14, 15,   // bottom
    16, 17, 18,   16, 18, 19,   // right
    20, 21, 22,   20, 22, 23    // left
]);

baseGeometry.setAttribute('position', new BufferAttribute(vertices, 3));
baseGeometry.setIndex(new BufferAttribute(indices, 1));

// Create instanced attributes
const instanceCount = 100;
const instanceOffset = new Float32Array(instanceCount * 3);
const instanceScale = new Float32Array(instanceCount * 3);
const instanceColor = new Float32Array(instanceCount * 3);

// Set up instances
for (let i = 0; i < instanceCount; i++) {
    // Random position
    instanceOffset[i * 3] = (Math.random() - 0.5) * 100;
    instanceOffset[i * 3 + 1] = Math.random() * 20;
    instanceOffset[i * 3 + 2] = (Math.random() - 0.5) * 100;
    
    // Random scale
    const scale = Math.random() * 2 + 0.5;
    instanceScale[i * 3] = scale;
    instanceScale[i * 3 + 1] = scale;
    instanceScale[i * 3 + 2] = scale;
    
    // Random color
    instanceColor[i * 3] = Math.random();
    instanceColor[i * 3 + 1] = Math.random();
    instanceColor[i * 3 + 2] = Math.random();
}

// Add instanced attributes
baseGeometry.setAttribute('instanceOffset', new BufferAttribute(instanceOffset, 3));
baseGeometry.setAttribute('instanceScale', new BufferAttribute(instanceScale, 3));
baseGeometry.setAttribute('instanceColor', new BufferAttribute(instanceColor, 3));
baseGeometry.maxInstancedCount = instanceCount;
```

### Geometry Merging and Optimization

```javascript
// Merge multiple geometries into one
function mergeGeometries(geometries) {
    const mergedGeometry = new BufferGeometry();
    
    let vertexOffset = 0;
    const mergedVertices = [];
    const mergedNormals = [];
    const mergedUVs = [];
    const mergedIndices = [];
    
    geometries.forEach((geometry, index) => {
        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;
        const uvs = geometry.attributes.uv.array;
        
        // Copy vertices
        for (let i = 0; i < positions.length; i++) {
            mergedVertices.push(positions[i]);
        }
        
        // Copy normals
        for (let i = 0; i < normals.length; i++) {
            mergedNormals.push(normals[i]);
        }
        
        // Copy UVs
        for (let i = 0; i < uvs.length; i++) {
            mergedUVs.push(uvs[i]);
        }
        
        // Copy indices with offset
        if (geometry.index) {
            const indices = geometry.index.array;
            for (let i = 0; i < indices.length; i++) {
                mergedIndices.push(indices[i] + vertexOffset);
            }
        } else {
            const positionCount = positions.length / 3;
            for (let i = 0; i < positionCount; i++) {
                mergedIndices.push(i + vertexOffset);
            }
        }
        
        vertexOffset += positions.length / 3;
    });
    
    // Set merged attributes
    mergedGeometry.setAttribute('position', new BufferAttribute(new Float32Array(mergedVertices), 3));
    mergedGeometry.setAttribute('normal', new BufferAttribute(new Float32Array(mergedNormals), 3));
    mergedGeometry.setAttribute('uv', new BufferAttribute(new Float32Array(mergedUVs), 2));
    
    if (mergedIndices.length > 0) {
        mergedGeometry.setIndex(new BufferAttribute(new Uint16Array(mergedIndices), 1));
    }
    
    // Compute bounds
    mergedGeometry.computeBoundingBox();
    mergedGeometry.computeBoundingSphere();
    
    return mergedGeometry;
}

// Usage
const box1 = new BoxGeometry(1, 1, 1);
const box2 = new BoxGeometry(1, 1, 1);
box2.position.x = 2;

const merged = mergeGeometries([box1, box2]);
const mergedMesh = new Mesh(merged, new StandardMaterial({ color: 0x00ff00 }));

scene.add(mergedMesh);
```

The BufferGeometry class provides the high-performance foundation for all geometry in Ninth.js, offering comprehensive attribute management, transformation capabilities, and optimization features for efficient 3D rendering.