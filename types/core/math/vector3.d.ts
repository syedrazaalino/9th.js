/**
 * Vector3 Type Definitions
 * 3D vector mathematics
 */

export interface Vector3Tuple {
    x: number;
    y: number;
    z: number;
}

/**
 * Vector3 - 3D vector implementation
 */
export declare class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x?: number, y?: number, z?: number);

    /**
     * Set vector components
     */
    set(x: number, y: number, z: number): Vector3;

    /**
     * Copy vector from another vector
     */
    copy(source: Vector3): Vector3;

    /**
     * Clone vector
     */
    clone(): Vector3;

    /**
     * Add another vector
     */
    add(vector: Vector3): Vector3;

    /**
     * Add scalar to vector
     */
    addScalar(scalar: number): Vector3;

    /**
     * Add vectors and store result in this vector
     */
    addVectors(a: Vector3, b: Vector3): Vector3;

    /**
     * Add scaled vector
     */
    addScaledVector(vector: Vector3, scale: number): Vector3;

    /**
     * Subtract another vector
     */
    sub(vector: Vector3): Vector3;

    /**
     * Subtract scalar from vector
     */
    subScalar(scalar: number): Vector3;

    /**
     * Subtract vectors and store result in this vector
     */
    subVectors(a: Vector3, b: Vector3): Vector3;

    /**
     * Multiply by another vector
     */
    multiply(vector: Vector3): Vector3;

    /**
     * Multiply by scalar
     */
    multiplyScalar(scalar: number): Vector3;

    /**
     * Multiply vectors and store result in this vector
     */
    multiplyVectors(a: Vector3, b: Vector3): Vector3;

    /**
     * Divide by another vector
     */
    divide(vector: Vector3): Vector3;

    /**
     * Divide by scalar
     */
    divideScalar(scalar: number): Vector3;

    /**
     * Divide vectors and store result in this vector
     */
    divideVectors(a: Vector3, b: Vector3): Vector3;

    /**
     * Apply min constraint
     */
    min(vector: Vector3): Vector3;

    /**
     * Apply max constraint
     */
    max(vector: Vector3): Vector3;

    /**
     * Clamp vector to min/max range
     */
    clamp(min: Vector3, max: Vector3): Vector3;

    /**
     * Clamp vector to scalar range
     */
    clampScalar(min: number, max: number): Vector3;

    /**
     * Floor values to integers
     */
    floor(): Vector3;

    /**
     * Ceil values to integers
     */
    ceil(): Vector3;

    /**
     * Round values to integers
     */
    round(): Vector3;

    /**
     * Round values towards zero
     */
    roundToZero(): Vector3;

    /**
     * Negate vector
     */
    negate(): Vector3;

    /**
     * Get dot product
     */
    dot(vector: Vector3): number;

    /**
     * Get cross product
     */
    cross(vector: Vector3): Vector3;

    /**
     * Cross product with stored result
     */
    crossVectors(a: Vector3, b: Vector3): Vector3;

    /**
     * Get length of vector
     */
    length(): number;

    /**
     * Get squared length of vector
     */
    lengthSq(): number;

    /**
     * Get Manhattan length
     */
    lengthManhattan(): number;

    /**
     * Get length to Manhattan
     */
    manhattanLength(): number;

    /**
     * Normalize vector
     */
    normalize(): Vector3;

    /**
     * Set vector length
     */
    setLength(length: number): Vector3;

    /**
     * Lerp towards target vector
     */
    lerp(vector: Vector3, alpha: number): Vector3;

    /**
     * Linear interpolation between vectors
     */
    lerpVectors(v1: Vector3, v2: Vector3, alpha: number): Vector3;

    /**
     * Check if vectors are equal
     */
    equals(vector: Vector3): boolean;

    /**
     * Get array representation
     */
    toArray(): number[];

    /**
     * Get array representation (fixed length)
     */
    toArray3(): [number, number, number];

    /**
     * Set from array
     */
    fromArray(array: number[], offset?: number): Vector3;

    /**
     * Rotate around axis
     */
    rotateAround(axis: Vector3, angle: number): Vector3;

    /**
     * Get distance to another vector
     */
    distanceTo(vector: Vector3): number;

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(vector: Vector3): number;

    /**
     * Get Manhattan distance to another vector
     */
    distanceToManhattan(vector: Vector3): number;

    /**
     * Get Manhattan distance
     */
    manhattanDistanceTo(vector: Vector3): number;

    /**
     * Check if vector is in range
     */
    inRange(min: Vector3, max: Vector3): boolean;

    /**
     * Set random direction
     */
    setRandom(): Vector3;

    /**
     * Set random direction in unit sphere
     */
    randomDirection(): Vector3;

    /**
     * Project onto another vector
     */
    projectOnVector(vector: Vector3): Vector3;

    /**
     * Project onto plane
     */
    projectOnPlane(planeNormal: Vector3): Vector3;

    /**
     * Reflect off normal
     */
    reflect(normal: Vector3): Vector3;

    /**
     * Get angle to another vector
     */
    angleTo(vector: Vector3): number;

    /**
     * Set from spherical coordinates
     */
    setFromSphericalCoords(radius: number, phi: number, theta: number): Vector3;

    /**
     * Set from spherical coordinates (alias)
     */
    setFromSpherical(s: any): Vector3;

    /**
     * Get spherical representation
     */
    getSpherical(): { radius: number; phi: number; theta: number };

    /**
     * Set from cylindrical coordinates
     */
    setFromCylindricalCoords(radius: number, theta: number, y: number): Vector3;

    /**
     * Get cylindrical representation
     */
    getCylindrical(): { radius: number; theta: number; y: number };

    /**
     * Set from matrix column
     */
    setFromMatrixColumn(matrix: any, index: number): Vector3;

    /**
     * Set from matrix position
     */
    setFromMatrixPosition(matrix: any): Vector3;

    /**
     * Get quaternion that rotates this vector to target
     */
    angleToQuaternion(target: Vector3): any;
}

// Utility functions for Vector3
export declare namespace Vector3 {
    function addVectors(a: Vector3, b: Vector3, target?: Vector3): Vector3;
    function subVectors(a: Vector3, b: Vector3, target?: Vector3): Vector3;
    function multiplyVectors(a: Vector3, b: Vector3, target?: Vector3): Vector3;
    function divideVectors(a: Vector3, b: Vector3, target?: Vector3): Vector3;
    function crossVectors(a: Vector3, b: Vector3, target?: Vector3): Vector3;
    function lerpVectors(v1: Vector3, v2: Vector3, alpha: number, target?: Vector3): Vector3;
    function randomDirection(target?: Vector3): Vector3;
}

// Legacy Vector3 interface for backward compatibility
export interface Vector3Like {
    x: number;
    y: number;
    z: number;
}