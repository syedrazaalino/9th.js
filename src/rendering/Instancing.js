/**
 * Instancing.js - Advanced GPU Instancing and Batch Rendering System
 * 
 * Features:
 * - GPU instancing support for thousands of objects
 * - Automatic draw call batching
 * - LOD instancing system
 * - Performance profiling for batched rendering
 * - Hardware instancing optimizations
 * - Batch rendering optimizations
 */

import { BufferGeometry, Buffer, VertexBuffer, IndexBuffer } from '../core/BufferGeometry.js';
import { Matrix4, Vector3, Quaternion } from '../core/math/index.js';

/**
 * Instance data structure containing transformation and per-instance attributes
 */
export class InstanceData {
  constructor(position = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1]) {
    this.position = position; // [x, y, z]
    this.rotation = rotation; // [x, y, z, w] quaternion
    this.scale = scale; // [x, y, z]
    this.customAttributes = {}; // Additional per-instance data
    
    // Pre-calculated world matrix for performance
    this.worldMatrix = new Matrix4();
    this._dirty = true;
  }

  /**
   * Update the world matrix from position, rotation, scale
   */
  updateMatrix() {
    if (!this._dirty) return;
    
    this.worldMatrix.identity();
    this.worldMatrix.translate(this.position[0], this.position[1], this.position[2]);
    this.worldMatrix.multiply(Matrix4.fromQuat(this.rotation));
    this.worldMatrix.scale(this.scale[0], this.scale[1], this.scale[2]);
    this._dirty = false;
  }

  /**
   * Set position
   */
  setPosition(x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirty = true;
  }

  /**
   * Set rotation (quaternion)
   */
  setRotation(x, y, z, w) {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
    this.rotation[3] = w;
    this._dirty = true;
  }

  /**
   * Set scale
   */
  setScale(x, y, z) {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
    this._dirty = true;
  }

  /**
   * Set custom attribute
   */
  setCustomAttribute(name, value) {
    this.customAttributes[name] = value;
  }

  /**
   * Get custom attribute
   */
  getCustomAttribute(name) {
    return this.customAttributes[name];
  }
}

/**
 * Level of Detail (LOD) instancing level
 */
export class LODInstancingLevel {
  constructor(distance, instanceCount = 0, geometry = null) {
    this.distance = distance;
    this.instanceCount = instanceCount;
    this.geometry = geometry;
    this.startIndex = 0; // Start index in the instance buffer
    this.endIndex = 0;   // End index in the instance buffer
    
    // Performance optimization flags
    this.isActive = true;
    this.needsUpdate = false;
  }
}

/**
 * Instance renderer for handling GPU instancing
 */
export class InstanceRenderer {
  constructor(gl, maxInstances = 10000) {
    this.gl = gl;
    this.maxInstances = maxInstances;
    this.currentInstanceCount = 0;
    
    // Instance data
    this.instanceData = new Array(maxInstances);
    this.activeInstances = new Set();
    this.lodLevels = [];
    
    // GPU buffers
    this.instanceBuffer = null;
    this.matrixBuffer = null;
    this.customAttributeBuffers = new Map();
    
    // Performance tracking
    this.renderStats = {
      batches: 0,
      drawCalls: 0,
      instances: 0,
      triangles: 0,
      lodSwitches: 0,
      bufferUpdates: 0,
      gpuTime: 0
    };

    // Initialization
    this._initBuffers();
  }

  /**
   * Initialize GPU buffers for instancing
   * @private
   */
  _initBuffers() {
    // Instance transform buffer (matrices: 16 floats per instance)
    this.instanceBuffer = new VertexBuffer(this.gl, 16 * this.maxInstances, 
      WebGLRenderingContext.DYNAMIC_DRAW);
    
    // Custom attribute buffers will be created as needed
  }

