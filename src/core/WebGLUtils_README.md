# WebGLUtils.js

Comprehensive WebGL utilities and extensions for managing WebGL operations, including helper functions, extension management, texture utilities, framebuffer management, and performance monitoring.

## Features

### WebGL Context Management
- **Context Creation**: Create WebGL contexts with automatic fallbacks (WebGL2 → WebGL1)
- **Context Validation**: Check for required extensions and capabilities
- **Error Handling**: Comprehensive error reporting and validation

### Shader Utilities
- **Shader Compilation**: Easy shader compilation with error checking
- **Program Linking**: Create complete shader programs from source
- **Resource Management**: Automatic cleanup of shader resources

### Buffer Management
- **Buffer Creation**: Create and configure WebGL buffers
- **Buffer Updates**: Efficient buffer data updates
- **Vertex Array Objects (VAO)**: WebGL2 VAO support with attribute configuration

### Texture Utilities
- **2D Textures**: Create 2D textures from images, ImageData, or raw data
- **Cube Maps**: Support for cube map textures
- **Texture Parameters**: Flexible texture parameter configuration
- **Mipmap Generation**: Automatic mipmap generation

### Framebuffer Management
- **Framebuffer Creation**: Create framebuffers with color/depth/stencil attachments
- **Render Targets**: Multiple render target support
- **Framebuffer Validation**: Check framebuffer completeness
- **Resource Cleanup**: Proper cleanup of framebuffer resources

### Extension Management
- **ExtensionManager**: Class for managing WebGL extensions
- **Required Extensions**: Force required extensions with error handling
- **Optional Extensions**: Gracefully handle optional extensions

### Performance Monitoring
- **WebGLPerformanceProfiler**: Track WebGL operation performance
  - Operation timing (calls, total time, min/max/avg times)
  - Frame rate monitoring
  - FPS calculation
  - Performance reporting
- **WebGLResourceTracker**: Monitor GPU resource usage
  - Buffer tracking
  - Texture memory estimation
  - Resource statistics

## Usage Examples

### Basic WebGL Context Creation

```javascript
import { createWebGLContext, logContextInfo } from './WebGLUtils.js';

const canvas = document.getElementById('canvas');
const { context, version, extensions } = createWebGLContext(canvas, {
    antialias: true,
    alpha: false
}, ['OES_element_index_uint']);

logContextInfo(context, true);
```

### Shader Program Creation

```javascript
import { createShaderProgram, deleteShaderProgram } from './WebGLUtils.js';

const vertexShaderSource = `
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 color;
    
    void main() {
        gl_FragColor = vec4(color, 1.0);
    }
`;

const shaderProgram = createShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

// Use the program
gl.useProgram(shaderProgram.program);

// Clean up when done
deleteShaderProgram(gl, shaderProgram);
```

### Texture Creation

```javascript
import { createTexture2D } from './WebGLUtils.js';

const texture = createTexture2D(gl, imageElement, {
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    generateMipmaps: false
});

// Update texture from new image
import { updateTextureFromImage } from './WebGLUtils.js';
updateTextureFromImage(gl, texture, newImageElement);
```

### Framebuffer Creation

```javascript
import { createFramebuffer, bindFramebuffer } from './WebGLUtils.js';

// Create offscreen framebuffer
const offscreenBuffer = createFramebuffer(gl, 1024, 1024, {
    color: true,
    depth: true,
    stencil: false
});

// Render to offscreen buffer
bindFramebuffer(gl, offscreenBuffer);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Perform rendering operations
renderScene();

// Switch back to default framebuffer
bindFramebuffer(gl, null);
```

### Extension Management

```javascript
import { ExtensionManager } from './WebGLUtils.js';

const extensionManager = new ExtensionManager(gl, extensions);

// Require specific extension
const instancedArrays = extensionManager.require('ANGLE_instanced_arrays');

// Use optional extension
extensionManager.optional('OES_standard_derivatives', (ext) => {
    // Use extension if available
});

// Check extension info
console.log(extensionManager.getExtensionInfo());
```

### Performance Monitoring

```javascript
import { WebGLPerformanceProfiler, WebGLResourceTracker } from './WebGLUtils.js';

// Create profiler
const profiler = new WebGLPerformanceProfiler(gl);
const resourceTracker = new WebGLResourceTracker(gl);

// Profile operations
profiler.startFrame();

profiler.profileOperation('drawMesh', () => {
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
});

profiler.endFrame();

// Get performance report
const report = profiler.getReport();
console.log('FPS:', report.frame.fps);
console.log('Operation profiles:', report.operations);

// Track resources
resourceTracker.trackBuffer('vertices', vertexBuffer, vertexData.byteLength);
resourceTracker.trackTexture('diffuse', texture, estimatedTextureSize);

const stats = resourceTracker.getResourceStats();
console.log('GPU Memory Usage:', stats.totalBytes);
```

### Common Utilities

