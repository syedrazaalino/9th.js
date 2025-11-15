/**
 * Mesh class
 * Combines BufferGeometry with materials for rendering
 * Includes geometry caching, mesh optimization, LOD support, and efficient draw call batching
 */

import { BufferGeometry } from './BufferGeometry.js';
import { Material } from './Material.js';
import { Object3D } from './Object3D.js';

/**
 * Mesh configuration options
 */
export class MeshConfig {
  constructor() {
    this.castShadows = true;
    this.receiveShadows = true;
    this.frustumCulled = true;
    this.layer = 0;
    this.priority = 0;
    this.boundingSphere = null;
    this.boundingBox = null;
    this.vertexColors = false;
    this.flatShading = false;
  }
}

/**
 * Level of Detail (LOD) configuration
 */
export class LODLevel {
  constructor(distance, geometry, material = null) {
    this.distance = distance;
    this.geometry = geometry;
    this.material = material;
    this.threshold = distance;
  }
}

/**
 * Geometry cache for efficient resource management
 */
export class GeometryCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.accessOrder = [];
  }

  /**
   * Generate cache key for geometry
   * @param {BufferGeometry} geometry - Geometry to cache
   * @returns {string} Cache key
   */
  generateKey(geometry) {
    if (!geometry.isValid()) return null;

    const info = geometry.getInfo();
    const key = `v${info.vertexCount}_i${info.indexCount}_a${info.attributeCount}_int${info.isInterleaved ? 1 : 0}`;
    return key;
  }

  /**
   * Get geometry from cache
   * @param {string} key - Cache key
   * @returns {BufferGeometry|null} Cached geometry or null
   */
  get(key) {
    if (!this.cache.has(key)) return null;

    const cached = this.cache.get(key);
    this.updateAccessOrder(key);
    return cached.geometry;
  }

  /**
   * Cache geometry
   * @param {string} key - Cache key
   * @param {BufferGeometry} geometry - Geometry to cache
   */
  set(key, geometry) {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      geometry: geometry.clone(),
      timestamp: Date.now(),
      accessCount: 0
    });
    this.updateAccessOrder(key);
  }

  /**
   * Update access order for LRU caching
   * @param {string} key - Cache key
   */
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    // Update access count
    if (this.cache.has(key)) {
      this.cache.get(key).accessCount++;
    }
  }

  /**
   * Evict oldest accessed geometry from cache
   */
  evictOldest() {
    if (this.accessOrder.length === 0) return;

    const oldestKey = this.accessOrder.shift();
    this.cache.delete(oldestKey);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: this.cache.size / this.maxSize
    };
  }
}

/**
 * Mesh optimizer for performance improvements
 */
export class MeshOptimizer {
  constructor() {
    this.indexCache = new Map();
    this.vertexCache = new Map();
  }

  /**
   * Optimize geometry by merging vertices and reindexing
   * @param {BufferGeometry} geometry - Geometry to optimize
   * @returns {BufferGeometry} Optimized geometry
   */
  optimize(geometry) {
    if (!geometry.isValid()) return geometry;

    // Remove duplicate vertices
    const optimizedGeometry = this.removeDuplicateVertices(geometry);
    
    // Optimize index buffer for better cache locality
    this.optimizeIndexBuffer(optimizedGeometry);
    
    // Generate LOD levels if needed
    this.generateLODLevels(optimizedGeometry);

    return optimizedGeometry;
  }

