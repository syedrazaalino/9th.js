# Advanced PBR Materials and IBL System

## Overview

This module provides a comprehensive Physically Based Rendering (PBR) system with advanced Image-Based Lighting (IBL) capabilities for realistic 3D rendering in WebGL applications.

## Features

### Core PBR Components

#### Cook-Torrance BRDF Implementation
- **Physically-Based Shading**: Industry-standard Cook-Torrance microfacet model
- **Energy Conservation**: Proper energy conservation across diffuse and specular components
- **Realistic Material Response**: Accurate behavior for both dielectric and metallic materials

#### Microfacet Distribution Functions
- **GGX Normal Distribution**: Modern microfacet distribution with improved energy conservation
- **Smith Geometry Function**: Shadowing and masking with view/light dependent terms
- **Fresnel Schlick**: Approximation of complex Fresnel equations for RGB channels

#### Advanced Material Properties
- **Metalness/Roughness Workflow**: Industry-standard material authoring workflow
- **Clearcoat**: Multi-layer materials for car paint and coated surfaces
- **Anisotropy**: Directional reflections for brushed metals and fabrics
- **Subsurface Scattering**: Light transport through semi-transparent materials
- **Iridescence**: Rainbow-like color shifts on thin films
- **Transmission**: Proper refraction and transparency for glass and liquids
- **Sheen**: Fabric-like soft highlights for textiles

### Image-Based Lighting (IBL)

#### Environment Mapping
- **Prefiltered Environment Maps**: Mip-mapped cubemaps for roughness-dependent reflections
- **Irradiance Maps**: Diffuse environment lighting using spherical harmonics
- **HDR Environment Support**: High dynamic range texture handling
- **Multiple Environment Loading**: Support for various environment map formats

#### Reflection Probes
- **Dynamic Reflection Probes**: Real-time environment reflections for moving objects
- **Blending**: Smooth transitions between multiple reflection probes
- **Box Projection**: Improved accuracy for enclosed environments
- **Update Culling**: Performance optimization with update intervals

#### Multi-bounce Global Illumination
- **Screen-Space Ambient Occlusion**: Approximation of ambient occlusion effects
- **Secondary Bounce Lighting**: Interreflection approximation for indirect lighting
- **Higher-Order Bounces**: Multiple scattering for complex lighting scenarios
- **Distance-Based Falloff**: Realistic attenuation of indirect lighting

### Material Factory System

#### Pre-configured Materials
- **Metals**: High-quality metallic materials with proper F0 values
- **Dielectrics**: Non-metallic materials like plastics and ceramics
- **Glass**: Transparent materials with proper refraction and reflection
- **Car Paint**: Multi-layer materials with clearcoat for automotive rendering
- **Fabrics**: Textile materials with sheen and subsurface scattering
- **Iridescent**: Rainbow-effect materials for special effects

#### Custom Material Creation
```javascript
import { PBRMaterial } from './src/rendering/PBR.js';

const material = new PBRMaterial({
    color: new Vector3(1, 0, 0),      // Red base color
    metalness: 0.8,                   // 80% metallic
    roughness: 0.2,                   // Smooth surface
    clearcoat: 1.0,                   // Full clearcoat
    clearcoatRoughness: 0.1,          // Very smooth clearcoat
    envMapIntensity: 1.0             // Environment reflection strength
});
```

## API Reference

### CookTorranceBRDF Class

```javascript
// Distribution function
CookTorranceBRDF.distributionGGX(N, H, roughness)

// Geometry function  
CookTorranceBRDF.geometrySmith(N, V, L, roughness)

// Fresnel approximation
CookTorranceBRDF.fresnelSchlick(cosTheta, F0)

// Full BRDF computation
CookTorranceBRDF.computeBRDF(N, V, L, albedo, metallic, roughness)
```

### IBLRenderer Class

