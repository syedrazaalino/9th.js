/**
 * Post-Processing Effects Module
 * Exports all available post-processing effects
 */

export { default as BloomEffect } from './BloomEffect.js';
export { default as DepthOfFieldEffect } from './DepthOfFieldEffect.js';
export { default as SSAOEffect } from './SSAOEffect.js';
export { default as ChromaticAberration } from './ChromaticAberration.js';
export { default as PostProcessingExample } from './PostProcessingExample.js';

/**
 * PostProcessingPipeline - Manages multiple post-processing effects
 */
class PostProcessingPipeline {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.effects = [];
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.autoQuality = options.autoQuality !== undefined ? options.autoQuality : false;
        
        // Performance monitoring
        this.frameTime = 0;
        this.targetFrameTime = options.targetFrameTime || 16.67; // 60 FPS
        this.qualityAdjustmentEnabled = options.qualityAdjustmentEnabled !== undefined ? 
            options.qualityAdjustmentEnabled : true;
    }
    
    /**
     * Add a post-processing effect to the pipeline
     */
    addEffect(effect) {
        if (effect && typeof effect.render === 'function') {
            this.effects.push(effect);
            return true;
        }
        console.warn('Invalid effect added to pipeline');
        return false;
    }
    
    /**
     * Remove a post-processing effect from the pipeline
     */
    removeEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index !== -1) {
            this.effects.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Get an effect by type
     */
    getEffect(effectType) {
        return this.effects.find(effect => effect instanceof effectType);
    }
    
    /**
     * Enable or disable all effects
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.effects.forEach(effect => {
            if (effect.setEnabled) {
                effect.setEnabled(enabled);
            }
        });
    }
    
    /**
     * Render the post-processing pipeline
     */
    render(scene, camera, target, time) {
        if (!this.enabled || this.effects.length === 0) {
            return;
        }
        
        const startTime = performance.now();
        let currentTarget = target;
        
        // Chain effects together
        for (let i = 0; i < this.effects.length; i++) {
            const effect = this.effects[i];
            
            // Render each effect in sequence
            effect.render(scene, camera, currentTarget, time);
            
            // Update performance monitoring
            if (this.qualityAdjustmentEnabled) {
                this._updatePerformanceMonitoring();
            }
        }
        
        const endTime = performance.now();
        this.frameTime = endTime - startTime;
    }
    
    /**
     * Update all effects when renderer size changes
     */
    updateSize(width, height) {
        this.effects.forEach(effect => {
            if (effect.updateSize) {
                effect.updateSize(width, height);
            }
        });
    }
    
    /**
     * Update quality settings for all effects
     */
    updateQuality(quality) {
        this.effects.forEach(effect => {
            if (effect.updateQuality) {
                effect.updateQuality(quality);
            }
        });
    }
    
    /**
     * Set quality level ('low', 'medium', 'high')
     */
    setQuality(quality) {
        this.updateQuality(quality);
    }
    
    /**
     * Apply preset configurations
     */
    applyPreset(presetName) {
        const presets = this._getPresets();
        const preset = presets[presetName];
        
        if (preset) {
            this.effects.forEach(effect => {
                if (effect.constructor.name in preset) {
                    Object.assign(effect, preset[effect.constructor.name]);
                }
            });
        }
    }
    
    /**
     * Get preset configurations
     */
    _getPresets() {
        return {
            performance: {
                'BloomEffect': { quality: 'low', intensity: 1.0 },
                'DepthOfFieldEffect': { quality: 'low', maxBlur: 5.0 },
                'SSAOEffect': { quality: 'low', sampleCount: 8 },
                'ChromaticAberration': { quality: 'low', intensity: 0.001 }
            },
            balanced: {
                'BloomEffect': { quality: 'medium', intensity: 1.2 },
                'DepthOfFieldEffect': { quality: 'medium', maxBlur: 8.0 },
                'SSAOEffect': { quality: 'medium', sampleCount: 16 },
                'ChromaticAberration': { quality: 'medium', intensity: 0.002 }
            },
            quality: {
                'BloomEffect': { quality: 'high', intensity: 1.5 },
                'DepthOfFieldEffect': { quality: 'high', maxBlur: 12.0 },
                'SSAOEffect': { quality: 'high', sampleCount: 32 },
                'ChromaticAberration': { quality: 'high', intensity: 0.003 }
            }
        };
    }
    
    /**
     * Monitor performance and adjust quality if needed
     */
    _updatePerformanceMonitoring() {
        if (!this.autoQuality || !this.qualityAdjustmentEnabled) {
            return;
        }
        
        const maxFrameTime = this.targetFrameTime * 1.5; // Allow 50% overhead
        const minFrameTime = this.targetFrameTime * 0.7; // Optimize if running faster
        
        if (this.frameTime > maxFrameTime) {
            // Performance is poor, reduce quality
            this._adjustQuality('down');
        } else if (this.frameTime < minFrameTime) {
            // Performance is good, increase quality
            this._adjustQuality('up');
        }
    }
    
    /**
     * Adjust quality based on performance
     */
    _adjustQuality(direction) {
        const qualityLevels = ['low', 'medium', 'high'];
        
        this.effects.forEach(effect => {
            if (effect.quality !== undefined) {
                const currentIndex = qualityLevels.indexOf(effect.quality);
                let newIndex = currentIndex;
                
                if (direction === 'down' && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                } else if (direction === 'up' && currentIndex < qualityLevels.length - 1) {
                    newIndex = currentIndex + 1;
                }
                
                if (newIndex !== currentIndex) {
                    const newQuality = qualityLevels[newIndex];
                    effect.updateQuality(newQuality);
                    console.log(`Adjusted ${effect.constructor.name} quality to ${newQuality}`);
                }
            }
        });
    }
    
    /**
     * Get pipeline statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            effectCount: this.effects.length,
            frameTime: this.frameTime,
            averageFPS: this.frameTime > 0 ? (1000 / this.frameTime) : 0,
            effects: this.effects.map(effect => ({
                type: effect.constructor.name,
                enabled: effect.enabled !== false,
                quality: effect.quality || 'unknown'
            }))
        };
    }
    
    /**
     * Dispose all effects and clean up resources
     */
    dispose() {
        this.effects.forEach(effect => {
            if (effect.dispose) {
                effect.dispose();
            }
        });
        this.effects = [];
    }
    
    /**
     * Toggle automatic quality adjustment
     */
    setAutoQuality(enabled) {
        this.autoQuality = enabled;
    }
    
    /**
     * Create a default post-processing setup
     */
    static createDefault(renderer) {
        const pipeline = new PostProcessingPipeline(renderer);
        
        // Add default effects
        const bloom = new BloomEffect(renderer);
        const dof = new DepthOfFieldEffect(renderer);
        const ssao = new SSAOEffect(renderer);
        const chromatic = new ChromaticAberration(renderer);
        
        pipeline.addEffect(bloom);
        pipeline.addEffect(dof);
        pipeline.addEffect(ssao);
        pipeline.addEffect(chromatic);
        
        return pipeline;
    }
}

export { PostProcessingPipeline };

// Default export removed for UMD compatibility
// Use named exports instead
