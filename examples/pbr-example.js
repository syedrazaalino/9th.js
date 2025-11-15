/**
 * PBR Materials and IBL Example
 * 
 * Demonstrates the advanced PBR materials system with:
 * - Cook-Torrance BRDF
 * - GGX normal distribution
 * - Smith geometry
 * - Fresnel Schlick
 * - Image-Based Lighting (IBL)
 * - Reflection probes
 * - Multi-bounce GI approximation
 */

import { PBRMaterial, IBLRenderer, PBRMaterialFactory, PBRUtils, PBRDebugger } from './src/rendering/PBR.js';
import { Vector3, WebGLRenderer, Scene, Camera } from './src/core/index.js';

/**
 * Example: Setting up a complete PBR scene with IBL
 */
class PBRExample {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.gl = this.canvas.getContext('webgl2');
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Initialize PBR IBL renderer
        this.iblRenderer = new IBLRenderer(this.gl, {
            bakeResolution: 64,
            sampleCount: 1024,
            prefilterResolution: 128
        });
        
        this.init();
    }
    
    /**
     * Initialize the scene with various PBR materials
     */
    init() {
        // Create IBL environment
        this.setupEnvironmentLighting();
        
        // Create materials using factory
        this.createFactoryMaterials();
        
        // Create custom advanced materials
        this.createCustomMaterials();
        
        // Set up reflection probes
        this.setupReflectionProbes();
        
        // Start rendering
        this.animate();
    }
    
    /**
     * Setup environment lighting with IBL
     */
    setupEnvironmentLighting() {
        // Load environment map (in real implementation, load actual HDR file)
        const envMap = this.loadEnvironmentMap('environments/studio.hdr');
        
        // Generate irradiance map for diffuse lighting
        this.iblRenderer.generateIrradianceMap('studio', envMap);
        
        // Generate prefiltered map for specular reflections
        this.iblRenderer.generatePrefilteredMap('studio', envMap);
        
        // Add direct light for additional illumination
        const directionalLight = new DirectionalLight();
        directionalLight.position.set(10, 10, 5);
        directionalLight.color.set(1.0, 0.95, 0.8);
        directionalLight.intensity = 2.0;
        this.scene.add(directionalLight);
    }
    
    /**
     * Create materials using the factory system
     */
    createFactoryMaterials() {
        // Gold material (metal)
        const goldMaterial = PBRMaterialFactory.createMetal(
            PBRUtils.sRGBToLinear(new Vector3(1.000, 0.766, 0.336)),
            1.0,    // Fully metallic
            0.2     // Smooth surface
        );
        
        // Wood material (dielectric)
        const woodMaterial = PBRMaterialFactory.createDielectric(
            PBRUtils.sRGBToLinear(new Vector3(0.4, 0.2, 0.1)),
            0.8     // Rough surface
        );
        
        // Glass material
        const glassMaterial = PBRMaterialFactory.createGlass(
            PBRUtils.sRGBToLinear(new Vector3(1.0, 1.0, 1.0)),
            1.5,    // Glass IOR
            0.0     // Perfectly smooth
        );
        
        // Car paint material
        const carPaintMaterial = PBRMaterialFactory.createCarPaint(
            PBRUtils.sRGBToLinear(new Vector3(0.1, 0.0, 0.8)),
            1.0,    // Full clearcoat
            0.1     // Smooth clearcoat
        );
        
        // Fabric material
        const fabricMaterial = PBRMaterialFactory.createFabric(
            PBRUtils.sRGBToLinear(new Vector3(0.8, 0.7, 0.6)),
            1.0,    // Full sheen
            PBRUtils.sRGBToLinear(new Vector3(0.95, 0.64, 0.54))
        );
        
        // Create geometry for each material
        this.createMaterialShowcase(goldMaterial, woodMaterial, glassMaterial, carPaintMaterial, fabricMaterial);
    }
    
    /**
     * Create custom advanced materials
     */
    createCustomMaterials() {
        // Iridescent material for rainbow effects
        const iridescentMaterial = new PBRMaterial({
            name: 'Iridescent Rainbow',
            color: PBRUtils.sRGBToLinear(new Vector3(0.8, 0.8, 0.8)),
            metalness: 0.0,
            roughness: 0.1,
            iridescence: 1.0,
            iridescenceIOR: 1.3,
            iridescenceThicknessRange: [100, 800],
            envMapIntensity: 1.5
        });
        
        // Anisotropic material (brushed metal)
        const anisotropicMaterial = new PBRMaterial({
            name: 'Anisotropic Brushed Metal',
            color: PBRUtils.sRGBToLinear(new Vector3(0.8, 0.8, 0.85)),
            metalness: 1.0,
            roughness: 0.3,
            anisotropy: 0.8,
            envMapIntensity: 1.2
        });
        
        // Subsurface scattering material (skin, wax, etc.)
        const subsurfaceMaterial = new PBRMaterial({
            name: 'Subsurface Scattering',
            color: PBRUtils.sRGBToLinear(new Vector3(0.9, 0.7, 0.6)),
            metalness: 0.0,
            roughness: 0.4,
            subsurface: 1.0,
            subsurfaceColor: PBRUtils.sRGBToLinear(new Vector3(0.9, 0.7, 0.6)),
            subsurfaceRadius: 1.0,
            envMapIntensity: 1.0
        });
        
        // Multi-layer material with transmission and clearcoat
        const multilayerMaterial = new PBRMaterial({
            name: 'Multi-layer Coating',
            color: PBRUtils.sRGBToLinear(new Vector3(0.2, 0.4, 0.8)),
            metalness: 0.0,
            roughness: 0.3,
            transmission: 0.6,
            thickness: 2.0,
            ior: 1.4,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.3
        });
        
        // Add to scene
        this.createAdvancedMaterialShowcase(iridescentMaterial, anisotropicMaterial, subsurfaceMaterial, multilayerMaterial);
    }
    
    /**
     * Set up dynamic reflection probes
     */
    setupReflectionProbes() {
        // Create corner probes for a room-like environment
        const probePositions = [
            new Vector3(-8, 4, -8),
            new Vector3(8, 4, -8),
            new Vector3(-8, 4, 8),
            new Vector3(8, 4, 8)
        ];
        
        probePositions.forEach((position, index) => {
            const probe = this.iblRenderer.createReflectionProbe(
                position,
                new Vector3(16, 8, 16),  // Room size
                1000  // Update every second
            );
            
            probe.intensity = 1.0;
            probe.blendDistance = 2.0;
        });
    }
    
    /**
     * Create geometry to showcase materials
     */
    createMaterialShowcase(gold, wood, glass, carPaint, fabric) {
        // Create spheres for each material
        const sphereGeometry = new SphereGeometry(1, 32, 32);
        
        const goldSphere = new Mesh(sphereGeometry, gold);
        goldSphere.position.set(-8, 1, 0);
        this.scene.add(goldSphere);
        
        const woodSphere = new Mesh(sphereGeometry, wood);
        woodSphere.position.set(-4, 1, 0);
        this.scene.add(woodSphere);
        
        const glassSphere = new Mesh(sphereGeometry, glass);
        glassSphere.position.set(0, 1, 0);
        this.scene.add(glassSphere);
        
        const carPaintSphere = new Mesh(sphereGeometry, carPaint);
        carPaintSphere.position.set(4, 1, 0);
        this.scene.add(carPaintSphere);
        
        const fabricSphere = new Mesh(sphereGeometry, fabric);
        fabricSphere.position.set(8, 1, 0);
        this.scene.add(fabricSphere);
    }
    
    /**
     * Create geometry for advanced materials
     */
    createAdvancedMaterialShowcase(iridescent, anisotropic, subsurface, multilayer) {
        // Create different geometries for variety
        const sphereGeometry = new SphereGeometry(0.8, 32, 32);
        const torusGeometry = new TorusGeometry(0.6, 0.3, 16, 32);
        const boxGeometry = new BoxGeometry(1, 1, 1);
        
        // Iridescent sphere
        const iridescentSphere = new Mesh(sphereGeometry, iridescent);
        iridescentSphere.position.set(-4, 1, -4);
        this.scene.add(iridescentSphere);
        
        // Anisotropic torus
        const anisotropicTorus = new Mesh(torusGeometry, anisotropic);
        anisotropicTorus.position.set(4, 1, -4);
        anisotropicTorus.rotation.y = Math.PI / 4;
        this.scene.add(anisotropicTorus);
        
        // Subsurface scattering box
        const subsurfaceBox = new Mesh(boxGeometry, subsurface);
        subsurfaceBox.position.set(0, 1, -4);
        subsurfaceBox.scale.set(1.2, 1.2, 1.2);
        this.scene.add(subsurfaceBox);
        
        // Multi-layer coating sphere
        const multilayerSphere = new Mesh(sphereGeometry, multilayer);
        multilayerSphere.position.set(0, 1, 4);
        this.scene.add(multilayerSphere);
    }
    
    /**
     * Update scene each frame
     */
    update(deltaTime) {
        // Update reflection probes
        this.iblRenderer.reflectionProbes.forEach(probe => {
            this.iblRenderer.updateReflectionProbe(probe, this.scene, this.camera);
        });
        
        // Animate material properties
        this.animateMaterialProperties(deltaTime);
        
        // Update multi-bounce GI
        this.updateGlobalIllumination();
    }
    
    /**
     * Animate material properties for demonstration
     */
    animateMaterialProperties(time) {
        this.scene.meshes.forEach((mesh, index) => {
            const material = mesh.material;
            
            if (material instanceof PBRMaterial) {
                // Animate roughness
                const baseRoughness = material.getProperty('baseRoughness') || material.roughness;
                material.setProperty('roughness', 
                    0.1 + Math.sin(time * 0.5 + index) * 0.3
                );
                
                // Animate emissive intensity for glowing effect
                const emissiveIntensity = 0.5 + Math.abs(Math.sin(time * 2.0 + index)) * 1.0;
                material.setProperty('emissiveIntensity', emissiveIntensity);
                
                // Animate transmission for glass-like materials
                if (material.transmission > 0) {
                    const transmission = 0.3 + Math.abs(Math.sin(time * 1.5 + index)) * 0.7;
                    material.setProperty('transmission', transmission);
                }
                
                // Animate anisotropy direction for brushed metal
                if (material.anisotropy > 0) {
                    const angle = time * 0.3 + index * Math.PI / 3;
                    const direction = new Vector3(Math.cos(angle), 0, Math.sin(angle));
                    material.setProperty('anisotropyDirection', direction);
                }
            }
        });
    }
    
    /**
     * Update global illumination
     */
    updateGlobalIllumination() {
        this.scene.meshes.forEach(mesh => {
            const position = mesh.getWorldPosition();
            const normal = mesh.getWorldNormal();
            const occluders = this.findOccluders(position);
            
            const gi = this.iblRenderer.computeMultiBounceGI(
                position,
                normal,
                mesh.material.roughness || 0.5,
                occluders
            );
            
            // Apply GI to material if it has an indirect light property
            if (mesh.material.setProperty) {
                mesh.material.setProperty('indirectLight', gi);
            }
        });
    }
    
    /**
     * Find occluders for GI computation
     */
    findOccluders(position) {
        // Simplified occluder detection
        const occluders = [];
        this.scene.meshes.forEach(mesh => {
            const distance = position.distanceTo(mesh.getWorldPosition());
            if (distance < 5.0 && mesh !== this) {
                occluders.push(mesh);
            }
        });
        return occluders;
    }
    
    /**
     * Debug material validation
     */
    debugMaterials() {
        this.scene.meshes.forEach(mesh => {
            if (mesh.material instanceof PBRMaterial) {
                const validation = PBRDebugger.validateMaterial(mesh.material);
                const energyConservation = PBRDebugger.analyzeEnergyConservation(mesh.material);
                
                if (!validation.valid) {
                    console.warn(`Invalid material on mesh:`, validation.errors);
                }
                
                if (!energyConservation.conservesEnergy) {
                    console.warn(`Energy conservation violation:`, energyConservation);
                }
            }
        });
    }
    
    /**
     * Render loop
     */
    animate() {
        const time = Date.now() * 0.001;
        
        this.update(1/60);  // Assume 60 FPS
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Load environment map (simplified)
     */
    loadEnvironmentMap(url) {
        // In a real implementation, this would load and process an HDR environment map
        // For this example, we'll return a placeholder
        return {
            width: 512,
            height: 256,
            data: null
        };
    }
}

