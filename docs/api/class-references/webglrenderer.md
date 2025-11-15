# WebGLRenderer Class Reference

The `WebGLRenderer` class is responsible for rendering 3D scenes using WebGL. It handles context creation, shader compilation, rendering pipeline, and optimization features.

## Constructor

```javascript
new WebGLRenderer(canvas, options)
```

Creates a new WebGL renderer.

**Parameters:**
- `canvas: HTMLCanvasElement` - The canvas element to render to
- `options?: WebGLRendererOptions` - Configuration options

**Example:**
```javascript
const canvas = document.getElementById('canvas');
const renderer = new WebGLRenderer(canvas, {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});
```

## Options

### `WebGLRendererOptions`
```javascript
{
    antialias?: boolean;           // Enable antialiasing (default: true)
    alpha?: boolean;               // Enable alpha channel (default: false)
    depth?: boolean;               // Enable depth buffer (default: true)
    stencil?: boolean;             // Enable stencil buffer (default: false)
    powerPreference?: string;      // GPU preference (default: 'high-performance')
    failIfMajorPerformanceCaveat?: boolean; // Fail if no hardware acceleration (default: false)
    preserveDrawingBuffer?: boolean; // Preserve drawing buffer (default: false)
    premultipliedAlpha?: boolean;  // Premultiplied alpha (default: true)
    logarithmicDepthBuffer?: boolean; // Logarithmic depth buffer (default: false)
}
```

**Example with all options:**
```javascript
const renderer = new WebGLRenderer(canvas, {
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    logarithmicDepthBuffer: false
});
```

## Properties

### `canvas: HTMLCanvasElement`
- **Description**: Target canvas element
- **Type**: `HTMLCanvasElement`
- **Read-only**: Yes

```javascript
console.log(renderer.canvas.width, renderer.canvas.height);
```

### `context: WebGLRenderingContext`
- **Description**: WebGL context
- **Type**: `WebGLRenderingContext`
- **Read-only**: Yes

```javascript
const gl = renderer.context;
gl.clearColor(1, 0, 0, 1); // Direct WebGL usage
```

### `capabilities: WebGLCapabilities`
- **Description**: GPU capabilities and limits
- **Type**: `WebGLCapabilities`
- **Read-only**: Yes

```javascript
console.log(`Max texture size: ${renderer.capabilities.maxTextureSize}`);
console.log(`Max vertex attributes: ${renderer.capabilities.maxVertexAttribs}`);
console.log(`WebGL version: ${renderer.capabilities.version}`);
```

**Available capabilities:**
- `maxTextureSize: number` - Maximum texture size
- `maxVertexAttribs: number` - Maximum vertex attributes
- `maxVertexUniformVectors: number` - Maximum vertex uniforms
- `maxFragmentUniformVectors: number` - Maximum fragment uniforms
- `version: string` - WebGL version
- `vendor: string` - GPU vendor
- `renderer: string` - GPU renderer
- `extensions: string[]` - Supported extensions
- `isWebGL2: boolean` - WebGL2 support

### `clearColor: { r: number, g: number, b: number, a: number }`
- **Description**: Clear color for the color buffer
- **Type**: `Object`
- **Default**: `{ r: 0.0, g: 0.0, b: 0.0, a: 1.0 }`

```javascript
// Set to red with full opacity
renderer.clearColor = { r: 1, g: 0, b: 0, a: 1 };

// Or using helper method
renderer.setClearColor(0xFF0000, 1);
```

### `clearDepth: number`
- **Description**: Clear value for the depth buffer
- **Type**: `number`
- **Default**: `1.0`

```javascript
renderer.clearDepth = 1.0; // Clear depth to far plane
```

### `clearStencil: number`
- **Description**: Clear value for the stencil buffer
- **Type**: `number`
- **Default**: `0`

```javascript
renderer.clearStencil = 0;
```

### `autoClear: boolean`
- **Description**: Automatically clear buffers before rendering
- **Type**: `boolean`
- **Default**: `true`