  /**
   * Add a new instance
   * @param {InstanceData} instanceData - Instance data
   * @returns {number} Instance ID
   */
  addInstance(instanceData) {
    if (this.currentInstanceCount >= this.maxInstances) {
      console.warn(`Maximum instances (${this.maxInstances}) reached`);
      return -1;
    }

    const instanceId = this.currentInstanceCount;
    this.instanceData[instanceId] = instanceData;
    this.activeInstances.add(instanceId);
    this.currentInstanceCount++;

    // Update LOD levels if needed
    this._updateLODLevels();

    return instanceId;
  }

  /**
   * Remove an instance
   * @param {number} instanceId - Instance ID to remove
   */
  removeInstance(instanceId) {
    if (!this.activeInstances.has(instanceId)) {
      return;
    }

    // Mark instance as inactive by swapping with last active
    const lastInstance = this.currentInstanceCount - 1;
    
    if (instanceId !== lastInstance) {
      // Swap instance data
      this.instanceData[instanceId] = this.instanceData[lastInstance];
      this.instanceData[lastInstance] = null;
      
      // Update instance ID mapping if needed
      this._updateInstanceIdMapping(instanceId, lastInstance);
    }

    this.activeInstances.delete(instanceId);
    this.instanceData[lastInstance] = null;
    this.currentInstanceCount--;
  }

  /**
   * Update instance data
   * @param {number} instanceId - Instance ID
   * @param {InstanceData} instanceData - New instance data
   */
  updateInstance(instanceId, instanceData) {
    if (!this.activeInstances.has(instanceId)) {
      return;
    }

    this.instanceData[instanceId] = instanceData;
    
    // Mark LOD levels as needing update
    this.lodLevels.forEach(level => level.needsUpdate = true);
  }

  /**
   * Get instance data
   * @param {number} instanceId - Instance ID
   * @returns {InstanceData|null} Instance data or null
   */
  getInstance(instanceId) {
    return this.activeInstances.has(instanceId) ? this.instanceData[instanceId] : null;
  }

  /**
   * Add LOD level
   * @param {LODInstancingLevel} lodLevel - LOD level to add
   */
  addLODLevel(lodLevel) {
    this.lodLevels.push(lodLevel);
    this.lodLevels.sort((a, b) => a.distance - b.distance);
    this._updateLODLevels();
  }

  /**
   * Update LOD levels based on camera position
   * @param {Vector3} cameraPosition - Camera position
   */
  updateLOD(cameraPosition) {
    let lodChanged = false;
    
    for (const level of this.lodLevels) {
      const previousActive = level.isActive;
      const newActive = this._isLevelActive(level, cameraPosition);
      
      if (previousActive !== newActive) {
        level.isActive = newActive;
        lodChanged = true;
        this.renderStats.lodSwitches++;
      }
    }

    if (lodChanged) {
      this._updateLODLevels();
    }
  }

  /**
   * Check if LOD level should be active
   * @param {LODInstancingLevel} level - LOD level to check
   * @param {Vector3} cameraPosition - Camera position
   * @returns {boolean} True if level should be active
   * @private
   */
  _isLevelActive(level, cameraPosition) {
    // For each instance, check distance from camera
    for (const instanceId of this.activeInstances) {
      const instance = this.instanceData[instanceId];
      if (!instance) continue;
      
      const distance = Vector3.distance(
        new Vector3().fromArray(instance.position),
        cameraPosition
      );
      
      return distance >= level.distance;
    }
    
    return false;
  }

  /**
   * Update LOD level instance ranges
   * @private
   */
  _updateLODLevels() {
    let instanceIndex = 0;
    
    for (const level of this.lodLevels) {
      level.startIndex = instanceIndex;
      level.instanceCount = level.isActive ? Math.floor(this.currentInstanceCount / this.lodLevels.length) : 0;
      level.endIndex = level.startIndex + level.instanceCount;
      instanceIndex = level.endIndex;
    }
  }

