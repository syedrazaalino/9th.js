/**
 * 9th.js - A modern 3D JavaScript library
 * 
 * Main entry point for the 9th.js library
 * Exports all core functionality from different modules with proper module resolution
 */

// Core system exports
export * from './core/index.js';

// Geometry exports
export * from './geometry/index.js';

// Material system exports
export * from './materials/index.js';

// Camera system exports
export * from './cameras/index.js';
export * from './cameras/PerspectiveCamera.js';
export * from './cameras/OrthographicCamera.js';

// Controls exports
export * from './controls/index.js';

// Lighting system exports
export * from './lights/index.js';
export * from './lights/DirectionalLight.js';
export * from './lights/PointLight.js';
export * from './lights/AmbientLight.js';

// Rendering system exports
export * from './rendering/index.js';

// Loader exports
export * from './loaders/index.js';

// Animation system exports
export * from './animation/index.js';

// Extras and utilities exports
export * from './extras/index.ts';

// Particle system exports
export * from './particles/index.js';

// Texture and texture compression exports
export * from './textures/index.js';
export * from './TextureCompression.js';

// Re-export commonly used classes and types for convenience
export { WebGLRenderer, Scene, Camera, Mesh } from './core/index.js';
export { BoxGeometry, SphereGeometry, PlaneGeometry } from './geometry/index.js';
export { DirectionalLight, PointLight, AmbientLight } from './lights/index.js';

// Import for use in factory functions
import { WebGLRenderer, Scene, Camera, Mesh } from './core/index.js';

// Version information following semantic versioning
export const VERSION = '0.1.0';

// Library metadata information
export const LIBRARY_INFO = {
  name: '9th.js',
  version: VERSION,
  description: 'A modern 3D JavaScript library for creating interactive graphics and visualizations',
  homepage: 'https://github.com/username/9th.js',
  repository: 'https://github.com/username/9th.js.git',
  keywords: ['3d', 'graphics', 'webgl', 'visualization', 'javascript', 'typescript']
};

// Utility factory functions for common use cases
export const createRenderer = (canvas, options) => {
  // Factory function for creating a WebGL renderer
  return new WebGLRenderer({ canvas, ...options });
};

export const createScene = () => {
  // Factory function for creating a new scene
  return new Scene();
};

export const createCamera = (width, height, fov = 75) => {
  // Factory function for creating a perspective camera
  return new Camera(width, height, fov);
};

export const createBasicMesh = (geometry, material) => {
  // Factory function for creating a basic mesh
  return new Mesh(geometry, material);
};

// Performance monitoring utilities
export const enablePerformanceMonitoring = () => {
  if (typeof window !== 'undefined' && window.performance) {
    console.log('9th.js performance monitoring enabled');
    // Initialize performance monitoring here
  }
};

export const getPerformanceStats = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const timing = window.performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart
    };
  }
  return null;
};

// Global configuration
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

// No default export - only named exports for UMD compatibility