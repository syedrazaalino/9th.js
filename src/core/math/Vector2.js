/**
 * @class Vector2
 * @description 2D vector class with comprehensive operations and optimizations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set vector components
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Copy vector from another vector
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Clone vector
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Add vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /**
     * Add vectors and return new vector
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this;
    }

    /**
     * Add scalar to vector
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        return this;
    }

    /**
     * Subtract vector
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /**
     * Subtract vectors and return new vector
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    /**
     * Divide by scalar
     */
    divideScalar(s) {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
        } else {
            this.set(0, 0);
        }
        return this;
    }

    /**
     * Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Get length of vector
     */
    length() {
        return Math.hypot(this.x, this.y);
    }

    /**
     * Get squared length of vector (faster than length)
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize vector
     */
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.divideScalar(len);
        }
        return this;
    }

    /**
     * Get distance to another vector
     */
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.hypot(dx, dy);
    }

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /**
     * Set vector from polar coordinates
     */
    setFromPolar(radius, angle) {
        this.x = radius * Math.cos(angle);
        this.y = radius * Math.sin(angle);
        return this;
    }

    /**
     * Get angle of vector
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Lerp (linear interpolation)
     */
    lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        return this;
    }

    /**
     * Lerp vectors
     */
    lerpVectors(a, b, alpha) {
        this.x = a.x + (b.x - a.x) * alpha;
        this.y = a.y + (b.y - a.y) * alpha;
        return this;
    }

    /**
     * Clamp vector to min/max bounds
     */
    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        return this;
    }

    /**
     * Apply 2x2 matrix transformation
     */
    applyMatrix2(matrix) {
        const x = this.x, y = this.y;
        const elements = matrix.elements;
        this.x = elements[0] * x + elements[2] * y;
        this.y = elements[1] * x + elements[3] * y;
        return this;
    }

    /**
     * Apply 3x3 matrix transformation (homogeneous)
     */
    applyMatrix3(matrix) {
        const x = this.x, y = this.y;
        const elements = matrix.elements;
        this.x = elements[0] * x + elements[3] * y + elements[6];
        this.y = elements[1] * x + elements[4] * y + elements[7];
        return this;
    }

    /**
     * Reflect vector off normal
     */
    reflect(normal) {
        // v - 2 * dot(v, n) * n
        const dot = this.dot(normal);
        this.x = this.x - 2 * dot * normal.x;
        this.y = this.y - 2 * dot * normal.y;
        return this;
    }

    /**
     * Check if vector equals another vector (with tolerance)
     */
    equals(v, tolerance = 1e-6) {
        return Math.abs(this.x - v.x) < tolerance && Math.abs(this.y - v.y) < tolerance;
    }

    /**
     * Convert to array
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Convert to array with offset
     */
    toArrayWithOffset(array, offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        return array;
    }

    /**
     * Set from array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        return this;
    }

    /**
     * Convert to object
     */
    toObject() {
        return { x: this.x, y: this.y };
    }

    /**
     * Set from object
     */
    fromObject(obj) {
        this.x = obj.x || 0;
        this.y = obj.y || 0;
        return this;
    }

    /**
     * Get component by index
     */
    getComponent(index) {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            default: return undefined;
        }
    }

    /**
     * Set component by index
     */
    setComponent(index, value) {
        switch (index) {
            case 0: this.x = value; break;
            case 1: this.y = value; break;
            default: throw new Error('Index out of range for Vector2');
        }
        return this;
    }

    /**
     * Get string representation
     */
    toString() {
        return `Vector2(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`;
    }

    /**
     * Static methods
     */

    /**
     * Create vector from coordinates
     */
    static fromCoords(x, y) {
        return new Vector2(x, y);
    }

    /**
     * Create vector from polar coordinates
     */
    static fromPolar(radius, angle) {
        return new Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
    }

    /**
     * Get distance between two vectors
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * Get squared distance between two vectors
     */
    static distanceSq(a, b) {
        return a.distanceToSquared(b);
    }

    /**
     * Dot product of two vectors
     */
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    /**
     * Linear interpolation between two vectors
     */
    static lerp(a, b, alpha) {
        return new Vector2(
            a.x + (b.x - a.x) * alpha,
            a.y + (b.y - a.y) * alpha
        );
    }

    /**
     * Check if two vectors are equal
     */
    static equals(a, b, tolerance = 1e-6) {
        return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
    }

    /**
     * Cross product (returns scalar for 2D)
     */
    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    /**
     * Perpendicular vector
     */
    static perpendicular(v) {
        return new Vector2(-v.y, v.x);
    }

    /**
     * Random vector in unit circle
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Zero vector
     */
    static get zero() {
        return new Vector2(0, 0);
    }

    /**
     * Unit X vector
     */
    static get unitX() {
        return new Vector2(1, 0);
    }

    /**
     * Unit Y vector
     */
    static get unitY() {
        return new Vector2(0, 1);
    }

    /**
     * One vector
     */
    static get one() {
        return new Vector2(1, 1);
    }

    /**
     * Negative X unit vector
     */
    static get negativeUnitX() {
        return new Vector2(-1, 0);
    }

    /**
     * Negative Y unit vector
     */
    static get negativeUnitY() {
        return new Vector2(0, -1);
    }
}
