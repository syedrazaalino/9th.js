/**
 * Environment Map Examples
 * Demonstrates usage of CubeTexture and EnvironmentMap classes
 */

import { CubeTexture, EnvironmentMap } from '../rendering/index.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { Scene } from '../core/Scene.js';
import { Mesh } from '../core/Mesh.js';
import { SphereGeometry } from '../geometry/SphereGeometry.js';
import { BoxGeometry } from '../geometry/BoxGeometry.js';
import { MeshPhysicalMaterial } from '../materials/MeshPhysicalMaterial.js';

/**
 * Example 1: Basic Cubemap Creation
 */
export function basicCubemapExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create a basic cubemap
    const cubemap = new CubeTexture(gl, {
        size: 512,
        format: gl.RGBA,
        generateMipmaps: true,
        minFilter: gl.LINEAR_MIPMAP_LINEAR,
        magFilter: gl.LINEAR
    });
    
    // Create a skybox
    const skyboxGeometry = BoxGeometry.createSkybox();
    const skyboxMaterial = cubemap.createSkyboxMaterial();
    
    const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);
    
    console.log('Basic cubemap created:', cubemap.getInfo());
    
    return { renderer, scene, cubemap };
}

/**
 * Example 2: Environment Map with PBR Materials
 */
export function pbrEnvironmentExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create environment map for PBR lighting
    const envMap = new EnvironmentMap(gl, {
        type: 'default',
        intensity: 1.0,
        encoding: 'linear'
    });
    
    // Create PBR material with environment reflection
    const material = new MeshPhysicalMaterial(gl, {
        envMap: envMap.getEnvironmentMap(0.1, 'reflection'),
        metalness: 0.8,
        roughness: 0.2,
        reflectivity: 0.9,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1
    });
    
    const sphere = new Mesh(
        SphereGeometry.createSphere(1, 64, 32),
        material
    );
    sphere.position.set(0, 0, 0);
    scene.add(sphere);
    
    console.log('PBR environment map created:', envMap.getInfo());
    
    return { renderer, scene, envMap, material };
}

/**
 * Example 3: Irradiance Map for Diffuse Lighting
 */
export function irradianceMapExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create environment map specifically for irradiance
    const envMap = new EnvironmentMap(gl, {
        type: 'irradiance',
        intensity: 1.0,
        sampleCount: 2048
    });
    
    // Create material with irradiance for diffuse lighting
    const material = new MeshPhysicalMaterial(gl, {
        envMap: envMap.getEnvironmentMap(0.0, 'irradiance'),
        metalness: 0.0,
        roughness: 0.9,
        diffuseColor: 0xffffff
    });
    
    // Create multiple spheres with different materials
    const spheres = [];
    for (let i = 0; i < 5; i++) {
        const sphere = new Mesh(
            SphereGeometry.createSphere(0.5, 32, 16),
            material.clone()
        );
        sphere.position.set((i - 2) * 2, 0, 0);
        scene.add(sphere);
        spheres.push(sphere);
    }
    
    console.log('Irradiance map created for diffuse lighting');
    
    return { renderer, scene, envMap, spheres };
}

/**
 * Example 4: Reflection Maps with Roughness
 */
export function reflectionMapExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create environment map with prefiltered reflection maps
    const envMap = new EnvironmentMap(gl, {
        type: 'reflection',
        intensity: 1.0,
        roughnessLevels: [0.0, 0.1, 0.3, 0.6, 1.0],
        sampleCount: 128
    });
    
    // Create spheres with different roughness values
    const spheres = [];
    const roughnesses = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    
    roughnesses.forEach((roughness, index) => {
        const material = new MeshPhysicalMaterial(gl, {
            envMap: envMap.getEnvironmentMap(roughness, 'reflection'),
            metalness: 1.0,
            roughness: roughness,
            envMapIntensity: 1.0
        });
        
        const sphere = new Mesh(
            SphereGeometry.createSphere(0.8, 64, 32),
            material
        );
        sphere.position.set((index - 2.5) * 2.5, 0, 0);
        scene.add(sphere);
        spheres.push(sphere);
    });
    
    console.log('Reflection maps created with different roughness levels');
    
    return { renderer, scene, envMap, spheres };
}

/**
 * Example 5: HDR Environment Map Processing
 */
