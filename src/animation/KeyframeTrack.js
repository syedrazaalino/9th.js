/**
 * KeyframeTrack.js - Manages keyframes for animation properties
 * Supports different interpolation types and property value tracking
 */

import AnimationUtils, { InterpolationType } from './AnimationUtils.js';
import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Vector4 } from '../core/math/Vector4.js';
import { Quaternion } from '../core/math/Quaternion.js';

/**
 * KeyframeTrack - Base class for all keyframe tracks
 */
class KeyframeTrack {
    /**
     * @param {string} name - property name to animate
     * @param {Array} times - array of keyframe times
     * @param {Array} values - array of keyframe values
     * @param {Object} options - track options
     */
    constructor(name, times, values, options = {}) {
        this.name = name;
        this.times = times || [];
        this.values = values || [];
        this.type = options.type || InterpolationType.LINEAR;
        this.easing = options.easing || 'linear';
        this.length = this.times.length;
        this.valueSize = options.valueSize || 3;
        this.result = options.result || null;
        this.lerpFactor = options.lerpFactor || 1.0;
        
        // Sort times and values
        this._sortTimes();
        
        // Runtime properties
        this.cacheIndex = -1;
        this.cacheTime = -1;
        this.cacheValue = null;
    }

    /**
     * Sort times and values by time
     * @private
     */
    _sortTimes() {
        const sorted = this.times.map((time, index) => ({ time, value: this.values[index] }))
                                 .sort((a, b) => a.time - b.time);
        
        this.times = sorted.map(item => item.time);
        this.values = sorted.map(item => item.value);
        this.length = this.times.length;
    }

    /**
     * Get interpolated value at specific time
     * @param {number} time - time to evaluate
     * @returns {*} interpolated value
     */
    getValue(time) {
        if (this.length === 0) return null;
        if (this.length === 1) return this.values[0];
        
        // Cache optimization
        if (time === this.cacheTime && this.cacheIndex !== -1) {
            return this.cacheValue;
        }
        
        const result = this._interpolate(time);
        this.cacheTime = time;
        this.cacheIndex = this._findIndex(time);
        this.cacheValue = result;
        
        return result;
    }

    /**
     * Find the keyframe index for a given time
     * @param {number} time - time to find
     * @returns {number} keyframe index
     * @private
     */
    _findIndex(time) {
        if (time <= this.times[0]) return 0;
        if (time >= this.times[this.length - 1]) return this.length - 2;
        
        // Binary search for efficiency
        let low = 0;
        let high = this.length - 1;
        
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (this.times[mid] <= time && time < this.times[mid + 1]) {
                return mid;
            }
            if (time < this.times[mid]) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        
        return Math.max(0, Math.min(low - 1, this.length - 2));
    }

    /**
     * Interpolate between keyframes at given time
     * @param {number} time - time to interpolate
     * @returns {*} interpolated value
     * @protected
     */
    _interpolate(time) {
        const index = this._findIndex(time);
        const t0 = this.times[index];
        const t1 = this.times[index + 1];
        const localTime = (time - t0) / (t1 - t0);
        
        // Apply easing
        const easedTime = AnimationUtils.ease(localTime, this.easing);
        
        const v0 = this.values[index];
        const v1 = this.values[index + 1];
        
        switch (this.type) {
            case InterpolationType.STEP:
                return localTime < 0.5 ? v0 : v1;
            case InterpolationType.LINEAR:
                return this._linearInterpolate(easedTime, v0, v1);
            case InterpolationType.CUBIC:
                return this._cubicInterpolate(time, index, easedTime);
            case InterpolationType.QUATERNION:
                return this._quaternionInterpolate(easedTime, v0, v1);
            default:
                return this._linearInterpolate(easedTime, v0, v1);
        }
    }

