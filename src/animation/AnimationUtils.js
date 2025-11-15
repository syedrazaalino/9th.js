/**
 * AnimationUtils.js - Utility functions for animation system
 * Provides interpolation methods, easing functions, and animation helpers
 */

import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Vector4 } from '../core/math/Vector4.js';
import { Quaternion } from '../core/math/Quaternion.js';

/**
 * Interpolation types
 */
export const InterpolationType = {
    LINEAR: 'linear',
    CUBIC: 'cubic',
    QUATERNION: 'quaternion',
    STEP: 'step'
};

/**
 * Easing functions
 */
export const EasingType = {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    BOUNCE: 'bounce',
    ELASTIC: 'elastic'
};

/**
 * AnimationUtils - Collection of utility functions for animation
 */
class AnimationUtils {
    /**
     * Linear interpolation between two values
     * @param {number} t - interpolation parameter (0-1)
     * @param {number} start - start value
     * @param {number} end - end value
     * @returns {number} interpolated value
     */
    static linear(t, start, end) {
        return start + (end - start) * t;
    }

    /**
     * Cubic Bezier interpolation
     * @param {number} t - interpolation parameter (0-1)
     * @param {number} p0 - point 0
     * @param {number} p1 - point 1
     * @param {number} p2 - point 2
     * @param {number} p3 - point 3
     * @returns {number} interpolated value
     */
    static cubicBezier(t, p0, p1, p2, p3) {
        const it = 1 - t;
        return it * it * it * p0 +
               3 * it * it * t * p1 +
               3 * it * t * t * p2 +
               t * t * t * p3;
    }

    /**
     * Linear interpolation for Vector2
     * @param {number} t - interpolation parameter (0-1)
     * @param {Vector2} start - start vector
     * @param {Vector2} end - end vector
     * @param {Vector2} result - result vector
     * @returns {Vector2} interpolated vector
     */
    static vector2Lerp(t, start, end, result = new Vector2()) {
        result.x = this.linear(t, start.x, end.x);
        result.y = this.linear(t, start.y, end.y);
        return result;
    }

    /**
     * Linear interpolation for Vector3
     * @param {number} t - interpolation parameter (0-1)
     * @param {Vector3} start - start vector
     * @param {Vector3} end - end vector
     * @param {Vector3} result - result vector
     * @returns {Vector3} interpolated vector
     */
    static vector3Lerp(t, start, end, result = new Vector3()) {
        result.x = this.linear(t, start.x, end.x);
        result.y = this.linear(t, start.y, end.y);
        result.z = this.linear(t, start.z, end.z);
        return result;
    }

    /**
     * Linear interpolation for Vector4
     * @param {number} t - interpolation parameter (0-1)
     * @param {Vector4} start - start vector
     * @param {Vector4} end - end vector
     * @param {Vector4} result - result vector
     * @returns {Vector4} interpolated vector
     */
    static vector4Lerp(t, start, end, result = new Vector4()) {
        result.x = this.linear(t, start.x, end.x);
        result.y = this.linear(t, start.y, end.y);
        result.z = this.linear(t, start.z, end.z);
        result.w = this.linear(t, start.w, end.w);
        return result;
    }

    /**
     * Spherical linear interpolation for Quaternion
     * @param {number} t - interpolation parameter (0-1)
     * @param {Quaternion} start - start quaternion
     * @param {Quaternion} end - end quaternion
     * @param {Quaternion} result - result quaternion
     * @returns {Quaternion} interpolated quaternion
     */
    static quaternionSlerp(t, start, end, result = new Quaternion()) {
        let cosTheta = start.dot(end);
        
        // If cosTheta < 0, the interpolation will take the long way around
        if (cosTheta < 0) {
            cosTheta = -cosTheta;
            result.copy(end);
            result.multiplyScalar(-1);
            end = result;
        }
        
        // If cosTheta is close to 1, fall back to linear interpolation
        if (cosTheta > 1 - 1e-10) {
            result.lerp(start, end, t);
            return result;
        }
        
        const theta = Math.acos(cosTheta);
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        
        if (sinTheta < 1e-10) {
            result.copy(start);
            result.multiplyScalar(1 - t);
            result.add(end.multiplyScalar(t));
            result.normalize();
            return result;
        }
        
        const scale0 = Math.sin((1 - t) * theta) / sinTheta;
        const scale1 = Math.sin(t * theta) / sinTheta;
        
        result.set(
            scale0 * start.x + scale1 * end.x,
            scale0 * start.y + scale1 * end.y,
            scale0 * start.z + scale1 * end.z,
            scale0 * start.w + scale1 * end.w
        );
        
        return result;
    }

    /**
     * Cubic Hermite interpolation for Vector3
     * @param {number} t - interpolation parameter (0-1)
     * @param {Vector3} p0 - start point
     * @param {Vector3} p1 - end point
     * @param {Vector3} m0 - start tangent
     * @param {Vector3} m1 - end tangent
     * @param {Vector3} result - result vector
     * @returns {Vector3} interpolated vector
     */
    static cubicHermite(t, p0, p1, m0, m1, result = new Vector3()) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        
        result.x = h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x;
        result.y = h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y;
        result.z = h00 * p0.z + h10 * m0.z + h01 * p1.z + h11 * m1.z;
        