  /**
   * Remove duplicate vertices
   * @param {BufferGeometry} geometry - Input geometry
   * @returns {BufferGeometry} Optimized geometry
   */
  removeDuplicateVertices(geometry) {
    const positionAttr = geometry.getAttribute('position');
    if (!positionAttr) return geometry;

    const positions = positionAttr.buffer.getData();
    const vertexCount = geometry.getVertexCount();
    
    // Find duplicate vertices (simplified version)
    const vertexMap = new Map();
    const newPositions = [];
    const indexMap = new Map();

    for (let i = 0; i < vertexCount; i++) {
      const baseIndex = i * 3;
      const vertex = {
        x: positions[baseIndex],
        y: positions[baseIndex + 1],
        z: positions[baseIndex + 2]
      };

      const key = `${vertex.x}_${vertex.y}_${vertex.z}`;
      
      if (!vertexMap.has(key)) {
        vertexMap.set(key, newPositions.length / 3);
        newPositions.push(vertex.x, vertex.y, vertex.z);
      }
      
      indexMap.set(i, vertexMap.get(key));
    }

    // Create optimized geometry
    const optimizedGeometry = new BufferGeometry(geometry.gl);
    const optimizedPositions = new Float32Array(newPositions);
    
    optimizedGeometry.addAttribute(
      new (positionAttr.constructor)(positionAttr.name, positionAttr.size, positionAttr.type, 
                                  positionAttr.normalized, positionAttr.stride, positionAttr.offset),
      optimizedPositions
    );

    // Copy other attributes
    for (const attr of geometry.getAttributes()) {
      if (attr.name !== 'position' && attr.buffer.getData()) {
        const data = attr.buffer.getData();
        const newData = new data.constructor(vertexMap.size * attr.size);
        
        for (let [oldIndex, newIndex] of indexMap) {
          for (let i = 0; i < attr.size; i++) {
            newData[newIndex * attr.size + i] = data[oldIndex * attr.size + i];
          }
        }
        
        optimizedGeometry.addAttribute(attr, newData);
      }
    }

    // Reindex if original had indices
    const indexBuffer = geometry.getIndexBuffer();
    if (indexBuffer) {
      const indices = indexBuffer.getData();
      const newIndices = new indices.constructor(vertexMap.size);
      
      for (let i = 0; i < indices.length; i++) {
        newIndices[i] = indexMap.get(indices[i]);
      }
      
      optimizedGeometry.setIndex(newIndices);
    }

    return optimizedGeometry;
  }

  /**
   * Optimize index buffer for better cache performance
   * @param {BufferGeometry} geometry - Geometry to optimize
   */
  optimizeIndexBuffer(geometry) {
    const indexBuffer = geometry.getIndexBuffer();
    if (!indexBuffer) return;

    const indices = indexBuffer.getData();
    const vertexCount = geometry.getVertexCount();
    
    // Simple vertex cache optimization
    const cache = new Set();
    const optimizedIndices = [];
    
    for (let i = 0; i < indices.length; i += 3) {
      const tri = [indices[i], indices[i + 1], indices[i + 2]];
      
      // Sort triangle vertices for better cache locality
      tri.sort((a, b) => a - b);
      
      optimizedIndices.push(...tri);
    }

    const newIndexBuffer = new indices.constructor(optimizedIndices);
    geometry.setIndex(newIndexBuffer);
  }

  /**
   * Generate LOD levels for geometry
   * @param {BufferGeometry} geometry - Base geometry
   * @returns {Array<BufferGeometry>} Array of LOD geometries
   */
  generateLODLevels(geometry) {
    const lodLevels = [];
    
    // Generate different detail levels
    const levels = [1.0, 0.75, 0.5, 0.25, 0.1];
    
    for (const level of levels) {
      if (level === 1.0) {
        lodLevels.push(geometry);
        continue;
      }
      
      const lodGeometry = this.generateLODGeometry(geometry, level);
      lodLevels.push(lodGeometry);
    }
    
    return lodLevels;
  }

  /**
   * Generate a specific LOD level
   * @param {BufferGeometry} geometry - Base geometry
   * @param {number} level - LOD level (0.1 to 1.0)
   * @returns {BufferGeometry} LOD geometry
   */
  generateLODGeometry(geometry, level) {
    const lodGeometry = new BufferGeometry(geometry.gl);
    
    // Copy attributes with reduced detail
    for (const attr of geometry.getAttributes()) {
      if (attr.buffer.getData()) {
        const data = attr.buffer.getData();
        const originalCount = geometry.getVertexCount();
        const newCount = Math.max(1, Math.floor(originalCount * level));
        const newData = new data.constructor(newCount * attr.size);
        
        // Sample vertices evenly
        for (let i = 0; i < newCount; i++) {
          const sourceIndex = Math.floor(i / newCount * originalCount);
          for (let j = 0; j < attr.size; j++) {
            newData[i * attr.size + j] = data[sourceIndex * attr.size + j];
          }
        }
        
        lodGeometry.addAttribute(attr, newData);
      }
    }

    // Reduce indices proportionally
    const indexBuffer = geometry.getIndexBuffer();
    if (indexBuffer) {
      const indices = indexBuffer.getData();
      const newIndexCount = Math.max(1, Math.floor(indices.length * level));
      const newIndices = new indices.constructor(newIndexCount);
      
      for (let i = 0; i < newIndexCount; i++) {
        const sourceIndex = Math.floor(i / newIndexCount * indices.length);
        newIndices[i] = Math.floor(indices[sourceIndex] * level);
      }
      
      lodGeometry.setIndex(newIndices);
    }
    
    return lodGeometry;
  }
}

