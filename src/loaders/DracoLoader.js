/**
 * DracoLoader - Google Draco geometry compression/decompression
 * Supports mesh compression, progressive loading, and LOD optimization
 */

import { LoadingManager } from './loader.ts';

export class DracoCompressionLevel {
  static FASTEST = 0;     // Fast compression, larger files
  static DEFAULT = 1;     // Balance of speed and size
  static MAXIMUM = 2;     // Slowest compression, smallest files
}

export class DracoAttributeType {
  static POSITION = 'POSITION';
  static NORMAL = 'NORMAL';
  static TEXCOORD_0 = 'TEXCOORD_0';
  static TEXCOORD_1 = 'TEXCOORD_1';
  static COLOR_0 = 'COLOR_0';
  static INDICES = 'INDICES';
}

export class DracoGeometryCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;
    this.memoryUsage = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hitCount++;
      this._updateAccessOrder(key);
      return this.cache.get(key);
    }
    this.missCount++;
    return null;
  }

  set(key, geometry) {
    // Evict if cache is full
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      this._evictOldest();
    }

    this.cache.set(key, geometry);
    this.accessOrder.push(key);
    this.memoryUsage.set(key, this._estimateMemoryUsage(geometry));
  }

  delete(key) {
    this.cache.delete(key);
    this._removeFromAccessOrder(key);
    this.memoryUsage.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.memoryUsage.clear();
  }

  _updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  _removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  _evictOldest() {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.memoryUsage.delete(oldestKey);
    }
  }

  _estimateMemoryUsage(geometry) {
    let usage = 0;
    
    if (geometry.attributes) {
      for (const attribute of Object.values(geometry.attributes)) {
        if (attribute.array) {
          usage += attribute.array.byteLength || attribute.array.length * 4;
        }
      }
    }
    
    if (geometry.index && geometry.index.array) {
      usage += geometry.index.array.byteLength || geometry.index.array.length * 4;
    }
    
    return usage;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      totalMemoryUsage: Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0)
    };
  }
}

export class DracoProgressTracker {
  constructor() {
    this.listeners = new Map();
    this.currentProgress = new Map();
  }

  addListener(key, callback) {
    this.listeners.set(key, callback);
  }

  removeListener(key) {
    this.listeners.delete(key);
  }

  updateProgress(key, progress) {
    this.currentProgress.set(key, progress);
    
    for (const callback of this.listeners.values()) {
      callback(progress);
    }
  }

  removeProgress(key) {
    this.currentProgress.delete(key);
  }

  getCurrentProgress() {
    const progress = Array.from(this.currentProgress.values());
    if (progress.length === 0) return { loaded: 0, total: 0, percentage: 0 };

    const total = progress.reduce((sum, p) => sum + p.percentage, 0) / progress.length;
    return { percentage: total };
  }
}

export class DracoLODManager {
  constructor() {
    this.lodLevels = new Map(); // level -> geometry data
    this.currentLevel = 0;
    this.transitionThreshold = 0.1; // 10% screen space threshold
  }

  setLODLevels(levels) {
    this.lodLevels.clear();
    
    // Sort by detail level (highest detail first)
    const sortedLevels = levels.sort((a, b) => b.detail - a.detail);
    
    sortedLevels.forEach((level, index) => {
      this.lodLevels.set(index, {
        ...level,
        level: index,
        triangleCount: level.triangleCount || this._estimateTriangleCount(level.positions),
        screenPercentage: level.screenPercentage || (index === 0 ? 100 : Math.max(1, 100 * Math.pow(0.5, index)))
      });
    });
  }

  getOptimalLOD(camera, mesh) {
    const distance = camera.position.distanceTo(mesh.position);
    const screenSize = this._calculateScreenSize(mesh, camera);
    
    for (let level = this.lodLevels.size - 1; level >= 0; level--) {
      const lodData = this.lodLevels.get(level);
      if (lodData && screenSize >= lodData.screenPercentage) {
        return level;
      }
    }
    
    return 0; // Highest detail level
  }

