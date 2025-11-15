/**
 * BufferGeometry module
 * Manages geometry data with optimized buffer layouts
 */

import { Buffer, IndexBuffer, VertexBuffer, BufferType, BufferUsage } from './Buffer.js';

/**
 * Vertex attribute configuration
 */
export class VertexAttribute {
  /**
   * Create a vertex attribute
   * @param {string} name - Attribute name
   * @param {number} size - Number of components (1-4)
   * @param {number} type - Component type (FLOAT, INT, etc.)
   * @param {boolean} normalized - Whether to normalize data
   * @param {number} stride - Bytes between consecutive vertices
   * @param {number} offset - Offset of this attribute in bytes
   * @param {number} location - Shader attribute location (optional)
   */
  constructor(name, size, type = WebGLRenderingContext.FLOAT, normalized = false, stride = 0, offset = 0, location = -1) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.normalized = normalized;
    this.stride = stride;
    this.offset = offset;
    this.location = location;
    this.buffer = null;
    this.byteOffset = 0;
  }

  /**
   * Get component byte size
   * @returns {number} Component size in bytes
   */
  getComponentSize() {
    switch (this.type) {
      case WebGLRenderingContext.FLOAT:
      case WebGLRenderingContext.INT:
        return 4;
      case WebGLRenderingContext.SHORT:
      case WebGLRenderingContext.USHORT:
        return 2;
      case WebGLRenderingContext.BYTE:
      case WebGLRenderingContext.UNSIGNED_BYTE:
        return 1;
      default:
        return 4;
    }
  }

  /**
   * Get total attribute byte size
   * @returns {number} Total size in bytes
   */
  getTotalSize() {
    return this.size * this.getComponentSize();
  }
}

/**
 * BufferGeometry class for managing vertex data
 */
export class BufferGeometry {
  /**
   * Create a new BufferGeometry
   * @param {WebGLRenderingContext} gl - WebGL rendering context
   */
  constructor(gl) {
    if (!gl) {
      throw new Error('WebGL context is required');
    }

    this.gl = gl;
    this.attributes = new Map();
    this.attributeOrder = [];
    this.indexBuffer = null;
    this.vertexCount = 0;
    this.boundingBox = null;
    this.boundingSphere = null;
    this.isInterleaved = false;
    this.vertexSize = 0;
    this.buffers = [];
    
    this._isDisposed = false;
  }

  /**
   * Add a vertex attribute
   * @param {VertexAttribute} attribute - Vertex attribute to add
   * @param {ArrayBufferView|TypedArray} data - Attribute data
   */
  addAttribute(attribute, data) {
    if (this._isDisposed) {
      throw new Error('Cannot modify disposed geometry');
    }

    // Validate data consistency
    if (data && data.length % attribute.size !== 0) {
      throw new Error(`Data length (${data.length}) must be divisible by attribute size (${attribute.size})`);
    }

    attribute.buffer = new VertexBuffer(this.gl, data, BufferUsage.STATIC_DRAW);
    attribute.byteOffset = this.vertexSize;
    
    this.attributes.set(attribute.name, attribute);
    this.attributeOrder.push(attribute.name);
    
    // Update vertex size for non-interleaved buffers
    if (!this.isInterleaved) {
      this.vertexSize += attribute.getTotalSize();
    }
    
    // Infer vertex count from data
    if (data && data.length > 0) {
      this.vertexCount = data.length / attribute.size;
    }
    
    this._invalidateBounds();
    this.buffers.push(attribute.buffer);
  }

