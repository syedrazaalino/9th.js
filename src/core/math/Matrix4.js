/**
 * @class Matrix4
 * @description 4x4 matrix class with comprehensive operations and optimizations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Matrix4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.identity();
    }

    /**
     * Set matrix to identity
     */
    identity() {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0;  e[12] = 0;
        e[1] = 0; e[5] = 1; e[9] = 0;  e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    /**
     * Copy matrix from another matrix
     */
    copy(m) {
        const e = this.elements, t = m.elements;
        for (let i = 0; i < 16; i++) {
            e[i] = t[i];
        }
        return this;
    }

    /**
     * Clone matrix
     */
    clone() {
        return new Matrix4().copy(this);
    }

    /**
     * Set matrix from array
     */
    fromArray(array, offset = 0) {
        const e = this.elements;
        for (let i = 0; i < 16; i++) {
            e[i] = array[i + offset];
        }
        return this;
    }

    /**
     * Convert to array
     */
    toArray() {
        return Array.from(this.elements);
    }

    /**
     * Convert to array with offset
     */
    toArrayWithOffset(array, offset = 0) {
        for (let i = 0; i < 16; i++) {
            array[i + offset] = this.elements[i];
        }
        return array;
    }

    /**
     * Add matrix
     */
    add(m) {
        const e = this.elements, t = m.elements;
        for (let i = 0; i < 16; i++) {
            e[i] += t[i];
        }
        return this;
    }

    /**
     * Add matrices and return new matrix
     */
    addMatrices(a, b) {
        const e = this.elements, ae = a.elements, be = b.elements;
        for (let i = 0; i < 16; i++) {
            e[i] = ae[i] + be[i];
        }
        return this;
    }

    /**
     * Subtract matrix
     */
    sub(m) {
        const e = this.elements, t = m.elements;
        for (let i = 0; i < 16; i++) {
            e[i] -= t[i];
        }
        return this;
    }

    /**
     * Subtract matrices and return new matrix
     */
    subMatrices(a, b) {
        const e = this.elements, ae = a.elements, be = b.elements;
        for (let i = 0; i < 16; i++) {
            e[i] = ae[i] - be[i];
        }
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        const e = this.elements;
        for (let i = 0; i < 16; i++) {
            e[i] *= s;
        }
        return this;
    }

    /**
     * Multiply by matrix
     */
    multiply(m) {
        const e = this.elements, t = m.elements;
        
        const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
        const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
        const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
        const a30 = e[12], a31 = e[13], a32 = e[14], a33 = e[15];
        
        const b00 = t[0], b01 = t[1], b02 = t[2], b03 = t[3];
        const b10 = t[4], b11 = t[5], b12 = t[6], b13 = t[7];
        const b20 = t[8], b21 = t[9], b22 = t[10], b23 = t[11];
        const b30 = t[12], b31 = t[13], b32 = t[14], b33 = t[15];
        
        e[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        e[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        e[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        e[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        
        e[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        e[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        e[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        e[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        
        e[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        e[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        e[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        e[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        
        e[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        e[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        e[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        e[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        
        return this;
    }

    /**
     * Multiply matrices and return new matrix
     */
    multiplyMatrices(a, b) {
        const e = this.elements, ae = a.elements, be = b.elements;
        
        const a00 = ae[0], a01 = ae[1], a02 = ae[2], a03 = ae[3];
        const a10 = ae[4], a11 = ae[5], a12 = ae[6], a13 = ae[7];
        const a20 = ae[8], a21 = ae[9], a22 = ae[10], a23 = ae[11];
        const a30 = ae[12], a31 = ae[13], a32 = ae[14], a33 = ae[15];
        
        const b00 = be[0], b01 = be[1], b02 = be[2], b03 = be[3];
        const b10 = be[4], b11 = be[5], b12 = be[6], b13 = be[7];
        const b20 = be[8], b21 = be[9], b22 = be[10], b23 = be[11];
        const b30 = be[12], b31 = be[13], b32 = be[14], b33 = be[15];
        
        e[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        e[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        e[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        e[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        
        e[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        e[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        e[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        e[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        
        e[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        e[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        e[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        e[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        
        e[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        e[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        e[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        e[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        
        return this;
    }

    /**
     * Multiply vector (returns new vector)
     */
    multiplyVector3(v) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z;
        const w = e[3] * x + e[7] * y + e[11] * z + e[15];
        
        return new Vector3(
            (e[0] * x + e[4] * y + e[8] * z + e[12]) / w,
            (e[1] * x + e[5] * y + e[9] * z + e[13]) / w,
            (e[2] * x + e[6] * y + e[10] * z + e[14]) / w
        );
    }

    /**
     * Multiply vector (in-place)
     */
    multiplyVector3ToRef(v, target) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z;
        const w = e[3] * x + e[7] * y + e[11] * z + e[15];
        
        target.set(
            (e[0] * x + e[4] * y + e[8] * z + e[12]) / w,
            (e[1] * x + e[5] * y + e[9] * z + e[13]) / w,
            (e[2] * x + e[6] * y + e[10] * z + e[14]) / w
        );
        return target;
    }

    /**
     * Multiply vector by transformation matrix (no translation)
     */
    multiplyVector3Direction(v) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z;
        
        return new Vector3(
            e[0] * x + e[4] * y + e[8] * z,
            e[1] * x + e[5] * y + e[9] * z,
            e[2] * x + e[6] * y + e[10] * z
        );
    }

    /**
     * Multiply 4D vector
     */
    multiplyVector4(v) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z, w = v.w;
        
        return new Vector4(
            e[0] * x + e[4] * y + e[8] * z + e[12] * w,
            e[1] * x + e[5] * y + e[9] * z + e[13] * w,
            e[2] * x + e[6] * y + e[10] * z + e[14] * w,
            e[3] * x + e[7] * y + e[11] * z + e[15] * w
        );
    }

    /**
     * Get determinant
     */
    determinant() {
        const e = this.elements;
        
        const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
        const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
        const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
        const a30 = e[12], a31 = e[13], a32 = e[14], a33 = e[15];
        
        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;
        
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }

    /**
     * Invert matrix
     */
    invert() {
        const e = this.elements;
        
        const a00 = e[0], a01 = e[1], a02 = e[2], a03 = e[3];
        const a10 = e[4], a11 = e[5], a12 = e[6], a13 = e[7];
        const a20 = e[8], a21 = e[9], a22 = e[10], a23 = e[11];
        const a30 = e[12], a31 = e[13], a32 = e[14], a33 = e[15];
        
        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;
        
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        
        if (det === 0) {
            return this.identity();
        }
        
        det = 1.0 / det;
        
        e[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        e[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        e[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        e[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        e[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        e[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        e[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        e[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        e[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        e[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        e[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        e[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        e[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        e[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        e[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        e[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
        
        return this;
    }

    /**
     * Get transpose
     */
    transpose() {
        const e = this.elements;
        let t;
        
        t = e[1]; e[1] = e[4]; e[4] = t;
        t = e[2]; e[2] = e[8]; e[8] = t;
        t = e[3]; e[3] = e[12]; e[12] = t;
        t = e[6]; e[6] = e[9]; e[9] = t;
        t = e[7]; e[7] = e[13]; e[13] = t;
        t = e[11]; e[11] = e[14]; e[14] = t;
        
        return this;
    }

    /**
     * Get transpose (returns new matrix)
     */
    getTranspose() {
        const result = new Matrix4();
        const e = this.elements, r = result.elements;
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                r[j * 4 + i] = e[i * 4 + j];
            }
        }
        
        return result;
    }

    /**
     * Set from rotation matrix (axis-angle)
     */
    makeRotationFromAxisAngle(axis, angle) {
        const e = this.elements;
        const x = axis.x, y = axis.y, z = axis.z;
        const len = Math.hypot(x, y, z);
        
        if (len === 0) return this.identity();
        
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const invLen = 1 / len;
        
        const nx = x * invLen, ny = y * invLen, nz = z * invLen;
        const t = 1 - c;
        
        e[0] = nx * nx * t + c;
        e[1] = ny * nx * t + nz * s;
        e[2] = nz * nx * t - ny * s;
        e[3] = 0;
        
        e[4] = nx * ny * t - nz * s;
        e[5] = ny * ny * t + c;
        e[6] = nz * ny * t + nx * s;
        e[7] = 0;
        
        e[8] = nx * nz * t + ny * s;
        e[9] = ny * nz * t - nx * s;
        e[10] = nz * nz * t + c;
        e[11] = 0;
        
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        
        return this;
    }

    /**
     * Set from quaternion
     */
    makeRotationFromQuaternion(quaternion) {
        const e = this.elements;
        const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        
        e[0] = 1 - (yy + zz);
        e[1] = xy + wz;
        e[2] = xz - wy;
        e[3] = 0;
        
        e[4] = xy - wz;
        e[5] = 1 - (xx + zz);
        e[6] = yz + wx;
        e[7] = 0;
        
        e[8] = xz + wy;
        e[9] = yz - wx;
        e[10] = 1 - (xx + yy);
        e[11] = 0;
        
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        
        return this;
    }

    /**
     * Set from Euler angles
     */
    makeRotationFromEuler(euler) {
        const e = this.elements;
        const x = euler.x, y = euler.y, z = euler.z;
        
        const c1 = Math.cos(x), s1 = Math.sin(x);
        const c2 = Math.cos(y), s2 = Math.sin(y);
        const c3 = Math.cos(z), s3 = Math.sin(z);
        
        e[0] = c2 * c3;
        e[1] = c2 * s3;
        e[2] = -s2;
        e[3] = 0;
        
        e[4] = s1 * s2 * c3 - c1 * s3;
        e[5] = s1 * s2 * s3 + c1 * c3;
        e[6] = s1 * c2;
        e[7] = 0;
        
        e[8] = c1 * s2 * c3 + s1 * s3;
        e[9] = c1 * s2 * s3 - s1 * c3;
        e[10] = c1 * c2;
        e[11] = 0;
        
        e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
        
        return this;
    }

    /**
     * Set from scaling matrix
     */
    makeScale(x, y, z) {
        const e = this.elements;
        e[0] = x; e[4] = 0; e[8] = 0;  e[12] = 0;
        e[1] = 0; e[5] = y; e[9] = 0;  e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = z; e[14] = 0;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    /**
     * Set from translation matrix
     */
    makeTranslation(x, y, z) {
        const e = this.elements;
        e[0] = 1; e[4] = 0; e[8] = 0;  e[12] = x;
        e[1] = 0; e[5] = 1; e[9] = 0;  e[13] = y;
        e[2] = 0; e[6] = 0; e[10] = 1; e[14] = z;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        return this;
    }

    /**
     * Make look-at matrix
     */
    makeLookAt(eye, target, up) {
        const e = this.elements;
        const f = new Vector3().subVectors(target, eye).normalize();
        const s = new Vector3().crossVectors(f, up).normalize();
        const u = new Vector3().crossVectors(s, f);
        
        e[0] = s.x; e[1] = u.x; e[2] = -f.x; e[3] = 0;
        e[4] = s.y; e[5] = u.y; e[6] = -f.y; e[7] = 0;
        e[8] = s.z; e[9] = u.z; e[10] = -f.z; e[11] = 0;
        e[12] = -s.dot(eye); e[13] = -u.dot(eye); e[14] = f.dot(eye); e[15] = 1;
        
        return this;
    }

    /**
     * Make perspective matrix
     */
    makePerspective(fov, aspect, near, far) {
        const e = this.elements;
        const f = 1.0 / Math.tan(fov / 2);
        
        e[0] = f / aspect; e[4] = 0; e[8] = 0;  e[12] = 0;
        e[1] = 0; e[5] = f; e[9] = 0;  e[13] = 0;
        e[2] = 0; e[6] = 0; e[10] = (far + near) / (near - far); e[14] = (2 * far * near) / (near - far);
        e[3] = 0; e[7] = 0; e[11] = -1; e[15] = 0;
        
        return this;
    }

    /**
     * Make orthographic matrix
     */
    makeOrthographic(left, right, top, bottom, near, far) {
        const e = this.elements;
        const lr = 1 / (right - left);
        const bt = 1 / (top - bottom);
        const nf = 1 / (far - near);
        
        e[0] = 2 * lr; e[4] = 0; e[8] = 0;  e[12] = -(right + left) * lr;
        e[1] = 0; e[5] = 2 * bt; e[9] = 0;  e[13] = -(top + bottom) * bt;
        e[2] = 0; e[6] = 0; e[10] = -2 * nf; e[14] = -(far + near) * nf;
        e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
        
        return this;
    }

    /**
     * Extract rotation matrix (3x3)
     */
    extractRotation() {
        const result = new Matrix3();
        const e = this.elements, r = result.elements;
        
        const scaleX = Math.hypot(e[0], e[1], e[2]);
        const scaleY = Math.hypot(e[4], e[5], e[6]);
        const scaleZ = Math.hypot(e[8], e[9], e[10]);
        
        if (scaleX !== 0) {
            r[0] = e[0] / scaleX; r[1] = e[1] / scaleX; r[2] = e[2] / scaleX;
        }
        if (scaleY !== 0) {
            r[3] = e[4] / scaleY; r[4] = e[5] / scaleY; r[5] = e[6] / scaleY;
        }
        if (scaleZ !== 0) {
            r[6] = e[8] / scaleZ; r[7] = e[9] / scaleZ; r[8] = e[10] / scaleZ;
        }
        
        return result;
    }

    /**
     * Extract translation vector
     */
    extractTranslation() {
        return new Vector3(this.elements[12], this.elements[13], this.elements[14]);
    }

    /**
     * Extract scaling factors
     */
    extractScaling() {
        const e = this.elements;
        return new Vector3(
            Math.hypot(e[0], e[1], e[2]),
            Math.hypot(e[4], e[5], e[6]),
            Math.hypot(e[8], e[9], e[10])
        );
    }

    /**
     * Check if matrix equals another matrix (with tolerance)
     */
    equals(m, tolerance = 1e-6) {
        const e = this.elements, t = m.elements;
        for (let i = 0; i < 16; i++) {
            if (Math.abs(e[i] - t[i]) > tolerance) return false;
        }
        return true;
    }

    /**
     * Get string representation
     */
    toString() {
        const e = this.elements;
        return `Matrix4(
  ${e[0].toFixed(3)}, ${e[4].toFixed(3)}, ${e[8].toFixed(3)}, ${e[12].toFixed(3)},
  ${e[1].toFixed(3)}, ${e[5].toFixed(3)}, ${e[9].toFixed(3)}, ${e[13].toFixed(3)},
  ${e[2].toFixed(3)}, ${e[6].toFixed(3)}, ${e[10].toFixed(3)}, ${e[14].toFixed(3)},
  ${e[3].toFixed(3)}, ${e[7].toFixed(3)}, ${e[11].toFixed(3)}, ${e[15].toFixed(3)}
)`;
    }

    /**
     * Static methods
     */

    /**
     * Create rotation matrix from axis-angle
     */
    static rotationFromAxisAngle(axis, angle) {
        return new Matrix4().makeRotationFromAxisAngle(axis, angle);
    }

    /**
     * Create rotation matrix from quaternion
     */
    static rotationFromQuaternion(quaternion) {
        return new Matrix4().makeRotationFromQuaternion(quaternion);
    }

    /**
     * Create rotation matrix from Euler angles
     */
    static rotationFromEuler(euler) {
        return new Matrix4().makeRotationFromEuler(euler);
    }

    /**
     * Create scaling matrix
     */
    static scale(x, y, z) {
        return new Matrix4().makeScale(x, y, z);
    }

    /**
     * Create translation matrix
     */
    static translation(x, y, z) {
        return new Matrix4().makeTranslation(x, y, z);
    }

    /**
     * Create look-at matrix
     */
    static lookAt(eye, target, up) {
        return new Matrix4().makeLookAt(eye, target, up);
    }

    /**
     * Create perspective matrix
     */
    static perspective(fov, aspect, near, far) {
        return new Matrix4().makePerspective(fov, aspect, near, far);
    }

    /**
     * Create orthographic matrix
     */
    static orthographic(left, right, top, bottom, near, far) {
        return new Matrix4().makeOrthographic(left, right, top, bottom, near, far);
    }

    /**
     * Check if two matrices are equal
     */
    static equals(a, b, tolerance = 1e-6) {
        return a.equals(b, tolerance);
    }

    /**
     * Identity matrix
     */
    static get identity() {
        return new Matrix4().identity();
    }

    /**
     * Zero matrix
     */
    static get zero() {
        const m = new Matrix4();
        const e = m.elements;
        for (let i = 0; i < 16; i++) e[i] = 0;
        return m;
    }
}

// Import Vector3 and Vector4 for this file
import { Vector3 } from './Vector3.js';
import { Vector4 } from './Vector4.js';
import { Matrix3 } from './Matrix3.js';
