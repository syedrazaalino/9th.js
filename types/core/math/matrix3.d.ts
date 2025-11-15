/**
 * Matrix3 Type Definitions
 * 3x3 matrix mathematics
 */

/**
 * Matrix3 - 3x3 matrix implementation
 */
export declare class Matrix3 {
    public elements: number[];

    constructor();

    /**
     * Set matrix elements (row-major order)
     */
    set(
        n11: number, n12: number, n13: number,
        n21: number, n22: number, n23: number,
        n31: number, n32: number, n33: number
    ): Matrix3;

    /**
     * Identity matrix
     */
    identity(): Matrix3;

    /**
     * Copy matrix from another matrix
     */
    copy(source: Matrix3): Matrix3;

    /**
     * Clone matrix
     */
    clone(): Matrix3;

    /**
     * Extract matrix from 4x4 matrix
     */
    extractFromMatrix4(matrix4: any): Matrix3;

    /**
     * Set from matrix elements array
     */
    fromArray(array: number[], offset?: number): Matrix3;

    /**
     * Get matrix as array
     */
    toArray(): number[];

    /**
     * Transpose matrix
     */
    transpose(): Matrix3;

    /**
     * Get transpose (return new matrix)
     */
    transposeIntoArray(target?: number[]): number[];

    /**
     * Multiply matrix by scalar
     */
    multiplyScalar(s: number): Matrix3;

    /**
     * Invert matrix
     */
    invert(): Matrix3;

    /**
     * Get matrix determinant
     */
    determinant(): number;

    /**
     * Multiply two matrices
     */
    multiply(m: Matrix3): Matrix3;

    /**
     * Multiply matrices and store result
     */
    multiplyMatrices(a: Matrix3, b: Matrix3): Matrix3;

    /**
     * Apply matrix to vector
     */
    applyToVector3Array(array: number[], offset?: number, length?: number): number[];

    /**
     * Apply to 3D vector
     */
    applyToVector3(v: any, v2?: any): any;

    /**
     * Set matrix from quaternion
     */
    setFromMatrix4(m: any): Matrix3;

    /**
     * Get normal matrix (inverse transpose)
     */
    getNormalMatrix(matrix4: any): Matrix3;

    /**
     * Set UV transform
     */
    setUvTransform(tx: number, ty: number, sx: number, sy: number, rotation: number, cx: number, cy: number): Matrix3;

    /**
     * Scale matrix
     */
    scale(sx: number, sy: number): Matrix3;

    /**
     * Rotate matrix
     */
    rotate(theta: number): Matrix3;

    /**
     * Translate matrix
     */
    translate(tx: number, ty: number): Matrix3;

    /**
     * Check for equality
     */
    equals(matrix: Matrix3): boolean;

    /**
     * Convert to 2D array
     */
    toMatrix2(): number[][];
}

// Utility functions for Matrix3
export declare namespace Matrix3 {
    function multiplyMatrices(a: Matrix3, b: Matrix3, target?: Matrix3): Matrix3;
    function invert(m: Matrix3, target?: Matrix3): Matrix3;
    function transpose(m: Matrix3, target?: Matrix3): Matrix3;
}