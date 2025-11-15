/**
 * ClothMaterial
 * Advanced material for fabric and cloth simulation with fiber-based rendering
 * Simulates woven patterns, fiber direction, and fabric-specific lighting properties
 * 
 * Features:
 * - Fiber-based lighting model
 * - Weave pattern simulation
 * - Anisotropic fiber direction
 * - Fabric-specific roughness and sheen
 * - Thread density and pattern support
 * - Integration with PBR lighting model
 * 
 * @extends Material
 * @author WebGL Materials System
 * @version 1.0.0
 */

import { Material } from '../core/Material.js';

export class ClothMaterial extends Material {
  /**
   * Create a new ClothMaterial instance
   * @param {Object} options - Configuration options
   * @param {Array<number>} [options.color=[1,1,1]] - Base material color
   * @param {number} [options.opacity=1.0] - Material opacity
   * @param {boolean} [options.transparent=false] - Enable transparency
   * @param {number} [options.roughness=0.8] - Fabric surface roughness (0.0-1.0)
   * @param {number} [options.metalness=0.0] - Metallic properties (0.0-1.0)
   * @param {Array<number>} [options.fiberDirection=[1,0,0]] - Primary fiber direction
   * @param {number} [options.fiberIntensity=0.7] - Intensity of fiber lighting effect
   * @param {Array<number>} [options.fiberColor=[0.9,0.9,0.9]] - Color tint for fibers
   * @param {number} [options.weaveDensity=1.0] - Thread density (0.0+)
   * @param {number} [options.threadThickness=0.5] - Thread thickness factor (0.0-1.0)
   * @param {number} [options.sheen=0.5] - Fabric sheen intensity (0.0-1.0)
   * @param {number} [options.sheenColor=[0.8,0.7,0.6]] - Sheen color
   * @param {number} [options.subsurfaceColor=[1,0.8,0.6]] - Subsurface color for light transmission
   * @param {number} [options.subsurface=0.3] - Subsurface scattering amount (0.0-1.0)
   * @param {number} [options.fuzz=0.2] - Fuzziness for fuzzy fabrics (0.0-1.0)
   * @param {number} [options.fuzzColor=[1,1,1]] - Color of fuzzy fibers
   * @param {number} [options.displacementScale=0.1] - Height variation from weave pattern
   * @param {Object} [options.map=null] - Base texture map
   * @param {Object} [options.fiberMap=null] - Fiber properties map
   * @param {Object} [options.weaveMap=null] - Weave pattern map
   * @param {Object} [options.normalMap=null] - Normal map for surface details
   */
  constructor(options = {}) {
    super(null);

    // Base material properties
    this.color = options.color || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // PBR properties
    this.roughness = options.roughness !== undefined ? options.roughness : 0.8;
    this.metalness = options.metalness !== undefined ? options.metalness : 0.0;

    // Fiber properties
    this.fiberDirection = options.fiberDirection || [1, 0, 0];
    this.fiberIntensity = options.fiberIntensity !== undefined ? options.fiberIntensity : 0.7;
    this.fiberColor = options.fiberColor || [0.9, 0.9, 0.9];

    // Weave properties
    this.weaveDensity = options.weaveDensity !== undefined ? options.weaveDensity : 1.0;
    this.threadThickness = options.threadThickness !== undefined ? options.threadThickness : 0.5;
    this.displacementScale = options.displacementScale !== undefined ? options.displacementScale : 0.1;

    // Fabric-specific properties
    this.sheen = options.sheen !== undefined ? options.sheen : 0.5;
    this.sheenColor = options.sheenColor || [0.8, 0.7, 0.6];
    this.subsurfaceColor = options.subsurfaceColor || [1, 0.8, 0.6];
    this.subsurface = options.subsurface !== undefined ? options.subsurface : 0.3;
    this.fuzz = options.fuzz !== undefined ? options.fuzz : 0.2;
    this.fuzzColor = options.fuzzColor || [1, 1, 1];

    // Texture maps
    this.map = options.map || null;
    this.fiberMap = options.fiberMap || null;
    this.weaveMap = options.weaveMap || null;
    this.normalMap = options.normalMap || null;

    // UV transform properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.fiberMapTransform = options.fiberMapTransform || [0, 0, 1, 1, 0, 0];
    this.weaveMapTransform = options.weaveMapTransform || [0, 0, 1, 1, 0, 0];

    // Set up shader and uniforms
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for cloth material
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
      varying vec2 vFiberUv;
      varying vec2 vWeaveUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      varying vec3 vFiberDirection;
      varying vec3 vViewTangent;
      varying vec3 vViewBitangent;
      
      void main() {
        vUv = uv;
        vFiberUv = uv;
        vWeaveUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        
        // Calculate TBN matrix for normal mapping
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
        vTangent = T;
        vBitangent = B;
        vTBN = mat3(T, B, N);
        
        // Transform fiber direction to view space
        vFiberDirection = normalize(mat3(modelMatrix) * vec3(uFiberDirection.x, 0.0, uFiberDirection.z));
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
      uniform vec3 uFiberColor;
      uniform vec3 uSheenColor;
      uniform vec3 uSubsurfaceColor;
      uniform vec3 uFuzzColor;
      uniform float uOpacity;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform vec3 uFiberDirection;
      uniform float uFiberIntensity;
      uniform float uWeaveDensity;
      uniform float uThreadThickness;
      uniform float uSheen;
      uniform float uSubsurface;
      uniform float uFuzz;
      uniform float uDisplacementScale;
      
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
      uniform bool uUseFiberMap;
      uniform bool uUseWeaveMap;
      uniform bool uUseNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uFiberMap;
      uniform sampler2D uWeaveMap;
      uniform sampler2D uNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uFiberUvTransform;
      uniform vec4 uWeaveUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vFiberUv;
      varying vec2 vWeaveUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vTangent;
      varying vec3 vBitangent;
      varying mat3 vTBN;
      varying vec3 vFiberDirection;
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
      
      // Fabric-specific BRDF with fiber alignment
      vec3 fabricBRDF(vec3 N, vec3 V, vec3 L, vec3 fiberColor, float fiberIntensity, float roughness) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        // Calculate fiber alignment with light direction
        float fiberAlignment = abs(dot(vFiberDirection, L));
        
        // Modified roughness based on fiber direction
        float alignedRoughness = roughness * (1.0 - fiberAlignment * 0.7);
        alignedRoughness = max(0.01, alignedRoughness);
        
        // Standard Cook-Torrance with modified parameters
        vec3 F0 = mix(vec3(0.04), fiberColor, 0.1); // Less metallic contribution for fabric
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
        float D = distributionGGX(N, H, alignedRoughness);
        float G = geometrySmith(N, V, L, alignedRoughness);
        
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + EPSILON;
        vec3 specular = numerator / denominator;
        
        // Reduce diffuse contribution for fabrics
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 0.5; // Less diffuse for fabric
        
        vec3 diffuse = kD * fiberColor / PI;
        
        // Apply fiber intensity
        diffuse *= (1.0 + fiberAlignment * fiberIntensity);
        specular *= (1.0 + fiberAlignment * fiberIntensity * 0.5);
        
        return (diffuse + specular) * NdotL;
      }
      
      // Sheen BRDF for soft fabrics
      vec3 sheenBRDF(vec3 N, vec3 V, vec3 L, vec3 sheenColor, float sheenIntensity) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        // Fabric sheen is very soft and broad
        float angle = max(0.0, 1.0 - max(dot(N, H), 0.0));
        float lobe = exp(-angle * angle * 5.0); // Very broad lobe
        
        return sheenColor * sheenIntensity * lobe * NdotL;
      }
      
