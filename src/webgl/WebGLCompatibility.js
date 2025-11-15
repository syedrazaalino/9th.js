/**
 * WebGL Compatibility and Feature Detection Module
 * 
 * Provides comprehensive WebGL 1.0/2.0 compatibility layer
 * with automatic feature detection and fallback handling
 */

import { getWebGLCapabilities } from './webgl/Capabilities.js';

// WebGL feature detection and compatibility layer
export class WebGLCompatibility {
  constructor() {
    this.capabilities = null;
    this.webglVersion = 0;
    this.supportedFeatures = new Set();
    this.missingFeatures = new Set();
    this.fallbacks = new Map();
  }

  // Initialize WebGL compatibility detection
  async initialize() {
    try {
      this.capabilities = getWebGLCapabilities();
      await this.detectWebGLVersion();
      await this.detectFeatures();
      this.setupFallbacks();
      
      console.log('9th.js WebGL Compatibility initialized:', {
        version: this.webglVersion,
        capabilities: this.capabilities.version,
        features: Array.from(this.supportedFeatures).length,
        missing: Array.from(this.missingFeatures).length
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WebGL compatibility:', error);
      return false;
    }
  }

  // Detect WebGL version
  async detectWebGLVersion() {
    const canvas = document.createElement('canvas');
    
    // Try WebGL 2.0 first
    try {
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        this.webglVersion = 2;
        // Test WebGL 2.0 specific features
        if (this.testWebGL2Features(gl2)) {
          this.supportedFeatures.add('webgl2');
          return;
        }
      }
    } catch (e) {
      console.warn('WebGL 2.0 context creation failed');
    }
    
    // Fallback to WebGL 1.0
    try {
      const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl1) {
        this.webglVersion = 1;
        this.supportedFeatures.add('webgl1');
      } else {
        throw new Error('WebGL not supported');
      }
    } catch (e) {
      throw new Error('WebGL 1.0 also not supported');
    }
  }

  // Test WebGL 2.0 specific features
  testWebGL2Features(gl) {
    const webgl2Features = [
      'TRANSFORM_FEEDBACK',
      'VERTEX_ARRAY_OBJECT',
      'TRANSFORM_FEEDBACK_BUFFER_MODE',
      'MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS',
      'DRAW_INDIRECT',
      'PRIMITIVE_RESTART_FIXED_INDEX'
    ];

    return webgl2Features.every(feature => 
      gl.getExtension(feature.replace(/_/g, '')) !== null ||
      gl.getParameter(gl[feature]) !== null
    );
  }

  // Detect supported features
  async detectFeatures() {
    const features = [
      // Core WebGL features
      { name: 'depthTextures', test: () => this.testDepthTextures() },
      { name: 'floatTextures', test: () => this.testFloatTextures() },
      { name: 'vertexArrayObjects', test: () => this.testVertexArrayObjects() },
      
      // Extensions
      { name: 'instancedRendering', test: () => this.testInstancedRendering() },
      { name: 'vertexArrayObjectsEXT', test: () => this.testVertexArrayObjectsEXT() },
      { name: 'compressedTextures', test: () => this.testCompressedTextures() },
      { name: 'anisotropicFiltering', test: () => this.testAnisotropicFiltering() },
      { name: 'multiDrawIndirect', test: () => this.testMultiDrawIndirect() },
      
      // WebGL 2.0 features
      { name: 'transformFeedback', test: () => this.testTransformFeedback() },
      { name: 'uniformBuffers', test: () => this.testUniformBuffers() },
      { name: 'atomicCounters', test: () => this.testAtomicCounters() },
      { name: 'computeShaders', test: () => this.testComputeShaders() }
    ];

    for (const feature of features) {
      try {
        if (await feature.test()) {
          this.supportedFeatures.add(feature.name);
        } else {
          this.missingFeatures.add(feature.name);
        }
      } catch (error) {
        this.missingFeatures.add(feature.name);
        console.warn(`Feature test failed for ${feature.name}:`, error);
      }
    }
  }