```javascript
// Disable auto clearing for custom effects
renderer.autoClear = false;
renderer.clear(); // Manual clear when needed
```

### `autoClearColor: boolean`
- **Description**: Automatically clear color buffer
- **Type**: `boolean`
- **Default**: `true`

### `autoClearDepth: boolean`
- **Description**: Automatically clear depth buffer
- **Type**: `boolean`
- **Default**: `true`

### `autoClearStencil: boolean`
- **Description**: Automatically clear stencil buffer
- **Type**: `boolean`
- **Default**: `true`

```javascript
// Selective clearing
renderer.autoClear = false;
renderer.autoClearColor = true;
renderer.autoClearDepth = true;
renderer.autoClearStencil = false;
```

### `performance: PerformanceMetrics`
- **Description**: Performance monitoring data
- **Type**: `PerformanceMetrics`
- **Read-only**: Yes

**Properties:**
- `frameTime: number` - Current frame render time
- `renderTime: number` - Time spent rendering
- `drawCalls: number` - Draw calls this frame
- `triangles: number` - Triangles rendered this frame
- `vertices: number` - Vertices processed this frame
- `lastFrameTime: number` - Previous frame time
- `fps: number` - Frames per second
- `memoryUsage: number` - GPU memory usage

```javascript
// Monitor performance
console.log(`FPS: ${renderer.performance.fps}`);
console.log(`Triangles: ${renderer.performance.triangles}`);
console.log(`Draw calls: ${renderer.performance.drawCalls}`);
console.log(`Frame time: ${renderer.performance.frameTime.toFixed(2)}ms`);
```

### `errors: string[]`
- **Description**: Array of WebGL errors
- **Type**: `string[]`
- **Read-only**: Yes

```javascript
// Check for recent errors
if (renderer.errors.length > 0) {
    console.warn('WebGL Errors:', renderer.errors);
    renderer.errors.length = 0; // Clear errors
}
```

### `debugMode: boolean`
- **Description**: Enable debug mode for additional logging
- **Type**: `boolean`
- **Default**: `false`

```javascript
renderer.debugMode = true; // Enable verbose logging
```

### `enableDistanceCulling: boolean`
- **Description**: Enable distance-based culling
- **Type**: `boolean`
- **Default**: `true`

### `enableFrustumCulling: boolean`
- **Description**: Enable frustum culling
- **Type**: `boolean`
- **Default**: `true`

### `enableOcclusionCulling: boolean`
- **Description**: Enable occlusion culling (experimental)
- **Type**: `boolean`
- **Default**: `false`

### `maxDistance: number`
- **Description**: Maximum distance for distance culling
- **Type**: `number`
- **Default**: `1000`

```javascript
// Optimize large scenes
renderer.enableDistanceCulling = true;
renderer.maxDistance = 500; // Cull objects farther than 500 units
```

### `lodBias: number`
- **Description**: Level-of-detail bias for LOD systems
- **Type**: `number`
- **Default**: `0`

### `shadowMapEnabled: boolean`
- **Description**: Enable shadow mapping
- **Type**: `boolean`
- **Default**: `false`

```javascript
// Enable shadows
renderer.shadowMapEnabled = true;
directionalLight.castShadow = true;
```

### `pixelRatio: number`
- **Description**: Device pixel ratio for rendering
- **Type**: `number`
- **Default**: `window.devicePixelRatio`

```javascript
// Set fixed pixel ratio for consistent rendering
renderer.setPixelRatio(window.devicePixelRatio);
```

## Methods

### `init()`
Initialize the WebGL renderer.

**Returns:** `Promise<void>`

**Example:**
```javascript
async function initializeRenderer() {
    try {
        await renderer.init();
        console.log('Renderer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize renderer:', error);
    }
}
```

### `render(scene, camera)`
Render a scene with a camera.

**Parameters:**
- `scene: Scene` - Scene to render
- `camera: Camera` - Camera to render from

