# Property Reference

This document provides a comprehensive reference of all configurable properties across the Ninth.js library.

## Table of Contents

- [Core Properties](#core-properties)
- [Material Properties](#material-properties)
- [Geometry Properties](#geometry-properties)
- [Camera Properties](#camera-properties)
- [Light Properties](#light-properties)
- [Renderer Properties](#renderer-properties)
- [Mesh Properties](#mesh-properties)
- [Texture Properties](#texture-properties)
- [Animation Properties](#animation-properties)
- [Physics Properties](#physics-properties)

## Core Properties

### Scene Properties

#### `background: Color | Texture | null`
- **Description**: Scene background color, texture, or gradient
- **Default**: `new Color(0x050505)`
- **Type**: `Color | Texture | null`

```javascript
scene.background = new Color('#87CEEB');           // Sky blue
scene.background = new Texture('sky.jpg');         // Sky texture
scene.background = null;                           // Transparent
```

#### `fog: FogSettings | null`
- **Description**: Atmospheric fog settings
- **Default**: `null`
- **Type**: `FogSettings | null`

```javascript
scene.fog = {
    enabled: true,
    color: new Color('#CCCCCC'),
    near: 10,
    far: 200,
    type: 'linear' // 'linear', 'exponential', 'exponential2'
};
```

#### `ambientLight: AmbientLightSettings`
- **Description**: Global ambient lighting
- **Default**: `{ color: new Color(0xffffff), intensity: 0.1 }`
- **Type**: `Object`

```javascript
scene.ambientLight = {
    color: new Color(0x404040),
    intensity: 0.2
};
```

#### `environment: TextureCube | null`
- **Description**: Environment map for PBR rendering
- **Default**: `null`
- **Type**: `TextureCube | null`

```javascript
scene.environment = envMapTexture;
```

#### `autoUpdate: boolean`
- **Description**: Automatically update scene objects
- **Default**: `true`
- **Type**: `boolean`

```javascript
scene.autoUpdate = false; // Manual updates only
```

#### `matrixAutoUpdate: boolean`
- **Description**: Automatically update object matrices
- **Default**: `true`
- **Type**: `boolean`

```javascript
scene.matrixAutoUpdate = false;
```

#### `frustumCulled: boolean`
- **Description**: Enable frustum culling optimization
- **Default**: `true`
- **Type**: `boolean`

```javascript
scene.frustumCulled = true;
```

### Object3D Properties

#### `position: Vector3`
- **Description**: Object position in 3D space
- **Default**: `new Vector3(0, 0, 0)`
- **Type**: `Vector3`

```javascript
object.position.set(10, 5, 0);
object.position.x = 10;
object.position.y = 5;
object.position.z = 0;
```

#### `rotation: Euler`
- **Description**: Object rotation in Euler angles
- **Default**: `new Euler(0, 0, 0, 'XYZ')`
- **Type**: `Euler`

```javascript
object.rotation.set(0, Math.PI / 2, 0);
object.rotation.x = 0;
object.rotation.y = Math.PI / 2;
object.rotation.z = 0;
object.rotation.order = 'YXZ'; // Rotation order
```

#### `scale: Vector3`
- **Description**: Object scale factors
- **Default**: `new Vector3(1, 1, 1)`
- **Type**: `Vector3`

```javascript
object.scale.set(2, 1, 1);           // Stretch in X
object.scale.set(0.5, 0.5, 0.5);     // Shrink uniformly
object.scale.x = 2;                  // Scale X only
```

#### `quaternion: Quaternion`
- **Description**: Object rotation as quaternion
- **Default**: `new Quaternion()`
- **Type**: `Quaternion`

```javascript
object.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
```

#### `matrix: Matrix4`
- **Description**: Local transformation matrix
- **Default**: `new Matrix4()`
- **Type**: `Matrix4`

```javascript
object.matrix.compose(object.position, object.quaternion, object.scale);
```

#### `matrixWorld: Matrix4`
- **Description**: World transformation matrix
- **Default**: `new Matrix4()`
- **Type**: `Matrix4`

```javascript
object.updateMatrixWorld();
console.log(object.matrixWorld);
```

#### `visible: boolean`
- **Description**: Object visibility
- **Default**: `true`
- **Type**: `boolean`

```javascript
object.visible = false; // Hide object
object.visible = true;  // Show object
```

#### `castShadow: boolean`
- **Description**: Object casts shadows
- **Default**: `false`
- **Type**: `boolean`

```javascript
object.castShadow = true;  // Cast shadows
object.castShadow = false; // Don't cast shadows
```

#### `receiveShadow: boolean`
- **Description**: Object receives shadows
- **Default**: `false`
- **Type**: `boolean`

```javascript
object.receiveShadow = true;  // Receive shadows
object.receiveShadow = false; // Don't receive shadows
```

#### `raycast: Function | null`
- **Description**: Custom raycasting function
- **Default**: `null`
- **Type**: `Function | null`

```javascript
object.raycast = (raycaster, intersects) => {
    // Custom raycasting logic
};
```

#### `layers: Layers`
- **Description**: Layer membership for rendering and raycasting
- **Default**: `new Layers()`
- **Type**: `Layers`

```javascript
object.layers.set(1); // Set to layer 1
object.layers.enable(2); // Enable layer 2
object.layers.disable(3); // Disable layer 3
```

#### `userData: Object`
- **Description**: Custom user data storage
- **Default**: `{}`
- **Type**: `Object`

```javascript
object.userData.health = 100;
object.userData.type = 'enemy';
object.userData.customId = 'player-001';
```

#### `name: string`
- **Description**: Object name for identification
- **Default**: `''`
- **Type**: `string`

```javascript
object.name = 'player-character';
object.name = 'enemy-001';
object.name = 'environment-tree';
```

#### `id: number`
- **Description**: Unique object identifier
- **Default**: `System generated`
- **Type**: `number`

```javascript
console.log(object.id); // Read-only unique ID
```

#### `parent: Object3D | null`
- **Description**: Parent object in hierarchy
- **Default**: `null`
- **Type**: `Object3D | null`

```javascript
console.log(object.parent.name); // Access parent
```

#### `children: Object3D[]`
- **Description**: Array of child objects
- **Default**: `[]`
- **Type**: `Object3D[]`

```javascript
console.log(object.children.length);
object.children.forEach(child => console.log(child.name));
```

## Material Properties

### Base Material Properties

#### `color: Color`
- **Description**: Base material color
- **Default**: `new Color(0xffffff)`
- **Type**: `Color`

```javascript
material.color.setHex(0xff0000);    // Red
material.color.setRGB(1, 0, 0);     // Red
material.color.set('#FF0000');      // Red
```

#### `opacity: number`
- **Description**: Material opacity (0 = transparent, 1 = opaque)
- **Default**: `1.0`
- **Type**: `number`

```javascript
material.opacity = 0.5;     // Semi-transparent
material.opacity = 1.0;     // Fully opaque
material.opacity = 0.0;     // Fully transparent
```

#### `transparent: boolean`
- **Description**: Enable transparency rendering
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.transparent = true;
material.opacity = 0.8; // Will be used with transparency
```

#### `alphaTest: number`
- **Description**: Alpha test threshold for cutout rendering
- **Default**: `0`
- **Type**: `number`

```javascript
material.alphaTest = 0.5; // Pixels with alpha < 0.5 will be discarded
```

#### `side: Side`
- **Description**: Which faces to render
- **Default**: `FrontSide`
- **Type**: `string`

```javascript
material.side = 'front';      // Front faces only
material.side = 'back';       // Back faces only
material.side = 'double';     // Both sides
```

#### `vertexColors: boolean`
- **Description**: Use vertex colors
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.vertexColors = true;
```

#### `flatShading: boolean`
- **Description**: Use flat shading instead of smooth
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.flatShading = true;
```

#### `fog: boolean`
- **Description**: Enable fog rendering
- **Default**: `true`
- **Type**: `boolean`

```javascript
material.fog = false; // Don't render fog on this material
```

#### `depthTest: boolean`
- **Description**: Enable depth testing
- **Default**: `true`
- **Type**: `boolean`

```javascript
material.depthTest = false; // Disable depth testing
```

#### `depthWrite: boolean`
- **Description**: Enable depth writing
- **Default**: `true`
- **Type**: `boolean`

```javascript
material.depthWrite = false; // Don't write to depth buffer
```

#### `depthFunc: DepthFunc`
- **Description**: Depth function for testing
- **Default**: `LessEqualDepth`
- **Type**: `number`

```javascript
material.depthFunc = 'NeverDepth';        // Never pass
material.depthFunc = 'AlwaysDepth';       // Always pass
material.depthFunc = 'LessDepth';         // Pass if less
material.depthFunc = 'EqualDepth';        // Pass if equal
material.depthFunc = 'LessEqualDepth';    // Pass if less or equal
material.depthFunc = 'GreaterDepth';      // Pass if greater
material.depthFunc = 'NotEqualDepth';     // Pass if not equal
material.depthFunc = 'GreaterEqualDepth'; // Pass if greater or equal
```

#### `blending: Blending`
- **Description**: Blending mode
- **Default**: `NormalBlending`
- **Type**: `Object`

```javascript
material.blending = 'NoBlending';           // No blending
material.blending = 'NormalBlending';       // Alpha blending
material.blending = 'AdditiveBlending';     // Additive
material.blending = 'SubtractiveBlending';  // Subtractive
material.blending = 'MultiplyBlending';     // Multiply
material.blending = 'CustomBlending';       // Custom
```

#### `blendsrc: BlendingSrc`
- **Description**: Source blending factor
- **Default**: `SrcAlphaFactor`
- **Type**: `number`

#### `blenddst: BlendingDst`
- **Description**: Destination blending factor
- **Default**: `OneMinusSrcAlphaFactor`
- **Type**: `number`

#### `blendEquation: BlendingEquation`
- **Description**: Blending equation
- **Default**: `AddEquation`
- **Type**: `number`

#### `blendEquationAlpha: BlendingEquation`
- **Description**: Alpha blending equation
- **Default**: `AddEquation`
- **Type**: `number`

#### `precision: string`
- **Description**: Shader precision
- **Default**: `null`
- **Type**: `string`

```javascript
material.precision = 'highp';  // High precision
material.precision = 'mediump'; // Medium precision
material.precision = 'lowp';    // Low precision
```

#### `polygonOffset: boolean`
- **Description**: Enable polygon offset
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.polygonOffset = true;
```

#### `polygonOffsetFactor: number`
- **Description**: Polygon offset factor
- **Default**: `0`
- **Type**: `number`

```javascript
material.polygonOffset = true;
material.polygonOffsetFactor = 1;
material.polygonOffsetUnits = 1;
```

#### `dithering: boolean`
- **Description**: Enable dithering for color banding
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.dithering = true;
```

#### `alphaToCoverage: boolean`
- **Description**: Use alpha to coverage for MSAA
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.alphaToCoverage = true;
```

#### `toneMapped: boolean`
- **Description**: Apply tone mapping
- **Default**: `true`
- **Type**: `boolean`

```javascript
material.toneMapped = false; // Don't apply tone mapping
```

#### `toneMappingExposure: number`
- **Description**: Tone mapping exposure
- **Default**: `1`
- **Type**: `number`

```javascript
material.toneMappingExposure = 1.5; // Brighten
material.toneMappingExposure = 0.5; // Darken
```

### MeshBasicMaterial Properties

#### `color: Color`
- **Description**: Material color
- **Default**: `0xffffff`
- **Type**: `Color`

```javascript
const material = new MeshBasicMaterial({ color: 0xff0000 });
material.color.setHex(0x00ff00);
```

#### `map: Texture | null`
- **Description**: Diffuse map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.map = textureLoader.load('diffuse.jpg');
```

#### `combine: CombineOperation`
- **Description**: Texture combination mode
- **Default**: `MultiplyOperation`
- **Type**: `number`

```javascript
material.combine = 'MultiplyOperation';   // Multiply texture and color
material.combine = 'MixOperation';        // Mix texture and color
material.combine = 'AddOperation';        // Add texture and color
```

#### `reflectivity: number`
- **Description**: Texture reflection strength
- **Default**: `1`
- **Type**: `number`

#### `refractionRatio: number`
- **Description**: Texture refraction ratio
- **Default**: `0.98`
- **Type**: `number`

#### `wireframe: boolean`
- **Description**: Render as wireframe
- **Default**: `false`
- **Type**: `boolean`

```javascript
material.wireframe = true;
```

#### `wireframeLinecap: string`
- **Description**: Wireframe line cap style
- **Default**: `'round'`
- **Type**: `string`

```javascript
material.wireframeLinecap = 'butt';    // Square ends
material.wireframeLinecap = 'round';   // Round ends
material.wireframeLinecap = 'square';  // Square ends
```

#### `wireframeLinejoin: string`
- **Description**: Wireframe line join style
- **Default**: `'round'`
- **Type**: `string`

```javascript
material.wireframeLinejoin = 'round';  // Round joins
material.wireframeLinejoin = 'bevel';  // Bevel joins
material.wireframeLinejoin = 'miter';  // Miter joins
```

### MeshLambertMaterial Properties

#### `color: Color`
- **Description**: Material color
- **Default**: `0xffffff`
- **Type**: `Color`

```javascript
const material = new MeshLambertMaterial({ color: '#FFB6C1' });
```

#### `emissive: Color`
- **Description**: Emissive color (self-illumination)
- **Default**: `0x000000`
- **Type**: `Color`

```javascript
material.emissive.setHex(0x333333); // Dim glow
material.emissive.setHex(0xFF0000); // Red glow
```

#### `emissiveIntensity: number`
- **Description**: Emissive color intensity
- **Default**: `1`
- **Type**: `number`

```javascript
material.emissiveIntensity = 0.5; // Half intensity
material.emissiveIntensity = 2.0; // Double intensity
```

#### `emissiveMap: Texture | null`
- **Description**: Emissive map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.emissiveMap = textureLoader.load('emissive.jpg');
```

#### `map: Texture | null`
- **Description**: Diffuse map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.map = textureLoader.load('diffuse.jpg');
```

#### `lightMap: Texture | null`
- **Description**: Light map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.lightMap = textureLoader.load('lightmap.jpg');
```

#### `lightMapIntensity: number`
- **Description**: Light map intensity
- **Default**: `1`
- **Type**: `number`

```javascript
material.lightMapIntensity = 0.8;
```

#### `aoMap: Texture | null`
- **Description**: Ambient occlusion map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.aoMap = textureLoader.load('ao.jpg');
```

#### `aoMapIntensity: number`
- **Description**: Ambient occlusion intensity
- **Default**: `1`
- **Type**: `number`

```javascript
material.aoMapIntensity = 1.5; // Stronger AO
```

#### `specularMap: Texture | null`
- **Description**: Specular map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.specularMap = textureLoader.load('specular.jpg');
```

#### `alphaMap: Texture | null`
- **Description**: Alpha map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.alphaMap = textureLoader.load('alpha.jpg');
```

### MeshPhongMaterial Properties

#### `color: Color`
- **Description**: Material color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `emissive: Color`
- **Description**: Emissive color
- **Default**: `0x000000`
- **Type**: `Color`

#### `emissiveIntensity: number`
- **Description**: Emissive intensity
- **Default**: `1`
- **Type**: `number`

#### `specular: Color`
- **Description**: Specular color
- **Default**: `0x111111`
- **Type**: `Color`

```javascript
material.specular.setHex(0x111111); // Dark specularity
material.specular.setHex(0xFFFFFF); // White specularity
```

#### `shininess: number`
- **Description**: Specular shininess (higher = sharper highlights)
- **Default**: `30`
- **Type**: `number`

```javascript
material.shininess = 10;  // Soft highlights
material.shininess = 100; // Sharp highlights
```

#### `envMap: TextureCube | null`
- **Description**: Environment map
- **Default**: `null`
- **Type**: `TextureCube | null`

```javascript
material.envMap = cubeTexture;
```

#### `envMapIntensity: number`
- **Description**: Environment map intensity
- **Default**: `1`
- **Type**: `number`

```javascript
material.envMapIntensity = 0.5; // Subtle reflections
material.envMapIntensity = 2.0; // Strong reflections
```

#### `bumpMap: Texture | null`
- **Description**: Bump map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.bumpMap = textureLoader.load('bump.jpg');
```

#### `bumpScale: number`
- **Description**: Bump map scale
- **Default**: `1`
- **Type**: `number`

```javascript
material.bumpScale = 0.5; // Subtle bumps
material.bumpScale = 2.0; // Strong bumps
```

#### `normalMap: Texture | null`
- **Description**: Normal map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.normalMap = textureLoader.load('normal.jpg');
```

#### `normalScale: Vector2`
- **Description**: Normal map scale
- **Default**: `new Vector2(1, 1)`
- **Type**: `Vector2`

```javascript
material.normalScale.set(0.5, 0.5); // Subtle normals
material.normalScale.set(2.0, 2.0); // Strong normals
```

#### `displacementMap: Texture | null`
- **Description**: Displacement map texture
- **Default**: `null`
- **Type**: `Texture | null`

#### `displacementScale: number`
- **Description**: Displacement scale
- **Default**: `1`
- **Type**: `number`

#### `displacementBias: number`
- **Description**: Displacement bias
- **Default**: `0`
- **Type**: `number`

#### `roughnessMap: Texture | null`
- **Description**: Roughness map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.roughnessMap = textureLoader.load('roughness.jpg');
```

#### `metalnessMap: Texture | null`
- **Description**: Metalness map texture
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.metalnessMap = textureLoader.load('metalness.jpg');
```

#### `emissiveMap: Texture | null`
- **Description**: Emissive map texture
- **Default**: `null`
- **Type**: `Texture | null`

#### `alphaMap: Texture | null`
- **Description**: Alpha map texture
- **Default**: `null`
- **Type**: `Texture | null`

### MeshStandardMaterial Properties

#### `color: Color`
- **Description**: Material color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `metalness: number`
- **Description**: Metalness factor (0 = dielectric, 1 = metallic)
- **Default**: `0`
- **Type**: `number`

```javascript
material.metalness = 0.0; // Non-metallic (plastic, wood, stone)
material.metalness = 1.0; // Fully metallic
material.metalness = 0.5; // Semi-metallic
```

#### `roughness: number`
- **Description**: Surface roughness (0 = smooth, 1 = rough)
- **Default**: `0.5`
- **Type**: `number`

```javascript
material.roughness = 0.0; // Mirror smooth
material.roughness = 1.0; // Very rough
material.roughness = 0.3; // Moderately rough
```

#### `map: Texture | null`
- **Description**: Base color (albedo) map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.map = textureLoader.load('albedo.jpg');
```

#### `normalMap: Texture | null`
- **Description**: Normal map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.normalMap = textureLoader.load('normal.jpg');
```

#### `roughnessMap: Texture | null`
- **Description**: Roughness map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.roughnessMap = textureLoader.load('roughness.jpg');
```

#### `metalnessMap: Texture | null`
- **Description**: Metalness map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.metalnessMap = textureLoader.load('metalness.jpg');
```

#### `aoMap: Texture | null`
- **Description**: Ambient occlusion map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.aoMap = textureLoader.load('ao.jpg');
```

#### `aoMapIntensity: number`
- **Description**: AO map intensity
- **Default**: `1`
- **Type**: `number`

```javascript
material.aoMapIntensity = 1.5;
```

#### `emissive: Color`
- **Description**: Emissive color
- **Default**: `0x000000`
- **Type**: `Color`

#### `emissiveIntensity: number`
- **Description**: Emissive intensity
- **Default**: `1`
- **Type**: `number`

#### `emissiveMap: Texture | null`
- **Description**: Emissive map
- **Default**: `null`
- **Type**: `Texture | null`

```javascript
material.emissiveMap = textureLoader.load('emissive.jpg');
```

#### `bumpMap: Texture | null`
- **Description**: Bump map
- **Default**: `null`
- **Type**: `Texture | null`

#### `bumpScale: number`
- **Description**: Bump scale
- **Default**: `1`
- **Type**: `number`

#### `normalScale: Vector2`
- **Description**: Normal scale
- **Default**: `new Vector2(1, 1)`
- **Type**: `Vector2`

#### `displacementMap: Texture | null`
- **Description**: Displacement map
- **Default**: `null`
- **Type**: `Texture | null`

#### `displacementScale: number`
- **Description**: Displacement scale
- **Default**: `1`
- **Type**: `number`

#### `displacementBias: number`
- **Description**: Displacement bias
- **Default**: `0`
- **Type**: `number`

#### `envMap: TextureCube | null`
- **Description**: Environment map
- **Default**: `null`
- **Type**: `TextureCube | null`

#### `envMapIntensity: number`
- **Description**: Environment map intensity
- **Default**: `1`
- **Type**: `number`

#### `sheen: number`
- **Description**: Sheen intensity
- **Default**: `0`
- **Type**: `number`

```javascript
material.sheen = 0.3;
```

#### `sheenColor: Color`
- **Description**: Sheen color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `sheenRoughness: number`
- **Description**: Sheen roughness
- **Default**: `1`
- **Type**: `number`

```javascript
material.sheenRoughness = 0.5;
```

#### `clearcoat: number`
- **Description**: Clearcoat intensity
- **Default**: `0`
- **Type**: `number`

```javascript
material.clearcoat = 1.0; // Full clearcoat
material.clearcoat = 0.5; // Partial clearcoat
```

#### `clearcoatRoughness: number`
- **Description**: Clearcoat roughness
- **Default**: `0`
- **Type**: `number`

```javascript
material.clearcoatRoughness = 0.1; // Smooth clearcoat
material.clearcoatRoughness = 1.0; // Rough clearcoat
```

#### `iridescence: number`
- **Description**: Iridescence intensity
- **Default**: `0`
- **Type**: `number`

```javascript
material.iridescence = 1.0;
```

#### `iridescenceIOR: number`
- **Description**: Iridescence index of refraction
- **Default**: `1.3`
- **Type**: `number`

```javascript
material.iridescenceIOR = 1.5;
```

#### `iridescenceThicknessRange: Vector2`
- **Description**: Iridescence thickness range
- **Default**: `new Vector2(100, 800)`
- **Type**: `Vector2`

```javascript
material.iridescenceThicknessRange.set(200, 1000);
```

### MeshPhysicalMaterial Properties

#### `color: Color`
- **Description**: Material color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `metalness: number`
- **Description**: Metalness factor
- **Default**: `0`
- **Type**: `number`

#### `roughness: number`
- **Description**: Surface roughness
- **Default**: `0.5`
- **Type**: `number`

#### `transmission: number`
- **Description**: Transmission (for transparent materials)
- **Default**: `0`
- **Type**: `number`

```javascript
material.transmission = 1.0; // Fully transparent
material.transmission = 0.5; // Semi-transparent
```

#### `thickness: number`
- **Description**: Material thickness (for transmission)
- **Default**: `0`
- **Type**: `number`

```javascript
material.thickness = 0.1; // Thin glass
material.thickness = 1.0; // Thick glass
```

#### `ior: number`
- **Description**: Index of refraction
- **Default**: `1.5`
- **Type**: `number`

```javascript
material.ior = 1.0;   // Air
material.ior = 1.5;   // Glass
material.ior = 2.4;   // Diamond
```

#### `specularIntensity: number`
- **Description**: Specular intensity
- **Default**: `0.5`
- **Type**: `number`

```javascript
material.specularIntensity = 1.0; // Strong specular
material.specularIntensity = 0.1; // Weak specular
```

#### `specularColor: Color`
- **Description**: Specular color
- **Default**: `0xffffff`
- **Type**: `Color`

```javascript
material.specularColor.setHex(0xFFDDAA); // Warm specular
material.specularColor.setHex(0xFFFFFF); // White specular
```

#### `transmission: number`
- **Description**: Transmission factor
- **Default**: `0`
- **Type**: `number`

#### `thickness: number`
- **Description**: Material thickness
- **Default**: `0`
- **Type**: `number`

#### `attenuationColor: Color`
- **Description**: Attenuation color for transmission
- **Default**: `0xffffff`
- **Type**: `Color`

```javascript
material.attenuationColor.setHex(0xFFA500); // Orange attenuation
```

#### `attenuationDistance: number`
- **Description**: Attenuation distance for transmission
- **Default**: `Infinity`
- **Type**: `number`

```javascript
material.attenuationDistance = 10; // 10 units
```

#### `clearcoat: number`
- **Description**: Clearcoat intensity
- **Default**: `0`
- **Type**: `number`

#### `clearcoatRoughness: number`
- **Description**: Clearcoat roughness
- **Default**: `0`
- **Type**: `number`

#### `clearcoatIor: number`
- **Description**: Clearcoat index of refraction
- **Default**: `1.5`
- **Type**: `number`

#### `clearcoatNormalScale: Vector2`
- **Description**: Clearcoat normal scale
- **Default**: `new Vector2(1, 1)`
- **Type**: `Vector2`

#### `ior: number`
- **Description**: Index of refraction
- **Default**: `1.5`
- **Type**: `number`

#### `specularIntensity: number`
- **Description**: Specular intensity
- **Default**: `0.5`
- **Type**: `number`

#### `specularColor: Color`
- **Description**: Specular color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `transmission: number`
- **Description**: Transmission
- **Default**: `0`
- **Type**: `number`

#### `thickness: number`
- **Description**: Thickness
- **Default**: `0`
- **Type**: `number`

#### `attenuationColor: Color`
- **Description**: Attenuation color
- **Default**: `0xffffff`
- **Type**: `Color`

#### `attenuationDistance: number`
- **Description**: Attenuation distance
- **Default**: `Infinity`
- **Type**: `number`

## Geometry Properties

### BufferGeometry Properties

#### `attributes: Map<string, BufferAttribute>`
- **Description**: Named geometry attributes
- **Type**: `Map<string, BufferAttribute>`

**Standard attributes:**
- `position` - Vertex positions
- `normal` - Vertex normals
- `uv` - Texture coordinates (layer 0)
- `uv2` - Texture coordinates (layer 1)
- `color` - Vertex colors
- `skinIndex` - Skinning indices
- `skinWeight` - Skinning weights
- `morphPosition` - Morph target positions
- `morphNormal` - Morph target normals
- `morphTargetInfluences` - Morph target influences

```javascript
// Access attributes
const position = geometry.getAttribute('position');
const normal = geometry.getAttribute('normal');
const uv = geometry.getAttribute('uv');

// Check attribute existence
if (geometry.hasAttribute('color')) {
    const color = geometry.getAttribute('color');
}
```

#### `index: BufferAttribute | null`
- **Description**: Index buffer for indexed geometry
- **Type**: `BufferAttribute | null`

```javascript
// Get index buffer
const index = geometry.index;
if (index) {
    console.log(`Index count: ${index.count}`);
    const indices = index.array;
}
```

#### `groups: BufferGeometryGroup[]`
- **Description**: Geometry groups for multi-material rendering
- **Type**: `BufferGeometryGroup[]`

```javascript
// Access groups
geometry.groups.forEach(group => {
    console.log(`Group: start=${group.start}, count=${group.count}, materialIndex=${group.materialIndex}`);
});
```

#### `drawRange: { start: number, count: number }`
- **Description**: Draw range for partial rendering
- **Type**: `Object`

```javascript
// Set draw range
geometry.setDrawRange(0, 100); // Draw first 100 elements

// Get draw range
const range = geometry.drawRange;
console.log(`Draw range: start=${range.start}, count=${range.count}`);
```

#### `boundingBox: Box3 | null`
- **Description**: Computed bounding box
- **Type**: `Box3 | null`

```javascript
// Compute and access bounding box
geometry.computeBoundingBox();
const bbox = geometry.boundingBox;
console.log(`BBox: min=${bbox.min.toArray()}, max=${bbox.max.toArray()}`);
```

#### `boundingSphere: Sphere | null`
- **Description**: Computed bounding sphere
- **Type**: `Sphere | null`

```javascript
// Compute and access bounding sphere
geometry.computeBoundingSphere();
const sphere = geometry.boundingSphere;
console.log(`Sphere: center=${sphere.center.toArray()}, radius=${sphere.radius}`);
```

#### `morphAttributes: Map<string, BufferAttribute[]>`
- **Description**: Morph target attributes
- **Type**: `Map<string, BufferAttribute[]>`

```javascript
// Access morph attributes
const morphPositions = geometry.morphAttributes.position;
const morphNormals = geometry.morphAttributes.normal;

if (morphPositions) {
    morphPositions.forEach((attr, index) => {
        console.log(`Morph target ${index}: ${attr.count} vertices`);
    });
}
```

#### `morphTargetsRelative: boolean`
- **Description**: Are morph targets relative or absolute
- **Default**: `false`
- **Type**: `boolean`

```javascript
geometry.morphTargetsRelative = false; // Absolute positions
geometry.morphTargetsRelative = true;  // Relative offsets
```

#### `morphTargets: BufferAttribute[] | undefined`
- **Description**: Legacy morph targets array
- **Type**: `BufferAttribute[] | undefined`

```javascript
// Legacy morph targets access
const morphTargets = geometry.morphTargets;
if (morphTargets) {
    morphTargets.forEach(target => {
        console.log(`Morph target: ${target.count} vertices`);
    });
}
```

#### `morphNormals: BufferAttribute[] | undefined`
- **Description**: Legacy morph normals array
- **Type**: `BufferAttribute[] | undefined`

```javascript
// Legacy morph normals access
const morphNormals = geometry.morphNormals;
if (morphNormals) {
    morphNormals.forEach(normal => {
        console.log(`Morph normal: ${normal.count} vertices`);
    });
}
```

#### `name: string`
- **Description**: Geometry name
- **Default**: `''`
- **Type**: `string`

```javascript
geometry.name = 'player-head-geometry';
```

#### `id: number`
- **Description**: Unique geometry identifier
- **Type**: `number`

```javascript
console.log(`Geometry ID: ${geometry.id}`);
```

## Camera Properties

### Camera (Base) Properties

#### `position: Vector3`
- **Description**: Camera position in world space
- **Default**: `new Vector3(0, 0, 0)`
- **Type**: `Vector3`

```javascript
camera.position.set(0, 5, 10);
camera.position.x = 0;
camera.position.y = 5;
camera.position.z = 10;
```

#### `up: Vector3`
- **Description**: Camera up direction
- **Default**: `new Vector3(0, 1, 0)`
- **Type**: `Vector3`

```javascript
camera.up.set(0, 0, 1); // Z-up camera
camera.up.set(0, 1, 0); // Y-up camera (default)
```

#### `target: Vector3`
- **Description**: Camera look-at target
- **Default**: `new Vector3(0, 0, 0)`
- **Type**: `Vector3`

```javascript
camera.target.set(10, 0, 0); // Look at point (10, 0, 0)
camera.lookAt(camera.target);
```

#### `near: number`
- **Description**: Near clipping plane distance
- **Default**: `0.1`
- **Type**: `number`

```javascript
camera.near = 0.01;  // Very close near plane
camera.near = 100;   // Very far near plane
```

#### `far: number`
- **Description**: Far clipping plane distance
- **Default**: `2000`
- **Type**: `number`

```javascript
camera.far = 100;    // Short viewing distance
camera.far = 10000;  // Long viewing distance
```

#### `matrix: Matrix4`
- **Description**: View transformation matrix
- **Type**: `Matrix4`

```javascript
camera.updateMatrix();
console.log(camera.matrix);
```

#### `matrixWorld: Matrix4`
- **Description**: World transformation matrix
- **Type**: `Matrix4`

```javascript
camera.updateMatrixWorld();
console.log(camera.matrixWorld);
```

#### `matrixWorldInverse: Matrix4`
- **Description**: Inverse world matrix (view matrix)
- **Type**: `Matrix4`

```javascript
camera.updateMatrixWorld();
camera.updateMatrixWorldInverse();
console.log(camera.matrixWorldInverse);
```

#### `projectionMatrix: Matrix4`
- **Description**: Projection transformation matrix
- **Type**: `Matrix4`

```javascript
camera.updateProjectionMatrix();
console.log(camera.projectionMatrix);
```

#### `projectionMatrixInverse: Matrix4`
- **Description**: Inverse projection matrix
- **Type**: `Matrix4`

```javascript
camera.updateProjectionMatrix();
camera.updateProjectionMatrixInverse();
console.log(camera.projectionMatrixInverse);
```

### PerspectiveCamera Properties

#### `fov: number`
- **Description**: Field of view in degrees
- **Default**: `50`
- **Type**: `number`

```javascript
camera.fov = 75;   // Wide angle
camera.fov = 30;   // Telephoto
camera.fov = 90;   // Very wide angle
```

#### `aspect: number`
- **Description**: Aspect ratio (width / height)
- **Default**: `1`
- **Type**: `number`

```javascript
camera.aspect = window.innerWidth / window.innerHeight;
camera.aspect = 16 / 9; // Widescreen
camera.aspect = 1;      // Square
```

#### `zoom: number`
- **Description**: Zoom factor
- **Default**: `1`
- **Type**: `number`

```javascript
camera.zoom = 2;   // 2x zoom in
camera.zoom = 0.5; // 2x zoom out
camera.zoom = 1;   // Normal zoom
```

### OrthographicCamera Properties

#### `left: number`
- **Description**: Left frustum plane
- **Type**: `number`

#### `right: number`
- **Description**: Right frustum plane
- **Type**: `number`

#### `top: number`
- **Description**: Top frustum plane
- **Type**: `number`

#### `bottom: number`
- **Description**: Bottom frustum plane
- **Type**: `number`

#### `near: number`
- **Description**: Near frustum plane
- **Default**: `0.1`
- **Type**: `number`

#### `far: number`
- **Description**: Far frustum plane
- **Default**: `2000`
- **Type**: `number`

#### `zoom: number`
- **Description**: Zoom factor
- **Default**: `1`
- **Type**: `number`

```javascript
// Create orthographic camera
const orthoCamera = new OrthographicCamera(
    -10, 10,     // left, right
    10, -10,     // top, bottom
    0.1, 1000    // near, far
);
```

#### `viewOffset: Vector4 | null`
- **Description**: View offset for sub-viewports
- **Type**: `Vector4 | null`

```javascript
camera.viewOffset = new Vector4(0, 0, 800, 600); // x, y, width, height
```

## Light Properties

### Light (Base) Properties

#### `color: Color`
- **Description**: Light color
- **Default**: `0xffffff` (white)
- **Type**: `Color`

```javascript
light.color.setHex(0xFF0000); // Red light
light.color.setRGB(1, 0.5, 0); // Orange light
light.color.set('#FFFFFF'); // White light
```

#### `intensity: number`
- **Description**: Light intensity
- **Default**: `1`
- **Type**: `number`

```javascript
light.intensity = 0.5;  // Dim light
light.intensity = 2.0;  // Bright light
light.intensity = 1.0;  // Normal intensity
```

#### `position: Vector3`
- **Description**: Light position
- **Default**: `new Vector3(0, 1, 0)`
- **Type**: `Vector3`

```javascript
light.position.set(10, 10, 5); // Position light
light.position.x = 10;
light.position.y = 10;
light.position.z = 5;
```

#### `target: Object3D | null`
- **Description**: Light target object (for directional/spot lights)
- **Default**: `null`
- **Type**: `Object3D | null`

```javascript
const target = new Object3D();
scene.addObject(target);
spotLight.target = target;
```

#### `castShadow: boolean`
- **Description**: Enable shadow casting
- **Default**: `false`
- **Type**: `boolean`

```javascript
light.castShadow = true;
```

#### `shadow: LightShadow`
- **Description**: Shadow settings
- **Type**: `LightShadow`

```javascript
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 50;
light.shadow.bias = -0.0001;
```

#### `visible: boolean`
- **Description**: Light visibility
- **Default**: `true`
- **Type**: `boolean`

```javascript
light.visible = false; // Hide light
```

#### `name: string`
- **Description**: Light name
- **Default**: `''`
- **Type**: `string`

```javascript
light.name = 'main-sun-light';
```

### AmbientLight Properties

#### `color: Color`
- **Description**: Light color
- **Default**: `0x404040` (dark gray)
- **Type**: `Color`

#### `intensity: number`
- **Description**: Light intensity
- **Default**: `1`
- **Type**: `number`

```javascript
const ambientLight = new AmbientLight(0x404040, 0.4);
```

### DirectionalLight Properties

#### `position: Vector3`
- **Description**: Light direction (normalized vector from origin)
- **Default**: `new Vector3(0, 1, 0)`
- **Type**: `Vector3`

```javascript
directionalLight.position.set(10, 10, 5); // Direction from (10,10,5) towards origin
```

#### `target: Object3D`
- **Description**: Light target for direction calculation
- **Default**: `new Object3D()`
- **Type**: `Object3D`

```javascript
const target = new Vector3(0, 0, 0);
directionalLight.target.position.copy(target);
```

#### `shadow: DirectionalLightShadow`
- **Description**: Directional light shadow settings
- **Type**: `DirectionalLightShadow`

```javascript
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
```

### PointLight Properties

#### `position: Vector3`
- **Description**: Light position
- **Default**: `new Vector3(0, 0, 0)`
- **Type**: `Vector3`

#### `distance: number`
- **Description**: Light distance (0 = infinite)
- **Default**: `0`
- **Type**: `number`

```javascript
pointLight.distance = 10;    // Light reaches 10 units
pointLight.distance = 0;     // Infinite distance
```

#### `decay: number`
- **Description**: Light decay (inverse square law)
- **Default**: `2`
- **Type**: `number`

```javascript
pointLight.decay = 1; // Linear decay
pointLight.decay = 2; // Inverse square decay (realistic)
```

#### `shadow: PointLightShadow`
- **Description**: Point light shadow settings
- **Type**: `PointLightShadow`

```javascript
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.bias = -0.01;
```

### SpotLight Properties

#### `position: Vector3`
- **Description**: Light position
- **Default**: `new Vector3(0, 1, 0)`
- **Type**: `Vector3`

#### `target: Object3D`
- **Description**: Light target
- **Default**: `new Object3D()`
- **Type**: `Object3D`

#### `angle: number`
- **Description**: Spotlight angle in radians
- **Default**: `Math.PI / 3`
- **Type**: `number`

```javascript
spotLight.angle = Math.PI / 6; // Narrow beam (30 degrees)
spotLight.angle = Math.PI / 2; // Wide beam (90 degrees)
```

#### `penumbra: number`
- **Description**: Penumbra angle in radians
- **Default**: `0`
- **Type**: `number`

```javascript
spotLight.penumbra = Math.PI / 12; // Soft edges
spotLight.penumbra = 0;            // Hard edges
```

#### `decay: number`
- **Description**: Light decay
- **Default**: `2`
- **Type**: `number`

#### `distance: number`
- **Description**: Light distance
- **Default**: `0`
- **Type**: `number`

#### `shadow: SpotLightShadow`
- **Description**: Spotlight shadow settings
- **Type**: `SpotLightShadow`

```javascript
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.near = 0.1;
spotLight.shadow.camera.far = 50;
spotLight.shadow.bias = -0.0001;
```

### HemisphereLight Properties

#### `color: Color`
- **Description**: Sky color
- **Default**: `0xffffff`
- **Type**: `Color`

```javascript
const hemiLight = new HemisphereLight(0x87CEEB, 0x8B4513, 0.6);
// skyColor = 0x87CEEB (sky blue)
// groundColor = 0x8B4513 (saddle brown)
```

#### `groundColor: Color`
- **Description**: Ground color
- **Default**: `0x444444`
- **Type**: `Color`

#### `intensity: number`
- **Description**: Light intensity
- **Default**: `1`
- **Type**: `number`

```javascript
hemiLight.intensity = 0.6;
```

## Renderer Properties

### WebGLRenderer Properties

#### `domElement: HTMLCanvasElement`
- **Description**: Canvas element
- **Type**: `HTMLCanvasElement`

```javascript
document.body.appendChild(renderer.domElement);
```

#### `context: WebGLRenderingContext`
- **Description**: WebGL context
- **Type**: `WebGLRenderingContext`

```javascript
const gl = renderer.context;
console.log(`WebGL Version: ${gl.getParameter(gl.VERSION)}`);
```

#### `alpha: boolean`
- **Description**: Enable alpha channel
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.alpha = true; // Enable alpha
renderer.alpha = false; // Disable alpha (better performance)
```

#### `antialias: boolean`
- **Description**: Enable antialiasing
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.antialias = true; // Smooth edges
renderer.antialias = false; // Better performance
```

#### `autoClear: boolean`
- **Description**: Automatically clear buffers
- **Default**: `true`
- **Type**: `boolean`

```javascript
renderer.autoClear = false; // Manual clearing
renderer.autoClear = true;  // Automatic clearing
```

#### `autoClearColor: boolean`
- **Description**: Auto clear color buffer
- **Default**: `true`
- **Type**: `boolean`

#### `autoClearDepth: boolean`
- **Description**: Auto clear depth buffer
- **Default**: `true`
- **Type**: `boolean`

#### `autoClearStencil: boolean`
- **Description**: Auto clear stencil buffer
- **Default**: `true`
- **Type**: `boolean`

#### `sortObjects: boolean`
- **Description**: Sort objects by depth
- **Default**: `true`
- **Type**: `boolean`

```javascript
renderer.sortObjects = false; // Faster rendering, no depth sorting
renderer.sortObjects = true;  // Correct depth rendering
```

#### `clearColor: Color`
- **Description**: Clear color
- **Default**: `0x000000`
- **Type**: `Color`

```javascript
renderer.setClearColor(0x000000, 1); // Black
renderer.setClearColor(0x87CEEB, 1); // Sky blue
```

#### `clearAlpha: number`
- **Description**: Clear alpha
- **Default**: `0`
- **Type**: `number`

#### `toneMapping: ToneMapping`
- **Description**: Tone mapping function
- **Default**: `NoToneMapping`
- **Type**: `number`

```javascript
renderer.toneMapping = 'LinearToneMapping';    // Linear
renderer.toneMapping = 'ReinhardToneMapping';  // Reinhard
renderer.toneMapping = 'CineonToneMapping';    // Cineon
renderer.toneMapping = 'ACESFilmicToneMapping'; // ACES Filmic
```

#### `toneMappingExposure: number`
- **Description**: Tone mapping exposure
- **Default**: `1`
- **Type**: `number`

```javascript
renderer.toneMappingExposure = 1.5; // Brighter
renderer.toneMappingExposure = 0.5; // Darker
```

#### `outputEncoding: TextureEncoding`
- **Description**: Output color space encoding
- **Default**: `LinearEncoding`
- **Type**: `number`

```javascript
renderer.outputEncoding = 'LinearEncoding';         // Linear
renderer.outputEncoding = 'sRGBEncoding';           // sRGB
renderer.outputEncoding = 'ACESFilmicEncoding';     // ACES Filmic
renderer.outputEncoding = ' CineonToneMapping';    // Cineon
```

#### `physicallyCorrectLights: boolean`
- **Description**: Use physically correct lighting
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.physicallyCorrectLights = true; // Accurate lighting
renderer.physicallyCorrectLights = false; // Faster lighting
```

#### `precision: string`
- **Description**: Shader precision
- **Default**: `null` (auto-detect)
- **Type**: `string`

```javascript
renderer.precision = 'highp';  // High precision
renderer.precision = 'mediump'; // Medium precision
renderer.precision = 'lowp';    // Low precision
```

#### `powerPreference: string`
- **Description**: GPU power preference
- **Default**: `'default'`
- **Type**: `string`

```javascript
renderer.powerPreference = 'high-performance'; // Prefer high performance
renderer.powerPreference = 'low-power';       // Prefer low power
renderer.powerPreference = 'default';         // No preference
```

#### `preserveDrawingBuffer: boolean`
- **Description**: Preserve framebuffer between frames
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.preserveDrawingBuffer = true; // For screenshots/video
renderer.preserveDrawingBuffer = false; // Better performance
```

#### `stencil: boolean`
- **Description**: Enable stencil buffer
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.stencil = true; // Enable stencil
renderer.stencil = false; // Disable stencil
```

#### `depth: boolean`
- **Description**: Enable depth buffer
- **Default**: `true`
- **Type**: `boolean`

```javascript
renderer.depth = true;  // Enable depth
renderer.depth = false; // Disable depth (2D rendering)
```

#### `localClippingEnabled: boolean`
- **Description**: Enable local clipping
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.localClippingEnabled = true; // Enable local clipping
```

#### `clippingPlanes: Plane[]`
- **Description**: Global clipping planes
- **Default**: `[]`
- **Type**: `Plane[]`

```javascript
renderer.clippingPlanes = [
    new Plane(new Vector3(0, -1, 0), 0), // Clip below y=0
    new Plane(new Vector3(1, 0, 0), 0)   // Clip left of x=0
];
```

#### `shadows: boolean`
- **Description**: Enable shadow mapping
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = 'PCFSoftShadowMap';
```

#### `shadowMap: ShadowMap`
- **Description**: Shadow mapping settings
- **Type**: `Object`

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = 'BasicShadowMap';      // Fast but blocky
renderer.shadowMap.type = 'PCFShadowMap';        // Standard PCF
renderer.shadowMap.type = 'PCFSoftShadowMap';    // Soft PCF
renderer.shadowMap.type = 'VSMShadowMap';        // Variance shadow maps
```

#### `shadowMap.type: ShadowMapType`
- **Description**: Shadow map filtering type
- **Default**: `PCFShadowMap`
- **Type**: `string`

```javascript
renderer.shadowMap.type = 'BasicShadowMap';
renderer.shadowMap.type = 'PCFShadowMap';
renderer.shadowMap.type = 'PCFSoftShadowMap';
renderer.shadowMap.type = 'VSMShadowMap';
```

#### `shadowMap.autoUpdate: boolean`
- **Description**: Auto update shadow maps
- **Default**: `true`
- **Type**: `boolean`

```javascript
renderer.shadowMap.autoUpdate = false; // Manual shadow map updates
renderer.shadowMap.autoUpdate = true;  // Auto update
```

#### `shadowMap.needsUpdate: boolean`
- **Description**: Mark shadow maps for update
- **Default**: `false`
- **Type**: `boolean`

```javascript
renderer.shadowMap.needsUpdate = true; // Force update
```

#### `xr: WebXRManager`
- **Description**: WebXR manager
- **Type**: `WebXRManager`

```javascript
renderer.xr.enabled = true; // Enable WebXR
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setSession(xrSession);
```

## Mesh Properties

### Mesh Properties

#### `geometry: BufferGeometry`
- **Description**: Mesh geometry
- **Type**: `BufferGeometry`

```javascript
mesh.geometry = new BoxGeometry(1, 1, 1);
```

#### `material: Material | Material[]`
- **Description**: Mesh material(s)
- **Type**: `Material | Material[]`

```javascript
mesh.material = new MeshStandardMaterial({ color: '#FF0000' });
mesh.material = [
    new MeshStandardMaterial({ color: '#FF0000' }), // Front
    new MeshStandardMaterial({ color: '#00FF00' })  // Back
];
```

#### `drawMode: DrawMode`
- **Description**: Geometry draw mode
- **Default**: `TrianglesDrawMode`
- **Type**: `number`

```javascript
mesh.drawMode = 0; // Triangles
mesh.drawMode = 1; // Triangle strip
mesh.drawMode = 2; // Triangle fan
```

#### `count: number`
- **Description**: Number of vertices to draw
- **Default**: `undefined`
- **Type**: `number`

```javascript
mesh.count = 100; // Draw only first 100 vertices
```

#### `frustumCulled: boolean`
- **Description**: Enable frustum culling for this mesh
- **Default**: `true`
- **Type**: `boolean`

```javascript
mesh.frustumCulled = false; // Don't cull this mesh
```

#### `raycast: Function`
- **Description**: Custom raycasting function
- **Default**: `null`
- **Type**: `Function`

```javascript
mesh.raycast = (raycaster, intersects) => {
    // Custom raycasting logic
};
```

#### `morphTargetDictionary: Map<string, number>`
- **Description**: Morph target dictionary
- **Type**: `Map<string, number>`

```javascript
if (mesh.morphTargetDictionary) {
    console.log(Object.keys(mesh.morphTargetDictionary));
}
```

#### `morphTargetInfluences: number[]`
- **Description**: Morph target influence weights
- **Type**: `number[]`

```javascript
if (mesh.morphTargetInfluences) {
    mesh.morphTargetInfluences[0] = 0.5; // 50% influence on morph target 0
}
```

#### `morphTargetsRelative: boolean`
- **Description**: Are morph targets relative
- **Default**: `false`
- **Type**: `boolean`

```javascript
mesh.morphTargetsRelative = false; // Absolute positions
mesh.morphTargetsRelative = true;  // Relative offsets
```

#### `skinIndex: BufferAttribute`
- **Description**: Skinning indices
- **Type**: `BufferAttribute`

#### `skinWeight: BufferAttribute`
- **Description**: Skinning weights
- **Type**: `BufferAttribute`

#### `skeleton: Skeleton | null`
- **Description**: Skeleton for skinned mesh
- **Type**: `Skeleton | null`

```javascript
mesh.skeleton = skeleton;
```

#### `boundingBox: Box3`
- **Description**: Mesh bounding box
- **Type**: `Box3`

```javascript
mesh.computeBoundingBox();
console.log(mesh.boundingBox);
```

#### `boundingSphere: Sphere`
- **Description**: Mesh bounding sphere
- **Type**: `Sphere`

```javascript
mesh.computeBoundingSphere();
console.log(mesh.boundingSphere);
```

#### `id: number`
- **Description**: Unique mesh identifier
- **Type**: `number`

```javascript
console.log(`Mesh ID: ${mesh.id}`);
```

#### `uuid: string`
- **Description**: Unique universal identifier
- **Type**: `string`

```javascript
console.log(`Mesh UUID: ${mesh.uuid}`);
```

#### `name: string`
- **Description**: Mesh name
- **Type**: `string`

```javascript
mesh.name = 'player-mesh';
```

#### `type: string`
- **Description**: Mesh type
- **Type**: `string`

```javascript
console.log(`Mesh type: ${mesh.type}`); // 'Mesh', 'InstancedMesh', etc.
```

#### `parent: Object3D | null`
- **Description**: Parent object
- **Type**: `Object3D | null`

```javascript
console.log(`Parent: ${mesh.parent?.name}`);
```

#### `children: Object3D[]`
- **Description**: Child objects
- **Type**: `Object3D[]`

```javascript
mesh.children.forEach(child => console.log(child.name));
```

#### `position: Vector3`
- **Description**: Mesh position
- **Type**: `Vector3`

```javascript
mesh.position.set(5, 0, 10);
```

#### `rotation: Euler`
- **Description**: Mesh rotation
- **Type**: `Euler`

```javascript
mesh.rotation.set(0, Math.PI / 2, 0);
```

#### `scale: Vector3`
- **Description**: Mesh scale
- **Type**: `Vector3`

```javascript
mesh.scale.set(2, 1, 2); // Stretch in X and Z
```

#### `quaternion: Quaternion`
- **Description**: Mesh rotation (quaternion)
- **Type**: `Quaternion`

```javascript
mesh.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
```

#### `matrix: Matrix4`
- **Description**: Local transformation matrix
- **Type**: `Matrix4`

```javascript
mesh.updateMatrix();
console.log(mesh.matrix);
```

#### `matrixWorld: Matrix4`
- **Description**: World transformation matrix
- **Type**: `Matrix4`

```javascript
mesh.updateMatrixWorld();
console.log(mesh.matrixWorld);
```

#### `matrixAutoUpdate: boolean`
- **Description**: Auto update transformation matrix
- **Default**: `true`
- **Type**: `boolean`

```javascript
mesh.matrixAutoUpdate = false; // Manual matrix updates
```

#### `visible: boolean`
- **Description**: Mesh visibility
- **Default**: `true`
- **Type**: `boolean`

```javascript
mesh.visible = false; // Hide mesh
```

#### `castShadow: boolean`
- **Description**: Cast shadows
- **Default**: `false`
- **Type**: `boolean`

```javascript
mesh.castShadow = true;
```

#### `receiveShadow: boolean`
- **Description**: Receive shadows
- **Default**: `false`
- **Type**: `boolean`

```javascript
mesh.receiveShadow = true;
```

#### `layers: Layers`
- **Description**: Layer membership
- **Type**: `Layers`

```javascript
mesh.layers.set(1); // Layer 1
```

#### `matrixWorldNeedsUpdate: boolean`
- **Description**: Mark world matrix for update
- **Default**: `false`
- **Type**: `boolean`

```javascript
mesh.matrixWorldNeedsUpdate = true; // Force world matrix update
```

#### `userData: Object`
- **Description**: Custom user data
- **Type**: `Object`

```javascript
mesh.userData.health = 100;
mesh.userData.type = 'enemy';
```

#### `id: number`
- **Description**: Unique identifier
- **Type**: `number`

```javascript
console.log(mesh.id);
```

## Texture Properties

### Texture (Base) Properties

#### `image: HTMLImageElement | HTMLCanvasElement | ImageData | ImageBitmap`
- **Description**: Texture image data
- **Type**: `Image | Canvas | ImageData | ImageBitmap`

```javascript
const texture = new Texture(imageElement);
texture.image = newImageElement; // Update image
```

#### `mipmaps: Mipmap[]`
- **Description**: Mipmap levels
- **Type**: `Mipmap[]`

```javascript
texture.generateMipmaps = true;
console.log(`Mipmap levels: ${texture.mipmaps.length}`);
```

#### `flipY: boolean`
- **Description**: Flip texture vertically
- **Default**: `true`
- **Type**: `boolean`

```javascript
texture.flipY = false; // Don't flip
texture.flipY = true;  // Flip (default)
```

#### `generateMipmaps: boolean`
- **Description**: Generate mipmaps automatically
- **Default**: `true`
- **Type**: `boolean`

```javascript
texture.generateMipmaps = false; // Don't generate mipmaps
```

#### `minFilter: FilterMode`
- **Description**: Minification filter
- **Default**: `LinearMipmapLinearFilter`
- **Type**: `number`

```javascript
texture.minFilter = 'NearestFilter';           // No filtering
texture.minFilter = 'LinearFilter';            // Linear
texture.minFilter = 'NearestMipmapNearestFilter'; // Mipmap nearest
texture.minFilter = 'NearestMipmapLinearFilter';  // Mipmap linear
texture.minFilter = 'LinearMipmapNearestFilter';  // Mipmap linear
texture.minFilter = 'LinearMipmapLinearFilter';   // Trilinear (default)
```

#### `magFilter: FilterMode`
- **Description**: Magnification filter
- **Default**: `LinearFilter`
- **Type**: `number`

```javascript
texture.magFilter = 'NearestFilter'; // No filtering (pixelated)
texture.magFilter = 'LinearFilter';  // Linear (smooth, default)
```

#### `wrapS: WrappingMode`
- **Description**: Horizontal wrapping mode
- **Default**: `ClampToEdgeWrapping`
- **Type**: `number`

```javascript
texture.wrapS = 'RepeatWrapping';           // Repeat
texture.wrapS = 'ClampToEdgeWrapping';      // Clamp (default)
texture.wrapS = 'MirroredRepeatWrapping';   // Mirror repeat
```

#### `wrapT: WrappingMode`
- **Description**: Vertical wrapping mode
- **Default**: `ClampToEdgeWrapping`
- **Type**: `number`

```javascript
texture.wrapT = 'RepeatWrapping';
texture.wrapT = 'ClampToEdgeWrapping';
texture.wrapT = 'MirroredRepeatWrapping';
```

#### `encoding: TextureEncoding`
- **Description**: Color space encoding
- **Default**: `LinearEncoding`
- **Type**: `number`

```javascript
texture.encoding = 'LinearEncoding';      // Linear
texture.encoding = 'sRGBEncoding';        // sRGB
texture.encoding = 'LogLuvEncoding';      // LogLuv
texture.encoding = 'RGBM7Encoding';       // RGBM
texture.encoding = 'RGBM16Encoding';      // RGBM16
texture.encoding = 'RGBDEncoding';        // RGBD
texture.encoding = 'LinearSRGBEncoding';  // Linear sRGB
```

#### `format: PixelFormat`
- **Description**: Pixel format
- **Default**: `RGBAFormat`
- **Type**: `number`

```javascript
texture.format = 'RGBAFormat';     // Red, Green, Blue, Alpha
texture.format = 'RGBFormat';      // Red, Green, Blue
texture.format = 'RedFormat';      // Red only
texture.format = 'DepthFormat';    // Depth
texture.format = 'DepthStencilFormat'; // Depth + Stencil
```

#### `type: DataType`
- **Description**: Data type
- **Default**: `UnsignedByteType`
- **Type**: `number`

```javascript
texture.type = 'UnsignedByteType';        // 8-bit unsigned
texture.type = 'ByteType';                // 8-bit signed
texture.type = 'UnsignedShortType';       // 16-bit unsigned
texture.type = 'ShortType';               // 16-bit signed
texture.type = 'UnsignedIntType';         // 32-bit unsigned
texture.type = 'IntType';                 // 32-bit signed
texture.type = 'FloatType';               // 32-bit float
texture.type = 'HalfFloatType';           // 16-bit float
texture.type = 'DoubleType';              // 64-bit double
texture.type = 'UnsignedShort4444Type';   // 16-bit RGBA
texture.type = 'UnsignedShort5551Type';   // 16-bit RGBA
texture.type = 'UnsignedShort565Type';    // 16-bit RGB
```

#### `anisotropy: number`
- **Description**: Anisotropy level
- **Default**: `1`
- **Type**: `number`

```javascript
texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Maximum
texture.anisotropy = 4; // 4x anisotropy
```

#### `compareFunction: CompareFunction`
- **Description**: Depth comparison function
- **Default**: `LessEqualCompare`
- **Type**: `number`

```javascript
texture.compareFunction = 'NeverCompare';        // Never pass
texture.compareFunction = 'LessEqualCompare';    // Pass if less or equal (default)
texture.compareFunction = 'LessCompare';         // Pass if less
texture.compareFunction = 'EqualCompare';        // Pass if equal
texture.compareFunction = 'GreaterCompare';      // Pass if greater
texture.compareFunction = 'GreaterEqualCompare'; // Pass if greater or equal
texture.compareFunction = 'AlwaysCompare';       // Always pass
```

#### `compareMode: CompareMode`
- **Description**: Comparison mode
- **Default**: `NoneCompareMode`
- **Type**: `number`

```javascript
texture.compareMode = 'NoneCompareMode';    // No comparison (default)
texture.compareMode = 'CompareRefToTexture'; // Compare with texture
```

#### `matrix3: Matrix3`
- **Description**: Texture transformation matrix
- **Type**: `Matrix3`

```javascript
texture.matrix3.set(
    1, 0, 0,  // Scale X, skew Y, translate X
    0, 1, 0,  // skew X, scale Y, translate Y
    0, 0, 1   // Always 0, 0, 1
);
```

#### `offset: Vector2`
- **Description**: Texture offset
- **Default**: `new Vector2(0, 0)`
- **Type**: `Vector2`

```javascript
texture.offset.set(0.5, 0.5); // Offset to center
```

#### `repeat: Vector2`
- **Description**: Texture repeat
- **Default**: `new Vector2(1, 1)`
- **Type**: `Vector2`

```javascript
texture.repeat.set(2, 2);     // Repeat 2x2
texture.repeat.set(0.5, 0.5); // Stretch to half size
```

#### `center: Vector2`
- **Description**: Texture center for rotation
- **Default**: `new Vector2(0, 0)`
- **Type**: `Vector2`

```javascript
texture.center.set(0.5, 0.5); // Rotate around center
```

#### `rotation: number`
- **Description**: Texture rotation in radians
- **Default**: `0`
- **Type**: `number`

```javascript
texture.rotation = Math.PI / 2; // 90 degrees
texture.rotation = Math.PI;     // 180 degrees
```

#### `premultiplyAlpha: boolean`
- **Description**: Premultiply alpha
- **Default**: `true`
- **Type**: `boolean`

```javascript
texture.premultiplyAlpha = false; // Don't premultiply
texture.premultiplyAlpha = true;  // Premultiply (default)
```

#### `unpackAlignment: number`
- **Description**: Unpacking alignment
- **Default**: `4`
- **Type**: `number`

```javascript
texture.unpackAlignment = 1; // 1-byte alignment
texture.unpackAlignment = 4; // 4-byte alignment (default)
texture.unpackAlignment = 8; // 8-byte alignment
```

#### `needsUpdate: boolean`
- **Description**: Mark texture for GPU upload
- **Default**: `true` (initially), `false` (after upload)
- **Type**: `boolean`

```javascript
texture.needsUpdate = true; // Force GPU upload
```

#### `name: string`
- **Description**: Texture name
- **Type**: `string`

```javascript
texture.name = 'diffuse-texture';
```

#### `id: number`
- **Description**: Unique texture identifier
- **Type**: `number`

```javascript
console.log(`Texture ID: ${texture.id}`);
```

#### `uuid: string`
- **Description**: Unique universal identifier
- **Type**: `string`

```javascript
console.log(`Texture UUID: ${texture.uuid}`);
```

### CubeTexture Properties

#### `images: (HTMLImageElement | HTMLCanvasElement | ImageData)[]`
- **Description**: Cube face images
- **Type**: `Image[]`

```javascript
cubeTexture.images = [
    imagePosX, // +X
    imageNegX, // -X
    imagePosY, // +Y
    imageNegY, // -Y
    imagePosZ, // +Z
    imageNegZ  // -Z
];
```

#### `mapping: MappingMode`
- **Description**: Cube mapping mode
- **Default**: `CubeReflectionMapping`
- **Type**: `number`

```javascript
cubeTexture.mapping = 'CubeReflectionMapping'; // Reflection (default)
cubeTexture.mapping = 'CubeRefractionMapping'; // Refraction
cubeTexture.mapping = 'EquirectangularReflectionMapping'; // Equirectangular
cubeTexture.mapping = 'EquirectangularRefractionMapping';  // Equirectangular refraction
```

## Animation Properties

### AnimationMixer Properties

#### `root: Object3D`
- **Description**: Root object for animation
- **Type**: `Object3D`

```javascript
const mixer = new AnimationMixer(model);
console.log(mixer.root);
```

#### `time: number`
- **Description**: Current animation time
- **Type**: `number`

```javascript
console.log(`Animation time: ${mixer.time}`);
```

#### `timeScale: number`
- **Description**: Global time scale
- **Default**: `1`
- **Type**: `number`

```javascript
mixer.timeScale = 0.5; // Half speed
mixer.timeScale = 2.0; // Double speed
mixer.timeScale = 1.0; // Normal speed
```

### AnimationAction Properties

#### `mixer: AnimationMixer`
- **Description**: Animation mixer
- **Type**: `AnimationMixer`

#### `track: AnimationTrack`
- **Description**: Animation track
- **Type**: `AnimationTrack`

#### `localRoot: Object3D`
- **Description**: Local root object
- **Type**: `Object3D`

#### `clips: AnimationClip[]`
- **Description**: Animation clips
- **Type**: `AnimationClip[]`

#### `enabled: boolean`
- **Description**: Animation enabled
- **Default**: `true`
- **Type**: `boolean`

```javascript
action.enabled = false; // Disable animation
action.enabled = true;  // Enable animation
```

#### `paused: boolean`
- **Description**: Animation paused
- **Default**: `false`
- **Type**: `boolean`

```javascript
action.paused = true; // Pause animation
action.paused = false; // Resume animation
```

#### `loop: LoopMode`
- **Description**: Animation loop mode
- **Default**: `LoopRepeat`
- **Type**: `number`

```javascript
action.loop = 'LoopOnce';      // Play once
action.loop = 'LoopRepeat';    // Loop forever (default)
action.loop = 'LoopPingPong';  // Loop forward then backward
```

#### `time: number`
- **Description**: Animation time
- **Type**: `number`

#### `timeScale: number`
- **Description**: Animation time scale
- **Default**: `1`
- **Type**: `number`

```javascript
action.timeScale = 0.5; // Half speed
action.timeScale = 2.0; // Double speed
```

#### `weight: number`
- **Description**: Animation weight
- **Default**: `1`
- **Type**: `number`

```javascript
action.weight = 0.5; // 50% influence
action.weight = 1.0; // 100% influence
action.weight = 0.0; // 0% influence (disabled)
```

#### `effectiveWeight: number`
- **Description**: Effective weight (weight * enabled)
- **Type**: `number`

```javascript
console.log(`Effective weight: ${action.effectiveWeight}`);
```

#### `effectiveTimeScale: number`
- **Description**: Effective time scale (timeScale * paused)
- **Type**: `number`

```javascript
console.log(`Effective time scale: ${action.effectiveTimeScale}`);
```

#### `localRoots: Object3D[]`
- **Description**: Local root objects
- **Type**: `Object3D[]`

#### `tracks: AnimationTrack[]`
- **Description**: Animation tracks
- **Type**: `AnimationTrack[]`

#### `interpolant: Interpolant`
- **Description**: Interpolant for smooth transitions
- **Type**: `Interpolant`

#### `interpolants: Interpolant[]`
- **Description**: Interpolants array
- **Type**: `Interpolant[]`

#### `method: InterpolateLinear`
- **Description**: Interpolation method
- **Type**: `number`

```javascript
action.method = 'InterpolateLinear';    // Linear interpolation (default)
action.method = 'InterpolateDiscrete';  // Discrete interpolation
action.method = 'InterpolateCubic';     // Cubic interpolation
```

#### `result: AnimationObjectGroup`
- **Description**: Animation result
- **Type**: `AnimationObjectGroup`

#### `mutable: boolean`
- **Description**: Animation is mutable
- **Default**: `true`
- **Type**: `boolean`

```javascript
action.mutable = false; // Read-only
action.mutable = true;  // Read/write (default)
```

## Physics Properties

### RigidBody Properties

#### `shape: CollisionShape`
- **Description**: Collision shape
- **Type**: `CollisionShape`

#### `mass: number`
- **Description**: Object mass
- **Default**: `0` (static)
- **Type**: `number`

```javascript
rigidBody.mass = 1.0;   // Dynamic object
rigidBody.mass = 0.0;   // Static object
rigidBody.mass = -1.0;  // Kinematic object
```

#### `position: Vector3`
- **Description**: Body position
- **Type**: `Vector3`

#### `rotation: Quaternion`
- **Description**: Body rotation
- **Type**: `Quaternion`

#### `velocity: Vector3`
- **Description**: Linear velocity
- **Type**: `Vector3`

```javascript
rigidBody.velocity.set(10, 0, 0); // Move at 10 units/sec in X
```

#### `angularVelocity: Vector3`
- **Description**: Angular velocity
- **Type**: `Vector3`

```javascript
rigidBody.angularVelocity.set(0, 5, 0); // Rotate at 5 rad/sec around Y
```

#### `isStatic: boolean`
- **Description**: Static body flag
- **Default**: `false`
- **Type**: `boolean`

```javascript
rigidBody.isStatic = true;  // Static body
rigidBody.isStatic = false; // Dynamic body
```

#### `isKinematic: boolean`
- **Description**: Kinematic body flag
- **Default**: `false`
- **Type**: `boolean`

```javascript
rigidBody.isKinematic = true;  // Kinematic body
rigidBody.isKinematic = false; // Dynamic body
```

#### `friction: number`
- **Description**: Friction coefficient
- **Default**: `0.3`
- **Type**: `number`

```javascript
rigidBody.friction = 0.1; // Low friction (slippery)
rigidBody.friction = 1.0; // High friction (sticky)
```

#### `restitution: number`
- **Description**: Bounciness (0-1)
- **Default**: `0.3`
- **Type**: `number`

```javascript
rigidBody.restitution = 0.0; // No bounce
rigidBody.restitution = 1.0; // Perfectly bouncy
rigidBody.restitution = 0.5; // Semi-bouncy
```

#### `linearDamping: number`
- **Description**: Linear damping
- **Default**: `0.01`
- **Type**: `number`

```javascript
rigidBody.linearDamping = 0.0;  // No damping
rigidBody.linearDamping = 0.5;  // Strong damping
```

#### `angularDamping: number`
- **Description**: Angular damping
- **Default**: `0.01`
- **Type**: `number`

```javascript
rigidBody.angularDamping = 0.0;  // No angular damping
rigidBody.angularDamping = 0.5;  // Strong angular damping
```

#### `gravity: Vector3`
- **Description**: Gravity acceleration
- **Default**: `new Vector3(0, -9.81, 0)`
- **Type**: `Vector3`

```javascript
physicsWorld.gravity.set(0, -9.81, 0); // Earth gravity
physicsWorld.gravity.set(0, -1.62, 0); // Moon gravity
physicsWorld.gravity.set(0, 0, 0);     // No gravity
```

This comprehensive property reference covers all configurable properties across the Ninth.js library. Each property includes its default value, type, and practical usage examples to help developers understand and utilize the full capabilities of the library.