/**
 * Draw call batcher for efficient rendering
 */
export class DrawCallBatcher {
  constructor() {
    this.batches = new Map();
    this.batchOrder = [];
  }

  /**
   * Add mesh to appropriate batch
   * @param {Mesh} mesh - Mesh to add
   * @param {Material} material - Material to batch with
   */
  addToBatch(mesh, material) {
    const batchKey = this.generateBatchKey(material);
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        material: material,
        meshes: [],
        key: batchKey
      });
      this.batchOrder.push(batchKey);
    }
    
    this.batches.get(batchKey).meshes.push(mesh);
  }

  /**
   * Generate batch key for material grouping
   * @param {Material} material - Material to generate key for
   * @returns {string} Batch key
   */
  generateBatchKey(material) {
    if (!material || !material.shader) {
      return 'default';
    }
    
    return `shader_${material.shader.getId()}_blend_${material.blending.enabled}`;
  }

  /**
   * Get all batches for rendering
   * @returns {Array} Array of batches
   */
  getBatches() {
    return this.batchOrder.map(key => this.batches.get(key));
  }

  /**
   * Clear all batches
   */
  clear() {
    this.batches.clear();
    this.batchOrder = [];
  }

  /**
   * Get batch statistics
   * @returns {object} Batch statistics
   */
  getStats() {
    const stats = {
      batchCount: this.batches.size,
      totalMeshes: 0,
      averageMeshesPerBatch: 0
    };
    
    let meshCount = 0;
    for (const batch of this.batches.values()) {
      meshCount += batch.meshes.length;
    }
    
    stats.totalMeshes = meshCount;
    stats.averageMeshesPerBatch = stats.batchCount > 0 ? meshCount / stats.batchCount : 0;
    
    return stats;
  }
}

/**
 * Main Mesh class
 */
export class Mesh extends Object3D {
  /**
   * Create a new Mesh instance
   * @param {BufferGeometry} geometry - The geometry for this mesh
   * @param {Material} material - The material for this mesh
   * @param {MeshConfig} config - Configuration options
   */
  constructor(geometry, material = null, config = new MeshConfig()) {
    super();
    
    this.geometry = geometry;
    this.material = material;
    this.config = config;
    
    // Mesh properties
    this.castShadows = config.castShadows;
    this.receiveShadows = config.receiveShadows;
    this.frustumCulled = config.frustumCulled;
    this.layer = config.layer;
    this.priority = config.priority;
    
    // Optimization
    this.optimizer = new MeshOptimizer();
    this.isOptimized = false;
    this.optimizationLevel = 0;
    
    // LOD support
    this.lodLevels = [];
    this.currentLOD = 0;
    this.autoLOD = true;
    this.lodDistances = [];
    
    // Rendering state
    this.needsUpdate = true;
    this.visible = true;
    this.renderOrder = 0;
    
    // Performance tracking
    this.renderStats = {
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      lastUpdate: 0
    };
    
    this.id = Mesh._generateId();
  }

  /**
   * Get mesh geometry
   * @returns {BufferGeometry} The mesh geometry
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Set mesh geometry
   * @param {BufferGeometry} geometry - New geometry
   */
  setGeometry(geometry) {
    if (this.geometry && this.geometry !== geometry) {
      // Don't dispose geometry as it might be shared
    }
    
    this.geometry = geometry;
    this.needsUpdate = true;
    this._updateLODGeometries();
  }

  /**
   * Get mesh material
   * @returns {Material} The mesh material
   */
  getMaterial() {
    return this.material;
  }

  /**
   * Set mesh material
   * @param {Material} material - New material
   */
  setMaterial(material) {
    this.material = material;
    this.needsUpdate = true;
  }

  /**
   * Add LOD level
   * @param {LODLevel} lodLevel - LOD level to add
   */
  addLODLevel(lodLevel) {
    this.lodLevels.push(lodLevel);
    this.lodLevels.sort((a, b) => a.distance - b.distance);
    
    // Set up default distances if not provided
    if (this.lodDistances.length === 0) {
      this.lodDistances = [0, 50, 100, 200, 500];
    }
  }

  /**
   * Set LOD distances
   * @param {Array<number>} distances - Array of LOD switch distances
   */
  setLODDistances(distances) {
    this.lodDistances = distances;
  }

