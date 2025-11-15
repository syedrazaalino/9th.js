/**
 * AnimationClip.js - Manages animation clips composed of multiple tracks
 * Supports timing, blending, and control over animation playback
 */

import KeyframeTrack from './KeyframeTrack.js';
import AnimationUtils from './AnimationUtils.js';

/**
 * AnimationClip - Container for multiple keyframe tracks
 */
class AnimationClip {
    /**
     * @param {string} name - clip name
     * @param {number} duration - clip duration in seconds
     * @param {Array} tracks - array of keyframe tracks
     * @param {Object} options - clip options
     */
    constructor(name = 'AnimationClip', duration = 0, tracks = [], options = {}) {
        this.name = name;
        this.duration = duration;
        this.tracks = tracks || [];
        this.loop = options.loop || false;
        this.timeScale = options.timeScale || 1.0;
        this.fadeIn = options.fadeIn || 0;
        this.fadeOut = options.fadeOut || 0;
        this.weight = options.weight || 1.0;
        this.enabled = options.enabled !== false;
        this.blendMode = options.blendMode || 'normal'; // normal, additive
        this.easing = options.easing || 'linear';
        
        // Calculate duration if not provided
        if (duration === 0 && tracks.length > 0) {
            this.duration = this._calculateDuration();
        }
        
        // Track lookup map for fast access
        this._trackMap = new Map();
        this._rebuildTrackMap();
        
        // Playback state
        this.time = 0;
        this.playing = false;
        this.paused = false;
        
        // Callbacks
        this.onStart = options.onStart || null;
        this.onEnd = options.onEnd || null;
        this.onLoop = options.onLoop || null;
        this.onUpdate = options.onUpdate || null;
    }

    /**
     * Calculate duration from tracks
     * @returns {number} duration
     * @private
     */
    _calculateDuration() {
        let maxDuration = 0;
        for (const track of this.tracks) {
            const trackDuration = track.getDuration();
            if (trackDuration > maxDuration) {
                maxDuration = trackDuration;
            }
        }
        return maxDuration;
    }

    /**
     * Rebuild track lookup map
     * @private
     */
    _rebuildTrackMap() {
        this._trackMap.clear();
        for (const track of this.tracks) {
            this._trackMap.set(track.name, track);
        }
    }

    /**
     * Add a keyframe track to the clip
     * @param {KeyframeTrack} track - track to add
     */
    addTrack(track) {
        if (track && !this.tracks.includes(track)) {
            this.tracks.push(track);
            this._trackMap.set(track.name, track);
            
            // Update duration if necessary
            const trackDuration = track.getDuration();
            if (trackDuration > this.duration) {
                this.duration = trackDuration;
            }
        }
    }

    /**
     * Remove a keyframe track from the clip
     * @param {string|KeyframeTrack} track - track name or track to remove
     */
    removeTrack(track) {
        let trackToRemove = track;
        if (typeof track === 'string') {
            trackToRemove = this._trackMap.get(track);
        }
        
        if (trackToRemove) {
            const index = this.tracks.indexOf(trackToRemove);
            if (index !== -1) {
                this.tracks.splice(index, 1);
                this._trackMap.delete(trackToRemove.name);
                
                // Recalculate duration
                if (this.tracks.length > 0) {
                    this.duration = this._calculateDuration();
                } else {
                    this.duration = 0;
                }
            }
        }
    }

    /**
     * Get track by name
     * @param {string} name - track name
     * @returns {KeyframeTrack|null} track or null
     */
    getTrack(name) {
        return this._trackMap.get(name) || null;
    }

    /**
     * Get all tracks for a specific property
     * @param {string} property - property name
     * @returns {Array} array of tracks
     */
    getTracksByProperty(property) {
        return this.tracks.filter(track => track.name.includes(property));
    }

