/**
 * BufferGeometry Type Definitions
 * Geometry data stored in buffers
 */

import { BufferAttribute } from './buffer';
import { Matrix4 } from './math/matrix4';
import { Vector3 } from './math/vector3';
import { Box3 } from './box3';
import { Sphere } from './sphere';

export interface BufferGeometryOptions {
    attributes?: { [name: string]: BufferAttribute };
    indices?: BufferAttribute;
    morphAttributes?: { [name: string]: BufferAttribute[] };
    groups?: Array<{
        start: number;
        count: number;
        materialIndex?: number;
    }>;
    boundingBox?: Box3;
    boundingSphere?: Sphere;
    id?: string;
}

export interface DrawRange {
    start: number;
    count: number;
}

/**
 * BufferGeometry - Geometry data in GPU-friendly format
 */
export declare class BufferGeometry {
    public id: string;
    public uuid: string;
    public name: string;
    public type: string;
    public index: BufferAttribute | null;
    public attributes: { [name: string]: BufferAttribute };
    public morphAttributes: { [name: string]: BufferAttribute[] };
    public groups: Array<{
        start: number;
        count: number;
        materialIndex?: number;
    }>;
    public boundingBox: Box3 | null;
    public boundingSphere: Sphere | null;
    public drawRange: DrawRange;
    public isBufferGeometry: boolean;

    constructor();

    /**
     * Get attribute by name
     */
    getAttribute(name: string): BufferAttribute | undefined;

    /**
     * Set attribute
     */
    setAttribute(name: string, attribute: BufferAttribute): BufferGeometry;

    /**
     * Delete attribute
     */
    deleteAttribute(name: string): BufferGeometry;

    /**
     * Has attribute
     */
    hasAttribute(name: string): boolean;

    /**
     * Set index
     */
    setIndex(index: BufferAttribute | null): BufferGeometry;

    /**
     * Get index
     */
    getIndex(): BufferAttribute | null;

    /**
     * Add group
     */
    addGroup(start: number, count: number, materialIndex?: number): void;

    /**
     * Clear groups
     */
    clearGroups(): void;

    /**
     * Set draw range
     */
    setDrawRange(start: number, count: number): void;

    /**
     * Apply 4x4 matrix to vertices
     */
    applyMatrix4(matrix: Matrix4): BufferGeometry;

    /**
     * Apply matrix to normal vectors
     */
    applyNormalMatrix(matrix: Matrix4): BufferGeometry;

    /**
     * Transform vertices by 4x4 matrix
     */
    transformVertices(matrix: Matrix4): BufferGeometry;

    /**
     * Get position attribute
     */
    getPosition(): BufferAttribute | undefined;

    /**
     * Get normal attribute
     */
    getNormal(): BufferAttribute | undefined;

    /**
     * Get UV attribute
     */
    getUV(): BufferAttribute | undefined;

    /**
     * Get color attribute
     */
    getColor(): BufferAttribute | undefined;

    /**
     * Compute bounding box
     */
    computeBoundingBox(): void;

    /**
     * Compute bounding sphere
     */
    computeBoundingSphere(): void;

    /**
     * Compute vertex normals
     */
    computeVertexNormals(): void;

    /**
     * Merge geometries
     */
    merge(bufferGeometry: BufferGeometry, offset?: number): BufferGeometry;

    /**
     * Set UV from another geometry
     */
    setUV(uv1: BufferAttribute, uv2?: BufferAttribute): BufferGeometry;

    /**
     * Set color
     */
    setColor(color: BufferAttribute): BufferGeometry;

    /**
     * Check if geometry has colors
     */
    hasColors(): boolean;

    /**
     * Get face count
     */
    getFaceCount(): number;

    /**
     * Get vertex count
     */
    getVertexCount(): number;

    /**
     * Get index count
     */
    getIndexCount(): number;

    /**
     * Update bounds
     */
    updateBounds(): void;

    /**
     * Normalize normals
     */
    normalizeNormals(): BufferGeometry;

    /**
     * To non-indexed geometry
     */
    toNonIndexed(): BufferGeometry;

    /**
     * To indexed geometry
     */
    toIndexed(): BufferGeometry;

    /**
     * Convert to triangles
     */
    toTriangles(): BufferGeometry;

    /**
     * Generate UV coordinates
     */
    generateUVs(): BufferGeometry;

    /**
     * Copy geometry
     */
    copy(source: BufferGeometry): BufferGeometry;

    /**
     * Clone geometry
     */
    clone(): BufferGeometry;

    /**
     * Dispose geometry
     */
    dispose(): void;
}

/**
 * Sphere - Bounding sphere for geometry
 */
export declare class Sphere {
    public center: Vector3;
    public radius: number;

    constructor(center?: Vector3, radius?: number);

    set(center: Vector3, radius: number): Sphere;
    setFromPoints(points: Vector3[], center?: Vector3): Sphere;
    setFromBoundingBox(box: Box3): Sphere;
    copy(sphere: Sphere): Sphere;
    clone(): Sphere;
    empty(): boolean;
    containsPoint(point: Vector3): boolean;
    distanceToPoint(point: Vector3): number;
    intersectsSphere(sphere: Sphere): boolean;
    intersectsBox(box: Box3): boolean;
    intersectsPlane(plane: any): boolean;
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    getBoundingBox(target?: Box3): Box3;
    translate(x: number, y: number, z: number): Sphere;
    equals(sphere: Sphere): boolean;
    toArray(): number[];
    fromArray(array: number[], offset?: number): Sphere;
}

/**
 * Box3 - 3D bounding box
 */
export declare class Box3 {
    public min: Vector3;
    public max: Vector3;

    constructor(min?: Vector3, max?: Vector3);

    set(min: Vector3, max: Vector3): Box3;
    setFromArray(array: number[]): Box3;
    setFromCenterAndSize(center: Vector3, size: Vector3): Box3;
    setFromObject(object: any): Box3;
    setFromPoints(points: Vector3[]): Box3;
    clone(): Box3;
    copy(box: Box3): Box3;
    makeEmpty(): Box3;
    isEmpty(): boolean;
    getCenter(target?: Vector3): Vector3;
    getSize(target?: Vector3): Vector3;
    getParameter(index: number): Vector3;
    containsPoint(point: Vector3): boolean;
    containsBox(box: Box3): boolean;
    getParameter(point: Vector3): Vector3;
    intersectsBox(box: Box3): boolean;
    intersectsSphere(sphere: Sphere): boolean;
    intersectsPlane(plane: any): boolean;
    clampPoint(point: Vector3, target?: Vector3): Vector3;
    distanceToPoint(point: Vector3): number;
    getBoundingSphere(target?: Sphere): Sphere;
    intersect(box: Box3): Box3;
    union(box: Box3): Box3;
    applyMatrix4(matrix: Matrix4): Box3;
    translate(offset: Vector3): Box3;
    equals(box: Box3): boolean;
    isEqual(box: Box3): boolean;
    toArray(): number[];
    toJSON(): any;
    fromArray(array: number[], offset?: number): Box3;
}