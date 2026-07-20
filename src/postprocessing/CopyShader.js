/**
 * CopyShader — a minimal fullscreen shader that simply samples the input
 * texture (`tDiffuse`) and outputs it unchanged. Used as a fallback by
 * ShaderPass when no other shader is provided, and as the building block
 * for ping-pong "blit" operations in the EffectComposer pipeline.
 *
 * GLSL ES 1.00 (attribute/varying/texture2D/gl_FragColor) to match the
 * existing 9th.js materials.
 */

export const CopyShader = {
  uniforms: {
    tDiffuse: { value: null },
    opacity: { value: 1.0 }
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
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(texel.rgb, texel.a * opacity);
    }
  `
};

export default CopyShader;