  /**
   * Update LOD based on camera distance
   * @param {number} cameraDistance - Distance from camera
   */
  updateLOD(cameraDistance) {
    if (!this.autoLOD || this.lodLevels.length === 0) return;

    let newLOD = 0;
    for (let i = 0; i < this.lodDistances.length; i++) {
      if (cameraDistance >= this.lodDistances[i]) {
        newLOD = Math.min(i, this.lodLevels.length - 1);
      }
    }

    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      this.needsUpdate = true;
    }
  }

  /**
   * Get current LOD level
   * @returns {number} Current LOD level index
   */
  getCurrentLOD() {
    return this.currentLOD;
  }

  /**
   * Enable or disable automatic LOD
   * @param {boolean} enabled - Enable automatic LOD
   */
  setAutoLOD(enabled) {
    this.autoLOD = enabled;
  }

  /**
   * Optimize mesh for performance
   * @param {number} level - Optimization level (0-3)
   */
  optimize(level = 1) {
    if (this.isOptimized || level === 0) return;

    try {
      this.geometry = this.optimizer.optimize(this.geometry);
      this.isOptimized = true;
      this.optimizationLevel = level;
      this.needsUpdate = true;
    } catch (error) {
      console.warn('Mesh optimization failed:', error);
    }
  }

  /**
   * Update mesh for rendering
   * @param {number} deltaTime - Delta time since last update
   * @param {Object3D} camera - Camera for LOD calculation
   */
  update(deltaTime = 0, camera = null) {
    super.update(deltaTime);
    
    // Update LOD if auto-LOD is enabled
    if (this.autoLOD && camera) {
      const cameraDistance = this.getCameraDistance(camera);
      this.updateLOD(cameraDistance);
    }
    
    // Update render stats
    this.renderStats.lastUpdate = Date.now();
  }

  /**
   * Calculate distance from camera
   * @param {Object3D} camera - Camera object
   * @returns {number} Distance from camera
   */
  getCameraDistance(camera) {
    if (!camera) return 0;
    
    const meshPos = this.getWorldPosition();
    const cameraPos = camera.getWorldPosition();
    
    const dx = meshPos.x - cameraPos.x;
    const dy = meshPos.y - cameraPos.y;
    const dz = meshPos.z - cameraPos.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Render the mesh
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {Material} overrideMaterial - Material to use instead of mesh material
   */
  render(gl, overrideMaterial = null) {
    if (!this.visible || !this.geometry || (!this.material && !overrideMaterial)) {
      return;
    }

    const material = overrideMaterial || this.material;
    if (!material || !material.shader || !material.shader.isReady()) {
      return;
    }

    // Apply material state
    material.apply(gl);
    
    // Set matrix uniforms after shader is active (if camera is available from renderer)
    if (material.shader && material.shader.isReady() && this._camera && this._renderer) {
      const shader = material.shader;
      const gl = this._renderer.gl;
      const camera = this._camera;
      
      // Get matrices
      const modelMatrix = this.worldMatrix || this.matrix || this.localMatrix;
      const viewMatrix = camera.matrixWorldInverse || camera.matrix;
      const projectionMatrix = camera.projectionMatrix;
      
      // Convert to arrays if needed
      const model = modelMatrix ? (modelMatrix.elements || modelMatrix) : new Float32Array(16);
      const view = viewMatrix ? (viewMatrix.elements || viewMatrix) : new Float32Array(16);
      const proj = projectionMatrix ? (projectionMatrix.elements || projectionMatrix) : new Float32Array(16);
      
      // Calculate modelViewMatrix = viewMatrix * modelMatrix
      const modelView = new Float32Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          modelView[i * 4 + j] = 0;
          for (let k = 0; k < 4; k++) {
            modelView[i * 4 + j] += view[i * 4 + k] * model[k * 4 + j];
          }
        }
      }
      
      // Set matrix uniforms
      const modelLoc = shader.getUniformLocation('modelMatrix');
      const viewLoc = shader.getUniformLocation('viewMatrix');
      const projLoc = shader.getUniformLocation('projectionMatrix');
      const mvLoc = shader.getUniformLocation('modelViewMatrix');
      
      if (modelLoc) gl.uniformMatrix4fv(modelLoc, false, model);
      if (viewLoc) gl.uniformMatrix4fv(viewLoc, false, view);
      if (projLoc) gl.uniformMatrix4fv(projLoc, false, proj);
      if (mvLoc) gl.uniformMatrix4fv(mvLoc, false, modelView);
    }

    // Enable geometry attributes
    this.geometry.enableAttributes(material.shader.getProgram());

    // Render with current LOD
    const renderGeometry = this.getCurrentLODGeometry();
    const indexBuffer = renderGeometry.getIndexBuffer();

    if (indexBuffer) {
      indexBuffer.bind();
      gl.drawElements(
        gl.TRIANGLES,
        indexBuffer.getIndexCount(),
        indexBuffer.getIndexType(),
        0
      );
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, renderGeometry.getVertexCount());
    }

    // Update render statistics
    this.renderStats.drawCalls++;
    this.renderStats.triangles += renderGeometry.getIndexCount() / 3;
    this.renderStats.vertices += renderGeometry.getVertexCount();
  }

  /**
   * Get geometry for current LOD level
   * @returns {BufferGeometry} Geometry for current LOD
   */
  getCurrentLODGeometry() {
    if (this.lodLevels.length > 0 && this.currentLOD < this.lodLevels.length) {
      return this.lodLevels[this.currentLOD].geometry || this.geometry;
    }
    return this.geometry;
  }

  /**
   * Check if mesh should be frustum culled
   * @param {Object} frustum - Frustum planes
   * @returns {boolean} True if mesh should be culled
   */
  shouldCull(frustum) {
    if (!this.frustumCulled) return false;

    // Simple bounding sphere culling
    const boundingSphere = this.getBoundingSphere();
    if (!boundingSphere) return false;

    const worldPos = this.getWorldPosition();
    const distance = Math.sqrt(
      Math.pow(worldPos.x - frustum.center.x, 2) +
      Math.pow(worldPos.y - frustum.center.y, 2) +
      Math.pow(worldPos.z - frustum.center.z, 2)
    );

    return distance > (frustum.radius + boundingSphere.radius);
  }

  /**
   * Get bounding sphere
   * @returns {object|null} Bounding sphere or null
   */
  getBoundingSphere() {
    const geometry = this.getCurrentLODGeometry();
    return geometry ? geometry.getBoundingSphere() : null;
  }

  /**
   * Get bounding box
   * @returns {object|null} Bounding box or null
   */
  getBoundingBox() {
    const geometry = this.getCurrentLODGeometry();
    return geometry ? geometry.getBoundingBox() : null;
  }

  /**
   * Get mesh render statistics
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
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      lastUpdate: 0
    };
  }

  /**
   * Check if mesh needs update
   * @returns {boolean} True if mesh needs update
   */
  needsUpdate() {
    return this.needsUpdate;
  }

  /**
   * Mark mesh as updated
   */
  updateComplete() {
    this.needsUpdate = false;
  }

  /**
   * Clone this mesh
   * @returns {Mesh} New mesh instance
   */
  clone() {
    const cloned = new Mesh(
      this.geometry.clone(),
      this.material ? this.material.clone() : null,
      { ...this.config }
    );

    // Copy mesh properties
    cloned.castShadows = this.castShadows;
    cloned.receiveShadows = this.receiveShadows;
    cloned.frustumCulled = this.frustumCulled;
    cloned.layer = this.layer;
    cloned.priority = this.priority;
    cloned.visible = this.visible;
    cloned.renderOrder = this.renderOrder;
    cloned.autoLOD = this.autoLOD;
    cloned.currentLOD = this.currentLOD;

    // Copy LOD levels
    cloned.lodLevels = this.lodLevels.map(level => ({
      distance: level.distance,
      geometry: level.geometry ? level.geometry.clone() : null,
      material: level.material ? level.material.clone() : null
    }));
    cloned.lodDistances = [...this.lodDistances];

    return cloned;
  }

  /**
   * Get mesh information for debugging
   * @returns {object} Mesh information
   */
  getInfo() {
    const geometry = this.getCurrentLODGeometry();
    
    return {
      id: this.id,
      visible: this.visible,
      renderOrder: this.renderOrder,
      layer: this.layer,
      castShadows: this.castShadows,
      receiveShadows: this.receiveShadows,
      frustumCulled: this.frustumCulled,
      autoLOD: this.autoLOD,
      currentLOD: this.currentLOD,
      lodLevelCount: this.lodLevels.length,
      isOptimized: this.isOptimized,
      optimizationLevel: this.optimizationLevel,
      hasMaterial: !!this.material,
      materialId: this.material ? this.material.getId() : null,
      geometryInfo: geometry ? geometry.getInfo() : null,
      renderStats: this.renderStats,
      boundingSphere: this.getBoundingSphere(),
      boundingBox: this.getBoundingBox()
    };
  }

  /**
   * Update LOD geometries when main geometry changes
   * @private
   */
  _updateLODGeometries() {
    if (this.lodLevels.length === 0) return;

    // Generate LOD geometries based on main geometry
    const lodGeometries = this.optimizer.generateLODLevels(this.geometry);
    
    // Update existing LOD levels or create new ones
    for (let i = 0; i < Math.min(lodGeometries.length, this.lodLevels.length); i++) {
      if (!this.lodLevels[i].geometry) {
        this.lodLevels[i].geometry = lodGeometries[i];
      }
    }
  }

  /**
   * Dispose of mesh resources
   */
  dispose() {
    // Dispose LOD geometries
    for (const lodLevel of this.lodLevels) {
      if (lodLevel.geometry) {
        lodLevel.geometry.dispose();
      }
    }
    
    // Dispose material
    if (this.material) {
      this.material.dispose();
    }
    
    // Don't dispose main geometry as it might be shared
    // Dispose main geometry if not shared
    if (this.geometry && this.geometry.isDisposed === false) {
      // Check if geometry is only used by this mesh
      // This is a simplified check - in practice you'd want reference counting
      this.geometry.dispose();
    }

    // Clear references
    this.geometry = null;
    this.material = null;
    this.lodLevels = [];
    this.needsUpdate = true;
  }

  /**
   * Destroy mesh and clean up
   */
  destroy() {
    this.dispose();
    super.destroy();
  }

  /**
   * Generate unique ID for mesh
   * @returns {number} Unique ID
   * @private
   */
  static _generateId() {
    Mesh._idCounter = (Mesh._idCounter || 0) + 1;
    return Mesh._idCounter;
  }

  /**
   * Get mesh ID
   * @returns {number} Mesh ID
   */
  getId() {
    return this.id;
  }

  // Static properties for global mesh management
  static geometryCache = new GeometryCache();
  static globalOptimizer = new MeshOptimizer();
  static globalBatcher = new DrawCallBatcher();
}

