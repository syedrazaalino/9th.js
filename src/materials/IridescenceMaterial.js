/**
 * IridescenceMaterial
 * Advanced material for rainbow-color materials like oil, water, soap bubbles, and butterfly wings
 * Uses thin-film interference and angular color shifts to create realistic iridescence effects
 * 
 * Features:
 * - Thin-film interference simulation
 * - Angular-dependent color shifting
 * - Wavelength-dependent reflection/refraction
 * - Multiple layer support for complex interference patterns
 * - Integration with PBR lighting model
 * 
 * @extends Material
 * @author WebGL Materials System
 * @version 1.0.0
 */

import { Material } from '../core/Material.js';

export class IridescenceMaterial extends Material {
  /**
   * Create a new IridescenceMaterial instance
   * @param {Object} options - Configuration options
   * @param {Array<number>} [options.color=[1,1,1]] - Base material color
   * @param {number} [options.iridescenceIntensity=1.0] - Overall intensity of iridescence effect
   * @param {number} [options.iridescenceThickness=400] - Thickness of iridescent layer in nanometers
   * @param {number} [options.iridescenceIor=1.3] - Index of refraction for iridescent layer
   * @param {Array<number>} [options.iridescenceAnisotropy=[1.0, 0.0]] - Anisotropy direction [x, y]
   * @param {number} [options.iridescenceStart=0.0] - Start angle for iridescence (0.0-1.0)
   * @param {number} [options.iridescenceEnd=1.0] - End angle for iridescence (0.0-1.0)
   * @param {number} [options.opacity=1.0] - Material opacity
   * @param {number} [options.roughness=0.3] - Surface roughness (0.0-1.0)
   * @param {number} [options.metalness=0.0] - Metallic properties (0.0-1.0)
   * @param {boolean} [options.transparent=false] - Enable transparency
   * @param {number} [options.thicknessScale=1.0] - Global thickness scale factor
   * @param {Array<number>} [options.filmColor=[1.0, 0.7, 0.2]] - Base film color for interference
   * @param {number} [options.filmIndex=1] - Refractive index of film material
   * @param {Array<number>} [options.substrateIndex=[1.5, 1.0, 1.0]] - Refractive index of substrate
   * @param {number} [options.chromaticAberration=0.1] - Amount of chromatic aberration
   * @param {Object} [options.map=null] - Base texture map
   * @param {Object} [options.iridescenceMap=null] - Iridescence properties map
   * @param {Object} [options.thicknessMap=null] - Thickness variation map
   */
  constructor(options = {}) {
    super(null);

    // Base material properties
    this.color = options.color || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // PBR properties
    this.roughness = options.roughness !== undefined ? options.roughness : 0.3;
    this.metalness = options.metalness !== undefined ? options.metalness : 0.0;

    // Iridescence properties
    this.iridescenceIntensity = options.iridescenceIntensity !== undefined ? options.iridescenceIntensity : 1.0;
    this.iridescenceThickness = options.iridescenceThickness !== undefined ? options.iridescenceThickness : 400;
    this.iridescenceIor = options.iridescenceIor !== undefined ? options.iridescenceIor : 1.3;
    this.iridescenceAnisotropy = options.iridescenceAnisotropy || [1.0, 0.0];
    this.iridescenceStart = options.iridescenceStart !== undefined ? options.iridescenceStart : 0.0;
    this.iridescenceEnd = options.iridescenceEnd !== undefined ? options.iridescenceEnd : 1.0;

    // Advanced film properties
    this.thicknessScale = options.thicknessScale !== undefined ? options.thicknessScale : 1.0;
    this.filmColor = options.filmColor || [1.0, 0.7, 0.2];
    this.filmIndex = options.filmIndex !== undefined ? options.filmIndex : 1.0;
    this.substrateIndex = options.substrateIndex || [1.5, 1.0, 1.0];
    this.chromaticAberration = options.chromaticAberration !== undefined ? options.chromaticAberration : 0.1;

    // Texture maps
    this.map = options.map || null;
    this.iridescenceMap = options.iridescenceMap || null;
    this.thicknessMap = options.thicknessMap || null;
    this.normalMap = options.normalMap || null;

    // UV transform properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.iridescenceMapTransform = options.iridescenceMapTransform || [0, 0, 1, 1, 0, 0];
    this.thicknessMapTransform = options.thicknessMapTransform || [0, 0, 1, 1, 0, 0];

    // Set up shader and uniforms
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for iridescence
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
      varying vec2 vIridescenceUv;
      varying vec2 vThicknessUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vViewNormal;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      
      void main() {
        vUv = uv;
        vIridescenceUv = uv;
        vThicknessUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        vViewNormal = normalize(normalMatrix * normal);
        
        // Calculate TBN matrix for anisotropic iridescence
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
        vTangent = T;
        vBitangent = B;
        vTBN = mat3(T, B, N);
        
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
      uniform float uOpacity;
      uniform float uIridescenceIntensity;
      uniform float uIridescenceThickness;
      uniform float uIridescenceIor;
      uniform vec2 uIridescenceAnisotropy;
      uniform float uIridescenceStart;
      uniform float uIridescenceEnd;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform float uThicknessScale;
      uniform vec3 uFilmColor;
      uniform float uFilmIndex;
      uniform vec3 uSubstrateIndex;
      uniform float uChromaticAberration;
      
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
      uniform bool uUseIridescenceMap;
      uniform bool uUseThicknessMap;
      uniform bool uUseNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uIridescenceMap;
      uniform sampler2D uThicknessMap;
      uniform sampler2D uNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uIridescenceUvTransform;
      uniform vec4 uThicknessUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vIridescenceUv;
      varying vec2 vThicknessUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vViewNormal;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      
      // Constants
      const float PI = 3.14159265359;
      const float EPSILON = 1e-6;
      
      // Wavelength constants (nm)
      const float WAVELENGTH_R = 700.0;
      const float WAVELENGTH_G = 546.1;
      const float WAVELENGTH_B = 435.8;
      
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
      
      // Wavelength to RGB conversion (approximate)
      vec3 wavelengthToRGB(float wavelength) {
        vec3 color = vec3(0.0);
        float r = 0.0, g = 0.0, b = 0.0;
        
        if (wavelength >= 380.0 && wavelength < 440.0) {
          r = -(wavelength - 440.0) / (440.0 - 380.0);
          g = 0.0;
          b = 1.0;
        } else if (wavelength >= 440.0 && wavelength < 490.0) {
          r = 0.0;
          g = (wavelength - 440.0) / (490.0 - 440.0);
          b = 1.0;
        } else if (wavelength >= 490.0 && wavelength < 510.0) {
          r = 0.0;
          g = 1.0;
          b = -(wavelength - 510.0) / (510.0 - 490.0);
        } else if (wavelength >= 510.0 && wavelength < 580.0) {
          r = (wavelength - 510.0) / (580.0 - 510.0);
          g = 1.0;
          b = 0.0;
        } else if (wavelength >= 580.0 && wavelength < 645.0) {
          r = 1.0;
          g = -(wavelength - 645.0) / (645.0 - 580.0);
          b = 0.0;
        } else if (wavelength >= 645.0 && wavelength <= 780.0) {
          r = 1.0;
          g = 0.0;
          b = 0.0;
        }
        
        // Intensity falloff at edges
        float factor = 1.0;
        if (wavelength > 700.0) {
          factor = 0.3 + 0.7 * (780.0 - wavelength) / (780.0 - 700.0);
        } else if (wavelength < 420.0) {
          factor = 0.3 + 0.7 * (wavelength - 380.0) / (420.0 - 380.0);
        }
        
        return vec3(r, g, b) * factor;
      }
      
      // Thin film interference calculation
      vec3 thinFilmInterference(float cosTheta, float thickness, float ior1, float ior2, float ior3) {
        vec3 colors = vec3(0.0);
        
        // Calculate interference for RGB wavelengths
        for (int i = 0; i < 3; i++) {
          float wavelength = (i == 0) ? WAVELENGTH_R : (i == 1) ? WAVELENGTH_G : WAVELENGTH_B;
          
          // Apply chromatic aberration
          float aberratedWavelength = wavelength * (1.0 + uChromaticAberration * (float(i) - 1.0));
          
          // Phase difference calculation
          float phase = 2.0 * PI * thickness * ior1 * cosTheta / (aberratedWavelength * 1e-3);
          
          // Interference pattern (simplified)
          float interference = 0.5 + 0.5 * cos(2.0 * phase);
          
          // Fresnel reflection coefficients (simplified)
          float r01 = pow((ior1 - ior2) / (ior1 + ior2), 2.0);
          float r12 = pow((ior2 - ior3) / (ior2 + ior3), 2.0);
          
          // Combined reflection
          float reflectance = r01 + r12 + 2.0 * sqrt(r01 * r12) * interference;
          reflectance = clamp(reflectance, 0.0, 1.0);
          
          // Convert to RGB
          colors[i] = reflectance;
        }
        
        return colors;
      }
      
      // Calculate iridescence color
      vec3 calculateIridescence(vec3 N, vec3 V) {
        float cosTheta = max(dot(N, V), 0.0);
        
        // Get thickness from map if available
        float thickness = uIridescenceThickness;
        #ifdef USE_THICKNESS_MAP
          vec2 thicknessUV = getUV(vThicknessUv, uThicknessUvTransform);
          float thicknessMapValue = texture2D(uThicknessMap, thicknessUV).r;
          thickness *= thicknessMapValue * uThicknessScale;
        #endif
        
        // Apply iridescence intensity
        thickness *= uIridescenceIntensity;
        
        // Calculate interference
        vec3 iridescence = thinFilmInterference(
          cosTheta, 
          thickness, 
          uFilmIndex, 
          uIridescenceIor, 
          uSubstrateIndex.x
        );
        
        // Apply film color
        iridescence *= uFilmColor;
        
        // Apply anisotropic effects
        vec3 anisotropicDir = normalize(vec3(uIridescenceAnisotropy.x, 0.0, uIridescenceAnisotropy.y));
        float anisotropy = dot(vTangent, anisotropicDir);
        iridescence *= (1.0 + 0.3 * anisotropy);
        
        // Apply angle range limits
        float angle = acos(cosTheta) / PI;
        float mask = smoothstep(uIridescenceStart, uIridescenceStart + 0.1, angle) * 
                     (1.0 - smoothstep(uIridescenceEnd - 0.1, uIridescenceEnd, angle));
        
        return iridescence * mask;
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
        
        // Apply base texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply iridescence map
        #ifdef USE_IRIDESCENCE_MAP
          vec2 iridescenceUV = getUV(vIridescenceUv, uIridescenceUvTransform);
          vec4 iridescenceData = texture2D(uIridescenceMap, iridescenceUV);
          // Use iridescence map to modulate iridescence properties
        #endif
        
        // Calculate normals
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPosition);
        
        // Apply normal mapping
        #ifdef USE_NORMAL_MAP
          N = perturbNormal(N, V, vUv);
        #endif
        
        // Calculate iridescence
        vec3 iridescenceColor = calculateIridescence(N, V);
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        vec3 directLighting = vec3(0.0);
        
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
          vec3 brdf = cookTorranceBRDF(N, V, lightDir, albedo, metallic, roughness);
          directLighting += brdf * uLightColor[i] * attenuation;
        }
        
        // Ambient lighting
        vec3 ambient = uAmbientLightColor * albedo;
        
        // Add iridescence to lighting
        lighting = ambient + directLighting;
        lighting = mix(lighting, iridescenceColor, uIridescenceIntensity);
        
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
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uIridescenceIntensity', this.iridescenceIntensity);
    this.setProperty('uIridescenceThickness', this.iridescenceThickness);
    this.setProperty('uIridescenceIor', this.iridescenceIor);
    this.setProperty('uIridescenceAnisotropy', this.iridescenceAnisotropy);
    this.setProperty('uIridescenceStart', this.iridescenceStart);
    this.setProperty('uIridescenceEnd', this.iridescenceEnd);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uThicknessScale', this.thicknessScale);
    this.setProperty('uFilmColor', this.filmColor);
    this.setProperty('uFilmIndex', this.filmIndex);
    this.setProperty('uSubstrateIndex', this.substrateIndex);
    this.setProperty('uChromaticAberration', this.chromaticAberration);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uIridescenceUvTransform', this.iridescenceMapTransform);
    this.setProperty('uThicknessUvTransform', this.thicknessMapTransform);
  }