  /**
   * Add multiple attributes at once (for interleaved buffers)
   * @param {VertexAttribute[]} attributes - Array of attributes
   * @param {Float32Array} interleavedData - Interleaved vertex data
   */
  addInterleavedAttributes(attributes, interleavedData) {
    if (this._isDisposed) {
      throw new Error('Cannot modify disposed geometry');
    }

    this.isInterleaved = true;
    this.vertexSize = 0;

    // Calculate total vertex size
    for (const attribute of attributes) {
      attribute.stride = 0; // Will be set after all attributes are added
      this.vertexSize += attribute.getTotalSize();
    }

    // Create single interleaved buffer
    const buffer = new VertexBuffer(this.gl, interleavedData, BufferUsage.STATIC_DRAW);

    // Set up attributes with correct offsets
    let currentOffset = 0;
    for (const attribute of attributes) {
      attribute.buffer = buffer;
      attribute.byteOffset = currentOffset;
      attribute.stride = this.vertexSize;
      
      this.attributes.set(attribute.name, attribute);
      this.attributeOrder.push(attribute.name);
      
      currentOffset += attribute.getTotalSize();
    }

    this.vertexCount = interleavedData.length / (this.vertexSize / 4); // /4 for float size
    this._invalidateBounds();
    this.buffers.push(buffer);
  }

  /**
   * Set index data
   * @param {Uint16Array|Uint32Array} indices - Index data
   */
  setIndex(indices) {
    if (this._isDisposed) {
      throw new Error('Cannot modify disposed geometry');
    }

    this.indexBuffer = new IndexBuffer(this.gl, indices, BufferUsage.STATIC_DRAW);
    this._invalidateBounds();
  }

  /**
   * Get attribute by name
   * @param {string} name - Attribute name
   * @returns {VertexAttribute|null} Attribute or null
   */
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  /**
   * Get all attributes
   * @returns {Array<VertexAttribute>} Array of attributes in order
   */
  getAttributes() {
    return this.attributeOrder.map(name => this.attributes.get(name));
  }

  /**
   * Get index buffer
   * @returns {IndexBuffer|null} Index buffer or null
   */
  getIndexBuffer() {
    return this.indexBuffer;
  }

  /**
   * Get total number of vertices
   * @returns {number} Number of vertices
   */
  getVertexCount() {
    return this.vertexCount;
  }

  /**
   * Get total number of indices
   * @returns {number} Number of indices
   */
  getIndexCount() {
    return this.indexBuffer ? this.indexBuffer.getIndexCount() : 0;
  }

  /**
   * Enable all attributes for rendering
   * @param {WebGLProgram} program - Shader program (optional, for automatic location binding)
   */
  enableAttributes(program = null) {
    for (const attribute of this.getAttributes()) {
      attribute.buffer.bind();
      
      const location = program ? 
        this.gl.getAttribLocation(program, attribute.name) : 
        attribute.location;
      
      if (location !== -1) {
        this.gl.enableVertexAttribArray(location);
        
        this.gl.vertexAttribPointer(
          location,
          attribute.size,
          attribute.type,
          attribute.normalized,
          attribute.stride,
          attribute.byteOffset
        );
      }
    }
  }

  /**
   * Disable all attributes
   */
  disableAttributes() {
    for (const attribute of this.getAttributes()) {
      const location = attribute.location;
      if (location !== -1) {
        this.gl.disableVertexAttribArray(location);
      }
    }
  }

  /**
   * Compute bounding box from vertex positions
   */
  computeBoundingBox() {
    const positionAttribute = this.attributes.get('position');
    if (!positionAttribute || !positionAttribute.buffer.getData()) {
      this.boundingBox = null;
      return;
    }

    const positions = positionAttribute.buffer.getData();
    const vertexCount = this.vertexCount;
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < vertexCount * 3; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    this.boundingBox = {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    };
  }

