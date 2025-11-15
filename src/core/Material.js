/**
 * Material class
 * Manages shader programs and material properties for rendering
 */

import { Shader } from './Shader.js';

export class Material {
  /**
   * Create a new Material instance
   * @param {Shader} shader - The shader program to use
   */
  constructor(shader) {
    this.shader = shader;
    this.properties = new Map();
    this.textures = new Map();
    this.blending = {
      enabled: false,
      srcFactor: null,
      dstFactor: null,
      equation: null
    };
    this.depthTest = true;
    this.depthWrite = true;
    this.cullFace = true;
    this.cullFaceMode = 'back';
    this.transparent = false;
    this.opacity = 1.0;
    this.needsUpdate = true;
    this.id = Material._generateId();
  }

  /**
   * Set a material property
   * @param {string} name - Property name
   * @param {*} value - Property value
   */
  setProperty(name, value) {
    this.properties.set(name, value);
    this.needsUpdate = true;
  }

  /**
   * Get a material property
   * @param {string} name - Property name
   * @returns {*} The property value
   */
  getProperty(name) {
    return this.properties.get(name);
  }

  /**
   * Set multiple properties at once
   * @param {Object} properties - Object containing properties
   */
  setProperties(properties) {
    for (const [name, value] of Object.entries(properties)) {
      this.setProperty(name, value);
    }
  }

  /**
   * Set a uniform value in the shader
   * @param {string} name - Uniform name
   * @param {*} value - Uniform value
   */
  setUniform(name, value) {
    if (this.shader) {
      this.shader.setUniform(name, value);
    }
  }

  /**
   * Get a uniform value from the shader
   * @param {string} name - Uniform name
   * @returns {*} The uniform value
   */
  getUniform(name) {
    return this.shader ? this.shader.getUniform(name) : null;
  }

  /**
   * Set a texture for this material
   * @param {string} name - Texture name/uniform name
   * @param {WebGLTexture} texture - The WebGL texture
   * @param {number} unit - Texture unit (default: 0)
   */
  setTexture(name, texture, unit = 0) {
    this.textures.set(name, {
      texture: texture,
      unit: unit
    });
    this.needsUpdate = true;
  }

  /**
   * Remove a texture from this material
   * @param {string} name - Texture name
   */
  removeTexture(name) {
    this.textures.delete(name);
    this.needsUpdate = true;
  }

  /**
   * Set blending mode
   * @param {boolean} enabled - Enable blending
   * @param {number} srcFactor - Source blending factor
   * @param {number} dstFactor - Destination blending factor
   * @param {number} equation - Blending equation
   */
  setBlending(enabled, srcFactor, dstFactor, equation) {
    this.blending.enabled = enabled;
    this.blending.srcFactor = srcFactor;
    this.blending.dstFactor = dstFactor;
    this.blending.equation = equation;
    this.needsUpdate = true;
  }

  /**
   * Set depth test mode
   * @param {boolean} enabled - Enable depth testing
   */
  setDepthTest(enabled) {
    this.depthTest = enabled;
    this.needsUpdate = true;
  }

  /**
   * Set depth write mode
   * @param {boolean} enabled - Enable depth writing
   */
  setDepthWrite(enabled) {
    this.depthWrite = enabled;
    this.needsUpdate = true;
  }

  /**
   * Set face culling mode
   * @param {boolean} enabled - Enable face culling
   * @param {string} mode - Cull face mode ('front', 'back', 'frontAndBack')
   */
  setCullFace(enabled, mode = 'back') {
    this.cullFace = enabled;
    this.cullFaceMode = mode;
    this.needsUpdate = true;
  }

  /**
   * Set material transparency
   * @param {boolean} transparent - Whether the material is transparent
   */
  setTransparent(transparent) {
    this.transparent = transparent;
    this.needsUpdate = true;
  }

  /**
   * Set material opacity
   * @param {number} opacity - Opacity value (0.0 to 1.0)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.setProperty('opacity', this.opacity);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms based on properties
   */
  updateUniforms() {
    if (!this.shader) return;

    // Update common uniforms
    this.shader.setUniform('uOpacity', this.opacity);

    // Update material properties as uniforms
    for (const [name, value] of this.properties) {
      this.shader.setUniform(name, value);
    }

    // Update texture uniforms
    for (const [name, texData] of this.textures) {
      this.shader.setUniform(name, {
        type: 'texture',
        texture: texData.texture,
        unit: texData.unit
      });
    }

    this.needsUpdate = false;
  }

