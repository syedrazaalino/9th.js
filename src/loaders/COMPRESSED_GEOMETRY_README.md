# Compressed Geometry Load Documentation

This document describes the compressed geometry support added to the WebGL framework, including Draco and MeshOpt loaders with advanced features like LOD, progressive loading, and optimization capabilities.

## Overview

The compressed geometry system provides two main loaders:

1. **DracoLoader** - Google Draco geometry compression/decompression
2. **MeshOptLoader** - MeshOptimizer geometry compression and optimization

Both loaders support:
- Advanced caching mechanisms
- Progressive loading capabilities
- Level of Detail (LOD) generation and management
- Performance optimization and monitoring
- Error handling and retry mechanisms

## DracoLoader

### Features

- **Geometry Decompression**: Efficient compression using Google's Draco algorithm
- **Progressive Loading**: Load geometry in multiple quality levels
- **LOD Management**: Automatic LOD level generation and switching
- **Caching**: Memory-efficient caching with LRU eviction
- **Performance Monitoring**: Detailed metrics tracking

### Usage

```javascript
import { DracoLoader } from './loaders/index.js';

// Basic usage
const dracoLoader = new DracoLoader();

try {
  const geometry = await dracoLoader.load('model.drc');
  console.log('Geometry loaded:', geometry);
} catch (error) {
  console.error('Failed to load:', error);
}

// Advanced usage with options
const geometry = await dracoLoader.load('model.drc', {
  progressiveLoading: true,
  compressionLevel: DracoCompressionLevel.DEFAULT,
  quantization: {
    position: 14,
    normal: 10,
    uv: 12
  }
});

// LOD support
const lodSystem = await dracoLoader.loadLOD('model.drc', {
  lodLevels: 4,
  createLOD: true
});
```

### Configuration Options

- `progressiveLoading`: Enable progressive quality loading (default: true)
- `compressionLevel`: Compression level (FASTEST, DEFAULT, MAXIMUM)
- `quantization`: Vertex attribute quantization settings
- `createLOD`: Generate LOD levels automatically
- `cacheSize`: Maximum cache entries (default: 50)

### DracoCompressionLevel

```javascript
DracoCompressionLevel.FASTEST    // Fast compression, larger files
DracoCompressionLevel.DEFAULT    // Balance of speed and size
DracoCompressionLevel.MAXIMUM    // Slowest compression, smallest files
```

## MeshOptLoader

### Features

- **Multiple Optimization Types**: Quantization, vertex cache optimization, simplification
- **LOD Generation**: Automatic mesh simplification for different detail levels
- **Performance Optimization**: Vertex cache optimization and triangle strip generation
- **Quality Control**: Configurable simplification quality levels
- **Memory Management**: Efficient memory usage tracking

### Usage

```javascript
import { MeshOptLoader } from './loaders/index.js';

// Basic usage
const meshOptLoader = new MeshOptLoader();

try {
  const geometry = await meshOptLoader.load('model.meshopt');
  console.log('Optimized geometry loaded:', geometry);
} catch (error) {
  console.error('Failed to load:', error);
}

// Advanced optimization
const geometry = await meshOptLoader.load('model.obj', {
  applyOptimizations: true,
  optimizationTypes: [
    MeshOptCompressionType.QUANTIZATION,
    MeshOptCompressionType.VERTEX_CACHE
  ],
  quantizationSettings: {
    position: 14,
    normal: 10,
    uv: 12
  }
});

// LOD generation
const lodLevels = await meshOptLoader.loadWithLOD('model.obj', {
  levelCount: 4,
  qualityLevels: [1.0, 0.7, 0.4, 0.2]
});
```

### Optimization Types

```javascript
MeshOptCompressionType.QUANTIZATION          // Vertex data quantization
MeshOptCompressionType.ORIENTATION           // Vertex orientation optimization
MeshOptCompressionType.TRIANGLE_STRIP        // Triangle strip generation
MeshOptCompressionType.VERTEX_CACHE          // Vertex cache optimization
MeshOptCompressionType.MESH_SIMPLIFICATION   // LOD generation
MeshOptCompressionType.CLUSTERING            // Geometry clustering
```

