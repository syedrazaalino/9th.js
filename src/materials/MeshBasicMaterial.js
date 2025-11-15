/**
 * MeshBasicMaterial
 * Unlit material that renders colors without lighting calculations
 */

import { Material } from '../core/Material.js';
import { Shader } from '../core/Shader.js';

export class MeshBasicMaterial extends Material {
  constructor(options = {}) {
    super(null); // Will set shader later

    // Color properties - handle hex number, hex string, or array
    if (options.color !== undefined) {
      if (typeof options.color === 'number') {
        // Convert hex number to RGB array
        const hex = options.color.toString(16).padStart(6, '0');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        this.color = [r, g, b];
      } else if (typeof options.color === 'string') {
        // Convert hex string to RGB array
        const hex = options.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        this.color = [r, g, b];
      } else if (Array.isArray(options.color)) {
        this.color = options.color;
      } else {
        this.color = [1, 1, 1];
      }
    } else {
      this.color = [1, 1, 1];
    }
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.transparent = options.transparent || false;

    // Additional properties
    this.alphaTest = options.alphaTest || 0.0;
    this.side = options.side || 'front'; // 'front', 'back', 'double'
    this.blending = options.blending || 'normal'; // 'normal', 'additive', 'multiply', etc.

    // Vertex colors support
    this.vertexColors = options.vertexColors || false;

    // Set up shader
    this.shader = this._createShader();
    
    // Initialize uniforms
    this._initializeUniforms();
  }

  /**
   * Create the shader program for this material
   * Returns null - shader will be created lazily when gl context is available
   */
  _createShader() {
    // Store shader sources for later compilation
    this.vertexSource = `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // Transform normal to world space
        mat3 normalMatrix = mat3(modelMatrix);
        vNormal = normalize(normalMatrix * normal);
        
        // Pass color if using vertex colors
        #ifdef USE_VERTEX_COLORS
          vColor = color;
        #endif
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    this.fragmentSource = `
      precision highp float;
      
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uAlphaTest;
      uniform bool uTransparent;
      
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vec4 color = vec4(uColor, uOpacity);
        
        // Use vertex colors if available
        #ifdef USE_VERTEX_COLORS
          color.rgb = vColor;
        #endif
        
        // Alpha test
        if (uAlphaTest > 0.0 && color.a < uAlphaTest) {
          discard;
        }
        
        // Handle transparency
        if (uTransparent && color.a < 1.0) {
          // Allow alpha blending
        }
        
        gl_FragColor = color;
      }
    `;

    // Return null - shader will be created when gl context is available
    return null;
  }

  /**
   * Initialize shader with WebGL context (called by renderer)
   * @param {WebGLRenderingContext} gl - WebGL context
   */
  initShader(gl) {
    if (this.shader && this.shader.isReady && this.shader.isReady()) {
      return; // Already initialized
    }

    this.shader = new Shader(gl);
    this.shader.createProgram(this.vertexSource, this.fragmentSource);
    
    // Initialize uniforms
    this._initializeUniforms();
  }

  /**
   * Initialize material uniforms
   */
  _initializeUniforms() {
    this.setProperty('uColor', this.color);
    this.setProperty('uOpacity', this.opacity);
    this.setProperty('uAlphaTest', this.alphaTest);
    this.setProperty('uTransparent', this.transparent);
  }

  /**
   * Set material color
   * @param {Array<number>|string} color - RGB array [r,g,b] or hex string
   */
  setColor(color) {
    if (typeof color === 'string') {
      // Convert hex string to RGB array
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
   * Set material opacity
   * @param {number} opacity - Opacity value (0.0 to 1.0)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.setProperty('uOpacity', this.opacity);
    this.needsUpdate = true;
  }

  /**
   * Set alpha test value
   * @param {number} alphaTest - Alpha test threshold
   */
  setAlphaTest(alphaTest) {
    this.alphaTest = Math.max(0, Math.min(1, alphaTest));
    this.setProperty('uAlphaTest', this.alphaTest);
    this.needsUpdate = true;
  }

  /**
   * Enable or disable transparency
   * @param {boolean} transparent - Whether material is transparent
   */
  setTransparent(transparent) {
    this.transparent = transparent;
    this.setProperty('uTransparent', this.transparent);
    this.needsUpdate = true;
  }

  /**
   * Enable or disable vertex colors
   * @param {boolean} vertexColors - Whether to use vertex colors
   */
  setVertexColors(vertexColors) {
    this.vertexColors = vertexColors;
    this.needsUpdate = true;
  }

  /**
   * Update material uniforms
   */
  updateUniforms() {
    if (!this.shader || !this.shader.isReady()) return;
    
    super.updateUniforms();
    
    // Update common uniforms
    this.shader.setUniform('uColor', this.color);
    this.shader.setUniform('uOpacity', this.opacity);
    this.shader.setUniform('uAlphaTest', this.alphaTest);
    this.shader.setUniform('uTransparent', this.transparent);
  }

  /**
   * Clone this material
   * @returns {MeshBasicMaterial} A new material with the same properties
   */
  clone() {
    return new MeshBasicMaterial({
      color: [...this.color],
      opacity: this.opacity,
      transparent: this.transparent,
      alphaTest: this.alphaTest,
      vertexColors: this.vertexColors
    });
  }

  /**
   * Get material type
   * @returns {string} Material type name
   */
  getType() {
    return 'MeshBasicMaterial';
  }
}
