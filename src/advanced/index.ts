/**
 * 9th.js Advanced Features Module
 * 
 * Contains advanced features that are production-ready
 * but may have higher performance requirements
 */

// Advanced rendering techniques
export * from './advanced/PBRRendering.js';
export * from './advanced/ShadowMapping.js';
export * from './advanced/PostProcessing.js';
export * from './advanced/ScreenSpaceReflections.js';
export * from './advanced/DepthOfField.js';
export * from './advanced/Bloom.js';

// Advanced geometry processing
export * from './advanced/GeometryOptimization.js';
export * from './advanced/MeshMerging.js';
export * from './advanced/LODSystem.js';
export * from './advanced/FrustumCulling.js';
export * from './advanced/PortalCulling.js';

// Advanced materials and shaders
export * from './advanced/CustomShaders.js';
export * from './advanced/MaterialBlending.js';
export * from './advanced/DisplacementMapping.js';
export * from './advanced/SubsurfaceScattering.js';
export * from './advanced/Iridescence.js';

// Advanced lighting
export * from './advanced/LightProbes.js';
export * from './advanced/EnvironmentMapping.js';
export * from './advanced/SpotLightShadows.js';
export * from './advanced/CookieTextures.js';

// Advanced animation and physics
export * from './advanced/SkeletalAnimation.js';
export * from './advanced/Physics.js';
export * from './advanced/RigidBodies.js';
export * from './advanced/Constraints.js';

export const ADVANCED_FEATURES = {
  name: '9th.js Advanced',
  version: '0.1.0',
  stability: 'stable',
  description: 'Advanced production-ready features',
  features: [
    'PBR Rendering Pipeline',
    'Advanced Shadow Mapping',
    'Post-Processing Effects',
    'Screen Space Reflections',
    'Depth of Field',
    'Bloom Effects',
    'Geometry Optimization',
    'Level of Detail (LOD)',
    'Advanced Culling',
    'Custom Shader Support',
    'Advanced Material Blending',
    'Displacement Mapping',
    'Subsurface Scattering',
    'Light Probes',
    'Skeletal Animation',
    'Physics Integration'
  ],
  requirements: {
    webgl2: true,
    performance: 'high',
    memory: 'high'
  },
  compatibility: {
    webgl1: 'limited',
    webgl2: 'full'
  }
};

export const isAdvancedFeatureSupported = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  
  if (!gl) {
    console.warn('WebGL 2.0 not supported. Some advanced features may not work.');
    return false;
  }
  
  // Check for specific extensions
  const requiredExtensions = [
    'EXT_color_buffer_float',
    'EXT_texture_filter_anisotropic'
  ];
  
  const supportedExtensions = requiredExtensions.every(ext => 
    gl.getExtension(ext) !== null
  );
  
  if (!supportedExtensions) {
    console.warn('Required WebGL extensions not supported for advanced features.');
    return false;
  }
  
  return true;
};