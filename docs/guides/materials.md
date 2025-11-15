# Materials Guide

Materials define how objects appear in a 3D scene. This guide covers the material system in 9th.js, from basic materials to advanced shader development.

## Material Overview

Materials control:
- **Color and appearance** - How the surface looks
- **Lighting response** - How it interacts with lights
- **Surface properties** - Reflectivity, roughness, etc.
- **Transparency** - Alpha blending and transparency
- **Texturing** - UV mapping and texture application

## Material Hierarchy

```
Material (Base)
├── BasicMaterial
├── PhongMaterial
├── StandardMaterial (PBR)
├── PhysicalMaterial (Advanced PBR)
├── MeshLambertMaterial
├── MeshToonMaterial
└── ShaderMaterial
```

## Basic Materials

### BasicMaterial

Unlit material that doesn't respond to lights - perfect for UI elements and simple shapes.

```typescript
const basicMaterial = new BasicMaterial({
  color: 0xff0000,        // Red color
  opacity: 0.8,          // 80% opacity
  transparent: true,      // Enable transparency
  side: DoubleSide,       // Render both sides
  fog: true              // Apply fog
});

// Properties
basicMaterial.color = new Color(0x00ff00); // Change to green
basicMaterial.opacity = 1.0; // Fully opaque
basicMaterial.transparent = false; // Disable transparency
```

### MeshLambertMaterial

Diffuse material with Lambertian shading - efficient for large numbers of objects.

```typescript
const lambertMaterial = new MeshLambertMaterial({
  color: 0xffffff,        // Base color
  map: diffuseTexture,    // Diffuse texture
  lightMap: lightmap,     // Light map for baked lighting
  lightMapIntensity: 1.0, // Light map intensity
  emissive: 0x000000,     // Self-illumination color
  emissiveMap: emissiveTexture,
  emissiveIntensity: 1.0,
  transparent: false,
  side: FrontSide
});

// Vertex colors for procedural coloring
lambertMaterial.vertexColors = true;
```

## Phong Shading Materials

### PhongMaterial

Classic Phong shading with specular highlights.

```typescript
const phongMaterial = new PhongMaterial({
  color: 0xffffff,           // Diffuse color
  specular: 0x111111,        // Specular color
  shininess: 30,             // Specular exponent
  shininessStrength: 1.0,    // Specular strength
  map: diffuseTexture,       // Diffuse texture
  normalMap: normalTexture,  // Normal mapping
  normalScale: new Vector2(1, 1),
  displacementMap: heightTexture, // Height/Displacement
  displacementScale: 0.1,
  displacementBias: 0,
  specularMap: specularTexture, // Specular mask
  alphaMap: alphaTexture,    // Alpha/transparency map
  envMap: environmentMap,    // Environment reflection
  envMapIntensity: 1.0,
  reflectivity: 1.0,         // Reflection coefficient
  refractionRatio: 0.98      // IOR for refraction
});

// Real-time specular highlighting
phongMaterial.specular = new Color(0x333333);
phongMaterial.shininess = 100;
```

## PBR Materials

### StandardMaterial

Physically Based Rendering (PBR) material for realistic surfaces.

```typescript
const standardMaterial = new StandardMaterial({
  // Basic properties
  color: 0xffffff,           // Base color/albedo
  metalness: 0.0,            // Metallic (0=non-metallic, 1=metallic)
  roughness: 0.5,            // Surface roughness (0=smooth, 1=rough)
  
  // Maps
  map: baseColorTexture,     // Albedo/base color map
  metalnessMap: metalnessTexture, // Metallic map
  roughnessMap: roughnessTexture, // Roughness map
  metalnessRoughnessMap: combinedMap, // Combined R/G map
  
  // Normal mapping
  normalMap: normalTexture,
  normalScale: new Vector2(1, 1),
  normalTextureType: TangentSpaceNormalMap,
  
  // Ambient occlusion
  aoMap: aoTexture,
  aoMapIntensity: 1.0,
  
  // Emission
  emissive: 0x000000,
  emissiveMap: emissiveTexture,
  emissiveIntensity: 1.0,
  
  // Alpha
  alphaMap: alphaTexture,
  transparent: false,
  opacity: 1.0,
  
  // Environment
  envMap: environmentMap,
  envMapIntensity: 1.0,
  combine: MultiplyOperation,
  
  // UV transform
  uvTransform: new Matrix3().set(
    2, 0, 0,
    0, 2, 0,
    0, 0, 1
  ),
  
  // Advanced
  lightMap: lightmap,
  lightMapIntensity: 1.0,
  emissiveMapIntensity: 1.0,
  aoMapIntensity: 1.0,
  
  // Wireframe
  wireframe: false,
  wireframeLinewidth: 1.0,
  
  // Fog
  fog: true
});

// Update material when properties change
standardMaterial.needsUpdate = true;
```