  /**
   * Compute bounding sphere from vertex positions
   */
  computeBoundingSphere() {
    const positionAttribute = this.attributes.get('position');
    if (!positionAttribute || !positionAttribute.buffer.getData()) {
      this.boundingSphere = null;
      return;
    }

    // Use existing bounding box if available
    if (!this.boundingBox) {
      this.computeBoundingBox();
    }

    if (!this.boundingBox) {
      this.boundingSphere = null;
      return;
    }

    const center = {
      x: (this.boundingBox.min.x + this.boundingBox.max.x) * 0.5,
      y: (this.boundingBox.min.y + this.boundingBox.max.y) * 0.5,
      z: (this.boundingBox.min.z + this.boundingBox.max.z) * 0.5
    };

    // Calculate maximum distance from center to any vertex
    const positions = positionAttribute.buffer.getData();
    const vertexCount = this.vertexCount;
    
    let maxDistance = 0;
    for (let i = 0; i < vertexCount * 3; i += 3) {
      const dx = positions[i] - center.x;
      const dy = positions[i + 1] - center.y;
      const dz = positions[i + 2] - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      maxDistance = Math.max(maxDistance, distance);
    }

    this.boundingSphere = {
      center: center,
      radius: maxDistance
    };
  }

  /**
   * Get bounding box
   * @returns {object|null} Bounding box or null
   */
  getBoundingBox() {
    if (!this.boundingBox) {
      this.computeBoundingBox();
    }
    return this.boundingBox;
  }

  /**
   * Get bounding sphere
   * @returns {object|null} Bounding sphere or null
   */
  getBoundingSphere() {
    if (!this.boundingSphere) {
      this.computeBoundingSphere();
    }
    return this.boundingSphere;
  }

  /**
   * Create a copy of this geometry
   * @returns {BufferGeometry} New geometry instance
   */
  clone() {
    const clonedGeometry = new BufferGeometry(this.gl);

    // Copy attributes
    for (const attribute of this.getAttributes()) {
      if (attribute.buffer.getData()) {
        const dataCopy = new attribute.buffer.getData().constructor(attribute.buffer.getData());
        clonedGeometry.addAttribute(
          new VertexAttribute(
            attribute.name,
            attribute.size,
            attribute.type,
            attribute.normalized,
            attribute.stride,
            attribute.byteOffset,
            attribute.location
          ),
          dataCopy
        );
      }
    }

    // Copy index buffer
    if (this.indexBuffer && this.indexBuffer.getData()) {
      const indexData = this.indexBuffer.getData();
      const indexCopy = new indexData.constructor(indexData);
      clonedGeometry.setIndex(indexCopy);
    }

    return clonedGeometry;
  }

  /**
   * Merge another geometry into this one
   * @param {BufferGeometry} otherGeometry - Geometry to merge
   * @param {number} transformMatrix - 4x4 transformation matrix (optional)
   */
  merge(otherGeometry, transformMatrix = null) {
    // Implementation would involve transforming vertices and combining attributes
    // This is a simplified version
    throw new Error('Geometry merging not yet implemented');
  }

  /**
   * Invalidate cached bounds
   * @private
   */
  _invalidateBounds() {
    this.boundingBox = null;
    this.boundingSphere = null;
  }

  /**
   * Check if geometry is valid for rendering
   * @returns {boolean} True if geometry has valid data
   */
  isValid() {
    return this.vertexCount > 0 && this.attributes.size > 0;
  }

  /**
   * Get geometry info for debugging
   * @returns {object} Geometry information
   */
  getInfo() {
    return {
      vertexCount: this.vertexCount,
      indexCount: this.getIndexCount(),
      attributeCount: this.attributes.size,
      isInterleaved: this.isInterleaved,
      vertexSize: this.vertexSize,
      hasBoundingBox: !!this.boundingBox,
      hasBoundingSphere: !!this.boundingSphere,
      attributes: this.getAttributes().map(attr => ({
        name: attr.name,
        size: attr.size,
        type: attr.type,
        normalized: attr.normalized,
        byteOffset: attr.byteOffset,
        stride: attr.stride
      }))
    };
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    if (this._isDisposed) return;

    // Dispose all buffers
    for (const attribute of this.attributes.values()) {
      if (attribute.buffer) {
        attribute.buffer.dispose();
      }
    }

    if (this.indexBuffer) {
      this.indexBuffer.dispose();
    }

    this.buffers = [];
    this.attributes.clear();
    this.attributeOrder = [];
    this.indexBuffer = null;
    this.boundingBox = null;
    this.boundingSphere = null;
    this._isDisposed = true;
  }

