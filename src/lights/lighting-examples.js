/**
 * Lighting System Example
 * Demonstrates the complete lighting infrastructure
 */

import { 
  LightManager,
  LightGroup,
  LightUniforms,
  LightType,
  createLightingSystem,
  applyLightingPreset,
  LightingPresets,
  LightingUtils
} from './index.js';

// Example 1: Basic Lighting Setup
export function basicLightingExample() {
  console.log('=== Basic Lighting Example ===');
  
  // Create light manager with default settings
  const manager = new LightManager({
    maxLights: 8,
    maxShadowMaps: 4,
    shadowEnabled: true,
    frustumCulling: true
  });
  
  // Create ambient light
  const ambientLight = manager.createLight(LightType.AMBIENT, {
    intensity: 0.3,
    color: '#404040'
  });
  
  // Create directional light (sun)
  const sunLight = manager.createLight(LightType.DIRECTIONAL, {
    intensity: 1.0,
    color: '#ffffff',
    castShadow: true,
    shadowBias: 0.0005
  });
  sunLight.setPosition(10, 10, 10);
  sunLight.setRotation(-Math.PI / 4, -Math.PI / 4, 0);
  
  // Create point light
  const pointLight = manager.createLight(LightType.POINT, {
    intensity: 1.0,
    color: '#ffffaa',
    position: { x: 5, y: 3, z: 5 },
    distance: 20,
    decay: 2,
    castShadow: true
  });
  
  console.log('Created lights:', {
    ambient: ambientLight.type,
    directional: sunLight.type,
    point: pointLight.type
  });
  
  return manager;
}

// Example 2: Using Lighting Presets
export function presetLightingExample() {
  console.log('=== Preset Lighting Example ===');
  
  const manager = new LightManager();
  
  // Apply indoor lighting preset
  applyLightingPreset(manager, 'indoor');
  
  // Get stats
  const stats = manager.getStats();
  console.log('Indoor preset stats:', stats);
  
  // Apply studio lighting preset
  applyLightingPreset(manager, 'studio');
  const studioStats = manager.getStats();
  console.log('Studio preset stats:', studioStats);
  
  return manager;
}

