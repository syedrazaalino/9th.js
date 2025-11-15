/**
 * Advanced TextureLoader with comprehensive caching, progress tracking, and error handling
 * Supports multiple texture formats, cross-origin loading, and retry mechanisms
 */

import { LoadingManager } from './loader.ts';

export class TextureCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get texture from cache
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached texture or null
   */
  get(key) {
    if (this.cache.has(key)) {
      this.hitCount++;
      // Update access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    this.missCount++;
    return null;
  }

  /**
   * Set texture in cache
   * @param {string} key - Cache key
   * @param {Object} texture - Texture object
   */
  set(key, texture) {
    // Evict oldest items if cache is full
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, texture);
    this.accessOrder.push(key);
  }

  /**
   * Remove texture from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder.length = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  /**
   * Get all cached texture keys
   * @returns {Array} - Array of cached keys
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }
}

export class TextureFormatDetector {
  /**
   * Detect texture format from URL and response headers
   * @param {string} url - Texture URL
   * @param {string} contentType - HTTP Content-Type header
   * @returns {string} - Detected format
   */
  static detectFormat(url, contentType = '') {
    // Try to detect from URL extension first
    const extension = url.split('.').pop().toLowerCase();
    
    const formatMap = {
      'jpg': 'jpeg',
      'jpeg': 'jpeg', 
      'png': 'png',
      'gif': 'gif',
      'webp': 'webp',
      'bmp': 'bmp',
      'tiff': 'tiff',
      'tga': 'tga',
      'dds': 'dds',
      'ktx': 'ktx',
      'pvr': 'pvr',
      'astc': 'astc',
      'basis': 'basis'
    };

    if (formatMap[extension]) {
      return formatMap[extension];
    }

    // Fallback to Content-Type header
    if (contentType) {
      const type = contentType.split('/')[1] || '';
      return formatMap[type.toLowerCase()] || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Get supported texture formats
   * @returns {Array} - List of supported formats
   */
  static getSupportedFormats() {
    return [
      'jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tga', 
      'dds', 'ktx', 'pvr', 'astc', 'basis'
    ];
  }

  /**
   * Check if format is supported
   * @param {string} format - Texture format
   * @returns {boolean} - True if supported
   */
  static isSupported(format) {
    return this.getSupportedFormats().includes(format.toLowerCase());
  }
}

export class TextureLoaderProgress {
  constructor() {
    this.listeners = new Map();
    this.currentProgress = new Map();
    this.totalBytes = 0;
    this.loadedBytes = 0;
  }

  /**
   * Add progress listener
   * @param {string} key - Progress key
   * @param {Function} callback - Progress callback
   */
  addListener(key, callback) {
    this.listeners.set(key, callback);
  }

  /**
   * Remove progress listener
   * @param {string} key - Progress key
   */
  removeListener(key) {
    this.listeners.delete(key);
  }

  /**
   * Update progress for specific load
   * @param {string} key - Load key
   * @param {Object} progress - Progress data
   */
  updateProgress(key, progress) {
    this.currentProgress.set(key, progress);
    
    // Calculate global progress
    let totalProgress = { loaded: 0, total: 0, percentage: 0 };
    
    if (this.currentProgress.size > 0) {
      let loaded = 0;
      let total = 0;
      
      for (const p of this.currentProgress.values()) {
        loaded += p.loaded;
        total += p.total;
      }
      
      totalProgress = {
        loaded,
        total,
        percentage: total > 0 ? (loaded / total) * 100 : 0
      };
    }

    // Notify all listeners
    for (const callback of this.listeners.values()) {
      callback(totalProgress);
    }
  }

  /**
   * Remove completed load from tracking
   * @param {string} key - Load key
   */
  removeProgress(key) {
    this.currentProgress.delete(key);
  }

  /**
   * Get current global progress
   * @returns {Object} - Global progress data
   */
  getCurrentProgress() {
    let loaded = 0;
    let total = 0;
    
    for (const progress of this.currentProgress.values()) {
      loaded += progress.loaded;
      total += progress.total;
    }
    
    return {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0
    };
  }
}

export class TextureLoader {
  constructor(options = {}) {
    this.manager = options.manager || LoadingManager.default;
    this.cache = new TextureCache(options.cacheSize || 100);
    this.progressTracker = new TextureLoaderProgress();
    
    // Configuration
    this.crossOrigin = options.crossOrigin || 'anonymous';
    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Loading state
    this.activeLoads = new Map();
    this.loadQueue = [];
    this.isProcessingQueue = false;

    // Error handling
    this.retryQueue = new Map();
    this.failedLoads = new Set();

    // Performance monitoring
    this.performanceMetrics = {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Load texture with comprehensive error handling and retry mechanism
   * @param {string} url - Texture URL
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to texture
   */
  async load(url, options = {}) {
    const loadKey = options.key || url;
    const startTime = performance.now();
    
    this.performanceMetrics.totalLoads++;

    try {
      // Check cache first
      const cachedTexture = this.cache.get(loadKey);
      if (cachedTexture) {
        this.performanceMetrics.cacheHitRate++;
        return cachedTexture;
      }

      // Handle duplicate loads
      if (this.activeLoads.has(loadKey)) {
        return await this.activeLoads.get(loadKey);
      }

      // Create promise for this load
      const loadPromise = this._performLoad(url, options);
      this.activeLoads.set(loadKey, loadPromise);

      const texture = await loadPromise;

      // Cache the result
      this.cache.set(loadKey, texture);
      
      // Update metrics
      this.performanceMetrics.successfulLoads++;
      const loadTime = performance.now() - startTime;
      this._updateAverageLoadTime(loadTime);

      return texture;

    } catch (error) {
      this.performanceMetrics.failedLoads++;
      this.failedLoads.add(loadKey);
      
      console.error(`Failed to load texture: ${url}`, error);
      throw error;
    } finally {
      this.activeLoads.delete(loadKey);
    }
  }

  /**
   * Perform the actual texture loading
   * @param {string} url - Texture URL
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to texture
   * @private
   */
  async _performLoad(url, options = {}) {
    let retries = options.retries || 0;
    const loadKey = options.key || url;

    try {
      return await this._loadTextureWithProgress(url, options);

    } catch (error) {
      if (retries < this.maxRetries && !this._isPermanentError(error)) {
        // Add to retry queue
        await this._wait(this.retryDelay * Math.pow(2, retries));
        return this._performLoad(url, { ...options, retries: retries + 1 });
      }

      throw error;
    }
  }

  /**
   * Load texture with progress tracking
   * @param {string} url - Texture URL
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to texture
   * @private
   */
  async _loadTextureWithProgress(url, options = {}) {
    return new Promise((resolve, reject) => {
      const loadKey = options.key || url;
      const xhr = new XMLHttpRequest();

      // Configure request
      xhr.open('GET', this._resolveUrl(url), true);
      xhr.responseType = 'blob';
      xhr.withCredentials = this.withCredentials;
      xhr.timeout = options.timeout || this.timeout;

      if (this.crossOrigin) {
        xhr.setRequestHeader('Origin', this.crossOrigin);
      }

      // Progress tracking
      xhr.addEventListener('loadstart', () => {
        this.progressTracker.updateProgress(loadKey, { loaded: 0, total: 0, percentage: 0 });
      });

      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.progressTracker.updateProgress(loadKey, {
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100
          });
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const blob = xhr.response;
            const texture = await this._processTextureBlob(blob, url, options);
            this.progressTracker.removeProgress(loadKey);
            resolve(texture);
          } catch (error) {
            this.progressTracker.removeProgress(loadKey);
            reject(error);
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        this.progressTracker.removeProgress(loadKey);
        reject(new Error(`Failed to load texture: ${url}`));
      });

      xhr.addEventListener('timeout', () => {
        this.progressTracker.removeProgress(loadKey);
        reject(new Error(`Timeout loading texture: ${url}`));
      });

      xhr.send();
    });
  }

  /**
   * Process loaded texture blob into usable texture object
   * @param {Blob} blob - Texture blob
   * @param {string} url - Original URL
   * @param {Object} options - Processing options
   * @returns {Promise} - Promise resolving to texture object
   * @private
   */
  async _processTextureBlob(blob, url, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Cross-origin setup
      if (this.crossOrigin) {
        img.crossOrigin = this.crossOrigin;
      }

      img.onload = () => {
        const texture = {
          image: img,
          width: img.width,
          height: img.height,
          url: url,
          format: TextureFormatDetector.detectFormat(url, blob.type),
          size: blob.size,
          loaded: Date.now(),
          source: 'blob',
          flipY: options.flipY !== undefined ? options.flipY : true,
          generateMipmaps: options.generateMipmaps !== undefined ? options.generateMipmaps : true,
          magFilter: options.magFilter || 'linear',
          minFilter: options.minFilter || 'linearMipmapLinear',
          wrapS: options.wrapS || 'repeat',
          wrapT: options.wrapT || 'repeat'
        };

        resolve(texture);
      };

      img.onerror = () => {
        reject(new Error(`Failed to decode texture: ${url}`));
      };

      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Check if error is permanent (shouldn't be retried)
   * @param {Error} error - Error object
   * @returns {boolean} - True if error is permanent
   * @private
   */
  _isPermanentError(error) {
    const permanentErrors = [
      404, // Not Found
      403, // Forbidden
      401, // Unauthorized
      415, // Unsupported Media Type
      500  // Internal Server Error
    ];

    const statusMatch = error.message.match(/HTTP (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return permanentErrors.includes(status);
    }

    return false;
  }

  /**
   * Wait for specified duration
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} - Promise that resolves after delay
   * @private
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Resolve URL with base path if needed
   * @param {string} url - Input URL
   * @returns {string} - Resolved URL
   * @private
   */
  _resolveUrl(url) {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // Simple path resolution - in a real implementation, 
    // this might need more sophisticated handling
    return url;
  }

  /**
   * Load multiple textures in parallel
   * @param {Array} urls - Array of texture URLs
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to array of textures
   */
  async loadMultiple(urls, options = {}) {
    const promises = urls.map(url => this.load(url, options));
    return Promise.all(promises);
  }

  /**
   * Load multiple textures with progress tracking
   * @param {Array} urls - Array of texture URLs
   * @param {Object} options - Loading options
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - Promise resolving to array of textures
   */
  async loadMultipleWithProgress(urls, options = {}, onProgress) {
    const results = [];
    let completed = 0;

    const progressListener = (progress) => {
      if (onProgress) {
        onProgress(progress, completed, urls.length);
      }
    };

    this.progressTracker.addListener('multiple', progressListener);

    try {
      for (const url of urls) {
        try {
          const texture = await this.load(url, options);
          results.push(texture);
        } catch (error) {
          results.push(null); // or throw error, depending on desired behavior
        }
        completed++;
      }

      return results;
    } finally {
      this.progressTracker.removeListener('multiple');
    }
  }

  /**
   * Preload textures
   * @param {Array} urls - Array of texture URLs to preload
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise that resolves when all textures are loaded
   */
  async preload(urls, options = {}) {
    return this.loadMultiple(urls, options);
  }

  /**
   * Unload texture from cache
   * @param {string} url - Texture URL
   * @returns {boolean} - True if texture was unloaded
   */
  unload(url) {
    return this.cache.delete(url);
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get all cached texture keys
   * @returns {Array} - Array of cached texture URLs
   */
  getCachedKeys() {
    return this.cache.getKeys();
  }

  /**
   * Check if texture is in cache
   * @param {string} url - Texture URL
   * @returns {boolean} - True if texture is cached
   */
  isCached(url) {
    return this.cache.get(url) !== null;
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Update average load time
   * @param {number} loadTime - Load time in milliseconds
   * @private
   */
  _updateAverageLoadTime(loadTime) {
    const total = this.performanceMetrics.successfulLoads;
    const current = this.performanceMetrics.averageLoadTime;
    this.performanceMetrics.averageLoadTime = (current * (total - 1) + loadTime) / total;
  }

  /**
   * Set cross-origin policy
   * @param {string} crossOrigin - Cross-origin policy
   * @returns {this} - Chainable
   */
  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }

  /**
   * Set withCredentials flag
   * @param {boolean} withCredentials - With credentials flag
   * @returns {this} - Chainable
   */
  setWithCredentials(withCredentials) {
    this.withCredentials = withCredentials;
    return this;
  }

  /**
   * Set request timeout
   * @param {number} timeout - Timeout in milliseconds
   * @returns {this} - Chainable
   */
  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  /**
   * Set maximum retry attempts
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {this} - Chainable
   */
  setMaxRetries(maxRetries) {
    this.maxRetries = maxRetries;
    return this;
  }

  /**
   * Set retry delay
   * @param {number} retryDelay - Retry delay in milliseconds
   * @returns {this} - Chainable
   */
  setRetryDelay(retryDelay) {
    this.retryDelay = retryDelay;
    return this;
  }

  /**
   * Set cache size
   * @param {number} cacheSize - Maximum cache size
   * @returns {this} - Chainable
   */
  setCacheSize(cacheSize) {
    this.cache = new TextureCache(cacheSize);
    return this;
  }

  /**
   * Add progress listener
   * @param {string} key - Listener key
   * @param {Function} callback - Progress callback
   */
  addProgressListener(key, callback) {
    this.progressTracker.addListener(key, callback);
  }

  /**
   * Remove progress listener
   * @param {string} key - Listener key
   */
  removeProgressListener(key) {
    this.progressTracker.removeListener(key);
  }

  /**
   * Get current loading status
   * @returns {Object} - Loading status
   */
  getLoadingStatus() {
    return {
      activeLoads: this.activeLoads.size,
      failedLoads: this.failedLoads.size,
      progress: this.progressTracker.getCurrentProgress(),
      cacheSize: this.cache.cache.size
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0,
      cacheHitRate: 0
    };
  }
}

// Export default instance
export default new TextureLoader();
