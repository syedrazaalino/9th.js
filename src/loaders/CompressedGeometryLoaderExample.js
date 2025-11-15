/**
 * CompressedGeometryLoaderExample.js
 * Demonstrates DracoLoader and MeshOptLoader usage with LOD, progressive loading, and optimization
 */

import { DracoLoader } from './DracoLoader.js';
import { MeshOptLoader } from './MeshOptLoader.js';

export class CompressedGeometryDemo {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.dracoLoader = new DracoLoader();
    this.meshOptLoader = new MeshOptLoader();
    
    // Demo options
    this.options = {
      enableLOD: options.enableLOD !== false,
      enableProgressive: options.enableProgressive !== false,
      enableOptimization: options.enableOptimization !== false,
      showStats: options.showStats !== false,
      ...options
    };

    // Scene state
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentModel = null;
    this.lodSystems = new Map();
    
    // Performance monitoring
    this.performance = {
      dracoMetrics: null,
      meshOptMetrics: null,
      renderStats: {
        fps: 0,
        frameTime: 0,
        drawCalls: 0
      }
    };
  }

  async initialize() {
    console.log('Initializing CompressedGeometryDemo...');
    
    // Initialize loaders with advanced options
    this._configureLoaders();
    
    // Initialize rendering context (simplified)
    this._initializeRenderer();
    
    // Set up performance monitoring
    if (this.options.showStats) {
      this._setupPerformanceMonitoring();
    }

    console.log('CompressedGeometryDemo initialized successfully');
  }

  _configureLoaders() {
    // Configure DracoLoader
    this.dracoLoader
      .setCrossOrigin('anonymous')
      .setTimeout(60000)
      .setMaxRetries(3);

    // Add progress tracking for Draco
    this.dracoLoader.addProgressListener('demo', (progress) => {
      if (this.options.showStats) {
        console.log(`Draco Loading Progress: ${progress.percentage.toFixed(1)}% - ${progress.phase}`);
      }
    });

    // Configure MeshOptLoader
    this.meshOptLoader
      .setCrossOrigin('anonymous')
      .setTimeout(60000)
      .setMaxRetries(3)
      .setVertexCacheSize(32) // Desktop GPU optimization
      .setQuantizationSettings({
        position: 14,
        normal: 10,
        uv: 12
      });

    // Add progress tracking for MeshOpt
    this.meshOptLoader.addProgressListener('demo', (progress) => {
      if (this.options.showStats) {
        console.log(`MeshOpt Loading Progress: ${progress.percentage.toFixed(1)}% - ${progress.phase}`);
      }
    });
  }

  _initializeRenderer() {
    // Simplified renderer initialization
    this.renderer = {
      context: this.canvas.getContext('webgl2') || this.canvas.getContext('webgl'),
      clear: () => {
        // Mock clear function
      },
      render: (scene, camera) => {
        // Mock render function
      }
    };
  }

  _setupPerformanceMonitoring() {
    setInterval(() => {
      this._updatePerformanceStats();
    }, 1000);
  }

  _updatePerformanceStats() {
    // Get metrics from both loaders
    this.performance.dracoMetrics = this.dracoLoader.getMetrics();
    this.performance.meshOptMetrics = this.meshOptLoader.getMetrics();

    if (this.options.showStats) {
      this._displayPerformanceStats();
    }
  }

  _displayPerformanceStats() {
    console.log('=== Performance Stats ===');
    
    if (this.performance.dracoMetrics) {
      console.log('Draco Loader:', {
        totalLoads: this.performance.dracoMetrics.totalLoads,
        successfulDecompressions: this.performance.dracoMetrics.successfulDecompressions,
        averageCompressionRatio: (this.performance.dracoMetrics.averageCompressionRatio * 100).toFixed(1) + '%',
        averageDecompressionTime: this.performance.dracoMetrics.averageDecompressionTime?.toFixed(2) + 'ms',
        cacheHitRate: (this.performance.dracoMetrics.cacheHitRate * 100).toFixed(1) + '%'
      });
    }

    if (this.performance.meshOptMetrics) {
      console.log('MeshOpt Loader:', {
        totalLoads: this.performance.meshOptMetrics.totalLoads,
        successfulOptimizations: this.performance.meshOptMetrics.successfulOptimizations,
        vertexCacheHitRate: (this.performance.meshOptMetrics.vertexCacheHitRate * 100).toFixed(1) + '%',
        averageOptimizationTime: this.performance.meshOptMetrics.averageOptimizationTime?.toFixed(2) + 'ms',
        cacheHitRate: (this.performance.meshOptMetrics.cacheHitRate * 100).toFixed(1) + '%'
      });
    }

    console.log('Cache Stats:', {
      draco: this.dracoLoader.getCacheStats(),
      meshOpt: this.meshOptLoader.getCacheStats()
    });
  }

  async loadDracoModel(url, options = {}) {
    console.log(`Loading Draco model: ${url}`);
    
    const loaderOptions = {
      progressiveLoading: this.options.enableProgressive,
      compressionLevel: 1, // Default compression
      quantization: {
        position: 14,
        normal: 10,
        uv: 12
      },
      ...options
    };

    try {
      let result;
      
      if (this.options.enableLOD && options.createLOD) {
        // Load with LOD support
        console.log('Loading Draco model with LOD...');
        result = await this.dracoLoader.loadLOD(url, loaderOptions);
        this._setupDracoLOD(result);
      } else {
        // Regular load
        console.log('Loading Draco model (standard)...');
        result = await this.dracoLoader.loadProgressive(url, loaderOptions);
      }

      this.currentModel = {
        type: 'draco',
        geometry: result.levels ? result.baseGeometry : result,
        lodSystem: result.levels ? result : null,
        url: url
      };

      console.log('Draco model loaded successfully');
      return this.currentModel;

    } catch (error) {
      console.error('Failed to load Draco model:', error);
      throw error;
    }
  }

  async loadMeshOptModel(url, options = {}) {
    console.log(`Loading MeshOpt model: ${url}`);
    
    const loaderOptions = {
      applyOptimizations: this.options.enableOptimization,
      optimizationTypes: [
        'quantization',
        'vert_cache'
      ],
      quantizationSettings: {
        position: 14,
        normal: 10,
        uv: 12
      },
      vertexCacheSize: 32,
      ...options
    };

    try {
      let result;
      
      if (this.options.enableLOD && options.createLOD) {
        // Load with LOD support
        console.log('Loading MeshOpt model with LOD...');
        result = await this.meshOptLoader.loadWithLOD(url, loaderOptions);
        this._setupMeshOptLOD(result);
      } else {
        // Load and optimize
        console.log('Loading and optimizing MeshOpt model...');
        result = await this.meshOptLoader.load(url, loaderOptions);
      }

      this.currentModel = {
        type: 'meshopt',
        geometry: result.levels ? result.baseGeometry : result,
        lodSystem: result.levels ? result : null,
        url: url
      };

      console.log('MeshOpt model loaded successfully');
      return this.currentModel;

    } catch (error) {
      console.error('Failed to load MeshOpt model:', error);
      throw error;
    }
  }

  _setupDracoLOD(lodSystem) {
    console.log('Setting up Draco LOD system...');
    
    if (lodSystem && lodSystem.levels) {
      this.lodSystems.set('draco', lodSystem);
      
      const lodInfo = lodSystem.levels.map(level => ({
        level: level.level,
        detail: level.detail,
        triangleCount: level.triangleCount,
        screenPercentage: level.screenPercentage,
        memoryUsage: level.memoryUsage
      }));
      
      console.log('Draco LOD Levels:', lodInfo);
    }
  }

  _setupMeshOptLOD(lodSystem) {
    console.log('Setting up MeshOpt LOD system...');
    
    if (lodSystem && lodSystem.levels) {
      this.lodSystems.set('meshopt', lodSystem);
      
      const lodInfo = lodSystem.levels.map(level => ({
        level: level.level,
        quality: level.quality,
        triangleCount: level.triangleCount,
        vertexCount: level.vertexCount,
        screenPercentage: level.screenPercentage,
        memoryUsage: level.memoryUsage
      }));
      
      console.log('MeshOpt LOD Levels:', lodInfo);
    }
  }

  async loadModelComparison(url, options = {}) {
    console.log(`=== Loading model comparison: ${url} ===`);
    
    const results = {};
    
    // Load with Draco
    try {
      console.time('DracoLoad');
      results.draco = await this.loadDracoModel(url, {
        ...options,
        type: 'draco'
      });
      console.timeEnd('DracoLoad');
    } catch (error) {
      console.error('Draco load failed:', error);
      results.draco = { error: error.message };
    }

    // Load with MeshOpt
    try {
      console.time('MeshOptLoad');
      results.meshopt = await this.loadMeshOptModel(url, {
        ...options,
        type: 'meshopt'
      });
      console.timeEnd('MeshOptLoad');
    } catch (error) {
      console.error('MeshOpt load failed:', error);
      results.meshopt = { error: error.message };
    }

    // Compare results
    this._compareLoadResults(results);
    
    return results;
  }

  _compareLoadResults(results) {
    console.log('=== Load Performance Comparison ===');
    
    if (results.draco && !results.draco.error) {
      const dracoStats = this.dracoLoader.getCacheStats();
      console.log('Draco Results:', {
        cacheHit: dracoStats.hitRate > 0,
        compressionRatio: results.draco.geometry?.metadata?.compressionRatio || 'N/A',
        fileSize: results.draco.geometry?.metadata?.compressedSize || 'N/A'
      });
    }
    
    if (results.meshopt && !results.meshopt.error) {
      const meshOptStats = this.meshOptLoader.getCacheStats();
      console.log('MeshOpt Results:', {
        cacheHit: meshOptStats.hitRate > 0,
        optimizationStats: this.meshOptLoader.getOptimizationStats(results.meshopt.url),
        fileSize: results.meshopt.geometry?.metadata?.compressedSize || 'N/A'
      });
    }
  }

  async optimizeExistingGeometry(geometry, types = null) {
    console.log('Optimizing existing geometry...');
    
    const defaultTypes = [
      'quantization',
      'vert_cache'
    ];
    
    const optimizationTypes = types || defaultTypes;
    
    try {
      const optimized = await this.meshOptLoader.optimizeGeometry(
        geometry, 
        optimizationTypes,
        {
          quality: 0.8,
          positionQuantization: 14,
          normalQuantization: 10,
          uvQuantization: 12
        }
      );
      
      console.log('Geometry optimization completed');
      return optimized;
      
    } catch (error) {
      console.error('Geometry optimization failed:', error);
      throw error;
    }
  }

  async generateLODForGeometry(geometry, options = {}) {
    console.log('Generating LOD for geometry...');
    
    const defaultOptions = {
      levelCount: 4,
      qualityLevels: [1.0, 0.7, 0.4, 0.2],
      transitionDistance: 10
    };
    
    const lodOptions = { ...defaultOptions, ...options };
    
    try {
      const lodLevels = this.meshOptLoader.generateLOD(geometry, lodOptions);
      
      console.log('LOD generation completed:', {
        levelCount: lodLevels.length,
        levels: lodLevels.map(level => ({
          level: level.level,
          quality: level.quality,
          triangleCount: level.triangleCount,
          memoryUsage: level.memoryUsage
        }))
      });
      
      return lodLevels;
      
    } catch (error) {
      console.error('LOD generation failed:', error);
      throw error;
    }
  }

  updateLOD(camera) {
    if (!this.currentModel || !this.lodSystems.has(this.currentModel.type)) {
      return;
    }

    const lodSystem = this.lodSystems.get(this.currentModel.type);
    
    if (lodSystem && lodSystem.getOptimalLOD) {
      const distance = this._calculateCameraDistance(camera);
      const optimalLOD = lodSystem.getOptimalLOD(distance, 100); // Mock screen size
      
      if (this.currentModel.lodSystem) {
        // Switch to optimal LOD level
        this._switchToLODLevel(optimalLOD);
      }
    }
  }

  _calculateCameraDistance(camera) {
    // Simplified distance calculation
    return camera?.position?.distanceTo?.({ x: 0, y: 0, z: 0 }) || 10;
  }

  _switchToLODLevel(level) {
    if (this.currentModel.lodSystem && this.currentModel.lodSystem.levels) {
      const lodGeometry = this.currentModel.lodSystem.levels[level];
      if (lodGeometry) {
        console.log(`Switching to LOD level ${level}, triangles: ${lodGeometry.triangleCount || lodGeometry.triangleCount}`);
        // In a real implementation, this would update the rendered geometry
        this.currentModel.currentLOD = level;
      }
    }
  }

  // Utility methods
  getDracoMetrics() {
    return this.dracoLoader.getMetrics();
  }

  getMeshOptMetrics() {
    return this.meshOptLoader.getMetrics();
  }

  getCacheStats() {
    return {
      draco: this.dracoLoader.getCacheStats(),
      meshopt: this.meshOptLoader.getCacheStats()
    };
  }

  clearCaches() {
    this.dracoLoader.clearCache();
    this.meshOptLoader.clearCache();
    console.log('All caches cleared');
  }

  unloadCurrentModel() {
    if (this.currentModel) {
      if (this.currentModel.url) {
        this.dracoLoader.unload(this.currentModel.url);
        this.meshOptLoader.unload(this.currentModel.url);
      }
      this.currentModel = null;
      this.lodSystems.clear();
      console.log('Current model unloaded');
    }
  }

  dispose() {
    this.unloadCurrentModel();
    this.dracoLoader.dispose();
    this.meshOptLoader.dispose();
    console.log('CompressedGeometryDemo disposed');
  }

  // Demonstration methods for testing
  static async runBasicDemo() {
    console.log('=== Basic CompressedGeometryDemo ===');
    
    const demo = new CompressedGeometryDemo({
      showStats: true,
      enableLOD: true,
      enableProgressive: true,
      enableOptimization: true
    });
    
    await demo.initialize();
    
    // Example usage patterns
    console.log('\n1. Loading Draco model with progressive loading...');
    // const dracoModel = await demo.loadDracoModel('models/chair-draco.drc', {
    //   progressive: true,
    //   createLOD: true
    // });
    
    console.log('\n2. Loading MeshOpt model with optimizations...');
    // const meshOptModel = await demo.loadMeshOptModel('models/chair.meshopt', {
    //   applyOptimizations: true,
    //   optimizationTypes: ['quantization', 'vert_cache'],
    //   createLOD: true
    // });
    
    console.log('\n3. Comparing load performance...');
    // const comparison = await demo.loadModelComparison('models/house.glb', {
    //   createLOD: true
    // });
    
    console.log('\n4. Generating LOD for existing geometry...');
    // const sampleGeometry = createSampleGeometry();
    // const lodLevels = await demo.generateLODForGeometry(sampleGeometry);
    
    console.log('\nDemo completed!');
    
    return demo;
  }

  static async runPerformanceDemo() {
    console.log('=== Performance Testing Demo ===');
    
    const demo = new CompressedGeometryDemo({
      showStats: true
    });
    
    await demo.initialize();
    
    // Load multiple models to test cache performance
    const models = [
      'models/model1.drc',
      'models/model2.meshopt',
      'models/model3.drc'
    ];
    
    console.log('\nTesting cache performance...');
    
    // First load (cache misses)
    for (const modelUrl of models) {
      try {
        console.log(`\nLoading: ${modelUrl}`);
        await demo.loadDracoModel(modelUrl);
        await demo.loadMeshOptModel(modelUrl);
      } catch (error) {
        console.log(`Failed to load ${modelUrl}:`, error.message);
      }
    }
    
    // Second load (cache hits)
    console.log('\nReloading same models (cache hits expected)...');
    for (const modelUrl of models) {
      try {
        console.log(`\nReloading: ${modelUrl}`);
        await demo.loadDracoModel(modelUrl);
        await demo.loadMeshOptModel(modelUrl);
      } catch (error) {
        console.log(`Failed to reload ${modelUrl}:`, error.message);
      }
    }
    
    // Display final statistics
    console.log('\n=== Final Performance Statistics ===');
    console.log('Cache Stats:', demo.getCacheStats());
    console.log('Draco Metrics:', demo.getDracoMetrics());
    console.log('MeshOpt Metrics:', demo.getMeshOptMetrics());
    
    return demo;
  }
}