  /**
   * Update instance buffer data
   */
  updateInstanceBuffer() {
    if (this.currentInstanceCount === 0) return;

    // Update matrices
    const matrices = new Float32Array(this.currentInstanceCount * 16);
    let matrixIndex = 0;

    for (let i = 0; i < this.currentInstanceCount; i++) {
      const instance = this.instanceData[i];
      if (!instance || !instance._dirty) continue;
      
      instance.updateMatrix();
      
      // Copy matrix to buffer
      const matrixData = instance.worldMatrix.getData();
      for (let j = 0; j < 16; j++) {
        matrices[matrixIndex * 16 + j] = matrixData[j];
      }
      matrixIndex++;
    }

    // Upload to GPU
    this.instanceBuffer.setData(matrices);
    this.renderStats.bufferUpdates++;
  }

  /**
   * Render instances
   * @param {WebGLProgram} program - Shader program
   * @param {BufferGeometry} geometry - Base geometry
   * @param {number} instanceStart - Start instance index
   * @param {number} instanceCount - Number of instances
   */
  render(program, geometry, instanceStart = 0, instanceCount = null) {
    const count = instanceCount || this.currentInstanceCount;
    
    if (count === 0 || !geometry) return;

    this._updateInstanceAttributes(program);

    // Bind vertex attributes
    geometry.enableAttributes(program);
    
    // Bind instance buffer
    this.instanceBuffer.bindToAttribute(program, 'instanceMatrix', 4, 16, 0);

    // Draw instances
    const indexBuffer = geometry.getIndexBuffer();
    
    if (indexBuffer) {
      indexBuffer.bind();
      this.gl.drawElementsInstancedANGLE(
        WebGLRenderingContext.TRIANGLES,
        indexBuffer.getIndexCount(),
        indexBuffer.getIndexType(),
        0,
        count
      );
    } else {
      this.gl.drawArraysInstancedANGLE(
        WebGLRenderingContext.TRIANGLES,
        0,
        geometry.getVertexCount(),
        count
      );
    }

    this.renderStats.drawCalls++;
    this.renderStats.instances += count;
  }

  /**
   * Update instance attributes for shader
   * @param {WebGLProgram} program - Shader program
   * @private
   */
  _updateInstanceAttributes(program) {
    // This would handle custom per-instance attributes
    // Implementation depends on specific shader requirements
    
    for (const [attributeName, buffer] of this.customAttributeBuffers) {
      const location = this.gl.getAttribLocation(program, attributeName);
      if (location !== -1) {
        buffer.bindToAttribute(program, attributeName, 4, 0, 0);
      }
    }
  }

  /**
   * Get render statistics
   * @returns {object} Render statistics
   */
  getRenderStats() {
    return { ...this.renderStats };
  }

  /**
   * Reset render statistics
   */
  resetRenderStats() {
    this.renderStats = {
      batches: 0,
      drawCalls: 0,
      instances: 0,
      triangles: 0,
      lodSwitches: 0,
      bufferUpdates: 0,
      gpuTime: 0
    };
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.instanceBuffer) {
      this.instanceBuffer.dispose();
    }

    for (const buffer of this.customAttributeBuffers.values()) {
      buffer.dispose();
    }

    this.instanceData = new Array(this.maxInstances);
    this.activeInstances.clear();
    this.lodLevels = [];
  }

  /**
   * Update instance ID mapping (for internal use)
   * @param {number} oldId - Old instance ID
   * @param {number} newId - New instance ID
   * @private
   */
  _updateInstanceIdMapping(oldId, newId) {
    // Update any instance ID references
    // This is a placeholder - actual implementation depends on use case
  }
}

/**
 * Batch manager for organizing instances by material and geometry
 */
export class BatchManager {
  constructor(gl) {
    this.gl = gl;
    this.batches = new Map();
    this.batchOrder = [];
    
    // Performance tracking
    this.stats = {
      totalBatches: 0,
      totalInstances: 0,
      averageInstancesPerBatch: 0,
      batchingEfficiency: 0
    };
  }

