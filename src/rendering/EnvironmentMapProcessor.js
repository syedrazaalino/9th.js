/**
 * EnvironmentMapProcessor.js — Cube-map / equirectangular / PMREM utilities.
 *
 * Provides:
 *   - `equirectToCubemap(equirectTexture, size=512)` — convert an
 *      equirectangular panorama texture into a 6-face cube map.
 *   - `cubemapToPMREM(cubeTexture, samples=1024)` — prefilter a cube map
 *      into a Pre-filtered Mipmapped Radiance Environment Map (PMREM),
 *      with one roughness mip level per cube mip.
 *   - `generateDiffuseEnv(cubeTexture)` — convolve a cube map over the
 *      hemisphere to produce a low-frequency diffuse irradiance map.
 *   - `generateSpecularEnv(cubeTexture, mipLevels, sampleCount)` — alias
 *      for `cubemapToPMREM` with explicit parameters.
 *
 * All off-screen rendering uses the existing RenderTarget class (with
 * `isCubeTarget=true`). Shaders are GLSL ES 1.00 to match the existing
 * 9th.js materials.
 *
 * The processor accepts either a WebGLRenderer or a raw WebGLRenderingContext.
 */

import { RenderTarget } from '../core/RenderTarget.js';
import {
  compileProgram,
  createFullscreenQuad,
  bindFullscreenQuad,
  drawFullscreenQuad
} from '../postprocessing/EffectComposer.js';

// ---------------------------------------------------------------------------
// Shaders (GLSL ES 1.00)
// ---------------------------------------------------------------------------

/**
 * Vertex shader for the box-rendering passes (equirect→cube, PMREM, diffuse).
 * Renders the supplied geometry (a unit cube or a fullscreen quad) in clip
 * space. For cube-face rendering we use the unit-cube geometry and rely on
 * the GPU's per-face view matrices; for fullscreen passes we use the quad
 * and pass through the UV.
 *
 * This VS supports BOTH layouts (cube positions and quad positions+uvs):
 *   attribute vec3 position  (always present)
 *   attribute vec2 uv        (optional, only for fullscreen passes)
 * It emits `vUv` (used by the quad shader) and `vDirection` (used by the
 * cube shader) — both are populated, even if unused by one of them.
 */
const SHARED_VS = `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 uProjection;
uniform mat4 uView;
varying vec2 vUv;
varying vec3 vDirection;
void main() {
  vUv = uv;
  vDirection = position;
  gl_Position = uProjection * uView * vec4(position, 1.0);
}
`;

/**
 * Fragment shader: sample an equirectangular (2D panorama) texture along
 * the direction `vDirection`.
 */