**Example:**
```javascript
const scene = new Scene();
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);

function animate() {
    requestAnimationFrame(animate);
    
    // Update scene
    scene.update(deltaTime);
    
    // Render
    renderer.render(scene, camera);
}
```

### `setSize(width, height)`
Set the renderer's size.

**Parameters:**
- `width: number` - New width in pixels
- `height: number` - New height in pixels

**Example:**
```javascript
// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
```

### `setPixelRatio(ratio)`
Set the device pixel ratio.

**Parameters:**
- `ratio: number` - Pixel ratio (typically window.devicePixelRatio)

**Example:**
```javascript
// For high-DPI displays
renderer.setPixelRatio(window.devicePixelRatio);

// For performance on mobile
renderer.setPixelRatio(1); // Disable retina rendering
```

### `setClearColor(color, alpha?)`
Set the clear color.

**Parameters:**
- `color: string | number | Color` - Color value
- `alpha?: number` - Alpha value (0-1)

**Supported formats:**
- Hex string: `'#FF0000'` or `'#F00'`
- RGB string: `'rgb(255, 0, 0)'`
- Number: `0xFF0000`
- Color object: `new Color(1, 0, 0)`

**Example:**
```javascript
// Using different color formats
renderer.setClearColor('#FF0000');
renderer.setClearColor(0xFF0000);
renderer.setClearColor(new Color(1, 0, 0));
renderer.setClearColor('rgb(255, 0, 0)');
renderer.setClearColor('#FF0000', 0.5); // Semi-transparent
```

### `clear(color?, depth?, stencil?)`
Clear the framebuffer.

**Parameters:**
- `color?: boolean` - Clear color buffer
- `depth?: boolean` - Clear depth buffer  
- `stencil?: boolean` - Clear stencil buffer

**Example:**
```javascript
// Clear all buffers
renderer.clear();

// Clear only color and depth
renderer.clear(true, true, false);

// Selective clearing for custom effects
renderer.autoClear = false;
renderer.clear(true, true, true); // Manual full clear
renderer.clear(false, true, false); // Clear only depth
```

### `compileShader(source, type)`
Compile a GLSL shader.

**Parameters:**
- `source: string` - Shader source code
- `type: number` - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)

**Returns:** `WebGLShader` - Compiled shader

**Example:**
```javascript
const vertexShaderSource = `
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const vertexShader = renderer.compileShader(vertexShaderSource, gl.VERTEX_SHADER);
```

### `createProgram(vertexShader, fragmentShader)`
Create a shader program.

**Parameters:**
- `vertexShader: WebGLShader` - Vertex shader
- `fragmentShader: WebGLShader` - Fragment shader

**Returns:** `WebGLProgram` - Linked shader program

**Example:**
```javascript
const program = renderer.createProgram(vertexShader, fragmentShader);
console.log(`Shader program created:`, program);
```

### `getContext()`
Get the WebGL context.

**Returns:** `WebGLRenderingContext`

```javascript
const gl = renderer.getContext();
if (!gl) {
    console.error('WebGL not supported');
} else {
    console.log(`WebGL version: ${gl.getParameter(gl.VERSION)}`);
}
```

### `getCapabilities()`
Get GPU capabilities and limits.

**Returns:** `WebGLCapabilities`

```javascript
const caps = renderer.getCapabilities();
console.log('GPU Capabilities:');
console.log(`  Max texture size: ${caps.maxTextureSize}`);
console.log(`  Max vertex attributes: ${caps.maxVertexAttribs}`);
console.log(`  Extensions: ${caps.extensions.join(', ')}`);
```

### `checkError()`
Check for WebGL errors.

**Returns:** `string[]` - Array of error messages

```javascript
// Check for errors after rendering
const errors = renderer.checkError();
if (errors.length > 0) {
    console.error('WebGL Errors:', errors);
}
```

### `setUniforms(program, uniforms)`
Set uniform values for a program.

**Parameters:**
- `program: WebGLProgram` - Shader program
- `uniforms: Object` - Uniform name-value pairs

**Example:**
```javascript
renderer.setUniforms(program, {
    'color': [1.0, 0.0, 0.0],
    'opacity': 0.8,
    'time': performance.now() * 0.001
});
```

### `createTexture(options)`
Create a new texture.

**Parameters:**
- `options: TextureOptions` - Texture configuration

**Returns:** `WebGLTexture`

```javascript
const texture = renderer.createTexture({
    width: 512,
    height: 512,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    data: pixelData
});
```

### `createBuffer(target, usage)`
Create a new buffer.

**Parameters:**
- `target: number` - Buffer target
- `usage: number` - Buffer usage hint

**Returns:** `WebGLBuffer`

```javascript
// Create vertex buffer
const vertexBuffer = renderer.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW);