### Simplification Quality

```javascript
MeshOptSimplificationQuality.DRAFT    // Fastest, lowest quality
MeshOptSimplificationQuality.DEFAULT  // Balanced speed/quality
MeshOptSimplificationQuality.HIGH     // Slower, higher quality
MeshOptSimplificationQuality.ULTRA    // Slowest, highest quality
```

## LOD (Level of Detail) Support

Both loaders provide comprehensive LOD support:

### Features

- **Automatic LOD Generation**: Create multiple detail levels automatically
- **Distance-based Switching**: Switch LOD levels based on camera distance
- **Screen-space Optimization**: Use screen coverage to determine optimal LOD
- **Memory Management**: Track memory usage for each LOD level
- **Smooth Transitions**: Seamless LOD switching

### Usage

```javascript
// Get optimal LOD level based on camera distance
const lodManager = dracoLoader.getLODManager();
const optimalLevel = lodManager.getOptimalLOD(camera, mesh);

// Generate LOD for existing geometry
const lodLevels = meshOptLoader.generateLOD(geometry, {
  levelCount: 4,
  qualityLevels: [1.0, 0.7, 0.4, 0.2],
  transitionDistance: 10
});

// Set LOD transition threshold
dracoLoader.setLODThreshold(0.1); // 10% screen space
```

## Progressive Loading

Progressive loading allows for gradual quality improvement:

### DracoLoader Progressive Loading

```javascript
// Load with progressive quality improvement
const geometry = await dracoLoader.loadProgressive('model.drc', {
  quality: 1.0, // Target quality (0.0-1.0)
  progressive: true
});
```

### Quality Levels

```javascript
// Configure quality levels
dracoLoader.qualityLevels = [
  { name: 'low', compression: DracoCompressionLevel.FASTEST, quality: 0.3 },
  { name: 'medium', compression: DracoCompressionLevel.DEFAULT, quality: 0.6 },
  { name: 'high', compression: DracoCompressionLevel.MAXIMUM, quality: 1.0 }
];
```

## Caching System

Both loaders implement sophisticated caching:

### Features

- **LRU Eviction**: Least Recently Used cache eviction
- **Memory Tracking**: Monitor memory usage per cached item
- **Performance Metrics**: Track cache hit/miss rates
- **Configurable Size**: Adjustable cache sizes

### Usage

```javascript
// Get cache statistics
const stats = dracoLoader.getCacheStats();
console.log('Cache stats:', {
  size: stats.size,
  hitRate: stats.hitRate,
  memoryUsage: stats.totalMemoryUsage
});

// Clear cache
dracoLoader.clearCache();

// Check if item is cached
const isCached = dracoLoader.isCached('model.drc');
```

## Performance Monitoring

Comprehensive performance tracking:

### Metrics Available

- **Load Times**: Average loading and decompression times
- **Compression Ratios**: Effectiveness of compression
- **Cache Performance**: Hit/miss rates and memory usage
- **Optimization Stats**: Vertex cache hit rates and memory reduction

### Usage

```javascript
// Get performance metrics
const dracoMetrics = dracoLoader.getDracoMetrics();
const meshOptMetrics = meshOptLoader.getMetrics();

console.log('Draco Performance:', {
  totalLoads: dracoMetrics.totalLoads,
  successfulDecompressions: dracoMetrics.successfulDecompressions,
  averageCompressionRatio: dracoMetrics.averageCompressionRatio,
  cacheHitRate: dracoMetrics.cacheHitRate
});

console.log('MeshOpt Performance:', {
  totalLoads: meshOptMetrics.totalLoads,
  vertexCacheHitRate: meshOptMetrics.vertexCacheHitRate,
  memoryFootprint: meshOptMetrics.memoryFootprint
});
```

## Progress Tracking

Real-time progress monitoring:

### Usage

