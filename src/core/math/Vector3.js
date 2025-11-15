/**
 * @class Vector3
 * @description 3D vector class with comprehensive operations and optimizations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Set vector components
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Copy vector from another vector
     */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    /**
     * Clone vector
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     * Add vector
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    /**
     * Add vectors and return new vector
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
    }

    /**
     * Add scalar to vector
     */
    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        return this;
    }

    /**
     * Subtract vector
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    /**
     * Subtract vectors and return new vector
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
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
        } else {
            this.set(0, 0, 0);
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
        return this;
    }

    /**
     * Element-wise divide
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }

    /**
     * Dot product
     */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    /**
     * Cross product
     */
    cross(v) {
        const x = this.x, y = this.y, z = this.z;
        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;
        return this;
    }

    /**
     * Cross product with vectors
     */
    crossVectors(a, b) {
        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;
        return this;
    }

    /**
     * Get length of vector
     */
    length() {
        return Math.hypot(this.x, this.y, this.z);
    }

    /**
     * Get squared length of vector (faster than length)
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
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
        return Math.hypot(dx, dy, dz);
    }

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Set from spherical coordinates
     */
    setFromSpherical(radius, phi, theta) {
        const sinPhiRadius = Math.sin(phi) * radius;
        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);
        return this;
    }

    /**
     * Set from cylindrical coordinates
     */
    setFromCylindrical(radius, theta, y) {
        this.x = radius * Math.sin(theta);
        this.y = y;
        this.z = radius * Math.cos(theta);
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
            theta: Math.atan2(this.x, this.z)
        };
    }

    /**
     * Get cylindrical coordinates
     */
    getCylindrical() {
        return {
            radius: Math.hypot(this.x, this.z),
            theta: Math.atan2(this.x, this.z),
            y: this.y
        };
    }

    /**
     * Lerp (linear interpolation)
     */
    lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        return this;
    }

    /**
     * Lerp vectors
     */
    lerpVectors(a, b, alpha) {
        this.x = a.x + (b.x - a.x) * alpha;
        this.y = a.y + (b.y - a.y) * alpha;
        this.z = a.z + (b.z - a.z) * alpha;
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
        return this;
    }

    /**
     * Apply 4x4 matrix transformation (homogeneous coordinates)
     */
    applyMatrix4(matrix) {
        const x = this.x, y = this.y, z = this.z;
        const elements = matrix.elements;
        
        const w = elements[3] * x + elements[7] * y + elements[11] * z + elements[15];
        
        this.x = (elements[0] * x + elements[4] * y + elements[8] * z + elements[12]) / w;
        this.y = (elements[1] * x + elements[5] * y + elements[9] * z + elements[13]) / w;
        this.z = (elements[2] * x + elements[6] * y + elements[10] * z + elements[14]) / w;
        
        return this;
    }

    /**
     * Apply 3x3 matrix transformation (normal transformation)
     */
    applyMatrix3(matrix) {
        const x = this.x, y = this.y, z = this.z;
        const elements = matrix.elements;
        this.x = elements[0] * x + elements[3] * y + elements[6] * z;
        this.y = elements[1] * x + elements[4] * y + elements[7] * z;
        this.z = elements[2] * x + elements[5] * y + elements[8] * z;
        return this;
    }

    /**
     * Apply quaternion rotation
     */
    applyQuaternion(quaternion) {
        const x = this.x, y = this.y, z = this.z;
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
        
        return this;
    }

    /**
     * Transform direction (ignore translation)
     */
    applyMatrix4Direction(matrix) {
        const x = this.x, y = this.y, z = this.z;
        const elements = matrix.elements;
        
        this.x = elements[0] * x + elements[4] * y + elements[8] * z;
        this.y = elements[1] * x + elements[5] * y + elements[9] * z;
        this.z = elements[2] * x + elements[6] * y + elements[10] * z;
        
        return this.normalize();
    }

    /**
     * Reflect vector off normal
     */
    reflect(normal) {
        // v - 2 * dot(v, n) * n
        const dot = this.dot(normal);
        this.x = this.x - 2 * dot * normal.x;
        this.y = this.y - 2 * dot * normal.y;
        this.z = this.z - 2 * dot * normal.z;
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
     * Project vector onto plane
     */
    projectOnPlane(planeNormal) {
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
               Math.abs(this.z - v.z) < tolerance;
    }

    /**
     * Convert to array
     */
    toArray() {
        return [this.x, this.y, this.z];
    }

    /**
     * Convert to array with offset
     */
    toArrayWithOffset(array, offset = 0) {
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        return array;
    }

    /**
     * Set from array
     */
    fromArray(array, offset = 0) {
        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];
        return this;
    }

    /**
     * Convert to object
     */
    toObject() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * Set from object
     */
    fromObject(obj) {
        this.x = obj.x || 0;
        this.y = obj.y || 0;
        this.z = obj.z || 0;
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
            default: throw new Error('Index out of range for Vector3');
        }
        return this;
    }

    /**
     * Get string representation
     */
    toString() {
        return `Vector3(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)})`;
    }

    /**
     * Static methods
     */

    /**
     * Create vector from coordinates
     */
    static fromCoords(x, y, z) {
        return new Vector3(x, y, z);
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
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * Cross product of two vectors
     */
    static cross(a, b) {
        return new Vector3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }

    /**
     * Linear interpolation between two vectors
     */
    static lerp(a, b, alpha) {
        return new Vector3(
            a.x + (b.x - a.x) * alpha,
            a.y + (b.y - a.y) * alpha,
            a.z + (b.z - a.z) * alpha
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
               Math.abs(a.z - b.z) < tolerance;
    }

    /**
     * Random unit vector on sphere
     */
    static random() {
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const f = Math.sqrt(1 - u * u);
        return new Vector3(f * Math.cos(t), u, f * Math.sin(t));
    }

    /**
     * Random vector in unit cube
     */
    static randomInCube() {
        return new Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
        );
    }

    /**
     * Get minimum component values
     */
    static min(a, b) {
        return new Vector3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z));
    }

    /**
     * Get maximum component values
     */
    static max(a, b) {
        return new Vector3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z));
    }

    /**
     * Zero vector
     */
    static get zero() {
        return new Vector3(0, 0, 0);
    }

    /**
     * Unit X vector
     */
    static get unitX() {
        return new Vector3(1, 0, 0);
    }

    /**
     * Unit Y vector
     */
    static get unitY() {
        return new Vector3(0, 1, 0);
    }

    /**
     * Unit Z vector
     */
    static get unitZ() {
        return new Vector3(0, 0, 1);
    }

    /**
     * One vector
     */
    static get one() {
        return new Vector3(1, 1, 1);
    }

    /**
     * Negative unit vectors
     */
    static get negativeUnitX() {
        return new Vector3(-1, 0, 0);
    }

    static get negativeUnitY() {
        return new Vector3(0, -1, 0);
    }

    static get negativeUnitZ() {
        return new Vector3(0, 0, -1);
    }

    /**
     * Up vector
     */
    static get up() {
        return new Vector3(0, 1, 0);
    }

    /**
     * Down vector
     */
    static get down() {
        return new Vector3(0, -1, 0);
    }

    /**
     * Left vector
     */
    static get left() {
        return new Vector3(-1, 0, 0);
    }

    /**
     * Right vector
     */
    static get right() {
        return new Vector3(1, 0, 0);
    }

    /**
     * Forward vector (positive Z)
     */
    static get forward() {
        return new Vector3(0, 0, 1);
    }

    /**
     * Backward vector (negative Z)
     */
    static get backward() {
        return new Vector3(0, 0, -1);
    }
}
