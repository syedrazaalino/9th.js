/**
 * Matrix4 Type Definitions
 * 4x4 matrix mathematics
 */

import { Vector3 } from './vector3';
import { Quaternion } from './quaternion';

/**
 * Matrix4 - 4x4 matrix implementation
 */
export declare class Matrix4 {
    public elements: number[];

    constructor();

    /**
     * Set matrix elements (row-major order)
     */
    set(
        n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number
    ): Matrix4;

    /**
     * Identity matrix
     */
    identity(): Matrix4;

    /**
     * Copy matrix from another matrix
     */
    copy(source: Matrix4): Matrix4;

    /**
     * Clone matrix
     */
    clone(): Matrix4;

    /**
     * Extract 3x3 rotation matrix
     */
    extractRotation(matrix: Matrix4): Matrix4;

    /**
     * Make rotation from Euler angles
     */
    makeRotationFromEuler(euler: any): Matrix4;

    /**
     * Make rotation from quaternion
     */
    makeRotationFromQuaternion(quaternion: Quaternion): Matrix4;

    /**
     * Make rotation axis
     */
    makeRotationAxis(axis: Vector3, angle: number): Matrix4;

    /**
     * Make scale
     */
    makeScale(x: number, y: number, z: number): Matrix4;

    /**
     * Make shear
     */
    makeShear(x: number, y: number, z: number): Matrix4;

    /**
     * Make translation
     */
    makeTranslation(x: number, y: number, z: number): Matrix4;

    /**
     * Perspective matrix
     */
    makePerspective(
        left: number, right: number,
        top: number, bottom: number,
        near: number, far: number
    ): Matrix4;

    /**
     * Orthographic projection matrix
     */
    makeOrthographic(
        left: number, right: number,
        top: number, bottom: number,
        near: number, far: number
    ): Matrix4;

    /**
     * Look at matrix
     */
    lookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4;

    /**
     * Multiply matrix by scalar
     */
    multiplyScalar(s: number): Matrix4;

    /**
     * Multiply two matrices
     */
    multiply(m: Matrix4): Matrix4;

    /**
     * Multiply matrices and store result
     */
    multiplyMatrices(a: Matrix4, b: Matrix4): Matrix4;

    /**
     * Multiply matrix and vector
     */
    multiplyVector3(v: Vector3): Vector3;

    /**
     * Multiply 4D vector
     */
    multiplyVector4(v: any): any;

    /**
     * Multiply 3D vectors (transform direction)
     */
    multiplyVector3Array(array: number[], offset?: number, length?: number): number[];

    /**
     * Rotate vector by matrix
     */
    rotateAxis(axis: Vector3): Matrix4;

    /**
     * Cross product helper
     */
    crossVector(v: any): any;

    /**
     * Transpose matrix
     */
    transpose(): Matrix4;

    /**
     * Invert matrix
     */
    invert(): Matrix4;

    /**
     * Invert matrix with simple method
     */
    invertSimple(): Matrix4;

    /**
     * Get matrix determinant
     */
    determinant(): number;

    /**
     * Get matrix position
     */
    getPosition(): Vector3;

    /**
     * Set matrix position
     */
    setPosition(v: Vector3): Matrix4;

    /**
     * Get matrix scale
     */
    getScale(): Vector3;

    /**
     * Get matrix X axis
     */
    getX(): Vector3;

    /**
     * Get matrix Y axis
     */
    getY(): Vector3;

    /**
     * Get matrix Z axis
     */
    getZ(): Vector3;

    /**
     * Set matrix from array
     */
    fromArray(array: number[], offset?: number): Matrix4;

    /**
     * Get matrix as array
     */
    toArray(): number[];

    /**
     * Apply matrix to vector3
     */
    applyToVector3Array(array: number[], offset?: number, length?: number): number[];

    /**
     * Get matrix normal
     */
    getNormalMatrix(): Matrix3;

    /**
     * Get matrix inverse transpose
     */
    getInverseMatrix(): Matrix4;

    /**
     * Extract quaternion from matrix
     */
    extractQuaternion(quaternion: Quaternion): Quaternion;

    /**
     * Check for equality
     */
    equals(matrix: Matrix4): boolean;

    /**
     * Convert to 2D array
     */
    toMatrix2Array(): number[][];
}

// Utility functions for Matrix4
export declare namespace Matrix4 {
    function multiplyMatrices(a: Matrix4, b: Matrix4, target?: Matrix4): Matrix4;
    function invert(m: Matrix4, target?: Matrix4): Matrix4;
    function transpose(m: Matrix4, target?: Matrix4): Matrix4;
    function perspective(left: number, right: number, top: number, bottom: number, near: number, far: number): Matrix4;
    function orthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): Matrix4;
    function lookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4;
}