/**
 * Example: Using Cook-Torrance BRDF directly
 */
function demonstrateBRDF() {
    // Initialize vectors
    const N = new Vector3(0, 1, 0);      // Surface normal
    const V = new Vector3(0, 0, 1);      // View direction
    const L = new Vector3(1, 1, 1).normalize(); // Light direction
    const albedo = new Vector3(1, 0, 0); // Red surface
    const metallic = 0.8;
    const roughness = 0.2;
    
    // Compute BRDF
    const result = CookTorranceBRDF.computeBRDF(N, V, L, albedo, metallic, roughness);
    
    console.log('BRDF Result:', result);
    
    // Demonstrate individual components
    const H = V.clone().add(L).normalize();
    const D = CookTorranceBRDF.distributionGGX(N, H, roughness);
    const G = CookTorranceBRDF.geometrySmith(N, V, L, roughness);
    const cosTheta = Math.max(H.dot(V), 0);
    const F0 = PBRUtils.computeF0(albedo, metallic, 1.5);
    const F = CookTorranceBRDF.fresnelSchlick(cosTheta, F0);
    
    console.log('Distribution GGX:', D);
    console.log('Geometry Smith:', G);
    console.log('Fresnel Schlick:', F);
}

/**
 * Example: Using IBL directly
 */
