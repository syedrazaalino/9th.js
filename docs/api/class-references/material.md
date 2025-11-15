# Material Class Reference

The `Material` class is the base class for all materials in Ninth.js. It manages shader programs, material properties, textures, and rendering state.

## Constructor

```javascript
new Material(shader)
```

Creates a new material with an optional shader.

**Parameters:**
- `shader?: Shader` - Optional shader program

**Example:**
```javascript
// Create material with default shader
const material = new Material();

// Create material with custom shader
const customShader = new Shader(vertexSource, fragmentSource);
const material = new Material(customShader);
```

## Properties

### `shader: Shader | null`
- **Description**: Associated shader program
- **Type**: `Shader | null`
- **Default**: `null`

```javascript
// Set custom shader
material.shader = new Shader(vertexSource, fragmentSource);

// Check if material has shader
if (material.shader) {
    console.log('Material has shader:', material.shader.id);
}
```

### `properties: Map<string, any>`
- **Description**: Material properties storage
- **Type**: `Map<string, any>`
- **Read-only**: Yes (modify via methods)

**Common properties:**
- `color` - Base color
- `opacity` - Opacity value (0-1)
- `transparent` - Transparency flag
- `side` - Render side
- `blending` - Blending mode
- `depthTest` - Depth test flag
- `depthWrite` - Depth write flag

```javascript
// Access properties
const color = material.getProperty('color');
const opacity = material.getProperty('opacity');

// Set properties
material.setProperty('color', new Color(1, 0, 0));
material.setProperty('opacity', 0.8);
```

### `textures: Map<string, TextureBinding>`
- **Description**: Texture bindings for the material
- **Type**: `Map<string, TextureBinding>`
- **Read-only**: Yes (modify via methods)

**TextureBinding structure:**
```javascript
{
    texture: WebGLTexture,  // WebGL texture object
    unit: number,           // Texture unit
    needsUpdate: boolean    // Update flag
}
```

```javascript
// Add texture
const texture = new Texture();
material.setTexture('diffuse', texture, 0);

// Access texture binding
const textureBinding = material.textures.get('diffuse');
if (textureBinding) {
    console.log(`Texture unit: ${textureBinding.unit}`);
}
```

### `blending: BlendingSettings`
- **Description**: Blending configuration
- **Type**: `Object`
- **Default**: `{ enabled: false, srcFactor: null, dstFactor: null, equation: null }`

**BlendingSettings properties:**
- `enabled: boolean` - Enable blending
- `srcFactor: BlendingFactor` - Source blending factor
- `dstFactor: BlendingFactor` - Destination blending factor
- `equation: BlendingEquation` - Blending equation

**Blending factors:**
- `Zero` - (0, 0, 0, 0)
- `One` - (1, 1, 1, 1)
- `SrcColor` - (Rs, Gs, Bs, As)
- `OneMinusSrcColor` - (1-Rs, 1-Gs, 1-Bs, 1-As)
- `SrcAlpha` - (As, As, As, As)
- `OneMinusSrcAlpha` - (1-As, 1-As, 1-As, 1-As)
- `DstColor` - (Rd, Gd, Bd, Ad)
- `OneMinusDstColor` - (1-Rd, 1-Gd, 1-Bd, 1-Ad)
- `DstAlpha` - (Ad, Ad, Ad, Ad)
- `OneMinusDstAlpha` - (1-Ad, 1-Ad, 1-Ad, 1-Ad)

```javascript
// Enable normal alpha blending
material.blending.enabled = true;
material.blending.srcFactor = 'SrcAlpha';
material.blending.dstFactor = 'OneMinusSrcAlpha';
material.blending.equation = 'Add';

// Additive blending for glow effects
material.blending.enabled = true;
material.blending.srcFactor = 'One';
material.blending.dstFactor = 'One';
material.blending.equation = 'Add';
```

### `depthTest: boolean`
- **Description**: Enable depth testing
- **Type**: `boolean`
- **Default**: `true`

```javascript
// Disable depth testing for overlay effects
material.depthTest = false;

// Enable depth testing (default)
material.depthTest = true;
```

### `depthWrite: boolean`
- **Description**: Enable depth writing
- **Type**: `boolean`
- **Default**: `true`

