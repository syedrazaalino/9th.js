/**
 * 9th.js - A modern 3D JavaScript library
 *
 * Main entry point for the 9th.js library
 */

export * from './core/index.js';
export * from './geometry/index.js';
export * from './materials/index.js';
export * from './cameras/index.js';
export * from './cameras/PerspectiveCamera.js';
export * from './cameras/OrthographicCamera.js';
export * from './controls/index.js';
export * from './lights/index.js';
export * from './lights/DirectionalLight.js';
export * from './lights/PointLight.js';
export * from './lights/AmbientLight.js';
export * from './rendering/index.js';
export * from './loaders/index.js';
export * from './animation/index.js';
export * from './extras/index.ts';
export * from './particles/index.js';
export * from './textures/index.js';
export * from './TextureCompression.js';

export { WebGLRenderer, Scene, Camera, Mesh, Engine, BufferGeometry } from './core/index.js';
export { WebGLRenderer as Renderer } from './core/WebGLRenderer.js';
export { BoxGeometry, SphereGeometry, PlaneGeometry } from './geometry/index.js';
export { DirectionalLight, PointLight, AmbientLight } from './lights/index.js';
export { PerspectiveCamera } from './cameras/PerspectiveCamera.js';
export { OrthographicCamera } from './cameras/OrthographicCamera.js';
export { OrbitControls } from './controls/index.js';
export { MeshBasicMaterial, MeshStandardMaterial } from './materials/index.js';

import { WebGLRenderer, Scene, Camera, Mesh, Engine } from './core/index.js';
import { PerspectiveCamera } from './cameras/PerspectiveCamera.js';

export const VERSION = '1.0.0';

export const LIBRARY_INFO = {
  name: '9th.js',
  version: VERSION,
  description: 'A modern 3D JavaScript library for creating interactive graphics and visualizations',
  homepage: 'https://github.com/syedrazaalino/9th.js',
  repository: 'https://github.com/syedrazaalino/9th.js.git',
  keywords: ['3d', 'graphics', 'webgl', 'visualization', 'javascript', 'typescript', 'three.js']
};

export const createRenderer = (canvas, options) => {
  return new WebGLRenderer({ canvas, ...options });
};

export const createScene = () => new Scene();

export const createCamera = (fov = 75, aspect = 1, near = 0.1, far = 1000) => {
  return new PerspectiveCamera(fov, aspect, near, far);
};

export const createBasicMesh = (geometry, material) => {
  return new Mesh(geometry, material);
};

export const createEngine = (canvas, options) => {
  return new Engine(canvas, options);
};

export const config = {
  debug: false,
  strictMode: true,
  performanceMonitoring: false,
  maxTextureSize: 4096,
  antialias: true
};

export const setConfig = (newConfig) => {
  Object.assign(config, newConfig);
};
