/**
 * Vector4 Type Definitions
 * 4D vector mathematics
 */

export interface Vector4Tuple {
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * Vector4 - 4D vector implementation
 */
export declare class Vector4 {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x?: number, y?: number, z?: number, w?: number);

    /**
     * Set vector components
     */
    set(x: number, y: number, z: number, w: number): Vector4;

    /**
     * Copy vector from another vector
     */
    copy(source: Vector4): Vector4;

    /**
     * Clone vector
     */
    clone(): Vector4;

    /**
     * Add another vector
     */
    add(vector: Vector4): Vector4;

    /**
     * Add scalar to vector
     */
    addScalar(scalar: number): Vector4;

    /**
     * Add vectors and store result in this vector
     */
    addVectors(a: Vector4, b: Vector4): Vector4;

    /**
     * Subtract another vector
     */
    sub(vector: Vector4): Vector4;

    /**
     * Subtract scalar from vector
     */
    subScalar(scalar: number): Vector4;

    /**
     * Subtract vectors and store result in this vector
     */
    subVectors(a: Vector4, b: Vector4): Vector4;

    /**
     * Multiply by another vector
     */
    multiply(vector: Vector4): Vector4;

    /**
     * Multiply by scalar
     */
    multiplyScalar(scalar: number): Vector4;

    /**
     * Multiply vectors and store result in this vector
     */
    multiplyVectors(a: Vector4, b: Vector4): Vector4;

    /**
     * Divide by another vector
     */
    divide(vector: Vector4): Vector4;

    /**
     * Divide by scalar
     */
    divideScalar(scalar: number): Vector4;

    /**
     * Divide vectors and store result in this vector
     */
    divideVectors(a: Vector4, b: Vector4): Vector4;

    /**
     * Apply min constraint
     */
    min(vector: Vector4): Vector4;

    /**
     * Apply max constraint
     */
    max(vector: Vector4): Vector4;

    /**
     * Clamp vector to min/max range
     */
    clamp(min: Vector4, max: Vector4): Vector4;

    /**
     * Clamp vector to scalar range
     */
    clampScalar(min: number, max: number): Vector4;

    /**
     * Floor values to integers
     */
    floor(): Vector4;

    /**
     * Ceil values to integers
     */
    ceil(): Vector4;

    /**
     * Round values to integers
     */
    round(): Vector4;

    /**
     * Round values towards zero
     */
    roundToZero(): Vector4;

    /**
     * Negate vector
     */
    negate(): Vector4;

    /**
     * Get dot product
     */
    dot(vector: Vector4): number;

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
     * Normalize vector
     */
    normalize(): Vector4;

    /**
     * Set vector length
     */
    setLength(length: number): Vector4;

    /**
     * Lerp towards target vector
     */
    lerp(vector: Vector4, alpha: number): Vector4;

    /**
     * Linear interpolation between vectors
     */
    lerpVectors(v1: Vector4, v2: Vector4, alpha: number): Vector4;

    /**
     * Check if vectors are equal
     */
    equals(vector: Vector4): boolean;

    /**
     * Get array representation
     */
    toArray(): number[];

    /**
     * Get array representation (fixed length)
     */
    toArray4(): [number, number, number, number];

    /**
     * Set from array
     */
    fromArray(array: number[], offset?: number): Vector4;

    /**
     * Get distance to another vector
     */
    distanceTo(vector: Vector4): number;

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(vector: Vector4): number;

    /**
     * Get Manhattan distance to another vector
     */
    distanceToManhattan(vector: Vector4): number;

    /**
     * Check if vector is in range
     */
    inRange(min: Vector4, max: Vector4): boolean;

    /**
     * Set random direction
     */
    setRandom(): Vector4;
}

// Utility functions for Vector4
export declare namespace Vector4 {
    function addVectors(a: Vector4, b: Vector4, target?: Vector4): Vector4;
    function subVectors(a: Vector4, b: Vector4, target?: Vector4): Vector4;
    function multiplyVectors(a: Vector4, b: Vector4, target?: Vector4): Vector4;
    function divideVectors(a: Vector4, b: Vector4, target?: Vector4): Vector4;
    function lerpVectors(v1: Vector4, v2: Vector4, alpha: number, target?: Vector4): Vector4;
}