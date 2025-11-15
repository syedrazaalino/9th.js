# Advanced Material System

A comprehensive material system for 3D rendering with physically-based rendering (PBR) support, built for WebGL applications.

## Overview

The material system provides a complete range of materials from basic unlit shaders to advanced physically-based rendering materials. Each material is designed for specific use cases and includes comprehensive texture mapping, lighting models, and material property management.

## Materials

### 1. MeshBasicMaterial

Unlit material that renders colors without lighting calculations. Perfect for UI elements, debugging, and non-realistic rendering.

**Features:**
- No lighting calculations
- Vertex color support
- Alpha testing
- Transparency support

**Usage:**
```javascript
import { MeshBasicMaterial } from './materials/MeshBasicMaterial.js';

const material = new MeshBasicMaterial({
  color: '#ff0000',
  opacity: 1.0,
  transparent: false,
  alphaTest: 0.5
});
```

**Properties:**
- `color`: Base color (RGB array or hex string)
- `opacity`: Opacity value (0.0 to 1.0)
- `transparent`: Enable transparency
- `alphaTest`: Alpha test threshold

---

### 2. MeshLambertMaterial

Material with Lambertian (diffuse-only) lighting model. Ideal for matte surfaces and diffuse materials.

**Features:**
- Lambertian diffuse lighting
- Ambient lighting
- Emissive support
- Bump mapping
- Texture mapping

**Usage:**
```javascript
import { MeshLambertMaterial } from './materials/MeshLambertMaterial.js';

const material = new MeshLambertMaterial({
  color: '#ffffff',
  emissive: '#000000',
  emissiveIntensity: 1.0,
  bumpScale: 1.0
});
```

**Properties:**
- `color`: Base color
- `emissive`: Emissive color
- `emissiveIntensity`: Emissive intensity
- `bumpScale`: Bump mapping scale
- `lightMapIntensity`: Light map intensity

---

### 3. MeshPhongMaterial

Material with Phong shading model including diffuse, specular, and ambient lighting components.

**Features:**
- Phong shading with specular highlights
- Normal mapping
- Blinn-Phong specular model
- Multiple texture maps
- Vertex colors

**Usage:**
```javascript
import { MeshPhongMaterial } from './materials/MeshPhongMaterial.js';

const material = new MeshPhongMaterial({
  color: '#ffffff',
  specular: '#111111',
  shininess: 30,
  metalness: 0.0,
  roughness: 0.5
});
```

**Properties:**
- `color`: Base color
- `specular`: Specular color
- `shininess`: Specular highlight sharpness (1-200)
- `normalScale`: Normal map intensity
- `specularIntensity`: Specular strength

---

### 4. MeshStandardMaterial

PBR material with metalness/roughness workflow. Best for general-purpose physically-based rendering.

**Features:**
- Physically-based rendering
- Metalness/roughness workflow
- IBL (Image-Based Lighting) support
- Normal/roughness/metalness maps
- AO (Ambient Occlusion) maps
- Displacement mapping

**Usage:**
```javascript
import { MeshStandardMaterial } from './materials/MeshStandardMaterial.js';

const material = new MeshStandardMaterial({
  color: '#ffffff',
  metalness: 0.0,
  roughness: 0.5,
  envMapIntensity: 1.0
});
```

**Properties:**
- `color`: Base color (albedo)
- `metalness`: Metallic value (0.0 = dielectric, 1.0 = metal)
- `roughness`: Surface roughness (0.0 = smooth, 1.0 = rough)
- `envMapIntensity`: Environment reflection intensity
- `normalScale`: Normal map intensity
- `aoMapIntensity`: Ambient occlusion intensity

**PBR Textures:**
- `map`: Base color/albedo texture
- `normalMap`: Normal mapping texture
- `roughnessMap`: Roughness map
- `metalnessMap`: Metalness map
- `aoMap`: Ambient occlusion map
- `displacementMap`: Displacement mapping

---

### 5. MeshPhysicalMaterial

Advanced PBR material with additional physical properties for realistic materials like glass, metals, and fabrics.

**Features:**
- Extended PBR properties
- Clearcoat for car paint effects
- Transmission for transparent materials
- Iridescence support
- Sheen for fabric-like materials
- Advanced refraction (IOR)

**Usage:**
```javascript
import { MeshPhysicalMaterial } from './materials/MeshPhysicalMaterial.js';

const material = new MeshPhysicalMaterial({
  color: '#ffffff',
  metalness: 0.0,
  roughness: 0.1,
  transmission: 0.8,
  thickness: 1.0,
  ior: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1
});
```

**Properties:**
- All MeshStandardMaterial properties plus:
- `reflectivity`: Surface reflectivity
- `ior`: Index of Refraction
- `sheen`: Fabric-like sheen
- `sheenTint`: Sheen color tint
- `clearcoat`: Clearcoat layer strength
- `clearcoatRoughness`: Clearcoat surface roughness
- `transmission`: Transparency for thin materials
- `thickness`: Material thickness
- `attenuationColor`: Absorption color
- `attenuationDistance`: Absorption distance
- `iridescence`: Rainbow-like color shift
- `iridescenceIOR`: Iridescence IOR

**Specialized Textures:**
- `transmissionMap`: Transmission map
- `thicknessMap`: Thickness map
- `iorMap`: IOR variation map
- `sheenColorMap`: Sheen color map
- `clearcoatMap`: Clearcoat map
- `clearcoatNormalMap`: Clearcoat normal map

---

## PBR (Physically Based Rendering)

The material system implements physically-based rendering using industry-standard models:

### Cook-Torrance BRDF
```glsl
// Main lighting model
vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 albedo, float metallic, float roughness)
```

### Fresnel Schlick
```glsl
// Surface reflection
vec3 fresnelSchlick(float cosTheta, vec3 F0)
```

