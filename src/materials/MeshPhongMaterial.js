/**
 * MeshPhongMaterial
 * Material with Phong lighting model (diffuse + specular + ambient)
 */

import { Material } from '../core/Material.js';

export class MeshPhongMaterial extends Material {
  constructor(options = {}) {
    super(null);

    // Color properties
    this.color = options.color || [1, 1, 1];
    this.emissive = options.emissive || [0, 0, 0];
    this.specular = options.specular || [1, 1, 1];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // Lighting properties
    this.shininess = options.shininess !== undefined ? options.shininess : 30;
    this.emissiveIntensity = options.emissiveIntensity !== undefined ? options.emissiveIntensity : 1.0;
    this.lightMapIntensity = options.lightMapIntensity !== undefined ? options.lightMapIntensity : 1.0;
    
    // Specular properties
    this.specularIntensity = options.specularIntensity !== undefined ? options.specularIntensity : 1.0;
    this.specularTint = options.specularTint || false;

    // Texture maps
    this.map = options.map || null;
    this.emissiveMap = options.emissiveMap || null;
    this.specularMap = options.specularMap || null;
    this.alphaMap = options.alphaMap || null;
    this.bumpMap = options.bumpMap || null;
    this.bumpScale = options.bumpScale !== undefined ? options.bumpScale : 1.0;
    this.normalMap = options.normalMap || null;
    this.normalScale = options.normalScale || [1, 1];

    // UV properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];
    this.normalMapTransform = options.normalMapTransform || [0, 0, 1, 1, 0, 0];

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
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat3 normalMatrix;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      
      void main() {
        vUv = uv;
        vNormalUv = uv;
        
        // Transform normal to view space
        vNormal = normalize(normalMatrix * normal);
        
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
      uniform vec3 uSpecular;
      uniform float uOpacity;
      uniform float uAlphaTest;
      uniform bool uTransparent;
      uniform float uShininess;
      uniform float uEmissiveIntensity;
      uniform float uLightMapIntensity;
      uniform float uSpecularIntensity;
      uniform float uBumpScale;
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
      uniform bool uUseSpecularMap;
      uniform bool uUseAlphaMap;
      uniform bool uUseBumpMap;
      uniform bool uUseNormalMap;
      uniform bool uUseLightMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uEmissiveMap;
      uniform sampler2D uSpecularMap;
      uniform sampler2D uAlphaMap;
      uniform sampler2D uBumpMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uLightMap;
      
      uniform vec4 uUvTransform;
      uniform vec4 uNormalUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec2 vNormalUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      
      // Texture coordinate transformation
      vec2 getUV(vec2 uv, vec4 transform) {
        return uv * transform.zw + transform.xy;
      }
      
      // Calculate diffuse lighting (Lambert's cosine law)
      float calculateDiffuse(vec3 normal, vec3 lightDir) {
        return max(dot(normal, lightDir), 0.0);
      }
      
      // Calculate specular lighting (Phong model)
      float calculateSpecular(vec3 normal, vec3 lightDir, vec3 viewDir, float shininess) {
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = max(dot(viewDir, reflectDir), 0.0);
        return pow(spec, shininess);
      }
      
      // Calculate Blinn-Phong specular (more efficient)
      float calculateBlinnPhong(vec3 normal, vec3 lightDir, vec3 viewDir, float shininess) {
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = max(dot(normal, halfDir), 0.0);
        return pow(spec, shininess);
      }
      
      // Perturb normal using normal map
      vec3 perturbNormal(vec3 normal, vec3 viewDir, vec2 uv) {
        vec3 tangentNormal = texture2D(uNormalMap, getUV(uv, uNormalUvTransform)).xyz * 2.0 - 1.0;
        tangentNormal.xy *= uNormalScale;
        
        // Convert tangent space to world space
        vec3 Q1 = dFdx(vWorldPosition);
        vec3 Q2 = dFdy(vWorldPosition);
        vec2 st1 = dFdx(vUv);
        vec2 st2 = dFdy(vUv);
        
        vec3 N = normalize(normal);
        vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
        vec3 B = normalize(cross(N, T));
        mat3 TBN = mat3(T, B, N);
        
        return normalize(TBN * tangentNormal);
      }
      
      void main() {
        vec3 diffuse = uColor;
        vec3 emissive = uEmissive;
        vec3 specular = uSpecular;
        
        // Use vertex colors if available
        #ifdef USE_VERTEX_COLORS
          diffuse *= vColor;
        #endif
        
        // Apply main texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv, uUvTransform);
          diffuse *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply emissive map
        #ifdef USE_EMISSIVE_MAP
          vec2 emissiveUV = getUV(vUv, uUvTransform);
          emissive *= texture2D(uEmissiveMap, emissiveUV).rgb;
        #endif
        
        // Apply specular map
        #ifdef USE_SPECULAR_MAP
          vec2 specularUV = getUV(vUv, uUvTransform);
          specular *= texture2D(uSpecularMap, specularUV).rgb;
        #endif
        
        // Apply alpha map
        #ifdef USE_ALPHA_MAP
          vec2 alphaUV = getUV(vUv, uUvTransform);
          float alpha = texture2D(uAlphaMap, alphaUV).r;
          if (uAlphaTest > 0.0 && alpha < uAlphaTest) {
            discard;
          }
        #endif
        
        // Apply normal mapping
        vec3 N = normalize(vNormal);
        #ifdef USE_NORMAL_MAP
          N = perturbNormal(N, normalize(vViewPosition), vNormalUv);
        #endif
        
        vec3 V = normalize(vViewPosition);
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        vec3 specLighting = vec3(0.0);
        
        // Ambient lighting
        lighting += uAmbientLightColor;
        
        // Point/directional lights
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
          
          // Lambertian diffuse
          float diffuseTerm = calculateDiffuse(N, lightDir);
          lighting += diffuseTerm * uLightColor[i] * attenuation;
          
          // Phong specular
          float specularTerm = calculateBlinnPhong(N, lightDir, V, uShininess);
          specLighting += specularTerm * uLightColor[i] * attenuation;
        }
        
        // Apply light map
        #ifdef USE_LIGHT_MAP
          vec2 lightUV = getUV(vUv, uUvTransform);
          lighting *= texture2D(uLightMap, lightUV).rgb * uLightMapIntensity;
        #endif
        
        // Apply bump mapping
        #ifdef USE_BUMP_MAP
          vec2 bumpUV = getUV(vUv, uUvTransform);
          float bump = texture2D(uBumpMap, bumpUV).r;
          vec3 bumpNormal = normalize(vNormal + vec3(0.0, 0.0, uBumpScale * (bump - 0.5)));
          lighting *= calculateDiffuse(bumpNormal, lightDir) / max(dot(vNormal, lightDir), 0.01);
        #endif
        
        vec4 color = vec4(diffuse * lighting + emissive * uEmissiveIntensity + 
                         specLighting * specular * uSpecularIntensity, uOpacity);
        
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
    this.setProperty('uSpecular', this.specular);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uAlphaTest', this.alphaTest);
    this.setProperty('uTransparent', this.transparent);
    this.setProperty('uShininess', this.shininess);
    this.setProperty('uEmissiveIntensity', this.emissiveIntensity);
    this.setProperty('uLightMapIntensity', this.lightMapIntensity);
    this.setProperty('uSpecularIntensity', this.specularIntensity);
    this.setProperty('uBumpScale', this.bumpScale);
    this.setProperty('uNormalScale', this.normalScale);
    this.setProperty('uUvTransform', this.uvTransform);
    this.setProperty('uNormalUvTransform', this.normalMapTransform);
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
   * Set specular color
   * @param {Array<number>|string} color - RGB array or hex string
   */
  setSpecular(color) {
    if (typeof color === 'string') {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      this.specular = [r, g, b];
    } else if (Array.isArray(color)) {
      this.specular = color;
    }
    
    this.setProperty('uSpecular', this.specular);
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
   * Set shininess (specular highlight sharpness)
   * @param {number} shininess - Shininess value
   */
  setShininess(shininess) {
    this.shininess = Math.max(1, Math.min(200, shininess));
    this.setProperty('uShininess', this.shininess);
    this.needsUpdate = true;
  }

  /**
   * Set specular intensity
   * @param {number} intensity - Specular intensity
   */
  setSpecularIntensity(intensity) {
    this.specularIntensity = Math.max(0, intensity);
    this.setProperty('uSpecularIntensity', this.specularIntensity);
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
   * Set light map intensity
   * @param {number} intensity - Light map intensity
   */
  setLightMapIntensity(intensity) {
    this.lightMapIntensity = intensity;
    this.setProperty('uLightMapIntensity', this.lightMapIntensity);
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
    this.shader.setUniform('uSpecular', this.specular);
    this.shader.setUniform('uOpacity', this.opacity);
    this.shader.setUniform('uShininess', this.shininess);
    this.shader.setUniform('uEmissiveIntensity', this.emissiveIntensity);
    this.shader.setUniform('uLightMapIntensity', this.lightMapIntensity);
    this.shader.setUniform('uSpecularIntensity', this.specularIntensity);
    this.shader.setUniform('uBumpScale', this.bumpScale);
    this.shader.setUniform('uNormalScale', this.normalScale);
    this.shader.setUniform('uUvTransform', this.uvTransform);
    this.shader.setUniform('uNormalUvTransform', this.normalMapTransform);
  }

  /**
   * Clone this material
   * @returns {MeshPhongMaterial} A new material with the same properties
   */
  clone() {
    return new MeshPhongMaterial({
      color: [...this.color],
      emissive: [...this.emissive],
      specular: [...this.specular],
      opacity: this.opacity,
      transparent: this.transparent,
      shininess: this.shininess,
      emissiveIntensity: this.emissiveIntensity,
      lightMapIntensity: this.lightMapIntensity,
      specularIntensity: this.specularIntensity,
      bumpScale: this.bumpScale,
      normalScale: [...this.normalScale],
      uvTransform: [...this.uvTransform],
      normalMapTransform: [...this.normalMapTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'MeshPhongMaterial';
  }
}
