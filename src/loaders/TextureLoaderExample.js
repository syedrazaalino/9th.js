/**
 * TextureLoader Example
 * Demonstrates usage of the advanced TextureLoader with caching, progress tracking, and error handling
 */

import TextureLoader, { TextureCache, TextureFormatDetector, TextureLoaderProgress } from './TextureLoader.js';

// Example 1: Basic texture loading
async function basicExample() {
  console.log('=== Basic Texture Loading Example ===');
  
  const loader = new TextureLoader({
    crossOrigin: 'anonymous',
    timeout: 10000,
    maxRetries: 3
  });

  try {
    const texture = await loader.load('https://example.com/texture.jpg');
    console.log('Loaded texture:', texture);
    console.log('Texture format:', texture.format);
    console.log('Texture dimensions:', texture.width, 'x', texture.height);
  } catch (error) {
    console.error('Failed to load texture:', error);
  }
}

// Example 2: Loading with progress tracking
async function progressExample() {
  console.log('=== Progress Tracking Example ===');
  
  const loader = new TextureLoader();
  
  // Add progress listener
  loader.addProgressListener('main', (progress) => {
    console.log(`Progress: ${progress.percentage.toFixed(1)}% (${progress.loaded}/${progress.total} bytes)`);
  });

  try {
    const texture = await loader.load('https://example.com/large-texture.png');
    console.log('Texture loaded successfully!');
  } catch (error) {
    console.error('Failed to load texture:', error);
  }
}

// Example 3: Multiple texture loading
async function multipleExample() {
  console.log('=== Multiple Texture Loading Example ===');
  
  const loader = new TextureLoader();
  
  const textureUrls = [
    'https://example.com/texture1.jpg',
    'https://example.com/texture2.png',
    'https://example.com/texture3.webp'
  ];

  try {
    const textures = await loader.loadMultipleWithProgress(
      textureUrls,
      {},
      (progress, completed, total) => {
        console.log(`Batch progress: ${((completed / total) * 100).toFixed(1)}% (${completed}/${total} completed)`);
      }
    );
    
    console.log('All textures loaded:', textures.length);
    
    // Show cache statistics
    const cacheStats = loader.getCacheStats();
    console.log('Cache stats:', cacheStats);
    
  } catch (error) {
    console.error('Failed to load textures:', error);
  }
}

// Example 4: Caching demonstration
async function cachingExample() {
  console.log('=== Caching Example ===');
  
  const loader = new TextureLoader({ cacheSize: 2 });
  
  const url = 'https://example.com/texture.jpg';
  
  // First load (will download from network)
  console.log('First load (from network)...');
  const start1 = performance.now();
  const texture1 = await loader.load(url);
  const time1 = performance.now() - start1;
  console.log(`Loaded in ${time1.toFixed(2)}ms`);
  
  // Second load (should be from cache)
  console.log('Second load (from cache)...');
  const start2 = performance.now();
  const texture2 = await loader.load(url);
  const time2 = performance.now() - start2;
  console.log(`Loaded in ${time2.toFixed(2)}ms`);
  
  console.log('Cache hit rate:', loader.getCacheStats().hitRate);
}

// Example 5: Format detection
function formatDetectionExample() {
  console.log('=== Format Detection Example ===');
  
  const urls = [
    'path/to/image.jpg',
    'https://example.com/texture.png',
    'data:image/jpeg;base64,...',
    'models/model.ktx',
    'textures/basis.basis'
  ];
  
  urls.forEach(url => {
    const format = TextureFormatDetector.detectFormat(url);
    const supported = TextureFormatDetector.isSupported(format);
    console.log(`${url} -> ${format} (${supported ? 'supported' : 'unsupported'})`);
  });
}

// Example 6: Error handling and retries
async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  const loader = new TextureLoader({
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 5000
  });

  // This URL doesn't exist, will trigger retry mechanism
  try {
    await loader.load('https://example.com/nonexistent.jpg');
  } catch (error) {
    console.log('Expected error (URL does not exist):', error.message);
    
    // Check performance metrics
    const metrics = loader.getPerformanceMetrics();
    console.log('Performance metrics:', metrics);
  }
}

