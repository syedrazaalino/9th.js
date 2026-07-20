/**
 * Capabilities.js - WebGL capability detection (used by WebGLCompatibility)
 */

/**
 * Detect WebGL capabilities for a given context.
 * Returns an object describing WebGL version, supported extensions, and limits.
 */
export function getWebGLCapabilities(gl) {
  if (!gl) {
    return {
      webglVersion: 0,
      isWebGL2: false,
      maxTextureSize: 0,
      maxCubeMapTextureSize: 0,
      maxRenderbufferSize: 0,
      maxVertexAttribs: 0,
      maxTextureImageUnits: 0,
      maxCombinedTextureImageUnits: 0,
      maxViewportDims: [0, 0],
      extensions: [],
      compressedTextureFormats: []
    };
  }

  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const webglVersion = isWebGL2 ? 2 : 1;

  const extensions = gl.getSupportedExtensions ? gl.getSupportedExtensions() : [];

  let compressedTextureFormats = [];
  try {
    compressedTextureFormats = gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS) || [];
  } catch (e) {
    compressedTextureFormats = [];
  }

  return {
    webglVersion,
    isWebGL2,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
    maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0,
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0,
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
    maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0,
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 0,
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0],
    maxAnisotropy: getExtension(gl, 'EXT_texture_filter_anisotropic'),
    extensions,
    compressedTextureFormats,
    // WebGL2-only features
    supportsUniformBuffers: isWebGL2,
    supportsTransformFeedback: isWebGL2,
    supportsVAOs: isWebGL2 || !!getExtension(gl, 'OES_vertex_array_object'),
    supportsInstancing: isWebGL2 || !!getExtension(gl, 'ANGLE_instanced_arrays'),
    supportsFloatTextures: !!getExtension(gl, 'OES_texture_float') || isWebGL2,
    supportsHalfFloatTextures: !!getExtension(gl, 'OES_texture_half_float') || isWebGL2,
    supportsDepthTextures: !!getExtension(gl, 'WEBGL_depth_texture') || isWebGL2,
    supportsDerivatives: !!getExtension(gl, 'OES_standard_derivatives') || isWebGL2
  };
}

function getExtension(gl, name) {
  return gl.getExtension ? gl.getExtension(name) : null;
}
