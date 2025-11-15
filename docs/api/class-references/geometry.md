# Geometry Classes Reference

Geometry classes define the shape and structure of 3D objects. Ninth.js provides primitive geometries, complex parametric geometries, and utility classes for geometry manipulation.

## Table of Contents

- [Primitive Geometries](#primitive-geometries)
- [Parametric Geometries](#parametric-geometries)
- [BufferGeometry](#buffergeometry)
- [Geometry Utilities](#geometry-utilities)
- [Curve and Surface Classes](#curve-and-surface-classes)

## Primitive Geometries

### BoxGeometry
**Description:** Box-shaped geometry primitive.

#### Constructor
```javascript
new BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
```

**Parameters:**
- `width: number = 1` - Box width
- `height: number = 1` - Box height
- `depth: number = 1` - Box depth
- `widthSegments: number = 1` - Width subdivisions
- `heightSegments: number = 1` - Height subdivisions
- `depthSegments: number = 1` - Depth subdivisions

**Example:**
```javascript
// Simple cube
const cube = new BoxGeometry(1, 1, 1);

// Detailed cube with subdivisions
const detailedCube = new BoxGeometry(2, 2, 2, 10, 10, 10);

// Create different sized boxes
const longBox = new BoxGeometry(5, 1, 1);     // Long rectangular box
const flatBox = new BoxGeometry(1, 1, 0.1);    // Flat box (thin)
const tallBox = new BoxGeometry(1, 3, 1);      // Tall box
```

#### Properties
- `width: number` - Box width
- `height: number` - Box height  
- `depth: number` - Box depth
- `widthSegments: number` - Width subdivisions
- `heightSegments: number` - Height subdivisions
- `depthSegments: number` - Depth subdivisions

#### Methods
- `setSize(width, height, depth)` - Update box dimensions
- `setSegments(width, height, depth)` - Update subdivisions

---

### SphereGeometry
**Description:** Sphere-shaped geometry primitive.

#### Constructor
```javascript
new SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)
```

**Parameters:**
- `radius: number = 1` - Sphere radius
- `widthSegments: number = 8` - Horizontal segments (longitude)
- `heightSegments: number = 6` - Vertical segments (latitude)
- `phiStart: number = 0` - Start phi angle (longitude start)
- `phiLength: number = Math.PI * 2` - Phi angle span
- `thetaStart: number = 0` - Start theta angle (latitude start)
- `thetaLength: number = Math.PI` - Theta angle span

**Example:**
```javascript
// Simple sphere
const sphere = new SphereGeometry(1, 16, 16);

// High detail sphere
const detailedSphere = new SphereGeometry(1, 64, 64);

// Sphere segments
const lowPolySphere = new SphereGeometry(1, 8, 6);   // Low poly
const highPolySphere = new SphereGeometry(1, 128, 128); // High poly

// Hemisphere
const hemisphere = new SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);

// Sphere slice (like an orange wedge)
const sphereSlice = new SphereGeometry(1, 16, 16, 0, Math.PI / 2, 0, Math.PI);
```

#### Properties
- `radius: number` - Sphere radius
- `widthSegments: number` - Longitudinal segments
- `heightSegments: number` - Latitudinal segments
- `phiStart: number` - Start phi angle
- `phiLength: number` - Phi angle span
- `thetaStart: number` - Start theta angle
- `thetaLength: number` - Theta angle span

---

### PlaneGeometry
**Description:** Plane-shaped geometry primitive.

#### Constructor
```javascript
new PlaneGeometry(width, height, widthSegments, heightSegments)
```

**Parameters:**
- `width: number = 1` - Plane width
- `height: number = 1` - Plane height
- `widthSegments: number = 1` - Width subdivisions
- `heightSegments: number = 1` - Height subdivisions

**Example:**
```javascript
// Simple plane
const plane = new PlaneGeometry(10, 10);

// High detail plane
const detailedPlane = new PlaneGeometry(10, 10, 64, 64);

// Rectangular plane
const widePlane = new PlaneGeometry(20, 5);
const tallPlane = new PlaneGeometry(5, 20);

// Ground plane
const ground = new PlaneGeometry(100, 100, 100, 100);
```

#### Properties
- `width: number` - Plane width
- `height: number` - Plane height
- `widthSegments: number` - Width subdivisions
- `heightSegments: number` - Height subdivisions

---

### CylinderGeometry
**Description:** Cylinder-shaped geometry primitive.

#### Constructor
```javascript
new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
```

**Parameters:**
- `radiusTop: number = 1` - Top radius
- `radiusBottom: number = 1` - Bottom radius
- `height: number = 2` - Cylinder height
- `radialSegments: number = 8` - Radial segments around circumference
- `heightSegments: number = 1` - Height subdivisions
- `openEnded: boolean = false` - Open ended (no top/bottom caps)

**Example:**
```javascript
// Standard cylinder
const cylinder = new CylinderGeometry(1, 1, 2, 16);

// Tapered cylinder (cone-like)
const tapered = new CylinderGeometry(2, 0.5, 2, 16);

// Cone
const cone = new CylinderGeometry(0, 1, 2, 16);

// Open cylinder (tube)
const tube = new CylinderGeometry(1, 1, 2, 16, 1, true);

// Detailed tube
const detailedTube = new CylinderGeometry(1, 1, 2, 64, 32, true);
```

#### Properties
- `radiusTop: number` - Top radius
- `radiusBottom: number` - Bottom radius
- `height: number` - Cylinder height
- `radialSegments: number` - Radial segments
- `heightSegments: number` - Height segments
- `openEnded: boolean` - Open ended flag

---

### CircleGeometry
**Description:** Circle-shaped geometry primitive (2D disc).

#### Constructor
```javascript
new CircleGeometry(radius, segments, thetaStart, thetaLength)
```

**Parameters:**
- `radius: number = 1` - Circle radius
- `segments: number = 8` - Number of segments (higher = smoother circle)
- `thetaStart: number = 0` - Start angle
- `thetaLength: number = Math.PI * 2` - Angle span

**Example:**
```javascript
// Simple circle
const circle = new CircleGeometry(1, 32);

// Semi-circle
const semicircle = new CircleGeometry(1, 32, 0, Math.PI);

// Quarter circle
const quarterCircle = new CircleGeometry(1, 32, 0, Math.PI / 2);

// High detail circle
const smoothCircle = new CircleGeometry(1, 128);
```

#### Properties
- `radius: number` - Circle radius
- `segments: number` - Number of segments
- `thetaStart: number` - Start angle
- `thetaLength: number` - Angle span

---

### ConeGeometry
**Description:** Cone-shaped geometry primitive.

#### Constructor
```javascript
new ConeGeometry(radius, height, radialSegments, heightSegments, openEnded)
```

**Parameters:**
- `radius: number = 1` - Base radius
- `height: number = 2` - Cone height
- `radialSegments: number = 8` - Radial segments
- `heightSegments: number = 1` - Height segments
- `openEnded: boolean = false` - Open ended

**Example:**
```javascript
// Simple cone
const cone = new ConeGeometry(1, 2, 16);

// Tall cone
const tallCone = new ConeGeometry(1, 4, 16);

// Wide cone
const wideCone = new ConeGeometry(2, 2, 16);

// Open cone (no base)
const openCone = new ConeGeometry(1, 2, 16, 1, true);
```

#### Properties
- `radius: number` - Base radius
- `height: number` - Cone height
- `radialSegments: number` - Radial segments
- `heightSegments: number` - Height segments
- `openEnded: boolean` - Open ended flag

---

## Parametric Geometries

### TorusGeometry
**Description:** Torus (donut) shaped geometry.

#### Constructor
```javascript
new TorusGeometry(radius, tube, radialSegments, tubularSegments, arc)
```

**Parameters:**
- `radius: number = 1` - Main radius
- `tube: number = 0.4` - Tube radius
- `radialSegments: number = 8` - Radial segments
- `tubularSegments: number = 100` - Tubular segments
- `arc: number = Math.PI * 2` - Arc length

**Example:**
```javascript
// Standard torus
const torus = new TorusGeometry(1, 0.4, 8, 100);

// Thin torus
const thinTorus = new TorusGeometry(1, 0.1, 8, 100);

// Thick torus
const thickTorus = new TorusGeometry(1, 0.8, 8, 100);

// Partial torus (arc)
const torusArc = new TorusGeometry(1, 0.4, 8, 100, Math.PI); // Half torus
```

---

### TorusKnotGeometry
**Description:** Torus knot (mathematical knot) geometry.

#### Constructor
```javascript
new TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q)
```

**Parameters:**
- `radius: number = 1` - Main radius
- `tube: number = 0.4` - Tube radius
- `tubularSegments: number = 64` - Tubular segments
- `radialSegments: number = 8` - Radial segments
- `p: number = 2` - Knot parameter p
- `q: number = 3` - Knot parameter q

**Example:**
```javascript
// Standard trefoil knot
const trefoil = new TorusKnotGeometry(1, 0.4, 64, 8, 2, 3);

// Figure-eight knot
const figureEight = new TorusKnotGeometry(1, 0.4, 64, 8, 2, 4);

// Complex knot
const complexKnot = new TorusKnotGeometry(1, 0.2, 128, 16, 3, 7);
```

---

### RingGeometry
**Description:** Ring (annulus) shaped geometry.

#### Constructor
```javascript
new RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength)
```

**Parameters:**
- `innerRadius: number = 0.5` - Inner radius
- `outerRadius: number = 1` - Outer radius
- `thetaSegments: number = 8` - Theta segments
- `phiSegments: number = 1` - Phi segments
- `thetaStart: number = 0` - Start angle
- `thetaLength: number = Math.PI * 2` - Angle span

**Example:**
```javascript
// Standard ring
const ring = new RingGeometry(0.5, 1, 32);

// Thin ring
const thinRing = new RingGeometry(0.9, 1, 32);

// Thick ring
const thickRing = new RingGeometry(0.2, 1, 32);

// Partial ring
const ringArc = new RingGeometry(0.5, 1, 32, 1, 0, Math.PI);
```

---

### LatheGeometry
**Description:** Geometry created by rotating a profile curve.

#### Constructor
```javascript
new LatheGeometry(points, segments, phiStart, phiLength)
```

**Parameters:**
- `points: Vector3[]` - Profile points
- `segments: number = 16` - Number of segments
- `phiStart: number = 0` - Start angle
- `phiLength: number = Math.PI * 2` - Angle span

**Example:**
```javascript
// Create wine glass profile
const wineGlassProfile = [
    new Vector3(0.1, 0, 0),
    new Vector3(0.5, 2, 0),
    new Vector3(0.3, 2.5, 0),
    new Vector3(0.15, 3, 0),
    new Vector3(0.1, 4, 0),
    new Vector3(0.08, 5, 0),
    new Vector3(0.05, 6, 0)
];

const wineGlass = new LatheGeometry(wineGlassProfile, 64);

// Vase shape
const vaseProfile = [
    new Vector3(0.1, 0, 0),
    new Vector3(0.8, 0, 0),
    new Vector3(0.6, 1, 0),
    new Vector3(0.4, 2, 0),
    new Vector3(0.3, 3, 0),
    new Vector3(0.5, 4, 0),
    new Vector3(0.2, 5, 0),
    new Vector3(0.15, 6, 0)
];

const vase = new LatheGeometry(vaseProfile, 64);
```

---

## BufferGeometry

`BufferGeometry` is the core geometry class that stores all geometry data in efficient GPU buffers.

### Constructor
```javascript
new BufferGeometry()
```

### Properties

#### `attributes: Map<string, BufferAttribute>`
- **Description**: Named geometry attributes
- **Type**: `Map<string, BufferAttribute>`

**Common attributes:**
- `position` - Vertex positions
- `normal` - Vertex normals
- `uv` - Texture coordinates
- `uv2` - Second set of texture coordinates
- `color` - Vertex colors
- `index` - Vertex indices

#### `index: BufferAttribute | null`
- **Description**: Index buffer for indexed geometry
- **Type**: `BufferAttribute | null`

#### `boundingBox: Box3 | null`
- **Description**: Computed bounding box
- **Type**: `Box3 | null`

#### `boundingSphere: Sphere | null`
- **Description**: Computed bounding sphere
- **Type**: `Sphere | null`

### Methods

#### `addAttribute(name, attribute)`
Add a vertex attribute.

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

// Create normal attribute
const normals = new Float32Array([
    0, 0, 1,   // Normal for vertex 1
    0, 0, 1,   // Normal for vertex 2
    0, 0, 1    // Normal for vertex 3
]);

const normalAttribute = new BufferAttribute(normals, 3);
geometry.addAttribute('normal', normalAttribute);

// Create UV attribute
const uvs = new Float32Array([
    0, 0,      // UV for vertex 1
    1, 0,      // UV for vertex 2
    0, 1       // UV for vertex 3
]);

const uvAttribute = new BufferAttribute(uvs, 2);
geometry.addAttribute('uv', uvAttribute);
```

#### `removeAttribute(name)`
Remove a vertex attribute.

**Parameters:**
- `name: string` - Attribute name

**Example:**
```javascript
// Remove attribute
geometry.removeAttribute('color');

// Check if attribute exists
if (geometry.hasAttribute('normal')) {
    console.log('Geometry has normals');
}
```

#### `getAttribute(name)`
Get a vertex attribute.

**Parameters:**
- `name: string` - Attribute name

**Returns:** `BufferAttribute | null`

**Example:**
```javascript
// Get position attribute
const positionAttr = geometry.getAttribute('position');
if (positionAttr) {
    const positions = positionAttr.array;
    console.log(`Position count: ${positionAttr.count}`);
    console.log(`Positions: ${Array.from(positions)}`);
}
```

#### `hasAttribute(name)`
Check if geometry has an attribute.

**Parameters:**
- `name: string` - Attribute name

**Returns:** `boolean`

#### `setIndex(index)`
Set the index buffer.

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
Compute the bounding box.

**Example:**
```javascript
// Compute bounding box
geometry.computeBoundingBox();

const bbox = geometry.boundingBox;
console.log(`Bounding box: min=${bbox.min.toArray()}, max=${bbox.max.toArray()}`);
```

#### `computeBoundingSphere()`
Compute the bounding sphere.

**Example:**
```javascript
// Compute bounding sphere
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
// Merge two geometries
const geom1 = new BoxGeometry(1, 1, 1);
const geom2 = new SphereGeometry(0.5, 8, 6);

geom1.merge(geom2);
```

#### `clone()`
Clone the geometry.

**Returns:** `BufferGeometry`

```javascript
// Clone geometry
const clonedGeometry = geometry.clone();
```

#### `dispose()`
Clean up geometry resources.

**Example:**
```javascript
// Dispose geometry
geometry.dispose();

// When creating many geometries, always dispose unused ones
```

## Geometry Utilities

### GeometryUtils
**Description:** Utility functions for geometry manipulation.

#### Methods

##### `mergeGeometries(geometries, useGroups?)`
Merge multiple geometries into one.

**Parameters:**
- `geometries: BufferGeometry[]` - Geometries to merge
- `useGroups: boolean = true` - Preserve geometry groups

**Returns:** `BufferGeometry`

**Example:**
```javascript
// Merge multiple box geometries
const box1 = new BoxGeometry(1, 1, 1);
const box2 = new BoxGeometry(1, 1, 1);
box2.position.set(2, 0, 0);

const box3 = new BoxGeometry(1, 1, 1);
box3.position.set(-2, 0, 0);

const mergedBoxes = GeometryUtils.mergeGeometries([box1, box2, box3]);
```

##### `mergeVertices(geometry, tolerance?)`
Merge duplicate vertices.

**Parameters:**
- `geometry: BufferGeometry` - Geometry to optimize
- `tolerance: number = 1e-4` - Vertex merging tolerance

**Returns:** `BufferGeometry`

**Example:**
```javascript
// Remove duplicate vertices
const optimizedGeometry = GeometryUtils.mergeVertices(geometry, 1e-5);
```

##### `computeVertexNormals(geometry)`
Recompute vertex normals.

**Parameters:**
- `geometry: BufferGeometry` - Geometry to process

**Example:**
```javascript
// Recompute normals for deformed geometry
GeometryUtils.computeVertexNormals(geometry);
```

##### `centerGeometry(geometry)`
Center geometry at origin.

**Parameters:**
- `geometry: BufferGeometry` - Geometry to center

**Example:**
```javascript
// Center geometry
GeometryUtils.centerGeometry(geometry);
```

##### `computeBounds(geometry)`
Compute geometry bounds.

**Parameters:**
- `geometry: BufferGeometry` - Geometry to process

**Returns:** `Bounds`

**Example:**
```javascript
const bounds = GeometryUtils.computeBounds(geometry);
console.log(`Bounds: center=${bounds.center.toArray()}, size=${bounds.size.toArray()}`);
```

---

## Curve and Surface Classes

### BezierCurve
**Description:** Cubic Bezier curve implementation.

#### Constructor
```javascript
new BezierCurve(p0, p1, p2, p3)
```

**Parameters:**
- `p0: Vector3` - Start point
- `p1: Vector3` - First control point
- `p2: Vector3` - Second control point
- `p3: Vector3` - End point

**Example:**
```javascript
// Create cubic Bezier curve
const curve = new BezierCurve(
    new Vector3(0, 0, 0),    // Start
    new Vector3(1, 2, 0),    // Control point 1
    new Vector3(2, 1, 0),    // Control point 2
    new Vector3(3, 0, 0)     // End
);

// Get point on curve
const point = curve.getPoint(0.5); // Midpoint

// Get tangent on curve
const tangent = curve.getTangent(0.5);
```

#### Methods

##### `getPoint(t)`
Get point on curve.

**Parameters:**
- `t: number` - Parameter (0-1)

**Returns:** `Vector3`

##### `getTangent(t)`
Get tangent vector on curve.

**Parameters:**
- `t: number` - Parameter (0-1)

**Returns:** `Vector3`

##### `getPoints(divisions)`
Get multiple points on curve.

**Parameters:**
- `divisions: number` - Number of divisions

**Returns:** `Vector3[]`

**Example:**
```javascript
// Get 10 points on curve
const points = curve.getPoints(10);

// Create curve geometry
const curvePoints = curve.getPoints(50);
const curveGeometry = new BufferGeometry().setFromPoints(curvePoints);
```

---

### Spline
**Description:** Spline curve implementation.

#### Constructor
```javascript
new Spline(points, closed, tension)
```

**Parameters:**
- `points: Vector3[]` - Control points
- `closed: boolean = false` - Closed curve
- `tension: number = 0.5` - Curve tension (0-1)

**Example:**
```javascript
// Create open spline
const openSpline = new Spline([
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(2, 0, 0),
    new Vector3(3, 1, 0)
]);

// Create closed spline
const closedSpline = new Spline([
    new Vector3(0, 0, 0),
    new Vector3(1, 1, 0),
    new Vector3(2, 0, 0),
    new Vector3(1, -1, 0)
], true);

// Create curve with different tension
const smoothCurve = new Spline(points, false, 0.1);  // Very smooth
const tightCurve = new Spline(points, false, 1.0);   // Tight, follows points closely
```

---

### ParametricSurface
**Description:** Parametric surface generator.

#### Constructor
```javascript
new ParametricSurface(func, slices, stacks)
```

**Parameters:**
- `func: (u, v, target) => void` - Surface function
- `slices: number = 25` - U direction subdivisions
- `stacks: number = 25` - V direction subdivisions

**Example:**
```javascript
// Create sphere surface
const sphereFunc = (u, v, target) => {
    u = u * Math.PI;
    v = v * Math.PI * 2;
    
    const x = Math.sin(u) * Math.cos(v);
    const y = Math.sin(u) * Math.sin(v);
    const z = Math.cos(u);
    
    target.set(x, y, z);
};

const sphere = new ParametricSurface(sphereFunc, 32, 64);

// Create wave surface
const waveFunc = (u, v, target) => {
    const x = (u - 0.5) * 10;
    const z = (v - 0.5) * 10;
    const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2;
    
    target.set(x, y, z);
};

const wave = new ParametricSurface(waveFunc, 50, 50);
```

---

### NURBSSurface
**Description:** NURBS (Non-Uniform Rational B-Spline) surface.

#### Constructor
```javascript
new NURBSSurface(degreeU, degreeV, knotsU, knotsV, controlPoints)
```

**Parameters:**
- `degreeU: number` - U direction degree
- `degreeV: number` - V direction degree
- `knotsU: number[]` - U direction knot vector
- `knotsV: number[]` - V direction knot vector
- `controlPoints: Vector4[][]` - Control points [weight, x, y, z]

**Example:**
```javascript
// Create simple NURBS surface
const controlPoints = [];
const knotsU = [0, 0, 0, 1, 1, 1];
const knotsV = [0, 0, 1, 1];

// Define control points
for (let i = 0; i < 3; i++) {
    controlPoints[i] = [];
    for (let j = 0; j < 3; j++) {
        controlPoints[i][j] = new Vector4(i, Math.random() * 2, j, 1);
    }
}

const nurbsSurface = new NURBSSurface(2, 1, knotsU, knotsV, controlPoints);
```

## Complete Usage Examples

### Procedural Terrain Generation
```javascript
// Create procedural terrain
function createTerrain(size, segments) {
    const geometry = new PlaneGeometry(size, size, segments, segments);
    
    // Modify vertices for terrain
    const positions = geometry.getAttribute('position');
    const vertex = new Vector3();
    
    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        
        // Add height variation using noise
        const height = Math.sin(vertex.x * 0.1) * Math.cos(vertex.z * 0.1) * 2;
        vertex.y = height;
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Recompute normals
    GeometryUtils.computeVertexNormals(geometry);
    
    return geometry;
}

// Create terrain mesh
const terrainGeometry = createTerrain(100, 64);
const terrainMaterial = new MeshStandardMaterial({
    color: '#90EE90',
    roughness: 0.8
});
const terrain = new Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
```

### Character Animation Rig
```javascript
// Create skeletal structure
function createSkeleton() {
    const skeleton = new Object3D();
    
    // Spine
    const spine = new Object3D();
    spine.name = 'spine';
    skeleton.addChild(spine);
    
    // Head
    const head = new Object3D();
    head.name = 'head';
    head.position.y = 1;
    spine.addChild(head);
    
    // Arms
    const leftArm = new Object3D();
    leftArm.name = 'leftArm';
    leftArm.position.x = -0.5;
    leftArm.position.y = 0.5;
    spine.addChild(leftArm);
    
    const rightArm = new Object3D();
    rightArm.name = 'rightArm';
    rightArm.position.x = 0.5;
    rightArm.position.y = 0.5;
    spine.addChild(rightArm);
    
    // Legs
    const leftLeg = new Object3D();
    leftLeg.name = 'leftLeg';
    leftLeg.position.x = -0.2;
    leftLeg.position.y = -0.5;
    skeleton.addChild(leftLeg);
    
    const rightLeg = new Object3D();
    rightLeg.name = 'rightLeg';
    rightLeg.position.x = 0.2;
    rightLeg.position.y = -0.5;
    skeleton.addChild(rightLeg);
    
    return skeleton;
}

// Create character with different body parts
function createCharacter() {
    const character = createSkeleton();
    
    // Add mesh parts
    const bodyGeometry = new BoxGeometry(0.4, 0.8, 0.2);
    const bodyMaterial = new MeshStandardMaterial({ color: '#FFB6C1' });
    const body = new Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body';
    character.getObjectByName('spine').addChild(body);
    
    const headGeometry = new SphereGeometry(0.25);
    const headMaterial = new MeshStandardMaterial({ color: '#FFDBAC' });
    const head = new Mesh(headGeometry, headMaterial);
    head.name = 'headMesh';
    character.getObjectByName('head').addChild(head);
    
    return character;
}
```

### Custom Geometry Exporter
```javascript
class GeometryExporter {
    static toJSON(geometry) {
        const json = {
            type: 'BufferGeometry',
            attributes: {},
            index: null,
            boundingBox: geometry.boundingBox,
            boundingSphere: geometry.boundingSphere
        };
        
        // Export attributes
        geometry.attributes.forEach((attribute, name) => {
            json.attributes[name] = {
                array: Array.from(attribute.array),
                itemSize: attribute.itemSize,
                count: attribute.count,
                normalized: attribute.normalized
            };
        });
        
        // Export index
        if (geometry.index) {
            json.index = {
                array: Array.from(geometry.index.array),
                itemSize: geometry.index.itemSize,
                count: geometry.index.count
            };
        }
        
        return json;
    }
    
    static fromJSON(json) {
        const geometry = new BufferGeometry();
        
        // Import attributes
        Object.entries(json.attributes).forEach(([name, attrData]) => {
            const array = new Float32Array(attrData.array);
            const attribute = new BufferAttribute(array, attrData.itemSize);
            attribute.normalized = attrData.normalized;
            geometry.addAttribute(name, attribute);
        });
        
        // Import index
        if (json.index) {
            const array = new (json.index.array.length > 65535 ? Uint32Array : Uint16Array)(
                json.index.array
            );
            const index = new BufferAttribute(array, json.index.itemSize);
            geometry.setIndex(index);
        }
        
        return geometry;
    }
    
    static toOBJ(geometry) {
        const positions = geometry.getAttribute('position');
        const normals = geometry.getAttribute('normal');
        const uvs = geometry.getAttribute('uv');
        const index = geometry.index;
        
        let obj = '# Generated by Ninth.js\n\n';
        
        // Add vertices
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            obj += `v ${x} ${y} ${z}\n`;
        }
        
        // Add texture coordinates
        if (uvs) {
            for (let i = 0; i < uvs.count; i++) {
                const u = uvs.getX(i);
                const v = uvs.getY(i);
                obj += `vt ${u} ${v}\n`;
            }
        }
        
        // Add normals
        if (normals) {
            for (let i = 0; i < normals.count; i++) {
                const x = normals.getX(i);
                const y = normals.getY(i);
                const z = normals.getZ(i);
                obj += `vn ${x} ${y} ${z}\n`;
            }
        }
        
        // Add faces
        if (index) {
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i) + 1;
                const b = index.getX(i + 1) + 1;
                const c = index.getX(i + 2) + 1;
                
                if (uvs && normals) {
                    obj += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
                } else if (uvs) {
                    obj += `f ${a}/${a} ${b}/${b} ${c}/${c}\n`;
                } else if (normals) {
                    obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                } else {
                    obj += `f ${a} ${b} ${c}\n`;
                }
            }
        }
        
        return obj;
    }
}
```

## Performance Tips

1. **Geometry Complexity**: Use appropriate segment counts for your use case
2. **Merging**: Merge geometries to reduce draw calls
3. **Indexing**: Use indexed geometry for better performance
4. **Normals**: Recompute normals after geometry modifications
5. **Bounding Volumes**: Update bounds after major geometry changes
6. **Memory Management**: Dispose unused geometries
7. **LOD Systems**: Create different detail levels for distant objects
8. **Compression**: Use compressed geometry formats for large models

## Best Practices

1. **Procedural Generation**: Use procedural methods for dynamic content
2. **Geometry Sharing**: Share geometries between similar objects
3. **Optimization**: Optimize geometry for your target platform
4. **Validation**: Validate geometry before rendering
5. **Serialization**: Use proper serialization for saving/loading
6. **Caching**: Cache expensive geometry operations
7. **Memory**: Monitor geometry memory usage in large scenes
8. **Level of Detail**: Implement LOD for performance scaling

Geometry classes provide the foundation for all 3D shapes in Ninth.js, from simple primitives to complex procedural models, offering both performance and flexibility for 3D application development.