```javascript
// Prevent depth writing for transparent materials
material.transparent = true;
material.depthWrite = false;

// Enable depth writing (default)
material.depthWrite = true;
```

### `transparent: boolean`
- **Description**: Material is transparent
- **Type**: `boolean`
- **Default**: `false`

```javascript
// Make material transparent
material.transparent = true;
material.opacity = 0.7;

// For mixed opaque/transparent objects
if (material.opacity < 1.0 || material.transparent) {
    material.transparent = true;
}
```

### `opacity: number`
- **Description**: Material opacity
- **Type**: `number`
- **Range**: 0.0 (transparent) to 1.0 (opaque)
- **Default**: `1.0`

```javascript
// Set opacity
material.opacity = 0.8;

// Fade animation
material.opacity = Math.sin(time) * 0.5 + 0.5;
```

### `cullFace: boolean`
- **Description**: Enable face culling
- **Type**: `boolean`
- **Default**: `true`

```javascript
// Disable culling for double-sided rendering
material.cullFace = false;

// Enable culling (default)
material.cullFace = true;
```

### `cullFaceMode: CullFaceMode`
- **Description**: Which faces to cull
- **Type**: `string`
- **Default**: `'back'`

**Available modes:**
- `'front'` - Cull front faces
- `'back'` - Cull back faces (default)
- `'frontAndBack'` - Cull all faces

```javascript
// Cull front faces for inside-out geometry
material.cullFace = true;
material.cullFaceMode = 'front';
```

### `id: number`
- **Description**: Unique material identifier
- **Type**: `number`
- **Read-only**: Yes

```javascript
console.log(`Material ID: ${material.id}`);

// Use ID for material caching
const materialCache = new Map();
if (!materialCache.has(material.id)) {
    materialCache.set(material.id, material);
}
```

### `needsUpdate: boolean`
- **Description**: Material needs GPU update
- **Type**: `boolean`
- **Default**: `true`
- **Read-only**: Yes

```javascript
// Check if material needs update
if (material.needsUpdate) {
    console.log('Material properties changed, GPU update required');
}

// Reset update flag after update
material.needsUpdate = false;
```

## Methods

### `setProperty(name, value)`
Set a material property.

**Parameters:**
- `name: string` - Property name
- `value: any` - Property value

**Example:**
```javascript
// Set individual properties
material.setProperty('color', new Color(1, 0, 0));
material.setProperty('opacity', 0.8);
material.setProperty('transparent', true);
material.setProperty('side', 'double');

// Set custom properties
material.setProperty('customValue', 42);
material.setProperty('customData', { x: 10, y: 20 });
```

### `getProperty(name)`
Get a material property.

**Parameters:**
- `name: string` - Property name

**Returns:** `any` - Property value or undefined

**Example:**
```javascript
// Get properties
const color = material.getProperty('color');
const opacity = material.getProperty('opacity');
const custom = material.getProperty('customValue');

console.log(`Opacity: ${opacity}`);
console.log(`Custom: ${custom}`);
```

### `setProperties(properties)`
Set multiple properties at once.

**Parameters:**
- `properties: Object` - Object with property name-value pairs

**Example:**
```javascript
// Batch property setting
material.setProperties({
    color: '#FF0000',
    opacity: 0.8,
    transparent: true,
    side: 'double',
    roughness: 0.5,
    metalness: 0.2
});

// Update from object
const settings = {
    color: new Color(0, 1, 0),
    opacity: 0.6,
    transparent: false
};
material.setProperties(settings);
```

### `setUniform(name, value)`
Set a uniform value in the shader.

**Parameters:**
- `name: string` - Uniform name
- `value: any` - Uniform value

**Supported value types:**
- `number` - Float/int uniforms
- `Vector2` - 2D vector uniforms
- `Vector3` - 3D vector uniforms
- `Vector4` - 4D vector uniforms
- `Matrix3` - 3x3 matrix uniforms
- `Matrix4` - 4x4 matrix uniforms
- `Color` - Color uniforms
- `Texture` - Texture uniforms
- `number[]` - Float/int array uniforms

