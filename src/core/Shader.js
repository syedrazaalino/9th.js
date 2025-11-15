/**
 * Shader class
 * Handles WebGL shader compilation, uniform management, and attribute handling
 */

export class Shader {
  /**
   * Create a new Shader instance
   * @param {WebGLRenderingContext} gl - The WebGL context
   */
  constructor(gl) {
    this.gl = gl;
    this.program = null;
    this.uniforms = new Map();
    this.attributes = new Map();
    this.uniformLocations = new Map();
    this.attributeLocations = new Map();
    this.isCompiled = false;
    this.isLinked = false;
  }

  /**
   * Create and compile a shader from source code
   * @param {string} source - The shader source code
   * @param {number} type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
   * @returns {WebGLShader} The compiled shader
   */
  createShader(source, type) {
    const gl = this.gl;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error('Failed to create shader object');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
  }

  /**
   * Create a shader program from vertex and fragment shader sources
   * @param {string} vertexSource - Vertex shader source code
   * @param {string} fragmentSource - Fragment shader source code
   */
  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;

    // Create shaders
    const vertexShader = this.createShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentSource, gl.FRAGMENT_SHADER);

    // Create shader program
    this.program = gl.createProgram();

    if (!this.program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error('Failed to create shader program');
    }

    // Attach shaders to program
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);

    // Link the program
    gl.linkProgram(this.program);

    // Clean up shaders (no longer needed after linking)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw new Error(`Program linking failed: ${info}`);
    }

    this.isLinked = true;
    this.isCompiled = true;

    // Cache uniform and attribute locations
    this.cacheUniformLocations();
    this.cacheAttributeLocations();
  }

  /**
   * Cache all uniform locations in the shader program
   */
  cacheUniformLocations() {
    const gl = this.gl;
    const numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

    for (let i = 0; i < numUniforms; i++) {
      const uniformInfo = gl.getActiveUniform(this.program, i);
      if (uniformInfo) {
        const location = gl.getUniformLocation(this.program, uniformInfo.name);
        if (location) {
          this.uniformLocations.set(uniformInfo.name, location);
          this.uniforms.set(uniformInfo.name, {
            type: uniformInfo.type,
            size: uniformInfo.size,
            location: location,
            value: null
          });
        }
      }
    }
  }

  /**
   * Cache all attribute locations in the shader program
   */
  cacheAttributeLocations() {
    const gl = this.gl;
    const numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);

    for (let i = 0; i < numAttributes; i++) {
      const attributeInfo = gl.getActiveAttrib(this.program, i);
      if (attributeInfo) {
        const location = gl.getAttribLocation(this.program, attributeInfo.name);
        if (location !== -1) {
          this.attributeLocations.set(attributeInfo.name, location);
          this.attributes.set(attributeInfo.name, {
            type: attributeInfo.type,
            size: attributeInfo.size,
            location: location
          });
        }
      }
    }
  }

  /**
   * Set a uniform value
   * @param {string} name - Uniform name
   * @param {*} value - Uniform value (number, array, matrix, etc.)
   */
  setUniform(name, value) {
    if (!this.isLinked) {
      console.warn('Shader program not linked yet');
      return;
    }

    const uniform = this.uniforms.get(name);
    if (!uniform) {
      console.warn(`Uniform "${name}" not found in shader`);
      return;
    }

    const gl = this.gl;
    const location = uniform.location;

    // Handle different uniform types
    if (typeof value === 'number') {
      // Single float
      gl.uniform1f(location, value);
    } else if (Array.isArray(value)) {
      const len = value.length;
      if (len === 2) {
        gl.uniform2fv(location, value);
      } else if (len === 3) {
        gl.uniform3fv(location, value);
      } else if (len === 4) {
        gl.uniform4fv(location, value);
      } else if (len === 9) {
        gl.uniformMatrix3fv(location, false, value);
      } else if (len === 16) {
        gl.uniformMatrix4fv(location, false, value);
      } else {
        console.warn(`Unsupported uniform array length: ${len}`);
      }
    } else if (value instanceof Float32Array) {
      if (value.length === 2) {
        gl.uniform2fv(location, value);
      } else if (value.length === 3) {
        gl.uniform3fv(location, value);
      } else if (value.length === 4) {
        gl.uniform4fv(location, value);
      } else if (value.length === 9) {
        gl.uniformMatrix3fv(location, false, value);
      } else if (value.length === 16) {
        gl.uniformMatrix4fv(location, false, value);
      } else {
        console.warn(`Unsupported Float32Array length: ${value.length}`);
      }
    } else if (typeof value === 'boolean') {
      gl.uniform1i(location, value ? 1 : 0);
    } else if (typeof value === 'object' && value.type === 'texture') {
      gl.uniform1i(location, value.unit || 0);
    }

    // Cache the value
    uniform.value = value;
  }

  /**
   * Get a uniform value
   * @param {string} name - Uniform name
   * @returns {*} The uniform value
   */
  getUniform(name) {
    const uniform = this.uniforms.get(name);
    return uniform ? uniform.value : null;
  }

  /**
   * Get a uniform location
   * @param {string} name - Uniform name
   * @returns {WebGLUniformLocation|null} The uniform location
   */
  getUniformLocation(name) {
    return this.uniformLocations.get(name) || null;
  }

  /**
   * Get an attribute location
   * @param {string} name - Attribute name
   * @returns {number} The attribute location
   */
  getAttributeLocation(name) {
    return this.attributeLocations.get(name) || -1;
  }

  /**
   * Enable a vertex attribute
   * @param {string} name - Attribute name
   */
  enableAttribute(name) {
    if (!this.isLinked) return;

    const attribute = this.attributes.get(name);
    if (attribute) {
      const gl = this.gl;
      gl.enableVertexAttribArray(attribute.location);
    }
  }

  /**
   * Disable a vertex attribute
   * @param {string} name - Attribute name
   */
  disableAttribute(name) {
    if (!this.isLinked) return;

    const attribute = this.attributes.get(name);
    if (attribute) {
      const gl = this.gl;
      gl.disableVertexAttribArray(attribute.location);
    }
  }

  /**
   * Set vertex attribute pointer
   * @param {string} name - Attribute name
   * @param {number} size - Number of components per vertex attribute
   * @param {number} type - Data type of each component
   * @param {boolean} normalized - Whether to normalize the data
   * @param {number} stride - Byte offset between consecutive attributes
   * @param {number} offset - Byte offset of the first component
   */
  setAttributePointer(name, size, type, normalized = false, stride = 0, offset = 0) {
    if (!this.isLinked) return;

    const attribute = this.attributes.get(name);
    if (attribute) {
      const gl = this.gl;
      gl.vertexAttribPointer(
        attribute.location,
        size,
        type || gl.FLOAT,
        normalized,
        stride,
        offset
      );
    }
  }

  /**
   * Enable the shader program
   */
  use() {
    if (!this.isLinked) {
      console.warn('Shader program not linked yet');
      return;
    }

    const gl = this.gl;
    gl.useProgram(this.program);
  }

  /**
   * Disable the shader program
   */
  unuse() {
    const gl = this.gl;
    gl.useProgram(null);
  }

  /**
   * Get all uniform names
   * @returns {Array<string>} Array of uniform names
   */
  getUniformNames() {
    return Array.from(this.uniforms.keys());
  }

  /**
   * Get all attribute names
   * @returns {Array<string>} Array of attribute names
   */
  getAttributeNames() {
    return Array.from(this.attributes.keys());
  }

  /**
   * Check if shader is compiled and linked
   * @returns {boolean} True if shader is ready to use
   */
  isReady() {
    return this.isCompiled && this.isLinked && this.program !== null;
  }

  /**
   * Get the shader program
   * @returns {WebGLProgram|null} The WebGL program
   */
  getProgram() {
    return this.program;
  }

  /**
   * Clean up shader resources
   */
  dispose() {
    const gl = this.gl;
    
    if (this.program) {
      gl.deleteProgram(this.program);
    }

    this.uniforms.clear();
    this.attributes.clear();
    this.uniformLocations.clear();
    this.attributeLocations.clear();
    
    this.program = null;
    this.isCompiled = false;
    this.isLinked = false;
  }
}
