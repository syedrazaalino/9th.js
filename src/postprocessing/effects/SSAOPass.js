/**
 * SSAOPass — screen-space ambient occlusion.
 *
 *   constructor({ radius=0.1, bias=0.025, intensity=1.0, samples=16,
 *                 near=0.1, far=1000 })
 *
 * Pipeline:
 *   1. Render SSAO from the input color + depth buffers into an internal
 *      AO target (red channel = occlusion factor, 1=unoccluded).
 *   2. Separable Gaussian blur to denoise the AO signal.
 *   3. Composite: final = original * ao (modulated by intensity).
 *
 * The hemisphere kernel is generated with a fixed seed (deterministic)
 * so visual output is stable across reloads. A small 4x4 noise texture
 * rotates the kernel per-pixel to break up the banding pattern.
 */

import {
  Pass,
  WebGLRenderTarget,
  compileProgram,
  setUniformValue,
  bindFullscreenQuad,
  drawFullscreenQuad
} from '../EffectComposer.js';

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) for deterministic kernel generation
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {number} count
 * @returns {Float32Array}  flattened vec3 hemisphere kernel
 */
function generateHemisphereKernel(count) {
  const rng = mulberry32(0x9e3779b9);
  const kernel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random direction in tangent space, biased toward hemisphere.
    const x = rng() * 2 - 1;
    const y = rng() * 2 - 1;
    const z = rng();
    // Normalize.
    let len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len, ny = y / len, nz = z / len;

    // Quadratic falloff: more samples near the surface.
    const scale = i / count;
    const radius = 0.1 + 0.9 * scale * scale;

    kernel[i * 3 + 0] = nx * radius;
    kernel[i * 3 + 1] = ny * radius;
    kernel[i * 3 + 2] = nz * radius;
  }
  return kernel;
}

function createNoiseTexture(gl) {
  const size = 4;
  const rng = mulberry32(0x12345678);
  const data = new Float32Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4 + 0] = rng() * 2 - 1;
    data[i * 4 + 1] = rng() * 2 - 1;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 0;
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // OES_texture_float is required for FLOAT noise; fall back to half-float
  // or UNSIGNED_BYTE if unavailable.
  let type = gl.FLOAT;
  const hasFloat = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
  if (!hasFloat) {
    // Pack [-1,1] into [0,255] unsigned byte.
    const byteData = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size * 4; i++) {
      byteData[i] = Math.floor((data[i] * 0.5 + 0.5) * 255);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, byteData);
    type = gl.UNSIGNED_BYTE;
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, type, data);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { texture: tex, size, type };
}

// ---------------------------------------------------------------------------
// Shaders
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

