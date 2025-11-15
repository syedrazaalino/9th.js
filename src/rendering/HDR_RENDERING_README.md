# HDR Rendering Pipeline Implementation

## Overview

The HDR Rendering Pipeline is a comprehensive high dynamic range rendering system that provides advanced tone mapping, exposure control, bloom effects, and HDR texture support. It extends the core WebGL renderer with HDR capabilities including multiple tone mapping operators, automatic exposure adaptation, and HDR sky rendering.

## Features

### Core HDR Features
- **HDR Framebuffers**: Support for floating-point textures (16-bit and 32-bit)
- **Multiple Tone Mapping Operators**: ACES, Reinhard, Filmic, and Uncharted2
- **Exposure Control**: Manual and automatic exposure adjustment
- **Gamma Correction**: Configurable gamma values (default 2.2)
- **HDR Texture Loading**: Support for HDR texture formats
- **Automatic Exposure Adaptation**: Real-time exposure adjustment based on scene luminance
- **HDR Sky Rendering**: Physically-based atmospheric scattering

### Advanced Effects
- **Bloom Effect**: Configurable bloom with threshold and intensity
- **High Dynamic Range Lighting**: Support for HDR light intensities
- **Emissive Materials**: HDR emissive colors and intensities
- **Performance Optimization**: Efficient downsampling and adaptation buffers

## Installation

```javascript
import { HDRRenderer } from './src/rendering/HDRRendering.js';
```

## Basic Usage

### Creating an HDR Renderer

```javascript
const canvas = document.getElementById('myCanvas');
const hdrRenderer = new HDRRenderer(canvas, {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
});

// Enable HDR features
hdrRenderer.setHDRSettings({
    enabled: true,
    exposure: 1.0,
    toneMapping: 'ACES',
    gamma: 2.2,
    autoExposure: true,
    adaptationSpeed: 1.0,
    bloomEnabled: false
});
```

### Rendering an HDR Scene

```javascript
// Create scene and camera
const scene = new Scene();
const camera = new Camera();
camera.position.set(0, 0, 5);

// Render with HDR pipeline
hdrRenderer.renderHDR(scene, camera);
```

### Custom HDR Materials

```javascript
const material = new Material();
material.shader = hdrRenderer.shaders.get('hdrBasic');

material.uniforms = {
    baseColor: { value: [2.0, 1.0, 0.5] }, // HDR values can exceed 1.0
    emissiveIntensity: { value: 0.5 },
    lightDirection: { value: [0, -1, 0] },
    ambientColor: { value: [0.1, 0.1, 0.1] },
    lightColor: { value: [10.0, 10.0, 10.0] }, // HDR light intensity
    lightIntensity: { value: 1.0 }
};

// Custom HDR rendering method
mesh.renderHDR = (renderer, camera, scene) => {
    const gl = renderer.gl;
    const programId = renderer.shaders.get('hdrBasic');
    
    if (programId) {
        const program = renderer.programs.get(programId);
        gl.useProgram(program.program);
        
        // Set custom uniforms here
        mesh.render(renderer, camera, scene);
    }
};
```

## Tone Mapping Operators

### ACES (Academy Color Encoding System)
The most advanced tone mapping operator, provides film-like color reproduction.

```javascript
hdrRenderer.setHDRSettings({ toneMapping: 'ACES' });
```

**Characteristics:**
- Natural color reproduction
- Preserves hue and saturation
- Film-like appearance
- Good for cinematic rendering

### Reinhard
Simple and fast tone mapping operator based on photographic principles.

```javascript
hdrRenderer.setHDRSettings({ toneMapping: 'Reinhard' });
```

**Characteristics:**
- Simple implementation
- Good performance
- Preserves contrast well
- Suitable for real-time applications

### Filmic
Epic Games' filmic tone mapping curve, popular in Unreal Engine.

```javascript
hdrRenderer.setHDRSettings({ toneMapping: 'Filmic' });
```

**Characteristics:**
- Smooth roll-off in highlights
- Good for games
- Preserves detail in bright areas
- Cinematic feel

### Uncharted 2
Advanced tone mapping from the game Uncharted 2, known for excellent results.

```javascript
hdrRenderer.setHDRSettings({ toneMapping: 'Uncharted2' });
```

**Characteristics:**
- Excellent color accuracy
- Good highlight preservation
- Complex but effective
- Popular in high-end applications

## Automatic Exposure Control

The automatic exposure system adjusts the exposure based on the current scene luminance to maintain proper brightness.

### Enabling Auto Exposure

```javascript
hdrRenderer.setHDRSettings({
    autoExposure: true,
    adaptationSpeed: 1.0, // 0.1 (slow) to 5.0 (fast)
    minExposure: 0.01,
    maxExposure: 100.0
});
```

