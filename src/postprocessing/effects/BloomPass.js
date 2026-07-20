/**
 * BloomPass — selectable Gaussian bloom.
 *
 * Pipeline:
 *   1. Extract bright pixels above `threshold` from the input buffer,
 *      downsampled to `resolutionScale` of the input size.
 *   2. Separable Gaussian blur (horizontal + vertical) repeated
 *      `iterations` times, ping-ponging between two internal render
 *      targets.
 *   3. Composite:  output = original + bloom * strength
 *
 *   constructor({ strength=1.5, radius=0.4, threshold=0.85,
 *                 resolutionScale=0.5, iterations=4, kernelSize=9 })
 */

import {
  Pass,
  WebGLRenderTarget,
  compileProgram,
  setUniformValue,
  applyUniforms,
  bindFullscreenQuad,
  drawFullscreenQuad
} from '../EffectComposer.js';

// ---------------------------------------------------------------------------
// Shaders (GLSL ES 1.00)
// ---------------------------------------------------------------------------

const FULLSCREEN_VS = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const EXTRACT_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform float threshold;
  uniform float smoothRange;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    float mask = smoothstep(threshold - smoothRange, threshold + smoothRange, luma);
    vec3 extracted = color.rgb * mask;
    gl_FragColor = vec4(extracted, 1.0);
  }
`;

const BLUR_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 direction;        // (texelSizeX * radius, 0) or (0, texelSizeY * radius)
  uniform float kernelWeights[5]; // 5-tap Gaussian
  varying vec2 vUv;

  void main() {
    vec4 sum = texture2D(tDiffuse, vUv) * kernelWeights[0];
    sum += texture2D(tDiffuse, vUv + direction * 1.0) * kernelWeights[1];
    sum += texture2D(tDiffuse, vUv - direction * 1.0) * kernelWeights[1];
    sum += texture2D(tDiffuse, vUv + direction * 2.0) * kernelWeights[2];
    sum += texture2D(tDiffuse, vUv - direction * 2.0) * kernelWeights[2];
    sum += texture2D(tDiffuse, vUv + direction * 3.0) * kernelWeights[3];
    sum += texture2D(tDiffuse, vUv - direction * 3.0) * kernelWeights[3];
    sum += texture2D(tDiffuse, vUv + direction * 4.0) * kernelWeights[4];
    sum += texture2D(tDiffuse, vUv - direction * 4.0) * kernelWeights[4];
    gl_FragColor = sum;
  }
`;

const COMPOSITE_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform sampler2D tBloom;
  uniform float strength;
  varying vec2 vUv;

  void main() {
    vec4 original = texture2D(tDiffuse, vUv);
    vec3 bloom = texture2D(tBloom, vUv).rgb;
    gl_FragColor = vec4(original.rgb + bloom * strength, original.a);
  }
