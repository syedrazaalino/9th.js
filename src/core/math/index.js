/**
 * @fileoverview 9th.js Core Math Library
 * @description Comprehensive math classes for 9th.js framework including vectors, matrices, quaternions, and colors
 * @author 9th.js Team
 * @version 1.0.0
 */

// Vector classes
export { Vector2 } from './Vector2.js';
export { Vector3 } from './Vector3.js';
export { Vector4 } from './Vector4.js';

// Matrix classes
export { Matrix3 } from './Matrix3.js';
export { Matrix4 } from './Matrix4.js';

// Quaternion class
export { Quaternion } from './Quaternion.js';

// Color class
export { Color } from './Color.js';

// Version information
export const VERSION = '1.0.0';
export const NAME = '9th.js Core Math';

/**
 * Math utilities and constants
 */
export class MathUtils {
    /**
     * Convert degrees to radians
     */
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     */
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Clamp value between min and max
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Smooth interpolation (ease in/out)
     */
    static smoothstep(edge0, edge1, x) {
        const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    /**
     * Barycentric interpolation
     */
    static barycentric(a, b, c, u, v) {
        return (1 - u - v) * a + u * b + v * c;
    }

    /**
     * Random number between min and max
     */
    static random(min = 0, max = 1) {
        return min + Math.random() * (max - min);
    }

    /**
     * Random number in normal distribution
     */
    static randomNormal(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * Convert RGB to hex
     */
    static rgbToHex(r, g, b) {
        return ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
    }

    /**
     * Convert hex to RGB
     */
    static hexToRgb(hex) {
        hex = hex.replace('#', '');
        
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        const value = parseInt(hex, 16);
        return {
            r: (value >> 16 & 255) / 255,
            g: (value >> 8 & 255) / 255,
            b: (value & 255) / 255
        };
    }

    /**
     * Format number with fixed decimal places
     */
    static format(number, decimals = 2) {
        return number.toFixed(decimals);
    }

    /**
     * Check if number is approximately equal
     */
    static approxEqual(a, b, tolerance = 1e-6) {
        return Math.abs(a - b) < tolerance;
    }

    /**
     * Safe division (avoid division by zero)
     */
    static safeDiv(a, b, fallback = 0) {
        return b !== 0 ? a / b : fallback;
    }

    /**
     * Greatest common divisor
     */
    static gcd(a, b) {
        return b === 0 ? Math.abs(a) : MathUtils.gcd(b, a % b);
    }

    /**
     * Least common multiple
     */
    static lcm(a, b) {
        return MathUtils.safeDiv(Math.abs(a * b), MathUtils.gcd(a, b));
    }

    /**
     * Factorial
     */
    static factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * Combination (n choose k)
     */
    static combination(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        return MathUtils.factorial(n) / (MathUtils.factorial(k) * MathUtils.factorial(n - k));
    }

    /**
     * Permutation (nPk)
     */
    static permutation(n, k) {
        if (k > n) return 0;
        return MathUtils.factorial(n) / MathUtils.factorial(n - k);
    }

    /**
     * Fibonacci sequence
     */
    static fibonacci(n) {
        if (n <= 1) return n;
        return MathUtils.fibonacci(n - 1) + MathUtils.fibonacci(n - 2);
    }

    /**
     * Prime number check
     */
    static isPrime(n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }
}

/**
 * Common mathematical constants
 */
export const CONSTANTS = {
    PI: Math.PI,
    TAU: Math.PI * 2,
    E: Math.E,
    PHI: (1 + Math.sqrt(5)) / 2, // Golden ratio
    SQRT2: Math.SQRT2,
    SQRT3: Math.sqrt(3),
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    EPSILON: 1e-6,
    MIN_VALUE: Number.MIN_VALUE,
    MAX_VALUE: Number.MAX_VALUE,
    POSITIVE_INFINITY: Number.POSITIVE_INFINITY,
    NEGATIVE_INFINITY: Number.NEGATIVE_INFINITY
};

/**
 * Pre-constructed commonly used vectors
 */
export const VECTORS = {
    get ZERO2() { return new Vector2(0, 0); },
    get UNIT_X2() { return new Vector2(1, 0); },
    get UNIT_Y2() { return new Vector2(0, 1); },
    get NEGATIVE_UNIT_X2() { return new Vector2(-1, 0); },
    get NEGATIVE_UNIT_Y2() { return new Vector2(0, -1); },
    
    get ZERO3() { return new Vector3(0, 0, 0); },
    get UNIT_X3() { return new Vector3(1, 0, 0); },
    get UNIT_Y3() { return new Vector3(0, 1, 0); },
    get UNIT_Z3() { return new Vector3(0, 0, 1); },
    get NEGATIVE_UNIT_X3() { return new Vector3(-1, 0, 0); },
    get NEGATIVE_UNIT_Y3() { return new Vector3(0, -1, 0); },
    get NEGATIVE_UNIT_Z3() { return new Vector3(0, 0, -1); },
    get UP() { return new Vector3(0, 1, 0); },
    get DOWN() { return new Vector3(0, -1, 0); },
    get LEFT() { return new Vector3(-1, 0, 0); },
    get RIGHT() { return new Vector3(1, 0, 0); },
    get FORWARD() { return new Vector3(0, 0, 1); },
    get BACKWARD() { return new Vector3(0, 0, -1); },
    
    get ZERO4() { return new Vector4(0, 0, 0, 0); },
    get UNIT_X4() { return new Vector4(1, 0, 0, 0); },
    get UNIT_Y4() { return new Vector4(0, 1, 0, 0); },
    get UNIT_Z4() { return new Vector4(0, 0, 1, 0); },
    get UNIT_W4() { return new Vector4(0, 0, 0, 1); },
    
    get HOMOGENEOUS_POINT3D() { return new Vector4(0, 0, 0, 1); },
    get HOMOGENEOUS_DIRECTION3D() { return new Vector4(0, 0, 0, 0); }
};

/**
 * Pre-constructed commonly used matrices
 */
export const MATRICES = {
    get IDENTITY3() { return new Matrix3().identity(); },
    get ZERO3() { return new Matrix3(); }, // Will be zero by default in constructor
    
    get IDENTITY4() { return new Matrix4().identity(); },
    get ZERO4() { return new Matrix4(); } // Will be zero by default in constructor
};

/**
 * Pre-constructed commonly used colors
 */
export const COLORS = {
    get BLACK() { return new Color(0, 0, 0); },
    get WHITE() { return new Color(1, 1, 1); },
    get RED() { return new Color(1, 0, 0); },
    get GREEN() { return new Color(0, 1, 0); },
    get BLUE() { return new Color(0, 0, 1); },
    get YELLOW() { return new Color(1, 1, 0); },
    get MAGENTA() { return new Color(1, 0, 1); },
    get CYAN() { return new Color(0, 1, 1); },
    get GRAY() { return new Color(0.5, 0.5, 0.5); },
    get DARK_GRAY() { return new Color(0.25, 0.25, 0.25); },
    get LIGHT_GRAY() { return new Color(0.75, 0.75, 0.75); },
    get ORANGE() { return new Color(1, 0.5, 0); },
    get PURPLE() { return new Color(0.5, 0, 0.5); },
    get BROWN() { return new Color(0.6, 0.3, 0.1); },
    get PINK() { return new Color(1, 0.75, 0.8); },
    get LIME() { return new Color(0.75, 1, 0); },
    get NAVY() { return new Color(0, 0, 0.5); },
    get TEAL() { return new Color(0, 0.5, 0.5); },
    get OLIVE() { return new Color(0.5, 0.5, 0); }
};

// Default export removed for UMD compatibility
// Use named exports instead
