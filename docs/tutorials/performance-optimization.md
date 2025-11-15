# Performance Optimization in Ninth.js

Learn how to optimize your Ninth.js applications for maximum performance. This comprehensive guide covers rendering optimization, memory management, profiling techniques, and best practices for building high-performance 3D applications.

## Performance Fundamentals

### Understanding Performance Bottlenecks

Common performance issues in 3D applications:
- **CPU-bound operations** - JavaScript execution, physics calculations
- **GPU-bound operations** - Shader complexity, polygon count, texture size
- **Memory usage** - Heap size, garbage collection, texture memory
- **I/O operations** - Asset loading, network requests
- **Browser limitations** - WebGL context limits, canvas size

### Performance Monitoring

```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            drawCalls: 0,
            triangles: 0
        };
        
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsSamples = [];
        this.maxSamples = 60;
    }
    
    update() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        // Calculate FPS
        const fps = 1000 / deltaTime;
        this.fpsSamples.push(fps);
        
        if (this.fpsSamples.length > this.maxSamples) {
            this.fpsSamples.shift();
        }
        
        this.metrics.fps = this.fpsSamples.reduce((a, b) => a + b) / this.fpsSamples.length;
        this.metrics.frameTime = deltaTime;
        
        // Get memory usage if available
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        
        this.lastTime = currentTime;
        this.frameCount++;
    }
    
    startTimer(timerName) {
        return {
            name: timerName,
            startTime: performance.now(),
            end: null
        };
    }
    
    endTimer(timer) {
        timer.end = performance.now();
        return timer.end - timer.startTime;
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
    
    createReport() {
        const report = `
Performance Report:
===================
FPS: ${this.metrics.fps.toFixed(1)}
Frame Time: ${this.metrics.frameTime.toFixed(2)}ms
Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB
Draw Calls: ${this.metrics.drawCalls}
Triangles: ${this.metrics.triangles}

Performance Grade: ${this.getPerformanceGrade()}
        `;
        
        return report;
    }
    
    getPerformanceGrade() {
        const fps = this.metrics.fps;
        if (fps >= 60) return 'Excellent';
        if (fps >= 30) return 'Good';
        if (fps >= 20) return 'Fair';
        return 'Poor';
    }
}

// Usage example
const perfMonitor = new PerformanceMonitor();

function optimizedRenderLoop() {
    perfMonitor.update();
    
    const renderStart = performance.now();
    
    // Render logic here
    renderer.render(scene, camera);
    
    const renderEnd = performance.now();
    perfMonitor.metrics.renderTime = renderEnd - renderStart;
    
    // Log performance every second
    if (perfMonitor.frameCount % 60 === 0) {
        console.log(perfMonitor.createReport());
    }
    
    requestAnimationFrame(optimizedRenderLoop);
}
```

## Rendering Optimization

### 1. Geometry Optimization

```javascript
class GeometryOptimizer {
    constructor() {
        this.optimizationLevels = {
            aggressive: { decimate: 0.5, mergeVertices: true, computeNormals: false },
            moderate: { decimate: 0.8, mergeVertices: true, computeNormals: true },
            minimal: { decimate: 0.9, mergeVertices: false, computeNormals: true }
        };
    }
    
    optimizeGeometry(geometry, level = 'moderate') {
        const config = this.optimizationLevels[level];
        let optimizedGeometry = geometry;
        
        // Merge vertices to reduce draw calls
        if (config.mergeVertices && !optimizedGeometry.index) {
            optimizedGeometry = optimizedGeometry.clone();
            optimizedGeometry.mergeVertices();
        }
        
        // Decimate geometry (reduce polygon count)
        if (config.decimate < 1.0) {
            optimizedGeometry = this.decimateGeometry(optimizedGeometry, config.decimate);
        }
        
        // Compute normals if needed
        if (config.computeNormals) {
            optimizedGeometry.computeVertexNormals();
        }
        
        // Optimize for rendering
        optimizedGeometry.attributes.position.usage = NinthJS.StaticDrawUsage;
        if (optimizedGeometry.attributes.normal) {
            optimizedGeometry.attributes.normal.usage = NinthJS.StaticDrawUsage;
        }
        if (optimizedGeometry.attributes.uv) {
            optimizedGeometry.attributes.uv.usage = NinthJS.StaticDrawUsage;
        }
        
        return optimizedGeometry;
    }
    
    decimateGeometry(geometry, decimateFactor) {
        // Simple decimation - in production, use a proper decimation algorithm
        const positionAttribute = geometry.attributes.position;
        const newCount = Math.floor(positionAttribute.count * decimateFactor);
        
        const newPositions = new Float32Array(newCount * 3);
        
        for (let i = 0; i < newCount; i++) {
            const sourceIndex = Math.floor((i / newCount) * positionAttribute.count) * 3;
            newPositions[i * 3] = positionAttribute.array[sourceIndex];
            newPositions[i * 3 + 1] = positionAttribute.array[sourceIndex + 1];
            newPositions[i * 3 + 2] = positionAttribute.array[sourceIndex + 2];
        }
        
        const newGeometry = new NinthJS.BufferGeometry();
        newGeometry.setAttribute('position', new NinthJS.BufferAttribute(newPositions, 3));
        
        return newGeometry;
    }
    
    createLODGeometry(geometry, distances) {
        const lodLevels = [];
        
        distances.forEach((distance, index) => {
            const decimateFactor = Math.max(0.1, 1 - (index * 0.2));
            lodLevels.push({
                distance: distance,
                geometry: this.optimizeGeometry(geometry, index === 0 ? 'minimal' : 'moderate')
            });
        });
        
        return lodLevels;
    }
}
```

### 2. Material Optimization

