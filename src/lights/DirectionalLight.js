/**
 * DirectionalLight
 * Sun-like directional light with parallel rays
 * Supports shadow casting and realistic distance attenuation
 */

import { Color, Vec3, MathUtils } from '../extras/helpers.ts';

export class DirectionalLight {
  /**
   * Create a new DirectionalLight
   * @param {number|Color} intensity - Light intensity or Color instance
   * @param {Color|string|number} color - Light color
   * @param {Vec3|Object} direction - Light direction vector
   */
  constructor(intensity = 1.0, color = 0xffffff, direction = new Vec3(-1, -1, -1)) {
    this.type = 'DirectionalLight';
    this.castShadow = true; // Directional lights can cast shadows
    
    // Handle different parameter formats
    if (intensity instanceof Color) {
      this.color = intensity;
      this.intensity = 1.0;
    } else {
      this.intensity = typeof intensity === 'number' ? intensity : 1.0;
      this.color = this._parseColor(color);
    }

    // Directional properties
    this.direction = direction instanceof Vec3 ? direction.clone() : new Vec3(direction.x || -1, direction.y || -1, direction.z || -1);
    this.direction.normalize();
    
    // Position for shadow mapping (sun position)
    this.position = new Vec3(10, 10, 10);
    this.target = new Vec3(0, 0, 0);

    // Shadow mapping properties
    this.shadow = {
      enabled: true,
      mapSize: 2048,
      camera: {
        left: -50,
        right: 50,
        top: 50,
        bottom: -50,
        near: 0.1,
        far: 200
      },
      bias: 0.0001,
      radius: 4,
      intensity: 1.0
    };

    // Light distribution
    this.halfLife = 10.0; // Distance where intensity drops to half
    this.maxDistance = 100.0; // Maximum effective distance

    // Shader integration
    this._shaderUniforms = {};
    this._needsShaderUpdate = true;
    this._shadowMatrix = null;

    // Affected objects for optimization
    this.affectedObjects = new Set();
  }

  /**
   * Parse color from various formats
   * @private
   */
  _parseColor(color) {
    if (color instanceof Color) {
      return color.clone();
    } else if (typeof color === 'string') {
      if (color.startsWith('#')) {
        const hex = parseInt(color.slice(1), 16);
        return new Color().setHex(hex);
      }
      const colorMap = {
        'white': 0xffffff,
        'black': 0x000000,
        'red': 0xff0000,
        'green': 0x00ff00,
        'blue': 0x0000ff,
        'yellow': 0xffff00,
        'cyan': 0x00ffff,
        'magenta': 0xff00ff,
        'warm': 0xfff8dc, // Warm white
        'cool': 0xe6f3ff  // Cool white
      };
      return new Color().setHex(colorMap[color.toLowerCase()] || 0xffffff);
    } else if (typeof color === 'number') {
      return new Color().setHex(color);
    } else {
      return new Color(1, 1, 1);
    }
  }

  /**
   * Set light direction
   * @param {number|Vec3} x - X component or Vec3
   * @param {number} y - Y component
   * @param {number} z - Z component
   */
  setDirection(x, y, z) {
    if (typeof x === 'object' && x instanceof Vec3) {
      this.direction.copy(x);
    } else {
      this.direction.set(x, y, z);
    }
    this.direction.normalize();
    this._needsShaderUpdate = true;
  }

  /**
   * Set light position
   * @param {number|Vec3} x - X component or Vec3
   * @param {number} y - Y component
   * @param {number} z - Z component
   */
  setPosition(x, y, z) {
    if (typeof x === 'object' && x instanceof Vec3) {
      this.position.copy(x);
    } else {
      this.position.set(x, y, z);
    }
    this._needsShaderUpdate = true;
  }

  /**
   * Set light target
   * @param {number|Vec3} x - X component or Vec3
   * @param {number} y - Y component
   * @param {number} z - Z component
   */
  setTarget(x, y, z) {
    if (typeof x === 'object' && x instanceof Vec3) {
      this.target.copy(x);
    } else {
      this.target.set(x, y, z);
    }
    this._needsShaderUpdate = true;
  }

  /**
   * Configure shadow properties
   * @param {Object} options - Shadow configuration
   */
  configureShadow(options = {}) {
    Object.assign(this.shadow, options);
    this._needsShaderUpdate = true;
  }

  /**
   * Calculate distance-based attenuation for directional light
   * @param {Vec3} worldPosition - World position of fragment
   * @returns {number} Attenuation factor (0.0 to 1.0)
   */
  calculateAttenuation(worldPosition) {
    // Directional lights typically don't attenuate with distance
    // as they represent distant light sources like the sun
    // However, we can implement a slight falloff for realism
    
    const distance = worldPosition ? worldPosition.clone().sub(this.position).length() : 0;
    
    if (distance > this.maxDistance) {
      return 0;
    }
    
    // Exponential falloff for distant objects
    const falloff = Math.exp(-distance / this.halfLife);
    return MathUtils.clamp(falloff, 0, 1);
  }