// Example 3: Light Grouping and Organization
export function lightGroupingExample() {
  console.log('=== Light Grouping Example ===');
  
  const manager = new LightManager();
  
  // Create different light groups
  const indoorGroup = new LightGroup('Indoor Lights');
  const outdoorGroup = new LightGroup('Outdoor Lights');
  const effectGroup = new LightGroup('Special Effects');
  
  // Add indoor lights
  const indoorAmbient = manager.createLight(LightType.AMBIENT, {
    intensity: 0.2,
    color: '#ffffff'
  });
  indoorGroup.add(indoorAmbient);
  
  const ceilingLight = manager.createLight(LightType.SPOT, {
    intensity: 1.5,
    color: '#ffffff',
    position: { x: 0, y: 4, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    angle: Math.PI / 3,
    castShadow: true
  });
  indoorGroup.add(ceilingLight);
  
  // Add outdoor lights
  const sunLight = manager.createLight(LightType.DIRECTIONAL, {
    intensity: 1.2,
    color: '#87ceeb',
    castShadow: true
  });
  outdoorGroup.add(sunLight);
  
  // Add effect lights
  const blueSpot = manager.createLight(LightType.SPOT, {
    intensity: 2.0,
    color: '#0080ff',
    position: { x: 0, y: 2, z: 0 },
    target: { x: 0, y: 0, z: -1 },
    angle: Math.PI / 8
  });
  effectGroup.add(blueSpot);
  
  // Add groups to manager
  manager.addGroup(indoorGroup);
  manager.addGroup(outdoorGroup);
  manager.addGroup(effectGroup);
  
  // Query lights by group
  const spotLights = indoorGroup.getSpotLights();
  const shadowCasters = manager.getShadowCasters();
  
  console.log('Indoor spot lights:', spotLights.length);
  console.log('All shadow casters:', shadowCasters.length);
  
  return { manager, groups: [indoorGroup, outdoorGroup, effectGroup] };
}

// Example 4: Performance Optimization
export function performanceOptimizationExample() {
  console.log('=== Performance Optimization Example ===');
  
  const manager = new LightManager({
    maxLights: 16,
    maxShadowMaps: 8,
    shadowEnabled: true,
    frustumCulling: true
  });
  
  // Create many lights for testing
  for (let i = 0; i < 12; i++) {
    const type = [LightType.POINT, LightType.SPOT, LightType.AMBIENT][i % 3];
    const light = manager.createLight(type, {
      intensity: 0.5 + Math.random() * 1.5,
      color: `hsl(${Math.random() * 360}, 70%, 80%)`,
      castShadow: i % 3 === 0, // Some cast shadows
      position: {
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 10,
        z: (Math.random() - 0.5) * 20
      }
    });
    
    if (light.position) {
      light.setPosition(
        (Math.random() - 0.5) * 20,
        Math.random() * 10,
        (Math.random() - 0.5) * 20
      );
    }
  }
  
  // Test performance with different optimization levels
  const budgets = ['low', 'medium', 'high', 'ultra'];
  
  budgets.forEach(budget => {
    console.log(`\nTesting ${budget} performance budget:`);
    
    // Reset lights
    manager.optimizeLights(budget);
    
    // Simulate update
    const startTime = performance.now();
    manager.update(0.016, null); // 60 FPS delta time
    const endTime = performance.now();
    
    const stats = manager.getStats();
    console.log(`  Active lights: ${stats.activeLights}`);
    console.log(`  Shadow casters: ${stats.shadowCasters}`);
    console.log(`  Update time: ${stats.updateTime.toFixed(2)}ms`);
  });
  
  return manager;
}

// Example 5: Shader Uniform Integration
export function shaderIntegrationExample() {
  console.log('=== Shader Integration Example ===');
  
  const manager = new LightManager();
  
  // Create various lights
  manager.createLight(LightType.AMBIENT, { intensity: 0.3, color: '#404040' });
  manager.createLight(LightType.DIRECTIONAL, { 
    intensity: 1.0, 
    color: '#ffffff', 
    castShadow: true 
  });
  manager.createLight(LightType.POINT, { 
    intensity: 1.0, 
    color: '#ffaa00', 
    position: { x: 5, y: 3, z: 5 } 
  });
  manager.createLight(LightType.SPOT, { 
    intensity: 1.5, 
    color: '#0080ff', 
    position: { x: -5, y: 4, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    angle: Math.PI / 6 
  });
  
  // Create light uniforms
  const uniforms = new LightUniforms(8);
  const activeLights = manager.getActiveLights();
  uniforms.updateFromLights(activeLights);
  
  // Get shader templates
  const shaderTemplate = uniforms.getUniformStructure();
  const glslTemplates = uniforms.getShaderTemplate();
  
  console.log('Shader uniform structure:', Object.keys(shaderTemplate));
  console.log('Vertex shader length:', glslTemplates.vertex.length);
  console.log('Fragment shader length:', glslTemplates.fragment.length);
  
  // Test light contribution calculations
  const surfacePoint = { x: 0, y: 0, z: 0 };
  const surfaceNormal = { x: 0, y: 1, z: 0 };
  const cameraPosition = { x: 5, y: 5, z: 5 };
  
  const lightContributions = activeLights.map(light => {
    return LightingUtils.getLightContribution(
      light, 
      surfaceNormal, 
      surfacePoint, 
      cameraPosition
    );
  });
  
  const blendedResult = LightingUtils.blendLights(lightContributions);
  
  console.log('Light contribution at surface:', {
    color: blendedResult.color,
    intensity: blendedResult.intensity
  });
  
  return { manager, uniforms, shaderTemplate };
}

// Example 6: Complete Lighting System
export function completeLightingSystemExample() {
  console.log('=== Complete Lighting System Example ===');
  
  // Create system with preset
  const lighting = createLightingSystem({
    maxLights: 10,
    mainDirectional: true
  });
  
  // Add environment lights
  const fillLight = lighting.createLight(LightType.POINT, {
    intensity: 0.5,
    color: '#87ceeb',
    position: { x: -10, y: 8, z: -10 },
    distance: 30
  });
  
  const rimLight = lighting.createLight(LightType.SPOT, {
    intensity: 1.5,
    color: '#ffffff',
    position: { x: 0, y: 5, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    angle: Math.PI / 4,
    castShadow: true
  });
  
  // Create light groups
  const environmentGroup = new LightGroup('Environment');
  environmentGroup.add(lighting.manager.getLightsByType(LightType.AMBIENT)[0]);
  environmentGroup.add(lighting.manager.getLightsByType(LightType.DIRECTIONAL)[0]);
  
  const accentGroup = new LightGroup('Accent Lights');
  accentGroup.add(fillLight);
  accentGroup.add(rimLight);
  
  // Add groups to manager
  lighting.manager.addGroup(environmentGroup);
  lighting.manager.addGroup(accentGroup);
  
  // Event handling
  lighting.manager.addEventListener('lightAdded', ({ light }) => {
    console.log(`✓ Light added: ${light.type}`);
  });
  
  lighting.manager.addEventListener('updated', ({ performance }) => {
    if (performance.updateTime > 2) {
      console.warn(`⚠ High update time: ${performance.updateTime.toFixed(2)}ms`);
    }
  });
  
  // Simulate frame updates
  for (let frame = 0; frame < 3; frame++) {
    console.log(`\n--- Frame ${frame + 1} ---`);
    
    // Update lighting system
    lighting.manager.update(0.016, null); // 60 FPS
    
    // Get current stats
    const stats = lighting.manager.getStats();
    console.log('Frame stats:', {
      totalLights: stats.totalLights,
      activeLights: stats.activeLights,
      shadowCasters: stats.shadowCasters,
      updateTime: stats.updateTime.toFixed(2) + 'ms'
    });
    
    // Get lights by type
    const ambientLights = lighting.manager.getLightsByType(LightType.AMBIENT);
    const directionalLights = lighting.manager.getLightsByType(LightType.DIRECTIONAL);
    const pointLights = lighting.manager.getLightsByType(LightType.POINT);
    const spotLights = lighting.manager.getLightsByType(LightType.SPOT);
    
    console.log('Light distribution:', {
      ambient: ambientLights.length,
      directional: directionalLights.length,
      point: pointLights.length,
      spot: spotLights.length
    });
  }
  
  return lighting;
}

// Run all examples
export function runAllExamples() {
  console.log('🎆 Lighting System Examples 🎆\n');
  
  try {
    basicLightingExample();
    console.log('');
    
    presetLightingExample();
    console.log('');
    
    lightGroupingExample();
    console.log('');
    
    performanceOptimizationExample();
    console.log('');
    
    shaderIntegrationExample();
    console.log('');
    
    completeLightingSystemExample();
    
    console.log('\n✨ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Auto-run if this file is executed directly
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  if (require.main === module) {
    runAllExamples();
  }
}