function demonstrateIBL() {
    const iblRenderer = new IBLRenderer(null); // WebGL context would be passed in real use
    
    // Sample irradiance
    const normal = new Vector3(0, 1, 0);
    const irradiance = iblRenderer.sampleIrradiance(normal, 'default');
    console.log('Irradiance:', irradiance);
    
    // Sample reflection
    const viewDir = new Vector3(0, 0, 1);
    const reflection = iblRenderer.sampleReflection(viewDir, normal, 0.2, 'default');
    console.log('Reflection:', reflection);
    
    // Compute multi-bounce GI
    const position = new Vector3(0, 0, 0);
    const occluders = [];
    const gi = iblRenderer.computeMultiBounceGI(position, normal, 0.5, occluders);
    console.log('Multi-bounce GI:', gi);
}

/**
 * Example: Material Factory Usage
 */
function demonstrateMaterialFactory() {
    // Create various materials
    const materials = {
        // Copper metal
        copper: PBRMaterialFactory.createMetal(
            PBRUtils.sRGBToLinear(new Vector3(0.955, 0.637, 0.538)),
            1.0,
            0.25
        ),
        
        // Plastic
        plastic: PBRMaterialFactory.createDielectric(
            PBRUtils.sRGBToLinear(new Vector3(0.3, 0.3, 0.8)),
            0.4
        ),
        
        // Glass
        glass: PBRMaterialFactory.createGlass(
            PBRUtils.sRGBToLinear(new Vector3(1, 1, 1)),
            1.5,
            0.02
        ),
        
        // Car paint
        carPaint: PBRMaterialFactory.createCarPaint(
            PBRUtils.sRGBToLinear(new Vector3(0.9, 0.1, 0.1)),
            1.0,
            0.05
        ),
        
        // Velvet fabric
        velvet: PBRMaterialFactory.createFabric(
            PBRUtils.sRGBToLinear(new Vector3(0.2, 0.05, 0.3)),
            0.8,
            PBRUtils.sRGBToLinear(new Vector3(0.8, 0.3, 0.6))
        ),
        
        // Skin (subsurface scattering)
        skin: PBRMaterialFactory.createSubsurface(
            PBRUtils.sRGBToLinear(new Vector3(0.9, 0.7, 0.6)),
            0.7,
            PBRUtils.sRGBToLinear(new Vector3(0.9, 0.7, 0.6))
        ),
        
        // Iridescent butterfly wing effect
        iridescent: PBRMaterialFactory.createIridescent(
            PBRUtils.sRGBToLinear(new Vector3(0.5, 0.5, 0.5)),
            1.0,
            1.3
        ),
        
        // Brushed aluminum
        brushed: PBRMaterialFactory.createAnisotropic(
            PBRUtils.sRGBToLinear(new Vector3(0.9, 0.9, 0.95)),
            0.9,
            0.2
        )
    };
    
    // Validate all materials
    Object.entries(materials).forEach(([name, material]) => {
        const validation = PBRDebugger.validateMaterial(material);
        const energyConservation = PBRDebugger.analyzeEnergyConservation(material);
        
        console.log(`Material: ${name}`);
        console.log(`Valid: ${validation.valid}`);
        console.log(`Energy Conservative: ${energyConservation.conservesEnergy}`);
        console.log('---');
    });
}

