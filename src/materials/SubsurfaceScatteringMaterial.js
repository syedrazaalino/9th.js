/**
 * SubsurfaceScatteringMaterial
 * Advanced material for realistic skin and organic materials using subsurface scattering
 * This material simulates light diffusion through translucent materials like skin, wax, marble, etc.
 * 
 * Features:
 * - Subsurface scattering simulation
 * - Transmission and depth-based light transport
 * - Multiple scattering approximation
 * - Absorption simulation for colored materials
 * - Integration with standard PBR lighting model
 * 
 * @extends Material
 * @author WebGL Materials System
 * @version 1.0.0
 */

import { Material } from '../core/Material.js';

export class SubsurfaceScatteringMaterial extends Material {
  /**
   * Create a new SubsurfaceScatteringMaterial instance
   * @param {Object} options - Configuration options
   * @param {Array<number>} [options.color=[1,1,1]] - Base material color
   * @param {number} [options.subsurfaceColor=[1,0.7,0.5]] - Subsurface scattering color tint
   * @param {number} [options.subsurfaceIntensity=0.5] - Intensity of subsurface scattering effect
   * @param {number} [options.subsurfaceRadius=0.8] - Depth of light penetration
   * @param {number} [options.transmission=0.0] - Amount of transmitted light (0.0-1.0)
   * @param {number} [options.absorptionColor=[1,0.5,0.2]] - Color of light absorbed in material
   * @param {number} [options.absorption=0.5] - Strength of light absorption
   * @param {number} [options.opacity=1.0] - Material opacity
   * @param {number} [options.roughness=0.5] - Surface roughness (0.0-1.0)
   * @param {number} [options.metalness=0.0] - Metallic properties (0.0-1.0)
   * @param {boolean} [options.transparent=false] - Enable transparency
   * @param {number} [options.ior=1.5] - Index of refraction for transmission
   * @param {number} [options.thickness=1.0] - Object thickness for absorption
   * @param {number} [options.distortion=0.0] - Distortion for subsurface scattering
   * @param {number} [options.attenuationDistance=0.5] - Attenuation distance for scattered light
   * @param {Array<number>} [options.attenuationColor=[1,0.6,0.4]] - Color attenuation for distance
   * @param {Object} [options.map=null] - Base texture map
   * @param {Object} [options.thicknessMap=null] - Thickness variation map
   * @param {Object} [options.subsurfaceMap=null] - Subsurface properties map
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

    // Subsurface scattering properties
    this.subsurfaceColor = options.subsurfaceColor || [1, 0.7, 0.5];
    this.subsurfaceIntensity = options.subsurfaceIntensity !== undefined ? options.subsurfaceIntensity : 0.5;
    this.subsurfaceRadius = options.subsurfaceRadius !== undefined ? options.subsurfaceRadius : 0.8;

    // Transmission and absorption properties
    this.transmission = options.transmission !== undefined ? options.transmission : 0.0;
    this.absorptionColor = options.absorptionColor || [1, 0.5, 0.2];
    this.absorption = options.absorption !== undefined ? options.absorption : 0.5;

    // Advanced subsurface properties
    this.ior = options.ior !== undefined ? options.ior : 1.5;
    this.thickness = options.thickness !== undefined ? options.thickness : 1.0;
    this.distortion = options.distortion !== undefined ? options.distortion : 0.0;
    this.attenuationDistance = options.attenuationDistance !== undefined ? options.attenuationDistance : 0.5;
    this.attenuationColor = options.attenuationColor || [1, 0.6, 0.4];

    // Texture maps
    this.map = options.map || null;
    this.thicknessMap = options.thicknessMap || null;
    this.subsurfaceMap = options.subsurfaceMap || null;
    this.normalMap = options.normalMap || null;

    // UV transform properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.thicknessMapTransform = options.thicknessMapTransform || [0, 0, 1, 1, 0, 0];
    this.subsurfaceMapTransform = options.subsurfaceMapTransform || [0, 0, 1, 1, 0, 0];

    // Set up shader and uniforms
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for subsurface scattering
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
      varying vec2 vSubsurfaceUv;
      varying vec2 vThicknessUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      varying mat3 vTBN;
      varying vec3 vViewNormal;
      
      void main() {
        vUv = uv;
        vSubsurfaceUv = uv;
        vThicknessUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        vViewNormal = normalize(normalMatrix * normal);
        
        // Calculate TBN matrix for normal mapping
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
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
      uniform vec3 uSubsurfaceColor;
      uniform float uOpacity;
      uniform float uSubsurfaceIntensity;
      uniform float uSubsurfaceRadius;
      uniform float uTransmission;
      uniform vec3 uAbsorptionColor;
      uniform float uAbsorption;
      uniform float uRoughness;
      uniform float uMetalness;
      uniform float uIor;
      uniform float uThickness;
      uniform float uDistortion;
      uniform float uAttenuationDistance;
      uniform vec3 uAttenuationColor;
      
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
      uniform bool uUseThicknessMap;
      uniform bool uUseSubsurfaceMap;
      uniform bool uUseNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uThicknessMap;
      uniform sampler2D uSubsurfaceMap;
      uniform sampler2D uNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uSubsurfaceUvTransform;
      uniform vec4 uThicknessUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vSubsurfaceUv;
      varying vec2 vThicknessUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vViewNormal;
      varying mat3 vTBN;
      
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
      
      // Simple subsurface scattering approximation
      vec3 subsurfaceScattering(vec3 N, vec3 V, vec3 L, vec3 color, float radius, float intensity) {
        vec3 lightDir = normalize(L);
        vec3 viewDir = normalize(V);
        
        // Back-scattering approximation
        float backScatter = max(0.0, dot(-viewDir, lightDir));
        
        // Light falloff based on surface normal deviation
        float forwardScatter = max(0.0, dot(N, lightDir));
        
        // Combine front and back scattering
        float scatter = mix(backScatter, forwardScatter, 0.5);
        
        // Apply radius scaling
        scatter *= exp(-radius * radius);
        
        // Scale by intensity and subsurface color
        return color * intensity * scatter;
      }
      
      // Absorption calculation for colored materials
      vec3 absorption(vec3 color, vec3 absorptionColor, float absorption, float thickness) {
        // Beer-Lambert law: I = I0 * exp(-α * d)
        // where α = absorption * absorptionColor and d = thickness
        vec3 alpha = absorption * absorptionColor;
        vec3 absorptionFactor = exp(-alpha * thickness);
        return color * absorptionFactor;
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
        float thickness = uThickness;
        
        // Apply base texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply thickness map
        #ifdef USE_THICKNESS_MAP
          vec2 thicknessUV = getUV(vThicknessUv, uThicknessUvTransform);
          thickness *= texture2D(uThicknessMap, thicknessUV).r;
        #endif
        
        // Apply subsurface map
        #ifdef USE_SUBSURFACE_MAP
          vec2 subsurfaceUV = getUV(vSubsurfaceUv, uSubsurfaceUvTransform);
          vec4 subsurfaceData = texture2D(uSubsurfaceMap, subsurfaceUV);
          // Use subsurface map to modulate properties
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
        vec3 subsurfaceLight = vec3(0.0);
        
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
          
          // Subsurface scattering component
          if (uSubsurfaceIntensity > 0.0) {
            vec3 sss = subsurfaceScattering(N, V, lightDir, uSubsurfaceColor, uSubsurfaceRadius, uSubsurfaceIntensity);
            subsurfaceLight += sss * uLightColor[i] * attenuation;
          }
          
          // Transmission component
          if (uTransmission > 0.0) {
            vec3 transmitted = albedo * (1.0 - uTransmission);
            directLighting += transmitted * uLightColor[i] * attenuation * 0.1; // Reduced intensity for transmission
          }
        }
        
        // Ambient lighting
        vec3 ambient = uAmbientLightColor * albedo;
        
        // Apply absorption
        vec3 finalAlbedo = absorption(albedo, uAbsorptionColor, uAbsorption, thickness);
        
        // Combine lighting components
        lighting = ambient + directLighting + subsurfaceLight;
        
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
    this.setProperty('uSubsurfaceColor', this.subsurfaceColor);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uSubsurfaceIntensity', this.subsurfaceIntensity);
    this.setProperty('uSubsurfaceRadius', this.subsurfaceRadius);
    this.setProperty('uTransmission', this.transmission);
    this.setProperty('uAbsorptionColor', this.absorptionColor);
    this.setProperty('uAbsorption', this.absorption);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uIor', this.ior);
    this.setProperty('uThickness', this.thickness);
    this.setProperty('uDistortion', this.distortion);
    this.setProperty('uAttenuationDistance', this.attenuationDistance);
    this.setProperty('uAttenuationColor', this.attenuationColor);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uSubsurfaceUvTransform', this.subsurfaceMapTransform);
    this.setProperty('uThicknessUvTransform', this.thicknessMapTransform);
  }

  /**
   * Set subsurface scattering color
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
   * Set subsurface scattering intensity
   * @param {number} intensity - Scattering intensity (0.0+)
   */
  setSubsurfaceIntensity(intensity) {
    this.subsurfaceIntensity = Math.max(0, intensity);
    this.setProperty('uSubsurfaceIntensity', this.subsurfaceIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set subsurface scattering radius
   * @param {number} radius - Light penetration depth (0.0+)
   */
  setSubsurfaceRadius(radius) {
    this.subsurfaceRadius = Math.max(0, radius);
    this.setProperty('uSubsurfaceRadius', this.subsurfaceRadius);
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
   * Set absorption color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setAbsorptionColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.absorptionColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.absorptionColor = color;
    }
    
    this.setProperty('uAbsorptionColor', this.absorptionColor);
    this.needsUpdate = true;
  }

  /**
   * Set absorption strength
   * @param {number} absorption - Absorption strength (0.0+)
   */
  setAbsorption(absorption) {
    this.absorption = Math.max(0, absorption);
    this.setProperty('uAbsorption', this.absorption);
    this.needsUpdate = true;
  }

  /**
   * Set index of refraction
   * @param {number} ior - Index of refraction (1.0+)
   */
  setIor(ior) {
    this.ior = Math.max(1.0, ior);
    this.setProperty('uIor', this.ior);
    this.needsUpdate = true;
  }

  /**
   * Set material thickness
   * @param {number} thickness - Material thickness (0.0+)
   */
  setThickness(thickness) {
    this.thickness = Math.max(0, thickness);
    this.setProperty('uThickness', this.thickness);
    this.needsUpdate = true;
  }

  /**
   * Set distortion for subsurface scattering
   * @param {number} distortion - Distortion factor (0.0+)
   */
  setDistortion(distortion) {
    this.distortion = Math.max(0, distortion);
    this.setProperty('uDistortion', this.distortion);
    this.needsUpdate = true;
  }

  /**
   * Set attenuation distance
   * @param {number} distance - Attenuation distance (0.0+)
   */
  setAttenuationDistance(distance) {
    this.attenuationDistance = Math.max(0, distance);
    this.setProperty('uAttenuationDistance', this.attenuationDistance);
    this.needsUpdate = true;
  }

  /**
   * Set attenuation color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setAttenuationColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.attenuationColor = [r, g, b];
    } else if (Array.isArray(color)) {
      this.attenuationColor = color;
    }
    
    this.setProperty('uAttenuationColor', this.attenuationColor);
    this.needsUpdate = true;
  }

  /**
   * Set UV transform for subsurface map
   * @param {Array<number>} transform - UV transform [u, v, scaleU, scaleV, offsetU, offsetV]
   */
  setSubsurfaceUvTransform(transform) {
    this.subsurfaceMapTransform = transform;
    this.setProperty('uSubsurfaceUvTransform', this.subsurfaceMapTransform);
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
    
    // Update all subsurface-specific uniforms
    this.shader.setUniform('uSubsurfaceColor', this.subsurfaceColor);
    this.shader.setUniform('uSubsurfaceIntensity', this.subsurfaceIntensity);
    this.shader.setUniform('uSubsurfaceRadius', this.subsurfaceRadius);
    this.shader.setUniform('uTransmission', this.transmission);
    this.shader.setUniform('uAbsorptionColor', this.absorptionColor);
    this.shader.setUniform('uAbsorption', this.absorption);
    this.shader.setUniform('uIor', this.ior);
    this.shader.setUniform('uThickness', this.thickness);
    this.shader.setUniform('uDistortion', this.distortion);
    this.shader.setUniform('uAttenuationDistance', this.attenuationDistance);
    this.shader.setUniform('uAttenuationColor', this.attenuationColor);
  }

  /**
   * Clone this material
   * @returns {SubsurfaceScatteringMaterial} A new material with the same properties
   */
  clone() {
    return new SubsurfaceScatteringMaterial({
      color: [...this.color],
      subsurfaceColor: [...this.subsurfaceColor],
      opacity: this.opacity,
      transparent: this.transparent,
      roughness: this.roughness,
      metalness: this.metalness,
      subsurfaceIntensity: this.subsurfaceIntensity,
      subsurfaceRadius: this.subsurfaceRadius,
      transmission: this.transmission,
      absorptionColor: [...this.absorptionColor],
      absorption: this.absorption,
      ior: this.ior,
      thickness: this.thickness,
      distortion: this.distortion,
      attenuationDistance: this.attenuationDistance,
      attenuationColor: [...this.attenuationColor],
      uvTransform: [...this.uvTransform],
      subsurfaceMapTransform: [...this.subsurfaceMapTransform],
      thicknessMapTransform: [...this.thicknessMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'SubsurfaceScatteringMaterial';
  }
}
