/**
 * 9th.js Extras Module
 *
 * Contains helpful utilities, helpers, and convenience functions
 * that enhance the core 9th.js functionality
 */

// Helper objects and functions
export * from './helpers.js';

// Import dependencies for helper functions
import { Scene } from '../core/Scene.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { DirectionalLight } from '../lights/DirectionalLight.js';
import { AmbientLight } from '../lights/AmbientLight.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';

// Extras configuration and utilities
export const EXTRAS_VERSION = '1.0.0';

export const extrasConfig = {
  version: EXTRAS_VERSION,
  enableDebugHelpers: false,
  enablePerformanceMonitoring: false,
  enableAutoOptimization: true,
  maxAssets: 1000,
  defaultTextureSize: 1024,
  defaultAntialias: true
};

export const setExtrasConfig = (config) => {
  Object.assign(extrasConfig, config);

  if (config.enableDebugHelpers) {
    console.info('Debug helpers enabled');
    enableDebugHelpers();
  }

  if (config.enablePerformanceMonitoring) {
    console.info('Performance monitoring enabled');
    enablePerformanceMonitoring();
  }
};

// Feature toggles
export const enableDebugHelpers = () => {
  console.log('9th.js Debug Helpers Enabled');
  extrasConfig.enableDebugHelpers = true;
  // Enable wireframe overlays, gizmos, etc. (pluggable via setDebugHelper)
};

export const enablePerformanceMonitoring = () => {
  console.log('9th.js Performance Monitoring Enabled');
  extrasConfig.enablePerformanceMonitoring = true;
  // Enable FPS counters, memory usage, etc.
};

export const disableDebugHelpers = () => {
  console.log('9th.js Debug Helpers Disabled');
  extrasConfig.enableDebugHelpers = false;
};

export const disablePerformanceMonitoring = () => {
  console.log('9th.js Performance Monitoring Disabled');
  extrasConfig.enablePerformanceMonitoring = false;
};

// Quick scene builders
export const createBasicScene = () => {
  const scene = new Scene();
  const aspect = (typeof window !== 'undefined') ? window.innerWidth / window.innerHeight : 1;
  const camera = new PerspectiveCamera(75, aspect, 0.1, 1000);

  const directionalLight = new DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  const ambientLight = new AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  camera.position.z = 5;

  return { scene, camera };
};

export const createDefaultRenderer = (canvas) => {
  return new WebGLRenderer({
    canvas,
    antialias: extrasConfig.defaultAntialias,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
  });
};