```javascript
class MaterialOptimizer {
    constructor() {
        this.materialCache = new Map();
        this.materialUsage = new Map();
    }
    
    getOptimizedMaterial(materialType, properties) {
        const cacheKey = this.getMaterialCacheKey(materialType, properties);
        
        if (this.materialCache.has(cacheKey)) {
            const cached = this.materialCache.get(cacheKey);
            this.materialUsage.set(cacheKey, (this.materialUsage.get(cacheKey) || 0) + 1);
            return cached;
        }
        
        const material = this.createOptimizedMaterial(materialType, properties);
        this.materialCache.set(cacheKey, material);
        this.materialUsage.set(cacheKey, 1);
        
        return material;
    }
    
    createOptimizedMaterial(type, properties) {
        let material;
        
        switch (type) {
            case 'basic':
                material = new NinthJS.BasicMaterial(properties);
                break;
            case 'phong':
                material = new NinthJS.PhongMaterial(properties);
                break;
            case 'lambert':
                material = new NinthJS.LambertMaterial(properties);
                break;
            default:
                material = new NinthJS.BasicMaterial(properties);
        }
        
        // Optimization settings
        material.transparent = material.transparent || false;
        material.depthWrite = material.depthWrite !== false;
        material.depthTest = material.depthTest !== false;
        
        // Disable unnecessary features
        if (type === 'basic') {
            material.vertexColors = false;
        }
        
        return material;
    }
    
    getMaterialCacheKey(type, properties) {
        const sortedKeys = Object.keys(properties).sort();
        const sortedProps = {};
        sortedKeys.forEach(key => {
            if (key !== 'map' && key !== 'lightMap' && key !== 'bumpMap') {
                sortedProps[key] = properties[key];
            }
        });
        
        return `${type}_${JSON.stringify(sortedProps)}`;
    }
    
    disposeUnusedMaterials() {
        for (const [key, usage] of this.materialUsage) {
            if (usage === 0) {
                const material = this.materialCache.get(key);
                if (material) {
                    material.dispose();
                    this.materialCache.delete(key);
                    this.materialUsage.delete(key);
                }
            } else {
                this.materialUsage.set(key, 0); // Reset usage count
            }
        }
    }
    
    optimizeTexture(texture) {
        // Set appropriate filtering
        if (texture.isCompressedTexture !== true) {
            texture.minFilter = NinthJS.LinearMipmapLinearFilter;
            texture.magFilter = NinthJS.LinearFilter;
            texture.generateMipmaps = true;
        }
        
        // Use appropriate format
        if (texture.format === NinthJS.RGBAFormat) {
            // Check if we can use a smaller format
            // This is a simplified example
        }
        
        return texture;
    }
}
```

### 3. Texture Optimization

```javascript
class TextureManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.textures = new Map();
        this.compressedTextures = new Map();
        this.maxTextureSize = this.getMaxTextureSize();
        this.useTextureCompression = this.supportsTextureCompression();
    }
    
    getMaxTextureSize() {
        const gl = this.renderer.getContext();
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
    
    supportsTextureCompression() {
        const gl = this.renderer.getContext();
        return !!gl.getExtension('WEBGL_compressed_texture_s3tc') ||
               !!gl.getExtension('WEBGL_compressed_texture_astc') ||
               !!gl.getExtension('WEBGL_compressed_texture_etc1');
    }
    
    loadOptimizedTexture(url, options = {}) {
        return new Promise((resolve, reject) => {
            const loader = new NinthJS.TextureLoader();
            
            loader.load(
                url,
                (texture) => {
                    const optimizedTexture = this.optimizeTexture(texture, options);
                    this.textures.set(url, optimizedTexture);
                    resolve(optimizedTexture);
                },
                (progress) => {
                    // Progress callback
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    optimizeTexture(texture, options) {
        const {
            maxSize = this.maxTextureSize,
            compression = this.useTextureCompression,
            generateMipmaps = true,
            anisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy())
        } = options;
        
        // Resize if too large
        if (texture.image.width > maxSize || texture.image.height > maxSize) {
            const scale = maxSize / Math.max(texture.image.width, texture.image.height);
            const newWidth = Math.floor(texture.image.width * scale);
            const newHeight = Math.floor(texture.image.height * scale);
            
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
            
            texture.image = canvas;
            texture.needsUpdate = true;
        }
        
        // Apply compression if supported and enabled
        if (compression && texture.compression) {
            texture.compression = NinthJS.RGBACompression;
            texture.needsUpdate = true;
        }
        
        // Set filtering options
        if (generateMipmaps) {
            texture.minFilter = NinthJS.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
        } else {
            texture.minFilter = NinthJS.LinearFilter;
            texture.generateMipmaps = false;
        }
        
        texture.magFilter = NinthJS.LinearFilter;
        texture.anisotropy = anisotropy;
        
        // Optimize encoding
        if (this.renderer.capabilities.isWebGL2) {
            texture.internalFormat = 'RGBA8';
        }
        
        return texture;
    }
    
    createProceduralTexture(width, height, generator) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Generate texture procedurally
        generator(ctx, width, height);
        
        const texture = new NinthJS.CanvasTexture(canvas);
        return this.optimizeTexture(texture);
    }
    
    disposeUnused() {
        for (const [url, texture] of this.textures) {
            if (texture.userData.usageCount === 0) {
                texture.dispose();
                this.textures.delete(url);
            }
        }
    }
}
```

### 4. Instanced Rendering

```javascript
class InstancedRenderer {
    constructor() {
        this.instancedMeshes = new Map();
        this.instances = new Map();
    }
    
    createInstancedMesh(baseGeometry, baseMaterial, maxInstances) {
        const instancedMesh = new NinthJS.InstancedMesh(
            baseGeometry,
            baseMaterial,
            maxInstances
        );
        
        // Enable instance colors if material supports it
        if (baseMaterial.vertexColors) {
            instancedMesh.instanceMatrix.setUsage(NinthJS.DynamicDrawUsage);
        }
        
        const instanceData = {
            mesh: instancedMesh,
            count: 0,
            maxCount: maxInstances,
            matrices: new Array(maxInstances),
            colors: new Array(maxInstances)
        };
        
        const id = this.generateId();
        this.instancedMeshes.set(id, instanceData);
        
        return { id, mesh: instancedMesh };
    }
    
    addInstance(instancedMeshId, transform, color) {
        const instanceData = this.instancedMeshes.get(instancedMeshId);
        if (!instanceData || instanceData.count >= instanceData.maxCount) {
            return false;
        }
        
        const index = instanceData.count;
        instanceData.matrices[index] = transform.clone();
        instanceData.colors[index] = color.clone();
        instanceData.count++;
        
        // Update the instanced mesh
        const mesh = instanceData.mesh;
        mesh.setMatrixAt(index, transform);
        
        if (mesh.instanceColor) {
            mesh.setColorAt(index, color);
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
        
        return true;
    }
    
    removeInstance(instancedMeshId, index) {
        const instanceData = this.instancedMeshes.get(instancedMeshId);
        if (!instanceData || index >= instanceData.count) {
            return false;
        }
        
        // Swap with last instance
        const lastIndex = instanceData.count - 1;
        if (index !== lastIndex) {
            instanceData.matrices[index] = instanceData.matrices[lastIndex];
            instanceData.colors[index] = instanceData.colors[lastIndex];
            
            const mesh = instanceData.mesh;
            mesh.setMatrixAt(index, instanceData.matrices[index]);
            
            if (mesh.instanceColor) {
                mesh.setColorAt(index, instanceData.colors[index]);
            }
        }
        
        instanceData.count--;
        instanceData.matrices[instanceData.count] = null;
        instanceData.colors[instanceData.count] = null;
        
        const mesh = instanceData.mesh;
        mesh.count = instanceData.count;
        mesh.instanceMatrix.needsUpdate = true;
        
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
        
        return true;
    }
    
    updateInstance(instancedMeshId, index, transform, color) {
        const instanceData = this.instancedMeshes.get(instancedMeshId);
        if (!instanceData || index >= instanceData.count) {
            return false;
        }
        
        instanceData.matrices[index] = transform.clone();
        instanceData.colors[index] = color.clone();
        
        const mesh = instanceData.mesh;
        mesh.setMatrixAt(index, transform);
        
        if (mesh.instanceColor) {
            mesh.setColorAt(index, color);
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
        
        return true;
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    optimizeForGPU() {
        for (const [id, instanceData] of this.instancedMeshes) {
            const mesh = instanceData.mesh;
            
            // Optimize for GPU instancing
            mesh.frustumCulled = true;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // Set appropriate usage hints
            mesh.instanceMatrix.setUsage(NinthJS.DynamicDrawUsage);
            if (mesh.instanceColor) {
                mesh.instanceColor.setUsage(NinthJS.DynamicDrawUsage);
            }
        }
    }
}
```

