/**
 * Post-Processing Effects Example
 * Demonstrates usage of all post-processing effects
 */

import {
    BloomEffect,
    DepthOfFieldEffect,
    SSAOEffect,
    ChromaticAberration,
    PostProcessingPipeline
} from './index.js';

class PostProcessingExample {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.pipeline = null;
        this.effects = {};
        this.animationTime = 0;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        // Create post-processing pipeline
        this.createPipeline();
        
        // Setup keyboard controls
        this.setupControls();
        
        // Start animation loop
        this.animate();
    }
    
    createPipeline() {
        // Create individual effects with different configurations
        
        // 1. Bloom Effect - creates glow around bright areas
        this.effects.bloom = new BloomEffect(this.renderer, {
            enabled: true,
            quality: 'high',
            intensity: 1.5,
            threshold: 0.8,
            radius: 4.0,
            temporalEnabled: true,
            temporalStrength: 0.1
        });
        
        // 2. Depth of Field Effect - camera-like focus blur
        this.effects.depthOfField = new DepthOfFieldEffect(this.renderer, {
            enabled: true,
            quality: 'high',
            focusDistance: 15.0,
            focalLength: 50.0,
            aperture: 4.0,
            maxBlur: 10.0,
            temporalEnabled: true,
            temporalStrength: 0.05
        });
        
        // 3. SSAO Effect - ambient occlusion shadows
        this.effects.ssao = new SSAOEffect(this.renderer, {
            enabled: true,
            quality: 'high',
            radius: 0.5,
            intensity: 1.2,
            sampleCount: 32,
            noiseEnabled: true,
            noiseScale: 2.0,
            temporalEnabled: true,
            temporalStrength: 0.1
        });
        
        // 4. Chromatic Aberration - lens color separation
        this.effects.chromatic = new ChromaticAberration(this.renderer, {
            enabled: true,
            quality: 'high',
            intensity: 0.002,
            angle: 0.0,
            animate: true,
            animationSpeed: 0.5,
            redOffset: { x: 1.0, y: 0.0 },
            greenOffset: { x: 0.0, y: 0.0 },
            blueOffset: { x: -1.0, y: 0.0 }
        });
        
        // Create pipeline with performance monitoring
        this.pipeline = new PostProcessingPipeline(this.renderer, {
            enabled: true,
            autoQuality: true,
            targetFrameTime: 16.67, // 60 FPS target
            qualityAdjustmentEnabled: true
        });
        
        // Add all effects to pipeline
        Object.values(this.effects).forEach(effect => {
            this.pipeline.addEffect(effect);
        });
    }
    
    setupControls() {
        // Keyboard controls for effect parameters
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
        
        // Mouse controls for focus distance
        this.setupMouseControls();
    }
    
    setupMouseControls() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('click', (event) => {
            // Raycast to find clicked object for focus
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            // Convert mouse coordinates to normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            // Find intersected objects (you would need to implement this)
            const intersects = this.raycastObjects(this.scene.children);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                this.effects.depthOfField.focusOnObject(clickedObject, this.camera);
                console.log(`Focused on object at distance: ${clickedObject.position.distanceTo(this.camera.position)}`);
            }
        });
        
        // Mouse wheel to adjust bloom intensity
        canvas.addEventListener('wheel', (event) => {
            const currentIntensity = this.effects.bloom.intensity;
            const newIntensity = currentIntensity + (event.deltaY > 0 ? -0.1 : 0.1);
            this.effects.bloom.setIntensity(Math.max(0, newIntensity));
            console.log(`Bloom intensity: ${this.effects.bloom.intensity.toFixed(2)}`);
        });
    }
    
    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        
        switch (key) {
            // Quality settings
            case '1':
                this.pipeline.applyPreset('performance');
                console.log('Applied performance preset');
                break;
                
            case '2':
                this.pipeline.applyPreset('balanced');
                console.log('Applied balanced preset');
                break;
                
            case '3':
                this.pipeline.applyPreset('quality');
                console.log('Applied quality preset');
                break;
            
            // Toggle individual effects
            case 'b':
                this.effects.bloom.setEnabled(!this.effects.bloom.enabled);
                console.log(`Bloom ${this.effects.bloom.enabled ? 'enabled' : 'disabled'}`);
                break;
                
            case 'd':
                this.effects.depthOfField.setEnabled(!this.effects.depthOfField.enabled);
                console.log(`Depth of Field ${this.effects.depthOfField.enabled ? 'enabled' : 'disabled'}`);
                break;
                
            case 's':
                this.effects.ssao.setEnabled(!this.effects.ssao.enabled);
                console.log(`SSAO ${this.effects.ssao.enabled ? 'enabled' : 'disabled'}`);
                break;
                
            case 'c':
                this.effects.chromatic.setEnabled(!this.effects.chromatic.enabled);
                console.log(`Chromatic Aberration ${this.effects.chromatic.enabled ? 'enabled' : 'disabled'}`);
                break;
            
            // Effect-specific adjustments
            case 'arrowup':
                // Increase bloom intensity
                const bloomIntensity = this.effects.bloom.intensity + 0.1;
                this.effects.bloom.setIntensity(bloomIntensity);
                console.log(`Bloom intensity: ${bloomIntensity.toFixed(2)}`);
                break;
                
            case 'arrowdown':
                // Decrease bloom intensity
                const newBloomIntensity = Math.max(0, this.effects.bloom.intensity - 0.1);
                this.effects.bloom.setIntensity(newBloomIntensity);
                console.log(`Bloom intensity: ${newBloomIntensity.toFixed(2)}`);
                break;
                
            case 'arrowleft':
                // Decrease focus distance
                const newFocusDistance = Math.max(1, this.effects.depthOfField.focusDistance - 1);
                this.effects.depthOfField.setFocusDistance(newFocusDistance);
                console.log(`Focus distance: ${newFocusDistance.toFixed(1)}`);
                break;
                
            case 'arrowright':
                // Increase focus distance
                const increasedFocusDistance = this.effects.depthOfField.focusDistance + 1;
                this.effects.depthOfField.setFocusDistance(increasedFocusDistance);
                console.log(`Focus distance: ${increasedFocusDistance.toFixed(1)}`);
                break;
            
            // Presets for chromatic aberration
            case 'q':
                this.effects.chromatic.applyPreset('subtle');
                console.log('Applied subtle chromatic aberration');
                break;
                
            case 'w':
                this.effects.chromatic.applyPreset('moderate');
                console.log('Applied moderate chromatic aberration');
                break;
                
            case 'e':
                this.effects.chromatic.applyPreset('strong');
                console.log('Applied strong chromatic aberration');
                break;
                
            case 'r':
                this.effects.chromatic.applyPreset('cinematic');
                console.log('Applied cinematic chromatic aberration');
                break;
                
            case 't':
                this.effects.chromatic.simulatePrismEffect();
                console.log('Applied prism effect');
                break;
            
            // Performance monitoring
            case 'p':
                this.showPerformanceStats();
                break;
                
            case 'h':
                this.showHelp();
                break;
        }
    }
    
    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        // Update animation time
        this.animationTime = (currentTime - this.lastTime) * 0.001;
        this.lastTime = currentTime;
        
        // Update animated effects
        this.updateAnimatedEffects();
        
        // Render scene with post-processing
        this.pipeline.render(this.scene, this.camera, null, currentTime * 0.001);
    }
    
    updateAnimatedEffects() {
        // Update animated chromatic aberration
        if (this.effects.chromatic.animate) {
            this.effects.chromatic.setAngle(Math.sin(this.animationTime * 0.5) * Math.PI);
        }
        
        // Update temporal effects with time
        Object.values(this.effects).forEach(effect => {
            if (effect.temporalEnabled) {
                // Temporal effects can use time for smooth transitions
            }
        });
    }
    
    showPerformanceStats() {
        const stats = this.pipeline.getStats();
        console.log('=== Post-Processing Performance Stats ===');
        console.log(`Enabled: ${stats.enabled}`);
        console.log(`Effect Count: ${stats.effectCount}`);
        console.log(`Frame Time: ${stats.frameTime.toFixed(2)}ms`);
        console.log(`Average FPS: ${stats.averageFPS.toFixed(1)}`);
        console.log('Active Effects:');
        stats.effects.forEach(effect => {
            console.log(`  - ${effect.type}: ${effect.enabled ? 'ON' : 'OFF'} (${effect.quality})`);
        });
    }
    
    showHelp() {
        console.log('=== Post-Processing Controls ===');
        console.log('Quality Presets:');
        console.log('  1 - Performance (optimized for speed)');
        console.log('  2 - Balanced (quality vs performance)');
        console.log('  3 - Quality (maximum quality)');
        console.log('');
        console.log('Effect Toggles:');
        console.log('  B - Toggle Bloom Effect');
        console.log('  D - Toggle Depth of Field');
        console.log('  S - Toggle SSAO Effect');
        console.log('  C - Toggle Chromatic Aberration');
        console.log('');
        console.log('Parameter Adjustments:');
        console.log('  ↑/↓ - Bloom Intensity');
        console.log('  ←/→ - Focus Distance');
        console.log('  Mouse Click - Focus on clicked object');
        console.log('  Mouse Wheel - Bloom Intensity');
        console.log('');
        console.log('Chromatic Aberration Presets:');
        console.log('  Q - Subtle');
        console.log('  W - Moderate');
        console.log('  E - Strong');
        console.log('  R - Cinematic');
        console.log('  T - Prism Effect');
        console.log('');
        console.log('Other:');
        console.log('  P - Show Performance Stats');
        console.log('  H - Show this help');
    }
    
    raycastObjects(objects) {
        // Simplified raycast implementation
        // In a real application, you would use a proper raycaster
        return [];
    }
    
    // Cleanup method
    dispose() {
        if (this.pipeline) {
            this.pipeline.dispose();
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Example usage
export function initPostProcessingExample(renderer, scene, camera) {
    return new PostProcessingExample(renderer, scene, camera);
}

// Export for use in other modules
export default PostProcessingExample;
