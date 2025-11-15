/**
 * AnisotropicMaterial
 * Advanced material for anisotropic surfaces like brushed metal, hair, wood grain, and fabric
 * Uses anisotropic distribution functions to create directional highlights and reflections
 * 
 * Features:
 * - Anisotropic BRDF using Ward model
 * - Direction-dependent specular highlights
 * - Anisotropy strength control
 * - Anisotropy direction mapping
 * - Integration with standard PBR lighting model
 * 
 * @extends Material
 * @author WebGL Materials System
 * @version 1.0.0
 */

import { Material } from '../core/Material.js';

export class AnisotropicMaterial extends Material {
  /**
   * Create a new AnisotropicMaterial instance
   * @param {Object} options - Configuration options
   * @param {Array<number>} [options.color=[1,1,1]] - Base material color
   * @param {number} [options.opacity=1.0] - Material opacity
   * @param {boolean} [options.transparent=false] - Enable transparency
   * @param {number} [options.roughness=0.5] - Surface roughness (0.0-1.0)
   * @param {number} [options.metalness=0.0] - Metallic properties (0.0-1.0)
   * @param {number} [options.anisotropy=0.5] - Anisotropy strength (0.0-1.0)
   * @param {Array<number>} [options.anisotropyDirection=[1,0,0]] - Direction of anisotropy
   * @param {Array<number>} [options.anisotropyColors=[1,1,1]] - Color tint for anisotropic highlights
   * @param {number} [options.anisotropyIntensity=1.0] - Intensity of anisotropic effect
   * @param {number} [options.anisotropyRotation=0.0] - Rotation angle of anisotropy (radians)
   * @param {Array<number>} [options.sheenColor=[1,1,1]] - Sheen color for soft materials
   * @param {number} [options.sheenRoughness=0.5] - Sheen roughness (0.0-1.0)
   * @param {Object} [options.map=null] - Base texture map
   * @param {Object} [options.anisotropyMap=null] - Anisotropy properties map
   * @param {Object} [options.anisotropyDirectionMap=null] - Anisotropy direction map
   * @param {Object} [options.sheenMap=null] - Sheen color/intensity map
   * @param {Object} [options.normalMap=null] - Normal map
   */
  constructor(options = {}) {
    super(null);

    // Base material properties
    this.color = options.color || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // PBR properties
    this.roughness = options.roughness !== undefined ? options.roughness : 0.5;
    this.metalness = options.metalness !== undefined ? options.metalness : 0.0;

    // Anisotropy properties
    this.anisotropy = options.anisotropy !== undefined ? options.anisotropy : 0.5;
    this.anisotropyDirection = options.anisotropyDirection || [1, 0, 0];
    this.anisotropyColors = options.anisotropyColors || [1, 1, 1];
    this.anisotropyIntensity = options.anisotropyIntensity !== undefined ? options.anisotropyIntensity : 1.0;
    this.anisotropyRotation = options.anisotropyRotation !== undefined ? options.anisotropyRotation : 0.0;

    // Sheen properties for soft anisotropic materials
    this.sheenColor = options.sheenColor || [1, 1, 1];
    this.sheenRoughness = options.sheenRoughness !== undefined ? options.sheenRoughness : 0.5;

    // Texture maps
    this.map = options.map || null;
    this.anisotropyMap = options.anisotropyMap || null;
    this.anisotropyDirectionMap = options.anisotropyDirectionMap || null;
    this.sheenMap = options.sheenMap || null;
    this.normalMap = options.normalMap || null;

    // UV transform properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.anisotropyMapTransform = options.anisotropyMapTransform || [0, 0, 1, 1, 0, 0];
    this.anisotropyDirectionMapTransform = options.anisotropyDirectionMapTransform || [0, 0, 1, 1, 0, 0];
    this.sheenMapTransform = options.sheenMapTransform || [0, 0, 1, 1, 0, 0];

    // Set up shader and uniforms
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for anisotropic material
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
      varying vec2 vAnisotropyUv;
      varying vec2 vAnisotropyDirectionUv;
      varying vec2 vSheenUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      varying vec3 vAnisotropyDirection;
      varying vec3 vViewTangent;
      varying vec3 vViewBitangent;
      
      void main() {
        vUv = uv;
        vAnisotropyUv = uv;
        vAnisotropyDirectionUv = uv;
        vSheenUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        
        // Calculate TBN matrix for normal mapping
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
        vTangent = T;
        vBitangent = B;
        vTBN = mat3(T, B, N);
        
        // Transform anisotropy direction to view space
        vec3 anisotropyDir = normalize(vec3(uAnisotropyDirection.x, 0.0, uAnisotropyDirection.z));
        vAnisotropyDirection = anisotropyDir;
        vViewTangent = normalize(mat3(viewMatrix) * tangent);
        vViewBitangent = normalize(mat3(viewMatrix) * bitangent);
        
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
      uniform vec3 uAnisotropyColors;
      uniform vec3 uSheenColor;
      uniform float uOpacity;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform float uAnisotropy;
      uniform vec3 uAnisotropyDirection;
      uniform float uAnisotropyIntensity;
      uniform float uAnisotropyRotation;
      uniform float uSheenRoughness;
      
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
      uniform bool uUseAnisotropyMap;
      uniform bool uUseAnisotropyDirectionMap;
      uniform bool uUseSheenMap;
      uniform bool uUseNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uAnisotropyMap;
      uniform sampler2D uAnisotropyDirectionMap;
      uniform sampler2D uSheenMap;
      uniform sampler2D uNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uAnisotropyUvTransform;
      uniform vec4 uAnisotropyDirectionUvTransform;
      uniform vec4 uSheenUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vAnisotropyUv;
      varying vec2 vAnisotropyDirectionUv;
      varying vec2 vSheenUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      varying vec3 vAnisotropyDirection;
      varying vec3 vViewTangent;
      varying vec3 vViewBitangent;
      
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
      
      // Anisotropic Ward BRDF
      float anisotropicWardBRDF(vec3 N, vec3 V, vec3 L, float ax, float ay) {
        vec3 H = normalize(V + L);
        
        float NdotH = max(dot(N, H), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        
        // Anisotropic distribution parameters
        float cosPhi = dot(H, vViewTangent);
        float sinPhi = dot(H, vViewBitangent);
        
        // Ward anisotropic distribution
        float exponent = - (cosPhi * cosPhi) / (ax * ax + EPSILON) - (sinPhi * sinPhi) / (ay * ay + EPSILON);
        float D = exp(exponent) / (4.0 * PI * ax * ay);
        
        // Geometry term (simplified)
        float G = min(NdotV, NdotL);
        
        return D * G / max(NdotH, EPSILON);
      }
      
      // Anisotropic BRDF calculation
      vec3 anisotropicBRDF(vec3 N, vec3 V, vec3 L, vec3 anisotropicColor, float anisotropy, float roughness) {
        vec3 H = normalize(V + L);
        
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        
        // Rotate anisotropy direction
        float cosRot = cos(uAnisotropyRotation);
        float sinRot = sin(uAnisotropyRotation);
        vec3 rotatedAnisotropyDir = vec3(
          vAnisotropyDirection.x * cosRot - vAnisotropyDirection.z * sinRot,
          0.0,
          vAnisotropyDirection.x * sinRot + vAnisotropyDirection.z * cosRot
        );
        
        // Anisotropic parameters
        float axial = max(0.01, roughness * (1.0 + anisotropy));
        float tangential = max(0.01, roughness * (1.0 - anisotropy));
        
        // Calculate anisotropic distribution
        float D = anisotropicWardBRDF(N, V, L, axial, tangential);
        
        // Fresnel term
        vec3 F0 = mix(vec3(0.04), anisotropicColor, 0.5);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        // Geometry term
        float G = min(NdotV, NdotL);
        
        // Combine components
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + EPSILON;
        vec3 specular = numerator / denominator;
        
        return specular * NdotL;
      }
      
      // Sheen BRDF for soft materials
      vec3 sheenBRDF(vec3 N, vec3 V, vec3 L, vec3 sheenColor, float sheenRoughness) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        // Simplified sheen model
        float lobe = exp(-pow(1.0 - max(dot(N, H), 0.0), 2.0) / (sheenRoughness * sheenRoughness + EPSILON));
        
        return sheenColor * lobe * NdotL;
      }
      
      // Perturb normal using normal map
      vec3 perturbNormal(vec3 normal, vec3 viewDir, vec2 uv) {
        vec3 tangentNormal = texture2D(uNormalMap, getUV(uv, uUvTransform)).xyz * 2.0 - 1.0;
        return normalize(vTBN * tangentNormal);
      }
      
      void main() {
        // Get base material properties
        vec3 albedo = uColor;
        float roughness = uRoughness;
        float metallic = uMetalness;
        float anisotropy = uAnisotropy;
        
        // Apply base texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply anisotropy map
        #ifdef USE_ANISOTROPY_MAP
          vec2 anisotropyUV = getUV(vAnisotropyUv, uAnisotropyUvTransform);
          vec2 anisotropyData = texture2D(uAnisotropyMap, anisotropyUV).rg;
          anisotropy *= anisotropyData.r;
        #endif
        
        // Apply anisotropy direction map
        #ifdef USE_ANISOTROPY_DIRECTION_MAP
          vec2 directionUV = getUV(vAnisotropyDirectionUv, uAnisotropyDirectionUvTransform);
          vec3 directionData = texture2D(uAnisotropyDirectionMap, directionUV).rgb * 2.0 - 1.0;
          directionData.y = 0.0; // Restrict to XZ plane
          directionData = normalize(directionData);
          if (length(directionData) > 0.1) {
            vAnisotropyDirection = directionData;
          }
        #endif
        
        // Apply sheen map
        #ifdef USE_SHEEN_MAP
          vec2 sheenUV = getUV(vSheenUv, uSheenUvTransform);
          vec4 sheenData = texture2D(uSheenMap, sheenUV);
          // Use sheen data for modulation
        #endif
        
        // Calculate normals
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        
        // Apply normal mapping
        #ifdef USE_NORMAL_MAP
          N = perturbNormal(N, V, vUv);
        #endif
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        vec3 directLighting = vec3(0.0);
        vec3 anisotropicLighting = vec3(0.0);
        vec3 sheenLighting = vec3(0.0);
        
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
          
          // Standard PBR lighting
          vec3 baseBRDF = cookTorranceBRDF(N, V, lightDir, albedo, metallic, roughness);
          directLighting += baseBRDF * uLightColor[i] * attenuation;
          
          // Anisotropic lighting component
          if (anisotropy > 0.0) {
            vec3 anisotropicBRDF = anisotropicBRDF(N, V, lightDir, uAnisotropyColors, anisotropy, roughness);
            anisotropicLighting += anisotropicBRDF * uAnisotropyIntensity * uLightColor[i] * attenuation;
          }
          
          // Sheen lighting component for soft materials
          vec3 sheenBRDF = sheenBRDF(N, V, lightDir, uSheenColor, uSheenRoughness);
          sheenLighting += sheenBRDF * uLightColor[i] * attenuation;
        }
        
        // Ambient lighting
        vec3 ambient = uAmbientLightColor * albedo;
        
        // Combine lighting components
        lighting = ambient + directLighting;
        lighting += anisotropicLighting;
        lighting += sheenLighting * 0.1; // Subtle sheen contribution
        
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
    this.setProperty('uAnisotropyColors', this.anisotropyColors);
    this.setProperty('uSheenColor', this.sheenColor);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uAnisotropy', this.anisotropy);
    this.setProperty('uAnisotropyDirection', this.anisotropyDirection);
    this.setProperty('uAnisotropyIntensity', this.anisotropyIntensity);
    this.setProperty('uAnisotropyRotation', this.anisotropyRotation);
    this.setProperty('uSheenRoughness', this.sheenRoughness);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uAnisotropyUvTransform', this.anisotropyMapTransform);
    this.setProperty('uAnisotropyDirectionUvTransform', this.anisotropyDirectionMapTransform);
    this.setProperty('uSheenUvTransform', this.sheenMapTransform);
  }

  /**
   * Set anisotropy strength
   * @param {number} anisotropy - Anisotropy strength (0.0-1.0)
   */
  setAnisotropy(anisotropy) {
    this.anisotropy = Math.max(0, Math.min(1, anisotropy));
    this.setProperty('uAnisotropy', this.anisotropy);
    this.needsUpdate = true;
  }

  /**
   * Set anisotropy direction
   * @param {Array<number>} direction - Anisotropy direction vector [x, y, z]
   */
  setAnisotropyDirection(direction) {
    const len = Math.sqrt(direction[0] * direction[0] + direction[2] * direction[2]);
    if (len > 0.0001) {
      this.anisotropyDirection = [direction[0] / len, 0, direction[2] / len];
    } else {
      this.anisotropyDirection = [1, 0, 0];
    }
    this.setProperty('uAnisotropyDirection', this.anisotropyDirection);
    this.needsUpdate = true;
  }

  /**
   * Set anisotropy color tint
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setAnisotropyColors(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.anisotropyColors = [r, g, b];
    } else if (Array.isArray(color)) {
      this.anisotropyColors = color;
    }
    
    this.setProperty('uAnisotropyColors', this.anisotropyColors);
    this.needsUpdate = true;
  }

  /**
   * Set anisotropy intensity
   * @param {number} intensity - Anisotropy effect intensity (0.0+)
   */
  setAnisotropyIntensity(intensity) {
    this.anisotropyIntensity = Math.max(0, intensity);
    this.setProperty('uAnisotropyIntensity', this.anisotropyIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set anisotropy rotation
   * @param {number} rotation - Rotation angle in radians
   */
  setAnisotropyRotation(rotation) {
    this.anisotropyRotation = rotation;
    this.setProperty('uAnisotropyRotation', this.anisotropyRotation);
    this.needsUpdate = true;
  }

  /**
   * Set sheen color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setSheenColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.sheenColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.sheenColor = color;
    }
    
    this.setProperty('uSheenColor', this.sheenColor);
    this.needsUpdate = true;
  }

  /**
   * Set sheen roughness
   * @param {number} roughness - Sheen surface roughness (0.0-1.0)
   */
  setSheenRoughness(roughness) {
    this.sheenRoughness = Math.max(0, Math.min(1, roughness));
    this.setProperty('uSheenRoughness', this.sheenRoughness);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for anisotropy map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setAnisotropyUvTransform(transform) {
    this.anisotropyMapTransform = transform;
    this.setProperty('uAnisotropyUvTransform', this.anisotropyMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for anisotropy direction map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setAnisotropyDirectionUvTransform(transform) {
    this.anisotropyDirectionMapTransform = transform;
    this.setProperty('uAnisotropyDirectionUvTransform', this.anisotropyDirectionMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for sheen map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setSheenUvTransform(transform) {
    this.sheenMapTransform = transform;
    this.setProperty('uSheenUvTransform', this.sheenMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    super.updateUniforms();
    
    // Update all anisotropic-specific uniforms
    this.shader.setUniform('uAnisotropy', this.anisotropy);
    this.shader.setUniform('uAnisotropyDirection', this.anisotropyDirection);
    this.shader.setUniform('uAnisotropyColors', this.anisotropyColors);
    this.shader.setUniform('uAnisotropyIntensity', this.anisotropyIntensity);
    this.shader.setUniform('uAnisotropyRotation', this.anisotropyRotation);
    this.shader.setUniform('uSheenColor', this.sheenColor);
    this.shader.setUniform('uSheenRoughness', this.sheenRoughness);
  }

  /**
   * Clone this material
   * @returns {AnisotropicMaterial} A new material with the same properties
   */
  clone() {
    return new AnisotropicMaterial({
      color: [...this.color],
      opacity: this.opacity,
      transparent: this.transparent,
      roughness: this.roughness,
      metalness: this.metalness,
      anisotropy: this.anisotropy,
      anisotropyDirection: [...this.anisotropyDirection],
      anisotropyColors: [...this.anisotropyColors],
      anisotropyIntensity: this.anisotropyIntensity,
      anisotropyRotation: this.anisotropyRotation,
      sheenColor: [...this.sheenColor],
      sheenRoughness: this.sheenRoughness,
      uvTransform: [...this.uvTransform],
      anisotropyMapTransform: [...this.anisotropyMapTransform],
      anisotropyDirectionMapTransform: [...this.anisotropyDirectionMapTransform],
      sheenMapTransform: [...this.sheenMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'AnisotropicMaterial';
  }
}
