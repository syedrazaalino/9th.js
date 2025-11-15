# WebGL Renderer

A comprehensive WebGL renderer with advanced context management, shader compilation, rendering pipeline, error handling, and optimization features.

## Features

### 🎯 Core Functionality
- **Comprehensive WebGL Context Management**: Automatic context creation with fallbacks (WebGL2 → WebGL1)
- **Shader Compilation System**: Built-in shader compiler with error handling and optimization
- **Rendering Pipeline**: Efficient rendering pipeline with frustum culling and optimization
- **Error Handling**: Robust error handling with context loss recovery
- **Performance Monitoring**: Real-time performance metrics and profiling

### 🔧 Context Management
- Automatic WebGL version detection and fallback
- Context loss/restoration handling
- Extension management and feature detection
- Device pixel ratio handling
- Canvas resizing with proper viewport management

### 🎨 Shader System
- Built-in shader compilation and linking
- Default shader templates (basic, unlit)
- Uniform and attribute management
- Shader cache and optimization
- Error reporting with detailed shader compilation logs

### 🚀 Optimization Features
- **Frustum Culling**: Automatic view frustum culling for visible objects only
- **Distance Culling**: Configurable distance-based culling
- **Level of Detail (LOD)**: Automatic LOD selection based on distance
- **Instancing Support**: Hardware instancing for efficient rendering of multiple objects
- **Performance Monitoring**: Real-time FPS, draw calls, triangle count tracking

### 📊 Performance Monitoring
- Frame rate calculation (FPS)
- Draw call counting
- Triangle and vertex counting
- Memory usage tracking
- Error logging and reporting
- WebGL operation profiling

### 🛠️ Resource Management
- Buffer management (vertex, index, uniform buffers)
- Texture creation and management (2D, cubemap, compressed textures)
- Framebuffer creation with multiple attachments
- Automatic resource cleanup on context loss
- Resource tracking and memory monitoring

## Installation

```javascript
import { WebGLRenderer } from './src/core/WebGLRenderer.js';
import { WebGLUtils } from './src/core/WebGLUtils.js';
```

## Basic Usage

### Initialize WebGL Renderer

```javascript
const canvas = document.getElementById('myCanvas');

// Create WebGL renderer with options
const renderer = new WebGLRenderer(canvas, {
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
});

// Get WebGL context
const gl = renderer.getContext();
```

### Setup Scene and Render Loop

```javascript
import { Scene } from './src/core/Scene.js';
import { Object3D } from './src/core/Object3D.js';

// Create scene
const scene = new Scene();

// Create camera (assuming you have a Camera class)
const camera = new Camera();
scene.setActiveCamera(camera);

// Create objects
const cube = new Object3D();
cube.name = 'My Cube';
scene.addObject(cube);

// Render loop
function render() {
    // Update scene
    scene.update(deltaTime);
    
    // Render scene
    renderer.render(scene, camera);
    
    requestAnimationFrame(render);
}

render();
```

### Shader Compilation

