/**
 * SpotLight
 * Conical spotlight with angle-based attenuation and shadow casting
 * Emits light in a focused cone shape with smooth falloff
 */

import { Color, Vec3, MathUtils, Ray } from '../extras/helpers.ts';
import { PointLight } from './PointLight.js';

export class SpotLight extends PointLight {
  /**
   * Create a new SpotLight
   * @param {number|Color} intensity - Light intensity or Color instance
   * @param {Color|string|number} color - Light color
   * @param {Vec3|Object} position - Light position
   * @param {Vec3|Object} target - Light target position
   * @param {number} angle - Spot angle in radians
   * @param {number} penumbra - Soft edge falloff (0.0 to 1.0)
   * @param {number} distance - Maximum effective distance (0 = infinite)
   * @param {number} decay - How fast light intensity decreases with distance
   */
  constructor(
    intensity = 1.0,
    color = 0xffffff,
    position = new Vec3(0, 0, 0),
    target = new Vec3(0, 0, -1),
    angle = Math.PI / 6, // 30 degrees
    penumbra = 0.3,
    distance = 0,
    decay = 2
  ) {
    // Initialize parent PointLight
    super(intensity, color, position, distance, decay);
    
    this.type = 'SpotLight';
    
    // Spotlight-specific properties
    this.target = target instanceof Vec3 ? target.clone() : new Vec3(target.x || 0, target.y || 0, target.z || -1);
    this.angle = MathUtils.clamp(angle, 0, Math.PI / 2); // Max 90 degrees
    this.penumbra = MathUtils.clamp(penumbra, 0, 1);
    
    // Cone properties
    this.cosAngle = Math.cos(this.angle);
    this.cosPenumbra = Math.cos(this.angle * (1 - this.penumbra));
    this.range = this.distance > 0 ? this.distance : 100.0;
    
    // Direction and orientation
    this.direction = this.target.clone().sub(this.position).normalize();
    
    // Spotlight shadow mapping (single directional shadow)
    this.shadow = {
      enabled: true,
      mapSize: 1024,
      bias: 0.001,
      radius: 2,
      intensity: 1.0,
      near: 0.1,
      far: 50
    };
    
    // Performance optimization
    this._affectedObjects = new Set();
    this._lastUpdateTime = 0;
    
    // Shader integration
    this._shaderUniforms = {};
    this._needsShaderUpdate = true;
    this._shadowMatrix = null;
  }

  /**
   * Set spotlight target position
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
    this._updateDirection();
    this._needsShaderUpdate = true;
  }

  /**
   * Set spotlight angle
   * @param {number} angle - Angle in radians
   */
  setAngle(angle) {
    this.angle = MathUtils.clamp(angle, 0, Math.PI / 2);
    this.cosAngle = Math.cos(this.angle);
    this.cosPenumbra = Math.cos(this.angle * (1 - this.penumbra));
    this._needsShaderUpdate = true;
  }

  /**
   * Set penumbra (soft edge falloff)
   * @param {number} penumbra - Penumbra factor (0.0 to 1.0)
   */
  setPenumbra(penumbra) {
    this.penumbra = MathUtils.clamp(penumbra, 0, 1);
    this.cosPenumbra = Math.cos(this.angle * (1 - this.penumbra));
    this._needsShaderUpdate = true;
  }

  /**
   * Update direction vector from position to target
   * @private
   */
  _updateDirection() {
    this.direction = this.target.clone().sub(this.position).normalize();
  }

  /**
   * Calculate cone angle for a given point
   * @param {Vec3} point - Point to check
   * @returns {number} Angle from spotlight axis to point
   */
  calculateConeAngle(point) {
    const pointDir = point.clone().sub(this.position).normalize();
    return Math.acos(MathUtils.clamp(this.direction.dot(pointDir), -1, 1));
  }

  /**
   * Check if a point is within the spotlight cone
   * @param {Vec3} point - Point to check
   * @returns {boolean} True if point is in cone
   */
  isInCone(point) {
    const distance = this.position.distanceTo(point);
    
    if (this.distance > 0 && distance > this.distance) {
      return false;
    }
    
    const coneAngle = this.calculateConeAngle(point);
    return coneAngle <= this.angle;
  }

  /**
   * Calculate angle-based attenuation for spotlight
   * @param {Vec3} worldPosition - World position of fragment
   * @returns {number} Angle attenuation factor (0.0 to 1.0)
   */
  calculateAngleAttenuation(worldPosition) {
    const coneAngle = this.calculateConeAngle(worldPosition);
    
    // Outside the main cone
    if (coneAngle > this.angle) {
      return 0;
    }
    
    // Inside the core cone (no attenuation)
    if (coneAngle <= this.angle * (1 - this.penumbra)) {
      return 1;
    }
    
    // In the penumbra region (smooth falloff)
    const penumbraAngle = this.angle - coneAngle;
    const penumbraRange = this.angle * this.penumbra;
    const falloff = penumbraAngle / penumbraRange;
    
    return MathUtils.clamp(falloff, 0, 1);
  }