    /**
     * Evaluate all tracks at a specific time
     * @param {number} time - time to evaluate
     * @param {Object} target - target object to apply values to
     * @returns {Object} evaluated values
     */
    evaluate(time, target = {}) {
        const values = {};
        
        for (const track of this.tracks) {
            if (!track.enabled) continue;
            
            const value = track.getValue(time);
            if (value !== null && value !== undefined) {
                // Apply weight and easing if configured
                let processedValue = value;
                
                if (this.fadeIn > 0) {
                    const fadeProgress = Math.min(time / this.fadeIn, 1);
                    processedValue = this._applyFadeIn(processedValue, fadeProgress);
                }
                
                if (this.fadeOut > 0) {
                    const timeToEnd = this.duration - time;
                    const fadeProgress = Math.min(timeToEnd / this.fadeOut, 1);
                    processedValue = this._applyFadeOut(processedValue, fadeProgress);
                }
                
                // Apply weight
                if (this.weight !== 1.0) {
                    processedValue = this._applyWeight(processedValue, this.weight);
                }
                
                values[track.name] = processedValue;
                
                // Apply to target if provided
                if (target && this._canApplyToTarget(track.name)) {
                    this._applyToTarget(target, track.name, processedValue);
                }
            }
        }
        
        return values;
    }

    /**
     * Check if property can be applied to target
     * @param {string} property - property name
     * @returns {boolean} true if can apply
     * @private
     */
    _canApplyToTarget(property) {
        // Basic property name validation
        return property && typeof property === 'string';
    }

    /**
     * Apply value to target object
     * @param {Object} target - target object
     * @param {string} property - property name
     * @param {*} value - value to apply
     * @private
     */
    _applyToTarget(target, property, value) {
        // Handle nested properties (e.g., "position.x", "rotation.y")
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
     * Apply fade in effect
     * @param {*} value - original value
     * @param {number} fadeProgress - fade progress (0-1)
     * @returns {*} faded value
     * @private
     */
    _applyFadeIn(value, fadeProgress) {
        if (typeof value === 'number') {
            return value * fadeProgress;
        }
        
        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'number' ? v * fadeProgress : v);
        }
        