### PhysicalMaterial

Advanced PBR material with additional properties like clearcoat and transmission.

```typescript
const physicalMaterial = new PhysicalMaterial({
  // Standard PBR
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.0,
  
  // Clearcoat layer
  clearcoat: 1.0,           // Clearcoat intensity
  clearcoatRoughness: 0.0,  // Clearcoat roughness
  clearcoatMap: clearcoatTexture,
  clearcoatNormalMap: clearcoatNormalTexture,
  clearcoatNormalScale: new Vector2(1, 1),
  
  // Sheen
  sheen: 1.0,               // Sheen intensity
  sheenColor: new Color(0xffffff),
  sheenRoughness: 0.0,
  sheenMap: sheenTexture,
  
  // Transmission (for glass-like materials)
  transmission: 0.0,        // Transmission amount (0-1)
  thickness: 0.0,           // Material thickness
  ior: 1.5,                 // Index of refraction
  transmissionMap: transmissionTexture,
  thicknessMap: thicknessMap,
  attenuationColor: new Color(0xffffff),
  attenuationDistance: 0.0,
  
  // Iridescence
  iridescence: 0.0,
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 800],
  iridescenceMap: iridescenceTexture,
  
  // Vacuum specular (for metals)
  specularIntensity: 1.0,
  specularIntensityMap: specularIntensityMap,
  specularColor: new Color(0xffffff),
  specularColorMap: specularColorMap
});

// Perfect glass material
const glassMaterial = new PhysicalMaterial({
  color: new Color(0xffffff),
  metalness: 0.0,
  roughness: 0.0,
  transmission: 0.95,
  thickness: 0.1,
  ior: 1.5,
  attenuationColor: new Color(0xffffff),
  attenuationDistance: 1.0,
  envMapIntensity: 1.0
});

// Metal material
const metalMaterial = new PhysicalMaterial({
  color: new Color(0x888888),
  metalness: 1.0,
  roughness: 0.2,
  envMapIntensity: 1.0
});
```

## Texture Mapping

### UV Coordinates

```typescript
// Standard UV mapping
const geometry = new BoxGeometry(1, 1, 1);
const uvs = geometry.getAttribute('uv');

// Custom UV transform
const uvTransform = new Matrix3().set(
  2, 0, 0,        // Scale X by 2
  0, 2, 0,        // Scale Y by 2  
  0, 0, 1
);

material.uvTransform = uvTransform;

// UV offset and rotation
const material = new StandardMaterial({
  map: texture,
  color: 0xffffff
});

// Manual UV manipulation
function createUvTransform(offsetX, offsetY, repeatX, repeatY, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  return new Matrix3().set(
    repeatX * cos, -repeatX * sin, offsetX,
    repeatY * sin,  repeatY * cos, offsetY,
    0, 0, 1
  );
}
```

### Texture Arrays and Atlases

```typescript
// Texture atlas for multiple materials
class TextureAtlas {
  constructor(size = 1024, tileSize = 256) {
    this.size = size;
    this.tileSize = tileSize;
    this.tileCount = Math.floor(size / tileSize);
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.context = this.canvas.getContext('2d');
    this.texture = new CanvasTexture(this.canvas);
    this.regions = new Map();
  }
  
  addTexture(name, image) {
    const col = this.regions.size % this.tileCount;
    const row = Math.floor(this.regions.size / this.tileCount);
    
    const x = col * this.tileSize;
    const y = row * this.tileSize;
    
    this.context.drawImage(image, x, y, this.tileSize, this.tileSize);
    
    this.regions.set(name, {
      x: x / this.size,
      y: y / this.size,
      width: this.tileSize / this.size,
      height: this.tileSize / this.size
    });
    
    this.texture.needsUpdate = true;
  }
  
  getRegion(name) {
    return this.regions.get(name);
  }
  
  applyToMaterial(material, textureName) {
    const region = this.getRegion(textureName);
    if (region) {
      const offset = new Vector2(region.x, region.y);
      const repeat = new Vector2(region.width, region.height);
      
      material.map = this.texture;
      material.map.offset.copy(offset);
      material.map.repeat.copy(repeat);
      material.map.needsUpdate = true;
    }
  }
}

// Usage
const atlas = new TextureAtlas();
atlas.addTexture('metal', metalImage);
atlas.addTexture('wood', woodImage);
atlas.addTexture('stone', stoneImage);

// Apply to materials
atlas.applyToMaterial(metalMaterial, 'metal');
atlas.applyToMaterial(woodMaterial, 'wood');
```