  /**
   * Calculate total attenuation (angle + distance)
   * @param {Vec3} worldPosition - World position of fragment
   * @returns {Object} Attenuation information
   */
  calculateTotalAttenuation(worldPosition) {
    const distanceAttenuation = super.calculateAttenuation(worldPosition);
    const angleAttenuation = this.calculateAngleAttenuation(worldPosition);
    
    return {
      total: distanceAttenuation * angleAttenuation,
      distance: distanceAttenuation,
      angle: angleAttenuation
    };
  }

  /**
   * Calculate light contribution for a fragment
   * @param {Object} fragmentData - Fragment information
   * @returns {Object} Light contribution and properties
   */
  calculateContribution(fragmentData) {
    const { position, normal, cameraPosition } = fragmentData;
    
    // Check if fragment is in cone
    if (!this.isInCone(position)) {
      return {
        diffuse: new Color(0, 0, 0),
        specular: new Color(0, 0, 0),
        ambient: new Color(0, 0, 0),
        attenuation: 0,
        angleAttenuation: 0,
        distance: this.position.distanceTo(position),
        direction: this.direction.clone()
      };
    }
    
    // Calculate basic point light contributions
    const pointContrib = super.calculateContribution(fragmentData);
    
    // Apply angle attenuation
    const angleAttenuation = this.calculateAngleAttenuation(position);
    const totalAttenuation = this.calculateTotalAttenuation(position);
    
    // Adjust calculations for spotlight
    pointContrib.diffuse.multiplyScalar(angleAttenuation);
    pointContrib.specular.multiplyScalar(angleAttenuation);
    pointContrib.ambient.multiplyScalar(angleAttenuation * 0.1);
    pointContrib.attenuation = totalAttenuation.total;
    pointContrib.angleAttenuation = angleAttenuation;
    pointContrib.direction = this.direction.clone();
    
    return pointContrib;
  }

  /**
   * Get spot volume cone for visualization
   * @returns {Object} Cone geometry data
   */
  getSpotVolume() {
    const radius = Math.tan(this.angle) * this.range;
    const innerRadius = Math.tan(this.angle * (1 - this.penumbra)) * this.range;
    
    return {
      position: this.position.clone(),
      direction: this.direction.clone(),
      angle: this.angle,
      penumbra: this.penumbra,
      range: this.range,
      radius: radius,
      innerRadius: innerRadius,
      height: this.range
    };
  }

