# WebGL Troubleshooting Guide

This comprehensive guide helps you diagnose and resolve common WebGL issues when working with Ninth.js. It covers performance problems, rendering glitches, context issues, and debugging techniques.

## Quick Diagnostics

### Browser Compatibility Check

```javascript
// Quick WebGL support detection
function checkWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
        return {
            supported: false,
            reason: 'WebGL not supported in this browser'
        };
    }
    
    // Check WebGL2
    const isWebGL2 = canvas.getContext('webgl2') !== null;
    
    return {
        supported: true,
        webgl2: isWebGL2,
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
    };
}

// Usage
const support = checkWebGLSupport();
console.log('WebGL Support:', support);
```

### Performance Monitoring

```javascript
// Enable performance monitoring
function enablePerformanceMonitoring(renderer) {
    renderer.enableMetrics();
    
    // Monitor frame performance
    renderer.on('frame', (deltaTime) => {
        if (deltaTime > 33) { // > 30 FPS threshold
            console.warn('Low FPS detected:', (1000 / deltaTime).toFixed(1));
        }
    });
    
    // Monitor memory usage
    setInterval(() => {
        const metrics = renderer.getMetrics();
        console.log('Performance:', {
            frameTime: metrics.frameTime,
            drawCalls: metrics.drawCalls,
            triangles: metrics.triangles,
            geometries: metrics.geometries
        });
    }, 1000);
}
```

## Common Issues and Solutions

### 1. Black Screen / Nothing Renders

#### Problem
The screen appears black, or nothing is visible in the rendered scene.

#### Possible Causes and Solutions

**Camera Configuration:**
```javascript
// ❌ Common mistake: Camera position and lookAt mismatch
const camera = new PerspectiveCamera(75, width/height, 0.1, 1000);
camera.position.set(0, 0, 0); // Camera at origin
camera.lookAt(0, 0, -1); // Looking away from scene content

// ✅ Correct: Camera positioned to see the content
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);
scene.add(camera);
```

**Near/Far Plane Issues:**
```javascript
// ❌ Very small near plane or very large far plane
const camera = new PerspectiveCamera(75, width/height, 0.001, 1000000);

// ✅ Better: Appropriate near/far planes
const camera = new PerspectiveCamera(75, width/height, 0.1, 1000);
```

**Lighting Problems:**
```javascript
// ❌ Dark scene without lighting
const material = new BasicMaterial({ color: 0x000000 }); // Black material

// ✅ Proper lighting setup
const ambientLight = new AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Or use unlit material
const material = new UnlitMaterial({ color: 0x00ff00 });
```

**Z-fighting:**
```javascript
// Objects at same position causing z-fighting
object1.position.set(0, 0, 0);
object2.position.set(0, 0, 0); // Same position!

// ✅ Slight offset to prevent z-fighting
object1.position.set(0, 0, 0);
object2.position.set(0, 0, 0.001);
```

#### Debugging Steps

```javascript
// 1. Check camera setup
function debugCamera(camera, scene) {
    console.log('Camera position:', camera.position);
    console.log('Camera target:', camera.target);
    console.log('Scene children count:', scene.children.length);
}

// 2. Check object visibility
function debugObjects(scene) {
    scene.traverse((child) => {
        console.log(`${child.type}: ${child.name || 'unnamed'}`, {
            position: child.position,
            visible: child.visible,
            frustumCulled: child.frustumCulled
        });
    });
}

// 3. Test basic rendering
function testBasicRender(renderer, scene, camera) {
    // Clear with a solid color to test basic rendering
    renderer.setClearColor(0xff0000, 1);
    renderer.render(scene, camera);
    
    // If screen is red, rendering works
    // If screen is black, check camera/lights
}
```

### 2. Performance Issues

#### Low Frame Rate

**Problem:** Frame rate below 30 FPS

**Solutions:**

