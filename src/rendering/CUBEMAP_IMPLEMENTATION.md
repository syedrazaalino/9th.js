# Cubemap and Environment Map Implementation

A comprehensive implementation of cubemap and environment map support for 3D graphics rendering, featuring skyboxes, reflection maps, irradiance maps, and advanced PBR (Physically Based Rendering) environment lighting.

## Features

### 🗺️ **CubeTexture.js**
- **Cubemap Texture Creation**: Full WebGL cubemap texture support
- **Multi-face Loading**: Support for 6-face cubemap textures
- **Equirectangular Conversion**: Convert panoramic equirectangular images to cubemaps
- **Single Image Support**: Load cubemaps from single subdivided images
- **Texture Parameters**: Configurable filtering, wrapping, and mipmap generation
- **GPU Resource Management**: Efficient texture binding and upload management

### 🌅 **EnvironmentMap.js**
- **HDR Environment Processing**: High Dynamic Range environment map support
- **PMREM Generation**: Pre-filtered Mipmapped Radiance Environment Maps
- **Irradiance Maps**: Diffuse environment lighting for realistic ambient illumination
- **Prefiltered Reflection Maps**: Specular environment lighting with roughness handling
- **Tone Mapping**: Multiple tone mapping operators (ACES, Reinhard, Filmic, Photographic)
- **Multiple Environment Types**: Support for different environment map configurations

### 🎨 **Advanced Features**
- **PBR Material Integration**: Seamless integration with physical-based materials
- **Roughness-based Prefiltering**: Different reflection maps for different surface roughness
- **Skybox Support**: Full skybox rendering with environment mapping
- **Performance Optimization**: Efficient GPU resource management and memory usage
- **Flexible Configuration**: Extensive customization options for all features

## Quick Start

### Basic Cubemap Usage

```javascript
import { CubeTexture } from './rendering/CubeTexture.js';
import { WebGLRenderer } from './core/WebGLRenderer.js';

const renderer = new WebGLRenderer(canvas);
const gl = renderer.context;

// Create cubemap
const cubemap = new CubeTexture(gl, {
    size: 512,
    format: gl.RGBA,
    generateMipmaps: true,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR
});

// Set cubemap faces
cubemap.setFaces({
    posx: positiveXImage,
    negx: negativeXImage,
    posy: positiveYImage,
    negy: negativeYImage,
    posz: positiveZImage,
    negz: negativeZImage
});

// Use in rendering
cubemap.bind(0);
```

### Environment Map with PBR Materials

```javascript
import { EnvironmentMap } from './rendering/EnvironmentMap.js';
import { MeshPhysicalMaterial } from './materials/MeshPhysicalMaterial.js';

const envMap = new EnvironmentMap(gl, {
    type: 'default',
    intensity: 1.0,
    toneMapping: 'aces'
});

// Load HDR environment
envMap.loadHDR(hdrData, {
    resolution: 512,
    roughnessLevels: [0.0, 0.25, 0.5, 0.75, 1.0]
});

// Create PBR material with environment reflection
const material = new MeshPhysicalMaterial(gl, {
    envMap: envMap.getEnvironmentMap(0.1, 'reflection'),
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1.0
});
```

### Equirectangular to Cubemap Conversion

```javascript
const envMap = new EnvironmentMap(gl);

// Load equirectangular texture and convert to cubemap
envMap.setFromEquirectangular(equirectangularTexture, {
    resolution: 512
});

// Now use the cubemap for environment lighting
const skyboxMaterial = envMap.createSkyboxMaterial();
const pbrMaterial = envMap.createPBRMaterial();
```

## Detailed API Reference

### CubeTexture Class

#### Constructor
```javascript
new CubeTexture(gl, options)
```

**Parameters:**
- `gl`: WebGL context
- `options.size`: Texture size (default: 512)
- `options.format`: Texture format (default: gl.RGBA)
- `options.internalFormat`: Internal format (default: gl.RGBA)
- `options.type`: Data type (default: gl.UNSIGNED_BYTE)
- `options.generateMipmaps`: Enable mipmap generation (default: true)
- `options.minFilter`: Minification filter (default: gl.LINEAR_MIPMAP_LINEAR)
- `options.magFilter`: Magnification filter (default: gl.LINEAR)

#### Key Methods

**setFaceData(face, data, width, height)**
- Set data for a specific cube face
- `face`: Face identifier ('posx', 'negx', 'posy', 'negy', 'posz', 'negz') or WebGL target
- `data`: Image data, canvas, or array buffer
- `width`, `height`: Optional dimensions

**setFaces(facesData)**
- Set all 6 faces at once from an object

**bind(textureUnit = 0)**
- Bind texture to a specific texture unit

**generateMipmap()**
- Generate mipmaps for all cube faces

**fromEquirectangular(gl, equirectangularTexture, resolution)**
- Static method to create cubemap from equirectangular texture

### EnvironmentMap Class

#### Constructor
```javascript
new EnvironmentMap(gl, options)
```