## Memory Management

### 1. Object Pooling System

```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    acquire() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    clear() {
        this.pool.forEach(obj => {
            if (obj.dispose) obj.dispose();
        });
        this.active.forEach(obj => {
            if (obj.dispose) obj.dispose();
        });
        
        this.pool = [];
        this.active.clear();
    }
}

// Example: Geometry pool
const geometryPool = new ObjectPool(
    () => new NinthJS.BoxGeometry(1, 1, 1),
    (geometry) => {
        geometry.dispose();
    },
    50
);

// Example: Material pool
const materialPool = new ObjectPool(
    () => new NinthJS.BasicMaterial({ color: '#ffffff' }),
    (material) => {
        material.dispose();
    },
    50
);

// Example: Mesh pool
const meshPool = new ObjectPool(
    () => {
        const geometry = geometryPool.acquire();
        const material = materialPool.acquire();
        return new NinthJS.Mesh(geometry, material);
    },
    (mesh) => {
        scene.remove(mesh);
        mesh.geometry = null;
        mesh.material = null;
    },
    100
);
```

### 2. Asset Management System

```javascript
class AssetManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.textures = new Map();
        this.geometries = new Map();
        this.materials = new Map();
        this.models = new Map();
        this.loadingPromises = new Map();
        this.usageCounts = new Map();
        
        this.maxCacheSize = 100; // Maximum cached assets
        this.cleanupInterval = 30000; // 30 seconds
        this.lastCleanup = Date.now();
        
        this.startCleanupTimer();
    }
    
    async loadTexture(url, options = {}) {
        const key = this.getCacheKey('texture', url, options);
        
        if (this.textures.has(key)) {
            this.incrementUsage(key);
            return this.textures.get(key);
        }
        
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }
        
        const loadPromise = this._loadTextureInternal(url, options);
        this.loadingPromises.set(key, loadPromise);
        
        try {
            const texture = await loadPromise;
            this.textures.set(key, texture);
            this.usageCounts.set(key, 1);
            this.loadingPromises.delete(key);
            
            this.checkCacheLimit();
            return texture;
        } catch (error) {
            this.loadingPromises.delete(key);
            throw error;
        }
    }
    
    async _loadTextureInternal(url, options) {
        return new Promise((resolve, reject) => {
            const loader = new NinthJS.TextureLoader();
            
            loader.load(
                url,
                (texture) => {
                    this.optimizeTexture(texture, options);
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
    
    optimizeTexture(texture, options) {
        const {
            maxSize = 2048,
            compression = true,
            generateMipmaps = true
        } = options;
        
        // Resize if too large
        if (texture.image && (texture.image.width > maxSize || texture.image.height > maxSize)) {
            this.resizeTexture(texture, maxSize);
        }
        
        // Apply optimizations
        if (generateMipmaps) {
            texture.minFilter = NinthJS.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
        } else {
            texture.minFilter = NinthJS.LinearFilter;
            texture.generateMipmaps = false;
        }
        
        texture.magFilter = NinthJS.LinearFilter;
        texture.anisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
        
        return texture;
    }
    
    resizeTexture(texture, maxSize) {
        const { width, height } = texture.image;
        const scale = maxSize / Math.max(width, height);
        
        if (scale >= 1) return;
        
        const newWidth = Math.floor(width * scale);
        const newHeight = Math.floor(height * scale);
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(texture.image, 0, 0, newWidth, newHeight);
        
        texture.image = canvas;
        texture.needsUpdate = true;
    }
    
    incrementUsage(key) {
        const current = this.usageCounts.get(key) || 0;
        this.usageCounts.set(key, current + 1);
    }
    
    decrementUsage(key) {
        const current = this.usageCounts.get(key) || 0;
        const newCount = Math.max(0, current - 1);
        this.usageCounts.set(key, newCount);
        
        if (newCount === 0) {
            this.scheduleCleanup(key);
        }
    }
    
    checkCacheLimit() {
        const totalAssets = this.textures.size + this.geometries.size + 
                          this.materials.size + this.models.size;
        
        if (totalAssets > this.maxCacheSize) {
            this.cleanup();
        }
    }
    
    scheduleCleanup(key) {
        setTimeout(() => {
            if (this.usageCounts.get(key) === 0) {
                this.removeAsset(key);
            }
        }, 5000); // Wait 5 seconds before cleanup
    }
    
    removeAsset(key) {
        if (this.textures.has(key)) {
            this.textures.get(key).dispose();
            this.textures.delete(key);
        }
        
        if (this.geometries.has(key)) {
            this.geometries.get(key).dispose();
            this.geometries.delete(key);
        }
        
        if (this.materials.has(key)) {
            this.materials.get(key).dispose();
            this.materials.delete(key);
        }
        
        if (this.models.has(key)) {
            this.models.get(key).dispose();
            this.models.delete(key);
        }
        
        this.usageCounts.delete(key);
    }
    
    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup < this.cleanupInterval) {
            return;
        }
        
        // Remove unused assets
        for (const [key, usage] of this.usageCounts) {
            if (usage === 0) {
                this.removeAsset(key);
            }
        }
        
        // Sort by usage count and remove oldest if still over limit
        const sortedAssets = Array.from(this.usageCounts.entries())
            .sort((a, b) => a[1] - b[1]);
        
        while (sortedAssets.length > this.maxCacheSize) {
            const [key] = sortedAssets.shift();
            this.removeAsset(key);
        }
        
        this.lastCleanup = now;
    }
    
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }
    
    getCacheKey(type, url, options) {
        const optionsStr = JSON.stringify(options);
        return `${type}_${url}_${optionsStr}`;
    }
    
    dispose() {
        // Clean up all assets
        this.textures.forEach(texture => texture.dispose());
        this.geometries.forEach(geometry => geometry.dispose());
        this.materials.forEach(material => material.dispose());
        this.models.forEach(model => model.dispose());
        
        this.textures.clear();
        this.geometries.clear();
        this.materials.clear();
        this.models.clear();
        this.usageCounts.clear();
    }
}
```

