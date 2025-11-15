/**
 * LightUniforms class
 * Manages shader uniforms for lighting calculations
 */

export class LightUniforms {
  constructor(maxLights = 8) {
    this.maxLights = maxLights;
    this.uniforms = this._createUniformStructure();
    this.lightArray = [];
    this.dirty = true;
  }
  
  /**
   * Create the uniform structure for shader programs
   */
  _createUniformStructure() {
    return {
      // Ambient light uniforms
      ambientLights: {
        value: [],
        length: this.maxLights
      },
      
      // Directional light uniforms
      directionalLights: {
        value: [],
        length: this.maxLights,
        shadowMaps: { value: [] },
        shadowMapSizes: { value: new Float32Array(this.maxLights) }
      },
      
      // Point light uniforms
      pointLights: {
        value: [],
        length: this.maxLights,
        distances: { value: new Float32Array(this.maxLights) },
        decays: { value: new Float32Array(this.maxLights) },
        shadowMaps: { value: [] },
        shadowMapSizes: { value: new Float32Array(this.maxLights) }
      },
      
      // Spot light uniforms
      spotLights: {
        value: [],
        length: this.maxLights,
        angles: { value: new Float32Array(this.maxLights) },
        penumbras: { value: new Float32Array(this.maxLights) },
        distances: { value: new Float32Array(this.maxLights) },
        decays: { value: new Float32Array(this.maxLights) },
        shadowMaps: { value: [] },
        shadowMapSizes: { value: new Float32Array(this.maxLights) }
      },
      
      // Hemisphere light uniforms
      hemisphereLights: {
        value: [],
        length: this.maxLights,
        groundColors: { value: [] }
      },
      
      // Rect area light uniforms
      rectAreaLights: {
        value: [],
        length: this.maxLights,
        widths: { value: new Float32Array(this.maxLights) },
        heights: { value: new Float32Array(this.maxLights) }
      },
      
      // Volume light uniforms
      volumeLights: {
        value: [],
        length: this.maxLights,
        volumeSizes: { value: new Float32Array(this.maxLights) },
        scatterings: { value: new Float32Array(this.maxLights) }
      },
      
      // Lighting configuration
      lightingConfig: {
        useShadows: { value: true },
        shadowType: { value: 2 }, // PCF Soft shadows
        maxShadows: { value: this.maxLights },
        environmentIntensity: { value: 1.0 },
        toneMappingEnabled: { value: true }
      },
      
      // Global lighting uniforms
      globalLighting: {
        ambientColor: { value: new Float32Array([0.2, 0.2, 0.2]) },
        ambientIntensity: { value: 0.3 },
        fogColor: { value: new Float32Array([0.5, 0.5, 0.5]) },
        fogDensity: { value: 0.0 }
      }
    };
  }
  
  /**
   * Get uniform structure for WebGL programs
   */
  getUniformStructure() {
    return {
      // Ambient lights
      ambientLightCount: { value: 0 },
      ambientLights: { value: [] },
      
      // Directional lights
      directionalLightCount: { value: 0 },
      directionalLights: { value: [] },
      directionalShadowMaps: { value: [] },
      directionalShadowMapSize: { value: 0 },
      
      // Point lights
      pointLightCount: { value: 0 },
      pointLights: { value: [] },
      pointLightDistances: { value: [] },
      pointLightDecays: { value: [] },
      pointShadowMaps: { value: [] },
      pointShadowMapSize: { value: 0 },
      
      // Spot lights
      spotLightCount: { value: 0 },
      spotLights: { value: [] },
      spotLightAngles: { value: [] },
      spotLightPenumbras: { value: [] },
      spotLightDistances: { value: [] },
      spotLightDecays: { value: [] },
      spotShadowMaps: { value: [] },
      spotShadowMapSize: { value: 0 },
      
      // Hemisphere lights
      hemisphereLightCount: { value: 0 },
      hemisphereLights: { value: [] },
      hemisphereGroundColors: { value: [] },
      
      // Rect area lights
      rectAreaLightCount: { value: 0 },
      rectAreaLights: { value: [] },
      rectAreaLightWidths: { value: [] },
      rectAreaLightHeights: { value: [] },
      
      // Volume lights
      volumeLightCount: { value: 0 },
      volumeLights: { value: [] },
      volumeLightSizes: { value: [] },
      volumeLightScattering: { value: [] },
      
      // Global lighting
      useShadows: { value: true },
      shadowType: { value: 2 },
      ambientColor: { value: new Float32Array([0.2, 0.2, 0.2]) },
      ambientIntensity: { value: 0.3 }
    };
  }
  
