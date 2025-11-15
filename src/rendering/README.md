# Shadow Mapping System

A comprehensive shadow mapping implementation for 3D rendering with support for multiple light types, cascade shadow mapping, advanced filtering techniques, and performance optimization.

## Features

### Shadow Map Types
- **Basic Shadow Maps**: For spot lights and basic directional lighting
- **Cascade Shadow Maps**: Optimized directional light shadows with distance-based LOD
- **Omnidirectional Shadow Maps**: Cube map-based shadows for point lights

### Light Type Support
- **Directional Lights**: Cascade shadow mapping with configurable cascade counts
- **Point Lights**: Omnidirectional shadow mapping using cube maps
- **Spot Lights**: Basic shadow mapping with penumbra support

### Shadow Filtering
- **PCF (Percentage Closer Filtering)**: 2x2, 3x3, 4x4, and 8x8 kernels
- **VSM (Variance Shadow Mapping)**: Reduces shadow acne and provides smooth transitions
- **Gaussian VSM**: Advanced variance-based filtering with light bleed reduction

### Advanced Features
- **Shadow Camera Frustum Management**: Automatic frustum calculation and optimization
- **Shadow Material System**: GPU-accelerated shadow calculations with custom shaders
- **Performance Monitoring**: Built-in metrics and benchmarking
- **Quality Presets**: LOW, MEDIUM, HIGH, ULTRA configurations
- **Dynamic Shadow Updates**: Configurable update intervals for performance optimization

## Quick Start

### Basic Setup

```javascript
import { ShadowManager, ShadowQuality } from './src/rendering/index.js';

// Initialize shadow manager
const shadowManager = new ShadowManager(gl, {
    enabled: true,
    quality: ShadowQuality.MEDIUM,
    maxShadowDistance: 100.0
});

// Add shadow generator to a light
shadowManager.addGenerator(directionalLight, {
    enabled: true,
    mapSize: 2048,
    bias: 0.001,
    normalBias: 1.0,
    filterType: 'pcf_4x4',
    cascadeCount: 3
});

// Update shadows each frame
function renderLoop() {
    shadowManager.update(scene, camera);
    renderer.render(scene, camera);
}
```

### Quality Presets

```javascript
// Low Quality (Performance)
shadowManager.setQuality(ShadowQuality.LOW);
// - 512x512 shadow maps
// - PCF 2x2 filtering
// - Minimal bias
// - Single cascade

// Medium Quality (Balanced)
shadowManager.setQuality(ShadowQuality.MEDIUM);
// - 1024x1024 shadow maps
// - PCF 3x3 filtering
// - 2 cascades
// - Good performance/quality balance

// High Quality (Quality)
shadowManager.setQuality(ShadowQuality.HIGH);
// - 2048x2048 shadow maps
// - PCF 4x4 filtering
// - 3 cascades
// - Better shadow resolution

// Ultra Quality (Maximum Quality)
shadowManager.setQuality(ShadowQuality.ULTRA);
// - 4096x4096 shadow maps
// - PCF 8x8 filtering
// - 4 cascades
// - Best shadow quality
```

### Shadow Filtering Types

```javascript
// Basic shadow mapping (no filtering)
filterType: ShadowFilterType.NONE

// PCF 2x2 (fast, good for mobile)
filterType: ShadowFilterType.PCF_2x2

// PCF 3x3 (balanced)
filterType: ShadowFilterType.PCF_3x3

// PCF 4x4 (high quality)
filterType: ShadowFilterType.PCF_4x4

// Variance Shadow Mapping (smooth, reduces acne)
filterType: ShadowFilterType.VSM

// Gaussian VSM (advanced VSM with light bleed reduction)
filterType: ShadowFilterType.VSM_GAUSSIAN
```

## Advanced Usage

### Directional Light with Cascades

