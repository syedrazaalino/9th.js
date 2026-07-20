/**
 * VignettePass — darkens the corners of the image, simulating the natural
 * light falloff of a real lens. Single-pass fullscreen shader.
 *
 *   constructor({ darkness = 0.5, offset = 1.0 })
 *
 * Uniforms:
 *   tDiffuse  : sampler2D  (input)
 *   darkness  : float      (0 = no vignette, 1 = black corners)
 *   offset    : float      (controls where the falloff begins; higher = tighter)
 */

import { ShaderPass } from '../ShaderPass.js';

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    darkness: { value: 0.5 },
    offset:   { value: 1.0 }
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
    uniform float darkness;
    uniform float offset;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = clamp(1.0 - dot(uv, uv), 0.0, 1.0);
      vignette = pow(vignette, darkness);
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `
};

export class VignettePass extends ShaderPass {
  /**
   * @param {Object} [options]
   * @param {number} [options.darkness=0.5]
   * @param {number} [options.offset=1.0]
   */
  constructor(options = {}) {
    const darkness = options.darkness !== undefined ? options.darkness : 0.5;
    const offset   = options.offset   !== undefined ? options.offset   : 1.0;

    super({
      uniforms: {
        tDiffuse: { value: null },
        darkness: { value: darkness },
        offset:   { value: offset }
      },
      vertexShader: VignetteShader.vertexShader,
      fragmentShader: VignetteShader.fragmentShader
    }, 'tDiffuse');
  }

  get darkness() { return this.uniforms.darkness.value; }
  set darkness(v) { this.uniforms.darkness.value = v; }

  get offset() { return this.uniforms.offset.value; }
  set offset(v) { this.uniforms.offset.value = v; }
}

export { VignetteShader };
export default VignettePass;