/**
 * Helper class for mesh creation
 */
export class MeshBuilder {
  /**
   * Create a mesh with cached geometry
   * @param {string} cacheKey - Cache key for geometry
   * @param {Function} geometryFactory - Function that creates geometry
   * @param {Material} material - Material for the mesh
   * @param {MeshConfig} config - Mesh configuration
   * @returns {Mesh} Created mesh
   */
  static createCachedMesh(cacheKey, geometryFactory, material = null, config = new MeshConfig()) {
    let geometry = Mesh.geometryCache.get(cacheKey);
    
    if (!geometry) {
      geometry = geometryFactory();
      Mesh.geometryCache.set(cacheKey, geometry);
    }
    
    return new Mesh(geometry, material, config);
  }

  /**
   * Create a mesh with automatic LOD
   * @param {BufferGeometry} baseGeometry - Base high-detail geometry
   * @param {Material} baseMaterial - Base material
   * @param {Array<number>} lodDistances - LOD switch distances
   * @param {Array<Material>} lodMaterials - Materials for each LOD level (optional)
   * @param {MeshConfig} config - Mesh configuration
   * @returns {Mesh} Mesh with LOD
   */
  static createLODMesh(baseGeometry, baseMaterial, lodDistances, lodMaterials = [], config = new MeshConfig()) {
    const mesh = new Mesh(baseGeometry, baseMaterial, config);
    mesh.setLODDistances(lodDistances);
    mesh.setAutoLOD(true);

    // Generate LOD levels
    const lodLevels = Mesh.globalOptimizer.generateLODLevels(baseGeometry);
    
    for (let i = 0; i < lodLevels.length; i++) {
      const lodLevel = new LODLevel(lodDistances[i] || 0, lodLevels[i], lodMaterials[i]);
      mesh.addLODLevel(lodLevel);
    }

    return mesh;
  }

  /**
   * Create an optimized mesh
   * @param {BufferGeometry} geometry - Geometry to optimize
   * @param {Material} material - Material for the mesh
   * @param {number} optimizationLevel - Level of optimization (0-3)
   * @param {MeshConfig} config - Mesh configuration
   * @returns {Mesh} Optimized mesh
   */
  static createOptimizedMesh(geometry, material, optimizationLevel = 2, config = new MeshConfig()) {
    const mesh = new Mesh(geometry, material, config);
    mesh.optimize(optimizationLevel);
    return mesh;
  }
}