## Custom Shaders

### Basic ShaderMaterial

```typescript
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Basic lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(0.0, dot(vNormal, lightDir));
    
    // Animated pattern
    float pattern = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
    pattern = pattern * 0.5 + 0.5;
    
    vec3 finalColor = color * (0.3 + 0.7 * diff * pattern);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const shaderMaterial = new ShaderMaterial({
  uniforms: {
    color: { value: new Color(0x00ff00) },
    time: { value: 0 }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: DoubleSide,
  transparent: false
});

// Update shader uniforms
function updateShader(time) {
  shaderMaterial.uniforms.time.value = time;
  shaderMaterial.uniformsNeedUpdate = true;
}
```

### Advanced Shader Development

```typescript
// Normal mapping shader
class NormalMappedShader extends ShaderMaterial {
  constructor(texture, normalTexture, lightDirection) {
    super({
      uniforms: {
        map: { value: texture },
        normalMap: { value: normalTexture },
        lightDirection: { value: lightDirection.clone() },
        normalScale: { value: new Vector2(1, 1) },
        ambientLight: { value: new Color(0x404040) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          
          // Calculate tangent space
          vec3 normal = normalize(normalMatrix * normal);
          vec3 tangent = normalize(normalMatrix * tangent);
          vec3 bitangent = normalize(normalMatrix * cross(normal, tangent));
          
          vNormal = normal;
          vTangent = tangent;
          vBitangent = bitangent;
          vPosition = position;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D normalMap;
        uniform vec3 lightDirection;
        uniform vec2 normalScale;
        uniform vec3 ambientLight;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        
        void main() {
          // Sample base texture
          vec4 texel = texture2D(map, vUv);
          
          // Sample normal map and convert to tangent space
          vec3 normalSample = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
          normalSample.xy *= normalScale;
          
          // Transform normal to world space
          vec3 normal = normalize(
            normalSample.x * vTangent +
            normalSample.y * vBitangent +
            normalSample.z * vNormal
          );
          
          // Calculate lighting
          float diff = max(0.0, dot(normal, -lightDirection));
          vec3 lighting = ambientLight + texel.rgb * diff;
          
          gl_FragColor = vec4(lighting, texel.a);
        }
      `
    });
  }
  
  setLightDirection(dir) {
    this.uniforms.lightDirection.value.copy(dir);
  }
  
  setNormalScale(x, y) {
    this.uniforms.normalScale.value.set(x, y);
  }
}
```

## Material Animation

### Animated Materials

```typescript
// Animated material properties
class AnimatedMaterial {
  constructor(material) {
    this.material = material;
    this.animations = [];
  }
  
  addColorAnimation(targetProperty, fromColor, toColor, duration, easing = 'linear') {
    this.animations.push({
      type: 'color',
      property: targetProperty,
      from: fromColor.clone(),
      to: toColor.clone(),
      duration,
      easing,
      startTime: null
    });
  }
  
  addNumberAnimation(targetProperty, fromValue, toValue, duration, easing = 'linear') {
    this.animations.push({
      type: 'number',
      property: targetProperty,
      from: fromValue,
      to: toValue,
      duration,
      easing,
      startTime: null
    });
  }
  
  update(time) {
    this.animations.forEach(anim => {
      if (anim.startTime === null) {
        anim.startTime = time;
      }
      
      const elapsed = time - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      
      // Apply easing
      const easedProgress = this.applyEasing(progress, anim.easing);
      
      if (anim.type === 'color') {
        const currentColor = new Color().lerpColors(anim.from, anim.to, easedProgress);
        this.material[anim.property].copy(currentColor);
      } else if (anim.type === 'number') {
        const currentValue = anim.from + (anim.to - anim.from) * easedProgress;
        this.material[anim.property] = currentValue;
      }
      
      // Remove completed animations
      if (progress >= 1) {
        const index = this.animations.indexOf(anim);
        this.animations.splice(index, 1);
      }
    });
    
    this.material.needsUpdate = true;
  }
  
