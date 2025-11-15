# Instancing.js - Advanced GPU Instancing and Batch Rendering System

## Overview

Instancing.js is a comprehensive GPU instancing and batch rendering system designed for high-performance 3D graphics applications. It supports rendering thousands of objects efficiently using hardware instancing, automatic draw call batching, LOD (Level of Detail) instancing, and real-time performance profiling.

## 🚀 Key Features

### GPU Instancing Support
- **Hardware instancing** for thousands of objects
- **Efficient memory management** with optimized buffer layouts
- **Per-instance transforms** (position, rotation, scale)
- **Custom per-instance attributes** support
- **Automatic matrix generation** and updates

### Batch Rendering Optimizations
- **Automatic draw call batching** by material and geometry
- **Smart batch management** with dynamic optimization
- **Performance tracking** for batch efficiency
- **Memory-aware batching** with configurable limits

### LOD Instancing System
- **Distance-based LOD** switching for instanced objects
- **Multiple LOD levels** per instanced geometry
- **Automatic LOD management** based on camera position
- **Performance-optimized** LOD transitions

### Performance Profiling
- **Real-time performance metrics** (FPS, frame time, GPU time)
- **Draw call tracking** and optimization suggestions
- **Memory usage monitoring** and warnings
- **Performance recommendations** based on current load

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Classes](#core-classes)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Performance Optimization](#performance-optimization)
- [Browser Compatibility](#browser-compatibility)
- [Best Practices](#best-practices)

## Installation

```javascript
import { InstancingSystem, InstanceData, LODInstancingLevel } from './src/rendering/Instancing.js';
```

## Quick Start

```javascript
import { InstancingSystem } from './src/rendering/Instancing.js';
import { WebGLRenderer } from './src/core/WebGLRenderer.js';

// Initialize WebGL renderer
const renderer = new WebGLRenderer(canvas, {
    antialias: true,
    alpha: false,
    depth: true
});

// Create instancing system
const instancingSystem = new InstancingSystem(renderer.gl, {
    maxInstances: 50000,
    enableProfiling: true,
    autoBatch: true,
    enableLOD: true
});

// Create instance data
const instanceData = {
    position: [10, 0, 0],
    rotation: [0, 0, 0, 1], // quaternion
    scale: [1, 1, 1]
};

// Create instance
const instanceId = instancingSystem.createInstance({
    position: instanceData.position,
    rotation: instanceData.rotation,
    scale: instanceData.scale,
    batchInfo: {
        material: myMaterial,
        geometry: myGeometry,
        shader: myShader
    }
});

// Render in your render loop
function render() {
    // Update camera
    instancingSystem.updateLOD(camera.getPosition());
    
    // Render instanced objects
    instancingSystem.render(renderer, scene);
    
    requestAnimationFrame(render);
}
```

## Core Classes

### InstancingSystem

The main class that manages the entire instancing system.

```javascript
const system = new InstancingSystem(gl, options);
```

**Options:**
- `maxInstances` (number): Maximum number of instances (default: 10000)
- `enableProfiling` (boolean): Enable performance profiling (default: true)
- `autoBatch` (boolean): Enable automatic batching (default: true)
- `enableLOD` (boolean): Enable LOD system (default: false)
- `debugMode` (boolean): Enable debug output (default: false)

**Methods:**
- `createInstance(config)`: Create a new instance
- `destroyInstance(instanceId)`: Destroy an instance
- `updateInstance(instanceId, data)`: Update instance data
- `updateLOD(cameraPosition)`: Update LOD system
- `render(renderer, scene)`: Render all instances
- `getStats()`: Get system statistics
- `getPerformanceAnalysis()`: Get performance analysis

### InstanceData

Represents data for a single instance.

```javascript
const instance = new InstanceData([10, 0, 0], [0, 0, 0, 1], [1, 1, 1]);
```

**Properties:**
- `position`: [x, y, z] position array
- `rotation`: [x, y, z, w] quaternion rotation
- `scale`: [x, y, z] scale array
- `customAttributes`: Object for custom per-instance data

**Methods:**
- `setPosition(x, y, z)`: Set position
- `setRotation(x, y, z, w)`: Set rotation quaternion
- `setScale(x, y, z)`: Set scale
- `setCustomAttribute(name, value)`: Set custom attribute
- `updateMatrix()`: Update world matrix

### LODInstancingLevel

Represents a level of detail for instanced rendering.

```javascript
const lodLevel = new LODInstancingLevel(100, 5000, geometry);
```

**Properties:**
- `distance`: Distance threshold for this LOD level
- `instanceCount`: Number of instances for this level
- `geometry`: Geometry for this LOD level
- `startIndex`: Start index in instance buffer
- `endIndex`: End index in instance buffer

### InstancingProfiler

Performance profiler for instanced rendering.

```javascript
const profiler = new InstancingProfiler();
profiler.startFrame();
// ... rendering code ...
profiler.endFrame();
const analysis = profiler.getAnalysis();
```

## API Reference

### InstancingSystem API

#### createInstance(config)

Creates a new instance and returns its ID.

**Parameters:**
- `config.position` (Array<number>): [x, y, z] position
- `config.rotation` (Array<number>): [x, y, z, w] quaternion rotation
- `config.scale` (Array<number>): [x, y, z] scale
- `config.batchInfo` (Object): Batch information
  - `material`: Material for batching
  - `geometry`: Geometry for batching
  - `shader`: Shader for batching

**Returns:** number - Instance ID

#### updateInstance(instanceId, data)

Updates instance data.

**Parameters:**
- `instanceId` (number): Instance ID to update
- `data` (Object): Updated instance data
  - `position`: New position array
  - `rotation`: New rotation quaternion
  - `scale`: New scale array
  - `customAttributes`: Object with custom attributes

#### render(renderer, scene)

Renders all instanced objects.

**Parameters:**
- `renderer` (WebGLRenderer): WebGL renderer instance
- `scene` (Scene): Scene to render

#### getStats()

Gets system statistics.

**Returns:** Object with system statistics

```javascript
{
    totalInstances: number,
    activeInstances: number,
    drawCalls: number,
    batches: number,
    lastFrameTime: number,
    batchStats: {
        totalBatches: number,
        totalInstances: number,
        averageInstancesPerBatch: number,
        batchingEfficiency: number
    }
}
```

#### getPerformanceAnalysis()

Gets detailed performance analysis.

**Returns:** Object with performance analysis

```javascript
{
    fps: number,
    frameTime: number,
    gpuTime: number,
    drawCalls: number,
    instances: number,
    batches: number,
    triangles: number,
    lodSwitches: number,
    bufferUpdates: number,
    warnings: string[],
    efficiency: {
        instancesPerDrawCall: number,
        trianglesPerInstance: number,
        batchEfficiency: number,
        cpuTimePerInstance: number,
        gpuTimePerDrawCall: number
    },
    recommendations: string[]
}
```

### Utility Functions

#### InstancingUtils.createUnitQuad(gl)

Creates a unit quad geometry for instanced rendering.

#### InstancingUtils.createUnitCube(gl)

Creates a unit cube geometry for instanced rendering.

#### InstancingUtils.generateRandomPositions(count, radius, center)

Generates random positions in a sphere.

**Parameters:**
- `count` (number): Number of positions to generate
- `radius` (number): Sphere radius
- `center` (Array<number>): Sphere center [x, y, z]

**Returns:** Array of position arrays

## Examples

### Basic Instancing Example

```javascript
// Initialize system
const instancing = new InstancingSystem(gl, {
    maxInstances: 10000,
    enableProfiling: true
});

// Create multiple instances
for (let i = 0; i < 1000; i++) {
    const x = (i % 50) * 2 - 50;
    const z = Math.floor(i / 50) * 2 - 50;
    
    instancing.createInstance({
        position: [x, 0, z],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
        batchInfo: {
            material: cubeMaterial,
            geometry: cubeGeometry,
            shader: cubeShader
        }
    });
}
```

### LOD Instancing Example

```javascript
const system = new InstancingSystem(gl, {
    maxInstances: 50000,
    enableLOD: true
});

// Create LOD levels
const highDetailGeometry = createDetailedGeometry();
const mediumDetailGeometry = createMediumGeometry();
const lowDetailGeometry = createLowGeometry();

// Add LOD levels
system.addLODLevel(new LODInstancingLevel(0, 1000, highDetailGeometry));
system.addLODLevel(new LODInstancingLevel(50, 2000, mediumDetailGeometry));
system.addLODLevel(new LODInstancingLevel(100, 4000, lowDetailGeometry));

// Create instances
for (let i = 0; i < 7000; i++) {
    // Create instance...
    const instanceId = system.createInstance(config);
}

// Update LOD in render loop
function render() {
    system.updateLOD(camera.getPosition());
    system.render(renderer, scene);
}
```

### Performance Monitoring Example

```javascript
const system = new InstancingSystem(gl, {
    enableProfiling: true
});

// Create many instances
for (let i = 0; i < 25000; i++) {
    system.createInstance(instanceConfig);
}

function render() {
    system.render(renderer, scene);
    
    // Get performance analysis
    const analysis = system.getPerformanceAnalysis();
    
    // Check for warnings
    if (analysis.warnings.length > 0) {
        console.warn('Performance warnings:', analysis.warnings);
    }
    
    // Check recommendations
    if (analysis.recommendations.length > 0) {
        console.log('Performance recommendations:', analysis.recommendations);
    }
    
    // Monitor efficiency
    if (analysis.efficiency.batchEfficiency < 0.5) {
        console.log('Low batch efficiency - consider reducing material variety');
    }
}
```

### Custom Instanced Shader

```javascript
// Vertex shader with instancing
const vertexShaderSource = `
    attribute vec3 position;
    attribute mat4 instanceMatrix;
    attribute vec4 instanceColor; // Custom per-instance attribute
    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    
    varying vec3 vPosition;
    varying vec4 vColor;
    
    void main() {
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vPosition = worldPos.xyz;
        vColor = instanceColor;
    }
`;

// Fragment shader
const fragmentShaderSource = `
    precision mediump float;
    varying vec3 vPosition;
    varying vec4 vColor;
    
    void main() {
        gl_FragColor = vColor;
    }
`;

// Use custom attributes
const instance = new InstanceData([10, 0, 0], [0, 0, 0, 1], [1, 1, 1]);
instance.setCustomAttribute('instanceColor', [
    Math.random(),
    Math.random(),
    Math.random(),
    1.0
]);
```

## Performance Optimization

### Instance Limits

- **WebGL 1.0**: Typically limited to ~1000-5000 instances per draw call
- **WebGL 2.0**: Can handle 10,000+ instances per draw call
- **Recommended**: Keep individual batches under 1000 instances for optimal performance

### Batching Guidelines

1. **Group by Materials**: Use the same material for batchable objects
2. **Group by Geometry**: Prefer shared geometries within batches
3. **Minimize State Changes**: Reduce shader and uniform changes
4. **Custom Attributes**: Use sparingly as they can break batching

### LOD Best Practices

1. **Distance Planning**: Set LOD distances based on your scene scale
2. **Geometry Reduction**: Use significantly different poly counts between LODs
3. **Smooth Transitions**: Consider blending between LOD levels
4. **Performance Monitoring**: Monitor LOD switch frequency

### Memory Management

1. **Instance Limits**: Set reasonable max instance limits
2. **Buffer Updates**: Minimize per-frame buffer updates
3. **Geometry Sharing**: Reuse geometries across instances
4. **Cleanup**: Properly dispose of instances when no longer needed

## Browser Compatibility

### WebGL Requirements

- **WebGL 1.0**: Requires `ANGLE_instanced_arrays` extension
- **WebGL 2.0**: Native instancing support (preferred)

### Browser Support

- **Chrome**: Full support (WebGL 1.0 + 2.0)
- **Firefox**: Full support (WebGL 1.0 + 2.0)
- **Safari**: Limited WebGL 2.0 support
- **Edge**: Full support (WebGL 1.0 + 2.0)

### Feature Detection

```javascript
function checkInstancingSupport(gl) {
    // Check WebGL 2.0 instancing
    if (gl instanceof WebGL2RenderingContext) {
        return { supported: true, type: 'webgl2' };
    }
    
    // Check ANGLE_instanced_arrays extension
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (ext) {
        return { supported: true, type: 'webgl1_ext' };
    }
    
    return { supported: false, type: null };
}
```

## Best Practices

### Performance Tips

1. **Batch Similar Objects**: Group objects with identical materials and geometry
2. **Use LOD Judiciously**: Only for large scenes with distant objects
3. **Monitor Performance**: Use built-in profiling tools
4. **Optimize Shaders**: Keep vertex shaders simple for instanced rendering
5. **Update Efficiently**: Only update instance data when needed

### Memory Optimization

1. **Reuse Instances**: Clone or reuse instance data when possible
2. **Buffer Management**: Use appropriate buffer usage flags
3. **Geometry Instancing**: Prefer instancing over individual meshes
4. **Cleanup**: Dispose of unused instances and buffers

### Shader Optimization

1. **Minimal Attributes**: Only use necessary per-instance attributes
2. **Simple Transforms**: Keep matrix calculations efficient
3. **Uniform Updates**: Minimize uniform buffer updates
4. **Precision**: Use appropriate shader precision qualifiers

### Debugging

1. **Use Debug Mode**: Enable debug mode for detailed logging
2. **Performance Profiling**: Regular performance analysis
3. **Instance Limits**: Monitor instance counts and memory usage
4. **Batch Analysis**: Check batch efficiency metrics

## Integration Examples

### With Existing Mesh System

```javascript
// Convert existing mesh rendering to instanced
function convertToInstanced(meshes, material, geometry) {
    const instancing = new InstancingSystem(gl);
    
    for (const mesh of meshes) {
        const position = mesh.getWorldPosition();
        const rotation = mesh.getWorldRotation();
        const scale = mesh.getWorldScale();
        
        instancing.createInstance({
            position: [position.x, position.y, position.z],
            rotation: [rotation.x, rotation.y, rotation.z, rotation.w],
            scale: [scale.x, scale.y, scale.z],
            batchInfo: {
                material: material,
                geometry: geometry,
                shader: shader
            }
        });
    }
}
```

### With Animation System

```javascript
// Animate instanced objects
function animateInstances(instancing, animations, deltaTime) {
    for (const [instanceId, animation] of animations.entries()) {
        animation.update(deltaTime);
        
        const transform = animation.getCurrentTransform();
        instancing.updateInstance(instanceId, {
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale
        });
    }
}
```

## License

This instancing system is part of the Three.js-style 3D graphics library and follows the same license terms.

## Contributing

Contributions are welcome! Please see the main project contributing guidelines.

## Support

For questions, issues, or feature requests, please refer to the main project repository.