    /**
     * Linear interpolation
     * @param {number} t - interpolation parameter
     * @param {*} v0 - start value
     * @param {*} v1 - end value
     * @returns {*} interpolated value
     * @protected
     */
    _linearInterpolate(t, v0, v1) {
        if (typeof v0 === 'number') {
            return AnimationUtils.linear(t, v0, v1);
        }
        
        if (v0 instanceof Vector2) {
            return AnimationUtils.vector2Lerp(t, v0, v1, this.result);
        }
        
        if (v0 instanceof Vector3) {
            return AnimationUtils.vector3Lerp(t, v0, v1, this.result);
        }
        
        if (v0 instanceof Vector4) {
            return AnimationUtils.vector4Lerp(t, v0, v1, this.result);
        }
        
        // Fallback for arrays
        if (Array.isArray(v0) && Array.isArray(v1)) {
            const result = [];
            for (let i = 0; i < v0.length; i++) {
                result.push(AnimationUtils.linear(t, v0[i], v1[i]));
            }
            return result;
        }
        
        return t < 0.5 ? v0 : v1;
    }

    /**
     * Cubic interpolation
     * @param {number} time - current time
     * @param {number} index - keyframe index
     * @param {number} t - interpolation parameter
     * @returns {*} interpolated value
     * @protected
     */
    _cubicInterpolate(time, index, t) {
        // Get surrounding points for cubic interpolation
        const i0 = Math.max(0, index - 1);
        const i1 = index;
        const i2 = index + 1;
        const i3 = Math.min(this.length - 1, index + 2);
        
        const p0 = this.values[i0];
        const p1 = this.values[i1];
        const p2 = this.values[i2];
        const p3 = this.values[i3];
        
        if (p0 instanceof Vector3) {
            const m0 = this._calculateTangent(p0, this.values[i0 + 1], this.values[i0 + 2]);
            const m1 = this._calculateTangent(p2, this.values[i1], this.values[i3]);
            return AnimationUtils.cubicHermite(t, p0, p2, m0, m1, this.result);
        }
        
        // Fallback to linear for other types
        return this._linearInterpolate(t, p1, p2);
    }

    /**
     * Calculate tangent for cubic interpolation
     * @param {*} p - current point
     * @param {*} prev - previous point
     * @param {*} next - next point
     * @returns {*} tangent vector
     * @private
     */
    _calculateTangent(p, prev, next) {
        if (p instanceof Vector3) {
            const tangent = new Vector3();
            if (prev && next) {
                tangent.copy(next).sub(prev).multiplyScalar(0.5);
            } else if (next) {
                tangent.copy(next).sub(p);
            } else if (prev) {
                tangent.copy(p).sub(prev);
            }
            return tangent;
        }
        return null;
    }

    /**
     * Quaternion spherical linear interpolation
     * @param {number} t - interpolation parameter
     * @param {Quaternion} v0 - start quaternion
     * @param {Quaternion} v1 - end quaternion
     * @returns {Quaternion} interpolated quaternion
     * @protected
     */
    _quaternionInterpolate(t, v0, v1) {
        return AnimationUtils.quaternionSlerp(t, v0, v1, this.result);
    }

    /**
     * Add keyframe
     * @param {number} time - keyframe time
     * @param {*} value - keyframe value
     */
    addKeyframe(time, value) {
        this.times.push(time);
        this.values.push(value);
        this._sortTimes();
        this.length = this.times.length;
        
        // Invalidate cache
        this.cacheTime = -1;
        this.cacheIndex = -1;
    }

    /**
     * Remove keyframe at index
     * @param {number} index - keyframe index
     */
    removeKeyframe(index) {
        if (index >= 0 && index < this.length) {
            this.times.splice(index, 1);
            this.values.splice(index, 1);
            this.length = this.times.length;
            
            // Invalidate cache
            this.cacheTime = -1;
            this.cacheIndex = -1;
        }
    }

    /**
     * Update keyframe value
     * @param {number} index - keyframe index
     * @param {*} value - new value
     */
    updateKeyframe(index, value) {
        if (index >= 0 && index < this.length) {
            this.values[index] = value;
            
            // Invalidate cache
            this.cacheTime = -1;
            this.cacheIndex = -1;
        }
    }