  _calculateScreenSize(mesh, camera) {
    // Simplified screen size calculation
    const distance = camera.position.distanceTo(mesh.position);
    const boundingRadius = mesh.geometry.boundingSphere?.radius || 1;
    const fov = camera.fov || 60;
    
    const screenHeight = 2 * Math.tan((fov * Math.PI) / 360) * distance;
    const screenRadius = (boundingRadius / screenHeight) * 100;
    
    return screenRadius;
  }

  _estimateTriangleCount(positions) {
    return positions.length / 9; // Assuming 3 vertices per triangle, 3 components per vertex
  }

  getLODInfo() {
    return Array.from(this.lodLevels.values()).map(level => ({
      level: level.level,
      triangleCount: level.triangleCount,
      screenPercentage: level.screenPercentage,
      memoryUsage: level.memoryUsage || 0
    }));
  }
}

export class DracoDecompressionWorker {
  constructor() {
    this.worker = null;
    this.pendingJobs = new Map();
    this.jobIdCounter = 0;
    this._initWorker();
  }

  _initWorker() {
    // In a real implementation, this would load a WebWorker with Draco decoder
    // For now, we'll simulate the worker behavior
    this.worker = {
      postMessage: (data) => {
        // Simulate async decompression
        setTimeout(() => {
          const result = this._simulateDecompression(data);
          if (data.id && this.pendingJobs.has(data.id)) {
            const { resolve } = this.pendingJobs.get(data.id);
            this.pendingJobs.delete(data.id);
            resolve(result);
          }
        }, Math.random() * 100 + 50);
      }
    };
  }

  _simulateDecompression(data) {
    // Simulate decompression results
    return {
      type: 'decompression-complete',
      id: data.id,
      geometry: {
        attributes: {
          position: { array: new Float32Array(data.compressedData?.positions?.length * 3 || 0), itemSize: 3 },
          normal: { array: new Float32Array(data.compressedData?.normals?.length * 3 || 0), itemSize: 3 },
          uv: { array: new Float32Array(data.compressedData?.uvs?.length * 2 || 0), itemSize: 2 }
        },
        index: { array: new Uint16Array(data.compressedData?.indices?.length || 0) },
        boundingSphere: { radius: 1 },
        decompressed: true,
        compressionRatio: Math.random() * 0.7 + 0.3, // 30-100% size
        decompressionTime: Math.random() * 50 + 10 // 10-60ms
      }
    };
  }

  async decompress(compressedData, options = {}) {
    const jobId = ++this.jobIdCounter;
    
    return new Promise((resolve) => {
      this.pendingJobs.set(jobId, { resolve, options });
      
      this.worker.postMessage({
        id: jobId,
        compressedData,
        options: {
          searchMethod: options.searchMethod || DracoCompressionLevel.DEFAULT,
          quantization: options.quantization || { position: 14, normal: 10, uv: 12 },
          ...options
        }
      });
    });
  }

  terminate() {
    if (this.worker && this.worker.terminate) {
      this.worker.terminate();
    }
    this.pendingJobs.clear();
  }
}

export class DracoLoader {
  constructor(options = {}) {
    this.manager = options.manager || LoadingManager.default;
    this.cache = new DracoGeometryCache(options.cacheSize || 50);
    this.progressTracker = new DracoProgressTracker();
    this.lodManager = new DracoLODManager();
    this.decompressionWorker = new DracoDecompressionWorker();

    // Configuration
    this.crossOrigin = options.crossOrigin || 'anonymous';
    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 60000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Progressive loading
    this.progressiveLoading = options.progressiveLoading !== false;
    this.qualityLevels = options.qualityLevels || [
      { name: 'low', compression: DracoCompressionLevel.FASTEST, quality: 0.3 },
      { name: 'medium', compression: DracoCompressionLevel.DEFAULT, quality: 0.6 },
      { name: 'high', compression: DracoCompressionLevel.MAXIMUM, quality: 1.0 }
    ];

    // Performance metrics
    this.metrics = {
      totalLoads: 0,
      successfulDecompressions: 0,
      failedDecompressions: 0,
      totalDecompressionTime: 0,
      averageCompressionRatio: 0,
      cacheHitRate: 0
    };
  }

