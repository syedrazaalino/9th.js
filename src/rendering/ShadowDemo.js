/**
 * Shadow Mapping System Demo
 * Comprehensive example showing how to use the shadow mapping system
 */

import { 
    ShadowManager, 
    ShadowQuality, 
    ShadowFilterType,
    DirectionalShadowGenerator,
    PointShadowGenerator,
    SpotShadowGenerator
} from './Shadows.js';
import { DirectionalLight } from '../lights/DirectionalLight.js';
import { PointLight } from '../lights/PointLight.js';
import { SpotLight } from '../lights/SpotLight.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Matrix4 } from '../core/math/Matrix4.js';

export class ShadowDemo {
    constructor(gl, canvas) {
        this.gl = gl;
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        
        // Initialize shadow manager
        this.shadowManager = new ShadowManager(gl, {
            enabled: true,
            quality: ShadowQuality.MEDIUM,
            maxShadowDistance: 100.0,
            debug: true
        });
        
        // Performance monitoring
        this.performanceData = {
            frameCount: 0,
            lastTime: performance.now(),
            fps: 60
        };
        
        this.init();
    }
    
    /**
     * Initialize demo scene
     */
    init() {
        console.log('Initializing Shadow Demo...');
        
        // Create demo lights
        this.createDemoLights();
        
        // Add shadow generators
        this.setupShadowGenerators();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('Shadow Demo initialized successfully');
    }
    
    /**
     * Create demo scene with various light types
     */
    createDemoLights() {
        // Directional light (sun)
        this.sun = new DirectionalLight(1.0, '#ffffff', { x: -1, y: -1, z: -1 });
        this.sun.id = 'sun';
        this.sun.position = new Vector3(50, 50, 50);
        this.sun.target = new Vector3(0, 0, 0);
        this.sun.castShadow = true;
        
        // Point light (lamp)
        this.lamp = new PointLight(0.8, '#ffffaa', { x: 5, y: 5, z: 5 }, 20, 2);
        this.lamp.id = 'lamp';
        this.lamp.castShadow = true;
        this.lamp.distance = 25;
        
        // Spot light (flashlight)
        this.flashlight = new SpotLight(1.2, '#ffffff', { x: 0, y: 3, z: 5 }, { x: 0, y: 0, z: 0 }, Math.PI / 4, 0.2);
        this.flashlight.id = 'flashlight';
        this.flashlight.castShadow = true;
        this.flashlight.target.set(0, 0, 0);
        
        console.log('Created demo lights:', {
            sun: this.sun.constructor.name,
            lamp: this.lamp.constructor.name,
            flashlight: this.flashlight.constructor.name
        });
    }
    
    /**
     * Setup shadow generators for each light
     */
    setupShadowGenerators() {
        // Directional light with cascade shadow mapping
        this.shadowManager.addGenerator(this.sun, {
            enabled: true,
            mapSize: 2048,
            bias: 0.001,
            normalBias: 1.0,
            filterType: ShadowFilterType.PCF_4x4,
            cascadeCount: 3,
            maxShadowDistance: 80.0,
            shadowCameraSize: 50.0
        });
        
        // Point light with omnidirectional shadow mapping
        this.shadowManager.addGenerator(this.lamp, {
            enabled: true,
            mapSize: 1024,
            bias: 0.003,
            normalBias: 0.5,
            filterType: ShadowFilterType.PCF_3x3,
            updateInterval: 100 // Update every 100ms
        });
        
        // Spot light with basic shadow mapping
        this.shadowManager.addGenerator(this.flashlight, {
            enabled: true,
            mapSize: 1024,
            bias: 0.002,
            normalBias: 0.8,
            filterType: ShadowFilterType.PCF_3x3
        });
        
        console.log('Shadow generators added for all lights');
    }
    
    /**
     * Update shadows for current frame
     */
    update(scene, camera, deltaTime) {
        if (!this.shadowManager.enabled) return;
        
        // Update shadow maps
        this.shadowManager.update(scene, camera);
        
        // Update performance metrics
        this.updatePerformanceMetrics();
        
        // Animate lights
        this.animateLights(deltaTime);
    }
    
