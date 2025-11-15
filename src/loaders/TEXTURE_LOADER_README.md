# Advanced TextureLoader Documentation

A comprehensive texture loading system with caching, progress tracking, error handling, and retry mechanisms.

## Features

- **Async Texture Loading**: Non-blocking texture loading with proper async/await support
- **Format Detection**: Automatic detection of texture formats from URLs and headers
- **Cross-Origin Support**: Configurable CORS handling for external textures
- **Comprehensive Caching**: LRU-based caching system with configurable size and statistics
- **Progress Tracking**: Real-time progress updates for single and batch loads
- **Error Handling**: Robust error handling with detailed error information
- **Retry Mechanisms**: Automatic retry with exponential backoff for failed loads
- **Performance Monitoring**: Built-in metrics for load times, cache hit rates, and more

## Classes

### TextureLoader

The main texture loading class with comprehensive features.

```javascript
import { TextureLoader } from './src/loaders/index.js';

const loader = new TextureLoader({
  crossOrigin: 'anonymous',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  cacheSize: 100
});
```

### TextureCache

LRU (Least Recently Used) cache for textures with statistics tracking.

```javascript
import { TextureCache } from './src/loaders/index.js';

const cache = new TextureCache(100); // Max 100 textures
const texture = cache.get('texture-url');
```

### TextureFormatDetector

Utility class for detecting and validating texture formats.

```javascript
import { TextureFormatDetector } from './src/loaders/index.js';

const format = TextureFormatDetector.detectFormat('path/to/texture.jpg');
const isSupported = TextureFormatDetector.isSupported(format);
```

### TextureLoaderProgress

Progress tracking utility for monitoring load operations.

```javascript
import { TextureLoaderProgress } from './src/loaders/index.js';

const progress = new TextureLoaderProgress();
progress.addListener('key', (progressData) => {
  console.log(`Progress: ${progressData.percentage}%`);
});
```

## Basic Usage

### Loading a Single Texture

```javascript
import { TextureLoader } from './src/loaders/index.js';

const loader = new TextureLoader();

try {
  const texture = await loader.load('https://example.com/texture.jpg');
  console.log('Loaded:', texture.width, 'x', texture.height);
} catch (error) {
  console.error('Failed to load texture:', error);
}
```

### Loading with Progress Tracking

```javascript
const loader = new TextureLoader();

// Add progress listener
loader.addProgressListener('main', (progress) => {
  console.log(`Progress: ${progress.percentage.toFixed(1)}%`);
});

const texture = await loader.load('https://example.com/large-texture.png');
```

### Loading Multiple Textures

```javascript
const urls = [
  'texture1.jpg',
  'texture2.png',
  'texture3.webp'
];

const textures = await loader.loadMultiple(urls);

// Or with progress tracking
const textures = await loader.loadMultipleWithProgress(
  urls,
  {},
  (progress, completed, total) => {
    console.log(`${completed}/${total} textures loaded`);
  }
);
```

## Configuration Options

### TextureLoader Options

```javascript
const loader = new TextureLoader({
  // CORS configuration
  crossOrigin: 'anonymous',      // CORS policy
  withCredentials: false,        // Send credentials with requests
  
  // Timeout and retry settings
  timeout: 30000,                // Request timeout (ms)
  maxRetries: 3,                 // Maximum retry attempts
  retryDelay: 1000,              // Base retry delay (ms)
  
  // Cache configuration
  cacheSize: 100,                // Maximum cache entries
  
  // Loading manager
  manager: LoadingManager.default // Custom loading manager
});
```

### Texture Loading Options

```javascript
const texture = await loader.load('texture.jpg', {
  // Custom cache key
  key: 'my-custom-key',
  
  // Texture configuration
  flipY: true,                   // Flip Y axis
  generateMipmaps: true,         // Generate mipmaps
  magFilter: 'linear',           // Magnification filter
  minFilter: 'linearMipmapLinear', // Minification filter
  wrapS: 'repeat',               // S wrapping mode
  wrapT: 'repeat',               // T wrapping mode
  
  // Retry configuration
  retries: 0,                    // Manual retry count
  timeout: 15000                 // Per-request timeout
});
```

## Advanced Features

### Cache Management

```javascript
// Check if texture is cached
if (loader.isCached('texture.jpg')) {
  const cachedTexture = loader.load('texture.jpg'); // From cache
}

// Clear specific texture from cache
loader.unload('texture.jpg');

// Clear entire cache
loader.clearCache();

// Get cache statistics
const stats = loader.getCacheStats();
console.log(stats);
// {
//   size: 45,
//   maxSize: 100,
//   hitCount: 123,
//   missCount: 67,
//   hitRate: 0.647
// }
```

### Progress Tracking

```javascript
// Add progress listener
loader.addProgressListener('my-loader', (progress) => {
  console.log(`Loaded: ${progress.loaded}/${progress.total} bytes`);
  console.log(`Percentage: ${progress.percentage.toFixed(1)}%`);
});

// Remove progress listener
loader.removeProgressListener('my-loader');

// Get current global progress
const currentProgress = loader.getLoadingStatus();
console.log(currentProgress);
// {
//   activeLoads: 2,
//   failedLoads: 0,
//   progress: { loaded: 5000, total: 10000, percentage: 50 },
//   cacheSize: 45
// }
```