```javascript
const directionalGenerator = new DirectionalShadowGenerator(sunLight, {
    cascadeCount: 4,           // Number of shadow cascades
    cascadeBlendWidth: 0.1,    // Blend width between cascades
    optimizeCascades: true,    // Enable cascade optimization
    fitToCascade: true,        // Fit shadow camera to cascade bounds
    maxShadowDistance: 100.0,  // Maximum shadow distance
    shadowCameraSize: 50.0     // Shadow camera orthographic size
});
```

### Point Light with Omnidirectional Shadows

```javascript
const pointGenerator = new PointShadowGenerator(pointLight, {
    mapSize: 1024,             // Cube map resolution
    bias: 0.003,               // Depth bias to prevent acne
    normalBias: 0.5,           // Normal-based bias
    updateInterval: 100        // Update every 100ms (for performance)
});
```

### Spot Light with Penumbra

```javascript
const spotGenerator = new SpotShadowGenerator(spotLight, {
    mapSize: 1024,
    bias: 0.002,
    normalBias: 0.8,
    filterType: ShadowFilterType.PCF_3x3
});
```

## Integration with Materials

### Shadow Material Setup

```javascript
import { ShadowMaterial, ShadowFilterType } from './src/rendering/index.js';

// Create shadow material
const shadowMaterial = new ShadowMaterial(gl, {
    filterType: ShadowFilterType.PCF_3x3,
    bias: 0.001,
    normalBias: 1.0
});

// In your render loop
function renderShadowPass() {
    shadowMaterial.use();
    
    // Set shadow uniforms
    shadowMaterial.setUniform('shadowMap', shadowTexture);
    shadowMaterial.setUniform('lightDirection', light.direction);
    shadowMaterial.setUniform('shadowBias', 0.001);
    shadowMaterial.setUniform('normalOffsetScale', 1.0);
    
    // Render geometry with shadows
    renderGeometry();
}
```

### Getting Shadow Data for Shaders

```javascript
// Get shadow uniform data for your materials
const shadowUniforms = shadowManager.getShadowUniforms();

// Example shader uniform structure
const shadowData = {
    shadowMatrix: lightVP,           // Light view-projection matrix
    shadowMap: depthTexture,         // Shadow map texture
    shadowBias: 0.001,               // Depth bias
    normalOffsetScale: 1.0,          // Normal-based offset scale
    shadowMapSize: [2048, 2048],    // Shadow map resolution
    lightPosition: [x, y, z],        // Light position
    lightDirection: [x, y, z],       // Light direction
    cascadeCount: 3,                 // Number of cascades (directional light)
    cascadeSplits: [0.1, 0.3, 0.7]   // Cascade split distances
};
```

## Performance Optimization

### Update Intervals

```javascript
// For static lights, use update intervals to reduce computation
shadowManager.addGenerator(staticLight, {
    updateInterval: 1000  // Update shadows only every second
});
```

### Culling and Frustum Management

```javascript
// Automatic frustum culling is enabled by default
// The system only updates shadow maps when objects are in view

// Manual frustum control
generator.updateShadowCamera(scene, camera, customFrustum);
```

### Quality vs Performance Trade-offs

```javascript
// Mobile/Low-end devices
const mobileShadowSettings = {
    mapSize: 512,
    filterType: ShadowFilterType.PCF_2x2,
    cascadeCount: 1,
    updateInterval: 100
};

// High-end desktop
const desktopShadowSettings = {
    mapSize: 4096,
    filterType: ShadowFilterType.PCF_8x8,
    cascadeCount: 4,
    updateInterval: 0  // Update every frame
};
```

## Debugging and Monitoring

### Performance Metrics

```javascript
// Get detailed performance data
const metrics = shadowManager.getPerformanceMetrics();
console.log(metrics);

// Output structure:
{
    enabled: true,
    quality: ShadowQuality.MEDIUM,
    generatorCount: 3,
    avgRenderTime: 2.45,        // Average frame time in ms
    totalRenderTime: 24.5,      // Total time since last reset
    frameCount: 10,             // Frames counted
    generators: {
        sun: {
            mapSize: 2048,
            renderTime: 1.2,    // Time to render this shadow map
            enabled: true,
            lastUpdate: 1234567890
        },
        // ... other generators
    }
}
```