**Reduce Draw Calls:**
```javascript
// ❌ Many individual meshes
scene.add(mesh1);
scene.add(mesh2);
scene.add(mesh3);

// ✅ Use instanced rendering for repeated objects
const instancedMesh = new InstancedMesh(geometry, material, 1000);
for (let i = 0; i < 1000; i++) {
    const matrix = new Matrix4();
    matrix.setPosition(i * 2, 0, 0);
    instancedMesh.setMatrixAt(i, matrix);
}
scene.add(instancedMesh);
```

**Optimize Geometry:**
```javascript
// ❌ High-poly geometry for distant objects
const detailedGeometry = new SphereGeometry(1, 64, 32);

// ✅ LOD (Level of Detail) for distance-based quality
const nearGeometry = new SphereGeometry(1, 32, 16);
const farGeometry = new SphereGeometry(1, 8, 4);

const lod = new LOD([
    { object: new Mesh(nearGeometry, material), distance: 0 },
    { object: new Mesh(farGeometry, material), distance: 50 }
]);
```

**Enable Culling:**
```javascript
// ✅ Enable frustum culling
scene.enableFrustumCulling = true;
scene.cullObjects([camera]); // Optimize rendering

// ✅ Reduce overdraw
renderer.setClearColor(backgroundColor, 1);
renderer.autoClear = true;
```

**Texture Optimization:**
```javascript
// ✅ Use appropriate texture sizes
const texture = new Texture(1024, 1024); // Reasonable size
texture.generateMipmaps = true;
texture.minFilter = Texture.LinearMipmapLinearFilter;
texture.magFilter = Texture.LinearFilter;
texture.anisotropy = 4; // Reasonable anisotropy
```

#### Memory Leaks

**Problem:** Application becomes slow over time or crashes

**Solutions:**

**Proper Disposal:**
```javascript
// ✅ Dispose of resources when no longer needed
function disposeScene(scene) {
    scene.traverse((object) => {
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (object.material.map) object.material.map.dispose();
            if (object.material.normalMap) object.material.normalMap.dispose();
            if (object.material.specularMap) object.material.specularMap.dispose();
            object.material.dispose();
        }
    });
}

// Call when cleaning up
window.addEventListener('beforeunload', () => {
    disposeScene(scene);
    renderer.dispose();
});
```

**Event Listener Cleanup:**
```javascript
// ❌ Memory leak: Event listeners not cleaned up
renderer.on('frame', handler); // No way to remove

// ✅ Proper cleanup
const unsubscribe = renderer.on('frame', handler);
unsubscribe(); // Clean up when done

// Or with lifecycle management
class Component {
    constructor(renderer) {
        this.unsubscribe = renderer.on('frame', this.handleFrame.bind(this));
    }
    
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}
```

### 3. Visual Artifacts

#### Flickering

**Problem:** Objects appear to flicker or have visual noise

**Causes and Solutions:**

**Depth Buffer Issues:**
```javascript
// ❌ Depth test disabled
renderer.state.setDepthTest(false);

// ✅ Enable depth testing
renderer.state.setDepthTest(true);
renderer.state.setDepthWrite(true);

// ✅ Adjust depth function if needed
renderer.state.setDepthFunc(THREE.LessEqualDepth);
```

**Z-fighting:**
```javascript
// ❌ Objects at very close distances
object1.position.z = 0;
object2.position.z = 0.0001;

// ✅ Use polygon offset to reduce z-fighting
material.polygonOffset = true;
material.polygonOffsetFactor = 1;
material.polygonOffsetUnits = 1;
```

**Precision Issues:**
```javascript
// ✅ Use appropriate precision in shaders
const vertexShader = `
    precision highp float;
    // Shader code
`;

const fragmentShader = `
    precision highp float;
    // Shader code
`;
```

#### Texture Issues

**Problem:** Textures appear blurry, distorted, or missing

**Solutions:**

**Correct UV Mapping:**
```javascript
// ✅ Ensure proper UV coordinates
geometry.setAttribute('uv', new BufferAttribute(uvArray, 2));
geometry.computeBoundingBox();

// Check UV bounds
console.log('UV bounds:', geometry.boundingBox);
```

