/**
 * AmbientLight
 * Uniform lighting that illuminates all objects in the scene equally
 * Provides base illumination without directional information
 */

import { Color, Vec3 } from '../extras/helpers.js';

export class AmbientLight {
  /**
   * Create a new AmbientLight
   * Three.js-compatible: new AmbientLight(color = 0xffffff, intensity = 1)
   * Also accepts legacy: new AmbientLight(intensity, color) when first arg is 0–1
   */
  constructor(color = 0xffffff, intensity = 1.0) {
    this.type = 'AmbientLight';
    this.isLight = true;
    this.isAmbientLight = true;
    this.castShadow = false;
    this.visible = true;
    this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };

    // Detect legacy (intensity, color) when first arg is a small number
    if (typeof color === 'number' && color >= 0 && color <= 1 && typeof intensity !== 'number') {
      this.intensity = color;
      this.color = this._parseColor(0xffffff);
    } else if (typeof color === 'number' && color >= 0 && color <= 1 && typeof intensity === 'number' && intensity > 1) {
      // legacy AmbientLight(0.5, 0xffffff)
      this.intensity = color;
      this.color = this._parseColor(intensity);
    } else if (color && typeof color === 'object' && color.r !== undefined) {
      this.color = color;
      this.intensity = typeof intensity === 'number' ? intensity : 1.0;
    } else {
      this.color = this._parseColor(color);
      this.intensity = typeof intensity === 'number' ? intensity : 1.0;
    }

    this.isUniform = true;
    this.affectedObjects = new Set();
    this._shaderUniforms = {};
    this._needsShaderUpdate = true;
  }

  /**
   * Parse color from various formats
   * @private
   */
  _parseColor(color) {
    if (color instanceof Color) {
      return color.clone();
    } else if (typeof color === 'string') {
      // Handle hex string like "#ffffff"
      if (color.startsWith('#')) {
        const hex = parseInt(color.slice(1), 16);
        return new Color().setHex(hex);
      }
      // Handle color names (basic support)
      const colorMap = {
        'white': 0xffffff,
        'black': 0x000000,
        'red': 0xff0000,
        'green': 0x00ff00,
        'blue': 0x0000ff,
        'yellow': 0xffff00,
        'cyan': 0x00ffff,
        'magenta': 0xff00ff
      };
      return new Color().setHex(colorMap[color.toLowerCase()] || 0xffffff);
    } else if (typeof color === 'number') {
      return new Color().setHex(color);
    } else {
      return new Color(1, 1, 1);
    }
  }

  /**
   * Set the light color
   * @param {Color|string|number} color - New color
   */
  setColor(color) {
    this.color = this._parseColor(color);
    this._needsShaderUpdate = true;
  }

  /**
   * Set the light intensity
   * @param {number} intensity - New intensity (0.0 to 2.0+)
   */
  setIntensity(intensity) {
    this.intensity = Math.max(0, intensity);
    this._needsShaderUpdate = true;
  }

  /**
   * Calculate ambient light contribution for a fragment
   * Ambient light is uniform, so position/normal don't matter
   * @param {Object} fragmentData - Fragment world position, normal, etc.
   * @returns {Color} Color contribution from this light
   */
  calculateContribution(fragmentData) {
    const result = this.color.clone();
    result.multiplyScalar(this.intensity);
    return result;
  }

  /**
   * Get shader uniforms for this light
   * @returns {Object} Shader uniform definitions
   */
  getShaderUniforms() {
    if (!this._needsShaderUpdate) {
      return this._shaderUniforms;
    }

    this._shaderUniforms = {
      [`${this.type.toLowerCase()}_color`]: {
        value: [this.color.r, this.color.g, this.color.b],
        type: 'vec3',
        needsUpdate: true
      },
      [`${this.type.toLowerCase()}_intensity`]: {
        value: this.intensity,
        type: 'float',
        needsUpdate: true
      }
    };

    this._needsShaderUpdate = false;
    return this._shaderUniforms;
  }

  /**
   * Get GLSL shader code for ambient light
   * @returns {string} Fragment shader code
   */
  getShaderCode() {
    return `
      vec3 calculateAmbientLight(vec3 surfaceColor, float ambientIntensity, vec3 ambientColor) {
        return surfaceColor * ambientIntensity * ambientColor;
      }
    `;
  }

  /**
   * Add object affected by this light
   * @param {Object} object - Object to add
   */
  addAffectedObject(object) {
    this.affectedObjects.add(object);
  }

  /**
   * Remove object from affected list
   * @param {Object} object - Object to remove
   */
  removeAffectedObject(object) {
    this.affectedObjects.delete(object);
  }

  /**
   * Get list of affected objects
   * @returns {Array} List of affected objects
   */
  getAffectedObjects() {
    return Array.from(this.affectedObjects);
  }

  /**
   * Check if light affects a given object
   * @param {Object} object - Object to test
   * @returns {boolean} True if light affects object
   */
  affectsObject(object) {
    return this.affectedObjects.has(object);
  }

  /**
   * Update light (called each frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Ambient light doesn't need per-frame updates
    // but we might want to animate intensity/color here
  }

  /**
   * Dispose of light resources
   */
  dispose() {
    this.affectedObjects.clear();
    this._shaderUniforms = {};
  }

  /**
   * Clone this light
   * @returns {AmbientLight} New ambient light with same properties
   */
  clone() {
    return new AmbientLight(
      this.color instanceof Color ? this.color.clone() : this.color,
      this.intensity
    );
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      type: this.type,
      intensity: this.intensity,
      color: this.color,
      castShadow: this.castShadow
    };
  }
}