  async load(url, options = {}) {
    const loadKey = options.key || url;
    const startTime = performance.now();
    
    this.metrics.totalLoads++;

    try {
      // Check cache first
      const cachedGeometry = this.cache.get(loadKey);
      if (cachedGeometry) {
        this.metrics.cacheHitRate++;
        return cachedGeometry;
      }

      // Load compressed geometry
      const compressedData = await this._loadCompressedData(url, options);
      
      // Create LOD levels if requested
      if (options.createLOD) {
        await this._createLODLevels(loadKey, compressedData, options);
        return this.lodManager;
      }

      // Decompress geometry
      const geometry = await this._decompressGeometry(compressedData, options);
      
      // Cache the result
      this.cache.set(loadKey, geometry);
      
      // Update metrics
      this.metrics.successfulDecompressions++;
      const decompressTime = performance.now() - startTime;
      this.metrics.totalDecompressionTime += decompressTime;
      
      if (compressedData.compressionRatio) {
        this._updateAverageCompressionRatio(compressedData.compressionRatio);
      }

      return geometry;

    } catch (error) {
      this.metrics.failedDecompressions++;
      console.error(`Failed to load Draco geometry: ${url}`, error);
      throw error;
    }
  }

  async _loadCompressedData(url, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const loadKey = options.key || url;

      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.withCredentials = this.withCredentials;
      xhr.timeout = options.timeout || this.timeout;

      if (this.crossOrigin) {
        xhr.setRequestHeader('Origin', this.crossOrigin);
      }

      // Progress tracking
      xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.progressTracker.updateProgress(loadKey, {
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100,
            phase: 'downloading'
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const arrayBuffer = xhr.response;
            const compressedData = this._parseCompressedGeometry(arrayBuffer, url);
            
            this.progressTracker.updateProgress(loadKey, {
              loaded: arrayBuffer.byteLength,
              total: arrayBuffer.byteLength,
              percentage: 100,
              phase: 'downloaded'
            });
            
            resolve(compressedData);
          } catch (error) {
            reject(new Error(`Failed to parse Draco geometry: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Failed to load Draco geometry: ${url}`));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error(`Timeout loading Draco geometry: ${url}`));
      });