### Normal Distribution Function (GGX)
```glsl
// Microfacet distribution
float distributionGGX(vec3 N, vec3 H, float roughness)
```

### Geometry Function (Smith)
```glsl
// Shadowing and masking
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
```

## Texture Mapping

All materials support comprehensive texture mapping:

### UV Coordinate Transformation
```javascript
const material = new MeshStandardMaterial({
  // Transform: [offsetX, offsetY, scaleX, scaleY, rotation]
  uvTransform: [0, 0, 1, 1, 0]
});
```

### Texture Types
- **Base Color/Map**: Main surface color
- **Normal Map**: Surface detail and lighting
- **Roughness Map**: Surface smoothness variation
- **Metalness Map**: Metallic surface areas
- **AO Map**: Ambient occlusion
- **Emissive Map**: Self-illuminated areas
- **Displacement Map**: Surface displacement
- **Alpha Map**: Transparency control

## Uniform Management

The material system provides efficient uniform management:

### Setting Properties
```javascript
material.setColor('#ff0000');
material.setMetalness(0.8);
material.setRoughness(0.2);
```

### Texture Uniforms
```javascript
material.setTexture('map', texture, 0);
material.setTexture('normalMap', normalTexture, 1);
```

### Automatic Updates
```javascript
// Material automatically tracks changes
material.needsUpdate = true;
material.updateUniforms();
```

## Lighting Support

All materials support various lighting models:

### Ambient Lighting
```glsl
uniform vec3 uAmbientLightColor;
```

### Point Lights (up to 8)
```glsl
uniform vec3 uLightColor[8];
uniform vec3 uLightPosition[8];
uniform float uLightDistance[8];
uniform float uLightDecay[8];
```

### Directional Lights
```glsl
// Directional lights use distance = 0
if (uLightDistance[i] <= 0.0) {
  lightDir = normalize(-uLightPosition[i]);
}
```

## Material Cloning

All materials can be cloned to create copies with the same properties:

```javascript
const originalMaterial = new MeshStandardMaterial({
  color: '#ff0000',
  metalness: 0.8,
  roughness: 0.2
});

const clonedMaterial = originalMaterial.clone();
// clonedMaterial has the same properties as originalMaterial
```

## Performance Considerations

### Texture Units
- Maximum 8 texture units recommended
- Use texture atlases for multiple small textures
- Enable texture compression for mobile devices

### Shader Compilation
- Shaders are compiled on material creation
- Consider shader sharing for identical materials
- Use material pooling for frequently created/destroyed materials

### Uniform Updates
- Material tracks changes automatically
- Batch uniform updates when possible
- Use `needsUpdate` flag for manual control

## Examples

### Basic Material Setup
```javascript
import { MeshStandardMaterial } from './materials/index.js';

// Create a metal material
const metalMaterial = new MeshStandardMaterial({
  color: '#c0c0c0',
  metalness: 1.0,
  roughness: 0.2,
  envMapIntensity: 1.0
});

// Create a wood material
const woodMaterial = new MeshLambertMaterial({
  color: '#8B4513',
  bumpMap: woodBumpMap,
  bumpScale: 0.1
});

// Create a glass material
const glassMaterial = new MeshPhysicalMaterial({
  color: '#ffffff',
  metalness: 0.0,
  roughness: 0.0,
  transmission: 1.0,
  thickness: 2.0,
  ior: 1.5
});
```

### Texture Loading
```javascript
// Load textures
const textureLoader = new TextureLoader();
const albedoTexture = textureLoader.load('textures/wood_albedo.jpg');
const normalTexture = textureLoader.load('textures/wood_normal.jpg');
const roughnessTexture = textureLoader.load('textures/wood_roughness.jpg');

// Create material with textures
const material = new MeshStandardMaterial({
  color: '#ffffff',
  map: albedoTexture,
  normalMap: normalTexture,
  roughnessMap: roughnessTexture,
  metalness: 0.0,
  roughness: 0.8
});
```

### Animation
```javascript
// Animate material properties
function animate() {
  const time = Date.now() * 0.001;
  
  // Animate roughness
  material.setRoughness(0.5 + Math.sin(time) * 0.3);
  
  // Animate emissive intensity
  material.setEmissiveIntensity(0.5 + Math.abs(Math.sin(time * 2)) * 0.5);
  
  requestAnimationFrame(animate);
}
```

## Best Practices

1. **Use appropriate materials for your use case:**
   - MeshBasicMaterial for UI and debugging
   - MeshLambertMaterial for matte surfaces
   - MeshPhongMaterial for glossy plastics
   - MeshStandardMaterial for general PBR
   - MeshPhysicalMaterial for realistic materials

2. **Optimize texture usage:**
   - Combine related textures when possible
   - Use appropriate resolution for target devices
   - Enable texture compression

3. **Manage material instances:**
   - Clone materials instead of creating new instances
   - Share materials for identical objects
   - Dispose materials when no longer needed

4. **Lighting setup:**
   - Use appropriate light types for your scene
   - Limit the number of dynamic lights
   - Use environment maps for realistic lighting

## API Reference

### Material Base Class
- `setProperty(name, value)`: Set material property
- `getProperty(name)`: Get material property
- `setTexture(name, texture, unit)`: Set texture
- `updateUniforms()`: Update shader uniforms
- `clone()`: Clone material
- `dispose()`: Clean up resources

### Material-Specific Methods
- `setColor(color)`: Set base color
- `setMetalness(value)`: Set metalness
- `setRoughness(value)`: Set roughness
- `setEmissive(color)`: Set emissive color
- `setNormalScale(scale)`: Set normal map intensity

## License

This material system is part of the 3D graphics library and follows the same licensing terms.