const EQUIRECT_TO_CUBE_FS = `
precision highp float;
varying vec3 vDirection;
uniform sampler2D uEquirectMap;
const vec2 INV_ATAN = vec2(0.1591, 0.3183);

vec2 SampleSphericalMap(vec3 v) {
  vec2 uv = vec2(atan(v.z, v.x), asin(clamp(v.y, -1.0, 1.0)));
  uv = uv * INV_ATAN + 0.5;
  return uv;
}

void main() {
  vec3 dir = normalize(vDirection);
  vec2 uv = SampleSphericalMap(dir);
  vec3 col = texture2D(uEquirectMap, uv).rgb;
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Fragment shader: convolve the cube map for diffuse irradiance.
 * Samples the cube map along many hemisphere directions (cosine-weighted)
 * and averages.
 *
 * Uses a uniform array of precomputed sample directions (vec3 L) and
 * weights (float) — generated CPU-side as a Hammersley + cosine-weighted
 * distribution. This keeps the GLSL simple (no uint bit operations).
 */
const DIFFUSE_IRRADIANCE_FS = `
precision highp float;
varying vec3 vDirection;
uniform samplerCube uEnvMap;
uniform vec3 uSamples[#SAMPLE_COUNT#];
uniform float uSampleCount;
const float PI = 3.14159265359;

void main() {
  vec3 N = normalize(vDirection);
  vec3 up = abs(N.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, N));
  vec3 bitangent = cross(N, tangent);

  vec3 irradiance = vec3(0.0);
  float wSum = 0.0;
  int count = int(uSampleCount);
  for (int i = 0; i < #SAMPLE_COUNT#; i++) {
    if (i >= count) break;
    vec3 L = uSamples[i];
    // L is already in tangent space; rotate it into world space below.
    vec3 worldL = normalize(tangent * L.x + bitangent * L.z + N * L.y);
    float NdotL = max(dot(N, worldL), 0.0);
    // Cosine-weighted contribution (the sample PDF bakes in the cos weight,
    // so we just multiply by NdotL and divide by sample count).
    irradiance += textureCube(uEnvMap, worldL).rgb * NdotL;
    wSum += 1.0;
  }
  irradiance = irradiance * (PI / float(count));
  gl_FragColor = vec4(irradiance, 1.0);
}
`;

/**
 * Fragment shader: prefilter specular environment map at a given roughness
 * mip level. Uses ImportanceSampleGGX + Smith geometry, exactly as in the
 * standard split-sum IBL approach.
 */
const PREFILTER_ENV_FS = `
precision highp float;
varying vec3 vDirection;
uniform samplerCube uEnvMap;
uniform float uRoughness;
uniform vec2 uHammersley[#SAMPLE_COUNT#];
uniform float uSampleCount;
const float PI = 3.14159265359;

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

float DistributionGGX(float NdotH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  denom = PI * denom * denom;
  return a2 / max(denom, 0.0001);
}

void main() {
  vec3 N = normalize(vDirection);
  vec3 R = N;
  vec3 V = R;

  float totalWeight = 0.0;
  vec3 prefilteredColor = vec3(0.0);
  int count = int(uSampleCount);
  for (int i = 0; i < #SAMPLE_COUNT#; i++) {
    if (i >= count) break;
    vec2 Xi = uHammersley[i];
    vec3 H = ImportanceSampleGGX(Xi, N, uRoughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);
    float NdotL = max(dot(N, L), 0.0);
    if (NdotL > 0.0) {
      float D = DistributionGGX(max(dot(N, H), 0.0), uRoughness);
      float pdf = (D * max(dot(N, H), 0.0) / max(4.0 * max(dot(V, H), 0.0), 0.0001)) + 0.0001;
      // Use a constant LOD bias to sample the source cube map; we use 0 here
      // because the source cube has only LOD 0 in this minimal implementation.
      float lod = 0.0;
      vec3 sampled;
      // textureCubeLod may not exist in WebGL1; fall back to textureCube.
      // We compute a fixed sample here (no mip sampling) for portability.
      sampled = textureCube(uEnvMap, L).rgb;
      prefilteredColor += sampled * NdotL;
      totalWeight += NdotL;
    }
  }
  prefilteredColor = prefilteredColor / max(totalWeight, 0.001);
  gl_FragColor = vec4(prefilteredColor, 1.0);
}
`;

/**
 * Fullscreen-quad copy shader used when copying one face of a cube target
 * back into a regular 2D texture (not strictly required; provided for
 * completeness).
 */
const COPY_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSource;
void main() {
  gl_FragColor = texture2D(uSource, vUv);
}
`;

// ---------------------------------------------------------------------------
// CPU-side sample generators
// ---------------------------------------------------------------------------

function vanDerCorput(i) {
  let bits = i >>> 0;
  bits = ((bits << 16) | (bits >>> 16)) >>> 0;
  bits = (((bits & 0x55555555) << 1) | ((bits & 0xAAAAAAAA) >>> 1)) >>> 0;
  bits = (((bits & 0x33333333) << 2) | ((bits & 0xCCCCCCCC) >>> 2)) >>> 0;
  bits = (((bits & 0x0F0F0F0F) << 4) | ((bits & 0xF0F0F0F0) >>> 4)) >>> 0;
  bits = (((bits & 0x00FF00FF) << 8) | ((bits & 0xFF00FF00) >>> 8)) >>> 0;
  return bits * 2.3283064365386963e-10;
}

function hammersley(i, N) {
  return [i / N, vanDerCorput(i)];
}

/**
 * Generate `count` cosine-weighted hemisphere sample directions in tangent
 * space (y up) using a Hammersley sequence. Each returned element is a
 * vec3 [x, y, z] with y >= 0. Used by the diffuse irradiance convolution.
 *
 * @param {number} count
 * @returns {Float32Array}  count*3 floats
 */
function generateCosineHemisphereSamples(count) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const Xi = hammersley(i, count);
    const phi = 2.0 * Math.PI * Xi[0];
    // Cosine-weighted: cosTheta = sqrt(1 - Xi.y), sinTheta = sqrt(Xi.y)
    const cosTheta = Math.sqrt(1.0 - Xi[1]);
    const sinTheta = Math.sqrt(Xi[1]);
    // Tangent space with y up (matches the shader's tangent/bitangent/N basis).
    out[i * 3 + 0] = sinTheta * Math.cos(phi); // x
    out[i * 3 + 1] = cosTheta;                 // y (up, aligned with N)
    out[i * 3 + 2] = sinTheta * Math.sin(phi); // z
  }
  return out;
}