export function hdrEnvironmentExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create environment map with HDR processing
    const envMap = new EnvironmentMap(gl, {
        toneMapping: 'aces', // ACES filmic tone mapping
        exposure: 1.5,
        intensity: 2.0,
        encoding: 'linear'
    });
    
    // Simulate HDR data (in real usage, this would come from HDR loader)
    const simulatedHDR = {
        width: 1024,
        height: 512,
        data: generateSimulatedHDRData(1024, 512)
    };
    
    // Load HDR data into environment map
    envMap.loadHDR(simulatedHDR, {
        resolution: 512,
        roughnessLevels: [0.0, 0.25, 0.5, 0.75, 1.0]
    });
    
    // Create reflective objects
    const materials = [
        { metalness: 0.0, roughness: 0.1, color: 0xffffff },
        { metalness: 0.5, roughness: 0.3, color: 0xffffff },
        { metalness: 1.0, roughness: 0.1, color: 0xffffff },
        { metalness: 0.8, roughness: 0.6, color: 0x88ff88 }
    ];
    
    const objects = materials.map((props, index) => {
        const material = new MeshPhysicalMaterial(gl, {
            envMap: envMap.getEnvironmentMap(props.roughness, 'reflection'),
            metalness: props.metalness,
            roughness: props.roughness,
            envMapIntensity: 1.0,
            diffuseColor: props.color
        });
        
        const mesh = new Mesh(
            SphereGeometry.createSphere(1.2, 64, 32),
            material
        );
        mesh.position.set((index - 1.5) * 3.5, 0, 0);
        scene.add(mesh);
        
        return mesh;
    });
    
    console.log('HDR environment map processed with ACES tone mapping');
    
    return { renderer, scene, envMap, objects };
}

/**
 * Example 6: Equirectangular to Cubemap Conversion
 */
export function equirectangularConversionExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Simulate equirectangular texture
    const equirectangularTexture = {
        width: 2048,
        height: 1024,
        data: generateSimulatedEquirectangularData(2048, 1024)
    };
    
    // Create environment map from equirectangular
    const envMap = new EnvironmentMap(gl);
    envMap.setFromEquirectangular(equirectangularTexture, {
        resolution: 512
    });
    
    // Create comparison objects
    const originalMaterial = new MeshPhysicalMaterial(gl, {
        map: equirectangularTexture, // Show original equirectangular
        metalness: 0.0,
        roughness: 1.0
    });
    
    const cubemapMaterial = new MeshPhysicalMaterial(gl, {
        envMap: envMap.getEnvironmentMap(0.0, 'reflection'),
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.0
    });
    
    // Original equirectangular mapped sphere
    const originalSphere = new Mesh(
        SphereGeometry.createSphere(1.0, 64, 32),
        originalMaterial
    );
    originalSphere.position.set(-4, 0, 0);
    scene.add(originalSphere);
    
    // Converted cubemap sphere
    const cubemapSphere = new Mesh(
        SphereGeometry.createSphere(1.0, 64, 32),
        cubemapMaterial
    );
    cubemapSphere.position.set(4, 0, 0);
    scene.add(cubemapSphere);
    
    console.log('Equirectangular to cubemap conversion completed');
    
    return { 
        renderer, 
        scene, 
        envMap, 
        originalSphere, 
        cubemapSphere,
        equirectangularTexture 
    };
}

/**
 * Example 7: Skybox with Environment Mapping
 */
export function skyboxExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Create environment map for skybox
    const envMap = new EnvironmentMap(gl, {
        type: 'default',
        intensity: 1.0
    });
    
    // Load environment from simulated source
    const envData = generateSimulatedEnvironmentData();
    envMap.loadHDR(envData, {
        resolution: 512,
        toneMapping: 'aces',
        exposure: 1.0
    });
    
    // Create skybox
    const skyboxMaterial = envMap.createSkyboxMaterial();
    const skybox = new Mesh(BoxGeometry.createSkybox(), skyboxMaterial);
    scene.add(skybox);
    
    // Create ground plane with environment reflection
    const groundMaterial = new MeshPhysicalMaterial(gl, {
        envMap: envMap.getEnvironmentMap(0.3, 'reflection'),
        metalness: 0.0,
        roughness: 0.8,
        envMapIntensity: 0.5
    });
    
    const ground = new Mesh(
        BoxGeometry.createBox(20, 0.1, 20),
        groundMaterial
    );
    ground.position.y = -2;
    scene.add(ground);
    
    // Add a few reflective objects
    const objects = [];
    for (let i = 0; i < 3; i++) {
        const material = new MeshPhysicalMaterial(gl, {
            envMap: envMap.getEnvironmentMap(0.1 + i * 0.3, 'reflection'),
            metalness: 0.8 + i * 0.1,
            roughness: 0.1 + i * 0.2,
            envMapIntensity: 1.0
        });
        
        const mesh = new Mesh(
            SphereGeometry.createSphere(0.8, 64, 32),
            material
        );
        mesh.position.set((i - 1) * 4, 0, -2);
        scene.add(mesh);
        objects.push(mesh);
    }
    
    console.log('Complete skybox scene created with environment mapping');
    
    return { renderer, scene, envMap, skybox, ground, objects };
}