  /**
   * Calculate light contribution for a fragment
   * @param {Object} fragmentData - Fragment information
   * @returns {Object} Light contribution and shadow factor
   */
  calculateContribution(fragmentData) {
    const { position, normal, cameraPosition } = fragmentData;
    
    // Calculate direction from light to fragment
    const lightDir = this.direction.clone().multiplyScalar(-1); // Light direction
    
    // Calculate surface to light direction
    const surfaceToLight = position.clone().sub(this.position).normalize();
    
    // Lambertian reflection
    const diffuse = Math.max(0, normal.dot(lightDir.clone().multiplyScalar(-1)));
    
    // Attenuation
    const attenuation = this.calculateAttenuation(position);
    
    // Combine intensity, color, and calculations
    const result = {
      diffuse: this.color.clone().multiplyScalar(diffuse * this.intensity * attenuation),
      ambient: this.color.clone().multiplyScalar(0.1 * this.intensity), // Small ambient component
      specular: null, // Specular handled by material
      attenuation: attenuation,
      direction: lightDir
    };
    
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

    const lightId = this.type.toLowerCase();
    
    this._shaderUniforms = {
      [`${lightId}_color`]: {
        value: [this.color.r, this.color.g, this.color.b],
        type: 'vec3',
        needsUpdate: true
      },
      [`${lightId}_intensity`]: {
        value: this.intensity,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_direction`]: {
        value: [this.direction.x, this.direction.y, this.direction.z],
        type: 'vec3',
        needsUpdate: true
      },
      [`${lightId}_position`]: {
        value: [this.position.x, this.position.y, this.position.z],
        type: 'vec3',
        needsUpdate: true
      }
    };

    // Shadow uniforms
    if (this.castShadow && this.shadow.enabled) {
      this._shaderUniforms[`${lightId}_castShadow`] = {
        value: true,
        type: 'bool',
        needsUpdate: true
      };
    }

    this._needsShaderUpdate = false;
    return this._shaderUniforms;
  }

  /**
   * Get GLSL shader code for directional light
   * @returns {string} Fragment shader code
   */
  getShaderCode() {
    return `
      struct DirectionalLight {
        vec3 color;
        float intensity;
        vec3 direction;
        vec3 position;
        bool castShadow;
      };
      
      vec3 calculateDirectionalLight(
        DirectionalLight light,
        vec3 normal,
        vec3 viewDir,
        vec3 surfacePos,
        float shininess
      ) {
        vec3 lightDir = normalize(-light.direction);
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
        
        vec3 diffuse = light.color * diff * light.intensity;
        vec3 specular = light.color * spec * light.intensity * 0.5;
        
        return diffuse + specular;
      }
      
      float calculateDirectionalShadow(
        DirectionalLight light,
        vec3 normal,
        vec3 surfacePos,
        sampler2D shadowMap
      ) {
        // Shadow calculation logic would go here
        // This is a simplified version
        return 1.0;
      }
    `;
  }

  /**
   * Get shadow camera properties for shadow mapping
   * @returns {Object} Shadow camera configuration
   */
  getShadowCamera() {
    return {
      position: this.position.clone(),
      target: this.target.clone(),
      up: new Vec3(0, 1, 0),
      ...this.shadow.camera
    };
  }

  /**
   * Update light (called each frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Update shadow matrix if needed
    if (this.castShadow && this.shadow.enabled) {
      this._updateShadowMatrix();
    }
    
    // Animate sun position for dynamic shadows
    this._updateSunPosition(deltaTime);
  }

  /**
   * Update shadow projection matrix
   * @private
   */
  _updateShadowMatrix() {
    // Implementation would create light space transformation matrix
    // This is a placeholder for the shadow mapping system
    this._shadowMatrix = {
      lightView: this._createViewMatrix(),
      lightProj: this._createProjectionMatrix()
    };
  }

  /**
   * Create view matrix for shadow camera
   * @private
   */
  _createViewMatrix() {
    // Simplified look-at matrix
    const forward = this.target.clone().sub(this.position).normalize();
    const up = new Vec3(0, 1, 0);
    const right = forward.clone().cross(up).normalize();
    const correctedUp = right.clone().cross(forward).normalize();
    
    return [
      right.x, correctedUp.x, -forward.x, 0,
      right.y, correctedUp.y, -forward.y, 0,
      right.z, correctedUp.z, -forward.z, 0,
      -this.position.dot(right), -this.position.dot(correctedUp), this.position.dot(forward), 1
    ];
  }

  /**
   * Create projection matrix for shadow camera
   * @private
   */
  _createProjectionMatrix() {
    const { left, right, top, bottom, near, far } = this.shadow.camera;
    
    const width = right - left;
    const height = top - bottom;
    const depth = far - near;
    
    return [
      2/width, 0, 0, 0,
      0, 2/height, 0, 0,
      0, 0, -2/depth, 0,
      -(right + left)/width, -(top + bottom)/height, -(far + near)/depth, 1
    ];
  }

  /**
   * Update sun position for time-of-day simulation
   * @private
   */
  _updateSunPosition(deltaTime) {
    // This could be enhanced to simulate sun movement throughout the day
    // For now, keeping static sun position
  }

  /**
   * Dispose of light resources
   */
  dispose() {
    this.affectedObjects.clear();
    this._shaderUniforms = {};
    this._shadowMatrix = null;
  }

  /**
   * Clone this light
   * @returns {DirectionalLight} New directional light with same properties
   */
  clone() {
    const light = new DirectionalLight(this.intensity, this.color.clone(), this.direction.clone());
    light.position = this.position.clone();
    light.target = this.target.clone();
    light.castShadow = this.castShadow;
    light.shadow = { ...this.shadow };
    return light;
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
      direction: this.direction,
      position: this.position,
      target: this.target,
      castShadow: this.castShadow,
      shadow: this.shadow
    };
  }
}