// SSAO generation. Reconstructs view-space normals from depth via finite
// differences, then samples a hemisphere kernel rotated by per-pixel noise.
const SSAO_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDepth;
  uniform sampler2D tNoise;
  uniform vec3 uSamples[KERNEL_SIZE];
  uniform vec2 uNoiseScale;
  uniform float uRadius;
  uniform float uBias;
  uniform float uIntensity;
  uniform vec2 uResolution;
  uniform float uNear;
  uniform float uFar;
  uniform mat4 uProjection;
  varying vec2 vUv;

  float linearizeDepth(float d) {
    float z = d * 2.0 - 1.0;
    return (uNear * uFar) / (uFar - z * (uFar - uNear));
  }

  vec3 viewPosFromDepth(vec2 uv, float depth) {
    float z = depth * 2.0 - 1.0;
    vec2 ndc = uv * 2.0 - 1.0;
    // Inverse projection (assumes standard perspective matrix).
    vec4 viewPos = uProjection * vec4(ndc, z, 1.0);
    return viewPos.xyz / viewPos.w;
  }

  void main() {
    float depth = texture2D(tDepth, vUv).r;
    if (depth >= 0.9999) {
      gl_FragColor = vec4(1.0);
      return;
    }

    vec3 fragPos = viewPosFromDepth(vUv, depth);

    // Reconstruct normal from depth via central differences.
    vec2 texel = 1.0 / uResolution;
    float depthL = texture2D(tDepth, vUv - vec2(texel.x, 0.0)).r;
    float depthR = texture2D(tDepth, vUv + vec2(texel.x, 0.0)).r;
    float depthD = texture2D(tDepth, vUv - vec2(0.0, texel.y)).r;
    float depthU = texture2D(tDepth, vUv + vec2(0.0, texel.y)).r;
    vec3 fragL = viewPosFromDepth(vUv - vec2(texel.x, 0.0), depthL);
    vec3 fragR = viewPosFromDepth(vUv + vec2(texel.x, 0.0), depthR);
    vec3 fragD = viewPosFromDepth(vUv - vec2(0.0, texel.y), depthD);
    vec3 fragU = viewPosFromDepth(vUv + vec2(0.0, texel.y), depthU);
    vec3 normal = normalize(cross(fragR - fragL, fragU - fragD));

    // TBN from per-pixel noise.
    vec3 randomVec = texture2D(tNoise, vUv * uNoiseScale).xyz;
    // Normalize noise to [-1, 1] (only meaningful for UNSIGNED_BYTE noise textures).
    randomVec = normalize(randomVec * 2.0 - 0.5);
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < KERNEL_SIZE; i++) {
      vec3 samplePos = TBN * uSamples[i];
      samplePos = fragPos + samplePos * uRadius;

      // Project sample to screen space.
      vec4 offset = uProjection * vec4(samplePos, 1.0);
      offset.xyz /= offset.w;
      vec2 sampleUv = offset.xy * 0.5 + 0.5;

      float sampleDepth = texture2D(tDepth, sampleUv).r;
      float sampleViewZ = linearizeDepth(sampleDepth);

      float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(fragPos.z - sampleViewZ));
      occlusion += (sampleViewZ >= samplePos.z + uBias ? 1.0 : 0.0) * rangeCheck;
    }
    occlusion = 1.0 - (occlusion / float(KERNEL_SIZE));
    occlusion = pow(clamp(occlusion, 0.0, 1.0), uIntensity);

    gl_FragColor = vec4(vec3(occlusion), 1.0);
  }
`;

const BLUR_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform vec2 uDirection;
  varying vec2 vUv;

  void main() {
    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.1945946;
    weights[2] = 0.1216216;
    weights[3] = 0.054054;
    weights[4] = 0.016216;

    float result = texture2D(tDiffuse, vUv).r * weights[0];
    for (int i = 1; i < 5; i++) {
      result += texture2D(tDiffuse, vUv + uDirection * float(i)).r * weights[i];
      result += texture2D(tDiffuse, vUv - uDirection * float(i)).r * weights[i];
    }
    gl_FragColor = vec4(vec3(result), 1.0);
  }
`;

const COMPOSITE_FS = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform sampler2D tSSAO;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float ao = texture2D(tSSAO, vUv).r;
    // Blend: at intensity=1, full occlusion; at intensity=0, no effect.
    float factor = mix(1.0, ao, uIntensity);
    gl_FragColor = vec4(color.rgb * factor, color.a);
  }