**Parameters:**
- `gl`: WebGL context
- `options.type`: Environment type ('default', 'irradiance', 'reflection')
- `options.intensity`: Environment intensity (default: 1.0)
- `options.toneMapping`: Tone mapping operator
- `options.exposure`: Exposure value (default: 1.0)
- `options.roughnessLevels`: Array of roughness levels for prefiltering

#### Key Methods

**loadHDR(hdrData, options)**
- Load and process HDR environment data
- `hdrData`: HDR image data with width, height, and pixel data
- `options.resolution`: Cubemap resolution (default: 512)

**setFromEquirectangular(texture, options)**
- Convert equirectangular texture to cubemap

**getEnvironmentMap(roughness, type)**
- Get appropriate environment map for given roughness and type
- `type`: 'irradiance', 'reflection', or 'pmrem'
- `roughness`: Surface roughness value (0.0 to 1.0)

**generateIrradianceMap()**
- Generate irradiance map for diffuse lighting

**generatePrefilterMap()**
- Generate prefiltered reflection maps for different roughness levels

**createSkyboxMaterial()**
- Create shader material for skybox rendering

**createPBRMaterial()**
- Create shader material for PBR environment lighting

### Tone Mapping Operators

**Linear**
```javascript
toneMapping: 'linear' // No tone mapping
```

**Reinhard**
```javascript
toneMapping: 'reinhard' // Simple reinhard operator
```

**ACES**
```javascript
toneMapping: 'aces' // ACES filmic tone mapping (recommended)
```

**Filmic**
```javascript
toneMapping: 'film' // Filmic tone mapping
```

**Photographic**
```javascript
toneMapping: 'photographic' // Photographic tone mapping
```

## PBR Integration

### Physical-Based Material Setup

```javascript
const material = new MeshPhysicalMaterial(gl, {
    // Environment lighting
    envMap: envMap.getEnvironmentMap(0.1, 'reflection'),
    irradianceMap: envMap.getEnvironmentMap(0.0, 'irradiance'),
    envMapIntensity: 1.0,
    
    // Material properties
    metalness: 0.8,
    roughness: 0.2,
    baseColor: 0xffffff,
    
    // Advanced properties
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
    transmission: 0.0,
    ior: 1.5,
    specularIntensity: 0.5,
    specularColor: 0xffffff
});
```

### Environment Lighting in Shaders

```glsl
// Vertex shader
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}

// Fragment shader with environment lighting
precision highp float;

uniform samplerCube envMap;
uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform vec3 cameraPosition;
uniform vec3 baseColor;
uniform float metallic;
uniform float roughness;
uniform float envMapIntensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

// BRDF and environment lighting functions
// (Implementation details in EnvironmentMap.js)

void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    
    // Sample environment maps
    vec3 diffuse = textureCube(irradianceMap, N).rgb;
    vec3 specular = textureCube(prefilterMap, reflect(-V, N)).rgb;
    
    vec3 color = (1.0 - metallic) * diffuse + specular;
    color *= envMapIntensity;
    
    gl_FragColor = vec4(color, 1.0);
}
```

## Performance Optimization

### Memory Usage

**Cubemap Memory Calculation:**
- 6 faces × size² × channels × bytes per channel
- Example: 512×512×6×4 bytes = 6MB per cubemap

**Environment Map Memory:**
- Base cubemap: ~6MB (512×512)
- Irradiance map: ~0.024MB (32×32×6×4 bytes)
- Prefilter maps: ~6MB × number of roughness levels

### Optimization Tips

1. **Use appropriate resolution**: Match texture resolution to viewing distance
2. **Disable mipmaps for small textures**: Save memory on small irradiance maps
3. **Use update intervals**: For static environments, update less frequently
4. **Optimize sample count**: Balance quality vs performance in prefiltering
5. **Culling**: Only update visible environment maps

### Configuration Examples

**Mobile/Performance (Low-end devices)**
```javascript
const envMap = new EnvironmentMap(gl, {
    type: 'default',
    intensity: 0.8,
    toneMapping: 'linear',
    sampleCount: 32,
    filterSize: 128,
    roughnessLevels: [0.0, 1.0] // Only two levels
});
```

**Desktop/Quality (High-end devices)**
```javascript
const envMap = new EnvironmentMap(gl, {
    type: 'default',
    intensity: 1.2,
    toneMapping: 'aces',
    sampleCount: 256,
    filterSize: 512,
    roughnessLevels: [0.0, 0.1, 0.25, 0.5, 0.75, 1.0] // Six levels
});
```

## Examples and Demos

### Available Examples

The implementation includes several examples demonstrating different features:

1. **Basic Cubemap Creation** (`basicCubemapExample`)
2. **PBR Environment Lighting** (`pbrEnvironmentExample`)
3. **Irradiance Maps for Diffuse Lighting** (`irradianceMapExample`)
4. **Reflection Maps with Roughness** (`reflectionMapExample`)
5. **HDR Environment Processing** (`hdrEnvironmentExample`)
6. **Equirectangular Conversion** (`equirectangularConversionExample`)
7. **Complete Skybox Scene** (`skyboxExample`)
8. **Performance Comparison** (`performanceComparisonExample`)