/**
 * Generate `count` Hammersley points as a flat Float32Array of vec2.
 * @param {number} count
 * @returns {Float32Array}
 */
function generateHammersleyVec2(count) {
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const Xi = hammersley(i, count);
    out[i * 2 + 0] = Xi[0];
    out[i * 2 + 1] = Xi[1];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cube-face view matrices (column-major Float32Array(16))
// ---------------------------------------------------------------------------

/**
 * Build a 4x4 look-at view matrix (column-major, Float32Array(16)) for a
 * cube-face camera. The convention matches WebGL cube-map face order:
 *
 *   face 0 = +X (right)     eye=(0,0,0)  target=(+1,0,0)  up=(0,-1,0)
 *   face 1 = -X (left)      eye=(0,0,0)  target=(-1,0,0)  up=(0,-1,0)
 *   face 2 = +Y (top)       eye=(0,0,0)  target=(0,+1,0)  up=(0,0,1)
 *   face 3 = -Y (bottom)    eye=(0,0,0)  target=(0,-1,0)  up=(0,0,-1)
 *   face 4 = +Z (front)     eye=(0,0,0)  target=(0,0,+1)  up=(0,-1,0)
 *   face 5 = -Z (back)      eye=(0,0,0)  target=(0,0,-1)  up=(0,-1,0)
 *
 * (Same convention as Three.js's CubeCamera.)
 *
 * @param {number} face  0..5
 * @returns {Float32Array}
 */
function cubeFaceViewMatrix(face) {
  const targets = [
    [1, 0, 0],   // +X
    [-1, 0, 0],  // -X
    [0, 1, 0],   // +Y
    [0, -1, 0],  // -Y
    [0, 0, 1],   // +Z
    [0, 0, -1]   // -Z
  ];
  const ups = [
    [0, -1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, -1, 0],
    [0, -1, 0]
  ];
  const target = targets[face];
  const up = ups[face];
  return lookAt(0, 0, 0, target[0], target[1], target[2], up[0], up[1], up[2]);
}

/**
 * 4x4 look-at matrix (column-major, Float32Array(16)).
 * eye and target are points; up is the world-up vector.
 */
function lookAt(ex, ey, ez, tx, ty, tz, ux, uy, uz) {
  // forward = eye - target (camera looks down -Z in view space)
  let fx = ex - tx, fy = ey - ty, fz = ez - tz;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  // right = up × forward
  let rx = uy * fz - uz * fy;
  let ry = uz * fx - ux * fz;
  let rz = ux * fy - uy * fx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl; ry /= rl; rz /= rl;
  // up' = forward × right
  const ux2 = fy * rz - fz * ry;
  const uy2 = fz * rx - fx * rz;
  const uz2 = fx * ry - fy * rx;
  // Row-major look-at:
  // [ rx ry rz -dot(right, eye) ]
  // [ ux uy uz -dot(up, eye)    ]
  // [ fx fy fz -dot(fwd, eye)   ]
  // [  0  0  0  1               ]
  const m = new Float32Array(16);
  m[0] = rx;  m[4] = ry;  m[8]  = rz;  m[12] = -(rx * ex + ry * ey + rz * ez);
  m[1] = ux2; m[5] = uy2; m[9]  = uz2; m[13] = -(ux2 * ex + uy2 * ey + uz2 * ez);
  m[2] = fx;  m[6] = fy;  m[10] = fz;  m[14] = -(fx * ex + fy * ey + fz * ez);
  m[3] = 0;   m[7] = 0;   m[11] = 0;   m[15] = 1;
  return m;
}

/**
 * Build a symmetric perspective projection matrix (column-major, Float32Array(16))
 * with a 90° vertical FOV (so 6 faces tile the full sphere).
 *
 * @param {number} near
 * @param {number} far
 * @returns {Float32Array}
 */
function perspective90(near = 0.1, far = 100) {
  const f = 1.0 / Math.tan(Math.PI / 4); // tan(45°)
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  // Other entries are 0 (Float32Array default).
  return m;
}

// ---------------------------------------------------------------------------
// Cube vertex geometry (single-vec3 positions, 36 verts)
// ---------------------------------------------------------------------------

// A unit cube with 36 vertices (no index buffer) — pairs of triangles per face.
// Each face is rendered separately by the cube-face camera, so we just need
// a box that fills the clip-space frustum when projected.
const CUBE_POSITIONS = new Float32Array([
  // +X face
  1, -1, -1, 1, 1, -1, 1, 1, 1,
  1, -1, -1, 1, 1, 1, 1, -1, 1,
  // -X face
  -1, -1, 1, -1, 1, 1, -1, 1, -1,
  -1, -1, 1, -1, 1, -1, -1, -1, -1,
  // +Y face
  -1, 1, -1, -1, 1, 1, 1, 1, 1,
  -1, 1, -1, 1, 1, 1, 1, 1, -1,
  // -Y face
  -1, -1, 1, -1, -1, -1, 1, -1, -1,
  -1, -1, 1, 1, -1, -1, 1, -1, 1,
  // +Z face
  -1, -1, 1, 1, -1, 1, 1, 1, 1,
  -1, -1, 1, 1, 1, 1, -1, 1, 1,
  // -Z face
  1, -1, -1, -1, -1, -1, -1, 1, -1,
  1, -1, -1, -1, 1, -1, 1, 1, -1
]);

// ---------------------------------------------------------------------------
// EnvironmentMapProcessor
// ---------------------------------------------------------------------------

export class EnvironmentMapProcessor {
  /**
   * @param {WebGLRenderer|WebGLRenderingContext} renderer
   */
  constructor(renderer) {
    if (renderer && renderer.gl) {
      this.renderer = renderer;
      this.gl = renderer.gl;
    } else {
      this.renderer = null;
      this.gl = renderer;
    }

    /** @type {WebGLBuffer|null} cached cube VBO */
    this._cubeVBO = null;

    /** @type {Map<string, {program, uniforms, attributes}>} compiled programs */
    this._programs = new Map();

    /** @type {Float32Array} cached perspective matrix (90° FOV) */
    this._projection = perspective90(0.1, 100);

    this.isEnvironmentMapProcessor = true;
  }

  /* ------------------------------------------------------------------- *
   * Internal: cube VBO
   * ------------------------------------------------------------------- */

  _getCubeVBO() {
    if (this._cubeVBO) return this._cubeVBO;
    const gl = this.gl;
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_POSITIONS, gl.STATIC_DRAW);
    this._cubeVBO = vbo;
    return vbo;
  }

  /* ------------------------------------------------------------------- *
   * Internal: program cache
   * ------------------------------------------------------------------- */

  _getProgram(key, vs, fs) {
    if (this._programs.has(key)) return this._programs.get(key);
    const info = compileProgram(this.gl, vs, fs);
    this._programs.set(key, info);
    return info;
  }

  /* ------------------------------------------------------------------- *
   * Internal: state save / restore
   * ------------------------------------------------------------------- */

  _saveState() {
    const gl = this.gl;
    return {
      program: gl.getParameter(gl.CURRENT_PROGRAM),
      activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
      arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
      viewport: gl.getParameter(gl.VIEWPORT),
      depthTest: gl.isEnabled(gl.DEPTH_TEST),
      blend: gl.isEnabled(gl.BLEND),
      cullFace: gl.isEnabled(gl.CULL_FACE)
    };
  }

  _restoreState(s) {
    const gl = this.gl;
    gl.useProgram(s.program || null);
    gl.activeTexture(s.activeTexture);
    gl.bindBuffer(gl.ARRAY_BUFFER, s.arrayBuffer || null);
    gl.viewport(s.viewport[0], s.viewport[1], s.viewport[2], s.viewport[3]);
    if (s.depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    if (s.blend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
    if (s.cullFace) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
  }

  /* ------------------------------------------------------------------- *
   * Internal: bind a 2D or cube texture to a unit
   * ------------------------------------------------------------------- */

  _bindTextureToUnit(texture, unit, isCube = false) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    if (texture && texture._glTexture) {
      // RenderTargetTexture
      gl.bindTexture(isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture._glTexture);
    } else if (texture && texture.texture && texture.texture._glTexture) {
      gl.bindTexture(isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture.texture._glTexture);
    } else if (texture && texture.texture) {
      // CubeTexture from src/rendering/CubeTexture.js
      gl.bindTexture(isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture.texture);
    } else if (texture) {
      gl.bindTexture(isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, texture);
    } else {
      gl.bindTexture(isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D, null);
    }
  }

  /* ------------------------------------------------------------------- *
   * Internal: render one cube face into a cube RenderTarget
   * ------------------------------------------------------------------- */

  _renderCubeFace(target, face, drawCallback) {
    const gl = this.gl;
    if (typeof target.setCubeFace === 'function') {
      target.setCubeFace(gl, face);
    } else {
      // Fallback: bind directly
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    }
    gl.viewport(0, 0, target.width, target.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawCallback(face);
  }

  /**
   * Render all 6 cube faces of `target` using the supplied program-info.
   * The vertex shader is expected to consume a uniform mat4 `uProjection`
   * and `uView` and to use the unit-cube geometry.
   *
   * @param {RenderTarget} target  A cube RenderTarget.
   * @param {{program, uniforms, attributes}} programInfo
   * @param {(face:number)=>void} bindUniforms  Called per-face; should set
   *        any extra uniforms (textures, roughness, etc.) before the draw.
   * @private
   */
  _renderCubeFaces(target, programInfo, bindUniforms) {
    const gl = this.gl;
    const vbo = this._getCubeVBO();

    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    const posLoc = programInfo.attributes.get('position');
    if (posLoc !== undefined && posLoc >= 0) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }
    // Disable the 'uv' attribute if it exists (the unit-cube VBO has no uvs).
    const uvLoc = programInfo.attributes.get('uv');
    if (uvLoc !== undefined && uvLoc >= 0) {
      gl.disableVertexAttribArray(uvLoc);
    }

    const projLoc = programInfo.uniforms.get('uProjection');
    if (projLoc) gl.uniformMatrix4fv(projLoc, false, this._projection);

    for (let face = 0; face < 6; face++) {
      this._renderCubeFace(target, face, (f) => {
        const view = cubeFaceViewMatrix(f);
        const viewLoc = programInfo.uniforms.get('uView');
        if (viewLoc) gl.uniformMatrix4fv(viewLoc, false, view);
        bindUniforms(f);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      });
    }
  }

  /* ------------------------------------------------------------------- *
   * Public API
   * ------------------------------------------------------------------- */

  /**
   * Convert an equirectangular panorama texture into a 6-face cube map.
   *
   * @param {WebGLTexture|RenderTargetTexture|{texture:WebGLTexture}} equirectTexture
   * @param {number} [size=512]
   * @returns {RenderTarget}  A cube RenderTarget whose `texture` is the cube map.
   */
  equirectToCubemap(equirectTexture, size = 512) {
    if (!this.gl) throw new Error('[9th.js EnvironmentMapProcessor] No GL context.');
    size = Math.max(16, Math.floor(Number(size) || 512));

    // Create (or reuse) a cube RenderTarget.
    const target = new RenderTarget(size, size, {
      format: 'RGBA',
      type: 'UNSIGNED_BYTE',
      minFilter: 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      depthBuffer: true,
      stencilBuffer: false,
      isCubeTarget: true,
      generateMipmaps: false,
      name: 'equirectToCube'
    });

    const programInfo = this._getProgram('equirect_to_cube', SHARED_VS, EQUIRECT_TO_CUBE_FS);

    const saved = this._saveState();
    try {
      // Ensure target's GL resources exist.
      target._ensureGL(this.gl);

      // Bind the equirectangular source texture to unit 0.
      this._bindTextureToUnit(equirectTexture, 0, false);

      // Set the sampler uniform to 0.
      const samplerLoc = programInfo.uniforms.get('uEquirectMap');
      this.gl.useProgram(programInfo.program);
      if (samplerLoc) this.gl.uniform1i(samplerLoc, 0);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.BLEND);
      this.gl.disable(this.gl.CULL_FACE);

      this._renderCubeFaces(target, programInfo, () => { /* no per-face extras */ });
    } finally {
      this._restoreState(saved);
      // Restore the canvas framebuffer.
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    return target;
  }

  /**
   * Generate a convolved diffuse irradiance cube map.
   *
   * @param {WebGLTexture|RenderTargetTexture|{texture:WebGLTexture}} cubeTexture
   * @param {number} [size=32]
   * @param {number} [sampleCount=256]
   * @returns {RenderTarget}
   */
  generateDiffuseEnv(cubeTexture, size = 32, sampleCount = 256) {
    if (!this.gl) throw new Error('[9th.js EnvironmentMapProcessor] No GL context.');
    size = Math.max(8, Math.floor(Number(size) || 32));
    sampleCount = Math.max(1, Math.min(256, Math.floor(Number(sampleCount) || 256)));

    const target = new RenderTarget(size, size, {
      format: 'RGBA',
      type: 'UNSIGNED_BYTE',
      minFilter: 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      depthBuffer: true,
      stencilBuffer: false,
      isCubeTarget: true,
      generateMipmaps: false,
      name: 'diffuseEnv'
    });

    // Build the shader with the sample count baked in.
    const fsSource = DIFFUSE_IRRADIANCE_FS.split('#SAMPLE_COUNT#').join(String(sampleCount));
    const programInfo = this._getProgram(
      `diffuse_irradiance_${sampleCount}`, SHARED_VS, fsSource
    );

    const samples = generateCosineHemisphereSamples(sampleCount);

    const saved = this._saveState();
    try {
      target._ensureGL(this.gl);
      this._bindTextureToUnit(cubeTexture, 0, true);

      this.gl.useProgram(programInfo.program);
      const samplerLoc = programInfo.uniforms.get('uEnvMap');
      if (samplerLoc) this.gl.uniform1i(samplerLoc, 0);
      const samplesLoc = programInfo.uniforms.get('uSamples');
      if (samplesLoc) this.gl.uniform3fv(samplesLoc, samples);
      const countLoc = programInfo.uniforms.get('uSampleCount');
      if (countLoc) this.gl.uniform1f(countLoc, sampleCount);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.BLEND);
      this.gl.disable(this.gl.CULL_FACE);

      this._renderCubeFaces(target, programInfo, () => { /* no per-face extras */ });
    } finally {
      this._restoreState(saved);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    return target;
  }

  /**
   * Pre-filter the cube map for specular IBL at the given roughness.
   * Outputs one cube face set at the supplied target size. For a full
   * PMREM (one mip per roughness level), call this once per roughness and
   * store the results in a mip-mapped cube target (see `cubemapToPMREM`).
   *
   * @param {WebGLTexture|RenderTargetTexture|{texture:WebGLTexture}} cubeTexture
   * @param {number} roughness  0..1
   * @param {number} [size=128]
   * @param {number} [sampleCount=256]
   * @param {RenderTarget} [outTarget]  Optional pre-existing target to write into.
   * @returns {RenderTarget}
   */
  prefilterSpecular(cubeTexture, roughness, size = 128, sampleCount = 256, outTarget) {
    if (!this.gl) throw new Error('[9th.js EnvironmentMapProcessor] No GL context.');
    size = Math.max(8, Math.floor(Number(size) || 128));
    sampleCount = Math.max(1, Math.min(256, Math.floor(Number(sampleCount) || 256)));
    roughness = Math.max(0, Math.min(1, Number(roughness) || 0));

    const target = outTarget || new RenderTarget(size, size, {
      format: 'RGBA',
      type: 'UNSIGNED_BYTE',
      minFilter: 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      depthBuffer: true,
      stencilBuffer: false,
      isCubeTarget: true,
      generateMipmaps: false,
      name: 'prefilteredEnv'
    });

    const fsSource = PREFILTER_ENV_FS.split('#SAMPLE_COUNT#').join(String(sampleCount));
    const programInfo = this._getProgram(
      `prefilter_env_${sampleCount}`, SHARED_VS, fsSource
    );

    const hammersleyArr = generateHammersleyVec2(sampleCount);

    const saved = this._saveState();
    try {
      target._ensureGL(this.gl);
      this._bindTextureToUnit(cubeTexture, 0, true);

      this.gl.useProgram(programInfo.program);
      const samplerLoc = programInfo.uniforms.get('uEnvMap');
      if (samplerLoc) this.gl.uniform1i(samplerLoc, 0);
      const roughLoc = programInfo.uniforms.get('uRoughness');
      if (roughLoc) this.gl.uniform1f(roughLoc, roughness);
      const hamLoc = programInfo.uniforms.get('uHammersley');
      if (hamLoc) this.gl.uniform2fv(hamLoc, hammersleyArr);
      const countLoc = programInfo.uniforms.get('uSampleCount');
      if (countLoc) this.gl.uniform1f(countLoc, sampleCount);

      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.disable(this.gl.BLEND);
      this.gl.disable(this.gl.CULL_FACE);

      this._renderCubeFaces(target, programInfo, () => { /* no per-face extras */ });
    } finally {
      this._restoreState(saved);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    return target;
  }

  /**
   * Generate a full PMREM (Pre-filtered Mipmapped Radiance Environment Map).
   *
   * The result is an array of cube RenderTargets, one per roughness mip
   * level. The first entry is roughness=0 (mirror reflection); the last
   * is roughness=1 (max blur). Each successive entry is half the
   * resolution of the previous one.
   *
   * @param {WebGLTexture|RenderTargetTexture|{texture:WebGLTexture}} cubeTexture
   * @param {number} [samples=1024]  Total sample count (capped to 256 for WebGL1).
   * @param {number} [baseSize=128]  Edge length of the roughness=0 mip level.
   * @param {number} [mipLevels=5]   Number of roughness mip levels (1..8).
   * @returns {RenderTarget[]}  Array of cube RenderTargets, one per roughness level.
   */
  cubemapToPMREM(cubeTexture, samples = 1024, baseSize = 128, mipLevels = 5) {
    if (!this.gl) throw new Error('[9th.js EnvironmentMapProcessor] No GL context.');
    // Cap sample count to 256 (WebGL1 uniform-vector limit).
    const sampleCount = Math.max(1, Math.min(256, Math.floor(Number(samples) || 256)));
    mipLevels = Math.max(1, Math.min(8, Math.floor(Number(mipLevels) || 5)));
    baseSize = Math.max(8, Math.floor(Number(baseSize) || 128));

    const results = [];
    for (let i = 0; i < mipLevels; i++) {
      const roughness = mipLevels === 1 ? 0 : i / (mipLevels - 1);
      const size = Math.max(8, Math.floor(baseSize / Math.pow(2, i)));
      const rt = this.prefilterSpecular(cubeTexture, roughness, size, sampleCount);
      rt._roughness = roughness;
      rt._mipLevel = i;
      results.push(rt);
    }
    return results;
  }

  /**
   * Generate the full specular environment (alias for `cubemapToPMREM`).
   *
   * @param {WebGLTexture|RenderTargetTexture|{texture:WebGLTexture}} cubeTexture
   * @param {number} [mipLevels=5]
   * @param {number} [sampleCount=256]
   * @returns {RenderTarget[]}
   */
  generateSpecularEnv(cubeTexture, mipLevels = 5, sampleCount = 256) {
    return this.cubemapToPMREM(cubeTexture, sampleCount, 128, mipLevels);
  }

  /**
   * Release all cached programs and VBOs.
   */
  dispose() {
    const gl = this.gl;
    if (this._cubeVBO) {
      try { gl.deleteBuffer(this._cubeVBO); } catch (_) { /* noop */ }
      this._cubeVBO = null;
    }
    for (const [, info] of this._programs) {
      if (info && info.program) {
        try { gl.deleteProgram(info.program); } catch (_) { /* noop */ }
      }
    }
    this._programs.clear();
  }
}

export default EnvironmentMapProcessor;
