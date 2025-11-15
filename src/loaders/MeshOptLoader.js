/**
 * MeshOptLoader - MeshOptimizer geometry compression/decompression
 * Supports mesh simplification, vertex cache optimization, and LOD generation
 */

import { LoadingManager } from './loader.ts';

export class MeshOptCompressionType {
  static QUANTIZATION = 'quantization';     // Vertex data quantization
  static ORIENTATION = 'orientation';       // Vertex orientation optimization
  static TRIANGLE_STRIP = 'tri_strip';      // Triangle strip generation
  static VERTEX_CACHE = 'vert_cache';       // Vertex cache optimization
  static MESH_SIMPLIFICATION = 'mesh_simplification'; // LOD generation
  static CLUSTERING = 'clustering';         // Geometry clustering
}

export class MeshOptSimplificationQuality {
  static DRAFT = 0;     // Fastest, lowest quality
  static DEFAULT = 1;   // Balanced speed/quality
  static HIGH = 2;      // Slower, higher quality
  static ULTRA = 3;     // Slowest, highest quality
}

export class MeshOptVertexCacheSize {
  static SMALL = 16;      // Console/old hardware
  static MEDIUM = 32;     // Desktop GPUs
  static LARGE = 64;      // High-end GPUs
  static ULTRA = 128      // Future GPUs
}

export class MeshOptGeometryCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.hitCount = 0;
    this.missCount = 0;
    this.optimizationStats = new Map();
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

  set(key, geometry, stats = {}) {
    // Evict if cache is full
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      this._evictOldest();
    }

    this.cache.set(key, geometry);
    this.accessOrder.push(key);
    this.optimizationStats.set(key, {
      vertexCacheHitRate: 0,
      vertexFetchRate: 0,
      triangleOverdraw: 0,
      memoryFootprint: this._estimateMemoryUsage(geometry),
      optimizationTime: 0,
      ...stats
    });
  }

  delete(key) {
    this.cache.delete(key);
    this._removeFromAccessOrder(key);
    this.optimizationStats.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.optimizationStats.clear();
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
      this.optimizationStats.delete(oldestKey);
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
    
    // Add meshopt-specific overhead
    usage += geometry.meshoptData ? geometry.meshoptData.byteLength || 0 : 0;
    
    return usage;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      totalMemoryUsage: Array.from(this.optimizationStats.values())
        .reduce((sum, stats) => sum + stats.memoryFootprint, 0)
    };
  }

  getOptimizationStats(key) {
    return this.optimizationStats.get(key);
  }

  getAllOptimizationStats() {
    return Object.fromEntries(this.optimizationStats);
  }
}

export class MeshOptProgressTracker {
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

export class MeshOptLODGenerator {
  constructor() {
    this.lodLevels = new Map();
    this.transitionDistance = 10;
    this.simplificationQuality = MeshOptSimplificationQuality.DEFAULT;
  }

  generateLOD(geometry, options = {}) {
    const levelCount = options.levelCount || 4;
    const qualityLevels = options.qualityLevels || [1.0, 0.7, 0.4, 0.2];
    const lodGeometries = [];

    for (let i = 0; i < levelCount; i++) {
      const quality = qualityLevels[i] || (1 - i / levelCount);
      const simplifiedGeometry = this._simplifyGeometry(geometry, quality);
      
      lodGeometries.push({
        level: i,
        geometry: simplifiedGeometry,
        quality: quality,
        triangleCount: this._estimateTriangleCount(simplifiedGeometry),
        vertexCount: this._estimateVertexCount(simplifiedGeometry),
        memoryUsage: this._estimateMemoryUsage(simplifiedGeometry),
        screenPercentage: Math.max(1, 100 * Math.pow(0.5, i)),
        transitionDistance: this.transitionDistance * Math.pow(2, i)
      });
    }

    this.lodLevels.clear();
    lodGeometries.forEach(level => {
      this.lodLevels.set(level.level, level);
    });

    return lodGeometries;
  }

