/**
 * Animation System Index
 * Exports all animation system components
 */

export { default as AnimationUtils, InterpolationType, EasingType } from './AnimationUtils.js';
export { default as KeyframeTrack } from './KeyframeTrack.js';
export {
    NumberKeyframeTrack,
    Vector2KeyframeTrack,
    Vector3KeyframeTrack,
    Vector4KeyframeTrack,
    QuaternionKeyframeTrack
} from './KeyframeTrack.js';
export { default as AnimationClip } from './AnimationClip.js';
export { default as AnimationMixer, BlendMode, AnimationAction } from './AnimationMixer.js';

// Re-export utilities for convenience
export { default as Utils } from './AnimationUtils.js';

// Animation presets and utilities
export const AnimationPresets = {
    /**
     * Create a position animation
     * @param {string} name - animation name
     * @param {Array} positions - array of {time, position} objects
     * @returns {AnimationClip} created animation
     */
    position: (name, positions) => {
        const times = positions.map(p => p.time);
        const values = positions.map(p => p.position);
        return AnimationClip.createSimple(name, { position: positions }, positions[positions.length - 1].time);
    },

    /**
     * Create a rotation animation
     * @param {string} name - animation name
     * @param {Array} rotations - array of {time, rotation} objects
     * @returns {AnimationClip} created animation
     */
    rotation: (name, rotations) => {
        return AnimationClip.createSimple(name, { rotation: rotations }, rotations[rotations.length - 1].time);
    },

    /**
     * Create a scale animation
     * @param {string} name - animation name
     * @param {Array} scales - array of {time, scale} objects
     * @returns {AnimationClip} created animation
     */
    scale: (name, scales) => {
        return AnimationClip.createSimple(name, { scale: scales }, scales[scales.length - 1].time);
    },

    /**
     * Create a color animation
     * @param {string} name - animation name
     * @param {Array} colors - array of {time, color} objects
     * @returns {AnimationClip} created animation
     */
    color: (name, colors) => {
        return AnimationClip.createSimple(name, { color: colors }, colors[colors.length - 1].time);
    }
};

// Animation helper functions
export const AnimationHelpers = {
    /**
     * Create a timeline with multiple clips
     * @param {Object} timeline - timeline configuration
     * @returns {Array} array of animation clips
     */
    createTimeline: (timeline) => {
        const clips = [];
        for (const [name, config] of Object.entries(timeline)) {
            const { properties, duration, tracks = [] } = config;
            
            if (tracks.length > 0) {
                // Create from raw tracks
                clips.push(new AnimationClip(name, duration, tracks));
            } else if (properties) {
                // Create from properties
                clips.push(AnimationClip.createSimple(name, properties, duration));
            }
        }
        return clips;
    },

    /**
     * Create a bouncing animation
     * @param {string} name - animation name
     * @param {Vector3} start - start position
     * @param {Vector3} end - end position
     * @param {number} duration - duration in seconds
     * @param {number} bounces - number of bounces
     * @returns {AnimationClip} created animation
     */
    bounce: (name, start, end, duration, bounces = 3) => {
        const tracks = [];
        const times = [];
        const values = [];
        
        // Create bounce keyframes
        for (let i = 0; i <= bounces * 2; i++) {
            const time = (duration / (bounces * 2)) * i;
            const progress = time / duration;
            const bounceHeight = Math.sin(progress * Math.PI * bounces) * 0.5 + 0.5;
            
            // Calculate bounce position
            const x = AnimationUtils.linear(progress, start.x, end.x);
            const y = start.y + (end.y - start.y) * bounceHeight;
            const z = AnimationUtils.linear(progress, start.z, end.z);
            
            times.push(time);
            values.push(new Vector3(x, y, z));
        }
        
        const track = new Vector3KeyframeTrack('position', times, values);
        return new AnimationClip(name, duration, [track]);
    },

    /**
     * Create a rotation animation
     * @param {string} name - animation name
     * @param {Vector3} axis - rotation axis
     * @param {number} angle - rotation angle in radians
     * @param {number} duration - duration in seconds
     * @returns {AnimationClip} created animation
     */
    rotate: (name, axis, angle, duration) => {
        const times = [0, duration];
        const values = [
            new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0),
            new Quaternion().setFromAxisAngle(axis, angle)
        ];
        
        const track = new QuaternionKeyframeTrack('rotation', times, values);
        return new AnimationClip(name, duration, [track]);
    },

    /**
     * Create a fade animation
     * @param {string} name - animation name
     * @param {number} from - start opacity (0-1)
     * @param {number} to - end opacity (0-1)
     * @param {number} duration - duration in seconds
     * @returns {AnimationClip} created animation
     */
    fade: (name, from, to, duration) => {
        const times = [0, duration];
        const values = [from, to];
        
        const track = new NumberKeyframeTrack('opacity', times, values);
        return new AnimationClip(name, duration, [track]);
    }
};

// Version information
export const VERSION = '1.0.0';

// Default export removed for UMD compatibility
// Use named exports instead