### 3. Garbage Collection Management

```javascript
class GCManager {
    constructor() {
        this.temporaryObjects = new Set();
        this.gcThresholds = {
            heapUsed: 50 * 1024 * 1024, // 50MB
            collections: 10 // Force GC every 10 collections
        };
        this.collectionCount = 0;
        this.lastGC = performance.now();
        
        this.monitorMemory();
    }
    
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                
                if (memory.usedJSHeapSize > this.gcThresholds.heapUsed) {
                    this.forceGarbageCollection();
                }
                
                this.collectionCount++;
                if (this.collectionCount >= this.gcThresholds.collections) {
                    this.forceGarbageCollection();
                }
            }, 5000);
        }
    }
    
    forceGarbageCollection() {
        // Create temporary objects to encourage GC
        const tempArray = new Array(100000).fill(null);
        tempArray.length = 0;
        
        this.collectionCount = 0;
        this.lastGC = performance.now();
        
        console.log('Forced garbage collection');
    }
    
    trackObject(obj, name) {
        obj.__trackedName = name;
        obj.__creationTime = performance.now();
        this.temporaryObjects.add(obj);
        
        return obj;
    }
    
    untrackObject(obj) {
        this.temporaryObjects.delete(obj);
    }
    
    getTrackedObjects() {
        const now = performance.now();
        return Array.from(this.temporaryObjects).map(obj => ({
            name: obj.__trackedName || 'unknown',
            age: now - obj.__creationTime,
            object: obj
        }));
    }
    
    cleanupOldObjects(maxAge = 60000) { // 1 minute
        const now = performance.now();
        const toRemove = [];
        
        this.temporaryObjects.forEach(obj => {
            if (now - obj.__creationTime > maxAge) {
                toRemove.push(obj);
            }
        });
        
        toRemove.forEach(obj => {
            this.temporaryObjects.delete(obj);
            if (obj.dispose) {
                obj.dispose();
            }
        });
    }
}
```

## Frame Rate Optimization

### 1. Adaptive Quality System

```javascript
class AdaptiveQualitySystem {
    constructor() {
        this.targetFPS = 60;
        this.currentQuality = 1.0; // 1.0 = high, 0.5 = medium, 0.25 = low
        this.frameTimes = [];
        this.frameTimeThreshold = 1000 / this.targetFPS;
        this.adjustmentInterval = 2000; // 2 seconds
        this.lastAdjustment = performance.now();
        
        this.qualitySettings = {
            high: {
                shadowMapSize: 2048,
                antialias: true,
                pixelRatio: 1.0,
                lodDistances: [0, 10, 30, 50],
                particleCount: 10000,
                maxLights: 8
            },
            medium: {
                shadowMapSize: 1024,
                antialias: false,
                pixelRatio: 0.8,
                lodDistances: [0, 8, 20, 35],
                particleCount: 5000,
                maxLights: 4
            },
            low: {
                shadowMapSize: 512,
                antialias: false,
                pixelRatio: 0.5,
                lodDistances: [0, 5, 15, 25],
                particleCount: 1000,
                maxLights: 2
            }
        };
        
        this.currentSettings = { ...this.qualitySettings.high };
    }
    
    update(currentFrameTime) {
        this.frameTimes.push(currentFrameTime);
        
        // Keep only recent frame times
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // Check if we need to adjust quality
        const now = performance.now();
        if (now - this.lastAdjustment < this.adjustmentInterval) {
            return;
        }
        
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
        const fps = 1000 / avgFrameTime;
        
        if (fps < this.targetFPS * 0.8) {
            // Performance is poor, reduce quality
            this.decreaseQuality();
        } else if (fps > this.targetFPS * 0.95) {
            // Performance is good, increase quality
            this.increaseQuality();
        }
        
        this.lastAdjustment = now;
        this.frameTimes = [];
        
        return this.currentQuality;
    }
    
    decreaseQuality() {
        if (this.currentQuality > 0.25) {
            this.currentQuality *= 0.8;
            this.applyQualitySettings();
        }
    }
    
    increaseQuality() {
        if (this.currentQuality < 1.0) {
            this.currentQuality *= 1.1;
            if (this.currentQuality > 1.0) this.currentQuality = 1.0;
            this.applyQualitySettings();
        }
    }
    
    applyQualitySettings() {
        let level = 'high';
        if (this.currentQuality > 0.7) level = 'high';
        else if (this.currentQuality > 0.4) level = 'medium';
        else level = 'low';
        
        this.currentSettings = { ...this.qualitySettings[level] };
        console.log(`Quality adjusted to ${level} (${(this.currentQuality * 100).toFixed(0)}%)`);
    }
    
    getCurrentSettings() {
        return this.currentSettings;
    }
    
    applyToRenderer(renderer) {
        const settings = this.getCurrentSettings();
        
        // Apply pixel ratio
        renderer.setPixelRatio(settings.pixelRatio);
        
        // Apply antialiasing
        renderer.antialias = settings.antialias;
        
        // Recreate renderer if antialiasing changed significantly
        // This is a simplified example
    }
}
```

### 2. Level of Detail (LOD) System