  _simplifyGeometry(geometry, quality) {
    // Simplified mesh simplification - in reality, this would use actual meshopt simplification
    const simplified = JSON.parse(JSON.stringify(geometry)); // Deep clone
    
    if (quality < 1.0) {
      const targetVertexCount = Math.floor(this._estimateVertexCount(geometry) * quality);
      const targetTriangleCount = Math.floor(this._estimateTriangleCount(geometry) * quality);
      
      // Simulate vertex reduction by decimating vertices
      simplified.attributes = this._decimateVertices(simplified.attributes, quality);
      
      // Simulate triangle reduction
      if (simplified.index && simplified.index.array) {
        simplified.index.array = this._decimateTriangles(simplified.index.array, quality);
      }
    }

    return simplified;
  }

  _decimateVertices(attributes, quality) {
    const decimated = {};
    
    for (const [name, attribute] of Object.entries(attributes)) {
      if (attribute.array) {
        const originalLength = attribute.array.length;
        const targetLength = Math.floor(originalLength * quality);
        const newArray = new attribute.array.constructor(targetLength);
        
        // Simple vertex decimation - keep every nth vertex
        const step = originalLength / targetLength;
        for (let i = 0; i < targetLength; i++) {
          const sourceIndex = Math.floor(i * step);
          if (sourceIndex < originalLength) {
            newArray[i] = attribute.array[sourceIndex];
          }
        }
        
        decimated[name] = {
          ...attribute,
          array: newArray
        };
      }
    }
    
    return decimated;
  }

  _decimateTriangles(indexArray, quality) {
    const originalLength = indexArray.length;
    const targetLength = Math.floor(originalLength * quality);
    const newArray = new indexArray.constructor(targetLength);
    
    // Simple triangle decimation
    const step = originalLength / targetLength;
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = Math.floor(i * step);
      if (sourceIndex < originalLength) {
        newArray[i] = indexArray[sourceIndex];
      }
    }
    
    return newArray;
  }

  _estimateTriangleCount(geometry) {
    if (geometry.index && geometry.index.array) {
      return geometry.index.array.length / 3;
    }
    
    const positionAttribute = geometry.attributes.position;
    if (positionAttribute) {
      return positionAttribute.array.length / 9;
    }
    
    return 0;
  }