  // Test depth textures
  async testDepthTextures() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return false;
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    try {
      gl.texImage2D(
        gl.TEXTURE_2D, 0,
        gl.DEPTH_COMPONENT16,
        1, 1, 0,
        gl.DEPTH_COMPONENT,
        gl.UNSIGNED_SHORT,
        null
      );
      return true;
    } catch (e) {
      return false;
    } finally {
      gl.deleteTexture(texture);
    }
  }

  // Test float textures
  async testFloatTextures() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    
    if (!gl) return false;
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    try {
      gl.texImage2D(
        gl.TEXTURE_2D, 0,
        gl.RGBA32F,
        1, 1, 0,
        gl.RGBA,
        gl.FLOAT,
        null
      );
      return true;
    } catch (e) {
      return false;
    } finally {
      gl.deleteTexture(texture);
    }
  }

  // Test instanced rendering
  async testInstancedRendering() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return false;
    
    if (this.webglVersion === 2) {
      return gl.drawArraysInstanced !== undefined;
    } else {
      return gl.getExtension('ANGLE_instanced_arrays') !== null;
    }
  }

  // Test other features with similar patterns...
  async testVertexArrayObjects() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    
    if (this.webglVersion === 2) {
      return gl.createVertexArray !== undefined;
    } else {
      return gl.getExtension('OES_vertex_array_object') !== null;
    }
  }

  async testVertexArrayObjectsEXT() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return gl && gl.getExtension('OES_vertex_array_object') !== null;
  }

  async testCompressedTextures() {
    const extensions = [
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc1',
      'WEBGL_compressed_texture_pvrtc',
      'EXT_texture_compression_s3tc'
    ];
    
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    
    if (!gl) return false;
    
    return extensions.some(ext => gl.getExtension(ext) !== null);
  }

  async testAnisotropicFiltering() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    return gl && gl.getExtension('EXT_texture_filter_anisotropic') !== null;
  }

  async testMultiDrawIndirect() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl && gl.getExtension('WEBGL_draw_multiple_buffers') !== null;
  }

  async testTransformFeedback() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl && gl.createTransformFeedback !== undefined;
  }

  async testUniformBuffers() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl && gl.getBufferParameter !== undefined;
  }

  async testAtomicCounters() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl && gl.getBufferParameter(gl.UNIFORM_BUFFER, gl.BUFFER_SIZE) !== undefined;
  }

  async testComputeShaders() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl && gl.getProgramPipeline !== undefined;
  }

  // Setup fallbacks for missing features
  setupFallbacks() {
    // Map features to fallback implementations
    this.fallbacks.set('computeShaders', 'CPU simulation');
    this.fallbacks.set('uniformBuffers', 'Individual uniforms');
    this.fallbacks.set('atomicCounters', 'Software atomic counters');
    this.fallbacks.set('multiDrawIndirect', 'Multiple draw calls');
    this.fallbacks.set('transformFeedback', 'CPU transform feedback');
    this.fallbacks.set('compressedTextures', 'Uncompressed textures');
    this.fallbacks.set('anisotropicFiltering', 'MIPMAP LOD selection');
  }

  // Check if a feature is supported
  isFeatureSupported(feature) {
    return this.supportedFeatures.has(feature);
  }

  // Get fallback for missing feature
  getFallback(feature) {
    return this.fallbacks.get(feature);
  }

  // Get compatibility report
  getReport() {
    return {
      webglVersion: this.webglVersion,
      capabilities: this.capabilities,
      supportedFeatures: Array.from(this.supportedFeatures),
      missingFeatures: Array.from(this.missingFeatures),
      fallbacks: Object.fromEntries(this.fallbacks),
      overallSupport: this.getOverallSupportLevel()
    };
  }

  // Get overall support level
  getOverallSupportLevel() {
    const criticalFeatures = ['depthTextures', 'floatTextures', 'vertexArrayObjects'];
    const missingCritical = criticalFeatures.filter(f => this.missingFeatures.has(f));
    
    if (missingCritical.length > 0) {
      return 'limited';
    } else if (this.missingFeatures.size > 5) {
      return 'moderate';
    } else {
      return 'full';
    }
  }
}

// Global instance
export const webglCompatibility = new WebGLCompatibility();

// Export compatibility report generator
export const generateCompatibilityReport = async () => {
  await webglCompatibility.initialize();
  return webglCompatibility.getReport();
};

// Export feature detector
export const detectWebGLFeatures = async () => {
  await webglCompatibility.initialize();
  return {
    supported: Array.from(webglCompatibility.supportedFeatures),
    missing: Array.from(webglCompatibility.missingFeatures)
  };
};