```javascript
class LODSystem {
    constructor(camera) {
        this.camera = camera;
        this.lodObjects = new Map();
        this.lodDistances = [5, 15, 30]; // High, medium, low detail distances
    }
    
    addLODObject(object, lodGeometries) {
        const lodObject = {
            object: object,
            lodGeometries: lodGeometries,
            currentLevel: 0,
            transitionDistance: 2.0, // Distance for smooth transition
            transitionSpeed: 5.0
        };
        
        this.lodObjects.set(object, lodObject);
    }
    
    update() {
        const cameraPosition = this.camera.getPosition();
        
        this.lodObjects.forEach(lodObject => {
            const objectPosition = lodObject.object.getPosition();
            const distance = cameraPosition.distanceTo(objectPosition);
            
            const targetLevel = this.getLODLevel(distance, lodObject);
            
            if (targetLevel !== lodObject.currentLevel) {
                this.transitionToLevel(lodObject, targetLevel);
            }
        });
    }
    
    getLODLevel(distance, lodObject) {
        for (let i = lodObject.lodGeometries.length - 1; i >= 0; i--) {
            if (distance <= this.lodDistances[i]) {
                return i;
            }
        }
        return lodObject.lodGeometries.length - 1;
    }
    
    transitionToLevel(lodObject, targetLevel) {
        lodObject.targetLevel = targetLevel;
        lodObject.transitioning = true;
    }
    
    interpolateLOD(lodObject, deltaTime) {
        if (!lodObject.transitioning) return;
        
        // Smooth transition between LOD levels
        const transitionSpeed = lodObject.transitionSpeed;
        
        // This is a simplified interpolation
        // In practice, you'd want to blend between the two geometries
        lodObject.currentLevel = lodObject.targetLevel;
        
        // Update geometry based on current level
        const geometry = lodObject.lodGeometries[lodObject.currentLevel];
        if (geometry && lodObject.object.geometry !== geometry) {
            lodObject.object.geometry = geometry;
        }
        
        if (lodObject.currentLevel === lodObject.targetLevel) {
            lodObject.transitioning = false;
        }
    }
    
    createLODGeometries(originalGeometry) {
        const lodGeometries = [];
        
        // Create progressively simpler geometries
        const decimateFactors = [1.0, 0.7, 0.4, 0.2]; // High to low detail
        
        decimateFactors.forEach(factor => {
            const simplifiedGeometry = this.decimateGeometry(originalGeometry, factor);
            lodGeometries.push(simplifiedGeometry);
        });
        
        return lodGeometries;
    }
    
    decimateGeometry(geometry, factor) {
        // Simplified decimation - in production, use a proper algorithm
        const positionAttribute = geometry.attributes.position;
        const newCount = Math.floor(positionAttribute.count * factor);
        
        const newGeometry = geometry.clone();
        
        // Remove vertices randomly
        const positions = new Float32Array(newCount * 3);
        let newIndex = 0;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            if (Math.random() < factor || i < newCount) {
                positions[newIndex * 3] = positionAttribute.array[i * 3];
                positions[newIndex * 3 + 1] = positionAttribute.array[i * 3 + 1];
                positions[newIndex * 3 + 2] = positionAttribute.array[i * 3 + 2];
                newIndex++;
            }
        }
        
        newGeometry.setAttribute('position', new NinthJS.BufferAttribute(positions, 3));
        newGeometry.computeVertexNormals();
        
        return newGeometry;
    }
}
```

### 3. Occlusion Culling

```javascript
class OcclusionCulling {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.culledObjects = new Set();
        this.frustum = new NinthJS.Frustum();
        this.frustumMatrix = new NinthJS.Matrix4();
        
        this.visibilityBuffer = null;
        this.setupVisibilityBuffer();
    }
    
    setupVisibilityBuffer() {
        const size = 512; // Small buffer for occlusion testing
        
        this.visibilityBuffer = new NinthJS.WebGLRenderTarget(size, size, {
            depthBuffer: true,
            stencilBuffer: false
        });
        
        // Minimal scene for occlusion testing
        this.occlusionScene = new NinthJS.Scene();
        this.occlusionCamera = new NinthJS.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    }
    
    update() {
        this.updateFrustum();
        this.performFrustumCulling();
        this.performOcclusionCulling();
    }
    
    updateFrustum() {
        // Update frustum from camera
        this.camera.updateMatrixWorld();
        this.frustumMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.frustumMatrix);
    }
    
    performFrustumCulling() {
        this.scene.children.forEach(child => {
            if (child.isMesh) {
                const inFrustum = this.isObjectInFrustum(child);
                
                if (inFrustum) {
                    this.culledObjects.delete(child);
                } else {
                    child.visible = false;
                    this.culledObjects.add(child);
                }
            }
        });
    }
    
    isObjectInFrustum(object) {
        // Simple bounding sphere culling
        const geometry = object.geometry;
        if (!geometry.boundingSphere) {
            geometry.computeBoundingSphere();
        }
        
        const sphere = geometry.boundingSphere.clone();
        sphere.applyMatrix4(object.matrixWorld);
        
        return this.frustum.intersectsSphere(sphere);
    }
    
    performOcclusionCulling() {
        // This is a simplified occlusion culling implementation
        // In practice, you'd render the scene to the visibility buffer
        // and check pixel coverage for each object
        
        const visibleObjects = [];
        
        // For demonstration, we'll just mark large objects as potentially visible
        this.scene.children.forEach(child => {
            if (child.isMesh && child.visible) {
                const boundingBox = new NinthJS.Box3().setFromObject(child);
                const size = boundingBox.getSize(new NinthJS.Vector3());
                
                // Consider objects larger than a threshold as visible
                if (size.length() > 2.0) {
                    visibleObjects.push(child);
                }
            }
        });
        
        // Reset visibility for visible objects
        visibleObjects.forEach(obj => obj.visible = true);
    }
    
    getVisibilityStats() {
        const total = this.scene.children.filter(child => child.isMesh).length;
        const culled = this.culledObjects.size;
        const visible = total - culled;
        
        return {
            total,
            visible,
            culled,
            cullRate: (culled / total * 100).toFixed(1) + '%'
        };
    }
}
```

## Profiling Tools

### 1. Performance Profiler

