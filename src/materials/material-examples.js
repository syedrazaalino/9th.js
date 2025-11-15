/**
 * Material System Example
 * Demonstrates usage of all material types
 */

import { 
  MeshBasicMaterial, 
  MeshLambertMaterial, 
  MeshPhongMaterial, 
  MeshStandardMaterial, 
  MeshPhysicalMaterial 
} from './materials/index.js';

/**
 * Example 1: Basic Material - UI Element
 * Unlit material perfect for UI elements and sprites
 */
function createBasicMaterialExample() {
  console.log('Creating MeshBasicMaterial example...');
  
  const basicMaterial = new MeshBasicMaterial({
    color: '#ff6b6b',      // Coral red
    opacity: 0.8,
    transparent: true,
    alphaTest: 0.1
  });
  
  // Change color dynamically
  setTimeout(() => {
    basicMaterial.setColor('#4ecdc4');  // Teal color
    console.log('BasicMaterial color changed to teal');
  }, 2000);
  
  // Animate opacity
  let opacity = 0.8;
  const opacityInterval = setInterval(() => {
    opacity += 0.05;
    if (opacity > 1.0) opacity = 0.8;
    basicMaterial.setOpacity(opacity);
  }, 100);
  
  return basicMaterial;
}

/**
 * Example 2: Lambert Material - Matte Surface
 * Perfect for matte painted surfaces and diffuse materials
 */
function createLambertMaterialExample() {
  console.log('Creating MeshLambertMaterial example...');
  
  const lambertMaterial = new MeshLambertMaterial({
    color: '#95e1d3',      // Mint green
    emissive: '#000000',   // No emission
    emissiveIntensity: 1.0,
    bumpScale: 0.05,
    lightMapIntensity: 1.0
  });
  
  // Set emissive color for glowing effect
  setTimeout(() => {
    lambertMaterial.setEmissive('#ff6b6b');
    lambertMaterial.setEmissiveIntensity(0.3);
    console.log('LambertMaterial emissive added');
  }, 3000);
  
  return lambertMaterial;
}

/**
 * Example 3: Phong Material - Glossy Plastic
 * Classic Phong shading for glossy materials
 */
function createPhongMaterialExample() {
  console.log('Creating MeshPhongMaterial example...');
  
  const phongMaterial = new MeshPhongMaterial({
    color: '#ffe66d',      // Soft yellow
    specular: '#ffffff',   // White highlights
    shininess: 80,         // Sharp highlights
    metalness: 0.0,        // Non-metallic
    roughness: 0.2         // Smooth surface
  });
  
  // Animate shininess for changing glossiness
  let shininess = 80;
  const shininessInterval = setInterval(() => {
    shininess = 30 + Math.sin(Date.now() * 0.003) * 70;
    phongMaterial.setShininess(shininess);
  }, 100);
  
  return phongMaterial;
}

/**
 * Example 4: Standard Material - PBR Metal
 * Physically-based rendering with metalness/roughness workflow
 */
function createStandardMaterialExample() {
  console.log('Creating MeshStandardMaterial example...');
  
  const standardMaterial = new MeshStandardMaterial({
    color: '#c0c0c0',      // Silver
    metalness: 1.0,        // Fully metallic
    roughness: 0.2,        // Slightly rough
    envMapIntensity: 1.0,
    aoMapIntensity: 1.0
  });
  
  // Animate roughness for changing reflectivity
  const roughnessInterval = setInterval(() => {
    const time = Date.now() * 0.001;
    const roughness = 0.1 + Math.abs(Math.sin(time)) * 0.3;
    standardMaterial.setRoughness(roughness);
  }, 100);
  
  return standardMaterial;
}

/**
 * Example 5: Physical Material - Glass/Crystal
 * Advanced PBR with transmission and refraction
 */
function createPhysicalMaterialExample() {
  console.log('Creating MeshPhysicalMaterial example...');
  
  const physicalMaterial = new MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0.0,        // Dielectric
    roughness: 0.0,        // Perfectly smooth
    transmission: 0.95,    // Highly transparent
    thickness: 2.0,        // Thick glass
    ior: 1.5,              // Glass IOR
    clearcoat: 1.0,        // Strong clearcoat
    clearcoatRoughness: 0.1
  });
  
  // Animate transmission for refractive effect
  const transmissionInterval = setInterval(() => {
    const time = Date.now() * 0.002;
    const transmission = 0.8 + Math.sin(time) * 0.15;
    physicalMaterial.setTransmission(transmission);
  }, 100);
  
  return physicalMaterial;
}

/**
 * Example 6: Complex PBR Material with Textures
 * Demonstrates texture loading and mapping
 */