```javascript
// Initialize IBL system
const iblRenderer = new IBLRenderer(gl, {
    bakeResolution: 64,
    sampleCount: 1024,
    prefilterResolution: 128
});

// Generate irradiance map
iblRenderer.generateIrradianceMap('env', envMap);

// Generate prefiltered reflections
iblRenderer.generatePrefilteredMap('env', envMap, roughness);

// Create reflection probe
const probe = iblRenderer.createReflectionProbe(position, size, updateInterval);

// Sample environment lighting
const irradiance = iblRenderer.sampleIrradiance(normal, 'env');
const reflection = iblRenderer.sampleReflection(viewDir, normal, roughness, 'env');

// Compute multi-bounce GI
const gi = iblRenderer.computeMultiBounceGI(position, normal, roughness, occluders);
```

### PBRMaterial Class

```javascript
// Create material
const material = new PBRMaterial({
    color: new Vector3(1, 1, 1),
    metalness: 0.0,
    roughness: 0.5,
    clearcoat: 0.0,
    transmission: 0.0,
    envMapIntensity: 1.0
});

// Set properties
material.setProperty('roughness', 0.3);
material.setProperty('metalness', 0.8);

// Update uniforms
material.updateUniforms({
    uBaseColor: new Vector3(1, 0, 0)
});
```

### PBRMaterialFactory Class

```javascript
// Create common materials
const metal = PBRMaterialFactory.createMetal(
    new Vector3(0.95, 0.64, 0.54), // Copper color
    1.0,                           // Fully metallic
    0.2                            // Smooth surface
);

const glass = PBRMaterialFactory.createGlass(
    new Vector3(1, 1, 1),          // Clear glass
    1.5,                           // Glass IOR
    0.0                            // Perfectly smooth
);

const carPaint = PBRMaterialFactory.createCarPaint(
    new Vector3(0.1, 0.0, 0.8),    // Blue paint
    1.0,                           // Full clearcoat
    0.1                            // Smooth clearcoat
);

const fabric = PBRMaterialFactory.createFabric(
    new Vector3(0.8, 0.7, 0.6),    // Beige fabric
    1.0,                           // Full sheen
    new Vector3(0.95, 0.64, 0.54)  // Warm sheen tint
);
```

### PBRUtils Class

```javascript
// Material analysis
const brdfInputs = PBRUtils.materialToBRDF(material);
const F0 = PBRUtils.computeF0(albedo, metallic, ior);

// Color space conversion
const linearColor = PBRUtils.sRGBToLinear(srgbColor);
const srgbColor = PBRUtils.linearToSRGB(linearColor);

// Fresnel calculations
const reflectance = PBRUtils.fresnelReflectance(ior1, ior2, cosTheta);

// Sampling utilities
const hemisphereSample = PBRUtils.sampleHemisphereCosineWeighted(xi1, xi2);
const ggxSample = PBRUtils.importanceSampleGGX(xi1, xi2, roughness);
```

### EnvironmentUtils Class

```javascript
// Generate environment maps
const prefilteredEnv = EnvironmentUtils.generatePrefilteredMap(
    gl, 
    texture, 
    resolution = 128, 
    maxMipLevels = 5
);

const irradianceEnv = EnvironmentUtils.generateIrradianceMap(
    gl, 
    cubemap, 
    resolution = 32
);

// Convert between formats
const cubemap = EnvironmentUtils.equirectangularToCubemap(
    gl, 
    equirectTexture, 
    resolution = 512
);

// Sample environment
const envColor = EnvironmentUtils.sampleEnvironment(
    environment, 
    direction, 
    roughness, 
    maxMipLevel = 4
);
```

### ToneMapping Class

```javascript
// Tone mapping operators
const toneMapped = ToneMapping.reinhard(color);
const acsFilmic = ToneMapping.ACESFilmic(color);
const exponential = ToneMapping.exponential(color, exposure);
```

### PBRDebugger Class

```javascript
// Debug visualizations
const normalDebug = PBRDebugger.visualizeNormals(material, normalMap);
const roughnessDebug = PBRDebugger.visualizeRoughness(0.8);
const metallicDebug = PBRDebugger.visualizeMetallic(0.9);
const aoDebug = PBRDebugger.visualizeAO(0.7);

// Material analysis
const energyConservation = PBRDebugger.analyzeEnergyConservation(material);
const validation = PBRDebugger.validateMaterial(material);
```

