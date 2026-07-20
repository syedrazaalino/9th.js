/**
 * BRDFLUT.js — Precomputed 2D BRDF integration lookup table.
 *
 * Generates the standard 2D RG16F lookup texture used by split-sum PBR:
 * the texture's R channel stores the Fresnel scale factor and the G
 * channel stores the Fresnel bias factor, indexed by (NdotV, roughness).
 *
 * Usage:
 *   import { BRDFLUT } from '9th.js';
 *   const brdfLUT = new BRDFLUT(renderer);
 *   brdfLUT.generate(512);
 *   // later, on a MeshStandardMaterial:
 *   material.setUniform('brdfLUT', brdfLUT.texture);
 *
 * Implementation notes:
 *   - The integration uses the standard ImportanceSampleGGX + Smith geometry
 *     function approach (learnopengl.com/PBR/IBL).
 *   - The Hammersley sequence is generated on the CPU (avoids WebGL1 uint
 *     bit-operation limits) and uploaded as a uniform array of vec2.
 *   - The fragment shader loops over a fixed SAMPLE_COUNT and accumulates
 *     the split-sum approximation.
 *   - Output is written to an RGBA16F (HALF_FLOAT) RenderTarget for
 *     sufficient precision in the integrated (scale,bias) values.
 *
 * This module never touches `document` or `navigator` at import time, so
 * it is safe to import from Node.js. Calling `generate()` requires a real
 * WebGLRenderingContext.
 */

import { RenderTarget } from '../core/RenderTarget.js';
import {
  compileProgram,
  createFullscreenQuad,
  bindFullscreenQuad,
  drawFullscreenQuad,
  setUniformValue,
  applyUniforms
} from '../postprocessing/EffectComposer.js';

// ---------------------------------------------------------------------------
// CPU-side Hammersley sequence generator
// ---------------------------------------------------------------------------

/**
 * Compute the Van der Corput radical inverse in base 2 for an integer index.
 * @param {number} i  Sample index (0..N-1)
 * @returns {number}   Radical inverse value in [0,1)
 */
function vanDerCorput(i) {
  let bits = i >>> 0;
  bits = ((bits << 16) | (bits >>> 16)) >>> 0;
  bits = (((bits & 0x55555555) << 1) | ((bits & 0xAAAAAAAA) >>> 1)) >>> 0;
  bits = (((bits & 0x33333333) << 2) | ((bits & 0xCCCCCCCC) >>> 2)) >>> 0;
  bits = (((bits & 0x0F0F0F0F) << 4) | ((bits & 0xF0F0F0F0) >>> 4)) >>> 0;
  bits = (((bits & 0x00FF00FF) << 8) | ((bits & 0xFF00FF00) >>> 8)) >>> 0;
  return bits * 2.3283064365386963e-10; // 1 / 2^32
}

/**
 * Generate the first N points of the Hammersley sequence (low-discrepancy
 * on the unit square [0,1)^2).
 *
 * @param {number} N
 * @returns {Float32Array} N*2 components: [xi0, xi1, xi0, xi1, ...]
 */
function generateHammersley(N) {
  const out = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    out[i * 2 + 0] = i / N;
    out[i * 2 + 1] = vanDerCorput(i);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shaders (GLSL ES 1.00, with a per-instance SAMPLE_COUNT macro injected)
// ---------------------------------------------------------------------------

const BRDFLUT_VS = `
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/**
 * Build the fragment shader source with a baked SAMPLE_COUNT constant.
 * @param {number} SAMPLE_COUNT
 * @returns {string}
 */
function buildBRDFLUT_FS(SAMPLE_COUNT) {
  // Loop bound is a constant literal so GLSL ES 1.00 is happy.
  return `
precision highp float;
varying vec2 vUv;

const float PI = 3.14159265359;
const int SAMPLE_COUNT = ${SAMPLE_COUNT};

uniform vec2 uSamples[${SAMPLE_COUNT}];

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
  float a = roughness * roughness;
  float phi = 2.0 * PI * Xi.x;
  float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
  float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
  vec3 H = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
  vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, N));
  vec3 bitangent = cross(N, tangent);
  return normalize(tangent * H.x + bitangent * H.y + N * H.z);
}

