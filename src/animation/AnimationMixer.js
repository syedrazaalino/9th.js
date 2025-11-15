/**
 * AnimationMixer.js - Manages and blends multiple animation clips
 * Handles playback, timing, and mixing of animations for objects
 */

import AnimationClip from './AnimationClip.js';
import AnimationUtils from './AnimationUtils.js';

/**
 * Blend modes for animation mixing
 */
export const BlendMode = {
    NORMAL: 'normal',
    ADD: 'add',
    SUBTRACT: 'subtract',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    SOFT_LIGHT: 'soft-light',
    HARD_LIGHT: 'hard-light',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn'
};

/**
 * AnimationMixer - Manages multiple animation clips for objects
 */
class AnimationMixer {
    /**
     * @param {Object} root - root object to animate
     * @param {Object} options - mixer options
     */
    constructor(root = null, options = {}) {
        this.root = root;
        this.clips = [];
        this._actions = new Map(); // clip name -> action
        this.time = 0;
        this.timeScale = options.timeScale || 1.0;
        this.loop = options.loop || false;
        this.blendMode = options.blendMode || BlendMode.NORMAL;
        this.enabled = options.enabled !== false;
        this.startTime = options.startTime || 0;
        
        // Playback state
        this.playing = false;
        this.paused = false;
        this._startTime = 0;
        
        // Callback functions
        this.onStart = options.onStart || null;
        this.onEnd = options.onEnd || null;
        this.onLoop = options.onLoop || null;
        this.onUpdate = options.onUpdate || null;
        this.onCrossFade = options.onCrossFade || null;
        
        // Performance tracking
        this._lastUpdateTime = 0;
        this._deltaAccumulator = 0;
        
        // Action blending queue
        this._blendQueue = [];
        this._fadingActions = new Set();
        
        // Event system
        this._listeners = new Map();
    }

    /**
     * Add an animation clip to the mixer
     * @param {AnimationClip} clip - clip to add
     * @param {Object} options - action options
     * @returns {AnimationAction} created action
     */
    addClip(clip, options = {}) {
        if (!clip) return null;
        
        const action = new AnimationAction(clip, {
            mixer: this,
            loop: options.loop !== undefined ? options.loop : this.loop,
            timeScale: options.timeScale || 1.0,
            weight: options.weight || 1.0,
            enabled: options.enabled !== false,
            blendMode: options.blendMode || this.blendMode
        });
        
        this.clips.push(clip);
        this._actions.set(clip.name, action);
        
        // Start immediately if specified
        if (options.play !== false) {
            action.play();
        }
        
        return action;
    }

    /**
     * Remove a clip from the mixer
     * @param {string|AnimationClip} clip - clip name or clip object
     */
    removeClip(clip) {
        let clipToRemove = clip;
        if (typeof clip === 'string') {
            clipToRemove = this.clips.find(c => c.name === clip);
        }
        
        if (clipToRemove) {
            const index = this.clips.indexOf(clipToRemove);
            if (index !== -1) {
                this.clips.splice(index, 1);
                this._actions.delete(clipToRemove.name);
            }
        }
    }

    /**
     * Get an animation action by clip name
     * @param {string} name - clip name
     * @returns {AnimationAction|null} action or null
     */
    getAction(name) {
        return this._actions.get(name) || null;
    }

    /**
     * Play a clip by name
     * @param {string} name - clip name
     * @param {number} fadeInDuration - fade in duration
     * @returns {AnimationAction} played action
     */
    play(name, fadeInDuration = 0) {
        const action = this.getAction(name);
        if (action) {
            action.play();
            if (fadeInDuration > 0) {
                action.fadeIn(fadeInDuration);
            }
        }
        return action;
    }

    /**
     * Stop a clip by name
     * @param {string} name - clip name
     * @param {number} fadeOutDuration - fade out duration
     * @returns {AnimationAction} stopped action
     */
    stop(name, fadeOutDuration = 0) {
        const action = this.getAction(name);
        if (action) {
            if (fadeOutDuration > 0) {
                action.fadeOut(fadeOutDuration);
            } else {
                action.stop();
            }
        }
        return action;
    }