### Manual Exposure Override

```javascript
// Disable auto exposure and set manual value
hdrRenderer.setHDRSettings({
    autoExposure: false,
    exposure: 2.0
});

// Access current exposure (updates in real-time with auto exposure)
console.log(hdrRenderer.currentExposure);
```

## HDR Texture Loading

### Loading HDR Textures

```javascript
// Load an HDR texture
const textureId = hdrRenderer.loadHDRTexture('path/to/texture.hdr');

// Access texture data
const texture = hdrRenderer.hdrTextures.get(textureId);
console.log(texture.data); // Float32Array with HDR values
console.log(texture.width, texture.height);
```

### HDR Texture Format
HDR textures use floating-point values that can represent values beyond the 0-1 range:

```javascript
// RGB values can be > 1.0 for HDR
const brightRed = [10.0, 0.0, 0.0]; // Very bright red
const dimBlue = [0.1, 0.2, 0.3];     // Regular blue
```

## Bloom Effect

### Enabling Bloom

```javascript
hdrRenderer.setHDRSettings({
    bloomEnabled: true,
    bloomThreshold: 1.0,  // Minimum luminance for bloom
    bloomIntensity: 0.5   // Bloom strength
});
```

### Bloom Settings
- **bloomThreshold**: Values above this luminance will contribute to bloom
- **bloomIntensity**: Overall bloom strength multiplier

## HDR Sky Rendering

The HDR sky system provides physically-based atmospheric scattering for realistic sky rendering.

### Sky Settings

```javascript
hdrRenderer.setSkySettings({
    enabled: true,
    intensity: 1.0,              // Overall sky brightness
    turbidity: 2.0,              // Atmospheric haze (2-10)
    rayleigh: 1.2,               // Rayleigh scattering coefficient
    mieCoefficient: 0.005,       // Mie scattering coefficient
    mieDirectionalG: 0.7,        // Mie phase function asymmetry
    sunPosition: { x: 0, y: 1, z: 0 } // Sun position
});
```

### Atmospheric Parameters
- **Turbidity**: Higher values create more hazy, overcast appearance
- **Rayleigh**: Affects blue sky scattering
- **Mie**: Affects sun glow and atmospheric haze
- **MieDirectionalG**: Controls forward scattering (0.0-0.8)

## Performance Optimization

### Adaptation Buffer
The automatic exposure system uses an adaptation buffer to smooth exposure changes:

```javascript
// Configure adaptation buffer size
hdrRenderer.adaptationBufferSize = 32; // Larger = smoother but slower adaptation

// Access adaptation data
console.log(hdrRenderer.adaptationBuffer); // Array of luminance values
```

### Memory Management
Monitor HDR resource usage:

```javascript
const performance = hdrRenderer.getHDRPerformance();
console.log({
    framebuffers: performance.framebuffers,
    shaders: performance.shaders,
    hdrTextures: performance.hdrTextures,
    currentExposure: performance.currentExposure
});
```

## Advanced Usage

### Custom HDR Shaders

```javascript
// Compile custom HDR shader
const vertexShader = `
    // Vertex shader for full-screen quad
    // ...
