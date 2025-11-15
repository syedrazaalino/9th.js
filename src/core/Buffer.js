/**
 * Buffer module
 * Manages WebGL buffer objects with performance optimizations
 */

/**
 * Buffer usage types for performance optimization
 */
export const BufferUsage = {
  STATIC_DRAW: WebGLRenderingContext.STATIC_DRAW,
  DYNAMIC_DRAW: WebGLRenderingContext.DYNAMIC_DRAW,
  STREAM_DRAW: WebGLRenderingContext.STREAM_DRAW
};

/**
 * Buffer types
 */
export const BufferType = {
  ARRAY_BUFFER: WebGLRenderingContext.ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER: WebGLRenderingContext.ELEMENT_ARRAY_BUFFER
};

/**
 * WebGL Buffer wrapper class
 */
export class Buffer {
  /**
   * Create a new Buffer instance
   * @param {WebGLRenderingContext} gl - WebGL rendering context
   * @param {number} target - Buffer target (ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, etc.)
   * @param {number} usage - Buffer usage pattern
   */
  constructor(gl, target = BufferType.ARRAY_BUFFER, usage = BufferUsage.STATIC_DRAW) {
    if (!gl) {
      throw new Error('WebGL context is required');
    }

    this.gl = gl;
    this.target = target;
    this.usage = usage;
    this.buffer = gl.createBuffer();
    
    if (!this.buffer) {
      throw new Error('Failed to create WebGL buffer');
    }

    this.data = null;
    this.byteLength = 0;
    this.isBound = false;
    this.isDirty = false;
    this.updateCount = 0;
  }

  /**
   * Bind the buffer to its target
   */
  bind() {
    if (this.isBound) return;
    
    this.gl.bindBuffer(this.target, this.buffer);
    this.isBound = true;
  }

  /**
   * Unbind the buffer
   */
  unbind() {
    if (!this.isBound) return;
    
    this.gl.bindBuffer(this.target, null);
    this.isBound = false;
  }

  /**
   * Upload data to the buffer
   * @param {ArrayBufferView|TypedArray} data - Buffer data
   * @param {number} usage - Optional usage override
   */
  setData(data, usage = null) {
    this.bind();
    
    if (usage !== null) {
      this.usage = usage;
    }

    this.data = data;
    this.byteLength = data.byteLength;
    this.isDirty = true;
    this.updateCount++;

    this.gl.bufferData(this.target, data, this.usage);
  }

  /**
   * Update part of the buffer data
   * @param {ArrayBufferView|TypedArray} data - Data to update
   * @param {number} offset - Offset in bytes
   */
  updateData(data, offset = 0) {
    this.bind();
    
    if (!this.isDirty && this.byteLength === data.byteLength + offset) {
      this.gl.bufferSubData(this.target, offset, data);
    } else {
      // Fallback to full buffer update if sizes don't match
      this.setData(data);
    }
  }

  /**
   * Update buffer data in place for dynamic updates
   * @param {ArrayBufferView|TypedArray} data - Data to update
   * @param {number} byteOffset - Byte offset into buffer
   */
  updateSubData(data, byteOffset = 0) {
    this.bind();
    
    // Validate the data fits within the buffer
    if (data.byteLength + byteOffset > this.byteLength) {
      throw new Error('Subdata update exceeds buffer bounds');
    }

    this.gl.bufferSubData(this.target, byteOffset, data);
    this.updateCount++;
  }

  /**
   * Get buffer data
   * @returns {ArrayBufferView|null} Buffer data or null
   */
  getData() {
    return this.data;
  }

  /**
   * Get buffer byte length
   * @returns {number} Buffer size in bytes
   */
  getByteLength() {
    return this.byteLength;
  }

  /**
   * Get WebGL buffer object
   * @returns {WebGLBuffer|null} Native WebGL buffer
   */
  getBuffer() {
    return this.buffer;
  }

  /**
   * Get buffer usage pattern
   * @returns {number} Usage constant
   */
  getUsage() {
    return this.usage;
  }

  /**
   * Check if buffer has been modified
   * @returns {boolean} True if buffer needs updating
   */
  isBufferDirty() {
    return this.isDirty;
  }

  /**
   * Mark buffer as clean after synchronization
   */
  markClean() {
    this.isDirty = false;
  }

  /**
   * Get the number of times this buffer has been updated
   * @returns {number} Update count
   */
  getUpdateCount() {
    return this.updateCount;
  }

  /**
   * Create a copy of this buffer
   * @returns {Buffer} New buffer with same configuration
   */
  clone() {
    const clonedBuffer = new Buffer(this.gl, this.target, this.usage);
    
    if (this.data) {
      clonedBuffer.setData(this.data, this.usage);
    }
    
    return clonedBuffer;
  }

