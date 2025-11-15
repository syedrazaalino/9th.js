/**
 * MeshPhysicalMaterial
 * Advanced PBR material with physical properties for realistic materials
 */

import { Material } from '../core/Material.js';

export class MeshPhysicalMaterial extends Material {
  constructor(options = {}) {
    super(null);

    // Color properties
    this.color = options.color || [1, 1, 1];
    this.emissive = options.emissive || [0, 0, 0];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // PBR properties
    this.metalness = options.metalness !== undefined ? options.metalness : 0.0;
    this.roughness = options.roughness !== undefined ? options.roughness : 0.5;
    this.emissiveIntensity = options.emissiveIntensity !== undefined ? options.emissiveIntensity : 1.0;

    // Advanced physical properties
    this.reflectivity = options.reflectivity !== undefined ? options.reflectivity : 0.5;
    this.ior = options.ior !== undefined ? options.ior : 1.5; // Index of Refraction
    this.sheen = options.sheen !== undefined ? options.sheen : 0.0;
    this.sheenTint = options.sheenTint !== undefined ? options.sheenTint : 0.0;
    this.clearcoat = options.clearcoat !== undefined ? options.clearcoat : 0.0;
    this.clearcoatRoughness = options.clearcoatRoughness !== undefined ? options.clearcoatRoughness : 0.0;
    
    // Transmission for transparent materials
    this.transmission = options.transmission !== undefined ? options.transmission : 0.0;
    this.thickness = options.thickness !== undefined ? options.thickness : 0.0;
    this.attenuationColor = options.attenuationColor || [1, 1, 1];
    this.attenuationDistance = options.attenuationDistance !== undefined ? options.attenuationDistance : 0.0;
    
    // Iridescence
    this.iridescence = options.iridescence !== undefined ? options.iridescence : 0.0;
    this.iridescenceIOR = options.iridescenceIOR !== undefined ? options.iridescenceIOR : 1.3;
    this.iridescenceThicknessRange = options.iridescenceThicknessRange || [100, 800];

    // Physical intensities
    this.envMapIntensity = options.envMapIntensity !== undefined ? options.envMapIntensity : 1.0;
    this.lightMapIntensity = options.lightMapIntensity !== undefined ? options.lightMapIntensity : 1.0;
    this.aoMapIntensity = options.aoMapIntensity !== undefined ? options.aoMapIntensity : 1.0;

    // Texture maps
    this.map = options.map || null;
    this.emissiveMap = options.emissiveMap || null;
    this.alphaMap = options.alphaMap || null;
    this.bumpMap = options.bumpMap || null;
    this.bumpScale = options.bumpScale !== undefined ? options.bumpScale : 1.0;
    this.normalMap = options.normalMap || null;
    this.normalScale = options.normalScale || [1, 1];
    this.displacementMap = options.displacementMap || null;
    this.displacementScale = options.displacementScale !== undefined ? options.displacementScale : 1.0;
    this.displacementBias = options.displacementBias !== undefined ? options.displacementBias : 0.0;
    this.roughnessMap = options.roughnessMap || null;
    this.metalnessMap = options.metalnessMap || null;
    this.aoMap = options.aoMap || null;
    this.envMap = options.envMap || null;
    this.transmissionMap = options.transmissionMap || null;
    this.thicknessMap = options.thicknessMap || null;
    this.iorMap = options.iorMap || null;
    this.sheenColorMap = options.sheenColorMap || null;
    this.clearcoatMap = options.clearcoatMap || null;
    this.clearcoatNormalMap = options.clearcoatNormalMap || null;

    // UV properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.normalMapTransform = options.normalMapTransform || [0, 0, 1, 1, 0, 0];
    this.roughnessMapTransform = options.roughnessMapTransform || [0, 0, 1, 1, 0, 0];
    this.metalnessMapTransform = options.metalnessMapTransform || [0, 0, 1, 1, 0, 0];
    this.aoMapTransform = options.aoMapTransform || [0, 0, 1, 1, 0, 0];
    this.emissiveMapTransform = options.emissiveMapTransform || [0, 0, 1, 1, 0, 0];
    this.transmissionMapTransform = options.transmissionMapTransform || [0, 0, 1, 1, 0, 0];
    this.thicknessMapTransform = options.thicknessMapTransform || [0, 0, 1, 1, 0, 0];
    this.sheenColorMapTransform = options.sheenColorMapTransform || [0, 0, 1, 1, 0, 0];
    this.clearcoatMapTransform = options.clearcoatMapTransform || [0, 0, 1, 1, 0, 0];
    this.clearcoatNormalMapTransform = options.clearcoatNormalMapTransform || [0, 0, 1, 1, 0, 0];

    // Additional properties
    this.alphaTest = options.alphaTest || 0.0;
    this.side = options.side || 'front';
    this.vertexColors = options.vertexColors || false;

    // Set up shader
    this.shader = this._createShader();
    this._initializeUniforms();
  }