  applyEasing(t, easing) {
    switch (easing) {
      case 'easeInOut': return t * t * (3 - 2 * t);
      case 'easeOut': return 1 - Math.pow(1 - t, 3);
      case 'easeIn': return t * t * t;
      default: return t;
    }
  }
}

// Usage
const animatedMaterial = new AnimatedMaterial(standardMaterial);

// Animate color change over 2 seconds
animatedMaterial.addColorAnimation(
  'color',
  new Color(0xff0000), // Red
  new Color(0x00ff00), // Green
  2000,
  'easeInOut'
);

// Animate roughness
animatedMaterial.addNumberAnimation(
  'roughness',
  0.0, // Smooth
  1.0, // Rough
  3000,
  'easeInOut'
);

function animate() {
  const time = performance.now();
  animatedMaterial.update(time);
  // ... rest of animation loop
}
```

## Material Optimization

### Material Pooling

```typescript
class MaterialPool {
  constructor() {
    this.materials = new Map();
  }
  
  getMaterial(type, options) {
    const key = this.generateKey(type, options);
    
    if (!this.materials.has(key)) {
      const material = this.createMaterial(type, options);
      this.materials.set(key, material);
    }
    
    return this.materials.get(key);
  }
  
  generateKey(type, options) {
    const sorted = Object.keys(options).sort().reduce((result, key) => {
      result[key] = options[key];
      return result;
    }, {});
    
    return `${type}:${JSON.stringify(sorted)}`;
  }
  
  createMaterial(type, options) {
    switch (type) {
      case 'basic':
        return new BasicMaterial(options);
      case 'phong':
        return new PhongMaterial(options);
      case 'standard':
        return new StandardMaterial(options);
      case 'physical':
        return new PhysicalMaterial(options);
      default:
        throw new Error(`Unknown material type: ${type}`);
    }
  }
  
  clear() {
    this.materials.forEach(material => {
      material.dispose();
    });
    this.materials.clear();
  }
}
```

### Instanced Materials

```typescript
// Efficient material system for instanced meshes
class InstancedMaterialSystem {
  constructor() {
    this.baseMaterial = new StandardMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.5
    });
    
    this.attributes = {
      color: new Float32Array(1000 * 3), // RGB per instance
      metalness: new Float32Array(1000), // Metallic per instance
      roughness: new Float32Array(1000)  // Roughness per instance
    };
    
    this.setupMaterialAttributes();
  }
  
  setupMaterialAttributes() {
    // Create custom geometry attributes for material properties
    const geometry = this.baseMaterial.geometry;
    
    // Color attribute
    const colorAttribute = new InstancedBufferAttribute(this.attributes.color, 3);
    geometry.setAttribute('instanceColor', colorAttribute);
    
    // Metalness attribute
    const metalnessAttribute = new InstancedBufferAttribute(this.attributes.metalness, 1);
    geometry.setAttribute('instanceMetalness', metalnessAttribute);
    
    // Roughness attribute
    const roughnessAttribute = new InstancedBufferAttribute(this.attributes.roughness, 1);
    geometry.setAttribute('instanceRoughness', roughnessAttribute);
    
    // Add shader uniforms
    this.baseMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.instanceColor = { value: null };
      shader.uniforms.instanceMetalness = { value: null };
      shader.uniforms.instanceRoughness = { value: null };
      
      // Inject custom shader code
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        #ifdef USE_INSTANCING_COLOR
          vec3 instanceColor = vec3( instanceColorInstancedBuffer );
          diffuseColor.rgb *= instanceColor;
        #endif
        `
      );
    };
  }
  
  setInstanceColor(index, color) {
    const i = index * 3;
    this.attributes.color[i] = color.r;
    this.attributes.color[i + 1] = color.g;
    this.attributes.color[i + 2] = color.b;
  }
  
  setInstanceMetalness(index, metalness) {
    this.attributes.metalness[index] = metalness;
  }
  
  setInstanceRoughness(index, roughness) {
    this.attributes.roughness[index] = roughness;
  }
  
  updateAttributes() {
    const geometry = this.baseMaterial.geometry;
    geometry.getAttribute('instanceColor').needsUpdate = true;
    geometry.getAttribute('instanceMetalness').needsUpdate = true;
    geometry.getAttribute('instanceRoughness').needsUpdate = true;
  }
}
```

This completes the materials guide. Materials are a crucial part of 9th.js, and understanding how to use them effectively will help you create stunning 3D scenes. Experiment with different material types and properties to achieve the visual style you're looking for.