### Performance Monitoring

```javascript
// Get performance metrics
const metrics = loader.getPerformanceMetrics();
console.log(metrics);
// {
//   totalLoads: 156,
//   successfulLoads: 150,
//   failedLoads: 6,
//   averageLoadTime: 1250.5,
//   cacheHitRate: 0.78
// }

// Reset metrics
loader.resetMetrics();
```

### Chainable Configuration

```javascript
const loader = new TextureLoader()
  .setCrossOrigin('anonymous')
  .setWithCredentials(false)
  .setTimeout(30000)
  .setMaxRetries(3)
  .setRetryDelay(1000)
  .setCacheSize(100);
```

## Error Handling

### Automatic Retry

The loader automatically retries failed requests with exponential backoff:

```javascript
const loader = new TextureLoader({
  maxRetries: 3,
  retryDelay: 1000
});

// This will retry up to 3 times with delays: 1s, 2s, 4s
const texture = await loader.load('unreliable-url.jpg');
```

### Manual Error Handling

```javascript
try {
  const texture = await loader.load('texture.jpg');
} catch (error) {
  if (error.message.includes('HTTP 404')) {
    console.log('Texture not found');
  } else if (error.message.includes('timeout')) {
    console.log('Request timed out');
  } else {
    console.log('Other error:', error.message);
  }
}
```

### Permanent vs Temporary Errors

The loader distinguishes between permanent and temporary errors:
- **Permanent (no retry)**: 404, 403, 401, 415, 500
- **Temporary (retry)**: Network errors, timeouts, 502, 503, etc.

## Format Support

The TextureLoader supports various texture formats:

- **Standard**: JPEG, PNG, GIF, WebP, BMP, TIFF
- **Compressed**: DDS, KTX, PVR, ASTC
- **GPU Formats**: Basis Universal

```javascript
// Format detection
const format = TextureFormatDetector.detectFormat('path/to/texture.ktx');
console.log(format); // 'ktx'

// Check format support
const isSupported = TextureFormatDetector.isSupported(format);
console.log(isSupported); // true
```

## Texture Object Structure

Loaded textures return a comprehensive object:

```javascript
{
  image: HTMLImageElement,     // Image element
  width: 1024,                 // Texture width
  height: 1024,                // Texture height
  url: 'path/to/texture.jpg',  // Original URL
  format: 'jpeg',              // Detected format
  size: 524288,                // File size in bytes
  loaded: 1634567890123,       // Load timestamp
  source: 'blob',              // Source type
  flipY: true,                 // Flip Y configuration
  generateMipmaps: true,       // Mipmap generation
  magFilter: 'linear',         // Magnification filter
  minFilter: 'linearMipmapLinear', // Minification filter
  wrapS: 'repeat',             // S wrapping mode
  wrapT: 'repeat'              // T wrapping mode
}
```

## Performance Tips

### Cache Optimization

```javascript
// For applications with many textures
const loader = new TextureLoader({
  cacheSize: 500  // Larger cache for more textures
});

// For memory-constrained applications
const loader = new TextureLoader({
  cacheSize: 10   // Smaller cache
});
```

### Batch Loading

```javascript
// Good: Load related textures together
const textures = await loader.loadMultiple([
  'diffuse.jpg',
  'normal.jpg',
  'roughness.jpg'
]);

// Better: Use progress tracking for large batches
const textures = await loader.loadMultipleWithProgress(
  textures,
  {},
  (progress, completed, total) => {
    updateProgressBar(progress.percentage);
  }
);
```

### Memory Management

```javascript
// Unload unused textures
loader.unload('unused-texture.jpg');

// Clear cache when needed
loader.clearCache();

// Monitor cache size
setInterval(() => {
  const stats = loader.getCacheStats();
  if (stats.size > 100) {
    loader.clearCache(); // Prevent memory issues
  }
}, 60000); // Check every minute
```

## Integration with WebGL

The TextureLoader returns textures ready for WebGL use:

```javascript
import { TextureLoader } from './src/loaders/index.js';

const loader = new TextureLoader();
const texture = await loader.load('texture.jpg');

// Create WebGL texture
function createWebGLTexture(gl, textureData) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureData.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[textureData.wrapS.toUpperCase()]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[textureData.wrapT.toUpperCase()]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[textureData.minFilter.toUpperCase()]);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[textureData.magFilter.toUpperCase()]);
  
  if (textureData.generateMipmaps) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  
  return texture;
}
```

## Examples

See `TextureLoaderExample.js` for comprehensive usage examples including:

- Basic texture loading
- Progress tracking
- Multiple texture loading
- Caching demonstrations
- Format detection
- Error handling and retries
- Advanced configuration
- Performance monitoring
- Custom cache management
- Direct progress tracker usage

Run examples:
```javascript
import { runExamples } from './src/loaders/TextureLoaderExample.js';
runExamples();
```