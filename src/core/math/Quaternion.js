/**
 * @class Quaternion
 * @description Quaternion class for representing 3D rotations with comprehensive operations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Set quaternion components
     */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    /**
     * Copy quaternion from another quaternion
     */
    copy(q) {
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;
        return this;
    }

    /**
     * Clone quaternion
     */
    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    /**
     * Set from axis-angle
     */
    setFromAxisAngle(axis, angle) {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);
        
        return this;
    }

    /**
     * Set from Euler angles (YXZ order to avoid gimbal lock)
     */
    setFromEuler(euler) {
        const x = euler.x, y = euler.y, z = euler.z;
        
        const c1 = Math.cos(x / 2);
        const c2 = Math.cos(y / 2);
        const c3 = Math.cos(z / 2);
        
        const s1 = Math.sin(x / 2);
        const s2 = Math.sin(y / 2);
        const s3 = Math.sin(z / 2);
        
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        
        return this;
    }

    /**
     * Set from matrix
     */
    setFromRotationMatrix(m) {
        const e = m.elements;
        const m00 = e[0], m01 = e[4], m02 = e[8];
        const m10 = e[1], m11 = e[5], m12 = e[9];
        const m20 = e[2], m21 = e[6], m22 = e[10];
        
        const trace = m00 + m11 + m22;
        
        if (trace > 0) {
            const s = Math.sqrt(trace + 1.0) * 2; // s=4*qw
            this.w = 0.25 * s;
            this.x = (m21 - m12) / s;
            this.y = (m02 - m20) / s;
            this.z = (m10 - m01) / s;
        } else if ((m00 > m11) && (m00 > m22)) {
            const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // s=4*qx
            this.w = (m21 - m12) / s;
            this.x = 0.25 * s;
            this.y = (m01 + m10) / s;
            this.z = (m02 + m20) / s;
        } else if (m11 > m22) {
            const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // s=4*qy
            this.w = (m02 - m20) / s;
            this.x = (m01 + m10) / s;
            this.y = 0.25 * s;
            this.z = (m12 + m21) / s;
        } else {
            const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // s=4*qz
            this.w = (m10 - m01) / s;
            this.x = (m02 + m20) / s;
            this.y = (m12 + m21) / s;
            this.z = 0.25 * s;
        }
        
        return this;
    }

    /**
     * Set from direction vector and up vector
     */
    setFromDirection(direction, up = Vector3.up) {
        const m = new Matrix4();
        const x = direction.clone().normalize();
        const z = x.clone().cross(up).normalize();
        const y = z.clone().cross(x).normalize();
        
        const elements = m.elements;
        elements[0] = x.x; elements[4] = y.x; elements[8] = z.x;  elements[12] = 0;
        elements[1] = x.y; elements[5] = y.y; elements[9] = z.y;  elements[13] = 0;
        elements[2] = x.z; elements[6] = y.z; elements[10] = z.z; elements[14] = 0;
        elements[3] = 0;  elements[7] = 0;  elements[11] = 0;  elements[15] = 1;
        
        return this.setFromRotationMatrix(m);
    }

    /**
     * Add quaternion
     */
    add(q) {
        this.x += q.x;
        this.y += q.y;
        this.z += q.z;
        this.w += q.w;
        return this;
    }

    /**
     * Add quaternions and return new quaternion
     */
    addQuaternions(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        this.w = a.w + b.w;
        return this;
    }

    /**
     * Subtract quaternion
     */
    sub(q) {
        this.x -= q.x;
        this.y -= q.y;
        this.z -= q.z;
        this.w -= q.w;
        return this;
    }

    /**
     * Subtract quaternions and return new quaternion
     */
    subQuaternions(a, b) {
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
     * Multiply by quaternion
     */
    multiply(q) {
        const ax = this.x, ay = this.y, az = this.z, aw = this.w;
        const bx = q.x, by = q.y, bz = q.z, bw = q.w;
        
        this.x = ax * bw + aw * bx + ay * bz - az * by;
        this.y = ay * bw + aw * by + az * bx - ax * bz;
        this.z = az * bw + aw * bz + ax * by - ay * bx;
        this.w = aw * bw - ax * bx - ay * by - az * bz;
        
        return this;
    }

    /**
     * Multiply quaternions and return new quaternion
     */
    multiplyQuaternions(a, b) {
        const ax = a.x, ay = a.y, az = a.z, aw = a.w;
        const bx = b.x, by = b.y, bz = b.z, bw = b.w;
        
        this.x = ax * bw + aw * bx + ay * bz - az * by;
        this.y = ay * bw + aw * by + az * bx - ax * bz;
        this.z = az * bw + aw * bz + ax * by - ay * bx;
        this.w = aw * bw - ax * bx - ay * by - az * bz;
        
        return this;
    }

    /**
     * Pre-multiply by quaternion
     */
    premultiply(q) {
        const ax = this.x, ay = this.y, az = this.z, aw = this.w;
        const bx = q.x, by = q.y, bz = q.z, bw = q.w;
        
        this.x = bx * aw + bw * ax + by * az - bz * ay;
        this.y = by * aw + bw * ay + bz * ax - bx * az;
        this.z = bz * aw + bw * az + bx * ay - by * ax;
        this.w = bw * aw - bx * ax - by * ay - bz * az;
        
        return this;
    }

    /**
     * Conjugate quaternion
     */
    conjugate() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    /**
     * Get conjugate (returns new quaternion)
     */
    getConjugate() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    /**
     * Invert quaternion
     */
    invert() {
        const dot = this.dot(this);
        const invDot = dot !== 0 ? 1.0 / dot : 0;
        
        this.x = -this.x * invDot;
        this.y = -this.y * invDot;
        this.z = -this.z * invDot;
        this.w = this.w * invDot;
        
        return this;
    }

    /**
     * Get inverse (returns new quaternion)
     */
    getInverse() {
        const result = this.clone();
        return result.invert();
    }

    /**
     * Normalize quaternion
     */
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.multiplyScalar(1 / len);
        }
        return this;
    }

    /**
     * Get length of quaternion
     */
    length() {
        return Math.hypot(this.x, this.y, this.z, this.w);
    }

    /**
     * Get squared length of quaternion
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    /**
     * Dot product with another quaternion
     */
    dot(q) {
        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    }

    /**
     * Slerp (spherical linear interpolation)
     */
    slerp(qb, t) {
        const qa = this;
        let cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
        
        // If qa=qb or qa=-qb then theta = 0 and we can return qa
        if (cosHalfTheta >= 1.0 || cosHalfTheta <= -1.0) {
            return this;
        }
        
        // If θ > 180°, swap quaternions to ensure shortest path
        if (cosHalfTheta < 0.0) {
            this.copy(qa);
            qa.x = -qb.x; qa.y = -qb.y; qa.z = -qb.z; qa.w = -qb.w;
            cosHalfTheta = -this.dot(qa);
        }
        
        // Calculate θ
        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
        
        // If θ = 180° then result is undefined
        if (Math.abs(sinHalfTheta) < 0.001) {
            this.x = qa.x * t + qb.x * (1 - t);
            this.y = qa.y * t + qb.y * (1 - t);
            this.z = qa.z * t + qb.z * (1 - t);
            this.w = qa.w * t + qb.w * (1 - t);
            this.normalize();
            return this;
        }
        
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
        
        this.x = qa.x * ratioA + qb.x * ratioB;
        this.y = qa.y * ratioA + qb.y * ratioB;
        this.z = qa.z * ratioA + qb.z * ratioB;
        this.w = qa.w * ratioA + qb.w * ratioB;
        
        return this;
    }

    /**
     * Slerp quaternions and return new quaternion
     */
    static slerp(a, b, t) {
        return a.clone().slerp(b, t);
    }

    /**
     * Squad (spherical quadrangle interpolation)
     */
    squad(q1, q2, q3, t) {
        const omega1 = Math.acos(this.dot(q1));
        const omega2 = Math.acos(q1.dot(q2));
        const omega3 = Math.acos(q2.dot(q3));
        const sinOmega1 = Math.sin(omega1);
        const sinOmega2 = Math.sin(omega2);
        const sinOmega3 = Math.sin(omega3);
        
        const t1 = Math.sin((1 - t) * omega1) / sinOmega1;
        const t2 = Math.sin(t * omega2) / sinOmega2;
        const t3 = Math.sin((1 - t) * omega3) / sinOmega3;
        
        const intermediate = q1.clone().multiplyScalar(t1)
            .add(q2.clone().multiplyScalar(t2))
            .add(q3.clone().multiplyScalar(t3));
        
        return this.copy(intermediate);
    }

    /**
     * Convert to Euler angles (YXZ order)
     */
    toEuler() {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        
        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;
        
        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;
        
        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;
        
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;
        
        return new Vector3(
            Math.asin(Math.max(-1, Math.min(1, wy - zx))),
            Math.atan2(xz + wx, 1 - (xx + yy)),
            Math.atan2(yz + wx, 1 - (xx + zz))
        );
    }

    /**
     * Convert to axis-angle representation
     */
    toAxisAngle() {
        const w = this.w;
        const w2 = w * w;
        const l2 = this.lengthSq();
        
        if (l2 === 0) {
            return { axis: new Vector3(1, 0, 0), angle: 0 };
        }
        
        const invL = 1 / Math.sqrt(l2);
        const axis = new Vector3(this.x * invL, this.y * invL, this.z * invL);
        const angle = 2 * Math.acos(Math.max(-1, Math.min(1, w2 * invL)));
        
        return { axis, angle };
    }

    /**
     * Apply quaternion to vector
     */
    applyToVector3(v) {
        const x = v.x, y = v.y, z = v.z;
        const qx = this.x, qy = this.y, qz = this.z, qw = this.w;
        
        // calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        
        // calculate result * inverse quat
        return new Vector3(
            ix * qw + iw * -qx + iy * -qz - iz * -qy,
            iy * qw + iw * -qy + iz * -qx - ix * -qz,
            iz * qw + iw * -qz + ix * -qy - iy * -qx
        );
    }

    /**
     * Apply quaternion to vector (in-place)
     */
    applyToVector3ToRef(v, target) {
        const x = v.x, y = v.y, z = v.z;
        const qx = this.x, qy = this.y, qz = this.z, qw = this.w;
        
        // calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        
        // calculate result * inverse quat
        target.set(
            ix * qw + iw * -qx + iy * -qz - iz * -qy,
            iy * qw + iw * -qy + iz * -qx - ix * -qz,
            iz * qw + iw * -qz + ix * -qy - iy * -qx
        );
        return target;
    }

    /**
     * Check if quaternion equals another quaternion (with tolerance)
     */
    equals(q, tolerance = 1e-6) {
        return Math.abs(this.x - q.x) < tolerance && 
               Math.abs(this.y - q.y) < tolerance && 
               Math.abs(this.z - q.z) < tolerance && 
               Math.abs(this.w - q.w) < tolerance;
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
     * Get string representation
     */
    toString() {
        return `Quaternion(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)}, ${this.w.toFixed(3)})`;
    }

    /**
     * Static methods
     */

    /**
     * Create from axis-angle
     */
    static fromAxisAngle(axis, angle) {
        return new Quaternion().setFromAxisAngle(axis, angle);
    }

    /**
     * Create from Euler angles
     */
    static fromEuler(euler) {
        return new Quaternion().setFromEuler(euler);
    }

    /**
     * Create from rotation matrix
     */
    static fromRotationMatrix(m) {
        return new Quaternion().setFromRotationMatrix(m);
    }

    /**
     * Create from direction and up vectors
     */
    static fromDirection(direction, up = Vector3.up) {
        return new Quaternion().setFromDirection(direction, up);
    }

    /**
     * Get shortest arc rotation from one vector to another
     */
    static getRotationFromVectorAToVectorB(vecA, vecB) {
        const v0 = vecA.clone().normalize();
        const v1 = vecB.clone().normalize();
        const d = v0.dot(v1);
        
        if (d >= 1.0) {
            return new Quaternion(); // Identity quaternion
        }
        
        if (d <= -1.0) {
            // 180 degree rotation around any perpendicular axis
            const axis = new Vector3(1, 0, 0).cross(v0);
            if (axis.length() < 1e-6) {
                axis.set(0, 1, 0).cross(v0);
            }
            axis.normalize();
            return new Quaternion().setFromAxisAngle(axis, Math.PI);
        }
        
        const axis = v0.clone().cross(v1);
        const s = Math.sqrt((1 + d) * 2);
        const invS = 1 / s;
        
        return new Quaternion(
            axis.x * invS,
            axis.y * invS,
            axis.z * invS,
            s * 0.5
        );
    }

    /**
     * Random quaternion
     */
    static random() {
        const u1 = Math.random();
        const u2 = Math.random();
        const u3 = Math.random();
        
        const sqrt1MinusU1 = Math.sqrt(1 - u1);
        const sqrtU1 = Math.sqrt(u1);
        
        return new Quaternion(
            sqrt1MinusU1 * Math.sin(2 * Math.PI * u2),
            sqrt1MinusU1 * Math.cos(2 * Math.PI * u2),
            sqrtU1 * Math.sin(2 * Math.PI * u3),
            sqrtU1 * Math.cos(2 * Math.PI * u3)
        );
    }

    /**
     * Identity quaternion
     */
    static get identity() {
        return new Quaternion(0, 0, 0, 1);
    }
}

// Import Vector3 for this file
import { Vector3 } from './Vector3.js';