```javascript
class PerformanceProfiler {
    constructor() {
        this.profiles = new Map();
        this.activeProfiles = new Map();
        this.reportInterval = 5000; // 5 seconds
        this.lastReport = performance.now();
    }
    
    startProfile(name) {
        const profile = {
            name,
            startTime: performance.now(),
            endTime: null,
            duration: 0,
            calls: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: Infinity,
            maxDuration: 0
        };
        
        this.activeProfiles.set(name, profile);
        return profile;
    }
    
    endProfile(name) {
        const profile = this.activeProfiles.get(name);
        if (!profile) return;
        
        profile.endTime = performance.now();
        profile.duration = profile.endTime - profile.startTime;
        profile.calls++;
        profile.totalDuration += profile.duration;
        profile.averageDuration = profile.totalDuration / profile.calls;
        profile.minDuration = Math.min(profile.minDuration, profile.duration);
        profile.maxDuration = Math.max(profile.maxDuration, profile.duration);
        
        // Move to completed profiles
        this.profiles.set(name, profile);
        this.activeProfiles.delete(name);
        
        return profile;
    }
    
    profileFunction(fn, name) {
        return (...args) => {
            this.startProfile(name);
            try {
                const result = fn.apply(this, args);
                this.endProfile(name);
                return result;
            } catch (error) {
                this.endProfile(name);
                throw error;
            }
        };
    }
    
    getReport() {
        const now = performance.now();
        if (now - this.lastReport < this.reportInterval) {
            return null;
        }
        
        this.lastReport = now;
        
        const report = {
            timestamp: new Date().toISOString(),
            profiles: {},
            summary: {
                totalProfiles: this.profiles.size,
                activeProfiles: this.activeProfiles.size,
                totalTime: 0
            }
        };
        
        // Compile profile data
        this.profiles.forEach((profile, name) => {
            report.profiles[name] = {
                calls: profile.calls,
                totalDuration: profile.totalDuration.toFixed(2) + 'ms',
                averageDuration: profile.averageDuration.toFixed(2) + 'ms',
                minDuration: profile.minDuration.toFixed(2) + 'ms',
                maxDuration: profile.maxDuration.toFixed(2) + 'ms',
                percentageOfTotal: 0 // Will calculate below
            };
            
            report.summary.totalTime += profile.totalDuration;
        });
        
        // Calculate percentages
        Object.keys(report.profiles).forEach(name => {
            const profile = report.profiles[name];
            profile.percentageOfTotal = (
                (parseFloat(profile.totalDuration) / report.summary.totalTime) * 100
            ).toFixed(1) + '%';
        });
        
        return report;
    }
    
    printReport() {
        const report = this.getReport();
        if (!report) return;
        
        console.log('=== Performance Report ===');
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`Total Profiles: ${report.summary.totalProfiles}`);
        console.log(`Total Time: ${report.summary.totalTime.toFixed(2)}ms`);
        console.log('');
        
        Object.keys(report.profiles).forEach(name => {
            const profile = report.profiles[name];
            console.log(`${name}:`);
            console.log(`  Calls: ${profile.calls}`);
            console.log(`  Total: ${profile.totalDuration} (${profile.percentageOfTotal})`);
            console.log(`  Average: ${profile.averageDuration}`);
            console.log(`  Min: ${profile.minDuration}, Max: ${profile.maxDuration}`);
            console.log('');
        });
    }
    
    reset() {
        this.profiles.clear();
        this.activeProfiles.clear();
    }
}

// Usage example
const profiler = new PerformanceProfiler();

function optimizedRender() {
    profiler.startProfile('render');
    
    // Render logic
    renderer.render(scene, camera);
    
    profiler.endProfile('render');
    
    // Print report periodically
    profiler.printReport();
}
```

### 2. WebGL Inspector

```javascript
class WebGLInspector {
    constructor(renderer) {
        this.renderer = renderer;
        this.gl = renderer.getContext();
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            points: 0,
            lines: 0,
            textures: 0,
            buffers: 0,
            programs: 0
        };
        
        this.originalDrawArrays = this.gl.drawArrays.bind(this.gl);
        this.originalDrawElements = this.gl.drawElements.bind(this.gl);
        
        this.hookWebGLCalls();
    }
    
    hookWebGLCalls() {
        // Hook drawArrays
        this.gl.drawArrays = (...args) => {
            this.stats.drawCalls++;
            const mode = args[0];
            const count = args[3] || 0;
            
            switch (mode) {
                case this.gl.TRIANGLES:
                    this.stats.triangles += count / 3;
                    break;
                case this.gl.POINTS:
                    this.stats.points += count;
                    break;
                case this.gl.LINES:
                    this.stats.lines += count / 2;
                    break;
            }
            
            return this.originalDrawArrays(...args);
        };
        
        // Hook drawElements
        this.gl.drawElements = (...args) => {
            this.stats.drawCalls++;
            const mode = args[0];
            const count = args[2] || 0;
            
            switch (mode) {
                case this.gl.TRIANGLES:
                    this.stats.triangles += count / 3;
                    break;
                case this.gl.POINTS:
                    this.stats.points += count;
                    break;
                case this.gl.LINES:
                    this.stats.lines += count / 2;
                    break;
            }
            
            return this.originalDrawElements(...args);
        };
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    resetStats() {
        this.stats.drawCalls = 0;
        this.stats.triangles = 0;
        this.stats.points = 0;
        this.stats.lines = 0;
    }
    
    createReport() {
        return `
WebGL Statistics:
================
Draw Calls: ${this.stats.drawCalls}
Triangles: ${this.stats.triangles.toFixed(0)}
Points: ${this.stats.points.toFixed(0)}
Lines: ${this.stats.lines.toFixed(0)}

Performance Recommendations:
${this.getRecommendations()}
        `;
    }
    
    getRecommendations() {
        const recommendations = [];
        
        if (this.stats.drawCalls > 1000) {
            recommendations.push('- Consider batching draw calls or using instancing');
        }
        
        if (this.stats.triangles > 100000) {
            recommendations.push('- Consider LOD system or geometry optimization');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('- Performance looks good!');
        }
        
        return recommendations.join('\n');
    }
}
```

