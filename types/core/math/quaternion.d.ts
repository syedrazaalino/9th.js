/**
 * Quaternion Type Definitions
 * Quaternion mathematics for 3D rotations
 */

/**
 * Quaternion - 4D quaternion for 3D rotations
 */
export declare class Quaternion {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x?: number, y?: number, z?: number, w?: number);

    /**
     * Set quaternion components
     */
    set(x: number, y: number, z: number, w: number): Quaternion;

    /**
     * Copy quaternion from another quaternion
     */
    copy(source: Quaternion): Quaternion;

    /**
     * Clone quaternion
     */
    clone(): Quaternion;

    /**
     * Set from Euler angles
     */
    setFromEuler(euler: any): Quaternion;

    /**
     * Set from rotation matrix
     */
    setFromRotationMatrix(m: any): Quaternion;

    /**
     * Set from axis and angle
     */
    setFromAxisAngle(axis: any, angle: number): Quaternion;

    /**
     * Set from unit vectors
     */
    setFromUnitVectors(from: any, to: any): Quaternion;

    /**
     * Calculate quaternion from arc between vectors
     */
    setFromArcBetweenVectors(from: any, to: any): Quaternion;

    /**
     * Get axis and angle
     */
    getAxisAngle(): { axis: any; angle: number };

    /**
     * Get Euler angles
     */
    getEuler(): any;

    /**
     * Multiply quaternions
     */
    multiply(q: Quaternion): Quaternion;

    /**
     * Multiply quaternions and store result
     */
    multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion;

    /**
     * Pre-multiply by quaternion
     */
    premultiply(q: Quaternion): Quaternion;

    /**
     * Multiply quaternion by vector (rotate vector)
     */
    multiplyVector3(v: any): any;

    /**
     * Rotate vector by quaternion
     */
    rotateVector3(v: any): any;

    /**
     * Invert quaternion
     */
    invert(): Quaternion;

    /**
     * Conjugate quaternion
     */
    conjugate(): Quaternion;

    /**
     * Get dot product
     */
    dot(q: Quaternion): number;

    /**
     * Get length
     */
    length(): number;

    /**
     * Get squared length
     */
    lengthSq(): number;

    /**
     * Normalize quaternion
     */
    normalize(): Quaternion;

    /**
     * Set quaternion to identity
     */
    identity(): Quaternion;

    /**
     * Spherical linear interpolation
     */
    slerp(qb: Quaternion, t: number): Quaternion;

    /**
     * Linear interpolation
     */
    lerp(q: Quaternion, t: number): Quaternion;

    /**
     * Linear interpolation between quaternions
     */
    lerpQuaternions(a: Quaternion, b: Quaternion, t: number): Quaternion;

    /**
     * Check if quaternions are equal
     */
    equals(q: Quaternion): boolean;

    /**
     * Set from array
     */
    fromArray(array: number[], offset?: number): Quaternion;

    /**
     * Get quaternion as array
     */
    toArray(): number[];

    /**
     * Set random quaternion
     */
    setRandom(): Quaternion;

    /**
     * Get matrix representation
     */
    toMatrix4(): any;

    /**
     * Get matrix3 representation
     */
    toMatrix3(): any;

    /**
     * Get quaternion angle
     */
    getAngle(): number;

    /**
     * Get quaternion axis
     */
    getAxis(): any;

    /**
     * Check if quaternion is identity
     */
    isIdentity(): boolean;

    /**
     * Exp map
     */
    expMap(): Quaternion;

    /**
     * Log map
     */
    logMap(): Quaternion;
}

// Utility functions for Quaternion
export declare namespace Quaternion {
    function multiplyQuaternions(a: Quaternion, b: Quaternion, target?: Quaternion): Quaternion;
    function slerp(a: Quaternion, b: Quaternion, t: number, target?: Quaternion): Quaternion;
    function lerpQuaternions(a: Quaternion, b: Quaternion, t: number, target?: Quaternion): Quaternion;
    function setFromEuler(euler: any, target?: Quaternion): Quaternion;
    function setFromRotationMatrix(matrix: any, target?: Quaternion): Quaternion;
    function setFromAxisAngle(axis: any, angle: number, target?: Quaternion): Quaternion;
    function setFromUnitVectors(from: any, to: any, target?: Quaternion): Quaternion;
}