        // For vectors and other objects, we can't easily apply weight
        return value;
    }

    /**
     * Apply fade out effect
     * @param {*} value - original value
     * @param {number} fadeProgress - fade progress (0-1)
     * @returns {*} faded value
     * @private
     */
    _applyFadeOut(value, fadeProgress) {
        if (typeof value === 'number') {
            return value * fadeProgress;
        }
        
        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'number' ? v * fadeProgress : v);
        }
        
        return value;
    }

    /**
     * Apply weight to value
     * @param {*} value - original value
     * @param {number} weight - weight factor
     * @returns {*} weighted value
     * @private
     */
    _applyWeight(value, weight) {
        if (typeof value === 'number') {
            return value * weight;
        }
        
        if (Array.isArray(value)) {
            return value.map(v => typeof v === 'number' ? v * weight : v);
        }
        
        return value;
    }

    /**
     * Play the animation clip
     * @param {number} startTime - optional start time
     */
    play(startTime = 0) {
        this.time = startTime;
        this.playing = true;
        this.paused = false;
        
        if (this.onStart) {
            this.onStart(this);
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
     * Stop the animation
     */
    stop() {
        this.playing = false;
        this.paused = false;
        this.time = 0;
    }

    /**
     * Update animation time
     * @param {number} deltaTime - delta time in seconds
     */
    update(deltaTime) {
        if (!this.playing || this.paused || !this.enabled) return;
        
        // Apply time scale
        const scaledDelta = deltaTime * this.timeScale;
        const previousTime = this.time;
        
        // Update time
        this.time += scaledDelta;
        
        // Handle looping
        if (this.loop && this.duration > 0) {
            const wrappedTime = this.time % this.duration;
            if (wrappedTime < previousTime % this.duration) {
                if (this.onLoop) {
                    this.onLoop(this);
                }
            }
            this.time = wrappedTime;
        } else if (this.time > this.duration) {
            this.time = this.duration;
            this.playing = false;
            
            if (this.onEnd) {
                this.onEnd(this);
            }
        }
        
        if (this.onUpdate) {
            this.onUpdate(this, this.time);
        }
    }

    /**
     * Set the current time of the animation
     * @param {number} time - time to set
     */
    setTime(time) {
        if (this.loop) {
            this.time = time % this.duration;
        } else {
            this.time = Math.max(0, Math.min(time, this.duration));
        }
    }

    /**
     * Get current normalized time (0-1)
     * @returns {number} normalized time
     */
    getNormalizedTime() {
        if (this.duration === 0) return 0;
        return this.time / this.duration;
    }

    /**
     * Create a clip from data
     * @param {Object} data - clip data
     * @returns {AnimationClip} created clip
     */
    static fromData(data) {
        const tracks = [];
        
        if (data.tracks) {
            for (const trackData of data.tracks) {
                const track = KeyframeTrack.fromJSON(trackData);
                tracks.push(track);
            }
        }
        
        return new AnimationClip(data.name, data.duration, tracks, {
            loop: data.loop,
            timeScale: data.timeScale,
            fadeIn: data.fadeIn,
            fadeOut: data.fadeOut,
            weight: data.weight,
            enabled: data.enabled,
            blendMode: data.blendMode,
            easing: data.easing
        });
    }

    /**
     * Create a simple animation clip
     * @param {string} name - clip name
     * @param {Object} properties - properties to animate
     * @param {number} duration - duration in seconds
     * @param {Object} options - clip options
     * @returns {AnimationClip} created clip
     */
    static createSimple(name, properties, duration, options = {}) {
        const tracks = [];
        
        for (const [propertyName, keyframes] of Object.entries(properties)) {
            const times = [];
            const values = [];
            
            for (const kf of keyframes) {
                times.push(kf.time);
                values.push(kf.value);
            }
            
            let TrackClass = KeyframeTrack;
            if (keyframes[0].value instanceof Vector3) {
                TrackClass = KeyframeTrack.Vector3KeyframeTrack;
            } else if (keyframes[0].value instanceof Vector2) {
                TrackClass = KeyframeTrack.Vector2KeyframeTrack;
            } else if (keyframes[0].value instanceof Quaternion) {
                TrackClass = KeyframeTrack.QuaternionKeyframeTrack;
            }
            
            const track = new TrackClass(propertyName, times, values);
            tracks.push(track);
        }
        
        return new AnimationClip(name, duration, tracks, options);
    }

    /**
     * Blend this clip with another
     * @param {AnimationClip} other - other clip
     * @param {number} alpha - blend factor (0-1)
     * @returns {AnimationClip} blended clip
     */
    blendWith(other, alpha = 0.5) {
        const blended = this.clone();
        blended.weight = this.weight * (1 - alpha) + other.weight * alpha;
        blended.time = this.time * (1 - alpha) + other.time * alpha;
        return blended;
    }

    /**
     * Clone the animation clip
     * @returns {AnimationClip} cloned clip
     */
    clone() {
        const clonedTracks = this.tracks.map(track => track.clone());
        const cloned = new AnimationClip(
            this.name + '_clone',
            this.duration,
            clonedTracks,
            {
                loop: this.loop,
                timeScale: this.timeScale,
                fadeIn: this.fadeIn,
                fadeOut: this.fadeOut,
                weight: this.weight,
                enabled: this.enabled,
                blendMode: this.blendMode,
                easing: this.easing,
                onStart: this.onStart,
                onEnd: this.onEnd,
                onLoop: this.onLoop,
                onUpdate: this.onUpdate
            }
        );
        cloned.time = this.time;
        cloned.playing = this.playing;
        cloned.paused = this.paused;
        return cloned;
    }

    /**
     * Serialize clip to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            name: this.name,
            duration: this.duration,
            tracks: this.tracks.map(track => track.toJSON()),
            loop: this.loop,
            timeScale: this.timeScale,
            fadeIn: this.fadeIn,
            fadeOut: this.fadeOut,
            weight: this.weight,
            enabled: this.enabled,
            blendMode: this.blendMode,
            easing: this.easing
        };
    }

    /**
     * Get clip duration
     * @returns {number} duration
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Check if clip has tracks
     * @returns {boolean} true if has tracks
     */
    hasTracks() {
        return this.tracks.length > 0;
    }

    /**
     * Get all track names
     * @returns {Array} array of track names
     */
    getTrackNames() {
        return this.tracks.map(track => track.name);
    }
}

export { AnimationClip };
export default AnimationClip;