        return result;
    }

    /**
     * Easing functions
     * @param {number} t - interpolation parameter (0-1)
     * @param {string} type - easing type
     * @returns {number} eased value
     */
    static ease(t, type = EasingType.LINEAR) {
        switch (type) {
            case EasingType.EASE_IN:
                return t * t;
            case EasingType.EASE_OUT:
                return 1 - (1 - t) * (1 - t);
            case EasingType.EASE_IN_OUT:
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case EasingType.BOUNCE:
                return 1 - Math.abs(Math.cos(t * Math.PI / 2));
            case EasingType.ELASTIC:
                return t === 0 || t === 1 ? t :
                       -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
            case EasingType.LINEAR:
            default:
                return t;
        }
    }

    /**
     * Clamp a value between min and max
     * @param {number} value - value to clamp
     * @param {number} min - minimum value
     * @param {number} max - maximum value
     * @returns {number} clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Smooth step function
     * @param {number} t - interpolation parameter (0-1)
     * @returns {number} smoothed value
     */
    static smoothStep(t) {
        return t * t * (3 - 2 * t);
    }

    /**
     * Catmull-Rom interpolation
     * @param {number} t - interpolation parameter (0-1)
     * @param {Array} points - array of points
     * @param {Vector3} result - result vector
     * @returns {Vector3} interpolated vector
     */
    static catmullRom(t, points, result = new Vector3()) {
        if (points.length < 2) {
            return result.copy(points[0] || new Vector3());
        }
        
        const numPoints = points.length;
        const scaledT = t * (numPoints - 1);
        const intIndex = Math.floor(scaledT);
        const fracIndex = scaledT - intIndex;
        
        if (intIndex >= numPoints - 1) {
            return result.copy(points[numPoints - 1]);
        }
        
        const p0 = points[Math.max(0, intIndex - 1)];
        const p1 = points[intIndex];
        const p2 = points[intIndex + 1];
        const p3 = points[Math.min(numPoints - 1, intIndex + 2)];
        
        const t2 = fracIndex * fracIndex;
        const t3 = t2 * fracIndex;
        
        const a0 = -0.5 * p0.x + 1.5 * p1.x - 1.5 * p2.x + 0.5 * p3.x;
        const a1 = p0.x - 2.5 * p1.x + 2 * p2.x - 0.5 * p3.x;
        const a2 = -0.5 * p0.x + 0.5 * p2.x;
        const a3 = p1.x;
        
        const b0 = -0.5 * p0.y + 1.5 * p1.y - 1.5 * p2.y + 0.5 * p3.y;
        const b1 = p0.y - 2.5 * p1.y + 2 * p2.y - 0.5 * p3.y;
        const b2 = -0.5 * p0.y + 0.5 * p2.y;
        const b3 = p1.y;
        
        const c0 = -0.5 * p0.z + 1.5 * p1.z - 1.5 * p2.z + 0.5 * p3.z;
        const c1 = p0.z - 2.5 * p1.z + 2 * p2.z - 0.5 * p3.z;
        const c2 = -0.5 * p0.z + 0.5 * p2.z;
        const c3 = p1.z;
        
        result.x = a0 * t3 + a1 * t2 + a2 * fracIndex + a3;
        result.y = b0 * t3 + b1 * t2 + b2 * fracIndex + b3;
        result.z = c0 * t3 + c1 * t2 + c2 * fracIndex + c3;
        
        return result;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - degrees
     * @returns {number} radians
     */
    static degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     * @param {number} radians - radians
     * @returns {number} degrees
     */
    static radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Check if a value is power of 2
     * @param {number} value - value to check
     * @returns {boolean} true if power of 2
     */
    static isPowerOfTwo(value) {
        return (value & (value - 1)) === 0;
    }

    /**
     * Get next power of 2
     * @param {number} value - value
     * @returns {number} next power of 2
     */
    static nextPowerOfTwo(value) {
        let pow = 1;
        while (pow < value) pow <<= 1;
        return pow;
    }

    /**
     * Convert color from RGB to HSL
     * @param {Vector3} rgb - RGB color
     * @param {Vector3} result - HSL result
     * @returns {Vector3} HSL color
     */
    static rgbToHsl(rgb, result = new Vector3()) {
        const r = rgb.x / 255;
        const g = rgb.y / 255;
        const b = rgb.z / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h, s, l = (max + min) / 2;
        
        if (diff === 0) {
            h = s = 0;
        } else {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
            
            switch (max) {
                case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h /= 6;
        }
        
        result.set(h, s, l);
        return result;
    }

    /**
     * Convert color from HSL to RGB
     * @param {Vector3} hsl - HSL color
     * @param {Vector3} result - RGB result
     * @returns {Vector3} RGB color
     */
    static hslToRgb(hsl, result = new Vector3()) {
        let h = hsl.x, s = hsl.y, l = hsl.z;
        
        if (s === 0) {
            result.set(l, l, l);
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            result.set(
                hue2rgb(p, q, h + 1/3),
                hue2rgb(p, q, h),
                hue2rgb(p, q, h - 1/3)
            );
        }
        
        return result.multiplyScalar(255);
    }
}

export default AnimationUtils;