  /**
   * Check if geometry has been disposed
   * @returns {boolean} True if disposed
   */
  isDisposed() {
    return this._isDisposed;
  }
}

/**
 * Helper function to create common attribute configurations
 */
export class AttributeUtils {
  /**
   * Create position attribute (3 floats)
   * @param {Float32Array} positions - Position data
   * @returns {VertexAttribute} Position attribute
   */
  static createPositionAttribute(positions) {
    return new VertexAttribute('position', 3, WebGLRenderingContext.FLOAT, false, 0, 0);
  }

  /**
   * Create normal attribute (3 floats)
   * @param {Float32Array} normals - Normal data
   * @returns {VertexAttribute} Normal attribute
   */
  static createNormalAttribute(normals) {
    return new VertexAttribute('normal', 3, WebGLRenderingContext.FLOAT, false, 0, 0);
  }

  /**
   * Create UV attribute (2 floats)
   * @param {Float32Array} uvs - UV coordinates
   * @returns {VertexAttribute} UV attribute
   */
  static createUVAttribute(uvs) {
    return new VertexAttribute('uv', 2, WebGLRenderingContext.FLOAT, false, 0, 0);
  }

  /**
   * Create color attribute (3 or 4 floats)
   * @param {number} size - Color components (3 or 4)
   * @returns {VertexAttribute} Color attribute
   */
  static createColorAttribute(size = 3) {
    return new VertexAttribute('color', size, WebGLRenderingContext.FLOAT, false, 0, 0);
  }

  /**
   * Create tangent attribute (4 floats, xyz + handedness)
   * @returns {VertexAttribute} Tangent attribute
   */
  static createTangentAttribute() {
    return new VertexAttribute('tangent', 4, WebGLRenderingContext.FLOAT, false, 0, 0);
  }

  /**
   * Create standard interleaved buffer with position, normal, and UV
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {Float32Array} positions - Position data
   * @param {Float32Array} normals - Normal data
   * @param {Float32Array} uvs - UV coordinates
   * @returns {BufferGeometry} New geometry with interleaved data
   */
  static createStandardGeometry(gl, positions, normals, uvs) {
    const geometry = new BufferGeometry(gl);
    
    if (positions.length !== normals.length || positions.length !== uvs.length) {
      throw new Error('Position, normal, and UV arrays must have the same length');
    }

    // Create interleaved data: position(3) + normal(3) + uv(2) = 8 floats per vertex
    const vertexCount = positions.length / 3;
    const interleavedData = new Float32Array(vertexCount * 8);

    for (let i = 0; i < vertexCount; i++) {
      const baseIndex = i * 8;
      const srcIndex = i * 3;

      // Position (3 floats)
      interleavedData[baseIndex] = positions[srcIndex];
      interleavedData[baseIndex + 1] = positions[srcIndex + 1];
      interleavedData[baseIndex + 2] = positions[srcIndex + 2];

      // Normal (3 floats)
      interleavedData[baseIndex + 3] = normals[srcIndex];
      interleavedData[baseIndex + 4] = normals[srcIndex + 1];
      interleavedData[baseIndex + 5] = normals[srcIndex + 2];

      // UV (2 floats)
      const uvIndex = i * 2;
      interleavedData[baseIndex + 6] = uvs[uvIndex];
      interleavedData[baseIndex + 7] = uvs[uvIndex + 1];
    }

    const attributes = [
      AttributeUtils.createPositionAttribute(),
      AttributeUtils.createNormalAttribute(),
      AttributeUtils.createUVAttribute()
    ];

    geometry.addInterleavedAttributes(attributes, interleavedData);

    return geometry;
  }
}
