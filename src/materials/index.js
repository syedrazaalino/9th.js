/**
 * Materials Index
 * Exports all material classes from the advanced material system
 */

export { MeshBasicMaterial } from './MeshBasicMaterial.js';
export { MeshLambertMaterial } from './MeshLambertMaterial.js';
export { MeshPhongMaterial } from './MeshPhongMaterial.js';
export { MeshStandardMaterial } from './MeshStandardMaterial.js';
export { MeshPhysicalMaterial } from './MeshPhysicalMaterial.js';

// Advanced Materials
export { SubsurfaceScatteringMaterial } from './SubsurfaceScatteringMaterial.js';
export { IridescenceMaterial } from './IridescenceMaterial.js';
export { ClearcoatMaterial } from './ClearcoatMaterial.js';
export { AnisotropicMaterial } from './AnisotropicMaterial.js';
export { ClothMaterial } from './ClothMaterial.js';

/**
 * Material System Overview
 *
 * The material system provides a comprehensive set of physically-based and traditional
 * shading models for 3D rendering. Each material extends the base Material class and
 * provides specific properties and shader implementations.
 *
 * Material Hierarchy:
 *
 * Basic Materials:
 * - MeshBasicMaterial: Unlit material, no lighting calculations
 *   Best for: UI elements, sprites, debug visualization
 *   Properties: color, opacity, transparent, alphaTest
 *
 * - MeshLambertMaterial: Lambertian diffuse lighting
 *   Best for: matte surfaces, diffuse materials
 *   Properties: color, emissive, ambient, diffuse, textures
 *
 * - MeshPhongMaterial: Phong shading with specular highlights
 *   Best for: plastics, glossy surfaces
 *   Properties: color, emissive, specular, shininess, normal maps
 *
 * PBR Materials:
 * - MeshStandardMaterial: PBR material with metalness/roughness workflow
 *   Best for: general purpose PBR rendering
 *   Properties: color, metalness, roughness, normal maps, PBR textures
 *
 * - MeshPhysicalMaterial: Advanced PBR with physical properties
 *   Best for: realistic materials (glass, metals, fabric, etc.)
 *   Properties: metalness, roughness, clearcoat, transmission, iridescence
 *
 * Advanced Materials:
 * - SubsurfaceScatteringMaterial: Simulates light diffusion through translucent materials
 *   Best for: skin, wax, marble, organic materials
 *   Properties: subsurfaceColor, subsurfaceIntensity, transmission, absorption
 *
 * - IridescenceMaterial: Creates rainbow-color effects using thin-film interference
 *   Best for: oil, water, soap bubbles, butterfly wings
 *   Properties: iridescenceIntensity, iridescenceThickness, chromaticAberration
 *
 * - ClearcoatMaterial: Multi-layer material with transparent protective coating
 *   Best for: car paint, glass, lacquer surfaces
 *   Properties: clearcoat, clearcoatRoughness, clearcoatIor, transmission
 *
 * - AnisotropicMaterial: Direction-dependent reflections for brushed surfaces
 *   Best for: brushed metal, hair, wood grain, fabric
 *   Properties: anisotropy, anisotropyDirection, sheenColor
 *
 * - ClothMaterial: Fiber-based rendering for fabrics and textiles
 *   Best for: clothing, upholstery, carpets, natural fibers
 *   Properties: fiberDirection, weaveDensity, sheen, subsurface, fuzz
 *
 * Common Features:
 * - Texture mapping support (diffuse, normal, roughness, metalness, AO, etc.)
 * - Normal/bump mapping for surface detail
 * - Emissive materials for self-illumination
 * - Transparency and alpha testing
 * - Vertex color support
 * - UV coordinate transformation
 * - Environment map integration
 * - Physically-based lighting models
 * - Clone method for material duplication
 * - Comprehensive property setters/getters
 * - Automatic shader compilation and uniform management
 *
 * Usage Examples:
 *
 * import { MeshStandardMaterial } from './materials/index.js';
 *
 * // Standard PBR material
 * const material = new MeshStandardMaterial({
 *   color: '#ff0000',
 *   metalness: 0.8,
 *   roughness: 0.2,
 *   envMapIntensity: 1.0
 * });
 *
 * // Advanced subsurface scattering for skin
 * import { SubsurfaceScatteringMaterial } from './materials/index.js';
 * const skinMaterial = new SubsurfaceScatteringMaterial({
 *   color: [1.0, 0.8, 0.7],
 *   subsurfaceColor: [1.0, 0.6, 0.4],
 *   subsurfaceIntensity: 0.8,
 *   subsurfaceRadius: 1.2
 * });
 *
 * // Iridescent material for rainbow effects
 * import { IridescenceMaterial } from './materials/index.js';
 * const rainbowMaterial = new IridescenceMaterial({
 *   color: [1.0, 1.0, 1.0],
 *   iridescenceIntensity: 1.0,
 *   iridescenceThickness: 400,
 *   filmColor: [1.0, 0.8, 0.2]
 * });
 *
 * // Cloth material for fabric simulation
 * import { ClothMaterial } from './materials/index.js';
 * const fabricMaterial = new ClothMaterial({
 *   color: [0.8, 0.2, 0.2],
 *   roughness: 0.9,
 *   sheen: 0.6,
 *   fiberIntensity: 0.8,
 *   weaveDensity: 10.0
 * });
 *
 * // Property manipulation
 * material.setColor('#00ff00');
 * material.setRoughness(0.5);
 * material.setMetalness(0.5);
 * material.setNormalScale([1.0, 1.0]);
 *
 * // Clone material for reuse
 * const clonedMaterial = material.clone();
 */
