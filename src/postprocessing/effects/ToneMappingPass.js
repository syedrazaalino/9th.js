/**
 * ToneMappingPass — applies an HDR-to-LDR tone-mapping curve to the
 * input buffer, then performs gamma correction.
 *
 *   constructor({ mode = 'ACESFilmic', exposure = 1.0 })
 *
 * Supported modes:
 *   - 'ACESFilmic'   Narkowicz ACES approximation
 *   - 'Reinhard'     classic Reinhard
 *   - 'Reinhard2'    extended Reinhard with white point
 *   - 'Uncharted2'   Hable Uncharted 2
 *   - 'Linear'       no tonemap, just exposure + gamma
 *   - 'Gamma'        no tonemap, no exposure — gamma only
 *
 * Uniforms:
 *   tDiffuse : sampler2D
 *   exposure : float
 *   gamma    : float  (default 2.2)
 *   whitePoint : float (for Reinhard2; default 4.0)
 */

import { ShaderPass } from '../ShaderPass.js';

const TONE_MAPPING_MODES = new Set([
  'ACESFilmic', 'Reinhard', 'Reinhard2', 'Uncharted2', 'Linear', 'Gamma'
]);

// Each entry is a GLSL snippet that defines `vec3 toneMap(vec3 color)`.
const TONE_FRAGMENTS = {
  ACESFilmic: /* glsl */ `
    vec3 toneMap(vec3 color) {
      const float a = 2.51;
      const float b = 0.03;
      const float c = 2.43;
      const float d = 0.59;
      const float e = 0.14;
      return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
    }
  `,
  Reinhard: /* glsl */ `
    vec3 toneMap(vec3 color) {
      return color / (color + vec3(1.0));
    }
  `,
  Reinhard2: /* glsl */ `
    uniform float whitePoint;
    vec3 toneMap(vec3 color) {
      vec3 c = color * (1.0 + color / (whitePoint * whitePoint));
      return c / (1.0 + color);
    }
  `,
  Uncharted2: /* glsl */ `
    vec3 uncharted2Partial(vec3 x) {
      const float A = 0.15;
      const float B = 0.50;
      const float C = 0.10;
      const float D = 0.20;
      const float E = 0.02;
      const float F = 0.30;
      return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    }
    vec3 toneMap(vec3 color) {
      const float W = 11.2;
      vec3 c = uncharted2Partial(color);
      vec3 white = uncharted2Partial(vec3(W));
      return clamp(c / white, 0.0, 1.0);
    }
  `,
  Linear: /* glsl */ `
    vec3 toneMap(vec3 color) {
      return color;
    }
  `,
  Gamma: /* glsl */ `
    vec3 toneMap(vec3 color) {
      return color;
    }
  `
};

/**
 * Build the fragment shader source for a given tone-mapping mode.
 * @param {string} mode
 * @returns {string}
 */
function buildFragmentShader(mode) {
  if (!TONE_MAPPING_MODES.has(mode)) {
    throw new Error(`ToneMappingPass: unknown mode "${mode}"`);
  }
  const tonemapFn = TONE_FRAGMENTS[mode];
  const needsWhitePoint = mode === 'Reinhard2';
  const whitePointUniform = needsWhitePoint ? 'uniform float whitePoint;' : '';

  return /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float exposure;
    uniform float gamma;
    ${whitePointUniform}
    varying vec2 vUv;

    ${tonemapFn}

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 hdr = texel.rgb * exposure;
      vec3 mapped = toneMap(hdr);
      // Gamma correction.
      vec3 corrected = pow(max(mapped, vec3(0.0)), vec3(1.0 / gamma));
      gl_FragColor = vec4(corrected, texel.a);
    }
  `;
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export class ToneMappingPass extends ShaderPass {
  /**
   * @param {Object} [options]
   * @param {string} [options.mode='ACESFilmic']
   * @param {number} [options.exposure=1.0]
   * @param {number} [options.gamma=2.2]
   * @param {number} [options.whitePoint=4.0]  Used only by Reinhard2.
   */
  constructor(options = {}) {
    const mode = options.mode || 'ACESFilmic';
    if (!TONE_MAPPING_MODES.has(mode)) {
      throw new Error(`ToneMappingPass: unknown mode "${mode}"`);
    }

    const exposure   = options.exposure   !== undefined ? options.exposure   : 1.0;
    const gamma      = options.gamma      !== undefined ? options.gamma      : 2.2;
    const whitePoint = options.whitePoint !== undefined ? options.whitePoint : 4.0;

    super({
      uniforms: {
        tDiffuse:    { value: null },
        exposure:    { value: exposure },
        gamma:       { value: gamma },
        whitePoint:  { value: whitePoint }
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: buildFragmentShader(mode)
    }, 'tDiffuse');

    this._mode = mode;
  }

  get mode() { return this._mode; }

  get exposure() { return this.uniforms.exposure.value; }
  set exposure(v) { this.uniforms.exposure.value = v; }

  get gamma() { return this.uniforms.gamma.value; }
  set gamma(v) { this.uniforms.gamma.value = v; }

  get whitePoint() { return this.uniforms.whitePoint.value; }
  set whitePoint(v) { this.uniforms.whitePoint.value = v; }

  /**
   * Change the tone-mapping mode at runtime. Recompiles the fragment shader.
   * @param {string} mode
   */
  setMode(mode) {
    if (!TONE_MAPPING_MODES.has(mode)) {
      throw new Error(`ToneMappingPass: unknown mode "${mode}"`);
    }
    if (mode === this._mode) return;
    this._mode = mode;

    // Rebuild the shader def and reset ShaderPass state.
    this._shaderDef = {
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: buildFragmentShader(mode)
    };
    // Force recompile on next render.
    this._programInfo = null;
    this._materialProgramInfo = null;
  }
}

export { TONE_MAPPING_MODES, buildFragmentShader as ToneMappingShaderBuilder };
export default ToneMappingPass;
