/**
 * NURBSSurface Type Definitions
 * TypeScript definitions for comprehensive NURBS surface generation
 */

import { Vector2 } from '../core/vector2';
import { Vector3 } from '../core/vector3';
import { Matrix4 } from '../core/matrix4';
import { BufferGeometry } from '../core/buffer-geometry';

export interface NURBSSurfaceOptions {
    uKnots?: number[];
    vKnots?: number[];
    uDegree?: number;
    vDegree?: number;
    weights?: number[][];
}

export interface SurfaceDerivatives {
    [key: string]: Vector3; // Keys like "0_0", "1_0", "0_1", etc.
}

export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

/**
 * NURBSSurface - Comprehensive NURBS surface generation
 */
export declare class NURBSSurface {
    public controlPoints: Vector3[][];
    public uDegree: number;
    public vDegree: number;
    public uKnots: number[];
    public vKnots: number[];
    public weights: number[][];
    public isRational: boolean;
    public boundingBox: BoundingBox;

    constructor(
        controlPoints: Vector3[][], 
        uKnots?: number[], 
        vKnots?: number[], 
        uDegree?: number, 
        vDegree?: number, 
        weights?: number[][]
    );

    // Main evaluation methods
    evaluate(u: number, v: number, derivatives?: number): Vector3 | SurfaceDerivatives;
    
    // Geometric computations
    computeNormal(u: number, v: number): Vector3;
    
    // Tessellation methods
    tessellate(uSegments?: number, vSegments?: number): BufferGeometry;
    tessellateAdaptive(maxError?: number, maxSegments?: number): BufferGeometry;
    
    // Surface manipulation
    trim(uTrims?: number[], vTrims?: number[]): NURBSSurface;
    insertKnot(direction?: 'u' | 'v', knot?: number, multiplicity?: number): NURBSSurface;
    transform(matrix: Matrix4): NURBSSurface;
    
    // Utility methods
    getBoundingBox(): BoundingBox;
    toJSON(): any;
    static fromJSON(data: any): NURBSSurface;
    clone(): NURBSSurface;
    
    // Static factory methods
    static createPlane(width?: number, height?: number, uSegments?: number, vSegments?: number): NURBSSurface;
    static createSphere(radius?: number, uSegments?: number, vSegments?: number): NURBSSurface;
    static createTorus(R?: number, r?: number, uSegments?: number, vSegments?: number): NURBSSurface;
}

/**
 * NURBSTrimmedSurface - Trimmed NURBS surface wrapper
 */
export declare class NURBSTrimmedSurface extends NURBSSurface {
    public baseSurface: NURBSSurface;
    public uRange: [number, number];
    public vRange: [number, number];

    constructor(baseSurface: NURBSSurface, uRange: [number, number], vRange: [number, number]);
}