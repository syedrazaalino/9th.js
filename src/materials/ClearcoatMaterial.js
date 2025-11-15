/**
 * ClearcoatMaterial
 * Advanced material for car paint, glass, and lacquer surfaces with clear coat layer
 * Simulates multi-layer materials with transparent protective coating on top of base material
 * 
 * Features:
 * - Clear coat layer with independent properties
 * - Separate roughness for base and clear coat layers
 * - UV coordinate support for clear coat maps
 * - Integration with PBR lighting model
 * - Transmission support for glass-like effects
 * 
 * @extends Material
 * @author WebGL Materials System
 * @version 1.0.0
 */

import { Material } from '../core/Material.js';

export class ClearcoatMaterial extends Material {
  /**
   * Create a new ClearcoatMaterial instance
   * @param {Object} options - Configuration options
   * @param {Array<number>} [options.color=[1,1,1]] - Base material color
   * @param {number} [options.opacity=1.0] - Material opacity
   * @param {boolean} [options.transparent=false] - Enable transparency
   * @param {number} [options.roughness=0.4] - Base surface roughness (0.0-1.0)
   * @param {number} [options.metalness=0.0] - Base metallic properties (0.0-1.0)
   * @param {number} [options.clearcoat=1.0] - Clear coat intensity (0.0-1.0)
   * @param {number} [options.clearcoatRoughness=0.1] - Clear coat surface roughness (0.0-1.0)
   * @param {number} [options.clearcoatIor=1.5] - Clear coat index of refraction
   * @param {number} [options.clearcoatThickness=0.1] - Clear coat thickness (0.0-1.0)
   * @param {number} [options.transmission=0.0] - Transmission amount (0.0-1.0)
   * @param {number} [options.ior=1.5] - Index of refraction for transmission
   * @param {Array<number>} [options.specularColor=[1,1,1]] - Specular reflection color
   * @param {number} [options.specularIntensity=1.0] - Specular reflection intensity
   * @param {Array<number>} [options.clearcoatColor=[1,1,1]] - Clear coat tint color
   * @param {number} [options.clearcoatSpecular=1.0] - Clear coat specular intensity
   * @param {Object} [options.map=null] - Base texture map
   * @param {Object} [options.clearcoatMap=null] - Clear coat properties map
   * @param {Object} [options.clearcoatRoughnessMap=null] - Clear coat roughness map
   * @param {Object} [options.clearcoatNormalMap=null] - Clear coat normal map
   * @param {Object} [options.normalMap=null] - Base normal map
   */
  constructor(options = {}) {
    super(null);

    // Base material properties
    this.color = options.color || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // PBR properties for base layer
    this.roughness = options.roughness !== undefined ? options.roughness : 0.4;
    this.metalness = options.metalness !== undefined ? options.metalness : 0.0;

    // Clear coat properties
    this.clearcoat = options.clearcoat !== undefined ? options.clearcoat : 1.0;
    this.clearcoatRoughness = options.clearcoatRoughness !== undefined ? options.clearcoatRoughness : 0.1;
    this.clearcoatIor = options.clearcoatIor !== undefined ? options.clearcoatIor : 1.5;
    this.clearcoatThickness = options.clearcoatThickness !== undefined ? options.clearcoatThickness : 0.1;
    this.clearcoatColor = options.clearcoatColor || [1, 1, 1];
    this.clearcoatSpecular = options.clearcoatSpecular !== undefined ? options.clearcoatSpecular : 1.0;

    // Transmission properties
    this.transmission = options.transmission !== undefined ? options.transmission : 0.0;
    this.ior = options.ior !== undefined ? options.ior : 1.5;
    this.specularColor = options.specularColor || [1, 1, 1];
    this.specularIntensity = options.specularIntensity !== undefined ? options.specularIntensity : 1.0;

    // Texture maps
    this.map = options.map || null;
    this.clearcoatMap = options.clearcoatMap || null;
    this.clearcoatRoughnessMap = options.clearcoatRoughnessMap || null;
    this.clearcoatNormalMap = options.clearcoatNormalMap || null;
    this.normalMap = options.normalMap || null;

    // UV transform properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.clearcoatMapTransform = options.clearcoatMapTransform || [0, 0, 1, 1, 0, 0];
    this.clearcoatRoughnessMapTransform = options.clearcoatRoughnessMapTransform || [0, 0, 1, 1, 0, 0];
    this.clearcoatNormalMapTransform = options.clearcoatNormalMapTransform || [0, 0, 1, 1, 0, 0];

    // Set up shader and uniforms
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for clearcoat material
   * @returns {Object} Shader object with vertex and fragment sources
   * @private
   */
  _createShader() {
    const vertexShader = `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      attribute vec3 tangent;
      attribute vec3 bitangent;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat3 normalMatrix;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vClearcoatUv;
      varying vec2 vClearcoatRoughnessUv;
      varying vec2 vClearcoatNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying mat3 vTBN;
      varying mat3 vClearcoatTBN;
      
      void main() {
        vUv = uv;
        vClearcoatUv = uv;
        vClearcoatRoughnessUv = uv;
        vClearcoatNormalUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        
        // Calculate TBN matrix for normal mapping
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
        vTBN = mat3(T, B, N);
        vClearcoatTBN = vTBN; // Same tangent space for clear coat
        
        // Calculate view position
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // Calculate world position
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      precision highp float;
      
      // Material properties
      uniform vec3 uColor;
      uniform vec3 uClearcoatColor;
      uniform vec3 uSpecularColor;
      uniform float uOpacity;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform float uClearcoat;
      uniform float uClearcoatRoughness;
      uniform float uClearcoatIor;
      uniform float uClearcoatThickness;
      uniform float uClearcoatSpecular;
      uniform float uTransmission;
      uniform float uIor;
      uniform float uSpecularIntensity;
      
      // Light uniforms
      uniform vec3 uAmbientLightColor;
      uniform vec3 uLightColor[8];
      uniform vec3 uLightPosition[8];
      uniform float uLightDistance[8];
      uniform float uLightDecay[8];
      uniform int uLightCount;
      uniform vec3 uCameraPosition;
      
      // Texture uniforms
      uniform bool uUseMap;
      uniform bool uUseClearcoatMap;
      uniform bool uUseClearcoatRoughnessMap;
      uniform bool uUseClearcoatNormalMap;
      uniform bool uUseNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uClearcoatMap;
      uniform sampler2D uClearcoatRoughnessMap;
      uniform sampler2D uClearcoatNormalMap;
      uniform sampler2D uNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uClearcoatUvTransform;
      uniform vec4 uClearcoatRoughnessUvTransform;
      uniform vec4 uClearcoatNormalUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vClearcoatUv;
      varying vec2 vClearcoatRoughnessUv;
      varying vec2 vClearcoatNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying mat3 vTBN;
      varying mat3 vClearcoatTBN;
      
      // Constants
      const float PI = 3.14159265359;
      const float c1 = 0.88622692545; // sqrt(PI/4)
      const float c2 = 0.41318139947; // sqrt(PI/9)
      const float EPSILON = 1e-6;
      
      // Texture coordinate transformation
      vec2 getUV(vec2 uv, vec4 transform) {
        return uv * transform.zw + transform.xy;
      }
      
      // Fresnel Schlick approximation
      vec3 fresnelSchlick(float cosTheta, vec3 F0) {
        return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
      }
      
      // Fresnel Schlick with grazing angle dependency
      vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
      }
      
      // Schlick fresnel for dielectrics
      float fresnelDielectric(float cosTheta, float ior) {
        float f0 = (ior - 1.0) / (ior + 1.0);
        f0 = f0 * f0;
        return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
      }
      
      // Normal Distribution Function - GGX/Trowbridge-Reitz
      float distributionGGX(vec3 N, vec3 H, float roughness) {
        float a = roughness * roughness;
        float a2 = a * a;
        float NdotH = max(dot(N, H), 0.0);
        float NdotH2 = NdotH * NdotH;
        
        float num = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;
        
        return num / denom;
      }
      
      // Geometry term - Smith Schlick GGX
      float geometrySchlickGGX(float NdotV, float roughness) {
        float r = (roughness + 1.0);
        float k = (r * r) / 8.0;
        
        float num = NdotV;
        float denom = NdotV * (1.0 - k) + k;
        
        return num / denom;
      }
      
      float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2 = geometrySchlickGGX(NdotV, roughness);
        float ggx1 = geometrySchlickGGX(NdotL, roughness);
        
        return ggx1 * ggx2;
      }
      
      // Cook-Torrance BRDF
      vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 albedo, float metallic, float roughness) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        vec3 F0 = mix(vec3(0.04), albedo, metallic);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
        float D = distributionGGX(N, H, roughness);
        float G = geometrySmith(N, V, L, roughness);
        
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + EPSILON;
        vec3 specular = numerator / denominator;
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;
        
        return (kD * albedo / PI + specular) * NdotL;
      }
      
      // Clear coat specific BRDF
      vec3 clearcoatBRDF(vec3 N, vec3 V, vec3 L, float clearcoat, float clearcoatRoughness, float ior) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        // Clear coat is typically dielectric
        float F = fresnelDielectric(max(dot(H, V), 0.0), ior);
        float D = distributionGGX(N, H, clearcoatRoughness);
        float G = geometrySmith(N, V, L, clearcoatRoughness);
        
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + EPSILON;
        vec3 specular = numerator / denominator;
        
        return specular * clearcoat * NdotL;
      }
      
      // Perturb normal using normal map
      vec3 perturbNormal(vec3 normal, vec3 viewDir, vec2 uv, mat3 TBN) {
        vec3 tangentNormal = texture2D(uNormalMap, getUV(uv, uUvTransform)).xyz * 2.0 - 1.0;
        return normalize(TBN * tangentNormal);
      }
      
      // Perturb clear coat normal using separate map
      vec3 perturbClearcoatNormal(vec3 normal, vec3 viewDir, vec2 uv, mat3 TBN) {
        vec3 tangentNormal = texture2D(uClearcoatNormalMap, getUV(uv, uClearcoatNormalUvTransform)).xyz * 2.0 - 1.0;
        return normalize(TBN * tangentNormal);
      }
      
      void main() {
        // Get base material properties
        vec3 albedo = uColor;
        float roughness = uRoughness;
        float metallic = uMetalness;
        float clearcoat = uClearcoat;
        float clearcoatRoughness = uClearcoatRoughness;
        
        // Apply base texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply clearcoat map
        #ifdef USE_CLEARCOAT_MAP
          vec2 clearcoatUV = getUV(vClearcoatUv, uClearcoatUvTransform);
          float clearcoatMapValue = texture2D(uClearcoatMap, clearcoatUV).r;
          clearcoat *= clearcoatMapValue;
        #endif
        
        // Apply clearcoat roughness map
        #ifdef USE_CLEARCOAT_ROUGHNESS_MAP
          vec2 clearcoatRoughnessUV = getUV(vClearcoatRoughnessUv, uClearcoatRoughnessUvTransform);
          float ccRoughnessMapValue = texture2D(uClearcoatRoughnessMap, clearcoatRoughnessUV).r;
          clearcoatRoughness *= ccRoughnessMapValue;
        #endif
        
        // Calculate normals
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        
        // Apply base normal mapping
        #ifdef USE_NORMAL_MAP
          N = perturbNormal(N, V, vUv, vTBN);
        #endif
        
        // Apply clearcoat normal mapping
        vec3 clearcoatNormal = N;
        #ifdef USE_CLEARCOAT_NORMAL_MAP
          clearcoatNormal = perturbClearcoatNormal(N, V, vClearcoatNormalUv, vClearcoatTBN);
        #endif
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        vec3 directLighting = vec3(0.0);
        vec3 clearcoatLighting = vec3(0.0);
        
        // Process each light
        for (int i = 0; i < 8; i++) {
          if (i >= uLightCount) break;
          
          vec3 lightDir;
          vec3 ldir = uLightPosition[i] - vWorldPosition;
          float dist = length(ldir);
          
          // Directional light
          if (uLightDistance[i] <= 0.0) {
            lightDir = normalize(-uLightPosition[i]);
          } else {
            // Point light
            lightDir = normalize(ldir);
          }
          
          // Calculate distance attenuation for point lights
          float attenuation = 1.0;
          if (uLightDistance[i] > 0.0) {
            attenuation = clamp(1.0 - dist / uLightDistance[i], 0.0, 1.0);
            attenuation *= uLightDecay[i];
          }
          
          // Base layer PBR lighting
          vec3 baseBRDF = cookTorranceBRDF(N, V, lightDir, albedo, metallic, roughness);
          directLighting += baseBRDF * uLightColor[i] * attenuation;
          
          // Clear coat layer lighting
          if (clearcoat > 0.0) {
            vec3 ccBRDF = clearcoatBRDF(clearcoatNormal, V, lightDir, clearcoat, clearcoatRoughness, uClearcoatIor);
            clearcoatLighting += ccBRDF * uClearcoatColor * uLightColor[i] * attenuation;
          }
        }
        
        // Ambient lighting
        vec3 ambient = uAmbientLightColor * albedo;
        
        // Apply transmission for glass-like materials
        if (uTransmission > 0.0) {
          vec3 transmissionColor = uSpecularColor * uTransmission;
          directLighting = mix(directLighting, transmissionColor, 0.3);
        }
        
        // Combine lighting components
        lighting = ambient + directLighting;
        
        // Add clear coat contribution
        lighting += clearcoatLighting;
        
        // Apply clear coat color and specular intensity
        lighting = mix(lighting, uClearcoatColor * uClearcoatSpecular, clearcoat * 0.1);
        
        // Apply final color with opacity
        vec4 color = vec4(lighting, uOpacity);
        
        gl_FragColor = color;
      }
    `;

    // Return shader object
    return {
      vertexSource: vertexShader,
      fragmentSource: fragmentShader,
      isReady: () => true,
      setUniform: () => {},
      getUniform: () => null,
      use: () => {},
      unuse: () => {},
      dispose: () => {}
    };
  }

  /**
   * Initialize material uniforms with default values
   * @private
   */
  _initializeUniforms() {
    this.setProperty('uColor', this.color);
    this.setProperty('uClearcoatColor', this.clearcoatColor);
    this.setProperty('uSpecularColor', this.specularColor);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uClearcoat', this.clearcoat);
    this.setProperty('uClearcoatRoughness', this.clearcoatRoughness);
    this.setProperty('uClearcoatIor', this.clearcoatIor);
    this.setProperty('uClearcoatThickness', this.clearcoatThickness);
    this.setProperty('uClearcoatSpecular', this.clearcoatSpecular);
    this.setProperty('uTransmission', this.transmission);
    this.setProperty('uIor', this.ior);
    this.setProperty('uSpecularIntensity', this.specularIntensity);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uClearcoatUvTransform', this.clearcoatMapTransform);
    this.setProperty('uClearcoatRoughnessUvTransform', this.clearcoatRoughnessMapTransform);
    this.setProperty('uClearcoatNormalUvTransform', this.clearcoatNormalMapTransform);
  }

  /**
   * Set clear coat intensity
   * @param {number} intensity - Clear coat intensity (0.0-1.0)
   */
  setClearcoat(intensity) {
    this.clearcoat = Math.max(0, Math.min(1, intensity));
    this.setProperty('uClearcoat', this.clearcoat);
    this.needsUpdate = true;
  }

  /**
   * Set clear coat roughness
   * @param {number} roughness - Clear coat surface roughness (0.0-1.0)
   */
  setClearcoatRoughness(roughness) {
    this.clearcoatRoughness = Math.max(0, Math.min(1, roughness));
    this.setProperty('uClearcoatRoughness', this.clearcoatRoughness);
    this.needsUpdate = true;
  }

  /**
   * Set clear coat index of refraction
   * @param {number} ior - Index of refraction (1.0+)
   */
  setClearcoatIor(ior) {
    this.clearcoatIor = Math.max(1.0, ior);
    this.setProperty('uClearcoatIor', this.clearcoatIor);
    this.needsUpdate = true;
  }

  /**
   * Set clear coat thickness
   * @param {number} thickness - Clear coat thickness (0.0-1.0)
   */
  setClearcoatThickness(thickness) {
    this.clearcoatThickness = Math.max(0, Math.min(1, thickness));
    this.setProperty('uClearcoatThickness', this.clearcoatThickness);
    this.needsUpdate = true;
  }

  /**
   * Set clear coat color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setClearcoatColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.clearcoatColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.clearcoatColor = color;
    }
    
    this.setProperty('uClearcoatColor', this.clearcoatColor);
    this.needsUpdate = true;
  }

  /**
   * Set clear coat specular intensity
   * @param {number} intensity - Clear coat specular intensity (0.0+)
   */
  setClearcoatSpecular(intensity) {
    this.clearcoatSpecular = Math.max(0, intensity);
    this.setProperty('uClearcoatSpecular', this.clearcoatSpecular);
    this.needsUpdate = true;
  }

  /**
   * Set transmission amount
   * @param {number} transmission - Transmission factor (0.0-1.0)
   */
  setTransmission(transmission) {
    this.transmission = Math.max(0, Math.min(1, transmission));
    this.setProperty('uTransmission', this.transmission);
    this.needsUpdate = true;
  }

  /**
   * Set index of refraction for transmission
   * @param {number} ior - Index of refraction (1.0+)
   */
  setIor(ior) {
    this.ior = Math.max(1.0, ior);
    this.setProperty('uIor', this.ior);
    this.needsUpdate = true;
  }

  /**
   * Set specular color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setSpecularColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.specularColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.specularColor = color;
    }
    
    this.setProperty('uSpecularColor', this.specularColor);
    this.needsUpdate = true;
  }

  /**
   * Set specular intensity
   * @param {number} intensity - Specular reflection intensity (0.0+)
   */
  setSpecularIntensity(intensity) {
    this.specularIntensity = Math.max(0, intensity);
    this.setProperty('uSpecularIntensity', this.specularIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for clear coat map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setClearcoatUvTransform(transform) {
    this.clearcoatMapTransform = transform;
    this.setProperty('uClearcoatUvTransform', this.clearcoatMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for clear coat roughness map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setClearcoatRoughnessUvTransform(transform) {
    this.clearcoatRoughnessMapTransform = transform;
    this.setProperty('uClearcoatRoughnessUvTransform', this.clearcoatRoughnessMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for clear coat normal map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setClearcoatNormalUvTransform(transform) {
    this.clearcoatNormalMapTransform = transform;
    this.setProperty('uClearcoatNormalUvTransform', this.clearcoatNormalMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    super.updateUniforms();
    
    // Update all clearcoat-specific uniforms
    this.shader.setUniform('uClearcoat', this.clearcoat);
    this.shader.setUniform('uClearcoatRoughness', this.clearcoatRoughness);
    this.shader.setUniform('uClearcoatIor', this.clearcoatIor);
    this.shader.setUniform('uClearcoatThickness', this.clearcoatThickness);
    this.shader.setUniform('uClearcoatColor', this.clearcoatColor);
    this.shader.setUniform('uClearcoatSpecular', this.clearcoatSpecular);
    this.shader.setUniform('uTransmission', this.transmission);
    this.shader.setUniform('uSpecularColor', this.specularColor);
    this.shader.setUniform('uSpecularIntensity', this.specularIntensity);
  }

  /**
   * Clone this material
   * @returns {ClearcoatMaterial} A new material with the same properties
   */
  clone() {
    return new ClearcoatMaterial({
      color: [...this.color],
      opacity: this.opacity,
      transparent: this.transparent,
      roughness: this.roughness,
      metalness: this.metalness,
      clearcoat: this.clearcoat,
      clearcoatRoughness: this.clearcoatRoughness,
      clearcoatIor: this.clearcoatIor,
      clearcoatThickness: this.clearcoatThickness,
      clearcoatColor: [...this.clearcoatColor],
      clearcoatSpecular: this.clearcoatSpecular,
      transmission: this.transmission,
      ior: this.ior,
      specularColor: [...this.specularColor],
      specularIntensity: this.specularIntensity,
      uvTransform: [...this.uvTransform],
      clearcoatMapTransform: [...this.clearcoatMapTransform],
      clearcoatRoughnessMapTransform: [...this.clearcoatRoughnessMapTransform],
      clearcoatNormalMapTransform: [...this.clearcoatNormalMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'ClearcoatMaterial';
  }
}
