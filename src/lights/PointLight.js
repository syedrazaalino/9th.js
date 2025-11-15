/**
 * PointLight
 * Omnidirectional point light with distance-based attenuation
 * Emits light equally in all directions from a single point
 */

import { Color, Vec3, MathUtils, Ray } from '../extras/helpers.ts';

export class PointLight {
  /**
   * Create a new PointLight
   * @param {number|Color} intensity - Light intensity or Color instance
   * @param {Color|string|number} color - Light color
   * @param {Vec3|Object} position - Light position
   * @param {number} distance - Maximum effective distance (0 = infinite)
   * @param {number} decay - How fast light intensity decreases with distance
   */
  constructor(intensity = 1.0, color = 0xffffff, position = new Vec3(0, 0, 0), distance = 0, decay = 2) {
    this.type = 'PointLight';
    this.castShadow = true; // Point lights can cast shadows
    
    // Handle different parameter formats
    if (intensity instanceof Color) {
      this.color = intensity;
      this.intensity = 1.0;
    } else {
      this.intensity = typeof intensity === 'number' ? intensity : 1.0;
      this.color = this._parseColor(color);
    }

    // Position and attenuation properties
    this.position = position instanceof Vec3 ? position.clone() : new Vec3(position.x || 0, position.y || 0, position.z || 0);
    this.distance = Math.max(0, distance); // 0 = infinite
    this.decay = Math.max(0.1, decay); // Prevent zero decay

    // Inverse square law parameters
    this.constant = 1.0;
    this.linear = 0.0;
    this.quadratic = 1.0; // Quadratic falloff is most realistic
    
    // Shadow mapping properties (omnidirectional shadows)
    this.shadow = {
      enabled: true,
      mapSize: 512,
      cubeMapSize: 256,
      bias: 0.01,
      radius: 15,
      intensity: 1.0,
      near: 0.5,
      far: 50
    };

    // Light distribution
    this.angle = 4 * Math.PI; // Full sphere (4π steradians)
    this.isOmnidirectional = true;

    // Shader integration
    this._shaderUniforms = {};
    this._needsShaderUpdate = true;
    this._shadowCubeMap = null;

    // Performance optimization
    this.affectedObjects = new Set();
    this._lastUpdateTime = 0;
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
        'orange': 0xff8000,
        'purple': 0x8000ff,
        'pink': 0xff80c0,
        'warm': 0xfff8dc,
        'cool': 0xe6f3ff,
        'candle': 0xffdfa0,
        'tungsten': 0xd4af37
      };
      return new Color().setHex(colorMap[color.toLowerCase()] || 0xffffff);
    } else if (typeof color === 'number') {
      return new Color().setHex(color);
    } else {
      return new Color(1, 1, 1);
    }
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
   * Set distance parameters for attenuation
   * @param {number} distance - Maximum effective distance (0 = infinite)
   * @param {number} decay - Decay rate
   */
  setAttenuation(distance = 0, decay = 2) {
    this.distance = Math.max(0, distance);
    this.decay = Math.max(0.1, decay);
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
   * Calculate distance-based attenuation using inverse square law
   * @param {Vec3} worldPosition - World position of fragment
   * @returns {number} Attenuation factor (0.0 to 1.0)
   */
  calculateAttenuation(worldPosition) {
    // Calculate distance from light to fragment
    const distance = this.position.distanceTo(worldPosition);
    
    // If beyond maximum distance and distance is set, return 0
    if (this.distance > 0 && distance > this.distance) {
      return 0;
    }
    
    // Inverse square law with custom decay
    // I = I0 / (constant + linear * d + quadratic * d^2)
    let attenuation = 1.0 / (
      this.constant + 
      this.linear * distance + 
      this.quadratic * distance * distance * this.decay
    );
    
    // Additional exponential falloff for smoother cutoff
    if (this.distance > 0) {
      const falloff = Math.exp(-distance / (this.distance * 0.5));
      attenuation *= falloff;
    }
    
    return MathUtils.clamp(attenuation, 0, 1);
  }

  /**
   * Calculate distance to light for optimization purposes
   * @param {Vec3} position - Position to check
   * @returns {number} Distance to light
   */
  distanceTo(position) {
    return this.position.distanceTo(position);
  }

  /**
   * Check if light affects a position
   * @param {Vec3} position - Position to check
   * @returns {boolean} True if light affects position
   */
  affectsPosition(position) {
    if (this.distance > 0) {
      return this.distanceTo(position) <= this.distance;
    }
    return true; // Infinite distance
  }

  /**
   * Calculate light contribution for a fragment
   * @param {Object} fragmentData - Fragment information
   * @returns {Object} Light contribution and properties
   */
  calculateContribution(fragmentData) {
    const { position, normal, cameraPosition } = fragmentData;
    
    // Calculate direction from light to fragment
    const lightDir = this.position.clone().sub(position).normalize();
    
    // Calculate surface to light direction (opposite of lightDir)
    const surfaceToLight = position.clone().sub(this.position).normalize();
    
    // Distance from fragment to light
    const distance = this.position.distanceTo(position);
    
    // Lambertian reflection
    const diffuse = Math.max(0, normal.dot(lightDir.multiplyScalar(-1)));
    
    // Attenuation
    const attenuation = this.calculateAttenuation(position);
    
    // Specular calculation (Blinn-Phong)
    const viewDir = cameraPosition.clone().sub(position).normalize();
    const halfwayDir = lightDir.clone().multiplyScalar(-1).add(viewDir).normalize();
    const specular = Math.pow(Math.max(0, normal.dot(halfwayDir)), 32);
    
    const result = {
      diffuse: this.color.clone().multiplyScalar(diffuse * this.intensity * attenuation),
      specular: this.color.clone().multiplyScalar(specular * this.intensity * attenuation * 0.3),
      ambient: this.color.clone().multiplyScalar(0.05 * this.intensity * attenuation),
      attenuation: attenuation,
      distance: distance,
      direction: lightDir
    };
    
    return result;
  }

  /**
   * Get omnidirectional shadow directions (6 faces of cube map)
   * @returns {Array<Vec3>} Array of 6 direction vectors
   */
  getShadowDirections() {
    return [
      new Vec3(1, 0, 0),   // +X
      new Vec3(-1, 0, 0),  // -X
      new Vec3(0, 1, 0),   // +Y
      new Vec3(0, -1, 0),  // -Y
      new Vec3(0, 0, 1),   // +Z
      new Vec3(0, 0, -1)   // -Z
    ];
  }

  /**
   * Get shadow camera properties for all 6 directions
   * @returns {Array<Object>} Shadow camera configurations
   */
  getShadowCameras() {
    const directions = this.getShadowDirections();
    const cameras = [];
    
    for (let i = 0; i < 6; i++) {
      const dir = directions[i];
      const target = this.position.clone().add(dir);
      
      // Calculate up vector
      let up = new Vec3(0, 1, 0);
      if (Math.abs(dir.y) > 0.9) {
        up = new Vec3(1, 0, 0);
      }
      
      cameras.push({
        position: this.position.clone(),
        target: target,
        up: up,
        near: this.shadow.near,
        far: this.shadow.far,
        fov: 90 // 90 degrees for cube map faces
      });
    }
    
    return cameras;
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
      [`${lightId}_position`]: {
        value: [this.position.x, this.position.y, this.position.z],
        type: 'vec3',
        needsUpdate: true
      },
      [`${lightId}_distance`]: {
        value: this.distance,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_decay`]: {
        value: this.decay,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_constant`]: {
        value: this.constant,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_linear`]: {
        value: this.linear,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_quadratic`]: {
        value: this.quadratic,
        type: 'float',
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
      this._shaderUniforms[`${lightId}_shadowBias`] = {
        value: this.shadow.bias,
        type: 'float',
        needsUpdate: true
      };
    }

    this._needsShaderUpdate = false;
    return this._shaderUniforms;
  }

  /**
   * Get GLSL shader code for point light
   * @returns {string} Fragment shader code
   */
  getShaderCode() {
    return `
      struct PointLight {
        vec3 color;
        float intensity;
        vec3 position;
        float distance;
        float decay;
        float constant;
        float linear;
        float quadratic;
        bool castShadow;
      };
      
      float calculatePointLightAttenuation(
        PointLight light,
        vec3 surfacePos
      ) {
        float distance = length(light.position - surfacePos);
        
        if (light.distance > 0.0 && distance > light.distance) {
          return 0.0;
        }
        
        float attenuation = 1.0 / (
          light.constant +
          light.linear * distance +
          light.quadratic * distance * distance * light.decay
        );
        
        if (light.distance > 0.0) {
          float falloff = exp(-distance / (light.distance * 0.5));
          attenuation *= falloff;
        }
        
        return clamp(attenuation, 0.0, 1.0);
      }
      
      vec3 calculatePointLight(
        PointLight light,
        vec3 normal,
        vec3 viewDir,
        vec3 surfacePos,
        float shininess
      ) {
        vec3 lightDir = normalize(light.position - surfacePos);
        
        float attenuation = calculatePointLightAttenuation(light, surfacePos);
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
        
        vec3 diffuse = light.color * diff * light.intensity * attenuation;
        vec3 specular = light.color * spec * light.intensity * attenuation * 0.3;
        vec3 ambient = light.color * 0.05 * light.intensity * attenuation;
        
        return diffuse + specular + ambient;
      }
      
      float calculatePointLightShadow(
        PointLight light,
        vec3 normal,
        vec3 surfacePos,
        samplerCube shadowMap
      ) {
        // Omnidirectional shadow calculation
        vec3 lightToSurface = surfacePos - light.position;
        float distance = length(lightToSurface);
        vec3 direction = normalize(lightToSurface);
        
        // Sample shadow map in the direction of the surface
        float shadowDepth = textureCube(shadowMap, direction).r * 50.0; // 50.0 is far plane
        float currentDepth = distance;
        
        // Apply bias to reduce shadow acne
        float bias = 0.01;
        return currentDepth - bias > shadowDepth ? 0.3 : 1.0;
      }
    `;
  }

  /**
   * Update light (called each frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    this._lastUpdateTime += deltaTime;
    
    // Update shadow maps if needed
    if (this.castShadow && this.shadow.enabled && this._lastUpdateTime > 0.1) {
      this._updateShadowCubeMap();
      this._lastUpdateTime = 0;
    }
    
    // Animate light position if desired
    this._updateLightAnimation(deltaTime);
  }

  /**
   * Update shadow cube map for omnidirectional shadows
   * @private
   */
  _updateShadowCubeMap() {
    // Implementation would render scene from 6 directions
    // and store in cube map texture
    this._shadowCubeMap = {
      size: this.shadow.cubeMapSize,
      near: this.shadow.near,
      far: this.shadow.far
    };
  }

  /**
   * Update light animation (override for custom behavior)
   * @private
   */
  _updateLightAnimation(deltaTime) {
    // Override this method to add animation behavior
    // For example: flickering, pulsing, or movement
  }

  /**
   * Create a ray from light to position for shadow calculations
   * @param {Vec3} targetPosition - Target position
   * @returns {Ray} Ray from light to target
   */
  createShadowRay(targetPosition) {
    const direction = targetPosition.clone().sub(this.position).normalize();
    return new Ray(this.position.clone(), direction);
  }

  /**
   * Dispose of light resources
   */
  dispose() {
    this.affectedObjects.clear();
    this._shaderUniforms = {};
    this._shadowCubeMap = null;
  }

  /**
   * Clone this light
   * @returns {PointLight} New point light with same properties
   */
  clone() {
    const light = new PointLight(
      this.intensity,
      this.color.clone(),
      this.position.clone(),
      this.distance,
      this.decay
    );
    light.constant = this.constant;
    light.linear = this.linear;
    light.quadratic = this.quadratic;
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
      position: this.position,
      distance: this.distance,
      decay: this.decay,
      constant: this.constant,
      linear: this.linear,
      quadratic: this.quadratic,
      castShadow: this.castShadow,
      shadow: this.shadow
    };
  }
}