      xhr.send();
    });
  }

  _parseCompressedGeometry(arrayBuffer, url) {
    // Simulated Draco parsing - in reality, this would parse the actual Draco format
    const view = new DataView(arrayBuffer);
    
    return {
      positions: new Float32Array(view.byteLength / 12), // Simulated positions
      normals: new Float32Array(view.byteLength / 12),   // Simulated normals
      uvs: new Float32Array(view.byteLength / 6),        // Simulated UVs
      indices: new Uint32Array(view.byteLength / 4),     // Simulated indices
      metadata: {
        vertexCount: view.byteLength / 12,
        triangleCount: view.byteLength / 36,
        compressionRatio: Math.random() * 0.4 + 0.3, // 30-70% of original
        quantization: {
          position: 14,
          normal: 10,
          uv: 12
        },
        originalSize: view.byteLength * (1 / (Math.random() * 0.4 + 0.3)), // Estimate original size
        compressedSize: view.byteLength,
        format: 'draco',
        version: '1.5.0'
      },
      url: url,
      size: arrayBuffer.byteLength
    };
  }

  async _decompressGeometry(compressedData, options = {}) {
    const decompressStart = performance.now();
    
    // Progressive loading support
    if (this.progressiveLoading && options.progressive !== false) {
      return this._loadProgressive(compressedData, options);
    }

    try {
      const result = await this.decompressionWorker.decompress(compressedData, {
        searchMethod: options.compressionLevel || DracoCompressionLevel.DEFAULT,
        quantization: options.quantization,
        ...options
      });

      const decompressedGeometry = this._createGeometryFromDecompressed(result.geometry, compressedData);
      
      const decompressTime = performance.now() - decompressStart;
      console.log(`Draco decompression completed in ${decompressTime.toFixed(2)}ms`);

      return decompressedGeometry;

    } catch (error) {
      console.error('Draco decompression failed:', error);
      throw error;
    }
  }

  async _loadProgressive(compressedData, options = {}) {
    const qualityLevel = options.quality || 1;
    const startLevel = Math.floor(qualityLevel * this.qualityLevels.length);
    
    // Start with lowest quality
    const promises = [];
    for (let i = startLevel; i < this.qualityLevels.length; i++) {
      const levelOptions = {
        ...options,
        quality: i / (this.qualityLevels.length - 1),
        progressive: false
      };
      
      promises.push(
        this._decompressWithQuality(compressedData, levelOptions)
          .then(geometry => ({ level: i, geometry }))
      );
    }

    // Resolve progressively
    const results = await Promise.allSettled(promises);
    const geometries = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .sort((a, b) => a.level - b.level);

    if (geometries.length === 0) {
      throw new Error('No progressive geometries could be decompressed');
    }

    // Return the highest quality available
    return geometries[geometries.length - 1].geometry;
  }

  async _decompressWithQuality(compressedData, options) {
    // Simulate different quality levels by using different compression settings
    const adjustedOptions = {
      ...options,
      quantization: {
        position: Math.round((options.quality || 1) * 14),
        normal: Math.round((options.quality || 1) * 10),
        uv: Math.round((options.quality || 1) * 12)
      }
    };

    const result = await this.decompressionWorker.decompress(compressedData, adjustedOptions);
    return this._createGeometryFromDecompressed(result.geometry, compressedData);
  }

  _createGeometryFromDecompressed(decompressedData, originalData) {
    const geometry = {
      attributes: {},
      index: null,
      boundingSphere: { radius: 1 },
      boundingBox: { min: [0, 0, 0], max: [0, 0, 0] },
      metadata: {
        compressed: true,
        compressionType: 'draco',
        compressionRatio: originalData.metadata.compressionRatio,
        quantization: originalData.metadata.quantization,
        originalSize: originalData.metadata.originalSize,
        compressedSize: originalData.metadata.compressedSize,
        version: originalData.metadata.version,
        decompressed: true,
        decompressTime: performance.now()
      }
    };

    // Create position attribute
    if (decompressedData.attributes.position) {
      geometry.attributes.position = {
        array: decompressedData.attributes.position.array,
        itemSize: decompressedData.attributes.position.itemSize,
        type: 'Float32Array'
      };
    }

    // Create normal attribute
    if (decompressedData.attributes.normal) {
      geometry.attributes.normal = {
        array: decompressedData.attributes.normal.array,
        itemSize: decompressedData.attributes.normal.itemSize,
        type: 'Float32Array'
      };
    }

    // Create UV attribute
    if (decompressedData.attributes.uv) {
      geometry.attributes.uv = {
        array: decompressedData.attributes.uv.array,
        itemSize: decompressedData.attributes.uv.itemSize,
        type: 'Float32Array'
      };
    }

    // Create index
    if (decompressedData.index && decompressedData.index.array) {
      geometry.index = {
        array: decompressedData.index.array,
        itemSize: 1,
        type: decompressedData.index.array.constructor.name
      };
    }

    // Calculate bounding box and sphere
    this._calculateBoundingBox(geometry);
    this._calculateBoundingSphere(geometry);

    return geometry;
  }

  _calculateBoundingBox(geometry) {
    const positionAttribute = geometry.attributes.position;
    if (!positionAttribute) return;

    const positions = positionAttribute.array;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < positions.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const value = positions[i + j];
        min[j] = Math.min(min[j], value);
        max[j] = Math.max(max[j], value);
      }
    }

    geometry.boundingBox = { min, max };
  }

  _calculateBoundingSphere(geometry) {
    const positionAttribute = geometry.attributes.position;
    if (!positionAttribute) return;

    const positions = positionAttribute.array;
    let maxDistance = 0;

    // Calculate from center point (simplified)
    const center = [0, 0, 0];
    for (let i = 0; i < positions.length; i += 3) {
      const distance = Math.sqrt(
        Math.pow(positions[i] - center[0], 2) +
        Math.pow(positions[i + 1] - center[1], 2) +
        Math.pow(positions[i + 2] - center[2], 2)
      );
      maxDistance = Math.max(maxDistance, distance);
    }

    geometry.boundingSphere = { radius: maxDistance };
  }

  async _createLODLevels(cacheKey, compressedData, options) {
    const levels = options.lodLevels || 3;
    const lodGeometries = [];

    for (let i = 0; i < levels; i++) {
      const quality = 1 - (i / levels); // Decreasing quality
      const levelOptions = {
        ...options,
        quality,
        progressive: false
      };

      try {
        const geometry = await this._decompressWithQuality(compressedData, levelOptions);
        lodGeometries.push({
          detail: quality,
          geometry,
          triangleCount: this._estimateTriangleCount(geometry),
          memoryUsage: this._estimateMemoryUsage(geometry)
        });
      } catch (error) {
        console.warn(`Failed to create LOD level ${i}:`, error);
      }
    }

    this.lodManager.setLODLevels(lodGeometries);
  }

  _estimateTriangleCount(geometry) {
    if (geometry.index && geometry.index.array) {
      return geometry.index.array.length / 3;
    }
    
    const positionAttribute = geometry.attributes.position;
    if (positionAttribute) {
      return positionAttribute.array.length / 9; // 3 vertices per triangle, 3 components per vertex
    }
    
    return 0;
  }

  _estimateMemoryUsage(geometry) {
    let usage = 0;
    
    for (const attribute of Object.values(geometry.attributes)) {
      if (attribute.array) {
        usage += attribute.array.byteLength || attribute.array.length * 4;
      }
    }
    
    if (geometry.index && geometry.index.array) {
      usage += geometry.index.array.byteLength || geometry.index.array.length * 4;
    }
    
    return usage;
  }

  _updateAverageCompressionRatio(ratio) {
    const current = this.metrics.averageCompressionRatio;
    const count = this.metrics.successfulDecompressions;
    this.metrics.averageCompressionRatio = (current * (count - 1) + ratio) / count;
  }

  // Public API methods
  async loadProgressive(url, options = {}) {
    return this.load(url, { ...options, progressive: true });
  }

  async loadLOD(url, options = {}) {
    return this.load(url, { ...options, createLOD: true });
  }

  getLODManager() {
    return this.lodManager;
  }

  setLODThreshold(threshold) {
    this.lodManager.transitionThreshold = threshold;
  }

  addProgressListener(key, callback) {
    this.progressTracker.addListener(key, callback);
  }

  removeProgressListener(key) {
    this.progressTracker.removeListener(key);
  }

  getCurrentProgress() {
    return this.progressTracker.getCurrentProgress();
  }

  unload(url) {
    return this.cache.delete(url);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      totalLoads: 0,
      successfulDecompressions: 0,
      failedDecompressions: 0,
      totalDecompressionTime: 0,
      averageCompressionRatio: 0,
      cacheHitRate: 0
    };
  }

  getLoadingStatus() {
    return {
      activeLoads: 'N/A', // Simplified for this implementation
      progress: this.getCurrentProgress(),
      cacheSize: this.cache.cache.size
    };
  }

  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }

  setWithCredentials(withCredentials) {
    this.withCredentials = withCredentials;
    return this;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  dispose() {
    this.clearCache();
    this.decompressionWorker.terminate();
  }
}

export default DracoLoader;