**Example:**
```javascript
// Set various uniform types
material.setUniform('time', performance.now() * 0.001);
material.setUniform('color', new Color(1, 0, 0));
material.setUniform('position', new Vector3(10, 0, 0));
material.setUniform('transformation', new Matrix4());
material.setUniform('texture', myTexture);
material.setUniform('floatArray', [1.0, 2.0, 3.0, 4.0]);
```

### `getUniform(name)`
Get a uniform value from the shader.

**Parameters:**
- `name: string` - Uniform name

**Returns:** `any` - Uniform value or null

**Example:**
```javascript
// Get uniform value
const time = material.getUniform('time');
const color = material.getUniform('color');

if (color) {
    console.log(`Color: ${color.r}, ${color.g}, ${color.b}`);
}
```

### `setTexture(name, texture, unit?)`
Set a texture for the material.

**Parameters:**
- `name: string` - Texture name/uniform name
- `texture: Texture` - Texture object
- `unit?: number` - Texture unit (default: 0)

**Example:**
```javascript
// Set diffuse texture
const diffuseTexture = textureLoader.load('diffuse.jpg');
material.setTexture('diffuse', diffuseTexture, 0);

// Set multiple textures
material.setTexture('normal', normalTexture, 1);
material.setTexture('roughness', roughnessTexture, 2);
material.setTexture('metalness', metalnessTexture, 3);

// Auto-assign texture unit
material.setTexture('emissive', emissiveTexture); // Uses next available unit
```

### `removeTexture(name)`
Remove a texture from the material.

**Parameters:**
- `name: string` - Texture name to remove

**Example:**
```javascript
// Remove texture
material.removeTexture('diffuse');

// Remove all textures
material.textures.forEach((binding, name) => {
    material.removeTexture(name);
});
```

### `hasTexture(name)`
Check if material has a texture.

**Parameters:**
- `name: string` - Texture name

**Returns:** `boolean` - True if texture exists

**Example:**
```javascript
// Check texture existence
if (material.hasTexture('diffuse')) {
    console.log('Material has diffuse texture');
}

// Set fallback if texture missing
if (!material.hasTexture('normal')) {
    material.setTexture('normal', defaultNormalTexture);
}
```

### `clone()`
Clone the material.

**Returns:** `Material` - New material instance

**Example:**
```javascript
// Clone material for reuse
const originalMaterial = new MeshStandardMaterial({
    color: '#FF0000',
    roughness: 0.5
});

// Create multiple instances with same properties
const material1 = originalMaterial.clone();
const material2 = originalMaterial.clone();
const material3 = originalMaterial.clone();

// Modify clones independently
material1.color.setHex(0x00FF00); // Green
material2.color.setHex(0x0000FF); // Blue
```

### `copy(source)`
Copy properties from another material.

**Parameters:**
- `source: Material` - Material to copy from

**Example:**
```javascript
// Copy properties from another material
const sourceMaterial = new MeshStandardMaterial({ color: '#FF0000' });
const targetMaterial = new MeshBasicMaterial();

targetMaterial.copy(sourceMaterial);
console.log(targetMaterial.getProperty('color')); // Same as source
```

### `dispose()`
Clean up material resources.

**Example:**
```javascript
// Dispose material when no longer needed
material.dispose();

// Proper cleanup sequence
scene.traverse((object) => {
    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
        } else {
            object.material.dispose();
        }
    }
});
```

### `needsUpdate()`
Mark material as needing GPU update.

**Example:**
```javascript
// Manually mark for update after property changes
material.setProperty('color', new Color(1, 0, 0));
material.needsUpdate = true;

// Check if update needed
if (material.needsUpdate) {
    // Update GPU state
    material.update();
    material.needsUpdate = false;
}
```

### `bind(program)`
Bind material to a shader program.

**Parameters:**
- `program: WebGLProgram` - Shader program

**Example:**
```javascript
// Bind material uniforms to program
material.bind(myProgram);

// This sets all uniforms and textures for the program
```

### `unbind()`
Unbind material from current program.

**Example:**
```javascript
// Unbind material
material.unbind();

// Reset GPU state if needed
```

### `setBlendingMode(mode)`
Set predefined blending mode.

**Parameters:**
- `mode: BlendingMode` - Blending mode preset