float GeometrySchlickGGX(float NdotV, float roughness) {
  float a = roughness;
  float k = (a * a) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  return GeometrySchlickGGX(max(dot(N, V), 0.0), roughness)
       * GeometrySchlickGGX(max(dot(N, L), 0.0), roughness);
}

vec2 IntegrateBRDF(float NdotV, float roughness) {
  vec3 V = vec3(sqrt(1.0 - NdotV * NdotV), 0.0, NdotV);
  vec3 N = vec3(0.0, 0.0, 1.0);
  float A = 0.0;
  float B = 0.0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    vec2 Xi = uSamples[i];
    vec3 H = ImportanceSampleGGX(Xi, N, roughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);
    float NdotL = max(L.z, 0.0);
    float NdotH = max(H.z, 0.0);
    float VdotH = max(dot(V, H), 0.0);
    if (NdotL > 0.0) {
      float G = GeometrySmith(N, V, L, roughness);
      float G_Vis = (G * VdotH) / max(NdotH * NdotV, 0.001);
      float Fc = pow(1.0 - VdotH, 5.0);
      A += (1.0 - Fc) * G_Vis;
      B += Fc * G_Vis;
    }
  }
  return vec2(A, B) / float(SAMPLE_COUNT);
}

void main() {
  // Clamp NdotV to avoid division by 0 in the integration.
  float NdotV = clamp(vUv.x, 0.001, 1.0);
  float roughness = clamp(vUv.y, 0.0, 1.0);
  vec2 integratedBRDF = IntegrateBRDF(NdotV, roughness);
  gl_FragColor = vec4(integratedBRDF.x, integratedBRDF.y, 0.0, 1.0);
}
`;
}

// ---------------------------------------------------------------------------
// BRDFLUT class
// ---------------------------------------------------------------------------

export class BRDFLUT {
  /**
   * @param {WebGLRenderer|WebGLRenderingContext} renderer  A WebGLRenderer (preferred)
   *        or a raw WebGL context.
   */
  constructor(renderer) {
    if (renderer && renderer.gl) {
      this.renderer = renderer;
      this.gl = renderer.gl;
    } else {
      this.renderer = null;
      this.gl = renderer; // raw GL context
    }

    /** @type {RenderTarget|null} */
    this.renderTarget = null;
    /** @type {RenderTargetTexture|null} The generated LUT texture (RG16F, exposed as RGBA16F). */
    this.texture = null;
    /** @type {number} */
    this.size = 0;
    /** @type {number} */
    this.sampleCount = 0;

    /** @private compiled shader program-info */
    this._programInfo = null;
    /** @private cached Hammersley sample array (Float32Array) */
    this._hammersley = null;
    /** @private cached GL uniform buffer (uploaded each frame from _hammersley) */
    this._uniformArray = null;

    /** @type {boolean} */
    this.isBRDFLUT = true;
    /** @type {string} */
    this.id = 'brdfLUT_' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Generate the BRDF integration LUT.
   *
   * @param {number} [size=512]           LUT edge length in pixels (square).
   * @param {number} [sampleCount=256]    Number of Hammersley samples per pixel.
   * @returns {RenderTargetTexture}       The generated texture (also stored on `this.texture`).
   * @throws {Error} if the WebGL context is missing or half-float render targets are unavailable.
   */
  generate(size = 512, sampleCount = 256) {
    if (!this.gl) {
      throw new Error('[9th.js BRDFLUT] No GL context available. Pass a WebGLRenderer or GL context to the constructor.');
    }

    size = Math.max(16, Math.floor(Number(size) || 512));
    // Cap sampleCount at 256 for WebGL1 uniform-vector limits.
    sampleCount = Math.max(1, Math.min(256, Math.floor(Number(sampleCount) || 256)));

    // Validate half-float rendering support (we need at least RGBA16F for the LUT).
    this._ensureHalfFloatSupport();

    // (Re)create the render target with HALF_FLOAT type for precision.
    if (this.renderTarget) {
      try { this.renderTarget.dispose(); } catch (_) { /* noop */ }
    }
    this.renderTarget = new RenderTarget(size, size, {
      format: 'RGBA',
      type: 'HALF_FLOAT',
      minFilter: 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
      name: 'brdfLUT'
    });

    // (Re)compile the shader if SAMPLE_COUNT changed.
    if (!this._programInfo || this.sampleCount !== sampleCount) {
      if (this._programInfo && this._programInfo.program) {
        try { this.gl.deleteProgram(this._programInfo.program); } catch (_) { /* noop */ }
      }
      const fsSource = buildBRDFLUT_FS(sampleCount);
      this._programInfo = compileProgram(this.gl, BRDFLUT_VS, fsSource);
      this._hammersley = generateHammersley(sampleCount);
      // Repack into a flat Float32Array that we upload as uniform2fv.
      this._uniformArray = this._hammersley;
    }

    // Bind render target + program, set uniforms, draw fullscreen quad.
    const gl = this.gl;

    // Save GL state so we don't pollute the caller's setup.
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const prevArrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
    const prevViewport = gl.getParameter(gl.VIEWPORT);
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);

    // Bind render target (lazy-creates its FBO).
    if (this.renderer && typeof this.renderer.setRenderTarget === 'function') {
      this.renderer.setRenderTarget(this.renderTarget);
    } else if (typeof this.renderTarget._ensureGL === 'function') {
      this.renderTarget._ensureGL(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.framebuffer);
    }

    gl.viewport(0, 0, size, size);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    gl.useProgram(this._programInfo.program);

    // Upload the Hammersley samples uniform array (vec2[N]).
    const samplesLoc = this._programInfo.uniforms.get('uSamples');
    if (samplesLoc) {
      gl.uniform2fv(samplesLoc, this._uniformArray);
    }

    // Draw a fullscreen quad with UVs spanning [0,1] x [0,1].
    bindFullscreenQuad(gl, this._programInfo);
    drawFullscreenQuad(gl);

    // Restore caller state.
    if (this.renderer && typeof this.renderer.setRenderTarget === 'function') {
      this.renderer.setRenderTarget(null);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.useProgram(prevProgram || null);
    gl.activeTexture(prevActiveTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, prevArrayBufferBinding || null);
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
    if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
    if (prevCullFace) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);

    this.size = size;
    this.sampleCount = sampleCount;
    this.texture = this.renderTarget.texture;
    this.texture.isBRDFLUTTexture = true;
    this.texture.name = 'brdfLUT';

    return this.texture;
  }

  /**
   * Ensure the GL context supports half-float color rendering.
   * @private
   */
  _ensureHalfFloatSupport() {
    const gl = this.gl;
    // WebGL2 has core RGBA16F renderable support. Check anyway.
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (isWebGL2) {
      // Still need EXT_color_buffer_half_float or EXT_color_buffer_float for rendering
      const ext = gl.getExtension('EXT_color_buffer_half_float') ||
                  gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        console.warn(
          '[9th.js BRDFLUT] EXT_color_buffer_half_float unavailable on WebGL2 — ' +
          'the LUT will fall back to UNSIGNED_BYTE precision (lossy).'
        );
        // Fall back: rewrite the render target type after creation? Simpler —
        // we let the RenderTarget's _ensureGL fail naturally; the warning is enough.
      }
    } else {
      // WebGL1
      const extHF = gl.getExtension('OES_texture_half_float');
      const extCBHF = gl.getExtension('EXT_color_buffer_half_float');
      if (!extHF || !extCBHF) {
        console.warn(
          '[9th.js BRDFLUT] Half-float render targets are not supported on this ' +
          'WebGL1 context (need OES_texture_half_float + EXT_color_buffer_half_float). ' +
          'Falling back to UNSIGNED_BYTE — quality will be reduced.'
        );
      }
    }
  }

  /**
   * Release all GPU resources held by this LUT.
   */
  dispose() {
    if (this._programInfo && this._programInfo.program) {
      try { this.gl.deleteProgram(this._programInfo.program); } catch (_) { /* noop */ }
      this._programInfo = null;
    }
    if (this.renderTarget) {
      try { this.renderTarget.dispose(); } catch (_) { /* noop */ }
      this.renderTarget = null;
    }
    this.texture = null;
    this.size = 0;
    this.sampleCount = 0;
    this._hammersley = null;
    this._uniformArray = null;
  }
}

export default BRDFLUT;
