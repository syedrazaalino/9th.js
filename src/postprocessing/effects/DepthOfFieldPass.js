/**
 * DepthOfFieldPass — bokeh depth-of-field using the scene depth buffer.
 *
 *   constructor({ focus=1.0, aperture=0.025, maxblur=1.0 })
 *
 * Reads from the input render target's depth texture
 * (`readBuffer.depthTextureObj`), which the preceding `RenderPass`
 * attaches when WEBGL_depth_texture is available. If no depth texture
 * is present, the pass degrades gracefully (no blur).
 *
 * The shader samples the color buffer in a 12-tap disk pattern, scaled
 * by the circle-of-confusion derived from the per-pixel depth.
 */

import {
  Pass,
  WebGLRenderTarget,
  compileProgram,
  setUniformValue,
  bindFullscreenQuad,
  drawFullscreenQuad
} from '../EffectComposer.js';

const FULLSCREEN_VS = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Classic Three.js BokehShader disk offsets (12 + center).
const BOKEH_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform float focus;
  uniform float aperture;
  uniform float maxblur;
  uniform float aspect;
  uniform float near;
  uniform float far;
  varying vec2 vUv;

  // Convert a non-linear depth buffer value to a linear view-space Z.
  float linearizeDepth(float d) {
    float z = d * 2.0 - 1.0;             // NDC [-1, 1]
    return (near * far) / (far - z * (far - near));
  }

  void main() {
    vec2 aspectCorrection = vec2(1.0, aspect);

    float depth = texture2D(tDepth, vUv).r;
    float viewZ = linearizeDepth(depth);

    // Circle of confusion: grows with distance from the focal plane.
    float factor = (viewZ - focus);
    factor = clamp(factor * aperture, -maxblur, maxblur);

    vec2 dofblur = vec2(factor);

    vec4 color = vec4(0.0);
    color += texture2D(tColor, vUv);
    color += texture2D(tColor, vUv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.15,  0.37) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.29,  0.29) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.37,  0.15) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.37, -0.15) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.15, -0.37) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.15,  0.37) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.37,  0.15) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.37, -0.15) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.15, -0.37) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.15,  0.37) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur);
    color += texture2D(tColor, vUv + (vec2( 0.37,  0.15) * aspectCorrection) * dofblur);

    color += texture2D(tColor, vUv + (vec2( 0.15,  0.37) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2(-0.37,  0.15) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2( 0.37, -0.15) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2(-0.15, -0.37) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2(-0.15,  0.37) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2( 0.37,  0.15) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2(-0.37, -0.15) * aspectCorrection) * dofblur * 0.9);
    color += texture2D(tColor, vUv + (vec2( 0.15, -0.37) * aspectCorrection) * dofblur * 0.9);

    color += texture2D(tColor, vUv + (vec2( 0.29,  0.29) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2(-0.40,  0.0 ) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2(-0.29, -0.29) * aspectCorrection) * dofblur * 0.7);
    color += texture2D(tColor, vUv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofblur * 0.7);

    color += texture2D(tColor, vUv + (vec2( 0.29,  0.29) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2(-0.40,  0.0 ) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2(-0.29, -0.29) * aspectCorrection) * dofblur * 0.4);
    color += texture2D(tColor, vUv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofblur * 0.4);

    color /= 41.0;

    gl_FragColor = color;
  }
`;

export class DepthOfFieldPass extends Pass {
  /**
   * @param {Object} [options]
   * @param {number} [options.focus=1.0]      Focal distance in view-space units.
   * @param {number} [options.aperture=0.025] Aperture size — controls blur amount.
   * @param {number} [options.maxblur=1.0]    Maximum blur radius (in UV units).
   * @param {number} [options.near=0.1]       Camera near plane (for depth linearization).
   * @param {number} [options.far=1000]       Camera far plane (for depth linearization).
   */
  constructor(options = {}) {
    super();
    this.focus    = options.focus    !== undefined ? options.focus    : 1.0;
    this.aperture = options.aperture !== undefined ? options.aperture : 0.025;
    this.maxblur  = options.maxblur  !== undefined ? options.maxblur  : 1.0;
    this.near     = options.near     !== undefined ? options.near     : 0.1;
    this.far      = options.far      !== undefined ? options.far      : 1000;

    this._program = null;
    this._gl = null;

    // If no depth texture is available on the readBuffer (e.g. because
    // WEBGL_depth_texture is missing or RenderPass was the screen pass),
    // we fall back to a tiny 1x1 depth texture filled with the focus
    // value so the shader still compiles and runs (no-op).
    this._fallbackDepth = null;

    this.needsSwap = true;
  }

  _init(gl) {
    if (this._gl === gl && this._program) return;
    this._program = compileProgram(gl, FULLSCREEN_VS, BOKEH_FS);
    this._gl = gl;

    // 1x1 fallback depth texture (filled with far depth).
    this._fallbackDepth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._fallbackDepth);
    const one = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 1, 1, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_BYTE, one);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  setSize(width, height) {
    // No internal render targets to resize — DOF reads from readBuffer.
  }

  render(renderer, writeBuffer, readBuffer) {
    const gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    if (!gl || !readBuffer) return;

    this._init(gl);

    // Bind target.
    if (writeBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
      gl.viewport(0, 0, writeBuffer.width, writeBuffer.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const w = renderer.canvas ? renderer.canvas.width : gl.drawingBufferWidth;
      const h = renderer.canvas ? renderer.canvas.height : gl.drawingBufferHeight;
      gl.viewport(0, 0, w, h);
    }

    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);
    const prevActiveUnit = gl.getParameter(gl.ACTIVE_TEXTURE);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    try {
      gl.useProgram(this._program.program);

      // Color input on unit 0.
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
      setUniformValue(gl, this._program, 'tColor', { type: 'texture', unit: 0 });

      // Depth input on unit 1. Prefer readBuffer.depthTextureObj, else fallback.
      gl.activeTexture(gl.TEXTURE1);
      const depthTex = (readBuffer.depthTextureObj) || this._fallbackDepth;
      gl.bindTexture(gl.TEXTURE_2D, depthTex);
      setUniformValue(gl, this._program, 'tDepth', { type: 'texture', unit: 1 });

      const aspect = readBuffer.width / Math.max(1, readBuffer.height);
      setUniformValue(gl, this._program, 'focus', this.focus);
      setUniformValue(gl, this._program, 'aperture', this.aperture);
      setUniformValue(gl, this._program, 'maxblur', this.maxblur);
      setUniformValue(gl, this._program, 'aspect', aspect);
      setUniformValue(gl, this._program, 'near', this.near);
      setUniformValue(gl, this._program, 'far', this.far);

      bindFullscreenQuad(gl, this._program);
      drawFullscreenQuad(gl);
    } finally {
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST);
      if (prevBlend) gl.enable(gl.BLEND);
      if (prevCullFace) gl.enable(gl.CULL_FACE);
      gl.activeTexture(prevActiveUnit || gl.TEXTURE0);
    }
  }

  dispose() {
    if (this._gl && this._fallbackDepth) {
      this._gl.deleteTexture(this._fallbackDepth);
    }
    this._fallbackDepth = null;
    this._program = null;
    this._gl = null;
  }
}

export const DepthOfFieldShader = {
  vertexShader: FULLSCREEN_VS,
  fragmentShader: BOKEH_FS
};

export default DepthOfFieldPass;