`;

// Precomputed 5-tap Gaussian weights (sigma ~ 4).
const DEFAULT_WEIGHTS = [0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216];

// ---------------------------------------------------------------------------
// Pass
// ---------------------------------------------------------------------------

export class BloomPass extends Pass {
  /**
   * @param {Object} [options]
   * @param {number} [options.strength=1.5]      Bloom additive intensity.
   * @param {number} [options.radius=0.4]        Blur radius (in texels).
   * @param {number} [options.threshold=0.85]    Luminance threshold for extraction.
   * @param {number} [options.resolutionScale=0.5] Internal target resolution vs. composer.
   * @param {number} [options.iterations=4]      Number of H+V blur iterations.
   */
  constructor(options = {}) {
    super();

    this.strength = options.strength !== undefined ? options.strength : 1.5;
    this.radius = options.radius !== undefined ? options.radius : 0.4;
    this.threshold = options.threshold !== undefined ? options.threshold : 0.85;
    this.smoothRange = options.smoothRange !== undefined ? options.smoothRange : 0.05;
    this.resolutionScale = options.resolutionScale !== undefined ? options.resolutionScale : 0.5;
    this.iterations = Math.max(1, options.iterations || 4);

    this._programExtract = null;
    this._programBlur = null;
    this._programComposite = null;

    this._rtA = null; // half-res extract + blur ping-pong A
    this._rtB = null; // half-res blur ping-pong B
    this._gl = null;

    this.needsSwap = true;
  }

  /**
   * Lazy-compile shaders + create render targets on first use.
   * @private
   */
  _init(gl, width, height) {
    if (this._gl !== gl) {
      this._programExtract   = compileProgram(gl, FULLSCREEN_VS, EXTRACT_FS);
      this._programBlur      = compileProgram(gl, FULLSCREEN_VS, BLUR_FS);
      this._programComposite = compileProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);
      this._gl = gl;
    }
    if (!this._rtA) {
      this._rtA = new WebGLRenderTarget(gl, width, height, { depthBuffer: false });
      this._rtB = new WebGLRenderTarget(gl, width, height, { depthBuffer: false });
    }
  }

  /**
   * @param {number} width   Composer resolution width (already scaled).
   * @param {number} height  Composer resolution height (already scaled).
   */
  setSize(width, height) {
    const w = Math.max(1, Math.floor(width * this.resolutionScale));
    const h = Math.max(1, Math.floor(height * this.resolutionScale));
    if (this._rtA) this._rtA.setSize(w, h);
    if (this._rtB) this._rtB.setSize(w, h);
  }

  /**
   * Run the bloom pipeline.
   * @param {import('../core/WebGLRenderer.js').WebGLRenderer} renderer
   * @param {import('./EffectComposer.js').WebGLRenderTarget|null} writeBuffer
   * @param {import('./EffectComposer.js').WebGLRenderTarget} readBuffer
   */
  render(renderer, writeBuffer, readBuffer) {
    const gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    if (!gl || !readBuffer) return;

    const halfW = Math.max(1, Math.floor(readBuffer.width * this.resolutionScale));
    const halfH = Math.max(1, Math.floor(readBuffer.height * this.resolutionScale));
    this._init(gl, halfW, halfH);

    // Make sure internal targets match the expected half-res size.
    this._rtA.setSize(halfW, halfH);
    this._rtB.setSize(halfW, halfH);

    // Save state.
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);
    const prevActiveUnit = gl.getParameter(gl.ACTIVE_TEXTURE);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    try {
      // ----- Step 1: extract bright pixels (downsample to half-res) -----
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rtA.framebuffer);
      gl.viewport(0, 0, halfW, halfH);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this._programExtract.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
      setUniformValue(gl, this._programExtract, 'tDiffuse', { type: 'texture', unit: 0 });
      setUniformValue(gl, this._programExtract, 'threshold', this.threshold);
      setUniformValue(gl, this._programExtract, 'smoothRange', this.smoothRange);
      bindFullscreenQuad(gl, this._programExtract);
      drawFullscreenQuad(gl);

      // ----- Step 2: separable Gaussian blur (H + V), N iterations -----
      const weights = DEFAULT_WEIGHTS;
      const texelX = this.radius / halfW;
      const texelY = this.radius / halfH;

      let src = this._rtA;
      let dst = this._rtB;

      for (let i = 0; i < this.iterations; i++) {
        // Horizontal pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
        gl.viewport(0, 0, dst.width, dst.height);
        gl.useProgram(this._programBlur.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.texture);
        setUniformValue(gl, this._programBlur, 'tDiffuse', { type: 'texture', unit: 0 });
        setUniformValue(gl, this._programBlur, 'direction', [texelX, 0.0]);
        setUniformValue(gl, this._programBlur, 'kernelWeights', weights);
        bindFullscreenQuad(gl, this._programBlur);
        drawFullscreenQuad(gl);

        // Swap src <-> dst
        const tmp = src; src = dst; dst = tmp;

        // Vertical pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
        gl.viewport(0, 0, dst.width, dst.height);
        gl.useProgram(this._programBlur.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.texture);
        setUniformValue(gl, this._programBlur, 'tDiffuse', { type: 'texture', unit: 0 });
        setUniformValue(gl, this._programBlur, 'direction', [0.0, texelY]);
        setUniformValue(gl, this._programBlur, 'kernelWeights', weights);
        bindFullscreenQuad(gl, this._programBlur);
        drawFullscreenQuad(gl);

        // Swap src <-> dst again
        const tmp2 = src; src = dst; dst = tmp2;
      }

      // After all H+V iterations, `src` holds the final blurred bloom.
      const bloomTarget = src;

      // ----- Step 3: composite original + bloom -----
      if (writeBuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
        gl.viewport(0, 0, writeBuffer.width, writeBuffer.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const w = renderer.canvas ? renderer.canvas.width : gl.drawingBufferWidth;
        const h = renderer.canvas ? renderer.canvas.height : gl.drawingBufferHeight;
        gl.viewport(0, 0, w, h);
      }

      gl.useProgram(this._programComposite.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
      setUniformValue(gl, this._programComposite, 'tDiffuse', { type: 'texture', unit: 0 });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomTarget.texture);
      setUniformValue(gl, this._programComposite, 'tBloom', { type: 'texture', unit: 1 });
      setUniformValue(gl, this._programComposite, 'strength', this.strength);
      bindFullscreenQuad(gl, this._programComposite);
      drawFullscreenQuad(gl);
    } finally {
      // Restore state.
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST);
      if (prevBlend) gl.enable(gl.BLEND);
      if (prevCullFace) gl.enable(gl.CULL_FACE);
      gl.activeTexture(prevActiveUnit || gl.TEXTURE0);
    }
  }

  dispose() {
    if (this._rtA) this._rtA.dispose();
    if (this._rtB) this._rtB.dispose();
    this._rtA = null;
    this._rtB = null;
    this._programExtract = null;
    this._programBlur = null;
    this._programComposite = null;
    this._gl = null;
  }
}

export const BloomShader = {
  extract: { vertexShader: FULLSCREEN_VS, fragmentShader: EXTRACT_FS },
  blur:    { vertexShader: FULLSCREEN_VS, fragmentShader: BLUR_FS },
  composite: { vertexShader: FULLSCREEN_VS, fragmentShader: COMPOSITE_FS }
};

export default BloomPass;