// Create index buffer
const indexBuffer = renderer.createBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
```

### `enable(state, capability)`
Enable a WebGL state.

**Parameters:**
- `state: WebGLState` - State manager
- `capability: number` - Capability to enable

**Example:**
```javascript
renderer.enable(state, gl.DEPTH_TEST);
renderer.enable(state, gl.CULL_FACE);
```

### `disable(state, capability)`
Disable a WebGL state.

**Parameters:**
- `state: WebGLState` - State manager
- `capability: number` - Capability to disable

**Example:**
```javascript
renderer.disable(state, gl.DEPTH_TEST);
renderer.disable(state, gl.CULL_FACE);
```

### `viewport(x, y, width, height)`
Set the WebGL viewport.

**Parameters:**
- `x: number` - X position
- `y: number` - Y position
- `width: number` - Viewport width
- `height: number` - Viewport height

```javascript
// Set viewport to canvas size
renderer.viewport(0, 0, canvas.width, canvas.height);
```

### `scissor(x, y, width, height)`
Set the scissor test area.

**Parameters:**
- `x: number` - X position
- `y: number` - Y position
- `width: number` - Scissor width
- `height: number` - Scissor height

```javascript
// Enable scissor test for clipping
renderer.enable(state, gl.SCISSOR_TEST);
renderer.scissor(100, 100, 200, 200);
```

### `enableCulling(options)`
Configure culling options.

**Parameters:**
- `options: CullingOptions` - Culling configuration

```javascript
renderer.enableCulling({
    frustum: true,
    distance: true,
    occlusion: false,
    maxDistance: 1000
});
```

### `setShadowMap(options)`
Configure shadow mapping.

**Parameters:**
- `options: ShadowMapOptions` - Shadow map settings

```javascript
renderer.setShadowMap({
    enabled: true,
    type: gl.PCF_SHADOW_MAP,
    size: 1024,
    bias: 0.0001,
    normalBias: 0.0
});
```

### `getRenderTarget()`
Get the current render target.

**Returns:** `RenderTarget | null`

```javascript
const currentTarget = renderer.getRenderTarget();
if (currentTarget) {
    console.log(`Rendering to: ${currentTarget.width}x${currentTarget.height}`);
}
```

### `setRenderTarget(target)`
Set render target for offscreen rendering.

**Parameters:**
- `target: RenderTarget | null` - Render target

```javascript
// Render to texture
const renderTarget = new RenderTarget(512, 512);
renderer.setRenderTarget(renderTarget);
// ... render scene ...
renderer.setRenderTarget(null); // Back to screen
```

### `readPixels(x, y, width, height, format?, type?)`
Read pixels from the framebuffer.

**Parameters:**
- `x: number` - X position
- `y: number` - Y position
- `width: number` - Width
- `height: number` - Height
- `format?: number` - Pixel format
- `type?: number` - Data type

**Returns:** `Uint8Array` - Pixel data

```javascript
// Read single pixel at center
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const pixel = renderer.readPixels(centerX, centerY, 1, 1);
console.log(`Pixel color: R=${pixel[0]}, G=${pixel[1]}, B=${pixel[2]}, A=${pixel[3]}`);