`;

// ---------------------------------------------------------------------------
// Pass
// ---------------------------------------------------------------------------

const SAMPLE_OPTIONS = [16, 32, 64];

export class SSAOPass extends Pass {
  /**
   * @param {Object} [options]
   * @param {number} [options.radius=0.1]      Sampling radius in view space.
   * @param {number} [options.bias=0.025]      Depth bias to avoid self-occlusion.
   * @param {number} [options.intensity=1.0]   How strongly AO darkens the image.
   * @param {number} [options.samples=16]      16 | 32 | 64
   * @param {number} [options.near=0.1]
   * @param {number} [options.far=1000]
   */
  constructor(options = {}) {
    super();

    this.radius = options.radius !== undefined ? options.radius : 0.1;
    this.bias = options.bias !== undefined ? options.bias : 0.025;
    this.intensity = options.intensity !== undefined ? options.intensity : 1.0;
    this.near = options.near !== undefined ? options.near : 0.1;
    this.far = options.far !== undefined ? options.far : 1000;

    let samples = options.samples !== undefined ? options.samples : 16;
    if (!SAMPLE_OPTIONS.includes(samples)) samples = 16;
    this.samples = samples;

    // Deterministic hemisphere kernel.
    this._kernel = generateHemisphereKernel(this.samples);

    // Programs (lazily compiled on first render).
    this._programSSAO = null;
    this._programBlur = null;
    this._programComposite = null;

    // Internal render targets.
    this._rtAO = null;
    this._rtBlur = null;

    // Noise texture (created lazily).
    this._noise = null;

    this._gl = null;
    this.needsSwap = true;
  }

  /**
   * Build the SSAO fragment shader source for the current kernel size.
   * The `KERNEL_SIZE` macro is injected as a literal int so the GLSL
   * for-loop bound is constant.
   */
  _buildSSAOFs() {
    return SSAO_FS.replace(/KERNEL_SIZE/g, String(this.samples));
  }

  _init(gl) {
    if (this._gl !== gl) {
      this._programSSAO = compileProgram(gl, FULLSCREEN_VS, this._buildSSAOFs());
      this._programBlur = compileProgram(gl, FULLSCREEN_VS, BLUR_FS);
      this._programComposite = compileProgram(gl, FULLSCREEN_VS, COMPOSITE_FS);
      this._noise = createNoiseTexture(gl);
      this._gl = gl;
    }
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    if (this._rtAO)    this._rtAO.setSize(width, height);
    if (this._rtBlur)  this._rtBlur.setSize(width, height);
  }

  /**
   * @returns {Float32Array}
   */
  getKernel() {
    return this._kernel;
  }

  /**
   * Rebuild the kernel with a different sample count.
   * @param {number} samples  16 | 32 | 64
   */
  setSamples(samples) {
    if (!SAMPLE_OPTIONS.includes(samples)) return;
    if (samples === this.samples) return;
    this.samples = samples;
    this._kernel = generateHemisphereKernel(this.samples);
    // Force recompile of SSAO program with new KERNEL_SIZE.
    this._programSSAO = null;
  }

  /**
   * Build a 4x4 projection matrix array (column-major) suitable for
   * passing to the SSAO shader. We use the camera's projection if
   * available, else fall back to a generic perspective matrix.
   */
  _getProjectionArray(camera) {
    if (camera && camera.projectionMatrix) {
      const m = camera.projectionMatrix;
      if (m.elements && m.elements.length === 16) return m.elements;
      if (Array.isArray(m) && m.length === 16) return m;
      if (m.toArray) return m.toArray();
    }
    // Fallback: a generic perspective matrix. Not physically correct
    // for the scene but lets the shader compile and run without a camera.
    const f = 1.0 / Math.tan(Math.PI / 4);
    const near = this.near, far = this.far;
    return new Float32Array([
      f / 1, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0
    ]);
  }

  render(renderer, writeBuffer, readBuffer) {
    const gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    if (!gl || !readBuffer) return;

    this._init(gl);

    const w = readBuffer.width;
    const h = readBuffer.height;
    if (!this._rtAO)   this._rtAO   = new WebGLRenderTarget(gl, w, h, { depthBuffer: false });
    if (!this._rtBlur) this._rtBlur = new WebGLRenderTarget(gl, w, h, { depthBuffer: false });
    this._rtAO.setSize(w, h);
    this._rtBlur.setSize(w, h);

    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);
    const prevActiveUnit = gl.getParameter(gl.ACTIVE_TEXTURE);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    // Depth texture (attached by RenderPass). Fall back to a 1x1 white
    // texture if not available — AO will read as "fully unoccluded".
    const depthTex = readBuffer.depthTextureObj || this._fallbackDepth(gl);

    // Resolve camera from RenderPass-style pipeline: the composer doesn't
    // pass the camera to us, so we look it up from the renderer's last
    // render call. Most passes don't need it; SSAO does.
    const camera = (this._camera) || (renderer._lastCamera) || null;
    const projArray = this._getProjectionArray(camera);

    try {
      // ----- 1. SSAO generation -----
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rtAO.framebuffer);
      gl.viewport(0, 0, w, h);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this._programSSAO.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, depthTex);
      setUniformValue(gl, this._programSSAO, 'tDepth', { type: 'texture', unit: 0 });

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._noise.texture);
      setUniformValue(gl, this._programSSAO, 'tNoise', { type: 'texture', unit: 1 });

      setUniformValue(gl, this._programSSAO, 'uSamples', this._kernel);
      setUniformValue(gl, this._programSSAO, 'uNoiseScale', [w / this._noise.size, h / this._noise.size]);
      setUniformValue(gl, this._programSSAO, 'uRadius', this.radius);
      setUniformValue(gl, this._programSSAO, 'uBias', this.bias);
      setUniformValue(gl, this._programSSAO, 'uIntensity', this.intensity);
      setUniformValue(gl, this._programSSAO, 'uResolution', [w, h]);
      setUniformValue(gl, this._programSSAO, 'uNear', this.near);
      setUniformValue(gl, this._programSSAO, 'uFar', this.far);
      setUniformValue(gl, this._programSSAO, 'uProjection', projArray);

      bindFullscreenQuad(gl, this._programSSAO);
      drawFullscreenQuad(gl);

      // ----- 2. Blur (horizontal then vertical) -----
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rtBlur.framebuffer);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this._programBlur.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._rtAO.texture);
      setUniformValue(gl, this._programBlur, 'tDiffuse', { type: 'texture', unit: 0 });
      setUniformValue(gl, this._programBlur, 'uDirection', [1.0 / w, 0.0]);
      bindFullscreenQuad(gl, this._programBlur);
      drawFullscreenQuad(gl);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._rtAO.framebuffer);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this._programBlur.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._rtBlur.texture);
      setUniformValue(gl, this._programBlur, 'tDiffuse', { type: 'texture', unit: 0 });
      setUniformValue(gl, this._programBlur, 'uDirection', [0.0, 1.0 / h]);
      bindFullscreenQuad(gl, this._programBlur);
      drawFullscreenQuad(gl);

      // ----- 3. Composite -----
      if (writeBuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
        gl.viewport(0, 0, writeBuffer.width, writeBuffer.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const cw = renderer.canvas ? renderer.canvas.width : gl.drawingBufferWidth;
        const ch = renderer.canvas ? renderer.canvas.height : gl.drawingBufferHeight;
        gl.viewport(0, 0, cw, ch);
      }

      gl.useProgram(this._programComposite.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
      setUniformValue(gl, this._programComposite, 'tDiffuse', { type: 'texture', unit: 0 });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._rtAO.texture);
      setUniformValue(gl, this._programComposite, 'tSSAO', { type: 'texture', unit: 1 });
      setUniformValue(gl, this._programComposite, 'uIntensity', this.intensity);
      bindFullscreenQuad(gl, this._programComposite);
      drawFullscreenQuad(gl);
    } finally {
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST);
      if (prevBlend) gl.enable(gl.BLEND);
      if (prevCullFace) gl.enable(gl.CULL_FACE);
      gl.activeTexture(prevActiveUnit || gl.TEXTURE0);
    }
  }

  _fallbackDepth(gl) {
    if (this._fallbackDepthTex) return this._fallbackDepthTex;
    this._fallbackDepthTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._fallbackDepthTex);
    const one = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 1, 1, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_BYTE, one);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return this._fallbackDepthTex;
  }

  /**
   * Set the camera used for SSAO projection. The composer's pipeline
   * doesn't pass a camera through to effect passes, so this must be
   * set explicitly when SSAOPass is added to the pipeline.
   * @param {import('../core/Camera.js').Camera} camera
   */
  setCamera(camera) {
    this._camera = camera;
  }

  dispose() {
    if (this._rtAO)   this._rtAO.dispose();
    if (this._rtBlur) this._rtBlur.dispose();
    if (this._gl && this._noise)   this._gl.deleteTexture(this._noise.texture);
    if (this._gl && this._fallbackDepthTex) this._gl.deleteTexture(this._fallbackDepthTex);
    this._rtAO = null;
    this._rtBlur = null;
    this._noise = null;
    this._fallbackDepthTex = null;
    this._programSSAO = null;
    this._programBlur = null;
    this._programComposite = null;
    this._gl = null;
  }
}

export { generateHemisphereKernel };
export default SSAOPass;