  /**
   * Add instance to appropriate batch
   * @param {number} instanceId - Instance ID
   * @param {Object} batchInfo - Batch information (material, geometry, etc.)
   */
  addToBatch(instanceId, batchInfo) {
    const batchKey = this.generateBatchKey(batchInfo);
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        key: batchKey,
        instances: new Set(),
        material: batchInfo.material,
        geometry: batchInfo.geometry,
        shader: batchInfo.shader,
        instanceRenderer: new InstanceRenderer(this.gl),
        stats: {
          drawCalls: 0,
          instances: 0,
          triangles: 0
        }
      });
      this.batchOrder.push(batchKey);
    }

    const batch = this.batches.get(batchKey);
    batch.instances.add(instanceId);
    
    // Update statistics
    this._updateStats();
  }

  /**
   * Remove instance from batch
   * @param {number} instanceId - Instance ID
   * @param {Object} batchInfo - Batch information
   */
  removeFromBatch(instanceId, batchInfo) {
    const batchKey = this.generateBatchKey(batchInfo);
    const batch = this.batches.get(batchKey);
    
    if (batch) {
      batch.instances.delete(instanceId);
      
      // Remove empty batches
      if (batch.instances.size === 0) {
        this.batches.delete(batchKey);
        const index = this.batchOrder.indexOf(batchKey);
        if (index > -1) {
          this.batchOrder.splice(index, 1);
        }
      }
      
      this._updateStats();
    }
  }

  /**
   * Generate batch key for grouping
   * @param {Object} batchInfo - Batch information
   * @returns {string} Batch key
   */
  generateBatchKey(batchInfo) {
    const parts = [];
    
    if (batchInfo.material) {
      parts.push(`mat_${batchInfo.material.getId() || 'default'}`);
    }
    
    if (batchInfo.geometry) {
      parts.push(`geo_${batchInfo.geometry.getId() || 'default'}`);
    }
    
    if (batchInfo.shader) {
      parts.push(`shd_${batchInfo.shader.getId() || 'default'}`);
    }
    
    return parts.join('_') || 'default_batch';
  }

  /**
   * Get all batches for rendering
   * @returns {Array} Array of batch objects
   */
  getBatches() {
    return this.batchOrder.map(key => this.batches.get(key));
  }

  /**
   * Update batch statistics
   * @private
   */
  _updateStats() {
    this.stats.totalBatches = this.batches.size;
    
    let totalInstances = 0;
    for (const batch of this.batches.values()) {
      totalInstances += batch.instances.size;
    }
    
    this.stats.totalInstances = totalInstances;
    this.stats.averageInstancesPerBatch = this.stats.totalBatches > 0 ? 
      totalInstances / this.stats.totalBatches : 0;
    
    // Calculate batching efficiency (instances per batch vs potential maximum)
    this.stats.batchingEfficiency = this.stats.totalBatches > 0 ? 
      Math.min(1.0, this.stats.averageInstancesPerBatch / 100) : 0;
  }

  /**
   * Get batch statistics
   * @returns {object} Batch statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clear all batches
   */
  clear() {
    for (const batch of this.batches.values()) {
      batch.instanceRenderer.dispose();
    }
    
    this.batches.clear();
    this.batchOrder = [];
    this._updateStats();
  }
}

/**
 * Performance profiler for instanced rendering
 */
export class InstancingProfiler {
  constructor() {
    this.measurements = [];
    this.currentFrame = {
      startTime: 0,
      endTime: 0,
      gpuTime: 0,
      cpuTime: 0,
      drawCalls: 0,
      instances: 0,
      batches: 0,
      triangles: 0,
      lodSwitches: 0,
      bufferUpdates: 0
    };
    
    this.frameCount = 0;
    this.fps = 0;
    this.frameTimes = [];
    this.maxFrameTimeHistory = 60; // Keep last 60 frames
    
    // Performance thresholds
    this.thresholds = {
      maxDrawCalls: 100,
      maxInstances: 50000,
      maxBatches: 20,
      targetFPS: 60,
      maxBufferUpdates: 10
    };
  }