// Example 7: Advanced configuration
async function advancedConfigExample() {
  console.log('=== Advanced Configuration Example ===');
  
  const loader = new TextureLoader({
    crossOrigin: 'anonymous',
    withCredentials: false,
    timeout: 15000,
    maxRetries: 5,
    retryDelay: 2000,
    cacheSize: 50
  });

  // Chain configuration methods
  loader
    .setCrossOrigin('anonymous')
    .setWithCredentials(false)
    .setTimeout(15000)
    .setMaxRetries(5)
    .setRetryDelay(2000)
    .setCacheSize(50);

  try {
    const texture = await loader.load('https://example.com/advanced-texture.jpg', {
      flipY: false,
      generateMipmaps: true,
      magFilter: 'nearest',
      minFilter: 'nearest'
    });
    
    console.log('Advanced texture configuration loaded:', texture);
    
  } catch (error) {
    console.error('Failed to load texture:', error);
  }
}

// Example 8: Performance monitoring
async function performanceExample() {
  console.log('=== Performance Monitoring Example ===');
  
  const loader = new TextureLoader();
  
  // Add progress tracking
  loader.addProgressListener('performance', (progress) => {
    if (progress.total > 1000000) { // Only log for large files
      console.log(`Large file progress: ${progress.percentage.toFixed(1)}%`);
    }
  });

  // Load some test textures
  const testUrls = [
    'https://example.com/texture1.jpg',
    'https://example.com/texture2.png'
  ];

  await loader.loadMultiple(testUrls);
  
  // Get performance metrics
  const metrics = loader.getPerformanceMetrics();
  console.log('Performance metrics:', metrics);
  
  // Get cache statistics
  const cacheStats = loader.getCacheStats();
  console.log('Cache statistics:', cacheStats);
  
  // Get loading status
  const status = loader.getLoadingStatus();
  console.log('Loading status:', status);
  
  // Reset metrics for fresh start
  loader.resetMetrics();
  console.log('Metrics reset');
}

// Example 9: Custom cache management
function customCacheExample() {
  console.log('=== Custom Cache Management Example ===');
  
  // Create custom texture cache with smaller size
  const customCache = new TextureCache(5);
  
  const loader = new TextureLoader();
  loader.cache = customCache;
  
  console.log('Custom cache created with size:', customCache.maxSize);
  
  // Later you can get cache statistics
  setTimeout(() => {
    const stats = loader.getCacheStats();
    console.log('Custom cache stats:', stats);
  }, 1000);
}

// Example 10: TextureLoaderProgress tracker usage
function progressTrackerExample() {
  console.log('=== Direct Progress Tracker Usage Example ===');
  
  const progressTracker = new TextureLoaderProgress();
  
  // Add listener
  progressTracker.addListener('demo', (progress) => {
    console.log(`Direct tracker: ${progress.percentage.toFixed(1)}% (${progress.loaded}/${progress.total})`);
  });
  
  // Simulate progress updates
  progressTracker.updateProgress('file1', { loaded: 500, total: 1000, percentage: 50 });
  progressTracker.updateProgress('file2', { loaded: 300, total: 600, percentage: 50 });
  
  const globalProgress = progressTracker.getCurrentProgress();
  console.log('Global progress:', globalProgress);
  
  // Clean up
  progressTracker.removeProgress('file1');
  progressTracker.removeProgress('file2');
  progressTracker.removeListener('demo');
}

// Run examples
async function runExamples() {
  try {
    // Uncomment the examples you want to run
    // await basicExample();
    // await progressExample();
    // await multipleExample();
    // await cachingExample();
    // formatDetectionExample();
    // await errorHandlingExample();
    // await advancedConfigExample();
    // await performanceExample();
    // customCacheExample();
    // progressTrackerExample();
    
    console.log('All examples completed!');
    
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Export examples for use in other modules
export {
  basicExample,
  progressExample,
  multipleExample,
  cachingExample,
  formatDetectionExample,
  errorHandlingExample,
  advancedConfigExample,
  performanceExample,
  customCacheExample,
  progressTrackerExample,
  runExamples
};

// Run examples if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runExamples();
}