    /**
     * Cross fade between two clips
     * @param {string} fromName - source clip name
     * @param {string} toName - destination clip name
     * @param {number} duration - cross fade duration
     * @param {boolean} playTo - whether to play destination clip
     */
    crossFade(fromName, toName, duration = 0.3, playTo = true) {
        const fromAction = this.getAction(fromName);
        const toAction = this.getAction(toName);
        
        if (fromAction && toAction) {
            if (playTo) {
                toAction.play();
            }
            
            fromAction.fadeOut(duration);
            toAction.fadeIn(duration);
            
            // Add to blend queue for tracking
            this._blendQueue.push({
                from: fromAction,
                to: toAction,
                startTime: this.time,
                duration: duration,
                type: 'crossFade'
            });
            
            if (this.onCrossFade) {
                this.onCrossFade(fromAction, toAction, duration);
            }
        }
    }

    /**
     * Cross fade from all clips to a specific clip
     * @param {string} toName - destination clip name
     * @param {number} duration - cross fade duration
     */
    crossFadeTo(toName, duration = 0.3) {
        const toAction = this.getAction(toName);
        if (toAction) {
            toAction.play();
            
            for (const action of this._actions.values()) {
                if (action !== toAction && action.isPlaying()) {
                    action.fadeOut(duration);
                }
            }
        }
    }

    /**
     * Fade in a specific clip
     * @param {string} name - clip name
     * @param {number} duration - fade duration
     */
    fadeIn(name, duration = 0.3) {
        const action = this.getAction(name);
        if (action) {
            action.fadeIn(duration);
        }
    }

    /**
     * Fade out a specific clip
     * @param {string} name - clip name
     * @param {number} duration - fade duration
     */
    fadeOut(name, duration = 0.3) {
        const action = this.getAction(name);
        if (action) {
            action.fadeOut(duration);
        }
    }

    /**
     * Set weight for a specific clip
     * @param {string} name - clip name
     * @param {number} weight - weight value (0-1)
     */
    setWeight(name, weight) {
        const action = this.getAction(name);
        if (action) {
            action.setWeight(weight);
        }
    }

    /**
     * Get weight for a specific clip
     * @param {string} name - clip name
     * @returns {number} weight value
     */
    getWeight(name) {
        const action = this.getAction(name);
        return action ? action.getWeight() : 0;
    }

    /**
     * Update the mixer
     * @param {number} deltaTime - delta time in seconds
     */
    update(deltaTime) {
        if (!this.enabled) return;
        
        const scaledDelta = deltaTime * this.timeScale;
        this.time += scaledDelta;
        
        // Update all actions
        for (const action of this._actions.values()) {
            action.update(scaledDelta);
        }
        
        // Update blend queue
        this._updateBlendQueue();
        
        // Apply mixed result to root object
        this._applyToRoot();
        
        // Trigger update callback
        if (this.onUpdate) {
            this.onUpdate(this, deltaTime);
        }
    }

    /**
     * Update blend queue for cross fades
     * @private
     */
    _updateBlendQueue() {
        const currentTime = this.time;
        
        for (let i = this._blendQueue.length - 1; i >= 0; i--) {
            const blend = this._blendQueue[i];
            const elapsed = currentTime - blend.startTime;
            
            if (elapsed >= blend.duration) {
                // Blend complete
                this._blendQueue.splice(i, 1);
            } else {
                // Update blend weights
                const alpha = AnimationUtils.ease(elapsed / blend.duration, 'ease-in-out');
                const fromWeight = 1 - alpha;
                const toWeight = alpha;
                
                blend.from.setWeight(fromWeight);
                blend.to.setWeight(toWeight);
            }
        }
    }