### Benchmarking

```javascript
// Run performance benchmark
const results = demo.benchmark(10);
console.log(results);

// Output:
{
    totalTime: "245.67",
    averageFrameTime: "24.57",
    minFrameTime: "18.34",
    maxFrameTime: "31.22",
    avgFPS: "40.7"
}
```

### Debug Visualization

```javascript
// Enable debug mode
const shadowManager = new ShadowManager(gl, {
    debug: true  // Enable additional logging and debug features
});

// Toggle individual shadow generators
shadowManager.getGenerator('sun').setEnabled(false);

// Export current settings
demo.exportSettings();
```

## API Reference

### ShadowManager

The main class that manages all shadow generators.

```javascript
constructor(gl, options)
addGenerator(light, options)
removeGenerator(lightId)
getGenerator(lightId)
update(scene, camera, frustum)
getShadowUniforms()
setQuality(quality)
setEnabled(enabled)
getPerformanceMetrics()
dispose()
```

### ShadowGenerator (Base Class)

Base class for all shadow generators.

```javascript
constructor(light, options)
init(gl)
update(scene, camera, frustum)
getShadowUniforms()
setQuality(quality)
setEnabled(enabled)
getPerformanceMetrics()
dispose()
```

### DirectionalShadowGenerator

Specialized generator for directional lights with cascade shadow mapping.

```javascript
constructor(light, options)
// Additional options:
cascadeCount: 4              // Number of cascades
cascadeBlendWidth: 0.1       // Blend width between cascades
optimizeCascades: true       // Enable cascade optimization
fitToCascade: true          // Fit camera to cascade bounds
maxShadowDistance: 100.0     // Maximum shadow distance
shadowCameraSize: 50.0       // Orthographic camera size
```

### PointShadowGenerator

Generator for point lights using omnidirectional shadow mapping.

```javascript
constructor(light, options)
// Uses cube maps with 6 faces automatically
```

### SpotShadowGenerator

Generator for spot lights with penumbra support.

```javascript
constructor(light, options)
// Automatically handles spotlight angle and penumbra
```

## Best Practices

### Shadow Quality Guidelines

1. **Mobile Devices**: Use LOW quality, PCF 2x2, single cascade
2. **Laptops**: Use MEDIUM quality, PCF 3x3, 2 cascades
3. **Desktop**: Use HIGH quality, PCF 4x4, 3 cascades
4. **High-end**: Use ULTRA quality, PCF 8x8, 4 cascades

### Performance Tips

1. **Static Lights**: Use update intervals for static lighting
2. **Shadow Distance**: Limit maxShadowDistance to reduce computation
3. **Map Resolution**: Start with lower resolutions and increase if needed
4. **Filter Type**: Use PCF for compatibility, VSM for quality
5. **Cascade Count**: More cascades = better quality but more computation

### Common Issues and Solutions

**Shadow Acne**: Increase bias or normalBias values
**Peter Panning**: Decrease bias values
**Performance Issues**: Reduce map size, filter complexity, or cascade count
**Incorrect Shadows**: Verify light positions and directions

## Integration Example

Complete integration with existing WebGL renderer:

```javascript
import { integrateWithRenderer } from './src/rendering/ShadowDemo.js';

// Integrate with existing renderer
const shadowManager = integrateWithRenderer(renderer, scene, camera);

// The renderer now automatically handles shadow updates
function gameLoop() {
    // Shadows are updated automatically before rendering
    renderer.render(scene, camera);
}
```

This shadow mapping system provides a complete solution for high-quality, performant shadow rendering in WebGL applications, with extensive customization options and built-in performance monitoring.