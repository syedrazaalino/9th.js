/**
 * @class Matrix3
 * @description 3x3 matrix class with comprehensive operations and optimizations
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Matrix3 {
    constructor() {
        this.elements = new Float32Array(9);
        this.identity();
    }

    /**
     * Set matrix to identity
     */
    identity() {
        const e = this.elements;
        e[0] = 1; e[3] = 0; e[6] = 0;
        e[1] = 0; e[4] = 1; e[7] = 0;
        e[2] = 0; e[5] = 0; e[8] = 1;
        return this;
    }

    /**
     * Copy matrix from another matrix
     */
    copy(m) {
        const e = this.elements, t = m.elements;
        e[0] = t[0]; e[3] = t[3]; e[6] = t[6];
        e[1] = t[1]; e[4] = t[4]; e[7] = t[7];
        e[2] = t[2]; e[5] = t[5]; e[8] = t[8];
        return this;
    }

    /**
     * Clone matrix
     */
    clone() {
        return new Matrix3().copy(this);
    }

    /**
     * Set matrix from array
     */
    fromArray(array, offset = 0) {
        const e = this.elements;
        for (let i = 0; i < 9; i++) {
            e[i] = array[i + offset];
        }
        return this;
    }

    /**
     * Set matrix from 2D array
     */
    from2DArray(array) {
        const e = this.elements;
        e[0] = array[0][0]; e[3] = array[0][1]; e[6] = array[0][2];
        e[1] = array[1][0]; e[4] = array[1][1]; e[7] = array[1][2];
        e[2] = array[2][0]; e[5] = array[2][1]; e[8] = array[2][2];
        return this;
    }

    /**
     * Convert to 2D array
     */
    to2DArray() {
        const e = this.elements;
        return [
            [e[0], e[3], e[6]],
            [e[1], e[4], e[7]],
            [e[2], e[5], e[8]]
        ];
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
        for (let i = 0; i < 9; i++) {
            array[i + offset] = this.elements[i];
        }
        return array;
    }

    /**
     * Add matrix
     */
    add(m) {
        const e = this.elements, t = m.elements;
        e[0] += t[0]; e[3] += t[3]; e[6] += t[6];
        e[1] += t[1]; e[4] += t[4]; e[7] += t[7];
        e[2] += t[2]; e[5] += t[5]; e[8] += t[8];
        return this;
    }

    /**
     * Add matrices and return new matrix
     */
    addMatrices(a, b) {
        const e = this.elements, te = a.elements, be = b.elements;
        e[0] = te[0] + be[0]; e[3] = te[3] + be[3]; e[6] = te[6] + be[6];
        e[1] = te[1] + be[1]; e[4] = te[4] + be[4]; e[7] = te[7] + be[7];
        e[2] = te[2] + be[2]; e[5] = te[5] + be[5]; e[8] = te[8] + be[8];
        return this;
    }

    /**
     * Subtract matrix
     */
    sub(m) {
        const e = this.elements, t = m.elements;
        e[0] -= t[0]; e[3] -= t[3]; e[6] -= t[6];
        e[1] -= t[1]; e[4] -= t[4]; e[7] -= t[7];
        e[2] -= t[2]; e[5] -= t[5]; e[8] -= t[8];
        return this;
    }

    /**
     * Subtract matrices and return new matrix
     */
    subMatrices(a, b) {
        const e = this.elements, te = a.elements, be = b.elements;
        e[0] = te[0] - be[0]; e[3] = te[3] - be[3]; e[6] = te[6] - be[6];
        e[1] = te[1] - be[1]; e[4] = te[4] - be[4]; e[7] = te[7] - be[7];
        e[2] = te[2] - be[2]; e[5] = te[5] - be[5]; e[8] = te[8] - be[8];
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        const e = this.elements;
        e[0] *= s; e[3] *= s; e[6] *= s;
        e[1] *= s; e[4] *= s; e[7] *= s;
        e[2] *= s; e[5] *= s; e[8] *= s;
        return this;
    }

    /**
     * Multiply by matrix
     */
    multiply(m) {
        const e = this.elements, t = m.elements;
        
        const a00 = e[0], a01 = e[1], a02 = e[2];
        const a10 = e[3], a11 = e[4], a12 = e[5];
        const a20 = e[6], a21 = e[7], a22 = e[8];
        
        const b00 = t[0], b01 = t[1], b02 = t[2];
        const b10 = t[3], b11 = t[4], b12 = t[5];
        const b20 = t[6], b21 = t[7], b22 = t[8];
        
        e[0] = b00 * a00 + b01 * a10 + b02 * a20;
        e[1] = b00 * a01 + b01 * a11 + b02 * a21;
        e[2] = b00 * a02 + b01 * a12 + b02 * a22;
        
        e[3] = b10 * a00 + b11 * a10 + b12 * a20;
        e[4] = b10 * a01 + b11 * a11 + b12 * a21;
        e[5] = b10 * a02 + b11 * a12 + b12 * a22;
        
        e[6] = b20 * a00 + b21 * a10 + b22 * a20;
        e[7] = b20 * a01 + b21 * a11 + b22 * a21;
        e[8] = b20 * a02 + b21 * a12 + b22 * a22;
        
        return this;
    }

    /**
     * Multiply matrices and return new matrix
     */
    multiplyMatrices(a, b) {
        const e = this.elements, ae = a.elements, be = b.elements;
        
        const a00 = ae[0], a01 = ae[1], a02 = ae[2];
        const a10 = ae[3], a11 = ae[4], a12 = ae[5];
        const a20 = ae[6], a21 = ae[7], a22 = ae[8];
        
        const b00 = be[0], b01 = be[1], b02 = be[2];
        const b10 = be[3], b11 = be[4], b12 = be[5];
        const b20 = be[6], b21 = be[7], b22 = be[8];
        
        e[0] = b00 * a00 + b01 * a10 + b02 * a20;
        e[1] = b00 * a01 + b01 * a11 + b02 * a21;
        e[2] = b00 * a02 + b01 * a12 + b02 * a22;
        
        e[3] = b10 * a00 + b11 * a10 + b12 * a20;
        e[4] = b10 * a01 + b11 * a11 + b12 * a21;
        e[5] = b10 * a02 + b11 * a12 + b12 * a22;
        
        e[6] = b20 * a00 + b21 * a10 + b22 * a20;
        e[7] = b20 * a01 + b21 * a11 + b22 * a21;
        e[8] = b20 * a02 + b21 * a12 + b22 * a22;
        
        return this;
    }

    /**
     * Multiply vector (returns new vector)
     */
    multiplyVector3(v) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z;
        
        return new Vector3(
            e[0] * x + e[3] * y + e[6] * z,
            e[1] * x + e[4] * y + e[7] * z,
            e[2] * x + e[5] * y + e[8] * z
        );
    }

    /**
     * Multiply vector (in-place)
     */
    multiplyVector3ToRef(v, target) {
        const e = this.elements;
        const x = v.x, y = v.y, z = v.z;
        
        target.set(
            e[0] * x + e[3] * y + e[6] * z,
            e[1] * x + e[4] * y + e[7] * z,
            e[2] * x + e[5] * y + e[8] * z
        );
        return target;
    }

    /**
     * Multiply vector (returns new vector)
     */
    multiplyVector2(v) {
        const e = this.elements;
        const x = v.x, y = v.y;
        
        return new Vector2(
            e[0] * x + e[3] * y + e[6],
            e[1] * x + e[4] * y + e[7]
        );
    }

    /**
     * Get determinant
     */
    determinant() {
        const e = this.elements;
        return e[0] * e[4] * e[8] - e[0] * e[5] * e[7] - e[1] * e[3] * e[8] + 
               e[1] * e[5] * e[6] + e[2] * e[3] * e[7] - e[2] * e[4] * e[6];
    }

    /**
     * Invert matrix
     */
    invert() {
        const e = this.elements;
        const a00 = e[0], a01 = e[1], a02 = e[2];
        const a10 = e[3], a11 = e[4], a12 = e[5];
        const a20 = e[6], a21 = e[7], a22 = e[8];
        
        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;
        
        let det = a00 * b01 + a01 * b11 + a02 * b21;
        
        if (det === 0) {
            return this.identity();
        }
        
        det = 1.0 / det;
        
        e[0] = b01 * det;
        e[1] = (-a22 * a01 + a02 * a21) * det;
        e[2] = (a12 * a01 - a02 * a11) * det;
        e[3] = b11 * det;
        e[4] = (a22 * a00 - a02 * a20) * det;
        e[5] = (-a12 * a00 + a02 * a10) * det;
        e[6] = b21 * det;
        e[7] = (-a21 * a00 + a01 * a20) * det;
        e[8] = (a11 * a00 - a01 * a10) * det;
        
        return this;
    }

    /**
     * Get transpose
     */
    transpose() {
        const e = this.elements;
        let t;
        
        t = e[1]; e[1] = e[3]; e[3] = t;
        t = e[2]; e[2] = e[6]; e[6] = t;
        t = e[5]; e[5] = e[7]; e[7] = t;
        
        return this;
    }

    /**
     * Get transpose (returns new matrix)
     */
    getTranspose() {
        const result = new Matrix3();
        const e = this.elements, r = result.elements;
        
        r[0] = e[0]; r[1] = e[3]; r[2] = e[6];
        r[3] = e[1]; r[4] = e[4]; r[5] = e[7];
        r[6] = e[2]; r[7] = e[5]; r[8] = e[8];
        
        return result;
    }

    /**
     * Set from rotation matrix (angle in radians)
     */
    makeRotation(theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        
        const e = this.elements;
        e[0] = c;   e[3] = -s;  e[6] = 0;
        e[1] = s;   e[4] = c;   e[7] = 0;
        e[2] = 0;   e[5] = 0;   e[8] = 1;
        
        return this;
    }

    /**
     * Set from scaling matrix
     */
    makeScale(sx, sy) {
        const e = this.elements;
        e[0] = sx;  e[3] = 0;   e[6] = 0;
        e[1] = 0;   e[4] = sy;  e[7] = 0;
        e[2] = 0;   e[5] = 0;   e[8] = 1;
        
        return this;
    }

    /**
     * Set from translation matrix
     */
    makeTranslation(tx, ty) {
        const e = this.elements;
        e[0] = 1;   e[3] = 0;   e[6] = tx;
        e[1] = 0;   e[4] = 1;   e[7] = ty;
        e[2] = 0;   e[5] = 0;   e[8] = 1;
        
        return this;
    }

    /**
     * Set from shear matrix
     */
    makeShear(shx, shy) {
        const e = this.elements;
        e[0] = 1;   e[3] = shx; e[6] = 0;
        e[1] = shy; e[4] = 1;   e[7] = 0;
        e[2] = 0;   e[5] = 0;   e[8] = 1;
        
        return this;
    }

    /**
     * Decompose into scale and rotation
     */
    decompose() {
        const e = this.elements;
        const sx = Math.hypot(e[0], e[1], e[2]);
        const sy = Math.hypot(e[3], e[4], e[5]);
        const det = this.determinant();
        
        const scaleX = sx;
        const scaleY = sy;
        const rotation = new Matrix3();
        
        if (scaleX !== 0) {
            const invScaleX = 1 / scaleX;
            const r00 = e[0] * invScaleX;
            const r01 = e[1] * invScaleX;
            const r02 = e[2] * invScaleX;
            
            rotation.elements[0] = r00;
            rotation.elements[1] = r01;
            rotation.elements[2] = r02;
        }
        
        if (scaleY !== 0) {
            const invScaleY = 1 / scaleY;
            const r10 = e[3] * invScaleY;
            const r11 = e[4] * invScaleY;
            const r12 = e[5] * invScaleY;
            
            rotation.elements[3] = r10;
            rotation.elements[4] = r11;
            rotation.elements[5] = r12;
        }
        
        rotation.elements[6] = e[6];
        rotation.elements[7] = e[7];
        rotation.elements[8] = e[8];
        
        return {
            scale: new Vector2(scaleX, scaleY),
            rotation: rotation,
            translation: new Vector2(e[6], e[7])
        };
    }

    /**
     * Extract normal matrix from 4x4 matrix
     */
    makeNormalFromMatrix4(matrix4) {
        const e = this.elements, te = matrix4.elements;
        
        const a00 = te[0], a01 = te[1], a02 = te[2];
        const a10 = te[4], a11 = te[5], a12 = te[6];
        const a20 = te[8], a21 = te[9], a22 = te[10];
        
        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;
        
        let det = a00 * b01 + a01 * b11 + a02 * b21;
        
        if (!det) {
            return this.identity();
        }
        
        det = 1.0 / det;
        
        e[0] = b01 * det;
        e[1] = (-a22 * a01 + a02 * a21) * det;
        e[2] = (a12 * a01 - a02 * a11) * det;
        e[3] = b11 * det;
        e[4] = (a22 * a00 - a02 * a20) * det;
        e[5] = (-a12 * a00 + a02 * a10) * det;
        e[6] = b21 * det;
        e[7] = (-a21 * a00 + a01 * a20) * det;
        e[8] = (a11 * a00 - a01 * a10) * det;
        
        return this;
    }

    /**
     * Check if matrix equals another matrix (with tolerance)
     */
    equals(m, tolerance = 1e-6) {
        const e = this.elements, t = m.elements;
        for (let i = 0; i < 9; i++) {
            if (Math.abs(e[i] - t[i]) > tolerance) return false;
        }
        return true;
    }

    /**
     * Get string representation
     */
    toString() {
        const e = this.elements;
        return `Matrix3(
  ${e[0].toFixed(3)}, ${e[3].toFixed(3)}, ${e[6].toFixed(3)},
  ${e[1].toFixed(3)}, ${e[4].toFixed(3)}, ${e[7].toFixed(3)},
  ${e[2].toFixed(3)}, ${e[5].toFixed(3)}, ${e[8].toFixed(3)}
)`;
    }

    /**
     * Static methods
     */

    /**
     * Create rotation matrix
     */
    static rotation(theta) {
        return new Matrix3().makeRotation(theta);
    }

    /**
     * Create scaling matrix
     */
    static scale(sx, sy) {
        return new Matrix3().makeScale(sx, sy);
    }

    /**
     * Create translation matrix
     */
    static translation(tx, ty) {
        return new Matrix3().makeTranslation(tx, ty);
    }

    /**
     * Create shear matrix
     */
    static shear(shx, shy) {
        return new Matrix3().makeShear(shx, shy);
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
        return new Matrix3().identity();
    }

    /**
     * Zero matrix
     */
    static get zero() {
        const m = new Matrix3();
        const e = m.elements;
        e[0] = e[1] = e[2] = e[3] = e[4] = e[5] = e[6] = e[7] = e[8] = 0;
        return m;
    }
}

// Import Vector2 and Vector3 for this file
import { Vector2 } from './Vector2.js';
import { Vector3 } from './Vector3.js';