      // Subsurface scattering approximation for fabrics
      vec3 fabricSubsurface(vec3 N, vec3 V, vec3 L, vec3 subsurfaceColor, float subsurfaceAmount) {
        vec3 lightDir = normalize(L);
        vec3 viewDir = normalize(V);
        
        // Back-scattering for thin fabrics
        float backScatter = max(0.0, dot(-viewDir, lightDir));
        
        // Light falloff based on fabric thickness
        float fabricScatter = backScatter * subsurfaceAmount;
        
        return subsurfaceColor * fabricScatter;
      }
      
      // Weave pattern calculation
      float weavePattern(vec2 uv, float density, float thickness) {
        // Calculate thread positions
        float threadPosX = fract(uv.x * density);
        float threadPosY = fract(uv.y * density);
        
        // Thread width based on thickness
        float threadWidth = thickness * 0.1;
        
        // Calculate thread visibility
        float threadX = 1.0 - smoothstep(0.5 - threadWidth, 0.5 + threadWidth, abs(threadPosX - 0.5));
        float threadY = 1.0 - smoothstep(0.5 - threadWidth, 0.5 + threadWidth, abs(threadPosY - 0.5));
        
        // Combine warp and weft threads
        float weave = max(threadX, threadY);
        
        return weave;
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
        float fiberIntensity = uFiberIntensity;
        float sheenIntensity = uSheen;
        float subsurfaceAmount = uSubsurface;
        float fuzzAmount = uFuzz;
        
        // Apply base texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply fiber map
        #ifdef USE_FIBER_MAP
          vec2 fiberUV = getUV(vFiberUv, uFiberUvTransform);
          vec4 fiberData = texture2D(uFiberMap, fiberUV);
          fiberIntensity *= fiberData.r;
          albedo *= mix(vec3(1.0), fiberData.rgb, fiberData.a);
        #endif
        
        // Apply weave map
        #ifdef USE_WEAVE_MAP
          vec2 weaveUV = getUV(vWeaveUv, uWeaveUvTransform);
          vec4 weaveData = texture2D(uWeaveMap, weaveUV);
          roughness *= mix(0.8, 1.2, weaveData.r);
          sheenIntensity *= weaveData.g;
        #endif
        
        // Calculate weave pattern
        float weave = weavePattern(vUv, uWeaveDensity, uThreadThickness);
        roughness = mix(roughness * 1.2, roughness * 0.8, weave);
        
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
        vec3 fiberLighting = vec3(0.0);
        vec3 sheenLighting = vec3(0.0);
        vec3 subsurfaceLighting = vec3(0.0);
        vec3 fuzzLighting = vec3(0.0);
        
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
          
          // Fabric-specific fiber lighting
          vec3 fabricBRDF = fabricBRDF(N, V, lightDir, uFiberColor, fiberIntensity, roughness);
          fiberLighting += fabricBRDF * uLightColor[i] * attenuation;
          
          // Sheen lighting for soft fabrics
          vec3 sheen = sheenBRDF(N, V, lightDir, uSheenColor, sheenIntensity);
          sheenLighting += sheen * uLightColor[i] * attenuation;
          
          // Subsurface scattering for thin fabrics
          if (subsurfaceAmount > 0.0) {
            vec3 subsurface = fabricSubsurface(N, V, lightDir, uSubsurfaceColor, subsurfaceAmount);
            subsurfaceLighting += subsurface * uLightColor[i] * attenuation;
          }
          
          // Fuzz lighting for fuzzy fabrics
          if (fuzzAmount > 0.0) {
            vec3 viewDir = normalize(V);
            vec3 lightDirN = normalize(lightDir);
            float fuzzScatter = max(0.0, dot(viewDir, lightDirN)) * fuzzAmount;
            fuzzLighting += uFuzzColor * fuzzScatter * uLightColor[i] * attenuation * 0.1;
          }
        }
        