// Read entire framebuffer
const frameData = renderer.readPixels(0, 0, canvas.width, canvas.height);
```

### `getContextAttributes()`
Get WebGL context attributes.

**Returns:** `WebGLContextAttributes`

```javascript
const attrs = renderer.getContextAttributes();
console.log('Context attributes:');
console.log(`  Alpha: ${attrs.alpha}`);
console.log(`  Depth: ${attrs.depth}`);
console.log(`  Stencil: ${attrs.stencil}`);
console.log(`  Antialias: ${attrs.antialias}`);
console.log(`  PreserveDrawingBuffer: ${attrs.preserveDrawingBuffer}`);
```

### `getExtension(extensionName)`
Get a WebGL extension.

**Parameters:**
- `extensionName: string` - Extension name

**Returns:** `any` - Extension object or null

```javascript
// Check for common extensions
const instanced = renderer.getExtension('ANGLE_instanced_arrays');
const debug = renderer.getExtension('WEBGL_debug_renderer_info');

if (instanced) {
    console.log('Instanced rendering supported');
}

if (debug) {
    console.log('Debug info:', renderer.getExtension('WEBGL_debug_renderer_info'));
}
```

### `dispose()`
Clean up renderer resources.

**Example:**
```javascript
// Clean up when no longer needed
renderer.dispose();

// Dispose all GPU resources
renderer.shaders.forEach(shader => shader.dispose());
renderer.buffers.forEach(buffer => gl.deleteBuffer(buffer));
renderer.textures.forEach(texture => gl.deleteTexture(texture));
renderer.framebuffers.forEach(fb => gl.deleteFramebuffer(fb));
```

## Complete Usage Example

```javascript
// Initialize renderer
const canvas = document.getElementById('canvas');
const renderer = new WebGLRenderer(canvas, {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});

// Set up renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor('#2C3E50');

// Enable shadows
renderer.shadowMapEnabled = true;

// Create scene and camera
const scene = new Scene();
scene.setBackground('#34495E');

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
scene.addCamera(camera);