## Complete Optimization Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Performance Optimization Demo - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: Arial, sans-serif; }
        #controls {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 5px;
            max-width: 300px;
        }
        #stats {
            position: absolute; top: 10px; right: 10px; z-index: 100;
            background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 5px;
            font-family: monospace; font-size: 12px;
        }
        button { margin: 2px; padding: 5px 10px; background: #4488ff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #3366cc; }
        .slider-group { margin: 5px 0; }
        input[type="range"] { width: 100px; }
        label { display: inline-block; width: 80px; font-size: 12px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Performance Controls</h3>
        
        <div class="slider-group">
            <label>Quality:</label>
            <input type="range" id="quality" min="0.1" max="1.0" step="0.1" value="1.0">
            <span id="qualityValue">1.0</span>
        </div>
        
        <div class="slider-group">
            <label>Objects:</label>
            <input type="range" id="objectCount" min="10" max="1000" step="10" value="100">
            <span id="objectCountValue">100</span>
        </div>
        
        <div class="slider-group">
            <label>Shadows:</label>
            <input type="checkbox" id="shadows" checked>
        </div>
        
        <div class="slider-group">
            <label>Instancing:</label>
            <input type="checkbox" id="instancing" checked>
        </div>
        
        <button onclick="toggleOptimization()">Toggle LOD</button>
        <button onclick="toggleProfiler()">Toggle Profiler</button>
        <button onclick="resetScene()">Reset Scene</button>
        
        <div style="margin-top: 10px;">
            <button onclick="spawnObjects()">Spawn More</button>
            <button onclick="clearObjects()">Clear All</button>
        </div>
    </div>
    
    <div id="stats">
        <div id="performanceStats">FPS: 0</div>
        <div id="objectStats">Objects: 0</div>
        <div id="renderStats">Draw Calls: 0</div>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        class OptimizedScene {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = new NinthJS.Scene();
                this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new NinthJS.WebGLRenderer(this.canvas, { antialias: true });
                
                // Optimization systems
                this.performanceMonitor = new PerformanceMonitor();
                this.adaptiveQuality = new AdaptiveQualitySystem();
                this.lodSystem = new LODSystem(this.camera);
                this.assetManager = new AssetManager(this.renderer);
                this.objectPool = new ObjectPool(
                    () => this.createPooledObject(),
                    (obj) => this.resetPooledObject(obj),
                    1000
                );
                this.webglInspector = new WebGLInspector(this.renderer);
                
                // Scene state
                this.objects = [];
                this.optimizationsEnabled = true;
                this.profilerEnabled = false;
                
                this.init();
                this.createScene();
                this.setupControls();
                this.animate();
            }
            
            init() {
                this.scene.setBackground('#001122');
                this.camera.setPosition(0, 5, 10);
                
                // Setup optimized renderer
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = NinthJS.PCFSoftShadowMap;
                this.renderer.outputEncoding = NinthJS.sRGBEncoding;
                this.renderer.toneMapping = NinthJS.ACESFilmicToneMapping;
                
                // Setup lighting
                this.setupLighting();
                
                // Handle window resize
                window.addEventListener('resize', () => this.handleResize());
            }
            
            setupLighting() {
                // Ambient light
                const ambientLight = new NinthJS.AmbientLight(0.2, '#404040');
                this.scene.add(ambientLight);
                
                // Main directional light with shadows
                const directionalLight = new NinthJS.DirectionalLight(1, '#ffffff');
                directionalLight.setPosition(5, 10, 5);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 1024;
                directionalLight.shadow.mapSize.height = 1024;
                directionalLight.shadow.camera.near = 0.5;
                directionalLight.shadow.camera.far = 50;
                this.scene.add(directionalLight);
                
                // Ground
                const groundGeometry = new NinthJS.PlaneGeometry(50, 50);
                const groundMaterial = new NinthJS.PhongMaterial({ color: '#333333' });
                const ground = new NinthJS.Mesh(groundGeometry, groundMaterial);
                ground.setRotation(-Math.PI / 2, 0, 0);
                ground.receiveShadow = true;
                this.scene.add(ground);
            }
            
            createScene() {
                // Create initial objects
                this.spawnObjects(100);
            }
            
            createPooledObject() {
                const geometry = new NinthJS.BoxGeometry(0.5, 0.5, 0.5);
                const material = new NinthJS.PhongMaterial({ 
                    color: '#4488ff',
                    vertexColors: true 
                });
                
                const mesh = new NinthJS.Mesh(geometry, material);
                mesh.castShadow = true;
                
                // Random position
                mesh.setPosition(
                    (Math.random() - 0.5) * 20,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 20
                );
                
                // Random velocity
                mesh.userData.velocity = {
                    x: (Math.random() - 0.5) * 0.1,
                    y: Math.random() * 0.05,
                    z: (Math.random() - 0.5) * 0.1
                };
                
                // Random color
                const color = new NinthJS.Color();
                color.setHSL(Math.random(), 0.7, 0.6);
                mesh.material.color.copy(color);
                
                return mesh;
            }
            
            resetPooledObject(obj) {
                obj.visible = false;
                obj.userData.velocity = { x: 0, y: 0, z: 0 };
            }
            
            spawnObjects(count) {
                const startTime = performance.now();
                
                for (let i = 0; i < count; i++) {
                    const obj = this.objectPool.acquire();
                    obj.visible = true;
                    
                    // Random position
                    obj.setPosition(
                        (Math.random() - 0.5) * 30,
                        Math.random() * 8,
                        (Math.random() - 0.5) * 30
                    );
                    
                    // Random velocity
                    obj.userData.velocity = {
                        x: (Math.random() - 0.5) * 0.2,
                        y: Math.random() * 0.1,
                        z: (Math.random() - 0.5) * 0.2
                    };
                    
                    this.scene.add(obj);
                    this.objects.push(obj);
                }
                
                const endTime = performance.now();
                console.log(`Spawned ${count} objects in ${(endTime - startTime).toFixed(2)}ms`);
            }
            
            clearObjects() {
                this.objects.forEach(obj => {
                    this.scene.remove(obj);
                    this.objectPool.release(obj);
                });
                this.objects = [];
            }
            
            updateOptimizations() {
                if (!this.optimizationsEnabled) return;
                
                // Update adaptive quality
                const quality = this.adaptiveQuality.update(this.performanceMonitor.metrics.frameTime);
                if (quality !== undefined) {
                    this.applyQualitySettings(quality);
                }
                
                // Update LOD system
                this.lodSystem.update();
                
                // Clean up unused assets periodically
                this.assetManager.cleanup();
            }
            
            applyQualitySettings(quality) {
                const settings = this.adaptiveQuality.getCurrentSettings();
                
                // Adjust shadows based on quality
                this.renderer.shadowMap.enabled = settings.shadowMap.enabled;
                
                // Adjust pixel ratio
                this.renderer.setPixelRatio(settings.pixelRatio);
                
                // Update shadow map size
                this.scene.children.forEach(child => {
                    if (child.isDirectionalLight && child.shadow) {
                        child.shadow.mapSize.width = settings.shadowMap.size;
                        child.shadow.mapSize.height = settings.shadowMap.size;
                        child.shadow.dispose();
                    }
                });
            }
            
            updateObjects(deltaTime) {
                this.objects.forEach(obj => {
                    // Simple physics simulation
                    const velocity = obj.userData.velocity;
                    
                    // Update position
                    const position = obj.getPosition();
                    obj.setPosition(
                        position.x + velocity.x,
                        position.y + velocity.y,
                        position.z + velocity.z
                    );
                    
                    // Apply gravity
                    velocity.y -= 9.8 * deltaTime * 0.5;
                    
                    // Ground collision
                    if (obj.position.y < 0.25) {
                        obj.position.y = 0.25;
                        velocity.y = -velocity.y * 0.8; // Bounce with damping
                        
                        // Apply friction
                        velocity.x *= 0.9;
                        velocity.z *= 0.9;
                    }
                    
                    // Rotation
                    obj.rotation.x += velocity.y * deltaTime;
                    obj.rotation.y += 0.01;
                });
            }
            
            updateStats() {
                const stats = this.webglInspector.getStats();
                
                // Update UI
                document.getElementById('performanceStats').textContent = 
                    `FPS: ${this.performanceMonitor.metrics.fps.toFixed(1)}`;
                
                document.getElementById('objectStats').textContent = 
                    `Objects: ${this.objects.length}`;
                
                document.getElementById('renderStats').textContent = 
                    `Draw Calls: ${stats.drawCalls}`;
                
                // Log detailed report periodically
                if (this.performanceMonitor.frameCount % 300 === 0) { // Every 5 seconds at 60fps
                    console.log('=== Performance Report ===');
                    console.log(this.performanceMonitor.createReport());
                    console.log(this.webglInspector.createReport());
                }
            }
            
            setupControls() {
                // Quality control
                const qualitySlider = document.getElementById('quality');
                const qualityValue = document.getElementById('qualityValue');
                qualitySlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    qualityValue.textContent = value;
                    this.adaptiveQuality.currentQuality = value;
                    this.adaptiveQuality.applyQualitySettings();
                });
                
                // Object count control
                const objectCountSlider = document.getElementById('objectCount');
                const objectCountValue = document.getElementById('objectCountValue');
                objectCountSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    objectCountValue.textContent = value;
                });
                
                // Shadow toggle
                document.getElementById('shadows').addEventListener('change', (e) => {
                    this.renderer.shadowMap.enabled = e.target.checked;
                });
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                const startTime = performance.now();
                
                // Update performance monitoring
                this.performanceMonitor.update();
                
                // Apply optimizations
                this.updateOptimizations();
                
                // Update objects
                this.updateObjects(1/60);
                
                // Render
                this.renderer.render(this.scene, this.camera);
                
                // Update stats
                this.updateStats();
                
                // Reset WebGL stats
                if (this.performanceMonitor.frameCount % 60 === 0) {
                    this.webglInspector.resetStats();
                }
            }
            
            handleResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        
        // Initialize optimized scene
        const optimizedScene = new OptimizedScene();
        
        // Global functions for controls
        function toggleOptimization() {
            optimizedScene.optimizationsEnabled = !optimizedScene.optimizationsEnabled;
            console.log(`Optimizations ${optimizedScene.optimizationsEnabled ? 'enabled' : 'disabled'}`);
        }
        
        function toggleProfiler() {
            optimizedScene.profilerEnabled = !optimizedScene.profilerEnabled;
            console.log(`Profiler ${optimizedScene.profilerEnabled ? 'enabled' : 'disabled'}`);
        }
        
        function resetScene() {
            optimizedScene.clearObjects();
            optimizedScene.spawnObjects(parseInt(document.getElementById('objectCount').value));
        }
        
        function spawnObjects() {
            optimizedScene.spawnObjects(parseInt(document.getElementById('objectCount').value));
        }
        
        function clearObjects() {
            optimizedScene.clearObjects();
        }
    </script>