**Texture Filtering:**
```javascript
// ✅ Set appropriate texture filters
const texture = new Texture(image);
texture.minFilter = Texture.LinearMipmapLinearFilter;
texture.magFilter = Texture.LinearFilter;
texture.generateMipmaps = true;

// For pixel art
texture.minFilter = Texture.NearestFilter;
texture.magFilter = Texture.NearestFilter;
texture.generateMipmaps = false;
```

**Texture Formats:**
```javascript
// ✅ Use appropriate texture formats
const texture = new Texture(image);
// Ensure power-of-two dimensions for mipmaps
const powerOfTwoTexture = new Texture(
    Math.pow(2, Math.ceil(Math.log2(image.width))),
    Math.pow(2, Math.ceil(Math.log2(image.height)))
);
```

### 4. Context Issues

#### WebGL Context Lost

**Problem:** WebGL context is lost due to system events

**Solutions:**

**Context Restoration:**
```javascript
class ResilientRenderer {
    constructor(scene) {
        this.scene = scene;
        this.canvas = document.createElement('canvas');
        this.renderer = new WebGLRenderer({ canvas: this.canvas });
        
        this.setupContextHandlers();
    }
    
    setupContextHandlers() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('webglcontextlost', this.onContextLost.bind(this), false);
        canvas.addEventListener('webglcontextrestored', this.onContextRestored.bind(this), false);
    }
    
    onContextLost(event) {
        event.preventDefault();
        console.warn('WebGL context lost');
        this.renderer.disable(); // Stop rendering
    }
    
    onContextRestored() {
        console.log('WebGL context restored');
        // Re-initialize graphics resources
        this.renderer.enable();
        this.recreateResources();
    }
    
    recreateResources() {
        // Re-create textures, materials, etc.
        this.scene.traverse((object) => {
            if (object.material) {
                object.material.needsUpdate = true;
            }
        });
    }
}
```

**Resource Management:**
```javascript
// ✅ Implement robust resource management
class ResourceManager {
    constructor() {
        this.textures = new Map();
        this.materials = new Map();
        this.geometries = new Map();
    }
    
    createTexture(id, image) {
        const texture = new Texture(image);
        this.textures.set(id, texture);
        
        // Store original data for reconstruction
        this.storeTextureData(id, image);
        
        return texture;
    }
    
    reconstructTexture(id, image) {
        const texture = this.textures.get(id);
        if (texture) {
            texture.dispose();
        }
        
        const newTexture = new Texture(image);
        this.textures.set(id, newTexture);
        return newTexture;
    }
    
    storeTextureData(id, image) {
        // Store image data for reconstruction
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        this.textureData.set(id, canvas.toDataURL());
    }
}
```

### 5. Shading Issues

#### Shader Compilation Errors

**Problem:** Custom shaders fail to compile

**Debugging Shader Compilation:**
```javascript
function debugShader(renderer, material) {
    const gl = renderer.getContext();
    
    // Force shader compilation
    renderer.compile(scene, camera);
    
    // Check for compilation errors
    const vertexShader = material.program.vertexShader;
    const fragmentShader = material.program.fragmentShader;
    
    if (!material.program) {
        console.error('Shader compilation failed');
        return;
    }
    
    // Log shader sources
    console.log('Vertex Shader:', vertexShader);
    console.log('Fragment Shader:', fragmentShader);
}

// Common shader errors
const commonErrors = {
    'attribute': 'Use "in" instead of "attribute" in WebGL2',
    'varying': 'Use "out" and "in" instead of "varying" in WebGL2',
    'precision mediump float': 'Add precision qualifier',
    'gl_FragColor': 'Declare output variable explicitly'
};

function checkCommonShaderErrors(shaderSource) {
    Object.keys(commonErrors).forEach(error => {
        if (shaderSource.includes(error)) {
            console.warn(`Potential shader error: ${commonErrors[error]}`);
        }
    });
}
```