`;

const fragmentShader = `
    precision highp float;
    uniform sampler2D hdrTexture;
    uniform float exposure;
    uniform float gamma;
    
    void main() {
        vec3 color = texture2D(hdrTexture, vUV).rgb;
        color *= exposure; // Apply HDR exposure
        
        // Custom tone mapping
        color = color / (color + vec3(1.0)); // Simple Reinhard
        
        // Gamma correction
        color = pow(color, vec3(1.0/gamma));
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

const programId = hdrRenderer.compileShader(vertexShader, fragmentShader);
hdrRenderer.shaders.set('customHDR', programId);
```

### Multi-pass HDR Rendering

```javascript
// Custom multi-pass HDR pipeline
function customHDRPass(renderer, scene, camera) {
    // Pass 1: Render scene to HDR buffer
    renderer.renderToHDRBuffer(scene, camera);
    
    // Pass 2: Process custom effects
    renderer.processCustomEffects();
    
    // Pass 3: Apply tone mapping
    renderer.applyToneMapping();
    
    // Pass 4: Render sky
    renderer.renderHDRSky(scene, camera);
}
```

## Event System

The HDR renderer provides events for monitoring and control:

```javascript
// Listen for tone mapping changes
hdrRenderer.on('toneMappingChanged', (data) => {
    console.log('Exposure changed:', data.exposure);
});

// Listen for rendering events
hdrRenderer.on('rendered', (data) => {
    console.log('HDR frame rendered:', data.performance);
});
```

## Configuration Options

### Renderer Options

```javascript
const hdrRenderer = new HDRRenderer(canvas, {
    // WebGL context options
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    
    // HDR-specific options are set separately
});
```

### HDR Settings

```javascript
const hdrSettings = {
    enabled: true,              // Enable HDR rendering
    exposure: 1.0,             // Manual exposure value
    minExposure: 0.01,         // Minimum exposure for auto exposure
    maxExposure: 100.0,        // Maximum exposure for auto exposure
    toneMapping: 'ACES',       // Tone mapping operator
    gamma: 2.2,                // Gamma correction value
    autoExposure: true,        // Enable automatic exposure
    adaptationSpeed: 1.0,      // Auto exposure adaptation speed
    bloomEnabled: false,       // Enable bloom effect
    bloomThreshold: 1.0,       // Bloom threshold
    bloomIntensity: 0.5        // Bloom intensity
};
```

## Browser Compatibility

### Required Extensions
The HDR renderer requires the following WebGL extensions:

- `OES_texture_float` or `OES_texture_half_float` - Float texture support
- `OES_texture_float_linear` or `OES_texture_half_float_linear` - Float texture filtering
- `EXT_color_buffer_float` - Float color buffer support (optional)

### Fallback Behavior
If HDR is not supported, the renderer will fall back to standard LDR rendering:

```javascript
// Check HDR support
const capabilities = hdrRenderer.hdrCapabilities;
console.log('Float textures:', capabilities.floatTextures);
console.log('Half float textures:', capabilities.halfFloatTextures);
```

## Debugging

### Enable Debug Mode

```javascript
renderer.setDebugMode(true);
```

### Monitor Errors

```javascript
const errors = renderer.getErrors();
errors.forEach(error => {
    console.error('HDR Error:', error.message);
});
```

### Performance Monitoring

```javascript
// Get detailed performance metrics
const performance = renderer.getPerformance();
console.log({
    fps: performance.fps,
    renderTime: performance.renderTime,
    drawCalls: performance.drawCalls,
    triangles: performance.triangles
});

// Get HDR-specific metrics
const hdrPerf = renderer.getHDRPerformance();
console.log('Current exposure:', hdrPerf.currentExposure);
```

## Best Practices

### Performance Tips
1. **Reduce adaptation buffer size** for faster exposure changes
2. **Use half-float textures** when possible for better compatibility
3. **Disable auto exposure** for static scenes
4. **Optimize bloom settings** based on content
5. **Use appropriate tone mapping** for your application

### Quality Tips
1. **Test all tone mapping operators** to find the best fit
2. **Fine-tune exposure ranges** based on your scene
3. **Use physically accurate light intensities** for best results
4. **Consider gamma correction** for proper display
5. **Enable HDR sky** for outdoor scenes

### Memory Management
1. **Dispose unused HDR resources** when done
2. **Monitor texture memory usage**
3. **Clean up event listeners** on disposal
4. **Use appropriate texture formats** for your needs

## API Reference

### HDRRenderer Class

#### Constructor
```javascript
new HDRRenderer(canvas, options)
```

#### Methods
- `setHDRSettings(settings)` - Configure HDR settings
- `setSkySettings(settings)` - Configure sky settings
- `renderHDR(scene, camera)` - Render scene with HDR pipeline
- `loadHDRTexture(url)` - Load HDR texture
- `getHDRPerformance()` - Get performance metrics
- `disposeHDR()` - Clean up HDR resources

#### Properties
- `hdrSettings` - Current HDR settings
- `currentExposure` - Current exposure value (updates with auto exposure)
- `hdrCapabilities` - WebGL HDR capabilities
- `shaders` - HDR shader programs
- `hdrTextures` - Loaded HDR textures

### Settings Objects

#### HDR Settings
```javascript
{
    enabled: boolean,
    exposure: number,
    minExposure: number,
    maxExposure: number,
    toneMapping: string,
    gamma: number,
    autoExposure: boolean,
    adaptationSpeed: number,
    bloomEnabled: boolean,
    bloomThreshold: number,
    bloomIntensity: number
}
```

#### Sky Settings
```javascript
{
    enabled: boolean,
    intensity: number,
    turbidity: number,
    rayleigh: number,
    mieCoefficient: number,
    mieDirectionalG: number,
    sunPosition: { x: number, y: number, z: number }
}
```

## Examples

See `/examples/hdr-rendering-demo.html` for a complete interactive demonstration of all HDR features including:

- Interactive controls for all HDR settings
- Multiple tone mapping operator comparison
- Bloom effect demonstration
- HDR sky rendering
- Performance monitoring
- Keyboard shortcuts for quick adjustments

Run the demo to see all features in action and experiment with different settings.