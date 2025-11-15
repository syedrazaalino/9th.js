/**
 * 9th.js Experimental Features Module
 * 
 * Contains experimental and bleeding-edge features
 * May have breaking changes and unstable APIs
 */

// Experimental rendering features
export * from './experiments/HDRRendering.js';
export * from './experiments/RealTimeGI.js';
export * from './experiments/VolumetricLighting.js';
export * from './experiments/AtmosphericScattering.js';

// Experimental physics integration
export * from './experiments/PhysicsIntegration.js';
export * from './experiments/ClothSimulation.js';
export * from './experiments/FluidDynamics.js';

// Experimental shader features
export * from './experiments/ComputeShaders.js';
export * from './experiments/RayTracing.js';
export * from './experiments/PathTracing.js';

// Experimental materials
export * from './experiments/Nanite.js';
export * from './experiments/VirtualTexturing.js';

// Experimental performance features
export * from './experiments/AsyncRendering.js';
export * from './experiments/GPUCulling.js';

export const EXPERIMENTAL_FEATURES = {
  name: '9th.js Experimental',
  version: '0.1.0',
  stability: 'unstable',
  description: 'Experimental features that may change or be removed',
  features: [
    'Advanced Rendering',
    'Real-time Global Illumination', 
    'Volumetric Lighting',
    'Physics Integration',
    'Cloth Simulation',
    'Fluid Dynamics',
    'Compute Shaders',
    'Ray Tracing',
    'Path Tracing',
    'Nanite Virtualized Geometry',
    'Virtual Texturing',
    'Async Rendering',
    'GPU-based Culling'
  ],
  warnings: [
    'These features are experimental',
    'APIs may change without notice',
    'Performance characteristics may vary',
    'May require WebGL 2.0+ features'
  ]
};

export const enableExperimentalFeature = (featureName: string) => {
  const available = EXPERIMENTAL_FEATURES.features.includes(featureName);
  if (!available) {
    console.warn(`Experimental feature "${featureName}" is not available`);
    return false;
  }
  console.warn(`Enabling experimental feature: ${featureName}`);
  return true;
};