function createComplexPBRMaterialExample() {
  console.log('Creating complex PBR material example...');
  
  // Simulated texture data (in real implementation, these would be loaded from files)
  const simulatedTextures = {
    map: { type: 'texture', data: 'albedo_data' },
    normalMap: { type: 'texture', data: 'normal_data' },
    roughnessMap: { type: 'texture', data: 'roughness_data' },
    metalnessMap: { type: 'texture', data: 'metalness_data' },
    aoMap: { type: 'texture', data: 'ao_data' }
  };
  
  const complexMaterial = new MeshStandardMaterial({
    color: '#8B7355',      // Bronze-like color
    metalness: 0.7,        // Partially metallic
    roughness: 0.4,        // Moderate roughness
    envMapIntensity: 1.2,
    bumpScale: 0.1,
    normalScale: [1, 1],
    uvTransform: [0, 0, 2, 2, 0],  // Tile textures twice
    aoMapIntensity: 1.0,
    lightMapIntensity: 1.0
  });
  
  // In a real implementation, you would load textures like this:
  /*
  const textureLoader = new TextureLoader();
  const loadTexture = (url) => new Promise((resolve, reject) => {
    textureLoader.load(url, resolve, undefined, reject);
  });
  
  Promise.all([
    loadTexture('textures/bronze_albedo.jpg'),
    loadTexture('textures/bronze_normal.jpg'),
    loadTexture('textures/bronze_roughness.jpg'),
    loadTexture('textures/bronze_metalness.jpg'),
    loadTexture('textures/bronze_ao.jpg')
  ]).then(([albedo, normal, roughness, metalness, ao]) => {
    complexMaterial.map = albedo;
    complexMaterial.normalMap = normal;
    complexMaterial.roughnessMap = roughness;
    complexMaterial.metalnessMap = metalness;
    complexMaterial.aoMap = ao;
    complexMaterial.needsUpdate = true;
    console.log('Complex PBR material textures loaded');
  });
  */
  
  return complexMaterial;
}

/**
 * Example 7: Material Animation
 * Demonstrates real-time material property animation
 */
function createAnimatedMaterial() {
  console.log('Creating animated material...');
  
  const animatedMaterial = new MeshPhysicalMaterial({
    color: '#ff0000',
    metalness: 0.0,
    roughness: 0.5,
    transmission: 0.0,
    clearcoat: 0.0,
    sheen: 0.0
  });
  
  // Animate color through the spectrum
  function animateColor() {
    const time = Date.now() * 0.001;
    const r = Math.sin(time) * 0.5 + 0.5;
    const g = Math.sin(time + 2 * Math.PI / 3) * 0.5 + 0.5;
    const b = Math.sin(time + 4 * Math.PI / 3) * 0.5 + 0.5;
    
    animatedMaterial.setColor([r, g, b]);
    
    // Animate other properties
    animatedMaterial.setRoughness(0.3 + Math.sin(time * 0.5) * 0.3);
    animatedMaterial.setClearcoat(Math.abs(Math.sin(time * 0.8)) * 0.8);
    animatedMaterial.setSheen(Math.abs(Math.cos(time * 0.6)) * 0.5);
    
    requestAnimationFrame(animateColor);
  }
  
  animateColor();
  
  return animatedMaterial;
}

/**
 * Example 8: Material Cloning
 * Demonstrates material duplication
 */
function demonstrateMaterialCloning() {
  console.log('Demonstrating material cloning...');
  
  // Create original material
  const original = new MeshStandardMaterial({
    color: '#3498db',
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1.0
  });
  
  console.log('Original material:', original);
  
  // Clone the material
  const clone1 = original.clone();
  const clone2 = original.clone();
  
  // Modify clones independently
  clone1.setColor('#e74c3c');  // Red
  clone2.setColor('#2ecc71');  // Green
  
  console.log('Clone 1 color (red):', clone1.getProperty('uColor'));
  console.log('Clone 2 color (green):', clone2.getProperty('uColor'));
  console.log('Original color (blue):', original.getProperty('uColor'));
  
  return { original, clone1, clone2 };
}

/**
 * Example 9: Performance Comparison
 * Compares different material types for performance
 */
function performanceComparisonExample() {
  console.log('Running material performance comparison...');
  
  const materialTypes = [
    { name: 'Basic', material: new MeshBasicMaterial({ color: '#ffffff' }) },
    { name: 'Lambert', material: new MeshLambertMaterial({ color: '#ffffff' }) },
    { name: 'Phong', material: new MeshPhongMaterial({ color: '#ffffff' }) },
    { name: 'Standard', material: new MeshStandardMaterial({ color: '#ffffff' }) },
    { name: 'Physical', material: new MeshPhysicalMaterial({ color: '#ffffff' }) }
  ];
  
  const results = {};
  
  materialTypes.forEach(({ name, material }) => {
    const start = performance.now();
    
    // Simulate rendering operations
    for (let i = 0; i < 1000; i++) {
      material.updateUniforms();
      material.setProperty('uTime', i * 0.016);
    }
    
    const end = performance.now();
    results[name] = end - start;
  });
  
  console.log('Performance results (ms for 1000 updates):', results);
  
  return results;
}

/**
 * Main Example Runner
 */
function runExamples() {
  console.log('=== Advanced Material System Examples ===\n');
  
  // Run all examples
  createBasicMaterialExample();
  createLambertMaterialExample();
  createPhongMaterialExample();
  createStandardMaterialExample();
  createPhysicalMaterialExample();
  createComplexPBRMaterialExample();
  createAnimatedMaterial();
  demonstrateMaterialCloning();
  performanceComparisonExample();
  
  console.log('\n=== All Examples Started ===');
  console.log('Check the console for material information and animations.');
}

/**
 * Clean up example materials
 */
function cleanupExamples() {
  console.log('Cleaning up example materials...');
  
  // In a real implementation, you would clean up textures and other resources
  console.log('Examples cleaned up.');
}

// Export examples for use in other modules
export {
  createBasicMaterialExample,
  createLambertMaterialExample,
  createPhongMaterialExample,
  createStandardMaterialExample,
  createPhysicalMaterialExample,
  createComplexPBRMaterialExample,
  createAnimatedMaterial,
  demonstrateMaterialCloning,
  performanceComparisonExample,
  runExamples,
  cleanupExamples
};

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
  runExamples();
}