    /**
     * Apply mixed animation values to root object
     * @private
     */
    _applyToRoot() {
        if (!this.root) return;
        
        // Collect all evaluated values
        const blendedValues = {};
        const weights = {};
        
        // First pass: evaluate all clips and collect values
        for (const action of this._actions.values()) {
            if (!action.isPlaying() || action.getWeight() <= 0) continue;
            
            const values = action.evaluate();
            const weight = action.getWeight();
            
            for (const [property, value] of Object.entries(values)) {
                if (!blendedValues[property]) {
                    blendedValues[property] = [];
                    weights[property] = [];
                }
                
                blendedValues[property].push(value);
                weights[property].push(weight);
            }
        }
        
        // Second pass: blend values for each property
        for (const [property, values] of Object.entries(blendedValues)) {
            const totalWeight = weights[property].reduce((sum, w) => sum + w, 0);
            if (totalWeight <= 0) continue;
            
            let blendedValue;
            
            if (typeof values[0] === 'number') {
                // Simple numeric blending
                blendedValue = values.reduce((sum, value, index) => 
                    sum + value * weights[property][index], 0) / totalWeight;
            } else if (Array.isArray(values[0])) {
                // Array blending
                blendedValue = values[0].map((_, i) => 
                    values.reduce((sum, arr, index) => 
                        sum + arr[i] * weights[property][index], 0) / totalWeight
                );
            } else {
                // For complex objects, use weighted average of first value
                blendedValue = values[0];
            }
            
            // Apply to root object
            this._applyValueToProperty(this.root, property, blendedValue);
        }
    }

    /**
     * Apply a value to a property on an object
     * @param {Object} target - target object
     * @param {string} property - property path
     * @param {*} value - value to apply
     * @private
     */
    _applyValueToProperty(target, property, value) {
        // Handle nested properties (e.g., "position.x")
        const parts = property.split('.');
        let current = target;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }

    /**
     * Stop all animations
     */
    stopAll() {
        for (const action of this._actions.values()) {
            action.stop();
        }
    }

    /**
     * Pause all animations
     */
    pauseAll() {
        for (const action of this._actions.values()) {
            action.pause();
        }
    }

    /**
     * Resume all animations
     */
    resumeAll() {
        for (const action of this._actions.values()) {
            action.resume();
        }
    }

    /**
     * Get all playing actions
     * @returns {Array} array of playing actions
     */
    getPlayingActions() {
        return Array.from(this._actions.values()).filter(action => action.isPlaying());
    }

    /**
     * Set time scale for all animations
     * @param {number} timeScale - time scale factor
     */
    setTimeScale(timeScale) {
        this.timeScale = timeScale;
        for (const action of this._actions.values()) {
            action.setTimeScale(timeScale);
        }
    }

    /**
     * Get the number of clips
     * @returns {number} number of clips
     */
    getNumClips() {
        return this.clips.length;
    }

    /**
     * Get mixer time
     * @returns {number} current time
     */
    getTime() {
        return this.time;
    }

    /**
     * Set mixer time
     * @param {number} time - time to set
     */
    setTime(time) {
        this.time = time;
        for (const action of this._actions.values()) {
            action.setTime(time);
        }
    }

    /**
     * Clone the mixer
     * @returns {AnimationMixer} cloned mixer
     */
    clone() {
        const cloned = new AnimationMixer(this.root, {
            timeScale: this.timeScale,
            loop: this.loop,
            blendMode: this.blendMode,
            enabled: this.enabled,
            startTime: this.startTime,
            onStart: this.onStart,
            onEnd: this.onEnd,
            onLoop: this.onLoop,
            onUpdate: this.onUpdate,
            onCrossFade: this.onCrossFade
        });
        
        // Clone all clips
        for (const clip of this.clips) {
            const clonedClip = clip.clone();
            const action = cloned.addClip(clonedClip);
            const originalAction = this._actions.get(clip.name);
            if (originalAction) {
                action.setWeight(originalAction.getWeight());
                action.setTimeScale(originalAction.getTimeScale());
            }
        }
        
        return cloned;
    }
}

/**
 * AnimationAction - Represents a single animation clip in a mixer
 */
class AnimationAction {
    /**
     * @param {AnimationClip} clip - animation clip
     * @param {Object} options - action options
     */
    constructor(clip, options = {}) {
        this.clip = clip;
        this.mixer = options.mixer;
        this.loop = options.loop || false;
        this.timeScale = options.timeScale || 1.0;
        this.weight = options.weight || 1.0;
        this.enabled = options.enabled !== false;
        this.blendMode = options.blendMode || BlendMode.NORMAL;
        
        // Playback state
        this.playing = false;
        this.paused = false;
        this.time = 0;
        this.localTime = 0;
        
        // Fade state
        this._fadeStartWeight = this.weight;
        this._fadeTargetWeight = this.weight;
        this._fadeStartTime = 0;
        this._fadeDuration = 0;
        this._isFading = false;
        
        // Callbacks
        this.onStart = options.onStart || null;
        this.onEnd = options.onEnd || null;
        this.onLoop = options.onLoop || null;
        this.onUpdate = options.onUpdate || null;
    }

