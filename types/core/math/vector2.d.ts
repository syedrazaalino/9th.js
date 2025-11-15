/**
 * Vector2 Type Definitions
 * 2D vector mathematics
 */

export interface Vector2Tuple {
    x: number;
    y: number;
}

/**
 * Vector2 - 2D vector implementation
 */
export declare class Vector2 {
    public x: number;
    public y: number;

    constructor(x?: number, y?: number);

    /**
     * Set vector components
     */
    set(x: number, y: number): Vector2;

    /**
     * Copy vector from another vector
     */
    copy(source: Vector2): Vector2;

    /**
     * Clone vector
     */
    clone(): Vector2;

    /**
     * Add another vector
     */
    add(vector: Vector2): Vector2;

    /**
     * Add scalar to vector
     */
    addScalar(scalar: number): Vector2;

    /**
     * Add vectors and store result in this vector
     */
    addVectors(a: Vector2, b: Vector2): Vector2;

    /**
     * Subtract another vector
     */
    sub(vector: Vector2): Vector2;

    /**
     * Subtract scalar from vector
     */
    subScalar(scalar: number): Vector2;

    /**
     * Subtract vectors and store result in this vector
     */
    subVectors(a: Vector2, b: Vector2): Vector2;

    /**
     * Multiply by another vector
     */
    multiply(vector: Vector2): Vector2;

    /**
     * Multiply by scalar
     */
    multiplyScalar(scalar: number): Vector2;

    /**
     * Multiply vectors and store result in this vector
     */
    multiplyVectors(a: Vector2, b: Vector2): Vector2;

    /**
     * Divide by another vector
     */
    divide(vector: Vector2): Vector2;

    /**
     * Divide by scalar
     */
    divideScalar(scalar: number): Vector2;

    /**
     * Divide vectors and store result in this vector
     */
    divideVectors(a: Vector2, b: Vector2): Vector2;

    /**
     * Apply min constraint
     */
    min(vector: Vector2): Vector2;

    /**
     * Apply max constraint
     */
    max(vector: Vector2): Vector2;

    /**
     * Clamp vector to min/max range
     */
    clamp(min: Vector2, max: Vector2): Vector2;

    /**
     * Clamp vector to scalar range
     */
    clampScalar(min: number, max: number): Vector2;

    /**
     * Floor values to integers
     */
    floor(): Vector2;

    /**
     * Ceil values to integers
     */
    ceil(): Vector2;

    /**
     * Round values to integers
     */
    round(): Vector2;

    /**
     * Round values towards zero
     */
    roundToZero(): Vector2;

    /**
     * Negate vector
     */
    negate(): Vector2;

    /**
     * Get dot product
     */
    dot(vector: Vector2): number;

    /**
     * Get cross product (2D)
     */
    cross(vector: Vector2): number;

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
    normalize(): Vector2;

    /**
     * Set vector length
     */
    setLength(length: number): Vector2;

    /**
     * Lerp towards target vector
     */
    lerp(vector: Vector2, alpha: number): Vector2;

    /**
     * Linear interpolation between vectors
     */
    lerpVectors(v1: Vector2, v2: Vector2, alpha: number): Vector2;

    /**
     * Check if vectors are equal
     */
    equals(vector: Vector2): boolean;

    /**
     * Get array representation
     */
    toArray(): number[];

    /**
     * Get array representation (alias)
     */
    toArray2(): [number, number];

    /**
     * Set from array
     */
    fromArray(array: number[], offset?: number): Vector2;

    /**
     * Rotate around origin
     */
    rotateAround(center: Vector2, angle: number): Vector2;

    /**
     * Get distance to another vector
     */
    distanceTo(vector: Vector2): number;

    /**
     * Get squared distance to another vector
     */
    distanceToSquared(vector: Vector2): number;

    /**
     * Get Manhattan distance to another vector
     */
    distanceToManhattan(vector: Vector2): number;

    /**
     * Check if vector is in range
     */
    inRange(min: Vector2, max: Vector2): boolean;

    /**
     * Set random direction
     */
    setRandom(): Vector2;
}

// Utility functions for Vector2
export declare namespace Vector2 {
    function addVectors(a: Vector2, b: Vector2, target?: Vector2): Vector2;
    function subVectors(a: Vector2, b: Vector2, target?: Vector2): Vector2;
    function multiplyVectors(a: Vector2, b: Vector2, target?: Vector2): Vector2;
    function divideVectors(a: Vector2, b: Vector2, target?: Vector2): Vector2;
    function lerpVectors(v1: Vector2, v2: Vector2, alpha: number, target?: Vector2): Vector2;
}