  /**
   * Create spotlight projection matrix for shadow mapping
   * @returns {Object} Shadow matrix data
   */
  createProjectionMatrix() {
    const aspect = 1; // Square shadow map
    const fov = this.angle * 2; // Convert to full angle
    const near = this.shadow.near;
    const far = this.shadow.far;
    
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, (2 * far * near) * nf,
      0, 0, -1, 0
    ];
  }

  /**
   * Create view matrix for shadow camera
   * @returns {Array<number>} View matrix (column-major)
   */
  createViewMatrix() {
    const forward = this.direction.clone();
    const up = new Vec3(0, 1, 0);
    
    // Ensure up is not parallel to forward
    if (Math.abs(forward.dot(up)) > 0.9) {
      up.set(1, 0, 0);
    }
    
    const right = forward.clone().cross(up).normalize();
    const correctedUp = right.clone().cross(forward).normalize();
    
    // Column-major matrix
    return [
      right.x, correctedUp.x, -forward.x, 0,
      right.y, correctedUp.y, -forward.y, 0,
      right.z, correctedUp.z, -forward.z, 0,
      -this.position.dot(right), -this.position.dot(correctedUp), this.position.dot(forward), 1
    ];
  }

  /**
   * Get shadow camera properties
   * @returns {Object} Shadow camera configuration
   */
  getShadowCamera() {
    return {
      position: this.position.clone(),
      target: this.target.clone(),
      up: new Vec3(0, 1, 0),
      fov: this.angle * 2,
      near: this.shadow.near,
      far: this.shadow.far
    };
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
    
    // Start with parent point light uniforms
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
      [`${lightId}_target`]: {
        value: [this.target.x, this.target.y, this.target.z],
        type: 'vec3',
        needsUpdate: true
      },
      [`${lightId}_direction`]: {
        value: [this.direction.x, this.direction.y, this.direction.z],
        type: 'vec3',
        needsUpdate: true
      },
      [`${lightId}_angle`]: {
        value: this.angle,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_cosAngle`]: {
        value: this.cosAngle,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_penumbra`]: {
        value: this.penumbra,
        type: 'float',
        needsUpdate: true
      },
      [`${lightId}_cosPenumbra`]: {
        value: this.cosPenumbra,
        type: 'float',
        needsUpdate: true
      }
    };

    // Add parent point light attenuation uniforms
    const pointUniforms = super.getShaderUniforms();
    Object.keys(pointUniforms).forEach(key => {
      if (!key.includes('position') && !key.includes('color') && !key.includes('intensity')) {
        this._shaderUniforms[key] = pointUniforms[key];
      }
    });

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

    this._needsShaderUpdate = true;
    return this._shaderUniforms;
  }

  /**
   * Get GLSL shader code for spot light
   * @returns {string} Fragment shader code
   */
  getShaderCode() {
    return `
      struct SpotLight {
        vec3 color;
        float intensity;
        vec3 position;
        vec3 target;
        vec3 direction;
        float angle;
        float cosAngle;
        float penumbra;
        float cosPenumbra;
        float distance;
        float decay;
        float constant;
        float linear;
        float quadratic;
        bool castShadow;
      };
      
      float calculateSpotLightAngleAttenuation(
        SpotLight light,
        vec3 surfacePos
      ) {
        vec3 lightToSurface = normalize(surfacePos - light.position);
        float angle = acos(clamp(dot(-light.direction, lightToSurface), -1.0, 1.0));
        
        // Outside the main cone
        if (angle > light.angle) {
          return 0.0;
        }
        
        // Inside the core cone
        if (angle <= light.angle * (1.0 - light.penumbra)) {
          return 1.0;
        }
        
        // In penumbra region
        float penumbraAngle = light.angle - angle;
        float penumbraRange = light.angle * light.penumbra;
        return clamp(penumbraAngle / penumbraRange, 0.0, 1.0);
      }
      
      float calculateSpotLightAttenuation(
        SpotLight light,
        vec3 surfacePos
      ) {
        float distanceAtten = calculatePointLightAttenuation(light, surfacePos);
        float angleAtten = calculateSpotLightAngleAttenuation(light, surfacePos);
        return distanceAtten * angleAtten;
      }
      
      vec3 calculateSpotLight(
        SpotLight light,
        vec3 normal,
        vec3 viewDir,
        vec3 surfacePos,
        float shininess
      ) {
        vec3 lightDir = normalize(light.position - surfacePos);
        
        // Check if surface is in spotlight cone
        float angleAtten = calculateSpotLightAngleAttenuation(light, surfacePos);
        if (angleAtten <= 0.0) {
          return vec3(0.0);
        }
        
        float attenuation = calculateSpotLightAttenuation(light, surfacePos);
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
        
        vec3 diffuse = light.color * diff * light.intensity * attenuation;
        vec3 specular = light.color * spec * light.intensity * attenuation * 0.3;
        vec3 ambient = light.color * 0.1 * light.intensity * attenuation;
        
        return diffuse + specular + ambient;
      }
      
      float calculateSpotLightShadow(
        SpotLight light,
        vec3 normal,
        vec3 surfacePos,
        sampler2D shadowMap,
        mat4 lightSpaceMatrix
      ) {
        // Transform surface position to light space
        vec4 lightSpacePos = lightSpaceMatrix * vec4(surfacePos, 1.0);
        
        // Project to get texture coordinates
        vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
        projCoords = projCoords * 0.5 + 0.5;
        
        // Check if position is outside shadow map
        if (projCoords.x < 0.0 || projCoords.x > 1.0 || 
            projCoords.y < 0.0 || projCoords.y > 1.0) {
          return 1.0;
        }
        
        float currentDepth = projCoords.z;
        float bias = light.shadowBias;
        
        // Sample shadow map
        float shadowDepth = texture(shadowMap, projCoords.xy).r;
        
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
    
    // Update direction
    this._updateDirection();
    
    // Update shadow matrix if shadows enabled
    if (this.castShadow && this.shadow.enabled) {
      this._updateShadowMatrix();
    }
    
    // Update light animation
    this._updateLightAnimation(deltaTime);
  }

  /**
   * Update shadow projection matrix
   * @private
   */
  _updateShadowMatrix() {
    this._shadowMatrix = {
      view: this.createViewMatrix(),
      projection: this.createProjectionMatrix()
    };
  }

  /**
   * Update light animation (override for custom behavior)
   * @private
   */
  _updateLightAnimation(deltaTime) {
    // Override this method to add animation behavior
    // For example: scanning, rotating, or following targets
  }

  /**
   * Dispose of light resources
   */
  dispose() {
    this._affectedObjects.clear();
    this._shaderUniforms = {};
    this._shadowMatrix = null;
  }

  /**
   * Clone this light
   * @returns {SpotLight} New spot light with same properties
   */
  clone() {
    const light = new SpotLight(
      this.intensity,
      this.color.clone(),
      this.position.clone(),
      this.target.clone(),
      this.angle,
      this.penumbra,
      this.distance,
      this.decay
    );
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
      target: this.target,
      angle: this.angle,
      penumbra: this.penumbra,
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