    /**
     * Play the animation
     */
    play() {
        if (!this.enabled) return;
        
        this.playing = true;
        this.paused = false;
        
        if (this.onStart) {
            this.onStart(this);
        }
    }

    /**
     * Stop the animation
     */
    stop() {
        this.playing = false;
        this.paused = false;
        this.time = 0;
        this.localTime = 0;
        this.weight = 0;
        this._isFading = false;
        
        if (this.onEnd) {
            this.onEnd(this);
        }
    }

    /**
     * Pause the animation
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resume the animation
     */
    resume() {
        this.paused = false;
    }

    /**
     * Update the action
     * @param {number} deltaTime - delta time
     */
    update(deltaTime) {
        if (!this.playing || this.paused) return;
        
        // Handle fading
        this._updateFading();
        
        // Update time
        this.time += deltaTime;
        this.localTime = this.time * this.timeScale;
        
        // Handle looping
        if (this.loop && this.clip.duration > 0) {
            const wrappedTime = this.localTime % this.clip.duration;
            if (wrappedTime < this.localTime - deltaTime * this.timeScale) {
                if (this.onLoop) {
                    this.onLoop(this);
                }
            }
            this.localTime = wrappedTime;
        } else if (this.localTime > this.clip.duration) {
            this.playing = false;
            if (this.onEnd) {
                this.onEnd(this);
            }
        }
        
        if (this.onUpdate) {
            this.onUpdate(this, deltaTime);
        }
    }

    /**
     * Update fading state
     * @private
     */
    _updateFading() {
        if (!this._isFading) return;
        
        const elapsed = this.mixer.getTime() - this._fadeStartTime;
        const alpha = Math.min(elapsed / this._fadeDuration, 1);
        
        this.weight = AnimationUtils.lerp(
            this._fadeStartWeight,
            this._fadeTargetWeight,
            AnimationUtils.ease(alpha, 'ease-in-out')
        );
        
        if (alpha >= 1) {
            this._isFading = false;
        }
    }

    /**
     * Fade in animation
     * @param {number} duration - fade duration
     */
    fadeIn(duration = 0.3) {
        this._fadeStartWeight = this.weight;
        this._fadeTargetWeight = 1.0;
        this._fadeStartTime = this.mixer.getTime();
        this._fadeDuration = duration;
        this._isFading = true;
    }

    /**
     * Fade out animation
     * @param {number} duration - fade duration
     */
    fadeOut(duration = 0.3) {
        this._fadeStartWeight = this.weight;
        this._fadeTargetWeight = 0.0;
        this._fadeStartTime = this.mixer.getTime();
        this._fadeDuration = duration;
        this._isFading = true;
    }

    /**
     * Set weight
     * @param {number} weight - weight value
     */
    setWeight(weight) {
        this.weight = AnimationUtils.clamp(weight, 0, 1);
    }

    /**
     * Get weight
     * @returns {number} weight
     */
    getWeight() {
        return this.weight;
    }

    /**
     * Set time scale
     * @param {number} timeScale - time scale
     */
    setTimeScale(timeScale) {
        this.timeScale = Math.max(0, timeScale);
    }

    /**
     * Get time scale
     * @returns {number} time scale
     */
    getTimeScale() {
        return this.timeScale;
    }

    /**
     * Set time
     * @param {number} time - time
     */
    setTime(time) {
        this.time = time;
        this.localTime = time * this.timeScale;
    }

    /**
     * Check if animation is playing
     * @returns {boolean} playing state
     */
    isPlaying() {
        return this.playing && !this.paused;
    }

    /**
     * Evaluate clip at current time
     * @returns {Object} evaluated values
     */
    evaluate() {
        return this.clip.evaluate(this.localTime, this.mixer.root);
    }
}

export { AnimationAction };

export { AnimationMixer };
export default AnimationMixer;
