/**
 * 9th.js - A modern 3D JavaScript library
 *
 * Main entry point for the 9th.js library.
 * Keep in sync with src/index.js.
 */

// Re-export everything from each subsystem
export * from './core/index.js';
export * from './geometry/index.js';
export * from './materials/index.js';
export * from './cameras/index.js';
export * from './controls/index.js';
export * from './lights/index.js';
export * from './rendering/index.js';
export * from './loaders/index.js';
export * from './animation/index.js';
export * from './extras/index.js';
export * from './particles/index.js';
export * from './textures/index.js';
export * from './TextureCompression.js';
export * from './utils/index.js';
export * from './tween/index.js';
export * from './postprocessing/index.js';
export * from './webgpu/index.js';
export * from './game/index.js';

// Convenience: import & re-export the most commonly used classes so
// `import { WebGLRenderer, Scene, Mesh, ... } from '9th.js'` works directly
import { WebGLRenderer, Scene, Camera, Mesh, Engine, BufferGeometry } from './core/index.js';
import { BoxGeometry, SphereGeometry, PlaneGeometry } from './geometry/index.js';
import { DirectionalLight, PointLight, AmbientLight, SpotLight } from './lights/index.js';
import { PerspectiveCamera, OrthographicCamera } from './cameras/index.js';
import { OrbitControls } from './controls/index.js';
import { MeshBasicMaterial, MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial, MeshPhysicalMaterial } from './materials/index.js';
import { WebGPURenderer, isWebGPUSupported } from './webgpu/index.js';

export {
  WebGLRenderer, Scene, Camera, Mesh, Engine, BufferGeometry,
  BoxGeometry, SphereGeometry, PlaneGeometry,
  DirectionalLight, PointLight, AmbientLight, SpotLight,
  PerspectiveCamera, OrthographicCamera,
  OrbitControls,
  MeshBasicMaterial, MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial, MeshPhysicalMaterial
};

// Aliases for Three.js-familiar users
export { WebGLRenderer as Renderer };
export { MeshStandardMaterial as StandardMaterial };
export { MeshBasicMaterial as BasicMaterial };

// Version & metadata — stay on 1.x until public API is intentionally broken
export const VERSION = '1.0.7';

export const LIBRARY_INFO = {
  name: '9th.js',
  version: VERSION,
  description: 'WebGL 3D library for interactive scenes — scene graph, materials, lights, loaders, post-processing, and more',
  homepage: 'https://github.com/syedrazaalino/9th.js',
  repository: 'https://github.com/syedrazaalino/9th.js.git',
  keywords: ['3d', 'graphics', 'webgl', 'webgl2', 'visualization', 'javascript', 'typescript', 'gltf', 'pbr', 'post-processing', 'game-engine']
};

// Factories — Three.js-friendly shorthand
//
// `createRenderer(canvas, options)`:
//   - When `options.preferWebGPU` is true (or any truthy), returns a Promise
//     that resolves to a WebGPURenderer (async init) if WebGPU is available,
//     or falls back to a synchronous WebGLRenderer otherwise.
//   - When `options.preferWebGPU` is absent/false, returns a synchronous
//     WebGLRenderer (backward-compatible with prior releases).
export function createRenderer(canvas, options = {}) {
  if (options && options.preferWebGPU) {
    return (async () => {
      let webgpuOk = false;
      try {
        webgpuOk = await isWebGPUSupported({ powerPreference: options.powerPreference || 'high-performance' });
      } catch (_) {
        webgpuOk = false;
      }
      if (webgpuOk) {
        const renderer = new WebGPURenderer(canvas, options);
        await renderer.init();
        return renderer;
      }
      if (typeof console !== 'undefined') {
        console.warn('[9th.js createRenderer] WebGPU requested but unavailable — falling back to WebGLRenderer.');
      }
      return new WebGLRenderer({ canvas, ...options });
    })();
  }
  return new WebGLRenderer({ canvas, ...options });
}
export const createScene = () => new Scene();
export const createCamera = (fov = 75, aspect = 1, near = 0.1, far = 1000) => new PerspectiveCamera(fov, aspect, near, far);
export const createBasicMesh = (geometry, material) => new Mesh(geometry, material);
export const createEngine = (canvas, options) => new Engine(canvas, options);

// Global configuration (mutable at runtime)
export const config = {
  debug: false,
  strictMode: false,
  performanceMonitoring: false,
  maxTextureSize: 4096,
  antialias: true
};

export const setConfig = (newConfig) => {
  Object.assign(config, newConfig);
};