  /**
   * Start frame measurement
   */
  startFrame() {
    this.currentFrame.startTime = performance.now();
    this._resetFrameCounters();
  }

  /**
   * End frame measurement
   */
  endFrame() {
    this.currentFrame.endTime = performance.now();
    this.currentFrame.cpuTime = this.currentFrame.endTime - this.currentFrame.startTime;
    
    // Calculate FPS
    this.frameCount++;
    this.frameTimes.push(this.currentFrame.cpuTime);
    
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = 1000 / avgFrameTime;
    
    // Store measurement
    this.measurements.push({ ...this.currentFrame });
    
    if (this.measurements.length > 100) {
      this.measurements.shift();
    }
  }

  /**
   * Record GPU time
   * @param {number} gpuTime - GPU execution time in milliseconds
   */
  recordGPUTime(gpuTime) {
    this.currentFrame.gpuTime = gpuTime;
  }

  /**
   * Record rendering statistics
   * @param {object} stats - Render statistics
   */
  recordStats(stats) {
    this.currentFrame.drawCalls += stats.drawCalls || 0;
    this.currentFrame.instances += stats.instances || 0;
    this.currentFrame.batches += stats.batches || 0;
    this.currentFrame.triangles += stats.triangles || 0;
    this.currentFrame.lodSwitches += stats.lodSwitches || 0;
    this.currentFrame.bufferUpdates += stats.bufferUpdates || 0;
  }

  /**
   * Get performance analysis
   * @returns {object} Performance analysis
   */
  getAnalysis() {
    const latest = this.measurements[this.measurements.length - 1];
    if (!latest) return null;
    
    return {
      fps: this.fps,
      frameTime: latest.cpuTime,
      gpuTime: latest.gpuTime,
      drawCalls: latest.drawCalls,
      instances: latest.instances,
      batches: latest.batches,
      triangles: latest.triangles,
      lodSwitches: latest.lodSwitches,
      bufferUpdates: latest.bufferUpdates,
      
      // Performance warnings
      warnings: this._getPerformanceWarnings(latest),
      
      // Efficiency metrics
      efficiency: this._calculateEfficiency(latest),
      
      // Recommendations
      recommendations: this._getRecommendations(latest)
    };
  }

  /**
   * Get performance warnings
   * @param {object} frame - Frame data
   * @returns {Array} Array of warning messages
   * @private
   */
  _getPerformanceWarnings(frame) {
    const warnings = [];
    
    if (frame.drawCalls > this.thresholds.maxDrawCalls) {
      warnings.push(`High draw call count: ${frame.drawCalls} (target: ${this.thresholds.maxDrawCalls})`);
    }
    
    if (frame.instances > this.thresholds.maxInstances) {
      warnings.push(`High instance count: ${frame.instances} (target: ${this.thresholds.maxInstances})`);
    }
    
    if (frame.batches > this.thresholds.maxBatches) {
      warnings.push(`High batch count: ${frame.batches} (target: ${this.thresholds.maxBatches})`);
    }
    
    if (frame.bufferUpdates > this.thresholds.maxBufferUpdates) {
      warnings.push(`High buffer update count: ${frame.bufferUpdates} (target: ${this.thresholds.maxBufferUpdates})`);
    }
    
    if (this.fps < this.thresholds.targetFPS) {
      warnings.push(`Low FPS: ${this.fps.toFixed(1)} (target: ${this.thresholds.targetFPS})`);
    }
    
    return warnings;
  }

