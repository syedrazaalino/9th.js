/**
 * @class Vector4
 * @description 4D vector class with comprehensive operations and optimizations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Set vector components
     */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Copy vector from another vector
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
        return this;
    }

    /**
     * Clone vector
     */
    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    /**
     * Add vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    }

    /**
     * Add vectors and return new vector
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        this.w = a.w + b.w;
        return this;
    }

    /**
     * Add scalar to vector
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        this.w += s;
        return this;
    }

    /**
     * Subtract vector
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        this.w -= v.w;
        return this;
    }

    /**
     * Subtract vectors and return new vector
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        this.w = a.w - b.w;
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;
        return this;
    }

    /**
     * Divide by scalar
     */
    divideScalar(s) {
        if (s !== 0) {
            this.x /= s;
            this.y /= s;
            this.z /= s;
            this.w /= s;
        } else {
            this.set(0, 0, 0, 0);
        }
        return this;
    }

    /**
     * Element-wise multiply
     */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        this.w *= v.w;
        return this;
    }

    /**
     * Element-wise divide
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        this.w /= v.w;
        return this;
    }

    /**
     * Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    /**
     * Get length of vector
     */
    length() {
        return Math.hypot(this.x, this.y, this.z, this.w);
    }

    /**
     * Get squared length of vector (faster than length)
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
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
        const dz = this.z - v.z;
        const dw = this.w - v.w;
        return Math.hypot(dx, dy, dz, dw);
    }

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        const dw = this.w - v.w;
        return dx * dx + dy * dy + dz * dz + dw * dw;
    }

    /**
     * Set from 3D vector with w component
     */
    setFromVector3(v3, w = 1) {
        this.x = v3.x;
        this.y = v3.y;
        this.z = v3.z;
        this.w = w;
        return this;
    }

    /**
     * Set from spherical coordinates with homogeneous component
     */
    setFromSpherical(radius, phi, theta, w = 1) {
        const sinPhiRadius = Math.sin(phi) * radius;
        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);
        this.w = w;
        return this;
    }

    /**
     * Get spherical coordinates
     */
    getSpherical() {
        const length = this.length();
        return {
            radius: length,
            phi: Math.acos(this.y / length),
            theta: Math.atan2(this.x, this.z),
            w: this.w
        };
    }

    /**
     * Lerp (linear interpolation)
     */
    lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        this.w += (v.w - this.w) * alpha;
        return this;
    }

    /**
     * Lerp vectors
     */
    lerpVectors(a, b, alpha) {
        this.x = a.x + (b.x - a.x) * alpha;
        this.y = a.y + (b.y - a.y) * alpha;
        this.z = a.z + (b.z - a.z) * alpha;
        this.w = a.w + (b.w - a.w) * alpha;
        return this;
    }

    /**
     * Slerp (spherical linear interpolation)
     */
    slerp(v, alpha) {
        const dot = this.dot(v);
        
        // If vectors are parallel or antiparallel, use regular lerp
        if (Math.abs(dot) > 0.9995) {
            return this.lerp(v, alpha).normalize();
        }
        
        // Calculate angle between vectors
        const theta = Math.acos(Math.min(Math.max(dot, -1), 1));
        
        // If angle is very small, use regular lerp
        if (theta < 1e-6) {
            return this.lerp(v, alpha);
        }
        
        const sinTheta = Math.sin(theta);
        const scale1 = Math.sin((1 - alpha) * theta) / sinTheta;
        const scale2 = Math.sin(alpha * theta) / sinTheta;
        
        this.multiplyScalar(scale1).add(v.clone().multiplyScalar(scale2));
        return this;
    }

    /**
     * Clamp vector to min/max bounds
     */
    clamp(min, max) {
        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));
        this.w = Math.max(min.w, Math.min(max.w, this.w));
        return this;
    }

    /**
     * Apply 4x4 matrix transformation
     */
    applyMatrix4(matrix) {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        const elements = matrix.elements;
        
        this.x = elements[0] * x + elements[4] * y + elements[8] * z + elements[12] * w;
        this.y = elements[1] * x + elements[5] * y + elements[9] * z + elements[13] * w;
        this.z = elements[2] * x + elements[6] * y + elements[10] * z + elements[14] * w;
        this.w = elements[3] * x + elements[7] * y + elements[11] * z + elements[15] * w;
        
        return this;
    }

    /**
     * Apply quaternion rotation
     */
    applyQuaternion(quaternion) {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        const qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w;
        
        // calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        
        // calculate result * inverse quat
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        this.w = iw * qw - ix * -qx - iy * -qy - iz * -qz;
        
        return this;
    }

    /**
     * Project onto 3D space (divide by w)
     */
    toVector3() {
        const w = this.w !== 0 ? 1 / this.w : 1;
        return new Vector3(this.x * w, this.y * w, this.z * w);
    }

    /**
     * Reflect vector off hyperplane normal
     */
    reflect(normal) {
        // v - 2 * dot(v, n) * n
        const dot = this.dot(normal);
        this.x = this.x - 2 * dot * normal.x;
        this.y = this.y - 2 * dot * normal.y;
        this.z = this.z - 2 * dot * normal.z;
        this.w = this.w - 2 * dot * normal.w;
        return this;
    }

    /**
     * Project vector onto another vector
     */
    projectOnVector(v) {
        const dotProduct = this.dot(v);
        const vLengthSq = v.lengthSq();
        if (vLengthSq > 0) {
            this.copy(v).multiplyScalar(dotProduct / vLengthSq);
        }
        return this;
    }

    /**
     * Project vector onto hyperplane
     */
    projectOnHyperplane(planeNormal) {
        const vn = this.clone().projectOnVector(planeNormal);
        this.sub(vn);
        return this;
    }

    /**
     * Check if vector equals another vector (with tolerance)
     */
    equals(v, tolerance = 1e-6) {
        return Math.abs(this.x - v.x) < tolerance && 
               Math.abs(this.y - v.y) < tolerance && 
               Math.abs(this.z - v.z) < tolerance && 
               Math.abs(this.w - v.w) < tolerance;
    }

    /**
     * Convert to array
     */
    toArray() {
        return [this.x, this.y, this.z, this.w];
    }

    /**
     * Convert to array with offset
     */
    toArrayWithOffset(array, offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.w;
        return array;
    }

    /**
     * Set from array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        this.w = array[offset + 3];
        return this;
    }

    /**
     * Convert to object
     */
    toObject() {
        return { x: this.x, y: this.y, z: this.z, w: this.w };
    }

    /**
     * Set from object
     */
    fromObject(obj) {
        this.x = obj.x || 0;
        this.y = obj.y || 0;
        this.z = obj.z || 0;
        this.w = obj.w !== undefined ? obj.w : 1;
        return this;
    }

    /**
     * Get component by index
     */
    getComponent(index) {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
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
            case 2: this.z = value; break;
            case 3: this.w = value; break;
            default: throw new Error('Index out of range for Vector4');
        }
        return this;
    }

    /**
     * Get string representation
     */
    toString() {
        return `Vector4(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)}, ${this.w.toFixed(3)})`;
    }

    /**
     * Static methods
     */

    /**
     * Create vector from coordinates
     */
    static fromCoords(x, y, z, w = 1) {
        return new Vector4(x, y, z, w);
    }

    /**
     * Create from Vector3 with w component
     */
    static fromVector3(v3, w = 1) {
        return new Vector4(v3.x, v3.y, v3.z, w);
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
        return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    }

    /**
     * Linear interpolation between two vectors
     */
    static lerp(a, b, alpha) {
        return new Vector4(
            a.x + (b.x - a.x) * alpha,
            a.y + (b.y - a.y) * alpha,
            a.z + (b.z - a.z) * alpha,
            a.w + (b.w - a.w) * alpha
        );
    }

    /**
     * Spherical linear interpolation between two vectors
     */
    static slerp(a, b, alpha) {
        return a.clone().slerp(b, alpha);
    }

    /**
     * Check if two vectors are equal
     */
    static equals(a, b, tolerance = 1e-6) {
        return Math.abs(a.x - b.x) < tolerance && 
               Math.abs(a.y - b.y) < tolerance && 
               Math.abs(a.z - b.z) < tolerance && 
               Math.abs(a.w - b.w) < tolerance;
    }

    /**
     * Random unit vector on 4-sphere
     */
    static random() {
        const u1 = Math.random();
        const u2 = Math.random();
        const u3 = Math.random();
        const u4 = Math.random();
        
        const sqrt1MinusUSquared = Math.sqrt(1 - u1 * u1);
        const sqrtU2 = Math.sqrt(u2);
        const sqrtU4 = Math.sqrt(u4);
        
        return new Vector4(
            sqrt1MinusUSquared * Math.sin(2 * Math.PI * u3),
            sqrt1MinusUSquared * Math.cos(2 * Math.PI * u3),
            sqrtU2 * Math.sin(2 * Math.PI * u4),
            sqrtU2 * Math.cos(2 * Math.PI * u4)
        );
    }

    /**
     * Random vector in unit hypercube
     */
    static randomInHypercube() {
        return new Vector4(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
    }

    /**
     * Get minimum component values
     */
    static min(a, b) {
        return new Vector4(
            Math.min(a.x, b.x),
            Math.min(a.y, b.y),
            Math.min(a.z, b.z),
            Math.min(a.w, b.w)
        );
    }

    /**
     * Get maximum component values
     */
    static max(a, b) {
        return new Vector4(
            Math.max(a.x, b.x),
            Math.max(a.y, b.y),
            Math.max(a.z, b.z),
            Math.max(a.w, b.w)
        );
    }

    /**
     * Zero vector
     */
    static get zero() {
        return new Vector4(0, 0, 0, 0);
    }

    /**
     * Unit vectors
     */
    static get unitX() {
        return new Vector4(1, 0, 0, 0);
    }

    static get unitY() {
        return new Vector4(0, 1, 0, 0);
    }

    static get unitZ() {
        return new Vector4(0, 0, 1, 0);
    }

    static get unitW() {
        return new Vector4(0, 0, 0, 1);
    }

    /**
     * One vector
     */
    static get one() {
        return new Vector4(1, 1, 1, 1);
    }

    /**
     * Negative unit vectors
     */
    static get negativeUnitX() {
        return new Vector4(-1, 0, 0, 0);
    }

    static get negativeUnitY() {
        return new Vector4(0, -1, 0, 0);
    }

    static get negativeUnitZ() {
        return new Vector4(0, 0, -1, 0);
    }

    static get negativeUnitW() {
        return new Vector4(0, 0, 0, -1);
    }

    /**
     * Homogeneous coordinates for 3D points
     */
    static get homogeneousPoint3D() {
        return new Vector4(0, 0, 0, 1);
    }

    /**
     * Homogeneous coordinates for 3D directions
     */
    static get homogeneousDirection3D() {
        return new Vector4(0, 0, 0, 0);
    }
}