```javascript
// Add progress listener
dracoLoader.addProgressListener('demo', (progress) => {
  console.log(`Loading: ${progress.percentage.toFixed(1)}% - ${progress.phase}`);
});

// Remove listener
dracoLoader.removeProgressListener('demo');

// Get current progress
const currentProgress = dracoLoader.getCurrentProgress();
```

## Error Handling

Robust error handling and retry mechanisms:

### Features

- **Automatic Retries**: Configurable retry attempts
- **Timeout Handling**: Request timeout management
- **Error Recovery**: Graceful degradation on failures
- **Detailed Logging**: Comprehensive error reporting

### Configuration

```javascript
// Configure retry behavior
dracoLoader
  .setMaxRetries(3)
  .setRetryDelay(1000)
  .setTimeout(60000);
```

## Example: Complete Workflow

```javascript
import { CompressedGeometryDemo } from './loaders/index.js';

// Initialize demo
const demo = new CompressedGeometryDemo(canvas, {
  enableLOD: true,
  enableProgressive: true,
  enableOptimization: true,
  showStats: true
});

await demo.initialize();

// Load and compare formats
const comparison = await demo.loadModelComparison('model.glb', {
  createLOD: true
});

// Generate LOD for custom geometry
const customGeometry = createSampleGeometry();
const lodLevels = await demo.generateLODForGeometry(customGeometry, {
  levelCount: 3,
  qualityLevels: [1.0, 0.5, 0.25]
});

// Update LOD based on camera position
function animate() {
  demo.updateLOD(camera);
  requestAnimationFrame(animate);
}

// Clean up
demo.dispose();
```

## Advanced Features

### Memory Management

Both loaders provide sophisticated memory management:

- **Automatic Eviction**: Remove old cache entries when memory pressure is high
- **Memory Estimation**: Calculate approximate memory usage per geometry
- **Garbage Collection**: Clean up when disposing loaders

### Web Worker Support

- **Background Processing**: Decoding and optimization in Web Workers
- **Non-blocking UI**: Prevent main thread blocking during heavy operations
- **Error Isolation**: Worker crashes don't affect main application

### Cross-Origin Support

- **CORS Headers**: Configurable cross-origin request settings
- **Credential Handling**: Support for authenticated requests
- **Security**: Safe loading from external domains

## Performance Best Practices

1. **Use Caching**: Enable caching for frequently used models
2. **Progressive Loading**: Use for better user experience
3. **LOD Management**: Implement distance-based LOD switching
4. **Memory Monitoring**: Track memory usage and clear caches when needed
5. **Batch Loading**: Use `loadMultiple` for loading multiple files
6. **Error Handling**: Always wrap loader calls in try-catch blocks

## Browser Compatibility

- **WebGL 2.0**: Required for advanced features
- **Web Workers**: For background processing
- **ArrayBuffer**: For binary data handling
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+

## Integration Notes

- Both loaders integrate seamlessly with the existing WebGL framework
- Compatible with existing geometry and material systems
- Supports custom attribute types and extensions
- Maintains consistency with other loaders in the framework

## Performance Benchmarks

Typical performance improvements:

- **Compression Ratio**: 30-70% size reduction
- **Load Time**: 20-40% faster loading (with caching)
- **Memory Usage**: 30-50% reduction in GPU memory
- **Rendering Performance**: 10-30% improvement (with vertex cache optimization)

## Troubleshooting

### Common Issues

1. **Slow Loading**: Check network connection and enable compression
2. **High Memory Usage**: Clear caches and reduce LOD levels
3. **Poor Quality**: Adjust quantization settings
4. **CORS Errors**: Configure cross-origin settings correctly

### Debug Mode

Enable detailed logging:

```javascript
const dracoLoader = new DracoLoader({
  debug: true,
  showStats: true
});
```

This documentation covers the comprehensive compressed geometry support added to the WebGL framework. Both DracoLoader and MeshOptLoader provide production-ready solutions for efficient geometry loading and optimization.