// Helper function to create sample geometry for testing
function createSampleGeometry() {
  return {
    attributes: {
      position: {
        array: new Float32Array([
          0, 0, 0,  1, 0, 0,  0, 1, 0,
          1, 0, 0,  1, 1, 0,  0, 1, 0,
          0, 0, 1,  1, 0, 1,  0, 1, 1,
          1, 0, 1,  1, 1, 1,  0, 1, 1
        ]),
        itemSize: 3,
        type: 'Float32Array'
      },
      normal: {
        array: new Float32Array([
          0, 0, -1,  0, 0, -1,  0, 0, -1,
          0, 0, -1,  0, 0, -1,  0, 0, -1,
          0, 0, 1,   0, 0, 1,   0, 0, 1,
          0, 0, 1,   0, 0, 1,   0, 0, 1
        ]),
        itemSize: 3,
        type: 'Float32Array'
      },
      uv: {
        array: new Float32Array([
          0, 0,  1, 0,  0, 1,
          1, 0,  1, 1,  0, 1,
          0, 0,  1, 0,  0, 1,
          1, 0,  1, 1,  0, 1
        ]),
        itemSize: 2,
        type: 'Float32Array'
      }
    },
    index: {
      array: new Uint16Array([
        0, 1, 2,  3, 4, 5,
        6, 7, 8,  9, 10, 11
      ]),
      itemSize: 1,
      type: 'Uint16Array'
    },
    metadata: {
      vertexCount: 8,
      triangleCount: 4
    }
  };
}

export default CompressedGeometryDemo;