  /**
   * Calculate efficiency metrics
   * @param {object} frame - Frame data
   * @returns {object} Efficiency metrics
   * @private
   */
  _calculateEfficiency(frame) {
    const instancesPerDrawCall = frame.drawCalls > 0 ? frame.instances / frame.drawCalls : 0;
    const trianglesPerInstance = frame.instances > 0 ? frame.triangles / frame.instances : 0;
    const batchEfficiency = frame.batches > 0 ? frame.instances / frame.batches : 0;
    
    return {
      instancesPerDrawCall,
      trianglesPerInstance,
      batchEfficiency,
      cpuTimePerInstance: frame.instances > 0 ? frame.cpuTime / frame.instances : 0,
      gpuTimePerDrawCall: frame.drawCalls > 0 ? frame.gpuTime / frame.drawCalls : 0
    };
  }

  /**
   * Get performance recommendations
   * @param {object} frame - Frame data
   * @returns {Array} Array of recommendation strings
   * @private
   */
  _getRecommendations(frame) {
    const recommendations = [];
    
    if (frame.drawCalls > this.thresholds.maxDrawCalls) {
      recommendations.push('Consider increasing batch sizes or reducing material variety');
    }
    
    if (frame.bufferUpdates > this.thresholds.maxBufferUpdates) {
      recommendations.push('Reduce instance update frequency or implement update culling');
    }
    
    if (frame.instances < 1000 && frame.batches > 10) {
      recommendations.push('Consider merging batches or using fewer materials');
    }
    
    if (frame.lodSwitches > 10) {
      recommendations.push('Optimize LOD distances or reduce LOD levels');
    }
    
    return recommendations;
  }

  /**
   * Reset frame counters
   * @private
   */
  _resetFrameCounters() {
    this.currentFrame = {
      startTime: this.currentFrame.startTime,
      endTime: 0,
      gpuTime: 0,
      cpuTime: 0,
      drawCalls: 0,
      instances: 0,
      batches: 0,
      triangles: 0,
      lodSwitches: 0,
      bufferUpdates: 0
    };
  }

  /**
   * Set performance thresholds
   * @param {object} thresholds - New threshold values
   */
  setThresholds(thresholds) {
    Object.assign(this.thresholds, thresholds);
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.measurements = [];
    this.frameTimes = [];
    this.frameCount = 0;
    this.fps = 0;
  }
}

/**
 * Main InstancingSystem class
 */
export class InstancingSystem {
  constructor(gl, options = {}) {
    this.gl = gl;
    this.options = {
      maxInstances: options.maxInstances || 10000,
      enableProfiling: options.enableProfiling !== false,
      autoBatch: options.autoBatch !== false,
      enableLOD: options.enableLOD !== false,
      debugMode: options.debugMode || false
    };

    // Core components
    this.batchManager = new BatchManager(gl);
    this.profiler = this.options.enableProfiling ? new InstancingProfiler() : null;
    
    // Instance management
    this.instances = new Map();
    this.nextInstanceId = 0;
    
    // Rendering state
    this.isInitialized = false;
    this.needsUpdate = false;
    
    // Statistics
    this.renderStats = {
      totalInstances: 0,
      activeInstances: 0,
      drawCalls: 0,
      batches: 0,
      lastFrameTime: 0
    };

    this._init();
  }

  /**
   * Initialize the instancing system
   * @private
   */
  _init() {
    // Check WebGL instancing support
    const instancedArrays = this.gl.getExtension('ANGLE_instanced_arrays');
    if (!instancedArrays) {
      console.warn('WebGL instancing not supported, falling back to regular rendering');
      return;
    }

    this.instancedArrays = instancedArrays;
    this.isInitialized = true;
  }

  /**
   * Create a new instanced object
   * @param {Object} config - Instance configuration
   * @returns {number} Instance ID
   */
  createInstance(config = {}) {
    if (!this.isInitialized) {
      console.warn('Instancing system not initialized');
      return -1;
    }

    const instanceData = new InstanceData(
      config.position || [0, 0, 0],
      config.rotation || [0, 0, 0, 1],
      config.scale || [1, 1, 1]
    );

    const instanceId = this.nextInstanceId++;
    this.instances.set(instanceId, instanceData);

    // Add to batch manager
    if (this.options.autoBatch && config.batchInfo) {
      this.batchManager.addToBatch(instanceId, config.batchInfo);
    }

    this.renderStats.totalInstances++;
    this.renderStats.activeInstances++;

    return instanceId;
  }

