/**
 * 9th.js post-processing module — Three.js-compatible EffectComposer pipeline.
 *
 *   import { EffectComposer, RenderPass, BloomPass, ToneMappingPass }
 *     from '9th.js';
 *
 *   const composer = new EffectComposer(renderer);
 *   composer.addPass(new RenderPass(scene, camera));
 *   composer.addPass(new BloomPass({ strength: 1.5, radius: 0.4, threshold: 0.85 }));
 *   composer.addPass(new ToneMappingPass({ mode: 'ACESFilmic' }));
 *   composer.render();  // call instead of renderer.render(scene, camera)
 */

// Core pipeline
export {
  EffectComposer,
  WebGLRenderTarget,
  Pass,
  compileProgram,
  setUniformValue,
  applyUniforms,
  createFullscreenQuad,
  bindFullscreenQuad,
  drawFullscreenQuad,
  renderFullscreenQuad
} from './EffectComposer.js';

// Passes
export { RenderPass } from './RenderPass.js';
export { ShaderPass } from './ShaderPass.js';
export { CopyShader } from './CopyShader.js';

// Effects
export { BloomPass, BloomShader } from './effects/BloomPass.js';
export { DepthOfFieldPass, DepthOfFieldShader } from './effects/DepthOfFieldPass.js';
export { SSAOPass, generateHemisphereKernel } from './effects/SSAOPass.js';
export { ChromaticAberrationPass, ChromaticAberrationShader } from './effects/ChromaticAberrationPass.js';
export { VignettePass, VignetteShader } from './effects/VignettePass.js';
export { FilmGrainPass, FilmGrainShader } from './effects/FilmGrainPass.js';
export { ToneMappingPass, TONE_MAPPING_MODES, ToneMappingShaderBuilder } from './effects/ToneMappingPass.js';

// Default export: the most-used class.
import { EffectComposer as _EffectComposer } from './EffectComposer.js';
export default _EffectComposer;