    /**
     * Animate lights for demo
     */
    animateLights(deltaTime) {
        const time = performance.now() * 0.001;
        
        // Animate lamp position
        this.lamp.position.set(
            Math.sin(time * 0.5) * 10,
            5 + Math.sin(time) * 2,
            Math.cos(time * 0.7) * 8
        );
        
        // Animate flashlight position
        this.flashlight.position.set(
            Math.sin(time * 0.3) * 15,
            2,
            Math.cos(time * 0.4) * 12
        );
        
        // Update flashlight target to follow moving object
        this.flashlight.target.set(
            Math.sin(time * 0.8) * 5,
            1,
            Math.cos(time * 0.6) * 5
        );
    }
    
    /**
     * Get shadow uniforms for shader integration
     */
    getShadowUniforms() {
        return this.shadowManager.getShadowUniforms();
    }
    
    /**
     * Set shadow quality
     */
    setQuality(quality) {
        this.shadowManager.setQuality(quality);
        console.log(`Shadow quality set to: ${quality === ShadowQuality.LOW ? 'LOW' : 
                                                quality === ShadowQuality.MEDIUM ? 'MEDIUM' : 
                                                quality === ShadowQuality.HIGH ? 'HIGH' : 'ULTRA'}`);
    }
    
    /**
     * Enable/disable shadows
     */
    setEnabled(enabled) {
        this.shadowManager.setEnabled(enabled);
        console.log(`Shadows ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return this.shadowManager.getPerformanceMetrics();
    }
    
    /**
     * Update performance monitoring
     */
    updatePerformanceMetrics() {
        this.performanceData.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.performanceData.lastTime >= 1000) {
            this.performanceData.fps = this.performanceData.frameCount * 1000 / 
                                     (currentTime - this.performanceData.lastTime);
            this.performanceData.frameCount = 0;
            this.performanceData.lastTime = currentTime;
        }
    }
    
    /**
     * Display performance information
     */
    displayPerformanceInfo() {
        const metrics = this.getPerformanceMetrics();
        const info = `
Shadow Performance:
- Enabled: ${metrics.enabled}
- Quality: ${Object.keys(ShadowQuality).find(key => ShadowQuality[key] === this.shadowManager.quality)}
- Generators: ${metrics.generatorCount}
- Avg Render Time: ${metrics.avgRenderTime.toFixed(2)}ms
- FPS: ${this.performanceData.fps.toFixed(1)}

Generator Details:
${Object.entries(metrics.generators).map(([lightId, genMetrics]) => 
    `- ${lightId}: ${genMetrics.mapSize}x${genMetrics.mapSize}, ${genMetrics.renderTime.toFixed(2)}ms`
).join('\n')}
        `;
        
        console.log(info);
        return info;
    }
    
    /**
     * Toggle between quality presets
     */
    cycleQuality() {
        const qualities = [ShadowQuality.LOW, ShadowQuality.MEDIUM, ShadowQuality.HIGH, ShadowQuality.ULTRA];
        const currentIndex = qualities.indexOf(this.shadowManager.quality);
        const nextIndex = (currentIndex + 1) % qualities.length;
        
        this.setQuality(qualities[nextIndex]);
    }
    
    /**
     * Enable/disable specific shadow generator
     */
    toggleLightShadow(lightId) {
        const generator = this.shadowManager.getGenerator(lightId);
        if (generator) {
            generator.setEnabled(!generator.enabled);
            console.log(`Shadow for ${lightId} ${generator.enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Benchmark shadow performance
     */
    benchmark(iterations = 10) {
        console.log(`Running shadow benchmark with ${iterations} iterations...`);
        
        const results = [];
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const frameStart = performance.now();
            
            // Simulate shadow update
            this.shadowManager.update(this.scene, this.camera);
            
            const frameTime = performance.now() - frameStart;
            results.push(frameTime);
        }
        
        const totalTime = performance.now() - startTime;
        const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
        const minTime = Math.min(...results);
        const maxTime = Math.max(...results);
        
        const benchmarkResults = {
            totalTime: totalTime.toFixed(2),
            averageFrameTime: avgTime.toFixed(2),
            minFrameTime: minTime.toFixed(2),
            maxFrameTime: maxTime.toFixed(2),
            avgFPS: (1000 / avgTime).toFixed(1)
        };
        
        console.log('Shadow Benchmark Results:', benchmarkResults);
        return benchmarkResults;
    }
    
    /**
     * Export shadow settings to JSON
     */
    exportSettings() {
        const settings = {
            enabled: this.shadowManager.enabled,
            quality: Object.keys(ShadowQuality).find(key => ShadowQuality[key] === this.shadowManager.quality),
            maxShadowDistance: this.shadowManager.maxShadowDistance,
            generators: {}
        };
        
        this.shadowManager.generators.forEach((generator, lightId) => {
            settings.generators[lightId] = {
                enabled: generator.enabled,
                mapSize: generator.mapSize,
                bias: generator.bias,
                normalBias: generator.normalBias,
                filterType: generator.filterType,
                renderTime: generator.renderTime
            };
        });
        
        console.log('Shadow Settings:', JSON.stringify(settings, null, 2));
        return settings;
    }
    
    /**
     * Dispose demo and cleanup resources
     */
    dispose() {
        console.log('Disposing Shadow Demo...');
        
        if (this.shadowManager) {
            this.shadowManager.dispose();
            this.shadowManager = null;
        }
        
        console.log('Shadow Demo disposed');
    }
}

// Example usage function
export function createShadowDemo(gl, canvas) {
    const demo = new ShadowDemo(gl, canvas);
    
    // Example: Toggle quality with keyboard
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case '1':
                demo.setQuality(ShadowQuality.LOW);
                break;
            case '2':
                demo.setQuality(ShadowQuality.MEDIUM);
                break;
            case '3':
                demo.setQuality(ShadowQuality.HIGH);
                break;
            case '4':
                demo.setQuality(ShadowQuality.ULTRA);
                break;
            case 't':
                demo.setEnabled(!demo.shadowManager.enabled);
                break;
            case 'p':
                demo.displayPerformanceInfo();
                break;
            case 'b':
                demo.benchmark();
                break;
            case 'e':
                demo.exportSettings();
                break;
        }
    });
    
    // Example: Toggle individual light shadows
    window.toggleSunShadow = () => demo.toggleLightShadow('sun');
    window.toggleLampShadow = () => demo.toggleLightShadow('lamp');
    window.toggleFlashlightShadow = () => demo.toggleLightShadow('flashlight');
    
    console.log('Shadow Demo created. Use keyboard shortcuts:');
    console.log('- 1/2/3/4: Set quality (LOW/MEDIUM/HIGH/ULTRA)');
    console.log('- t: Toggle all shadows');
    console.log('- p: Display performance info');
    console.log('- b: Run benchmark');
    console.log('- e: Export settings');
    console.log('- toggleSunShadow(), toggleLampShadow(), toggleFlashlightShadow()');
    
    return demo;
}

// Usage example for integration with existing renderer
export function integrateWithRenderer(renderer, scene, camera) {
    // Create shadow manager
    const shadowManager = new ShadowManager(renderer.getContext(), {
        enabled: true,
        quality: ShadowQuality.MEDIUM
    });
    
    // Add generators for lights that cast shadows
    scene.traverse(object => {
        if (object.light && object.light.castShadow) {
            shadowManager.addGenerator(object.light);
        }
    });
    
    // Modify render loop
    const originalRender = renderer.render.bind(renderer);
    renderer.render = function(scene, camera) {
        // Update shadows before rendering
        shadowManager.update(scene, camera);
        
        // Get shadow uniforms for materials
        const shadowUniforms = shadowManager.getShadowUniforms();
        
        // Update materials with shadow data
        scene.traverse(object => {
            if (object.material && shadowUniforms.length > 0) {
                object.material.setUniform('shadowData', shadowUniforms);
            }
        });
        
        // Continue with normal rendering
        originalRender(scene, camera);
    };
    
    return shadowManager;
}