**Available modes:**
- `'normal'` - Standard alpha blending
- `'additive'` - Additive blending
- `'subtractive'` - Subtractive blending
- `'multiply'` - Multiply blending
- `'screen'` - Screen blending

**Example:**
```javascript
// Set blending modes
material.setBlendingMode('normal');    // Alpha blending
material.setBlendingMode('additive');  // Glow effects
material.setBlendingMode('multiply');  // Shadows
material.setBlendingMode('screen');    // Highlights
```

### `setSide(side)`
Set which faces to render.

**Parameters:**
- `side: Side` - Face side to render

**Available sides:**
- `'front'` - Render front faces only
- `'back'` - Render back faces only
- `'double'` - Render both sides

**Example:**
```javascript
// Render all faces
material.setSide('double');

// Render front faces only
material.setSide('front');

// Render back faces only (for inside-out objects)
material.setSide('back');
```

## Utility Methods

### `toJSON()`
Convert material to JSON format.

**Returns:** `Object` - Material properties as JSON

```javascript
const materialData = material.toJSON();
console.log('Material JSON:', JSON.stringify(materialData, null, 2));
```

### `fromJSON(data)`
Load material from JSON data.

**Parameters:**
- `data: Object` - Material JSON data

```javascript
// Save/load material
const savedMaterial = material.toJSON();
localStorage.setItem('material', JSON.stringify(savedMaterial));

// Later, restore material
const savedData = JSON.parse(localStorage.getItem('material'));
const restoredMaterial = new Material().fromJSON(savedData);
```

### `validate()`
Validate material configuration.

**Returns:** `ValidationResult` - Validation results

```javascript
const validation = material.validate();
if (!validation.valid) {
    console.warn('Material validation errors:', validation.errors);
}
```

## Event System

Materials emit events when properties change:

### `propertyChanged`
Fired when a property is modified.

```javascript
material.on('propertyChanged', (data) => {
    console.log(`Property "${data.name}" changed from ${data.oldValue} to ${data.value}`);
});
```

### `textureChanged`
Fired when a texture is added/removed.

```javascript
material.on('textureChanged', (data) => {
    console.log(`Texture "${data.name}" ${data.action}`);
});
```

### `dispose`
Fired when material is disposed.

```javascript
material.on('dispose', () => {
    console.log(`Material ${material.id} disposed`);
});
```

## Complete Usage Examples

### Basic Material Setup
```javascript
// Create a standard PBR material
const material = new MeshStandardMaterial({
    color: '#3498DB',
    metalness: 0.2,
    roughness: 0.5,
    transparent: false,
    opacity: 1.0
});

// Set additional properties
material.setProperties({
    envMapIntensity: 1.0,
    normalScale: new Vector2(1, 1),
    aoMapIntensity: 1.0
});

// Set textures
material.setTexture('diffuse', diffuseTexture, 0);
material.setTexture('normal', normalTexture, 1);
material.setTexture('roughness', roughnessTexture, 2);
material.setTexture('metalness', metalnessTexture, 3);
material.setTexture('ao', aoTexture, 4);
```

### Animated Material
```javascript
// Create animated material
const animatedMaterial = new ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    uniforms: {
        time: { value: 0 },
        color1: { value: new Color(1, 0, 0) },
        color2: { value: new Color(0, 0, 1) }
    }
});

// Animation loop
function animateMaterial(time) {
    animatedMaterial.setUniform('time', time * 0.001);
    
    // Animate colors
    const t = (Math.sin(time * 0.001) + 1) * 0.5;
    animatedMaterial.setUniform('color1', new Color(t, 0, 1 - t));
    animatedMaterial.setUniform('color2', new Color(1 - t, t, 0));
}
```