  /**
   * Get shader uniforms for a specific light
   */
  getLightUniforms(light, index = 0) {
    const type = light.type;
    
    switch (type) {
      case 'AmbientLight':
        return this._getAmbientLightUniforms(light, index);
      case 'DirectionalLight':
        return this._getDirectionalLightUniforms(light, index);
      case 'PointLight':
        return this._getPointLightUniforms(light, index);
      case 'SpotLight':
        return this._getSpotLightUniforms(light, index);
      case 'HemisphereLight':
        return this._getHemisphereLightUniforms(light, index);
      case 'RectAreaLight':
        return this._getRectAreaLightUniforms(light, index);
      case 'VolumeLight':
        return this._getVolumeLightUniforms(light, index);
      default:
        return {};
    }
  }
  
  /**
   * Get ambient light uniforms
   */
  _getAmbientLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity }
    };
  }
  
  /**
   * Get directional light uniforms
   */
  _getDirectionalLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity },
      direction: { value: new Float32Array([light.direction?.x || 0, light.direction?.y || 0, light.direction?.z || -1]) },
      shadowBias: { value: light.shadowBias || 0 },
      shadowMap: { value: light.shadowMap },
      shadowMapSize: { value: light.shadowMapSize || 1024 }
    };
  }
  
  /**
   * Get point light uniforms
   */
  _getPointLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity },
      position: { value: new Float32Array([light.position.x, light.position.y, light.position.z]) },
      distance: { value: light.distance || 0 },
      decay: { value: light.decay || 2 },
      shadowBias: { value: light.shadowBias || 0 },
      shadowMap: { value: light.shadowMap },
      shadowMapSize: { value: light.shadowMapSize || 1024 }
    };
  }
  
  /**
   * Get spot light uniforms
   */
  _getSpotLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity },
      position: { value: new Float32Array([light.position.x, light.position.y, light.position.z]) },
      direction: { value: new Float32Array([light.direction?.x || 0, light.direction?.y || 0, light.direction?.z || -1]) },
      angle: { value: light.angle || Math.PI / 6 },
      penumbra: { value: light.penumbra || 0.3 },
      distance: { value: light.distance || 0 },
      decay: { value: light.decay || 2 },
      shadowBias: { value: light.shadowBias || 0 },
      shadowMap: { value: light.shadowMap },
      shadowMapSize: { value: light.shadowMapSize || 1024 }
    };
  }
  
  /**
   * Get hemisphere light uniforms
   */
  _getHemisphereLightUniforms(light, index) {
    const skyColor = this._hexToRgb(light.color);
    const groundColor = this._hexToRgb(light.groundColor || '#444444');
    
    return {
      skyColor: { value: new Float32Array([skyColor[0] / 255, skyColor[1] / 255, skyColor[2] / 255]) },
      groundColor: { value: new Float32Array([groundColor[0] / 255, groundColor[1] / 255, groundColor[2] / 255]) },
      intensity: { value: light.intensity }
    };
  }
  
  /**
   * Get rect area light uniforms
   */
  _getRectAreaLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity },
      position: { value: new Float32Array([light.position.x, light.position.y, light.position.z]) },
      width: { value: light.width || 10 },
      height: { value: light.height || 10 }
    };
  }
  
  /**
   * Get volume light uniforms
   */
  _getVolumeLightUniforms(light, index) {
    const color = this._hexToRgb(light.color);
    return {
      color: { value: new Float32Array([color[0] / 255, color[1] / 255, color[2] / 255]) },
      intensity: { value: light.intensity },
      position: { value: new Float32Array([light.position.x, light.position.y, light.position.z]) },
      volumeSize: { value: light.volumeSize || 1.0 },
      scattering: { value: light.scattering || 0.1 }
    };
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
   * Add a light to the uniforms collection
   */
  addLight(light, index = null) {
    if (index === null) {
      index = this.lightArray.length;
      if (index >= this.maxLights) {
        console.warn('LightUniforms: Maximum light count exceeded');
        return false;
      }
    }
    
    this.lightArray[index] = light;
    this.dirty = true;
    return true;
  }
  
  /**
   * Remove a light from the uniforms collection
   */
  removeLight(light) {
    const index = this.lightArray.indexOf(light);
    if (index !== -1) {
      this.lightArray.splice(index, 1);
      this.dirty = true;
      return true;
    }
    return false;
  }
  
  /**
   * Update all light uniforms
   */
  updateFromLights(lights) {
    this._updateFromLightArray(lights);
    this.dirty = false;
  }
  
  /**
   * Update uniforms from light array
   */
  _updateFromLightArray(lights) {
    // Clear existing arrays
    Object.keys(this.uniforms).forEach(key => {
      if (Array.isArray(this.uniforms[key].value)) {
        this.uniforms[key].value = [];
      }
    });
    
    // Categorize and add lights
    lights.forEach(light => {
      if (!light.visible) return;
      
      const type = light.type;
      const uniforms = this.getLightUniforms(light);
      
      switch (type) {
        case 'AmbientLight':
          this.uniforms.ambientLights.value.push(uniforms);
          break;
        case 'DirectionalLight':
          this.uniforms.directionalLights.value.push(uniforms);
          if (light.castShadow && light.shadowMap) {
            this.uniforms.directionalLights.shadowMaps.value.push(light.shadowMap);
          }
          break;
        case 'PointLight':
          this.uniforms.pointLights.value.push(uniforms);
          this.uniforms.pointLights.distances.value[lights.indexOf(light)] = light.distance || 0;
          this.uniforms.pointLights.decays.value[lights.indexOf(light)] = light.decay || 2;
          if (light.castShadow && light.shadowMap) {
            this.uniforms.pointLights.shadowMaps.value.push(light.shadowMap);
          }
          break;
        case 'SpotLight':
          this.uniforms.spotLights.value.push(uniforms);
          this.uniforms.spotLights.angles.value[lights.indexOf(light)] = light.angle || Math.PI / 6;
          this.uniforms.spotLights.penumbras.value[lights.indexOf(light)] = light.penumbra || 0.3;
          this.uniforms.spotLights.distances.value[lights.indexOf(light)] = light.distance || 0;
          this.uniforms.spotLights.decays.value[lights.indexOf(light)] = light.decay || 2;
          if (light.castShadow && light.shadowMap) {
            this.uniforms.spotLights.shadowMaps.value.push(light.shadowMap);
          }
          break;
        case 'HemisphereLight':
          this.uniforms.hemisphereLights.value.push(uniforms);
          break;
        case 'RectAreaLight':
          this.uniforms.rectAreaLights.value.push(uniforms);
          this.uniforms.rectAreaLights.widths.value[lights.indexOf(light)] = light.width || 10;
          this.uniforms.rectAreaLights.heights.value[lights.indexOf(light)] = light.height || 10;
          break;
        case 'VolumeLight':
          this.uniforms.volumeLights.value.push(uniforms);
          this.uniforms.volumeLights.volumeSizes.value[lights.indexOf(light)] = light.volumeSize || 1.0;
          this.uniforms.volumeLights.scatterings.value[lights.indexOf(light)] = light.scattering || 0.1;
          break;
      }
    });
  }
  
  /**
   * Get lighting shader template
   */
  getShaderTemplate() {
    return {
      vertex: this._getVertexShader(),
      fragment: this._getFragmentShader()
    };
  }
  
  /**
   * Get vertex shader template for lighting
   */
  _getVertexShader() {
    return `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get fragment shader template for lighting
   */
  _getFragmentShader() {
    return `
      uniform vec3 ambientColor;
      uniform float ambientIntensity;
      uniform int directionalLightCount;
      uniform int pointLightCount;
      uniform int spotLightCount;
      uniform bool useShadows;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      struct DirectionalLight {
        vec3 color;
        float intensity;
        vec3 direction;
        float shadowBias;
      };
      
      struct PointLight {
        vec3 color;
        float intensity;
        vec3 position;
        float distance;
        float decay;
      };
      
      struct SpotLight {
        vec3 color;
        float intensity;
        vec3 position;
        vec3 direction;
        float angle;
        float penumbra;
        float distance;
        float decay;
      };
      
      uniform DirectionalLight directionalLights[8];
      uniform PointLight pointLights[8];
      uniform SpotLight spotLights[8];
      
      vec3 calculateDirectionalLight(vec3 normal, vec3 viewDir, DirectionalLight light) {
        float diff = max(dot(normal, -light.direction), 0.0);
        vec3 diffuse = light.color * diff * light.intensity;
        return diffuse;
      }
      
      vec3 calculatePointLight(vec3 normal, vec3 viewDir, PointLight light, vec3 fragPos) {
        vec3 lightDir = light.position - fragPos;
        float distance = length(lightDir);
        lightDir = normalize(lightDir);
        
        float diff = max(dot(normal, lightDir), 0.0);
        
        float attenuation = 1.0;
        if (light.distance > 0.0) {
          attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
        }
        
        attenuation *= pow(attenuation, light.decay);
        
        vec3 diffuse = light.color * diff * light.intensity * attenuation;
        return diffuse;
      }
      
      vec3 calculateSpotLight(vec3 normal, vec3 viewDir, SpotLight light, vec3 fragPos) {
        vec3 lightDir = light.position - fragPos;
        float distance = length(lightDir);
        lightDir = normalize(lightDir);
        
        float diff = max(dot(normal, lightDir), 0.0);
        float theta = dot(lightDir, -light.direction);
        float epsilon = light.angle - light.penumbra;
        float intensity = clamp((theta - light.penumbra) / epsilon, 0.0, 1.0);
        
        float attenuation = 1.0;
        if (light.distance > 0.0) {
          attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
        }
        
        attenuation *= pow(attenuation, light.decay);
        
        vec3 diffuse = light.color * diff * light.intensity * intensity * attenuation;
        return diffuse;
      }
      
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);
        
        // Base ambient lighting
        vec3 lighting = ambientColor * ambientIntensity;
        
        // Directional lights
        for (int i = 0; i < directionalLightCount; i++) {
          lighting += calculateDirectionalLight(normal, viewDir, directionalLights[i]);
        }
        
        // Point lights
        for (int i = 0; i < pointLightCount; i++) {
          lighting += calculatePointLight(normal, viewDir, pointLights[i], vPosition);
        }
        
        // Spot lights
        for (int i = 0; i < spotLightCount; i++) {
          lighting += calculateSpotLight(normal, viewDir, spotLights[i], vPosition);
        }
        
        // Output final lighting
        gl_FragColor = vec4(lighting, 1.0);
      }
    `;
  }
  
  /**
   * Clear all lights
   */
  clear() {
    this.lightArray = [];
    this.dirty = true;
  }
  
  /**
   * Dispose uniforms
   */
  dispose() {
    this.clear();
    // Dispose any WebGL resources if needed
  }
}