/**
 * Example: Performance optimization
 */
function demonstratePerformanceOptimization() {
    // Material sharing
    const sharedMetal = PBRMaterialFactory.createMetal(
        PBRUtils.sRGBToLinear(new Vector3(0.8, 0.8, 0.8)),
        1.0,
        0.3
    );
    
    // Instead of creating new materials for each object, share and clone when needed
    const metalObjects = [];
    for (let i = 0; i < 100; i++) {
        const material = sharedMetal.clone();
        material.setProperty('roughness', 0.2 + Math.random() * 0.6);
        metalObjects.push(material);
    }
    
    console.log(`Created ${metalObjects.length} materials from shared base`);
    
    // IBL settings for different quality levels
    const qualitySettings = {
        high: {
            bakeResolution: 128,
            sampleCount: 2048,
            prefilterResolution: 256,
            maxMipLevels: 8
        },
        medium: {
            bakeResolution: 64,
            sampleCount: 1024,
            prefilterResolution: 128,
            maxMipLevels: 5
        },
        low: {
            bakeResolution: 32,
            sampleCount: 512,
            prefilterResolution: 64,
            maxMipLevels: 3
        }
    };
    
    console.log('Quality settings for different platforms:', qualitySettings);
}

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.PBRExample = PBRExample;
    window.demonstrateBRDF = demonstrateBRDF;
    window.demonstrateIBL = demonstrateIBL;
    window.demonstrateMaterialFactory = demonstrateMaterialFactory;
    window.demonstratePerformanceOptimization = demonstratePerformanceOptimization;
} else {
    // Node environment - run examples
    console.log('PBR Materials and IBL Examples');
    console.log('================================');
    
    demonstrateBRDF();
    demonstrateIBL();
    demonstrateMaterialFactory();
    demonstratePerformanceOptimization();
}

export {
    PBRExample,
    demonstrateBRDF,
    demonstrateIBL,
    demonstrateMaterialFactory,
    demonstratePerformanceOptimization
};