### Material Library/Sharing
```javascript
// Material library for sharing across objects
class MaterialLibrary {
    constructor() {
        this.materials = new Map();
    }
    
    getMaterial(id, materialData) {
        if (!this.materials.has(id)) {
            const material = this.createMaterialFromData(materialData);
            this.materials.set(id, material);
        }
        return this.materials.get(id);
    }
    
    createMaterialFromData(data) {
        switch (data.type) {
            case 'basic':
                return new MeshBasicMaterial(data.properties);
            case 'lambert':
                return new MeshLambertMaterial(data.properties);
            case 'phong':
                return new MeshPhongMaterial(data.properties);
            case 'standard':
                return new MeshStandardMaterial(data.properties);
            case 'physical':
                return new MeshPhysicalMaterial(data.properties);
            default:
                return new Material();
        }
    }
    
    dispose() {
        this.materials.forEach(material => material.dispose());
        this.materials.clear();
    }
}

// Usage
const materialLibrary = new MaterialLibrary();

// Get shared material
const redPlasticMaterial = materialLibrary.getMaterial('red-plastic', {
    type: 'phong',
    properties: {
        color: '#FF0000',
        shininess: 30,
        specular: '#111111'
    }
});

// Apply to multiple objects
object1.material = redPlasticMaterial;
object2.material = redPlasticMaterial;
object3.material = redPlasticMaterial;
```

### Performance Material Management
```javascript
class MaterialManager {
    constructor() {
        this.materialPool = [];
        this.usedMaterials = new Set();
    }
    
    acquire(materialData) {
        // Reuse disposed materials
        const reusable = this.materialPool.find(m => 
            !this.usedMaterials.has(m) && 
            this.matchesRequirements(m, materialData)
        );
        
        if (reusable) {
            this.usedMaterials.add(reusable);
            this.updateMaterialFromData(reusable, materialData);
            return reusable;
        }
        
        // Create new material
        const material = this.createMaterialFromData(materialData);
        this.usedMaterials.add(material);
        return material;
    }
    
    release(material) {
        if (this.usedMaterials.has(material)) {
            this.usedMaterials.delete(material);
            this.materialPool.push(material);
        }
    }
    
    disposeUnused() {
        // Dispose materials that haven't been used recently
        const unused = Array.from(this.usedMaterials).filter(material => 
            !material.hasActiveReferences()
        );
        
        unused.forEach(material => {
            this.usedMaterials.delete(material);
            material.dispose();
        });
    }
}
```

## Best Practices

1. **Texture Units**: Manage texture units carefully to avoid conflicts
2. **Property Caching**: Avoid redundant property updates
3. **Material Sharing**: Share materials between similar objects to save memory
4. **Disposal**: Always dispose materials when no longer needed
5. **Uniform Updates**: Minimize uniform updates per frame
6. **Blending**: Use appropriate blending modes for transparency effects
7. **Culling**: Configure face culling based on geometry requirements
8. **Validation**: Validate material configurations during development

## Common Patterns

### Material Factory Pattern
```javascript
class MaterialFactory {
    static createDefaultMaterial(type, color) {
        const baseProps = {
            color: color || '#FFFFFF',
            transparent: false,
            opacity: 1.0
        };
        
        switch (type) {
            case 'opaque':
                return new MeshStandardMaterial({ ...baseProps, roughness: 0.5 });
            case 'glass':
                return new MeshPhysicalMaterial({ 
                    ...baseProps, 
                    transmission: 1.0, 
                    thickness: 0.1 
                });
            case 'metal':
                return new MeshStandardMaterial({ 
                    ...baseProps, 
                    metalness: 1.0, 
                    roughness: 0.2 
                });
            default:
                return new MeshBasicMaterial(baseProps);
        }
    }
}
```

### Material Animation Pattern
```javascript
class MaterialAnimator {
    constructor(material) {
        this.material = material;
        this.animations = [];
        this.running = false;
    }
    
    addPropertyAnimation(property, keyframes) {
        this.animations.push({
            property,
            keyframes,
            currentTime: 0,
            duration: keyframes[keyframes.length - 1].time
        });
    }
    
    start() {
        this.running = true;
        this.animate();
    }
    
    stop() {
        this.running = false;
    }
    
    animate() {
        if (!this.running) return;
        
        const time = performance.now() * 0.001;
        
        this.animations.forEach(anim => {
            const value = this.interpolateKeyframes(anim.keyframes, time);
            this.material.setProperty(anim.property, value);
        });
        
        requestAnimationFrame(() => this.animate());
    }
    
    interpolateKeyframes(keyframes, time) {
        // Implementation of keyframe interpolation
        // ... (simplified for brevity)
        return keyframes[0].value;
    }
}
```

The Material class provides the foundation for all visual appearance in Ninth.js, offering comprehensive control over shader programs, properties, textures, and rendering state.