  /**
   * Create the shader program for this material
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
      varying vec2 vNormalUv;
      varying vec2 vRoughnessUv;
      varying vec2 vMetalnessUv;
      varying vec2 vAoUv;
      varying vec2 vEmissiveUv;
      varying vec2 vTransmissionUv;
      varying vec2 vThicknessUv;
      varying vec2 vSheenColorUv;
      varying vec2 vClearcoatUv;
      varying vec2 vClearcoatNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      varying mat3 vTBN;
      
      void main() {
        vUv = uv;
        vNormalUv = uv;
        vRoughnessUv = uv;
        vMetalnessUv = uv;
        vAoUv = uv;
        vEmissiveUv = uv;
        vTransmissionUv = uv;
        vThicknessUv = uv;
        vSheenColorUv = uv;
        vClearcoatUv = uv;
        vClearcoatNormalUv = uv;
        
        // Transform normal to view space
        vec3 N = normalize(normalMatrix * normal);
        vNormal = N;
        
        // Calculate TBN matrix for normal mapping
        vec3 T = normalize(normalMatrix * tangent);
        vec3 B = normalize(normalMatrix * bitangent);
        vTBN = mat3(T, B, N);
        
        // Calculate view position
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        // Calculate world position
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        // Pass color if using vertex colors
        #ifdef USE_VERTEX_COLORS
          vColor = color;
        #endif
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      precision highp float;
      
      uniform vec3 uColor;
      uniform vec3 uEmissive;
      uniform vec3 uAttenuationColor;
      uniform float uOpacity;
      uniform float uAlphaTest;
      uniform bool uTransparent;
      uniform float uMetalness;
      uniform float uRoughness;
      uniform float uEmissiveIntensity;
      uniform float uReflectivity;
      uniform float uIor;
      uniform float uSheen;
      uniform float uSheenTint;
      uniform float uClearcoat;
      uniform float uClearcoatRoughness;
      uniform float uTransmission;
      uniform float uThickness;
      uniform float uAttenuationDistance;
      uniform float uIridescence;
      uniform float uIridescenceIOR;
      uniform vec2 uIridescenceThicknessRange;
      uniform float uEnvMapIntensity;
      uniform float uLightMapIntensity;
      uniform float uAoMapIntensity;
      uniform float uBumpScale;
      uniform float uDisplacementScale;
      uniform float uDisplacementBias;
      uniform vec2 uNormalScale;
      
      uniform vec3 uAmbientLightColor;
      uniform vec3 uLightColor[8];
      uniform vec3 uLightPosition[8];
      uniform float uLightDistance[8];
      uniform float uLightDecay[8];
      uniform int uLightCount;
      uniform vec3 uCameraPosition;
      
      uniform bool uUseMap;
      uniform bool uUseEmissiveMap;
      uniform bool uUseAlphaMap;
      uniform bool uUseBumpMap;
      uniform bool uUseNormalMap;
      uniform bool uUseDisplacementMap;
      uniform bool uUseRoughnessMap;
      uniform bool uUseMetalnessMap;
      uniform bool uUseAoMap;
      uniform bool uUseEnvMap;
      uniform bool uUseLightMap;
      uniform bool uUseTransmissionMap;
      uniform bool uUseThicknessMap;
      uniform bool uUseIORMap;
      uniform bool uUseSheenColorMap;
      uniform bool uUseClearcoatMap;
      uniform bool uUseClearcoatNormalMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uEmissiveMap;
      uniform sampler2D uAlphaMap;
      uniform sampler2D uBumpMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uDisplacementMap;
      uniform sampler2D uRoughnessMap;
      uniform sampler2D uMetalnessMap;
      uniform sampler2D uAoMap;
      uniform sampler2D uEnvMap;
      uniform sampler2D uLightMap;
      uniform sampler2D uTransmissionMap;
      uniform sampler2D uThicknessMap;
      uniform sampler2D uIorMap;
      uniform sampler2D uSheenColorMap;
      uniform sampler2D uClearcoatMap;
      uniform sampler2D uClearcoatNormalMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uNormalUvTransform;
      uniform vec4 uRoughnessUvTransform;
      uniform vec4 uMetalnessUvTransform;
      uniform vec4 uAoUvTransform;
      uniform vec4 uEmissiveUvTransform;
      uniform vec4 uTransmissionUvTransform;
      uniform vec4 uThicknessUvTransform;
      uniform vec4 uSheenColorUvTransform;
      uniform vec4 uClearcoatUvTransform;
      uniform vec4 uClearcoatNormalUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vNormalUv;
      varying vec2 vRoughnessUv;
      varying vec2 vMetalnessUv;
      varying vec2 vAoUv;
      varying vec2 vEmissiveUv;
      varying vec2 vTransmissionUv;
      varying vec2 vThicknessUv;
      varying vec2 vSheenColorUv;
      varying vec2 vClearcoatUv;
      varying vec2 vClearcoatNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      varying mat3 vTBN;
      
      // Constants for PBR calculations
      const float PI = 3.14159265359;
      
      // Texture coordinate transformation
      vec2 getUV(vec2 uv, vec4 transform) {
        return uv * transform.zw + transform.xy;
      }
      
      // Fresnel Schlick approximation
      vec3 fresnelSchlick(float cosTheta, vec3 F0) {
        return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
      }
      
      // Schlick-GGX geometry function
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
      
      // Clearcoat NDF
      float distributionClearcoat(vec3 N, vec3 H, float clearcoatRoughness) {
        float ccRoughness = mix(0.04, 1.0 - clearcoatRoughness, clearcoatRoughness);
        return distributionGGX(N, H, ccRoughness);
      }
      
      // Sheen BRDF
      vec3 sheenBRDF(vec3 N, vec3 V, vec3 L, float sheen, vec3 sheenTint) {
        vec3 H = normalize(V + L);
        float cosTheta = max(dot(H, V), 0.0);
        
        // Sheen grazing reflection
        vec3 sheenReflection = sheenTint * pow(1.0 - cosTheta, 5.0) * sheen;
        return sheenReflection;
      }
      
      // Cook-Torrance BRDF
      vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 albedo, float metallic, float roughness, float ior) {
        vec3 H = normalize(V + L);
        
        float NdotL = max(dot(N, L), 0.0);
        float NdotV = max(dot(N, V), 0.0);
        
        vec3 F0 = mix(vec3(0.04), albedo, metallic);
        F0 = (ior - 1.0) / (ior + 1.0);
        F0 = F0 * F0;
        
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
        float D = distributionGGX(N, H, roughness);
        float G = geometrySmith(N, V, L, roughness);
        
        vec3 numerator = D * G * F;
        float denominator = 4.0 * NdotV * NdotL + 0.001;
        vec3 specular = numerator / denominator;
        
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;
        
        return (kD * albedo / PI + specular) * NdotL;
      }
      
      // Transmission calculation for transparent materials
      vec3 calculateTransmission(vec3 color, vec3 normal, vec3 viewDir, float transmission, float thickness, vec3 attenuationColor, float attenuationDistance) {
        if (transmission <= 0.0) return color;
        
        float ior = 1.5; // Default IOR
        
        // Fresnel term for transmission
        vec3 F = fresnelSchlick(max(dot(-viewDir, normal), 0.0), vec3(ior));
        
        // Beer-Lambert law for absorption
        vec3 absorption = exp(-attenuationColor * thickness / max(attenuationDistance, 0.001));
        
        // Calculate transmitted color
        vec3 transmitted = color * (1.0 - F) * transmission * absorption;
        
        return transmitted;
      }
      
      // Iridescence calculation (simplified)
      vec3 calculateIridescence(vec3 baseColor, vec3 normal, vec3 viewDir, float iridescence, float iridescenceIOR) {
        if (iridescence <= 0.0) return baseColor;
        
        float thickness = 400.0; // Base thickness in nanometers
        vec3 fresnelIridescence = fresnelSchlick(max(dot(-viewDir, normal), 0.0), vec3(iridescenceIOR));
        
        // Apply iridescence effect
        return mix(baseColor, baseColor * fresnelIridescence, iridescence);
      }
      
      // Perturb normal using normal map
      vec3 perturbNormal(vec3 normal, vec3 viewDir, vec2 uv, mat3 TBN) {
        vec3 tangentNormal = texture2D(uNormalMap, getUV(uv, uNormalUvTransform)).xyz * 2.0 - 1.0;
        tangentNormal.xy *= uNormalScale;
        return normalize(TBN * tangentNormal);
      }
      
      void main() {
        vec3 albedo = uColor;
        float metallic = uMetalness;
        float roughness = uRoughness;
        float clearcoat = uClearcoat;
        float clearcoatRoughness = uClearcoatRoughness;
        float sheen = uSheen;
        vec3 sheenTint = vec3(uSheenTint);
        float transmission = uTransmission;
        float thickness = uThickness;
        vec3 attenuationColor = uAttenuationColor;
        
        // Use vertex colors if available
        #ifdef USE_VERTEX_COLORS
          albedo *= vColor;
        #endif
        
        // Apply main texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          albedo *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply emissive map
        #ifdef USE_EMISSIVE_MAP
          vec2 emissiveUV = getUV(vEmissiveUv, uEmissiveUvTransform);
          uEmissive *= texture2D(uEmissiveMap, emissiveUV).rgb;
        #endif
        
        // Apply alpha map
        #ifdef USE_ALPHA_MAP
          vec2 alphaUV = getUV(vUv, uUvTransform);
          float alpha = texture2D(uAlphaMap, alphaUV).r;
          if (uAlphaTest > 0.0 && alpha < uAlphaTest) {
            discard;
          }
        #endif
        
        // Apply transmission map
        #ifdef USE_TRANSMISSION_MAP
          vec2 transmissionUV = getUV(vTransmissionUv, uTransmissionUvTransform);
          transmission *= texture2D(uTransmissionMap, transmissionUV).r;
        #endif
        
        // Apply thickness map
        #ifdef USE_THICKNESS_MAP
          vec2 thicknessUV = getUV(vThicknessUv, uThicknessUvTransform);
          thickness *= texture2D(uThicknessMap, thicknessUV).r;
        #endif
        
        // Apply roughness map
        #ifdef USE_ROUGHNESS_MAP
          vec2 roughnessUV = getUV(vRoughnessUv, uRoughnessUvTransform);
          roughness *= texture2D(uRoughnessMap, roughnessUV).r;
        #endif
        
        // Apply metalness map
        #ifdef USE_METALNESS_MAP
          vec2 metalnessUV = getUV(vMetalnessUv, uMetalnessUvTransform);
          metallic *= texture2D(uMetalnessMap, metalnessUV).r;
        #endif
        
        // Apply clearcoat map
        #ifdef USE_CLEARCOAT_MAP
          vec2 clearcoatUV = getUV(vClearcoatUv, uClearcoatUvTransform);
          clearcoat *= texture2D(uClearcoatMap, clearcoatUV).r;
        #endif
        
        // Apply clearcoat normal map
        #ifdef USE_CLEARCOAT_NORMAL_MAP
          vec2 ccNormalUV = getUV(vClearcoatNormalUv, uClearcoatNormalUvTransform);
          vec3 ccNormal = texture2D(uClearcoatNormalMap, ccNormalUV).xyz * 2.0 - 1.0;
          ccNormal = normalize(vTBN * ccNormal);
        #endif
        
        // Apply sheen color map
        #ifdef USE_SHEEN_COLOR_MAP
          vec2 sheenColorUV = getUV(vSheenColorUv, uSheenColorUvTransform);
          sheenTint *= texture2D(uSheenColorMap, sheenColorUV).rgb;
        #endif
        
        // Apply AO map
        #ifdef USE_AO_MAP
          vec2 aoUV = getUV(vAoUv, uAoUvTransform);
          float ao = texture2D(uAoMap, aoUV).r;
          // Apply AO to final lighting
        #endif
        
        // Apply normal mapping
        vec3 N = normalize(vNormal);
        #ifdef USE_NORMAL_MAP
          N = perturbNormal(N, normalize(vViewPosition), vNormalUv, vTBN);
        #endif
        
        vec3 V = normalize(vViewPosition);
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        vec3 directLighting = vec3(0.0);
        vec3 indirectLighting = vec3(0.0);
        
        // Direct lighting (lights in the scene)
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
          
          // Base Cook-Torrance BRDF
          vec3 brdf = cookTorranceBRDF(N, V, lightDir, albedo, metallic, roughness, uIor);
          directLighting += brdf * uLightColor[i] * attenuation;
          
          // Sheen component
          if (sheen > 0.0) {
            vec3 sheenComponent = sheenBRDF(N, V, lightDir, sheen, sheenTint);
            directLighting += sheenComponent * uLightColor[i] * attenuation;
          }
          
          // Clearcoat component
          if (clearcoat > 0.0) {
            vec3 H = normalize(V + lightDir);
            float D = distributionClearcoat(N, H, clearcoatRoughness);
            float G = geometrySmith(N, V, lightDir, clearcoatRoughness);
            vec3 F = fresnelSchlick(max(dot(H, V), 0.0), vec3(0.04));
            
            vec3 ccSpecular = D * G * F / (4.0 * max(dot(N, V), 0.0) * max(dot(N, lightDir), 0.0));
            directLighting += ccSpecular * clearcoat * uLightColor[i] * attenuation;
          }
        }
        
        // Ambient lighting
        indirectLighting += uAmbientLightColor * albedo;
        
        // Apply light map
        #ifdef USE_LIGHT_MAP
          vec2 lightUV = getUV(vUv, uUvTransform);
          indirectLighting *= texture2D(uLightMap, lightUV).rgb * uLightMapIntensity;
        #endif
        
        // Apply iridescence
        albedo = calculateIridescence(albedo, N, V, uIridescence, uIridescenceIOR);
        
        // Apply transmission for transparent materials
        vec3 transmitted = calculateTransmission(albedo, N, V, transmission, thickness, attenuationColor, uAttenuationDistance);
        
        // Apply bump mapping
        #ifdef USE_BUMP_MAP
          vec2 bumpUV = getUV(vUv, uUvTransform);
          float bump = texture2D(uBumpMap, bumpUV).r;
          vec3 bumpNormal = normalize(vNormal + vec3(0.0, 0.0, uBumpScale * (bump - 0.5)));
          directLighting *= max(dot(bumpNormal, lightDir), 0.0) / max(dot(vNormal, lightDir), 0.01);
        #endif
        
        // Apply displacement
        #ifdef USE_DISPLACEMENT_MAP
          vec2 displacementUV = getUV(vUv, uUvTransform);
          float displacement = texture2D(uDisplacementMap, displacementUV).r;
          // Displacement would be applied in vertex shader in real implementation
        #endif
        
        // Apply AO to lighting
        #ifdef USE_AO_MAP
          directLighting *= ao;
          indirectLighting *= ao;
        #endif
        
        // Environment map reflection (simplified)
        #ifdef USE_ENV_MAP
          vec3 R = reflect(-V, N);
          vec3 envColor = texture2D(uEnvMap, R).rgb * uEnvMapIntensity;
          indirectLighting += envColor;
        #endif
        
        lighting = directLighting + indirectLighting + uEmissive * uEmissiveIntensity + transmitted;
        
        vec4 color = vec4(lighting, uOpacity);
        
        // Handle transparency
        if (uTransparent && color.a < 1.0) {
          // Allow alpha blending
        }
        
        gl_FragColor = color;
      }
    `;

    // Return shader object (simplified)
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
   * Initialize material uniforms
   */
  _initializeUniforms() {
    this.setProperty('uColor', this.color);
    this.setProperty('uEmissive', this.emissive);
    this.setProperty('uAttenuationColor', this.attenuationColor);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uAlphaTest', this.alphaTest);
    this.setProperty('uTransparent', this.transparent);
    this.setProperty('uMetalness', this.metalness);
    this.setProperty('uRoughness', this.roughness);
    this.setProperty('uEmissiveIntensity', this.emissiveIntensity);
    this.setProperty('uReflectivity', this.reflectivity);
    this.setProperty('uIor', this.ior);
    this.setProperty('uSheen', this.sheen);
    this.setProperty('uSheenTint', this.sheenTint);
    this.setProperty('uClearcoat', this.clearcoat);
    this.setProperty('uClearcoatRoughness', this.clearcoatRoughness);
    this.setProperty('uTransmission', this.transmission);
    this.setProperty('uThickness', this.thickness);
    this.setProperty('uAttenuationDistance', this.attenuationDistance);
    this.setProperty('uIridescence', this.iridescence);
    this.setProperty('uIridescenceIOR', this.iridescenceIOR);
    this.setProperty('uIridescenceThicknessRange', this.iridescenceThicknessRange);
    this.setProperty('uEnvMapIntensity', this.envMapIntensity);
    this.setProperty('uLightMapIntensity', this.lightMapIntensity);
    this.setProperty('uAoMapIntensity', this.aoMapIntensity);
    this.setProperty('uBumpScale', this.bumpScale);
    this.setProperty('uDisplacementScale', this.displacementScale);
    this.setProperty('uDisplacementBias', this.displacementBias);
    this.setProperty('uNormalScale', this.normalScale);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uNormalUvTransform', this.normalMapTransform);
    this.setProperty('uRoughnessUvTransform', this.roughnessMapTransform);
    this.setProperty('uMetalnessUvTransform', this.metalnessMapTransform);
    this.setProperty('uAoUvTransform', this.aoMapTransform);
    this.setProperty('uEmissiveUvTransform', this.emissiveMapTransform);
    this.setProperty('uTransmissionUvTransform', this.transmissionMapTransform);
    this.setProperty('uThicknessUvTransform', this.thicknessMapTransform);
    this.setProperty('uSheenColorUvTransform', this.sheenColorMapTransform);
    this.setProperty('uClearcoatUvTransform', this.clearcoatMapTransform);
    this.setProperty('uClearcoatNormalUvTransform', this.clearcoatNormalMapTransform);
  }