// Add lighting
const ambientLight = new AmbientLight(0xffffff, 0.2);
scene.addLight(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
scene.addLight(directionalLight);

// Create objects
const cube = new Mesh(
    new BoxGeometry(2, 2, 2),
    new MeshStandardMaterial({ 
        color: '#3498DB',
        roughness: 0.5,
        metalness: 0.1
    })
);
cube.castShadow = true;
cube.receiveShadow = true;
scene.addObject(cube);

const plane = new Mesh(
    new PlaneGeometry(10, 10),
    new MeshStandardMaterial({ color: '#95A5A6' })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
plane.receiveShadow = true;
scene.addObject(plane);

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Animation loop with performance monitoring
const clock = new Clock();
let frameCount = 0;
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = performance.now();
    frameCount++;
    
    // Update every second
    if (currentTime - lastTime >= 1000) {
        renderer.performance.fps = frameCount;
        console.log(`FPS: ${renderer.performance.fps}`);
        console.log(`Triangles: ${renderer.performance.triangles}`);
        console.log(`Draw calls: ${renderer.performance.drawCalls}`);
        
        frameCount = 0;
        lastTime = currentTime;
    }
    
    const deltaTime = clock.getDelta();
    
    // Update scene
    scene.update(deltaTime);
    
    // Animate objects
    cube.rotation.x += deltaTime * 0.5;
    cube.rotation.y += deltaTime * 0.3;
    
    // Render scene
    renderer.render(scene, camera);
    
    // Check for errors
    const errors = renderer.checkError();
    if (errors.length > 0) {
        console.warn('WebGL errors:', errors);
    }
}

animate();

// Performance monitoring
console.log('Renderer capabilities:');
const caps = renderer.getCapabilities();
console.log(`Max texture size: ${caps.maxTextureSize}`);
console.log(`Max vertex attributes: ${caps.maxVertexAttribs}`);
console.log(`WebGL version: ${caps.version}`);
console.log(`Extensions: ${caps.extensions.join(', ')}`);

// Error handling
renderer.on('contextLost', (event) => {
    event.preventDefault();
    console.warn('WebGL context lost, attempting to restore...');
});

renderer.on('contextRestored', () => {
    console.log('WebGL context restored');
    renderer.init();
});
```

## Advanced Features

### Multi-Render Targets
```javascript
// Create multi-render target for deferred rendering
const renderTarget = new WebGLMultiRenderTarget(1024, 1024, 4); // 4 attachments

renderer.setRenderTarget(renderTarget);
scene.render(renderer, camera);
renderer.setRenderTarget(null);

// Access individual attachments
const positionRT = renderTarget.getTexture(0);
const normalRT = renderTarget.getTexture(1);
const albedoRT = renderTarget.getTexture(2);
const depthRT = renderTarget.getTexture(3);
```

### Custom Shader Pipeline
```javascript
// Custom vertex shader
const vertexShader = `
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    
    varying vec3 vPosition;
    
    void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Custom fragment shader
const fragmentShader = `
    precision mediump float;
    
    varying vec3 vPosition;
    uniform float time;
    
    void main() {
        gl_FragColor = vec4(
            abs(sin(vPosition.x * 0.1 + time)),
            abs(sin(vPosition.y * 0.1 + time)),
            abs(sin(vPosition.z * 0.1 + time)),
            1.0
        );
    }
`;

// Compile and use
const shader = renderer.compileShader(vertexShader, fragmentShader);
const program = renderer.createProgram(vertexShader, fragmentShader);
```

### Post-Processing Pipeline
```javascript
// Render to off-screen target
const renderTarget = new WebGLRenderTarget(1024, 1024);
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null);

// Apply post-processing
const postScene = new Scene();
const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

const postMaterial = new ShaderMaterial({
    uniforms: {
        tDiffuse: { value: renderTarget.texture },
        resolution: { value: new Vector2(1024, 1024) }
    },
    vertexShader: postProcessingVertexShader,
    fragmentShader: postProcessingFragmentShader
});

const postQuad = new Mesh(new PlaneGeometry(2, 2), postMaterial);
postScene.addObject(postQuad);

// Render post-processing
renderer.render(postScene, postCamera);
```

## Performance Tips

1. **Pixel Ratio**: Lower pixel ratio on mobile devices for better performance
2. **Culling**: Enable appropriate culling options for your scene
3. **Shadows**: Shadow mapping is expensive - use sparingly
4. **State Changes**: Minimize WebGL state changes for better performance
5. **Draw Calls**: Batch similar objects to reduce draw calls
6. **LOD**: Implement level-of-detail systems for distant objects
7. **Texture Sizes**: Use appropriate texture sizes for your target devices
8. **Extensions**: Check for and use WebGL extensions for better performance

## Common Issues and Solutions

### Context Lost
```javascript
// Handle context loss
renderer.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.log('Context lost');
    animate = false;
});

renderer.canvas.addEventListener('webglcontextrestored', () => {
    console.log('Context restored');
    renderer.init();
    animate = true;
    animate();
});
```

### Performance Monitoring
```javascript
// Performance monitoring setup
function monitorPerformance() {
    setInterval(() => {
        console.log(`FPS: ${renderer.performance.fps}`);
        console.log(`Frame time: ${renderer.performance.frameTime.toFixed(2)}ms`);
        console.log(`Triangles: ${renderer.performance.triangles}`);
        console.log(`Draw calls: ${renderer.performance.drawCalls}`);
        console.log(`Memory usage: ${(renderer.performance.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }, 1000);
}

monitorPerformance();
```

The WebGLRenderer is the heart of the rendering system, providing comprehensive control over the WebGL pipeline, performance optimization, and visual quality settings.