        // Ambient lighting
        vec3 ambient = uAmbientLightColor * albedo;
        
        // Combine lighting components
        lighting = ambient + directLighting;
        lighting += fiberLighting * 0.8;
        lighting += sheenLighting * 0.6;
        lighting += subsurfaceLighting * 0.3;
        lighting += fuzzLighting;
        
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
    this.setProperty('uFiberColor', this.fiberColor);
    this.setProperty('uSheenColor', this.sheenColor);
    this.setProperty('uSubsurfaceColor', this.subsurfaceColor);
    this.setProperty('uFuzzColor', this.fuzzColor);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uFiberDirection', this.fiberDirection);
    this.setProperty('uFiberIntensity', this.fiberIntensity);
    this.setProperty('uWeaveDensity', this.weaveDensity);
    this.setProperty('uThreadThickness', this.threadThickness);
    this.setProperty('uSheen', this.sheen);
    this.setProperty('uSubsurface', this.subsurface);
    this.setProperty('uFuzz', this.fuzz);
    this.setProperty('uDisplacementScale', this.displacementScale);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uFiberUvTransform', this.fiberMapTransform);
    this.setProperty('uWeaveUvTransform', this.weaveMapTransform);
  }

  /**
   * Set fiber direction
   * @param {Array<number>} direction - Fiber direction vector [x, y, z]
   */
  setFiberDirection(direction) {
    const len = Math.sqrt(direction[0] * direction[0] + direction[2] * direction[2]);
    if (len > 0.0001) {
      this.fiberDirection = [direction[0] / len, 0, direction[2] / len];
    } else {
      this.fiberDirection = [1, 0, 0];
    }
    this.setProperty('uFiberDirection', this.fiberDirection);
    this.needsUpdate = true;
  }

  /**
   * Set fiber intensity
   * @param {number} intensity - Fiber lighting effect intensity (0.0+)
   */
  setFiberIntensity(intensity) {
    this.fiberIntensity = Math.max(0, intensity);
    this.setProperty('uFiberIntensity', this.fiberIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set fiber color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setFiberColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.fiberColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.fiberColor = color;
    }
    
    this.setProperty('uFiberColor', this.fiberColor);
    this.needsUpdate = true;
  }

  /**
   * Set weave density
   * @param {number} density - Thread density (0.0+)
   */
  setWeaveDensity(density) {
    this.weaveDensity = Math.max(0, density);
    this.setProperty('uWeaveDensity', this.weaveDensity);
    this.needsUpdate = true;
  }

  /**
   * Set thread thickness
   * @param {number} thickness - Thread thickness factor (0.0-1.0)
   */
  setThreadThickness(thickness) {
    this.threadThickness = Math.max(0, Math.min(1, thickness));
    this.setProperty('uThreadThickness', this.threadThickness);
    this.needsUpdate = true;
  }

  /**
   * Set fabric sheen
   * @param {number} sheen - Fabric sheen intensity (0.0-1.0)
   */
  setSheen(sheen) {
    this.sheen = Math.max(0, Math.min(1, sheen));
    this.setProperty('uSheen', this.sheen);
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
   * Set subsurface scattering
   * @param {number} subsurface - Subsurface scattering amount (0.0-1.0)
   */
  setSubsurface(subsurface) {
    this.subsurface = Math.max(0, Math.min(1, subsurface));
    this.setProperty('uSubsurface', this.subsurface);
    this.needsUpdate = true;
  }

  /**
   * Set subsurface color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setSubsurfaceColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.subsurfaceColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.subsurfaceColor = color;
    }
    
    this.setProperty('uSubsurfaceColor', this.subsurfaceColor);
    this.needsUpdate = true;
  }

  /**
   * Set fuzziness
   * @param {number} fuzz - Fuzziness amount (0.0-1.0)
   */
  setFuzz(fuzz) {
    this.fuzz = Math.max(0, Math.min(1, fuzz));
    this.setProperty('uFuzz', this.fuzz);
    this.needsUpdate = true;
  }

  /**
   * Set fuzz color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setFuzzColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.fuzzColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.fuzzColor = color;
    }
    
    this.setProperty('uFuzzColor', this.fuzzColor);
    this.needsUpdate = true;
  }

  /**
   * Set displacement scale
   * @param {number} scale - Height variation scale (0.0+)
   */
  setDisplacementScale(scale) {
    this.displacementScale = Math.max(0, scale);
    this.setProperty('uDisplacementScale', this.displacementScale);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for fiber map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setFiberUvTransform(transform) {
    this.fiberMapTransform = transform;
    this.setProperty('uFiberUvTransform', this.fiberMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for weave map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setWeaveUvTransform(transform) {
    this.weaveMapTransform = transform;
    this.setProperty('uWeaveUvTransform', this.weaveMapTransform);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    super.updateUniforms();
    
    // Update all cloth-specific uniforms
    this.shader.setUniform('uFiberDirection', this.fiberDirection);
    this.shader.setUniform('uFiberIntensity', this.fiberIntensity);
    this.shader.setUniform('uFiberColor', this.fiberColor);
    this.shader.setUniform('uWeaveDensity', this.weaveDensity);
    this.shader.setUniform('uThreadThickness', this.threadThickness);
    this.shader.setUniform('uSheen', this.sheen);
    this.shader.setUniform('uSheenColor', this.sheenColor);
    this.shader.setUniform('uSubsurface', this.subsurface);
    this.shader.setUniform('uSubsurfaceColor', this.subsurfaceColor);
    this.shader.setUniform('uFuzz', this.fuzz);
    this.shader.setUniform('uFuzzColor', this.fuzzColor);
    this.shader.setUniform('uDisplacementScale', this.displacementScale);
  }

  /**
   * Clone this material
   * @returns {ClothMaterial} A new material with the same properties
   */
  clone() {
    return new ClothMaterial({
      color: [...this.color],
      opacity: this.opacity,
      transparent: this.transparent,
      roughness: this.roughness,
      metalness: this.metalness,
      fiberDirection: [...this.fiberDirection],
      fiberIntensity: this.fiberIntensity,
      fiberColor: [...this.fiberColor],
      weaveDensity: this.weaveDensity,
      threadThickness: this.threadThickness,
      sheen: this.sheen,
      sheenColor: [...this.sheenColor],
      subsurfaceColor: [...this.subsurfaceColor],
      subsurface: this.subsurface,
      fuzz: this.fuzz,
      fuzzColor: [...this.fuzzColor],
      displacementScale: this.displacementScale,
      uvTransform: [...this.uvTransform],
      fiberMapTransform: [...this.fiberMapTransform],
      weaveMapTransform: [...this.weaveMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'ClothMaterial';
  }
}