  /**
   * Set material color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setColor(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.color = [r, g, b];
    } else if (Array.isArray(color)) {
      this.color = color;
    }
    
    this.setProperty('uColor', this.color);
    this.needsUpdate = true;
  }

  /**
   * Set emissive color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setEmissive(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.emissive = [r, g, b];
    } else if (Array.isArray(color)) {
      this.emissive = color;
    }
    
    this.setProperty('uEmissive', this.emissive);
    this.needsUpdate = true;
  }

  /**
   * Set metalness value
   * @param {number} metalness - Metalness value (0.0 to 1.0)
   */
  setMetalness(metalness) {
    this.metalness = Math.max(0, Math.min(1, metalness));
    this.setProperty('uMetalness', this.metalness);
    this.needsUpdate = true;
  }

  /**
   * Set roughness value
   * @param {number} roughness - Roughness value (0.0 to 1.0)
   */
  setRoughness(roughness) {
    this.roughness = Math.max(0, Math.min(1, roughness));
    this.setProperty('uRoughness', this.roughness);
    this.needsUpdate = true;
  }

  /**
   * Set reflectivity value
   * @param {number} reflectivity - Reflectivity value (0.0 to 1.0)
   */
  setReflectivity(reflectivity) {
    this.reflectivity = Math.max(0, Math.min(1, reflectivity));
    this.setProperty('uReflectivity', this.reflectivity);
    this.needsUpdate = true;
  }

