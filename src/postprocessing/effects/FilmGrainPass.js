/**
 * FilmGrainPass — animated procedural noise overlay, simulating
 * photographic film grain.
 *
 *   constructor({ amount = 0.5, speed = 1.0 })
 *
 * Uniforms:
 *   tDiffuse : sampler2D
 *   amount   : float      0..1 strength of the grain
 *   speed    : float      animation speed (cycles per second)
 *   time     : float      accumulated time in seconds (updated by composer)
 *
 * The grain pattern is generated with a hash-based value-noise function
 * inside the fragment shader so no extra textures are required.
 */

import { ShaderPass } from '../ShaderPass.js';

const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount:   { value: 0.5 },
    speed:    { value: 1.0 },
    time:     { value: 0.0 },
    resolution: { value: [1, 1] }
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
    uniform float speed;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;

    // Hash-based value noise (no texture lookups needed).
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Animated per-pixel noise. Sample at a coarser grid for a more
      // filmic "clump" look, and use the time uniform to animate.
      float t = time * speed;
      vec2 grainUV = vUv * resolution * 0.5;
      float grain = hash(grainUV + vec2(t, -t * 0.5));
      // Center around 0.5 and remap to [-0.5, +0.5] for additive noise.
      grain = (grain - 0.5);

      // Mix the noise in additively, scaled by amount.
      vec3 color = texel.rgb + grain * amount;
      gl_FragColor = vec4(color, texel.a);
    }
  `
};

export class FilmGrainPass extends ShaderPass {
  /**
   * @param {Object} [options]
   * @param {number} [options.amount=0.5]
   * @param {number} [options.speed=1.0]
   */
  constructor(options = {}) {
    const amount = options.amount !== undefined ? options.amount : 0.5;
    const speed  = options.speed  !== undefined ? options.speed  : 1.0;

    super({
      uniforms: {
        tDiffuse:   { value: null },
        amount:     { value: amount },
        speed:      { value: speed },
        time:       { value: 0.0 },
        resolution: { value: [1, 1] }
      },
      vertexShader: FilmGrainShader.vertexShader,
      fragmentShader: FilmGrainShader.fragmentShader
    }, 'tDiffuse');

    this._accumulatedTime = 0;
  }

  get amount() { return this.uniforms.amount.value; }
  set amount(v) { this.uniforms.amount.value = v; }

  get speed() { return this.uniforms.speed.value; }
  set speed(v) { this.uniforms.speed.value = v; }

  /**
   * Override render to advance the internal animation clock and push
   * the current time + resolution uniforms.
   */
  render(renderer, writeBuffer, readBuffer, deltaTime = 0) {
    this._accumulatedTime += deltaTime * 0.001;  // deltaTime in ms → seconds
    this.uniforms.time.value = this._accumulatedTime;

    if (readBuffer) {
      this.uniforms.resolution.value = [readBuffer.width, readBuffer.height];
    } else if (renderer.canvas) {
      this.uniforms.resolution.value = [renderer.canvas.width, renderer.canvas.height];
    }

    super.render(renderer, writeBuffer, readBuffer, deltaTime);
  }
}

export { FilmGrainShader };
export default FilmGrainPass;