  /**
   * Destroy an instance
   * @param {number} instanceId - Instance ID to destroy
   */
  destroyInstance(instanceId) {
    const instanceData = this.instances.get(instanceId);
    if (!instanceData) return;

    // Remove from batch manager
    if (this.options.autoBatch) {
      // Note: batchInfo would need to be stored for removal
      // this.batchManager.removeFromBatch(instanceId, instanceData.batchInfo);
    }

    this.instances.delete(instanceId);
    this.renderStats.activeInstances--;
  }

  /**
   * Update instance
   * @param {number} instanceId - Instance ID
   * @param {Object} data - Updated instance data
   */
  updateInstance(instanceId, data) {
    const instanceData = this.instances.get(instanceId);
    if (!instanceData) return;

    if (data.position) {
      instanceData.setPosition(data.position[0], data.position[1], data.position[2]);
    }

    if (data.rotation) {
      instanceData.setRotation(data.rotation[0], data.rotation[1], data.rotation[2], data.rotation[3]);
    }

    if (data.scale) {
      instanceData.setScale(data.scale[0], data.scale[1], data.scale[2]);
    }

    if (data.customAttributes) {
      for (const [name, value] of Object.entries(data.customAttributes)) {
        instanceData.setCustomAttribute(name, value);
      }
    }

    this.needsUpdate = true;
  }

  /**
   * Update LOD system
   * @param {Vector3} cameraPosition - Camera position
   */
  updateLOD(cameraPosition) {
    if (!this.options.enableLOD) return;

    for (const batch of this.batchManager.getBatches()) {
      batch.instanceRenderer.updateLOD(cameraPosition);
    }
  }

  /**
   * Render all instances
   * @param {WebGLRenderer} renderer - WebGL renderer
   * @param {Scene} scene - Scene to render
   */
  render(renderer, scene) {
    if (this.profiler) {
      this.profiler.startFrame();
    }

    this._updateInstances();
    
    let totalDrawCalls = 0;
    let totalBatches = 0;
    
    for (const batch of this.batchManager.getBatches()) {
      if (batch.instances.size === 0) continue;

      // Render batch
      if (batch.shader && batch.material && batch.geometry) {
        batch.instanceRenderer.render(batch.shader, batch.geometry);
        totalBatches++;
      }
    }

    this.renderStats.drawCalls = totalDrawCalls;
    this.renderStats.batches = totalBatches;

    if (this.profiler) {
      this.profiler.recordStats({
        drawCalls: totalDrawCalls,
        instances: this.renderStats.activeInstances,
        batches: totalBatches,
        triangles: this._estimateTriangleCount(),
        lodSwitches: 0, // Would be tracked by LOD system
        bufferUpdates: this._countBufferUpdates()
      });
      
      this.profiler.endFrame();
    }
  }

  /**
   * Update instance data
   * @private
   */
  _updateInstances() {
    if (!this.needsUpdate) return;

    for (const batch of this.batchManager.getBatches()) {
      batch.instanceRenderer.updateInstanceBuffer();
    }

    this.needsUpdate = false;
  }

  /**
   * Estimate triangle count
   * @returns {number} Estimated triangle count
   * @private
   */
  _estimateTriangleCount() {
    // This is a simplified estimation
    return this.renderStats.activeInstances * 100; // Assume 100 triangles per instance average
  }

  /**
   * Count buffer updates
   * @returns {number} Number of buffer updates
   * @private
   */
  _countBufferUpdates() {
    let updates = 0;
    for (const batch of this.batchManager.getBatches()) {
      updates += batch.instanceRenderer.getRenderStats().bufferUpdates;
    }
    return updates;
  }

  /**
   * Get performance analysis
   * @returns {object|null} Performance analysis or null if profiling disabled
   */
  getPerformanceAnalysis() {
    return this.profiler ? this.profiler.getAnalysis() : null;
  }