  /**
   * Set index of refraction
   * @param {number} ior - IOR value
   */
  setIor(ior) {
    this.ior = Math.max(1.0, ior);
    this.setProperty('uIor', this.ior);
    this.needsUpdate = true;
  }

  /**
   * Set sheen value
   * @param {number} sheen - Sheen value (0.0 to 1.0)
   */
  setSheen(sheen) {
    this.sheen = Math.max(0, Math.min(1, sheen));
    this.setProperty('uSheen', this.sheen);
    this.needsUpdate = true;
  }

  /**
   * Set sheen tint
   * @param {number} tint - Sheen tint value (0.0 to 1.0)
   */
  setSheenTint(tint) {
    this.sheenTint = Math.max(0, Math.min(1, tint));
    this.setProperty('uSheenTint', this.sheenTint);
    this.needsUpdate = true;
  }

  /**
   * Set clearcoat value
   * @param {number} clearcoat - Clearcoat value (0.0 to 1.0)
   */
  setClearcoat(clearcoat) {
    this.clearcoat = Math.max(0, Math.min(1, clearcoat));
    this.setProperty('uClearcoat', this.clearcoat);
    this.needsUpdate = true;
  }

  /**
   * Set clearcoat roughness
   * @param {number} roughness - Clearcoat roughness value (0.0 to 1.0)
   */
  setClearcoatRoughness(roughness) {
    this.clearcoatRoughness = Math.max(0, Math.min(1, roughness));
    this.setProperty('uClearcoatRoughness', this.clearcoatRoughness);
    this.needsUpdate = true;
  }