### Running Examples

```javascript
import { createEnvironmentMapDemo } from './rendering/environment-map-examples.js';

// Create the main skybox demo
const demo = createEnvironmentMapDemo(canvas);

// Access individual examples
import { 
    pbrEnvironmentExample,
    hdrEnvironmentExample,
    reflectionMapExample
} from './rendering/environment-map-examples.js';

// Run specific example
const pbrDemo = pbrEnvironmentExample(canvas);
```

## Integration with Materials

### MeshPhysicalMaterial Integration

The environment maps integrate seamlessly with `MeshPhysicalMaterial`:

```javascript
const material = new MeshPhysicalMaterial(gl, {
    // Base properties
    diffuseColor: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
    
    // Environment integration
    envMap: envMap.getEnvironmentMap(0.3, 'reflection'),
    irradianceMap: envMap.getEnvironmentMap(0.0, 'irradiance'),
    envMapIntensity: 1.0,
    
    // Advanced properties
    clearcoat: 0.0,
    transmission: 0.0,
    ior: 1.45,
    specularIntensity: 0.5,
    specularColor: 0xffffff
});
```

### Custom Shader Integration

For custom shaders, the environment maps provide uniform data:

```javascript
const pbrMaterial = envMap.createPBRMaterial({
    vertexShader: customVertexShader,
    fragmentShader: customFragmentShader
});

// The material includes all necessary uniforms:
// - envMap: The main environment cubemap
// - irradianceMap: The diffuse irradiance map
// - prefilterMap: The prefiltered reflection map
// - envMapIntensity: Environment lighting intensity
```

## Best Practices

### Texture Loading

1. **Preload critical textures**: Load environment maps during application startup
2. **Use progressive loading**: Load low-resolution first, then high-resolution
3. **Cache textures**: Reuse cubemaps across multiple materials when possible
4. **Handle loading states**: Show loading indicators during texture processing

### Performance Guidelines

1. **Resolution Selection**:
   - Skyboxes: 512×512 to 1024×1024
   - PBR reflections: 256×256 to 512×512
   - Irradiance maps: 16×16 to 64×64

2. **Quality vs Performance**:
   - Mobile: Use 256×256 cubemaps, 1-2 roughness levels
   - Desktop: Use 512×512 cubemaps, 5-6 roughness levels
   - High-end: Use 1024×1024 cubemaps, 8+ roughness levels

3. **Memory Management**:
   - Dispose unused environment maps
   - Use texture atlases when possible
   - Implement LOD (Level of Detail) for distant objects

### Common Issues and Solutions

**Issue: Environment map appears too bright/dark**
```javascript
// Solution: Adjust intensity and exposure
const envMap = new EnvironmentMap(gl, {
    intensity: 0.5,    // Reduce overall brightness
    exposure: 0.8      // Adjust exposure
});
```

**Issue: Reflection looks incorrect**
```javascript
// Solution: Verify roughness level selection
const reflectionMap = envMap.getEnvironmentMap(0.3, 'reflection');
// Make sure roughness matches material roughness
```

**Issue: Performance issues with HDR processing**
```javascript
// Solution: Reduce sample count and resolution
const envMap = new EnvironmentMap(gl, {
    sampleCount: 32,     // Reduce from 64
    filterSize: 256      // Reduce from 512
});
```

## Browser Compatibility

### WebGL Extensions Required

- **WEBGL_depth_texture**: For depth textures (shadows)
- **OES_texture_float**: For floating point textures (HDR)
- **OES_texture_half_float**: For half float textures (better performance)
- **WEBGL_color_buffer_float**: For float color buffer rendering

### Fallback Strategies

**No Float Texture Support:**
```javascript
// Fallback to 8-bit textures
const options = {
    type: gl.UNSIGNED_BYTE,
    encoding: 'sRGB'  // Use sRGB instead of linear
};
```

**No sRGB Support:**
```javascript
// Fallback to linear encoding
const options = {
    encoding: 'linear',
    toneMapping: 'linear'  // No tone mapping
};
```

## Future Enhancements

### Planned Features

1. **WebGPU Support**: Migrate to WebGPU for better performance
2. **WebXR Integration**: Support for VR/AR environment mapping
3. **Real-time Environment Capture**: Dynamic environment maps from cameras
4. **Advanced BRDF Models**: Support for more sophisticated BRDFs
5. **Hierarchical LOD**: Automatic LOD management for environments

### Contributing

When extending the implementation:

1. Follow the existing API patterns
2. Maintain backward compatibility
3. Add comprehensive documentation
4. Include performance benchmarks
5. Test across different hardware configurations

This implementation provides a solid foundation for high-quality environment lighting in 3D graphics applications, with extensive customization options and performance optimizations suitable for various use cases from mobile to desktop applications.