</body>
</html>
```

## Performance Best Practices

### 1. Development Guidelines
- **Profile early and often** - Use performance monitoring throughout development
- **Set performance budgets** - Define limits for frame time, memory, and draw calls
- **Test on target hardware** - Optimize for your actual audience's devices
- **Use appropriate LOD systems** - Reduce complexity for distant objects
- **Implement efficient culling** - Don't render what can't be seen

### 2. Runtime Optimization
- **Batch similar objects** - Use instanced rendering for repeated geometries
- **Optimize texture usage** - Use compressed textures and appropriate resolutions
- **Manage memory carefully** - Dispose of unused resources promptly
- **Use object pooling** - Reuse objects to reduce garbage collection
- **Implement adaptive quality** - Adjust quality based on performance

### 3. Asset Optimization
- **Compress models** - Use appropriate level of detail for geometry
- **Optimize textures** - Use appropriate formats and compression
- **Preload critical assets** - Ensure smooth loading of essential content
- **Use streaming for large worlds** - Load content as needed

### 4. Code Optimization
- **Minimize JavaScript work** - Use WebGL for heavy computations
- **Avoid excessive object creation** - Reuse objects when possible
- **Use efficient algorithms** - Choose appropriate data structures
- **Profile hot paths** - Focus optimization efforts on critical code sections

## Troubleshooting Performance Issues

### Common Performance Problems

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Low FPS | Too many draw calls | Use instancing, batching, LOD |
| Stuttering | Garbage collection | Use object pooling, minimize allocations |
| High memory usage | Memory leaks | Properly dispose of unused resources |
| Slow loading | Large assets | Compress textures, optimize models |
| Poor mobile performance | Complex shaders | Use simpler materials, reduce features |

### Performance Checklist

- [ ] Geometry optimized (appropriate polygon count)
- [ ] Textures compressed and properly sized
- [ ] Materials shared and optimized
- [ ] LOD system implemented
- [ ] Culling systems enabled
- [ ] Object pooling used for frequent allocations
- [ ] Adaptive quality system in place
- [ ] Performance monitoring implemented
- [ ] Memory management optimized
- [ ] Profiling tools integrated

## Next Steps

With performance optimization mastered:

1. **[Advanced Rendering](./advanced-rendering.md)** - Apply optimization to complex rendering techniques
2. **[Physics Integration](./physics-integration.md)** - Optimize physics simulations
3. **[Loading 3D Models](./loading-3d-models.md)** - Optimize model loading and rendering
4. **[Animation Basics](./animation-basics.md)** - Optimize animation systems

---

**Your Ninth.js applications now run like lightning! Maximum performance achieved! ⚡**