/**
 * MeshLambertMaterial
 * Material with Lambertian (diffuse) lighting model
 */

import { Material } from '../core/Material.js';

export class MeshLambertMaterial extends Material {
  constructor(options = {}) {
    super(null);

    // Color properties
    this.color = options.color || [1, 1, 1];
    this.emissive = options.emissive || [0, 0, 0];
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // Lighting properties
    this.lightMap = options.lightMap || null;
    this.lightMapIntensity = options.lightMapIntensity !== undefined ? options.lightMapIntensity : 1.0;
    this.emissiveIntensity = options.emissiveIntensity !== undefined ? options.emissiveIntensity : 1.0;

    // Texture maps
    this.map = options.map || null;
    this.emissiveMap = options.emissiveMap || null;
    this.alphaMap = options.alphaMap || null;
    this.bumpMap = options.bumpMap || null;
    this.bumpScale = options.bumpScale !== undefined ? options.bumpScale : 1.0;

    // UV properties
    this.uvTransform = options.uvTransform || [0, 0, 1, 1, 0, 0];

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
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      
      void main() {
        vUv = uv;
        
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
      uniform float uOpacity;
      uniform float uAlphaTest;
      uniform bool uTransparent;
      uniform float uLightMapIntensity;
      uniform float uEmissiveIntensity;
      uniform float uBumpScale;
      
      uniform vec3 uAmbientLightColor;
      uniform vec3 uLightColor[8];
      uniform vec3 uLightPosition[8];
      uniform float uLightDistance[8];
      uniform float uLightDecay[8];
      uniform int uLightCount;
      
      uniform bool uUseMap;
      uniform bool uUseEmissiveMap;
      uniform bool uUseAlphaMap;
      uniform bool uUseBumpMap;
      uniform bool uUseLightMap;
      
      uniform sampler2D uMap;
      uniform sampler2D uEmissiveMap;
      uniform sampler2D uAlphaMap;
      uniform sampler2D uBumpMap;
      uniform sampler2D uLightMap;
      
      uniform vec4 uUvTransform;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;
      varying vec3 vColor;
      
      // Texture coordinate transformation
      vec2 getUV(vec2 uv) {
        return uv * uUvTransform.zw + uUvTransform.xy;
      }
      
      // Calculate diffuse lighting (Lambert's cosine law)
      float calculateDiffuse(vec3 normal, vec3 lightDir) {
        return max(dot(normal, lightDir), 0.0);
      }
      
      void main() {
        vec3 diffuse = uColor;
        vec3 emissive = uEmissive;
        
        // Use vertex colors if available
        #ifdef USE_VERTEX_COLORS
          diffuse *= vColor;
        #endif
        
        // Apply main texture
        #ifdef USE_MAP
          vec2 mainUV = getUV(vUv);
          diffuse *= texture2D(uMap, mainUV).rgb;
        #endif
        
        // Apply emissive map
        #ifdef USE_EMISSIVE_MAP
          vec2 emissiveUV = getUV(vUv);
          emissive *= texture2D(uEmissiveMap, emissiveUV).rgb;
        #endif
        
        // Apply alpha map
        #ifdef USE_ALPHA_MAP
          vec2 alphaUV = getUV(vUv);
          float alpha = texture2D(uAlphaMap, alphaUV).r;
          if (uAlphaTest > 0.0 && alpha < uAlphaTest) {
            discard;
          }
        #endif
        
        // Calculate lighting
        vec3 lighting = vec3(0.0);
        
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
          float diffuseTerm = calculateDiffuse(vNormal, lightDir);
          
          lighting += diffuseTerm * uLightColor[i] * attenuation;
        }
        
        // Apply light map
        #ifdef USE_LIGHT_MAP
          vec2 lightUV = getUV(vUv);
          lighting *= texture2D(uLightMap, lightUV).rgb * uLightMapIntensity;
        #endif
        
        // Apply bump mapping
        #ifdef USE_BUMP_MAP
          // Simplified bump mapping - would need proper normal map processing
          vec2 bumpUV = getUV(vUv);
          float bump = texture2D(uBumpMap, bumpUV).r;
          vec3 bumpNormal = normalize(vNormal + vec3(0.0, 0.0, uBumpScale * (bump - 0.5)));
          lighting *= calculateDiffuse(bumpNormal, lightDir) / max(dot(vNormal, lightDir), 0.01);
        #endif
        
        vec4 color = vec4(diffuse * lighting + emissive * uEmissiveIntensity, uOpacity);
        
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
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uAlphaTest', this.alphaTest);
    this.setProperty('uTransparent', this.transparent);
    this.setProperty('uLightMapIntensity', this.lightMapIntensity);
    this.setProperty('uEmissiveIntensity', this.emissiveIntensity);
    this.setProperty('uBumpScale', this.bumpScale);
    this.setProperty('uUvTransform', this.uvTransform);
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
   * Set emissive intensity
   * @param {number} intensity - Emissive intensity
   */
  setEmissiveIntensity(intensity) {
    this.emissiveIntensity = intensity;
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
   * Set texture
   * @param {string} mapType - Type of texture ('map', 'emissiveMap', etc.)
   * @param {WebGLTexture} texture - Texture to set
   * @param {number} unit - Texture unit
   */
  setTexture(mapType, texture, unit = 0) {
    this[mapType] = texture;
    this.setTexture(mapType, texture, unit);
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
    this.shader.setUniform('uOpacity', this.opacity);
    this.shader.setUniform('uLightMapIntensity', this.lightMapIntensity);
    this.shader.setUniform('uEmissiveIntensity', this.emissiveIntensity);
    this.shader.setUniform('uBumpScale', this.bumpScale);
    this.shader.setUniform('uUvTransform', this.uvTransform);
  }

  /**
   * Clone this material
   * @returns {MeshLambertMaterial} A new material with the same properties
   */
  clone() {
    return new MeshLambertMaterial({
      color: [...this.color],
      emissive: [...this.emissive],
      opacity: this.opacity,
      transparent: this.transparent,
      emissiveIntensity: this.emissiveIntensity,
      lightMapIntensity: this.lightMapIntensity,
      bumpScale: this.bumpScale,
      uvTransform: [...this.uvTransform]
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'MeshLambertMaterial';
  }
}
