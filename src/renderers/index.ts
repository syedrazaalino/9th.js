/**
 * 9th.js Renderers Module
 * 
 * Contains different rendering implementations and targets
 */

// Core renderer
export * from '../core/renderer.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';

// WebGL 1.0 renderer (fallback)
export * from './WebGL1Renderer.js';

// WebGL 2.0 renderer (preferred)
export * from './WebGL2Renderer.js';

// Experimental renderers
export * from './DeferredRenderer.js';
export * from './ForwardRenderer.js';
export * from './VoxelRenderer.js';

// Render targets
export * from './targets/RenderTarget.js';
export * from './targets/WebGLRenderTarget.js';
export * from './targets/OffscreenCanvas.js';

// Post-processing pipeline
export * from './postprocessing/PostProcessor.js';
export * from './postprocessing/EffectComposer.js';
export * from './postprocessing/FXAAPass.js';
export * from './postprocessing/BloomPass.js';
export * from './postprocessing/SSAO.js';

// Debug renderers
export * from './debug/WireframeRenderer.js';
export * from './debug/NormalsRenderer.js';
export * from './debug/BoundingBoxRenderer.js';

// Renderer factory
export const createRenderer = (canvas: HTMLCanvasElement, options?: any) => {
  return new WebGLRenderer({ canvas, ...options });
};

export const createRendererByVersion = async (canvas: HTMLCanvasElement, webglVersion: number = 2) => {
  if (webglVersion >= 2) {
    try {
      const { WebGL2Renderer } = await import('./WebGL2Renderer.js');
      return new WebGL2Renderer({ canvas });
    } catch (e) {
      console.warn('WebGL2Renderer not available, falling back to WebGL1Renderer');
    }
  }
  
  const { WebGL1Renderer } = await import('./WebGL1Renderer.js');
  return new WebGL1Renderer({ canvas });
};

// Renderer capabilities
export const getWebGLCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    throw new Error('WebGL not supported');
  }
  
  return {
    version: gl.getParameter(gl.VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxFragmentTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    extensions: gl.getSupportedExtensions() || []
  };
};

// Export default renderer
export default createRenderer;