**Shader Uniform Issues:**
```javascript
// ✅ Properly set shader uniforms
const material = new ShaderMaterial({
    vertexShader: vertexShaderCode,
    fragmentShader: fragmentShaderCode,
    uniforms: {
        time: { value: 0 },
        resolution: { value: new Vector2(width, height) },
        color: { value: new Color(1, 0, 0) }
    }
});

// Update uniforms in render loop
renderer.on('frame', (deltaTime) => {
    material.uniforms.time.value += deltaTime;
});
```

### 6. Mobile-Specific Issues

#### Performance on Mobile

**Problem:** Poor performance on mobile devices

**Solutions:**

**Reduce Quality Settings:**
```javascript
// Detect mobile and reduce quality
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const renderer = new WebGLRenderer({
    antialias: !isMobile, // Disable antialiasing on mobile
    powerPreference: isMobile ? 'low-power' : 'high-performance'
});

if (isMobile) {
    // Reduce texture quality
    const maxTextureSize = Math.min(1024, renderer.capabilities.maxTextureSize);
    
    // Reduce shadow quality
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    
    // Limit draw calls
    renderer.state.setDrawCallsLimit(100);
}
```

**Touch Event Handling:**
```javascript
// ✅ Proper touch event handling
class TouchControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.touches = new Map();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    }
    
    onTouchStart(event) {
        event.preventDefault();
        // Handle touch start
    }
    
    onTouchMove(event) {
        event.preventDefault();
        // Handle touch move
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        // Handle touch end
    }
}
```

## Advanced Debugging Techniques

### WebGL Inspector

```javascript
// Enable WebGL state inspection
function enableWebGLInspection(renderer) {
    const gl = renderer.getContext();
    
    // Log WebGL state
    console.log('WebGL State:', {
        DEPTH_TEST: gl.getParameter(gl.DEPTH_TEST),
        BLEND: gl.getParameter(gl.BLEND),
        CULL_FACE: gl.getParameter(gl.CULL_FACE),
        MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        MAX_VERTEX_ATTRIBS: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
    });
    
    // Monitor draw calls
    const originalDrawArrays = gl.drawArrays.bind(gl);
    gl.drawArrays = function(mode, first, count) {
        console.log(`DrawArrays: ${mode}, ${first}, ${count}`);
        return originalDrawArrays(mode, first, count);
    };
    
    const originalDrawElements = gl.drawElements.bind(gl);
    gl.drawElements = function(mode, count, type, offset) {
        console.log(`DrawElements: ${mode}, ${count}, ${type}, ${offset}`);
        return originalDrawElements(mode, count, type, offset);
    };
}
```

### Frame Analysis

```javascript
class FrameAnalyzer {
    constructor(renderer) {
        this.renderer = renderer;
        this.frameCount = 0;
        this.drawCalls = [];
        this.startTime = performance.now();
    }
    
    analyzeFrame() {
        this.frameCount++;
        
        const metrics = this.renderer.getMetrics();
        this.drawCalls.push(metrics.drawCalls);
        
        // Analyze every 100 frames
        if (this.frameCount % 100 === 0) {
            const avgDrawCalls = this.drawCalls.reduce((a, b) => a + b, 0) / this.drawCalls.length;
            
            console.log('Frame Analysis:', {
                frameCount: this.frameCount,
                avgDrawCalls: avgDrawCalls.toFixed(2),
                maxDrawCalls: Math.max(...this.drawCalls),
                totalTime: performance.now() - this.startTime
            });
            
            this.drawCalls = [];
        }
    }
    
    getReport() {
        return {
            totalFrames: this.frameCount,
            averageDrawCalls: this.drawCalls.reduce((a, b) => a + b, 0) / this.drawCalls.length,
            framesPerSecond: this.frameCount / ((performance.now() - this.startTime) / 1000)
        };
    }
}
```

### Memory Leak Detection