  /**
   * Apply material state to WebGL context
   * @param {WebGLRenderingContext} gl - The WebGL context
   */
  apply(gl) {
    // Initialize shader if not already done
    if (!this.shader || (this.shader && !this.shader.isReady && typeof this.initShader === 'function')) {
      if (typeof this.initShader === 'function') {
        this.initShader(gl);
      }
    }
    
    if (!this.shader || !this.shader.isReady()) return;

    // Enable the shader
    this.shader.use();

    // Update uniforms if needed
    if (this.needsUpdate) {
      this.updateUniforms();
    }

    // Apply blending
    if (this.blending.enabled) {
      gl.enable(gl.BLEND);
      if (this.blending.srcFactor && this.blending.dstFactor) {
        gl.blendFunc(this.blending.srcFactor, this.blending.dstFactor);
        if (this.blending.equation) {
          gl.blendEquation(this.blending.equation);
        }
      }
    } else {
      gl.disable(gl.BLEND);
    }

    // Apply depth test
    if (this.depthTest) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    // Apply depth write
    gl.depthMask(this.depthWrite);

    // Apply face culling
    if (this.cullFace) {
      gl.enable(gl.CULL_FACE);
      const cullMode = this.cullFaceMode === 'front' ? gl.FRONT :
                       this.cullFaceMode === 'back' ? gl.BACK :
                       gl.FRONT_AND_BACK;
      gl.cullFace(cullMode);
    } else {
      gl.disable(gl.CULL_FACE);
    }
  }

  /**
   * Check if this material needs an update
   * @returns {boolean} True if material needs update
   */
  needsUpdate() {
    return this.needsUpdate;
  }

  /**
   * Mark material as updated
   */
  updateComplete() {
    this.needsUpdate = false;
  }

  /**
   * Get all property names
   * @returns {Array<string>} Array of property names
   */
  getPropertyNames() {
    return Array.from(this.properties.keys());
  }

  /**
   * Get all texture names
   * @returns {Array<string>} Array of texture names
   */
  getTextureNames() {
    return Array.from(this.textures.keys());
  }

  /**
   * Clone this material
   * @returns {Material} A new material with the same properties
   */
  clone() {
    const cloned = new Material(this.shader);
    
    // Copy properties
    for (const [name, value] of this.properties) {
      cloned.setProperty(name, value);
    }
    
    // Copy texture references
    for (const [name, texData] of this.textures) {
      cloned.setTexture(name, texData.texture, texData.unit);
    }
    
    // Copy blending settings
    cloned.blending = { ...this.blending };
    
    // Copy render state
    cloned.depthTest = this.depthTest;
    cloned.depthWrite = this.depthWrite;
    cloned.cullFace = this.cullFace;
    cloned.cullFaceMode = this.cullFaceMode;
    cloned.transparent = this.transparent;
    cloned.opacity = this.opacity;
    
    return cloned;
  }

  /**
   * Clean up material resources
   */
  dispose() {
    this.properties.clear();
    this.textures.clear();
    
    if (this.shader) {
      this.shader.dispose();
      this.shader = null;
    }
    
    this.needsUpdate = true;
  }

  /**
   * Generate a unique ID for this material
   * @returns {number} Unique ID
   */
  static _generateId() {
    Material._idCounter = (Material._idCounter || 0) + 1;
    return Material._idCounter;
  }

  /**
   * Get material ID
   * @returns {number} Material ID
   */
  getId() {
    return this.id;
  }
}

/**
 * Basic material implementation
 */
export class BasicMaterial extends Material {
  constructor(shader, options = {}) {
    super(shader);
    
    this.color = options.color || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;
    
    // Set default properties
    this.setProperties({
      uColor: this.color,
      uOpacity: this.opacity
    });
    
    this.setTransparent(this.transparent);
    this.setOpacity(this.opacity);
  }
}

/**
 * Phong material implementation
 */
export class PhongMaterial extends Material {
  constructor(shader, options = {}) {
    super(shader);
    
    this.diffuse = options.diffuse || [1, 1, 1];
    this.specular = options.specular || [1, 1, 1];
    this.ambient = options.ambient || [0.1, 0.1, 0.1];
    this.shininess = options.shininess !== undefined ? options.shininess : 32;
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;
    
    // Set default properties
    this.setProperties({
      uDiffuse: this.diffuse,
      uSpecular: this.specular,
      uAmbient: this.ambient,
      uShininess: this.shininess,
      uOpacity: this.opacity
    });
    
    this.setTransparent(this.transparent);
    this.setOpacity(this.opacity);
  }
}

/**
 * Lambert material implementation
 */
export class LambertMaterial extends Material {
  constructor(shader, options = {}) {
    super(shader);
    
    this.diffuse = options.diffuse || [1, 1, 1];
    this.ambient = options.ambient || [0.2, 0.2, 0.2];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;
    
    // Set default properties
    this.setProperties({
      uDiffuse: this.diffuse,
      uAmbient: this.ambient,
      uOpacity: this.opacity
    });
    
    this.setTransparent(this.transparent);
    this.setOpacity(this.opacity);
  }
}