## Advanced Usage Examples

### Complete PBR Scene Setup

```javascript
import { PBRMaterial, IBLRenderer, PBRMaterialFactory } from './src/rendering/PBR.js';

// Initialize IBL renderer
const iblRenderer = new IBLRenderer(gl);

// Load environment map
const envMap = loadEnvironmentMap('environments/studio.hdr');

// Generate IBL maps
iblRenderer.generateIrradianceMap('studio', envMap);
iblRenderer.generatePrefilteredMap('studio', envMap);

// Create materials using factory
const goldMaterial = PBRMaterialFactory.createMetal(
    PBRUtils.sRGBToLinear(new Vector3(1.0, 0.766, 0.336)),
    1.0,
    0.2
);

const glassMaterial = PBRMaterialFactory.createGlass(
    PBRUtils.sRGBToLinear(new Vector3(1, 1, 1)),
    1.5,
    0.05
);

const fabricMaterial = PBRMaterialFactory.createFabric(
    PBRUtils.sRGBToLinear(new Vector3(0.8, 0.7, 0.6)),
    1.0,
    new Vector3(0.95, 0.64, 0.54)
);

// Create custom material
const customMaterial = new PBRMaterial({
    color: PBRUtils.sRGBToLinear(new Vector3(0.2, 0.1, 0.8)),
    metalness: 0.0,
    roughness: 0.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    transmission: 0.3,
    thickness: 2.0,
    envMapIntensity: 1.2,
    anisotropy: 0.6,
    sheen: 0.8,
    iridescence: 0.4
});
```

### Dynamic Reflection Probes

```javascript
// Create reflection probes for a room
const roomCenter = new Vector3(0, 2, 0);
const roomSize = new Vector3(10, 6, 10);

const cornerProbes = [
    iblRenderer.createReflectionProbe(
        new Vector3(-5, 3, -5), 
        roomSize, 
        100 // Update every 100ms
    ),
    iblRenderer.createReflectionProbe(
        new Vector3(5, 3, -5), 
        roomSize, 
        100
    ),
    iblRenderer.createReflectionProbe(
        new Vector3(-5, 3, 5), 
        roomSize, 
        100
    ),
    iblRenderer.createReflectionProbe(
        new Vector3(5, 3, 5), 
        roomSize, 
        100
    )
];

// Update probes each frame
function updateReflectionProbes(scene, camera) {
    cornerProbes.forEach(probe => {
        iblRenderer.updateReflectionProbe(probe, scene, camera);
    });
}
```

### Multi-bounce Global Illumination

```javascript
// Compute multi-bounce GI for complex lighting
function computeSceneGI(scene) {
    scene.meshes.forEach(mesh => {
        const position = mesh.getWorldPosition();
        const normal = mesh.getWorldNormal();
        const occluders = findOccluders(scene, position);
        
        const multiBounceGI = iblRenderer.computeMultiBounceGI(
            position,
            normal,
            mesh.material.roughness,
            occluders
        );
        
        // Apply GI to material
        mesh.material.setProperty('indirectLight', multiBounceGI);
    });
}
```

### Custom Material Animation

```javascript
// Animate material properties over time
function animateMaterials(time) {
    materials.forEach((material, index) => {
        // Animate roughness
        const roughness = 0.2 + Math.sin(time * 0.5 + index) * 0.3;
        material.setProperty('roughness', roughness);
        
        // Animate metalness
        const metalness = 0.5 + Math.cos(time * 0.3 + index) * 0.5;
        material.setProperty('metalness', metalness);
        
        // Animate transmission for glass
        if (material.transmission > 0) {
            const transmission = 0.3 + Math.abs(Math.sin(time * 2.0 + index)) * 0.7;
            material.setProperty('transmission', transmission);
        }
        
        // Animate emissive intensity
        const emissiveIntensity = 0.5 + Math.abs(Math.sin(time * 1.5 + index)) * 1.5;
        material.setProperty('emissiveIntensity', emissiveIntensity);
    });
}
```

## Performance Optimization

