/**
 * ChromaticAberrationPass — radial RGB channel separation, mimicking
 * lens dispersion. Strongest at the screen edges.
 *
 *   constructor({ amount = 0.005 })
 *
 * Uniforms:
 *   tDiffuse : sampler2D
 *   amount   : float    radial distortion magnitude
 *   center   : vec2     center of distortion (default [0.5, 0.5])
 */

import { ShaderPass } from '../ShaderPass.js';

const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount:   { value: 0.005 },
    center:   { value: [0.5, 0.5] }
  },

  vertexShader: /* glsl */ `
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform vec2 center;
    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - center;
      float dist = length(dir);

      // Channel-specific sample offsets scale with distance from center.
      vec2 offsetR = dir * amount * dist;
      vec2 offsetB = dir * amount * dist * -1.0;

      float r = texture2D(tDiffuse, vUv + offsetR).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + offsetB).b;
      float a = texture2D(tDiffuse, vUv).a;

      gl_FragColor = vec4(r, g, b, a);
    }
  `
};

export class ChromaticAberrationPass extends ShaderPass {
  /**
   * @param {Object} [options]
   * @param {number} [options.amount=0.005]
   * @param {[number,number]} [options.center=[0.5,0.5]]
   */
  constructor(options = {}) {
    const amount = options.amount !== undefined ? options.amount : 0.005;
    const center = options.center || [0.5, 0.5];

    super({
      uniforms: {
        tDiffuse: { value: null },
        amount:   { value: amount },
        center:   { value: center }
      },
      vertexShader: ChromaticAberrationShader.vertexShader,
      fragmentShader: ChromaticAberrationShader.fragmentShader
    }, 'tDiffuse');
  }

  get amount() { return this.uniforms.amount.value; }
  set amount(v) { this.uniforms.amount.value = v; }

  get center() { return this.uniforms.center.value; }
  set center(v) { this.uniforms.center.value = v; }
}

export { ChromaticAberrationShader };
export default ChromaticAberrationPass;