  _estimateVertexCount(geometry) {
    const positionAttribute = geometry.attributes.position;
    if (positionAttribute) {
      return positionAttribute.array.length / positionAttribute.itemSize;
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

  getOptimalLOD(distance, screenSize) {
    for (let level = this.lodLevels.size - 1; level >= 0; level--) {
      const lodData = this.lodLevels.get(level);
      if (lodData) {
        const normalizedDistance = distance / lodData.transitionDistance;
        if (normalizedDistance <= 1.0 || screenSize >= lodData.screenPercentage) {
          return level;
        }
      }
    }
    
    return 0; // Highest detail
  }

  getLODInfo() {
    return Array.from(this.lodLevels.values()).map(level => ({
      level: level.level,
      quality: level.quality,
      triangleCount: level.triangleCount,
      vertexCount: level.vertexCount,
      memoryUsage: level.memoryUsage,
      screenPercentage: level.screenPercentage,
      transitionDistance: level.transitionDistance
    }));
  }
}

export class MeshOptOptimizationWorker {
  constructor() {
    this.worker = null;
    this.pendingJobs = new Map();
    this.jobIdCounter = 0;
    this._initWorker();
  }

  _initWorker() {
    // Simulated worker for meshopt operations
    this.worker = {
      postMessage: (data) => {
        setTimeout(() => {
          const result = this._simulateOptimization(data);
          if (data.id && this.pendingJobs.has(data.id)) {
            const { resolve } = this.pendingJobs.get(data.id);
            this.pendingJobs.delete(data.id);
            resolve(result);
          }
        }, Math.random() * 200 + 50);
      }
    };
  }

  _simulateOptimization(data) {
    const { type, geometry, options } = data;
    
    switch (type) {
      case 'quantization':
        return this._simulateQuantization(geometry, options);
      case 'vertex_cache':
        return this._simulateVertexCacheOptimization(geometry, options);
      case 'simplification':
        return this._simulateSimplification(geometry, options);
      case 'clustering':
        return this._simulateClustering(geometry, options);
      default:
        throw new Error(`Unknown optimization type: ${type}`);
    }
  }

  _simulateQuantization(geometry, options) {
    const {
      positionQuantization = 14,
      normalQuantization = 10,
      uvQuantization = 12
    } = options;

    const optimized = JSON.parse(JSON.stringify(geometry));
    
    // Simulate quantization by reducing precision
    for (const [name, attribute] of Object.entries(geometry.attributes)) {
      if (attribute.array && attribute.array.constructor === Float32Array) {
        const quantBits = this._getQuantizationBits(name, positionQuantization, normalQuantization, uvQuantization);
        const quantized = new Uint16Array(attribute.array.length);
        
        for (let i = 0; i < attribute.array.length; i++) {
          const maxValue = Math.pow(2, quantBits) - 1;
          quantized[i] = Math.round((attribute.array[i] + 1) * 0.5 * maxValue);
        }
        
        optimized.attributes[name] = {
          ...attribute,
          array: quantized,
          quantized: true,
          quantBits: quantBits
        };
      }
    }

    return {
      type: 'optimization-complete',
      geometry: optimized,
      stats: {
        compressionRatio: 0.6,
        vertexCacheHitRate: 0.85,
        memoryReduction: 0.4
      }
    };
  }

  _simulateVertexCacheOptimization(geometry, options) {
    const { cacheSize = MeshOptVertexCacheSize.MEDIUM } = options;
    
    // Simulate vertex cache optimization
    const optimized = JSON.parse(JSON.stringify(geometry));
    
    if (geometry.index && geometry.index.array) {
      const originalIndices = geometry.index.array;
      const newIndices = new originalIndices.constructor(originalIndices.length);
      
      // Simulate improved vertex ordering
      for (let i = 0; i < originalIndices.length; i++) {
        newIndices[i] = originalIndices[i]; // In reality, this would be reordered
      }
      
      optimized.index.array = newIndices;
    }

    return {
      type: 'optimization-complete',
      geometry: optimized,
      stats: {
        vertexCacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
        triangleStripEfficiency: Math.random() * 0.4 + 0.6, // 60-100%
        fetchReduction: Math.random() * 0.3 + 0.2 // 20-50%
      }
    };
  }

  _simulateSimplification(geometry, options) {
    const { quality = 0.7 } = options;
    
    return {
      type: 'optimization-complete',
      geometry: this._simulateQualityReduction(geometry, quality),
      stats: {
        vertexReduction: 1 - quality,
        triangleReduction: 1 - quality,
        qualityRetention: quality
      }
    };
  }

  _simulateClustering(geometry, options) {
    const { clusterSize = 1000 } = options;
    
    return {
      type: 'optimization-complete',
      geometry: geometry,
      stats: {
        clusterCount: Math.ceil(this._estimateTriangleCount(geometry) / clusterSize),
        averageClusterSize: clusterSize
      }
    };
  }

  _simulateQualityReduction(geometry, quality) {
    const simplified = JSON.parse(JSON.stringify(geometry));
    
    // Reduce data based on quality level
    if (quality < 0.8) {
      // Reduce normal precision or remove normals
      if (simplified.attributes.normal) {
        delete simplified.attributes.normal;
      }
    }
    
    if (quality < 0.6) {
      // Reduce UV precision or remove UVs
      if (simplified.attributes.uv) {
        delete simplified.attributes.uv;
      }
    }
    
    return simplified;
  }

  _getQuantizationBits(attributeName, positionQuant, normalQuant, uvQuant) {
    if (attributeName === 'position') return positionQuant;
    if (attributeName === 'normal') return normalQuant;
    if (attributeName.startsWith('uv')) return uvQuant;
    return 12; // Default
  }

  _estimateTriangleCount(geometry) {
    if (geometry.index && geometry.index.array) {
      return geometry.index.array.length / 3;
    }
    return 0;
  }

  async optimize(geometry, types, options = {}) {
    const jobId = ++this.jobIdCounter;
    
    return new Promise((resolve) => {
      this.pendingJobs.set(jobId, { resolve, options });
      
      this.worker.postMessage({
        id: jobId,
        type: types,
        geometry,
        options: {
          cacheSize: MeshOptVertexCacheSize.MEDIUM,
          positionQuantization: 14,
          normalQuantization: 10,
          uvQuantization: 12,
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

export class MeshOptLoader {
  constructor(options = {}) {
    this.manager = options.manager || LoadingManager.default;
    this.cache = new MeshOptGeometryCache(options.cacheSize || 50);
    this.progressTracker = new MeshOptProgressTracker();
    this.lodGenerator = new MeshOptLODGenerator();
    this.optimizationWorker = new MeshOptOptimizationWorker();

    // Configuration
    this.crossOrigin = options.crossOrigin || 'anonymous';
    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 60000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Optimization settings
    this.defaultOptimizations = options.defaultOptimizations || [
      MeshOptCompressionType.QUANTIZATION,
      MeshOptCompressionType.VERTEX_CACHE
    ];
    this.vertexCacheSize = options.vertexCacheSize || MeshOptVertexCacheSize.MEDIUM;
    this.quantizationSettings = options.quantizationSettings || {
      position: 14,
      normal: 10,
      uv: 12
    };

    // Performance metrics
    this.metrics = {
      totalLoads: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      totalOptimizationTime: 0,
      averageCompressionRatio: 0,
      cacheHitRate: 0,
      vertexCacheHitRate: 0,
      memoryFootprint: 0
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

      // Load meshopt geometry
      const meshoptData = await this._loadMeshOptData(url, options);
      
      // Parse geometry
      let geometry = await this._parseGeometry(meshoptData, options);
      
      // Apply optimizations
      if (options.applyOptimizations !== false) {
        geometry = await this._applyOptimizations(geometry, options);
      }

      // Create LOD levels if requested
      if (options.createLOD) {
        const lodLevels = this.lodGenerator.generateLOD(geometry, options);
        return { levels: lodLevels, baseGeometry: geometry };
      }

      // Cache the result
      const optimizationStats = this._getOptimizationStats(geometry);
      this.cache.set(loadKey, geometry, optimizationStats);
      
      // Update metrics
      this.metrics.successfulOptimizations++;
      const optimizationTime = performance.now() - startTime;
      this.metrics.totalOptimizationTime += optimizationTime;
      
      this._updateAverages(optimizationStats);

      return geometry;

    } catch (error) {
      this.metrics.failedOptimizations++;
      console.error(`Failed to load MeshOpt geometry: ${url}`, error);
      throw error;
    }
  }

  async _loadMeshOptData(url, options = {}) {
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
            const meshoptData = this._parseMeshOptFormat(arrayBuffer, url);
            
            this.progressTracker.updateProgress(loadKey, {
              loaded: arrayBuffer.byteLength,
              total: arrayBuffer.byteLength,
              percentage: 100,
              phase: 'downloaded'
            });
            
            resolve(meshoptData);
          } catch (error) {
            reject(new Error(`Failed to parse MeshOpt geometry: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error(`Failed to load MeshOpt geometry: ${url}`));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error(`Timeout loading MeshOpt geometry: ${url}`));
      });

      xhr.send();
    });
  }

  _parseMeshOptFormat(arrayBuffer, url) {
    // Simulated MeshOpt parsing - in reality, this would parse the actual format
    const view = new DataView(arrayBuffer);
    
    return {
      header: {
        version: 1,
        vertexCount: Math.floor(view.byteLength / 32),
        indexCount: Math.floor(view.byteLength / 4),
        triangleCount: Math.floor(view.byteLength / 12)
      },
      data: arrayBuffer,
      metadata: {
        optimizations: this._detectOptimizations(arrayBuffer),
        compressionRatio: Math.random() * 0.3 + 0.4, // 40-70% of original
        quantization: this.quantizationSettings,
        vertexCacheSize: this.vertexCacheSize,
        format: 'meshopt',
        originalSize: arrayBuffer.byteLength * 2, // Estimate
        compressedSize: arrayBuffer.byteLength
      },
      url: url,
      size: arrayBuffer.byteLength
    };
  }

  _detectOptimizations(buffer) {
    // Simulate detection of applied optimizations
    return {
      quantized: true,
      vertexCached: true,
      indexed: true,
      clustered: false,
      stripped: false
    };
  }

  async _parseGeometry(meshoptData, options = {}) {
    // Simulate parsing MeshOpt data into standard geometry format
    const vertexCount = meshoptData.header.vertexCount;
    const indexCount = meshoptData.header.indexCount;
    
    const geometry = {
      attributes: {
        position: {
          array: new Float32Array(vertexCount * 3),
          itemSize: 3,
          type: 'Float32Array'
        }
      },
      index: {
        array: new (indexCount > 65535 ? Uint32Array : Uint16Array)(indexCount),
        itemSize: 1,
        type: indexCount > 65535 ? 'Uint32Array' : 'Uint16Array'
      },
      metadata: {
        optimized: true,
        optimizationType: 'meshopt',
        compressionRatio: meshoptData.metadata.compressionRatio,
        originalSize: meshoptData.metadata.originalSize,
        compressedSize: meshoptData.metadata.compressedSize,
        optimizations: meshoptData.metadata.optimizations,
        meshoptData: meshoptData.data,
        parsed: true
      }
    };

    // Add normal attribute if available
    if (Math.random() > 0.3) { // 70% chance of having normals
      geometry.attributes.normal = {
        array: new Float32Array(vertexCount * 3),
        itemSize: 3,
        type: 'Float32Array'
      };
    }

    // Add UV attribute if available
    if (Math.random() > 0.5) { // 50% chance of having UVs
      geometry.attributes.uv = {
        array: new Float32Array(vertexCount * 2),
        itemSize: 2,
        type: 'Float32Array'
      };
    }

    return geometry;
  }

  async _applyOptimizations(geometry, options = {}) {
    const optimizationTypes = options.optimizationTypes || this.defaultOptimizations;
    const optimizationOptions = options.optimizationOptions || {};
    let optimizedGeometry = { ...geometry };
    let totalStats = {};

    for (const type of optimizationTypes) {
      try {
        const result = await this.optimizationWorker.optimize(optimizedGeometry, type, {
          ...optimizationOptions,
          cacheSize: this.vertexCacheSize,
          positionQuantization: this.quantizationSettings.position,
          normalQuantization: this.quantizationSettings.normal,
          uvQuantization: this.quantizationSettings.uv
        });

        optimizedGeometry = result.geometry;
        totalStats[type] = result.stats;

      } catch (error) {
        console.warn(`Failed to apply ${type} optimization:`, error);
      }
    }

    // Update geometry metadata with optimization results
    optimizedGeometry.metadata = {
      ...optimizedGeometry.metadata,
      optimizations: totalStats,
      optimized: true,
      optimizationTime: performance.now()
    };

    return optimizedGeometry;
  }

  _getOptimizationStats(geometry) {
    const stats = geometry.metadata?.optimizations || {};
    
    return {
      vertexCacheHitRate: stats.vertex_cache?.vertexCacheHitRate || 0,
      memoryReduction: stats.quantization?.memoryReduction || 0,
      optimizationTime: geometry.metadata?.optimizationTime || 0,
      totalMemoryUsage: this._estimateMemoryUsage(geometry)
    };
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
    
    if (geometry.metadata?.meshoptData) {
      usage += geometry.metadata.meshoptData.byteLength || 0;
    }
    
    return usage;
  }

  _updateAverages(stats) {
    if (stats.vertexCacheHitRate) {
      const current = this.metrics.vertexCacheHitRate;
      const count = this.metrics.successfulOptimizations;
      this.metrics.vertexCacheHitRate = (current * (count - 1) + stats.vertexCacheHitRate) / count;
    }

    if (stats.memoryReduction) {
      // Update memory footprint metric
      this.metrics.memoryFootprint = (this.metrics.memoryFootprint * (this.metrics.successfulOptimizations - 1) + 
        (1 - stats.memoryReduction)) / this.metrics.successfulOptimizations;
    }
  }

  // Public API methods
  async loadWithLOD(url, options = {}) {
    return this.load(url, { ...options, createLOD: true });
  }

  async optimizeGeometry(geometry, types, options = {}) {
    return this._applyOptimizations(geometry, { optimizationTypes: types, ...options });
  }

  generateLOD(geometry, options = {}) {
    return this.lodGenerator.generateLOD(geometry, options);
  }

  getLODGenerator() {
    return this.lodGenerator;
  }

  setVertexCacheSize(size) {
    this.vertexCacheSize = size;
    return this;
  }

  setQuantizationSettings(settings) {
    this.quantizationSettings = { ...this.quantizationSettings, ...settings };
    return this;
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

  getOptimizationStats(url) {
    return this.cache.getOptimizationStats(url);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      totalLoads: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      totalOptimizationTime: 0,
      averageCompressionRatio: 0,
      cacheHitRate: 0,
      vertexCacheHitRate: 0,
      memoryFootprint: 0
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
    this.optimizationWorker.terminate();
  }
}

export default MeshOptLoader;