  /**
   * Resize the buffer to accommodate new data
   * @param {ArrayBufferView|TypedArray} newData - New data for the buffer
   */
  resize(newData) {
    this.setData(newData);
  }

  /**
   * Dispose of WebGL resources
   */
  dispose() {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
    
    this.data = null;
    this.byteLength = 0;
    this.isBound = false;
    this.isDirty = false;
  }
}

/**
 * Specialized Index Buffer class
 */
export class IndexBuffer extends Buffer {
  /**
   * Create a new IndexBuffer
   * @param {WebGLRenderingContext} gl - WebGL rendering context
   * @param {Uint16Array|Uint32Array} indices - Index data
   * @param {number} usage - Buffer usage pattern
   */
  constructor(gl, indices, usage = BufferUsage.STATIC_DRAW) {
    super(gl, BufferType.ELEMENT_ARRAY_BUFFER, usage);
    this.setData(indices);
  }

  /**
   * Get the number of indices
   * @returns {number} Number of indices
   */
  getIndexCount() {
    if (!this.data) return 0;
    
    return this.data.length;
  }

  /**
   * Check if indices use 32-bit format
   * @returns {boolean} True if using Uint32Array
   */
  isUint32() {
    return this.data instanceof Uint32Array;
  }
}

/**
 * Specialized Vertex Buffer class
 */
export class VertexBuffer extends Buffer {
  /**
   * Create a new VertexBuffer
   * @param {WebGLRenderingContext} gl - WebGL rendering context
   * @param {Float32Array} data - Vertex data
   * @param {number} usage - Buffer usage pattern
   */
  constructor(gl, data, usage = BufferUsage.STATIC_DRAW) {
    super(gl, BufferType.ARRAY_BUFFER, usage);
    this.setData(data);
  }

  /**
   * Get the number of vertices
   * @param {number} stride - Bytes per vertex (defaults to infer from data)
   * @returns {number} Number of vertices
   */
  getVertexCount(stride = null) {
    if (!this.data) return 0;
    
    if (stride === null) {
      stride = this.data.byteLength / (this.data.length / 3); // Assume 3 components per vertex
    }
    
    return Math.floor(this.data.byteLength / stride);
  }

  /**
   * Get the component size in bytes
   * @param {number} componentTypeSize - Size of individual component (4 for float)
   * @returns {number} Component size in bytes
   */
  getComponentSize(componentTypeSize = 4) {
    return componentTypeSize;
  }
}

/**
 * Buffer Pool for efficient buffer reuse
 */
export class BufferPool {
  /**
   * Create a new BufferPool
   * @param {WebGLRenderingContext} gl - WebGL rendering context
   * @param {number} initialSize - Initial pool size
   */
  constructor(gl, initialSize = 10) {
    this.gl = gl;
    this.availableBuffers = [];
    this.inUseBuffers = new Set();
    
    // Pre-allocate some buffers
    for (let i = 0; i < initialSize; i++) {
      this.availableBuffers.push(new Buffer(gl));
    }
  }

  /**
   * Acquire a buffer from the pool
   * @param {number} target - Buffer target
   * @param {number} usage - Buffer usage pattern
   * @returns {Buffer} Available buffer
   */
  acquire(target = BufferType.ARRAY_BUFFER, usage = BufferUsage.STATIC_DRAW) {
    let buffer = this.availableBuffers.pop();
    
    if (!buffer) {
      buffer = new Buffer(this.gl, target, usage);
    } else {
      buffer.target = target;
      buffer.usage = usage;
    }
    
    this.inUseBuffers.add(buffer);
    return buffer;
  }

  /**
   * Return a buffer to the pool
   * @param {Buffer} buffer - Buffer to return
   */
  release(buffer) {
    if (!this.inUseBuffers.has(buffer)) {
      return;
    }
    
    // Reset buffer state
    buffer.unbind();
    buffer.data = null;
    buffer.byteLength = 0;
    buffer.isDirty = false;
    buffer.updateCount = 0;
    
    this.inUseBuffers.delete(buffer);
    this.availableBuffers.push(buffer);
  }

  /**
   * Clear all buffers and return to pool
   */
  clear() {
    for (const buffer of this.inUseBuffers) {
      buffer.dispose();
    }
    
    for (const buffer of this.availableBuffers) {
      buffer.dispose();
    }
    
    this.inUseBuffers.clear();
    this.availableBuffers.length = 0;
  }

  /**
   * Get pool statistics
   * @returns {object} Pool statistics
   */
  getStats() {
    return {
      available: this.availableBuffers.length,
      inUse: this.inUseBuffers.size,
      total: this.availableBuffers.length + this.inUseBuffers.size
    };
  }
}