### Shader Compilation
- Materials share shader programs when possible
- Use material pooling for frequently created/destroyed materials
- Compile shaders in background thread when available

### Texture Management
- Use texture atlases for multiple small textures
- Enable texture compression for mobile devices
- Implement texture streaming for large environments

### IBL Optimization
- Cache prefiltered environment maps
- Use appropriate mip levels for roughness ranges
- Implement probe update culling for static environments
- Use SH coefficients for efficient irradiance sampling

### Material Instance Management
```javascript
// Share materials for identical objects
const sharedGoldMaterial = PBRMaterialFactory.createMetal(
    new Vector3(1.0, 0.766, 0.336),
    1.0,
    0.2
);

// Clone only when needed for unique properties
const goldMaterial1 = sharedGoldMaterial.clone();
const goldMaterial2 = sharedGoldMaterial.clone();

goldMaterial1.setProperty('roughness', 0.1);
goldMaterial2.setProperty('roughness', 0.4);
```

## Quality Settings

### High Quality
```javascript
const pbrSettings = {
    iblResolution: 256,
    sampleCount: 2048,
    maxMipLevels: 8,
    probeUpdateInterval: 0, // Update every frame
    multiBounceEnabled: true,
    iridescenceEnabled: true,
    anisotropyEnabled: true
};
```

### Medium Quality (Balanced)
```javascript
const pbrSettings = {
    iblResolution: 128,
    sampleCount: 1024,
    maxMipLevels: 5,
    probeUpdateInterval: 100, // Update every 100ms
    multiBounceEnabled: true,
    iridescenceEnabled: false,
    anisotropyEnabled: true
};
```

### Low Quality (Performance)
```javascript
const pbrSettings = {
    iblResolution: 64,
    sampleCount: 512,
    maxMipLevels: 3,
    probeUpdateInterval: 1000, // Update every second
    multiBounceEnabled: false,
    iridescenceEnabled: false,
    anisotropyEnabled: false
};
```

## Troubleshooting

### Common Issues

**Materials appear too dark:**
- Check environment map intensity (`uEnvMapIntensity`)
- Verify normal map is in tangent space
- Ensure proper color space conversion (sRGB to linear)

**Reflection artifacts:**
- Reduce `clearcoatRoughness` for clearer reflections
- Check normal map resolution and quality
- Verify reflection probe positioning

**Energy conservation violations:**
- Check material validation with `PBRDebugger.validateMaterial()`
- Ensure `metallic` and `roughness` values are in valid ranges
- Use proper F0 values for different materials

**Performance issues:**
- Reduce IBL resolution and sample count
- Increase probe update intervals
- Disable expensive features like iridescence on lower quality settings

### Debug Tools

```javascript
// Validate materials
const validation = PBRDebugger.validateMaterial(material);
console.log(validation);

// Check energy conservation
const energy = PBRDebugger.analyzeEnergyConservation(material);
console.log(energy);

// Visualize material properties
const normalDebug = PBRDebugger.visualizeNormals(material, normalMap);
const roughnessDebug = PBRDebugger.visualizeRoughness(material.roughness);
```

## Best Practices

1. **Material Authoring**
   - Use realistic parameter ranges (roughness 0.0-1.0, metalness 0.0-1.0)
   - Reference physical material databases for accurate values
   - Test materials with different lighting conditions

2. **Texture Management**
   - Use consistent texture resolutions (powers of 2)
   - Normal maps should be in tangent space
   - Compress textures appropriately for target platform

3. **Environment Lighting**
   - Use high-quality HDR environment maps
   - Generate proper prefiltered maps with sufficient samples
   - Position reflection probes strategically

4. **Performance**
   - Share materials when possible
   - Use appropriate quality settings for target platform
   - Implement LOD systems for complex scenes

5. **Color Management**
   - Convert textures from sRGB to linear space
   - Apply tone mapping for HDR rendering
   - Use proper color spaces throughout pipeline

This advanced PBR system provides production-ready physically based rendering with comprehensive IBL support, enabling realistic material appearance and advanced lighting effects in WebGL applications.