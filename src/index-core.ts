/**
 * 9th.js Core Build - Essential functionality only
 * 
 * This is a minimal entry point for the core build (~150KB)
 * Contains only the most essential 3D graphics functionality
 */

// Core engine exports
export * from './core/index.js';
export * from './core/engine.js';
export * from './core/scene.js';
export * from './core/renderer.js';
export * from './core/mesh.js';
export * from './core/material.js';
export * from './core/buffer-geometry.js';

// Essential geometry exports
export * from './geometry/index.js';

// Basic material exports
export * from './materials/index.js';

// Camera system exports
export * from './cameras/index.js';

// Basic texture exports
export * from './textures/index.js';

// WebGL utilities
export * from './core/webgl-utils.js';

// Re-export essential classes
export { WebGLRenderer, Scene, Camera, Mesh } from './core/index.js';
export { BoxGeometry, SphereGeometry, PlaneGeometry } from './geometry/index.js';
export { MeshBasicMaterial } from './materials/index.js';
export { PerspectiveCamera } from './cameras/index.js';

// Core build information
export const BUILD_INFO = {
  type: 'core',
  version: '0.1.0',
  size: '~150KB',
  features: [
    'WebGL 1.0/2.0 Support',
    'Basic 3D Rendering',
    'Simple Materials',
    'Essential Geometry',
    'Camera Controls',
    'Texture Support'
  ]
};

// Core factory functions
export const createRenderer = async (canvas: HTMLCanvasElement, options?: any) => {
  const { WebGLRenderer } = await import('./core/renderer.js');
  return new WebGLRenderer({ canvas, ...options });
};

export const createScene = async () => {
  const { Scene } = await import('./core/scene.js');
  return new Scene();
};

export const createCamera = async (width: number, height: number, fov: number = 75) => {
  const { PerspectiveCamera } = await import('./cameras/perspective.js');
  return new PerspectiveCamera(width, height, fov);
};

export const createBasicMesh = async (geometry: any, material: any) => {
  const { Mesh } = await import('./core/mesh.js');
  return new Mesh(geometry, material);
};

// Core configuration
export const config = {
  build: 'core',
  webgl1: true,
  webgl2: true,
  pbr: false, // Not included in core
  postProcessing: false, // Not included in core
  physics: false, // Not included in core
  animation: false, // Not included in core
  loaders: false, // Not included in core
  debug: false
};