    /**
     * Update keyframe time
     * @param {number} index - keyframe index
     * @param {number} time - new time
     */
    updateKeyframeTime(index, time) {
        if (index >= 0 && index < this.length) {
            this.times[index] = time;
            this._sortTimes();
            
            // Invalidate cache
            this.cacheTime = -1;
            this.cacheIndex = -1;
        }
    }

    /**
     * Get duration of the track
     * @returns {number} duration
     */
    getDuration() {
        if (this.length === 0) return 0;
        return this.times[this.length - 1] - this.times[0];
    }

    /**
     * Check if track is empty
     * @returns {boolean} true if empty
     */
    isEmpty() {
        return this.length === 0;
    }

    /**
     * Clone the track
     * @returns {KeyframeTrack} cloned track
     */
    clone() {
        const cloned = new KeyframeTrack(
            this.name,
            [...this.times],
            [...this.values],
            {
                type: this.type,
                easing: this.easing,
                valueSize: this.valueSize,
                result: this.result,
                lerpFactor: this.lerpFactor
            }
        );
        return cloned;
    }

    /**
     * Serialize track to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            name: this.name,
            times: this.times,
            values: this.values.map(v => v instanceof Quaternion ? v.toArray() : v),
            type: this.type,
            easing: this.easing,
            valueSize: this.valueSize,
            length: this.length
        };
    }

    /**
     * Create track from JSON
     * @param {Object} data - JSON data
     * @returns {KeyframeTrack} created track
     */
    static fromJSON(data) {
        const track = new KeyframeTrack(data.name, data.times, data.values, {
            type: data.type,
            easing: data.easing,
            valueSize: data.valueSize
        });
        return track;
    }
}

/**
 * NumberKeyframeTrack - for numeric values
 */
class NumberKeyframeTrack extends KeyframeTrack {
    constructor(name, times, values, options = {}) {
        super(name, times, values, { ...options, valueSize: 1 });
    }
    
    _linearInterpolate(t, v0, v1) {
        return AnimationUtils.linear(t, v0, v1);
    }
}

/**
 * Vector2KeyframeTrack - for Vector2 values
 */
class Vector2KeyframeTrack extends KeyframeTrack {
    constructor(name, times, values, options = {}) {
        super(name, times, values, { ...options, valueSize: 2 });
    }
    
    _linearInterpolate(t, v0, v1) {
        return AnimationUtils.vector2Lerp(t, v0, v1, this.result || new Vector2());
    }
}

/**
 * Vector3KeyframeTrack - for Vector3 values
 */
class Vector3KeyframeTrack extends KeyframeTrack {
    constructor(name, times, values, options = {}) {
        super(name, times, values, { ...options, valueSize: 3 });
    }
    
    _linearInterpolate(t, v0, v1) {
        return AnimationUtils.vector3Lerp(t, v0, v1, this.result || new Vector3());
    }
}

/**
 * Vector4KeyframeTrack - for Vector4 values
 */
class Vector4KeyframeTrack extends KeyframeTrack {
    constructor(name, times, values, options = {}) {
        super(name, times, values, { ...options, valueSize: 4 });
    }
    
    _linearInterpolate(t, v0, v1) {
        return AnimationUtils.vector4Lerp(t, v0, v1, this.result || new Vector4());
    }
}

/**
 * QuaternionKeyframeTrack - for Quaternion values
 */
class QuaternionKeyframeTrack extends KeyframeTrack {
    constructor(name, times, values, options = {}) {
        super(name, times, values, { ...options, type: InterpolationType.QUATERNION, valueSize: 4 });
    }
    
    _linearInterpolate(t, v0, v1) {
        return AnimationUtils.quaternionSlerp(t, v0, v1, this.result || new Quaternion());
    }
}

export {
    KeyframeTrack,
    NumberKeyframeTrack,
    Vector2KeyframeTrack,
    Vector3KeyframeTrack,
    Vector4KeyframeTrack,
    QuaternionKeyframeTrack
};

// Alias for VectorKeyframeTrack
export { Vector3KeyframeTrack as VectorKeyframeTrack };

export default KeyframeTrack;