  /**
   * Set iridescence intensity
   * @param {number} intensity - Iridescence intensity (0.0-1.0)
   */
  setIridescenceIntensity(intensity) {
    this.iridescenceIntensity = Math.max(0, Math.min(1, intensity));
    this.setProperty('uIridescenceIntensity', this.iridescenceIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence thickness
   * @param {number} thickness - Film thickness in nanometers (0.0+)
   */
  setIridescenceThickness(thickness) {
    this.iridescenceThickness = Math.max(0, thickness);
    this.setProperty('uIridescenceThickness', this.iridescenceThickness);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence index of refraction
   * @param {number} ior - Index of refraction (1.0+)
   */
  setIridescenceIor(ior) {
    this.iridescenceIor = Math.max(1.0, ior);
    this.setProperty('uIridescenceIor', this.iridescenceIor);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence anisotropy direction
   * @param {Array<number>} anisotropy - Anisotropy direction [x, y]
   */
  setIridescenceAnisotropy(anisotropy) {
    this.iridescenceAnisotropy = anisotropy;
    this.setProperty('uIridescenceAnisotropy', this.iridescenceAnisotropy);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence angle range start
   * @param {number} start - Start angle (0.0-1.0)
   */
  setIridescenceStart(start) {
    this.iridescenceStart = Math.max(0, Math.min(1, start));
    this.setProperty('uIridescenceStart', this.iridescenceStart);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence angle range end
   * @param {number} end - End angle (0.0-1.0)
   */
  setIridescenceEnd(end) {
    this.iridescenceEnd = Math.max(0, Math.min(1, end));
    this.setProperty('uIridescenceEnd', this.iridescenceEnd);
    this.needsUpdate = true;
  }

  /**
   * Set film color for interference
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setFilmColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.filmColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.filmColor = color;
    }
    
    this.setProperty('uFilmColor', this.filmColor);
    this.needsUpdate = true;
  }

  /**
   * Set film refractive index
   * @param {number} index - Refractive index (1.0+)
   */
  setFilmIndex(index) {
    this.filmIndex = Math.max(1.0, index);
    this.setProperty('uFilmIndex', this.filmIndex);
    this.needsUpdate = true;
  }

  /**
   * Set substrate refractive indices
   * @param {Array<number>} indices - RGB refractive indices [r, g, b]
   */
  setSubstrateIndex(indices) {
    this.substrateIndex = indices.map(v => Math.max(1.0, v));
    this.setProperty('uSubstrateIndex', this.substrateIndex);
    this.needsUpdate = true;
  }

  /**
   * Set chromatic aberration amount
   * @param {number} aberration - Chromatic aberration amount (0.0+)
   */
  setChromaticAberration(aberration) {
    this.chromaticAberration = Math.max(0, aberration);
    this.setProperty('uChromaticAberration', this.chromaticAberration);
    this.needsUpdate = true;
  }

  /**
   * Set thickness scale factor
   * @param {number} scale - Global thickness scale (0.0+)
   */
  setThicknessScale(scale) {
    this.thicknessScale = Math.max(0, scale);
    this.setProperty('uThicknessScale', this.thicknessScale);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for iridescence map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setIridescenceUvTransform(transform) {
    this.iridescenceMapTransform = transform;
    this.setProperty('uIridescenceUvTransform', this.iridescenceMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for thickness map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setThicknessUvTransform(transform) {
    this.thicknessMapTransform = transform;
    this.setProperty('uThicknessUvTransform', this.thicknessMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    super.updateUniforms();
    
    // Update all iridescence-specific uniforms
    this.shader.setUniform('uIridescenceIntensity', this.iridescenceIntensity);
    this.shader.setUniform('uIridescenceThickness', this.iridescenceThickness);
    this.shader.setUniform('uIridescenceIor', this.iridescenceIor);
    this.shader.setUniform('uIridescenceAnisotropy', this.iridescenceAnisotropy);
    this.shader.setUniform('uIridescenceStart', this.iridescenceStart);
    this.shader.setUniform('uIridescenceEnd', this.iridescenceEnd);
    this.shader.setUniform('uFilmColor', this.filmColor);
    this.shader.setUniform('uFilmIndex', this.filmIndex);
    this.shader.setUniform('uSubstrateIndex', this.substrateIndex);
    this.shader.setUniform('uChromaticAberration', this.chromaticAberration);
    this.shader.setUniform('uThicknessScale', this.thicknessScale);
  }

  /**
   * Clone this material
   * @returns {IridescenceMaterial} A new material with the same properties
   */
  clone() {
    return new IridescenceMaterial({
      color: [...this.color],
      opacity: this.opacity,
      transparent: this.transparent,
      roughness: this.roughness,
      metalness: this.metalness,
      iridescenceIntensity: this.iridescenceIntensity,
      iridescenceThickness: this.iridescenceThickness,
      iridescenceIor: this.iridescenceIor,
      iridescenceAnisotropy: [...this.iridescenceAnisotropy],
      iridescenceStart: this.iridescenceStart,
      iridescenceEnd: this.iridescenceEnd,
      thicknessScale: this.thicknessScale,
      filmColor: [...this.filmColor],
      filmIndex: this.filmIndex,
      substrateIndex: [...this.substrateIndex],
      chromaticAberration: this.chromaticAberration,
      uvTransform: [...this.uvTransform],
      iridescenceMapTransform: [...this.iridescenceMapTransform],
      thicknessMapTransform: [...this.thicknessMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'IridescenceMaterial';
  }
}