```javascript
// Compile custom shaders
const vertexShader = `
    attribute vec3 position;
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    precision mediump float;
    uniform vec3 color;
    
    void main() {
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Compile shader program
const programId = renderer.compileShader(vertexShader, fragmentShader);

// Get program data
const programData = renderer.programs.get(programId);
const uniformLocation = programData.uniforms['color'];
```

### Buffer Creation

```javascript
// Create vertex buffer
const vertices = new Float32Array([
    0.0, 0.5, 0.0,   // Vertex 1
    -0.5, -0.5, 0.0, // Vertex 2
    0.5, -0.5, 0.0   // Vertex 3
]);

const bufferId = renderer.createBuffer(vertices);

// Create index buffer
const indices = new Uint16Array([0, 1, 2]);
const indexBufferId = renderer.createBuffer(indices, gl.ELEMENT_ARRAY_BUFFER);
```

### Texture Creation

```javascript
// Create 2D texture
const textureData = new Uint8Array([
    255, 0, 0, 255,  // Red
    0, 255, 0, 255,  // Green
    0, 0, 255, 255,  // Blue
    255, 255, 0, 255 // Yellow
]);

const textureId = renderer.createTexture(textureData, 2, 2, {
    wrapS: gl.REPEAT,
    wrapT: gl.REPEAT,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR,
    generateMipmaps: true
});
```

### Framebuffer Creation

```javascript
// Create framebuffer with color and depth attachments
const framebuffer = WebGLUtils.createFramebuffer(gl, 1024, 1024, {
    color: true,
    depth: true,
    stencil: false
});

// Render to framebuffer
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
renderer.render(scene, camera);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
```

## Advanced Features

### Context Loss Handling

```javascript
// Listen for context events
renderer.on('contextlost', (data) => {
    console.log('WebGL context lost');
    // Pause rendering, cleanup resources
});

renderer.on('contextrestored', (data) => {
    console.log('WebGL context restored');
    // Reinitialize resources, resume rendering
});
```

### Performance Monitoring

```javascript
// Get performance metrics
const performance = renderer.getPerformance();
console.log('FPS:', performance.fps);
console.log('Draw Calls:', performance.drawCalls);
console.log('Triangles:', performance.triangles);
console.log('Render Time:', performance.renderTime);

// Enable debug mode for detailed logging
renderer.setDebugMode(true);
```

### Culling Settings

```javascript
// Enable/disable culling
renderer.enable('frustum_culling', true);
renderer.enable('distance_culling', true);
renderer.enable('occlusion_culling', false);

// Set maximum render distance
renderer.maxDistance = 1000;

// Enable automatic pixel ratio handling
renderer.enable('pixel_ratio', true);
```

### Error Handling

```javascript
// Check for WebGL errors
renderer.checkGLError('after draw call');

// Get error log
const errors = renderer.getErrors();
errors.forEach(error => {
    console.error('WebGL Error:', error.error, 'at', new Date(error.timestamp));
});

// Clear error log
renderer.clearErrors();
```

## WebGL Utilities

The `WebGLUtils` module provides additional helper functions:

### Context Creation

```javascript
import { createWebGLContext } from './src/core/WebGLUtils.js';

const { context, version, extensions } = createWebGLContext(canvas, {
    antialias: true,
    depth: true
}, ['WEBGL_depth_texture', 'OES_texture_float']);
```

### Shader Program Creation

```javascript
import { createShaderProgram } from './src/core/WebGLUtils.js';

const shaderProgram = createShaderProgram(gl, vertexSource, fragmentSource);
```

### Performance Profiling

```javascript
import { WebGLPerformanceProfiler } from './src/core/WebGLUtils.js';

const profiler = new WebGLPerformanceProfiler(gl);

// Profile operations
profiler.profileOperation('draw call', () => {
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
});

const fps = profiler.getFPS();
const operationProfiles = profiler.getOperationProfiles();
```

### Resource Tracking

```javascript
import { WebGLResourceTracker } from './src/core/WebGLUtils.js';

const tracker = new WebGLResourceTracker(gl);

// Track resources
tracker.trackBuffer('vertices', vertexBuffer, vertexData.byteLength);
tracker.trackTexture('diffuse', texture, estimatedSize);

// Get memory usage
const memoryUsage = tracker.getTotalMemoryUsage();
const resourceStats = tracker.getResourceStats();
```

## Integration with Engine

For a complete 3D engine experience, use the `Engine` class:

```javascript
import { Engine } from './src/core/engine.js';

// Create engine
const engine = new Engine(canvas, {
    antialias: true,
    alpha: false,
    depth: true
});

// Start render loop
engine.start();

// Get renderer
const renderer = engine.getRenderer();

// Get scene
const scene = engine.getScene();
```

## Configuration Options

### WebGL Renderer Options

```javascript
const options = {
    antialias: true,                    // Enable antialiasing
    alpha: false,                       // Enable alpha blending
    depth: true,                        // Enable depth buffering
    stencil: false,                     // Enable stencil buffering
    powerPreference: 'high-performance', // GPU power preference
    failIfMajorPerformanceCaveat: false, // Fail on performance issues
    preserveDrawingBuffer: false        // Preserve framebuffer content
};
```

### Texture Options

```javascript
const textureOptions = {
    format: gl.RGBA,                    // Texture format
    type: gl.UNSIGNED_BYTE,             // Data type
    wrapS: gl.REPEAT,                   // Horizontal wrapping
    wrapT: gl.REPEAT,                   // Vertical wrapping
    minFilter: gl.LINEAR_MIPMAP_LINEAR, // Minification filter
    magFilter: gl.LINEAR,               // Magnification filter
    generateMipmaps: true               // Generate mipmaps
};
```

## Examples

See the following example files:
- `examples/webgl-renderer-example.js` - Comprehensive usage examples
- `examples/webgl-renderer-demo.html` - Interactive demo with UI

## Browser Compatibility

- **WebGL 2.0**: Full support with enhanced features
- **WebGL 1.0**: Full support with fallbacks
- **Required Extensions**: Optional, with graceful degradation
- **Context Loss**: Automatic handling and recovery

## Performance Considerations

### Optimization Tips

1. **Enable Culling**: Use frustum and distance culling for large scenes
2. **Batch Rendering**: Group similar objects to reduce draw calls
3. **LOD System**: Implement level-of-detail for complex models
4. **Texture Compression**: Use compressed textures when available
5. **Instance Rendering**: Use hardware instancing for repeated objects
6. **Framebuffers**: Use render-to-texture for post-processing effects

### Monitoring

- Monitor FPS and render time for performance issues
- Track memory usage to prevent GPU memory leaks
- Check draw call count - aim for efficient batching
- Monitor triangle count for geometric complexity

## Error Handling

The renderer includes comprehensive error handling:

- **Shader Compilation Errors**: Detailed error messages with source code
- **Context Loss**: Automatic detection and recovery
- **Resource Limits**: Graceful handling of GPU memory limits
- **WebGL Errors**: Automatic error checking in debug mode

## API Reference

### WebGLRenderer Class

#### Constructor
```javascript
new WebGLRenderer(canvas, options)
```

#### Methods
- `getContext()` - Get WebGL context
- `getCapabilities()` - Get WebGL capabilities and extensions
- `getFeatures()` - Get supported features
- `render(scene, camera)` - Render scene
- `compileShader(vertexSource, fragmentSource)` - Compile shaders
- `createBuffer(data, target, usage)` - Create buffer
- `createTexture(data, width, height, options)` - Create texture
- `getPerformance()` - Get performance metrics
- `enable(feature, enabled)` - Enable/disable features
- `setDebugMode(enabled)` - Enable debug mode
- `dispose()` - Cleanup resources

#### Events
- `rendered` - Fired after each frame
- `error` - Fired on errors
- `contextlost` - Fired on context loss
- `contextrestored` - Fired on context restoration

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for any improvements.