/**
 * Utility Functions for Examples
 */

// Generate simulated HDR data
function generateSimulatedHDRData(width, height) {
    const data = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Create a gradient sky with bright sun
            const u = x / width;
            const v = y / height;
            
            let r, g, b;
            
            // Sky gradient
            if (v > 0.5) {
                r = 0.5 + (v - 0.5) * 1.0;
                g = 0.7 + (v - 0.5) * 0.8;
                b = 0.9 + (v - 0.5) * 0.6;
            } else {
                // Ground
                r = 0.2;
                g = 0.3;
                b = 0.25;
            }
            
            // Add bright sun
            const sunU = Math.abs(u - 0.3) < 0.05;
            const sunV = v > 0.8;
            if (sunU && sunV) {
                r = g = b = 10.0; // Very bright for HDR
            }
            
            data.push([r, g, b]);
        }
    }
    return data;
}

// Generate simulated equirectangular data
function generateSimulatedEquirectangularData(width, height) {
    return generateSimulatedHDRData(width, height);
}

// Generate simulated environment data
function generateSimulatedEnvironmentData() {
    return {
        width: 1024,
        height: 512,
        data: generateSimulatedHDRData(1024, 512)
    };
}

/**
 * Example 8: Performance Comparison
 */
export function performanceComparisonExample(canvas) {
    const renderer = new WebGLRenderer(canvas);
    const scene = new Scene();
    const gl = renderer.context;
    
    // Test different environment map types for performance
    const envMapTypes = [
        { name: 'Direct Cubemap', type: 'default' },
        { name: 'Irradiance Map', type: 'irradiance' },
        { name: 'Reflection Map', type: 'reflection' }
    ];
    
    const results = [];
    
    envMapTypes.forEach((config, index) => {
        const start = performance.now();
        
        const envMap = new EnvironmentMap(gl, {
            type: config.type,
            intensity: 1.0
        });
        
        const envData = generateSimulatedEnvironmentData();
        envMap.loadHDR(envData, { resolution: 256 });
        
        const end = performance.now();
        
        results.push({
            name: config.name,
            type: config.type,
            generationTime: end - start,
            memoryUsage: estimateMemoryUsage(envMap)
        });
    });
    
    console.log('Environment map performance comparison:');
    results.forEach(result => {
        console.log(`${result.name}: ${result.generationTime.toFixed(2)}ms, ${result.memoryUsage}MB`);
    });
    
    return { renderer, scene, results };
}

// Estimate memory usage of environment map
function estimateMemoryUsage(envMap) {
    let size = 0;
    
    if (envMap.cubemap) size += 6 * envMap.cubemap.size * envMap.cubemap.size * 4;
    if (envMap.irradiance) size += 6 * envMap.irradiance.size * envMap.irradiance.size * 4;
    if (envMap.prefilterMap) size += envMap.prefilterMap.size * 6 * envMap.filterSize * envMap.filterSize * 4;
    
    return Math.round(size / (1024 * 1024));
}

/**
 * Demo Integration
 */
export function createEnvironmentMapDemo(canvas) {
    console.log('Environment Map Demo Features:');
    console.log('1. Basic Cubemap Creation');
    console.log('2. PBR Environment Lighting');
    console.log('3. Irradiance Maps for Diffuse Lighting');
    console.log('4. Prefiltered Reflection Maps');
    console.log('5. HDR Processing with Tone Mapping');
    console.log('6. Equirectangular to Cubemap Conversion');
    console.log('7. Complete Skybox with Environment Mapping');
    console.log('8. Performance Comparison');
    
    // Return the skybox example as the main demo
    return skyboxExample(canvas);
}