```javascript
class MemoryLeakDetector {
    constructor() {
        this.initialMemory = this.getMemoryUsage();
        this.snapshots = [];
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    takeSnapshot(label) {
        const memory = this.getMemoryUsage();
        this.snapshots.push({
            label,
            memory,
            timestamp: performance.now(),
            frameCount: this.getFrameCount()
        });
    }
    
    detectLeaks() {
        if (this.snapshots.length < 2) return [];
        
        const leaks = [];
        for (let i = 1; i < this.snapshots.length; i++) {
            const prev = this.snapshots[i - 1];
            const curr = this.snapshots[i];
            
            if (curr.memory && prev.memory) {
                const memoryDiff = curr.memory.used - prev.memory.used;
                const timeDiff = curr.timestamp - prev.timestamp;
                
                if (memoryDiff > 1024 * 1024) { // More than 1MB increase
                    leaks.push({
                        label: curr.label,
                        memoryIncrease: memoryDiff,
                        timeSpan: timeDiff,
                        rate: memoryDiff / (timeDiff / 1000) // bytes per second
                    });
                }
            }
        }
        
        return leaks;
    }
    
    getFrameCount() {
        // Implement frame counting logic
        return 0;
    }
    
    report() {
        const leaks = this.detectLeaks();
        if (leaks.length > 0) {
            console.warn('Memory leaks detected:', leaks);
        } else {
            console.log('No memory leaks detected');
        }
        
        return {
            snapshots: this.snapshots,
            leaks,
            reportTime: new Date().toISOString()
        };
    }
}
```

## Performance Optimization Checklist

### Geometry Optimization

- [ ] Use appropriate level of detail (LOD) for objects at different distances
- [ ] Implement frustum culling for off-screen objects
- [ ] Use instanced rendering for repeated objects
- [ ] Optimize vertex counts for complex geometries
- [ ] Use indexed geometry to reduce vertex count

### Material and Shader Optimization

- [ ] Use appropriate precision in shaders
- [ ] Minimize shader uniform updates
- [ ] Share materials between similar objects
- [ ] Use texture atlases to reduce draw calls
- [ ] Implement shader LOD for distant objects

### Texture Optimization

- [ ] Use power-of-two texture dimensions when possible
- [ ] Implement texture LOD for different screen sizes
- [ ] Compress textures using appropriate formats
- [ ] Use texture arrays for procedural textures
- [ ] Implement virtual texturing for large textures

### Scene Management

- [ ] Implement object pooling for dynamic objects
- [ ] Use spatial partitioning (octrees, BSP) for large scenes
- [ ] Batch static objects together
- [ ] Implement occlusion culling for hidden objects
- [ ] Use level-of-detail systems for complex scenes

### Rendering Optimization

- [ ] Enable depth testing and proper depth functions
- [ ] Use appropriate polygon offset to prevent z-fighting
- [ ] Implement backface culling
- [ ] Use early Z-testing when possible
- [ ] Optimize render order for transparency

## Browser-Specific Issues

### Chrome/Chromium

**WebGL Extensions:**
```javascript
function checkChromeExtensions(renderer) {
    const extensions = renderer.getContext().getSupportedExtensions();
    console.log('Supported extensions:', extensions);
    
    // Common Chrome-specific issues
    if (!extensions.includes('WEBGL_depth_texture')) {
        console.warn('Depth texture not supported - shadows may not work');
    }
}
```

### Firefox

**Memory Management:**
```javascript
// Firefox may have more aggressive garbage collection
function optimizeForFirefox(renderer) {
    // Increase texture memory pool
    renderer.capabilities.maxTextureSize = Math.min(4096, renderer.capabilities.maxTextureSize);
    
    // Monitor memory usage more frequently
    setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
            console.warn('High memory usage detected');
        }
    }, 5000);
}
```

### Safari

**WebGL2 Support:**
```javascript
function checkSafariSupport() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
        console.log('Safari detected - WebGL2 support may be limited');
        
        // Fallback to WebGL1 if needed
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        
        if (!gl) {
            console.log('WebGL2 not supported - falling back to WebGL1');
            return 'webgl';
        }
    }
    
    return 'webgl2';
}
```

This troubleshooting guide provides comprehensive solutions to the most common WebGL issues encountered when working with Ninth.js. Always start with the basic diagnostics and work your way through the more advanced debugging techniques as needed.