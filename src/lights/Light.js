/**
 * Light class
 * Base class for all light types in the lighting system
 */

import { Vec3 } from '../extras/helpers.ts';

export class Light {
  constructor({
    color = '#ffffff',
    intensity = 1.0,
    castShadow = false,
    shadowBias = 0,
    shadowMapSize = 1024,
    shadowCamera = null
  } = {}) {
    this.id = Light._generateId();
    this.type = 'Light';
    this.color = color;
    this.intensity = intensity;
    this.castShadow = castShadow;
    this.shadowBias = shadowBias;
    this.shadowMapSize = shadowMapSize;
    this.shadowCamera = shadowCamera;
    
    // Position and transform
    this.position = new Vec3(0, 0, 0);
    this.rotation = new Vec3(0, 0, 0);
    this.scale = new Vec3(1, 1, 1);
    
    // Visibility
    this.visible = true;
    
    // Shader uniforms
    this.uniforms = this._createUniforms();
    
    // Shadow mapping
    this.shadow = {
      enabled: castShadow,
      bias: shadowBias,
      mapSize: shadowMapSize,
      camera: shadowCamera
    };
    
    this.needsUpdate = true;
  }
  
  /**
   * Generate unique ID for light instances
   */
  static _generateId() {
    return Light._idCounter++;
  }
  
  /**
   * Initialize static counter
   */
  static _idCounter = 1;
  
  /**
   * Create shader uniforms for this light
   */
  _createUniforms() {
    return {
      color: { value: new Float32Array([1, 1, 1]) },
      intensity: { value: 1.0 },
      position: { value: new Float32Array([0, 0, 0]) },
      direction: { value: new Float32Array([0, 0, -1]) }
    };
  }
  
  /**
   * Update light uniforms from current state
   */
  updateUniforms() {
    // Convert color hex to RGB array
    const color = this._hexToRgb(this.color);
    this.uniforms.color.value[0] = color[0] / 255;
    this.uniforms.color.value[1] = color[1] / 255;
    this.uniforms.color.value[2] = color[2] / 255;
    
    this.uniforms.intensity.value = this.intensity;
    this.uniforms.position.value[0] = this.position.x;
    this.uniforms.position.value[1] = this.position.y;
    this.uniforms.position.value[2] = this.position.z;
    
    // Update direction if applicable
    if (this.direction) {
      this.uniforms.direction.value[0] = this.direction.x;
      this.uniforms.direction.value[1] = this.direction.y;
      this.uniforms.direction.value[2] = this.direction.z;
    }
  }
  
  /**
   * Convert hex color to RGB array
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }
  
  /**
   * Set light position
   */
  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.needsUpdate = true;
  }
  
  /**
   * Set light rotation
   */
  setRotation(x, y, z) {
    this.rotation.set(x, y, z);
    this.needsUpdate = true;
  }
  
  /**
   * Set light color
   */
  setColor(color) {
    this.color = color;
    this.needsUpdate = true;
  }
  
  /**
   * Set light intensity
   */
  setIntensity(intensity) {
    this.intensity = intensity;
    this.needsUpdate = true;
  }
  
  /**
   * Enable or disable shadows
   */
  setShadowEnabled(enabled) {
    this.castShadow = enabled;
    this.shadow.enabled = enabled;
    this.needsUpdate = true;
  }
  
  /**
   * Clone this light
   */
  clone() {
    const light = new this.constructor();
    light.color = this.color;
    light.intensity = this.intensity;
    light.castShadow = this.castShadow;
    light.shadowBias = this.shadowBias;
    light.shadowMapSize = this.shadowMapSize;
    light.position.copy(this.position);
    light.rotation.copy(this.rotation);
    light.scale.copy(this.scale);
    light.visible = this.visible;
    return light;
  }
  
  /**
   * Copy properties from another light
   */
  copy(source) {
    this.color = source.color;
    this.intensity = source.intensity;
    this.castShadow = source.castShadow;
    this.shadowBias = source.shadowBias;
    this.shadowMapSize = source.shadowMapSize;
    this.shadow = { ...source.shadow };
    this.position.copy(source.position);
    this.rotation.copy(source.rotation);
    this.scale.copy(source.scale);
    this.visible = source.visible;
    this.needsUpdate = true;
  }
  
  /**
   * Update light (called each frame)
   */
  update(deltaTime = 0) {
    if (this.needsUpdate) {
      this.updateUniforms();
      this.needsUpdate = false;
    }
  }
  
  /**
   * Dispose light resources
   */
  dispose() {
    // Cleanup shadow maps if any
    if (this.shadow && this.shadow.map) {
      this.shadow.map.dispose();
      this.shadow.map = null;
    }
    
    // Clear uniforms
    this.uniforms = null;
  }
}