  /**
   * Get system statistics
   * @returns {object} System statistics
   */
  getStats() {
    return {
      ...this.renderStats,
      batchStats: this.batchManager.getStats(),
      profiling: this.profiler ? {
        enabled: true,
        fps: this.profiler.fps,
        frameCount: this.profiler.frameCount
      } : { enabled: false }
    };
  }

  /**
   * Set debug mode
   * @param {boolean} enabled - Enable debug mode
   */
  setDebugMode(enabled) {
    this.options.debugMode = enabled;
  }

  /**
   * Dispose of system resources
   */
  dispose() {
    // Dispose batch manager
    this.batchManager.clear();
    
    // Dispose profiler
    if (this.profiler) {
      this.profiler.clear();
    }
    
    // Clear instances
    this.instances.clear();
    this.renderStats.totalInstances = 0;
    this.renderStats.activeInstances = 0;
  }
}

/**
 * Utility functions for instancing
 */
export const InstancingUtils = {
  /**
   * Create a unit quad geometry for instanced rendering
   * @param {WebGLRenderingContext} gl - WebGL context
   * @returns {BufferGeometry} Quad geometry
   */
  createUnitQuad(gl) {
    const positions = new Float32Array([
      -0.5, -0.5, 0,
       0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5,  0.5, 0
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);

    const geometry = new BufferGeometry(gl);
    geometry.addAttribute(
      new (gl.isWebGL2 ? 'Float32BufferAttribute' : 'Float32Array')('position', 3),
      positions
    );
    geometry.setIndex(indices);

    return geometry;
  },

  /**
   * Create a unit cube geometry for instanced rendering
   * @param {WebGLRenderingContext} gl - WebGL context
   * @returns {BufferGeometry} Cube geometry
   */
  createUnitCube(gl) {
    const positions = new Float32Array([
      // Front face
      -1, -1,  1,
       1, -1,  1,
       1,  1,  1,
      -1,  1,  1,
      
      // Back face
      -1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
       1, -1, -1,
      
      // Top face
      -1,  1, -1,
      -1,  1,  1,
       1,  1,  1,
       1,  1, -1,
      
      // Bottom face
      -1, -1, -1,
       1, -1, -1,
       1, -1,  1,
      -1, -1,  1,
      
      // Right face
       1, -1, -1,
       1,  1, -1,
       1,  1,  1,
       1, -1,  1,
      
      // Left face
      -1, -1, -1,
      -1, -1,  1,
      -1,  1,  1,
      -1,  1, -1,
    ]);

    const indices = new Uint16Array([
      0,  1,  2,    0,  2,  3,    // front
      4,  5,  6,    4,  6,  7,    // back
      8,  9,  10,   8,  10, 11,   // top
      12, 13, 14,   12, 14, 15,   // bottom
      16, 17, 18,   16, 18, 19,   // right
      20, 21, 22,   20, 22, 23,   // left
    ]);

    const geometry = new BufferGeometry(gl);
    geometry.addAttribute(
      new (gl.isWebGL2 ? 'Float32BufferAttribute' : 'Float32Array')('position', 3),
      positions
    );
    geometry.setIndex(indices);

    return geometry;
  },

  /**
   * Generate random positions in a sphere
   * @param {number} count - Number of positions to generate
   * @param {number} radius - Sphere radius
   * @param {Vector3} center - Sphere center
   * @returns {Array<Array<number>>} Array of positions
   */
  generateRandomPositions(count, radius = 100, center = [0, 0, 0]) {
    const positions = [];
    
    for (let i = 0; i < count; i++) {
      // Generate random point in sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());
      
      const x = center[0] + r * Math.sin(phi) * Math.cos(theta);
      const y = center[1] + r * Math.sin(phi) * Math.sin(theta);
      const z = center[2] + r * Math.cos(phi);
      
      positions.push([x, y, z]);
    }
    
    return positions;
  }
};