  /**
   * Set transmission value
   * @param {number} transmission - Transmission value (0.0 to 1.0)
   */
  setTransmission(transmission) {
    this.transmission = Math.max(0, Math.min(1, transmission));
    this.setProperty('uTransmission', this.transmission);
    this.needsUpdate = true;
  }

  /**
   * Set thickness value
   * @param {number} thickness - Thickness value
   */
  setThickness(thickness) {
    this.thickness = Math.max(0, thickness);
    this.setProperty('uThickness', this.thickness);
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
   * Set attenuation distance
   * @param {number} distance - Attenuation distance
   */
  setAttenuationDistance(distance) {
    this.attenuationDistance = Math.max(0, distance);
    this.setProperty('uAttenuationDistance', this.attenuationDistance);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence value
   * @param {number} iridescence - Iridescence value (0.0 to 1.0)
   */
  setIridescence(iridescence) {
    this.iridescence = Math.max(0, Math.min(1, iridescence));
    this.setProperty('uIridescence', this.iridescence);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence IOR
   * @param {number} ior - Iridescence IOR value
   */
  setIridescenceIOR(ior) {
    this.iridescenceIOR = Math.max(1.0, ior);
    this.setProperty('uIridescenceIOR', this.iridescenceIOR);
    this.needsUpdate = true;
  }

  /**
   * Set iridescence thickness range
   * @param {Array<number>} range - Thickness range [min, max]
   */
  setIridescenceThicknessRange(range) {
    this.iridescenceThicknessRange = range;
    this.setProperty('uIridescenceThicknessRange', this.iridescenceThicknessRange);
    this.needsUpdate = true;
  }

  /**
   * Set emissive intensity
   * @param {number} intensity - Emissive intensity
   */
  setEmissiveIntensity(intensity) {
    this.emissiveIntensity = Math.max(0, intensity);
    this.setProperty('uEmissiveIntensity', this.emissiveIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set environment map intensity
   * @param {number} intensity - Environment map intensity
   */
  setEnvMapIntensity(intensity) {
    this.envMapIntensity = Math.max(0, intensity);
    this.setProperty('uEnvMapIntensity', this.envMapIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set light map intensity
   * @param {number} intensity - Light map intensity
   */
  setLightMapIntensity(intensity) {
    this.lightMapIntensity = intensity;
    this.setProperty('uLightMapIntensity', this.lightMapIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set AO map intensity
   * @param {number} intensity - AO map intensity
   */
  setAoMapIntensity(intensity) {
    this.aoMapIntensity = intensity;
    this.setProperty('uAoMapIntensity', this.aoMapIntensity);
    this.needsUpdate = true;
  }

  /**
   * Set bump scale
   * @param {number} scale - Bump scale factor
   */
  setBumpScale(scale) {
    this.bumpScale = scale;
    this.setProperty('uBumpScale', this.bumpScale);
    this.needsUpdate = true;
  }

  /**
   * Set displacement scale
   * @param {number} scale - Displacement scale factor
   */
  setDisplacementScale(scale) {
    this.displacementScale = scale;
    this.setProperty('uDisplacementScale', this.displacementScale);
    this.needsUpdate = true;
  }

  /**
   * Set displacement bias
   * @param {number} bias - Displacement bias
   */
  setDisplacementBias(bias) {
    this.displacementBias = bias;
    this.setProperty('uDisplacementBias', this.displacementBias);
    this.needsUpdate = true;
  }

  /**
   * Set normal scale
   * @param {Array<number>} scale - Normal map scale [x, y]
   */
  setNormalScale(scale) {
    this.normalScale = scale;
    this.setProperty('uNormalScale', this.normalScale);
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    super.updateUniforms();
    
    // Update all uniforms
    this.shader.setUniform('uColor', this.color);
    this.shader.setUniform('uEmissive', this.emissive);
    this.shader.setUniform('uAttenuationColor', this.attenuationColor);
    this.shader.setUniform('uOpacity', this.opacity);
    this.shader.setUniform('uMetalness', this.metalness);
    this.shader.setUniform('uRoughness', this.roughness);
    this.shader.setUniform('uEmissiveIntensity', this.emissiveIntensity);
    this.shader.setUniform('uReflectivity', this.reflectivity);
    this.shader.setUniform('uIor', this.ior);
    this.shader.setUniform('uSheen', this.sheen);
    this.shader.setUniform('uSheenTint', this.sheenTint);
    this.shader.setUniform('uClearcoat', this.clearcoat);
    this.shader.setUniform('uClearcoatRoughness', this.clearcoatRoughness);
    this.shader.setUniform('uTransmission', this.transmission);
    this.shader.setUniform('uThickness', this.thickness);
    this.shader.setUniform('uAttenuationDistance', this.attenuationDistance);
    this.shader.setUniform('uIridescence', this.iridescence);
    this.shader.setUniform('uIridescenceIOR', this.iridescenceIOR);
    this.shader.setUniform('uIridescenceThicknessRange', this.iridescenceThicknessRange);
    this.shader.setUniform('uEnvMapIntensity', this.envMapIntensity);
    this.shader.setUniform('uLightMapIntensity', this.lightMapIntensity);
    this.shader.setUniform('uAoMapIntensity', this.aoMapIntensity);
    this.shader.setUniform('uBumpScale', this.bumpScale);
    this.shader.setUniform('uDisplacementScale', this.displacementScale);
    this.shader.setUniform('uDisplacementBias', this.displacementBias);
    this.shader.setUniform('uNormalScale', this.normalScale);
    this.shader.setUniform('uUvTransform', this.uvTransform);
    this.shader.setUniform('uNormalUvTransform', this.normalMapTransform);
    this.shader.setUniform('uRoughnessUvTransform', this.roughnessMapTransform);
    this.shader.setUniform('uMetalnessUvTransform', this.metalnessMapTransform);
    this.shader.setUniform('uAoUvTransform', this.aoMapTransform);
    this.shader.setUniform('uEmissiveUvTransform', this.emissiveMapTransform);
    this.shader.setUniform('uTransmissionUvTransform', this.transmissionMapTransform);
    this.shader.setUniform('uThicknessUvTransform', this.thicknessMapTransform);
    this.shader.setUniform('uSheenColorUvTransform', this.sheenColorMapTransform);
    this.shader.setUniform('uClearcoatUvTransform', this.clearcoatMapTransform);
    this.shader.setUniform('uClearcoatNormalUvTransform', this.clearcoatNormalMapTransform);
  }

  /**
   * Clone this material
   * @returns {MeshPhysicalMaterial} A new material with the same properties
   */
  clone() {
    return new MeshPhysicalMaterial({
      color: [...this.color],
      emissive: [...this.emissive],
      opacity: this.opacity,
      transparent: this.transparent,
      metalness: this.metalness,
      roughness: this.roughness,
      emissiveIntensity: this.emissiveIntensity,
      reflectivity: this.reflectivity,
      ior: this.ior,
      sheen: this.sheen,
      sheenTint: this.sheenTint,
      clearcoat: this.clearcoat,
      clearcoatRoughness: this.clearcoatRoughness,
      transmission: this.transmission,
      thickness: this.thickness,
      attenuationColor: [...this.attenuationColor],
      attenuationDistance: this.attenuationDistance,
      iridescence: this.iridescence,
      iridescenceIOR: this.iridescenceIOR,
      iridescenceThicknessRange: [...this.iridescenceThicknessRange],
      envMapIntensity: this.envMapIntensity,
      lightMapIntensity: this.lightMapIntensity,
      aoMapIntensity: this.aoMapIntensity,
      bumpScale: this.bumpScale,
      displacementScale: this.displacementScale,
      displacementBias: this.displacementBias,
      normalScale: [...this.normalScale],
      uvTransform: [...this.uvTransform],
      normalMapTransform: [...this.normalMapTransform],
      roughnessMapTransform: [...this.roughnessMapTransform],
      metalnessMapTransform: [...this.metalnessMapTransform],
      aoMapTransform: [...this.aoMapTransform],
      emissiveMapTransform: [...this.emissiveMapTransform],
      transmissionMapTransform: [...this.transmissionMapTransform],
      thicknessMapTransform: [...this.thicknessMapTransform],
      sheenColorMapTransform: [...this.sheenColorMapTransform],
      clearcoatMapTransform: [...this.clearcoatMapTransform],
      clearcoatNormalMapTransform: [...this.clearcoatNormalMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'MeshPhysicalMaterial';
  }
}