```javascript
import { 
    checkGLError, 
    setDepthTest, 
    setBlending, 
    clearBuffers,
    getContextInfo
} from './WebGLUtils.js';

// Error checking
const error = checkGLError(gl);
if (error) {
    console.error('WebGL Error:', error);
}

// Render state setup
setDepthTest(gl, true);
setBlending(gl, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// Clear buffers
clearBuffers(gl, [0.5, 0.5, 0.8, 1.0], 1.0);

// Get context information
const info = getContextInfo(gl);
console.log('Max Texture Size:', info.maxTextureSize);
```

## API Reference

### Functions

#### Context Management
- `createWebGLContext(canvas, attributes, requiredExtensions)` - Create WebGL context with fallbacks
- `getContextExtensions(gl)` - Get all available extensions

#### Shader Utilities
- `compileShader(gl, type, source)` - Compile shader from source
- `createProgram(gl, vertexShader, fragmentShader)` - Link shaders into program
- `createShaderProgram(gl, vertexSource, fragmentSource)` - Create complete program
- `deleteShaderProgram(gl, shaderObject)` - Clean up shader resources

#### Buffer Management
- `createBuffer(gl, data, target, usage)` - Create and configure buffer
- `updateBuffer(gl, buffer, data, target, usage)` - Update buffer data
- `createVertexArray(gl, attributes)` - Create WebGL2 VAO

#### Texture Utilities
- `createTexture2D(gl, source, options)` - Create 2D texture
- `createTextureCube(gl, faces, options)` - Create cube map texture
- `updateTextureFromImage(gl, texture, source, options)` - Update texture from image
- `setTextureParameters(gl, texture, target, parameters)` - Configure texture parameters

#### Framebuffer Management
- `createFramebuffer(gl, width, height, options)` - Create framebuffer with attachments
- `bindFramebuffer(gl, framebufferObject)` - Bind framebuffer for rendering
- `deleteFramebuffer(gl, framebufferObject)` - Clean up framebuffer resources
- `getFramebufferErrorMessage(status)` - Get human-readable error message

#### Utility Functions
- `isValidContext(gl)` - Check if WebGL context is valid
- `getContextInfo(gl)` - Get comprehensive context information
- `logContextInfo(gl, verbose)` - Log context information to console
- `checkGLError(gl)` - Check for WebGL errors
- `setDepthTest(gl, enabled, func)` - Enable/disable depth testing
- `setBlending(gl, enabled, srcFactor, dstFactor)` - Configure blending
- `clearBuffers(gl, color, depth)` - Clear color and depth buffers

### Classes

#### ExtensionManager
- `has(name)` - Check if extension is available
- `get(name)` - Get extension object
- `require(name)` - Require extension (throws if not available)
- `optional(name, callback)` - Use extension if available
- `getAvailableExtensions()` - Get all available extension names
- `getExtensionInfo()` - Get extension information

#### WebGLPerformanceProfiler
- `startOperation(name)` - Start timing operation
- `endOperation(name)` - End timing operation
- `profileOperation(name, operation)` - Profile a function call
- `startFrame()` - Mark frame start
- `endFrame()` - Mark frame end
- `getFPS()` - Get current FPS
- `getOperationProfiles()` - Get all operation profiles
- `getFrameStats()` - Get frame statistics
- `getReport()` - Get comprehensive performance report
- `clearProfiles()` - Clear all profiles

#### WebGLResourceTracker
- `trackBuffer(id, buffer, byteLength)` - Track buffer resource
- `trackTexture(id, texture, byteLength)` - Track texture resource
- `trackFramebuffer(id, framebufferObject)` - Track framebuffer resource
- `untrackResource(type, id)` - Untrack resource
- `getTotalMemoryUsage()` - Get total GPU memory usage
- `getResourceStats()` - Get resource statistics
- `getTrackedResources()` - Get all tracked resources
- `clear()` - Clear all tracked resources

## Constants

- `DEFAULT_WEBGL_ATTRIBUTES` - Default WebGL context attributes
- `DEFAULT_TEXTURE_OPTIONS` - Default texture configuration options
- `DEFAULT_FRAMEBUFFER_OPTIONS` - Default framebuffer configuration options

## Best Practices

1. **Always check for WebGL support** before attempting to use WebGL features
2. **Validate extensions** before using extension-specific features
3. **Use performance profiling** to identify bottlenecks in rendering code
4. **Clean up resources** properly using the provided cleanup functions
5. **Monitor GPU memory usage** with the resource tracker
6. **Handle errors gracefully** using the error checking utilities
7. **Use framebuffers for post-processing** effects and offscreen rendering
8. **Profile texture usage** to optimize memory consumption

## Browser Compatibility

- **WebGL 1.0**: Supported in all modern browsers
- **WebGL 2.0**: Supported in modern browsers (Chrome 56+, Firefox 51+, Safari 15+)
- **Extensions**: Availability varies by browser and hardware

## Performance Considerations

1. **Buffer updates** are faster than texture updates
2. **Texture compression** can significantly reduce memory usage
3. **Framebuffers** should be reused when possible
4. **VAOs** provide performance improvements in WebGL2
5. **Profile regularly** to identify performance issues
6. **Monitor memory usage** to prevent GPU memory exhaustion

## License

This WebGL utilities module is part of the core WebGL framework and follows the same licensing terms.
